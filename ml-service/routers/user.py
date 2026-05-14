import os
import uuid
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy.orm import Session

from database import get_db
import models as db_models
from services.auth_service import get_current_user, verify_password, get_password_hash

router = APIRouter(tags=["user"])

class UserProfileResponse(BaseModel):
    id: int
    name: str
    phone: str
    email: EmailStr
    preferred_language: str
    avatar_url: str | None = None

class UpdateUserProfileRequest(BaseModel):
    name: str | None = None
    phone: str | None = None
    email: EmailStr | None = None
    language: str | None = None

    @field_validator("phone")
    @classmethod
    def _phone_basic(cls, v: str | None):
        if v is None:
            return v
        cleaned = "".join(ch for ch in v if ch.isdigit())
        if len(cleaned) < 10 or len(cleaned) > 15:
            raise ValueError("Phone number must be 10–15 digits.")
        return v

@router.get("/user/profile", response_model=UserProfileResponse)
def get_profile(
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user),
):
    preferred_language = current_user.settings.preferred_language if current_user.settings else "en"
    return UserProfileResponse(
        id=int(current_user.id),
        name=current_user.name,
        phone=current_user.phone,
        email=current_user.email,
        preferred_language=preferred_language,
        avatar_url=getattr(current_user, "avatar_url", None),
    )

@router.put("/user/profile", response_model=UserProfileResponse)
def update_profile(
    req: UpdateUserProfileRequest,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user),
):
    # Uniqueness checks for email/phone
    if req.email is not None and req.email != current_user.email:
        exists = db.query(db_models.User).filter(db_models.User.email == req.email).first()
        if exists:
            raise HTTPException(status_code=400, detail={"message": "Email already in use", "code": "EMAIL_IN_USE"})
        current_user.email = str(req.email)

    if req.phone is not None and req.phone != current_user.phone:
        exists = db.query(db_models.User).filter(db_models.User.phone == req.phone).first()
        if exists:
            raise HTTPException(status_code=400, detail={"message": "Phone already in use", "code": "PHONE_IN_USE"})
        current_user.phone = req.phone

    if req.name is not None:
        name = (req.name or "").strip()
        if len(name) < 2:
            raise HTTPException(status_code=400, detail={"message": "Name is too short", "code": "NAME_INVALID"})
        current_user.name = name

    if req.language is not None:
        lang = (req.language or "").strip() or "en"
        if not current_user.settings:
            current_user.settings = db_models.Settings(user_id=current_user.id, preferred_language=lang)
        else:
            current_user.settings.preferred_language = lang

    db.commit()
    db.refresh(current_user)

    preferred_language = current_user.settings.preferred_language if current_user.settings else "en"
    return UserProfileResponse(
        id=int(current_user.id),
        name=current_user.name,
        phone=current_user.phone,
        email=current_user.email,
        preferred_language=preferred_language,
        avatar_url=getattr(current_user, "avatar_url", None),
    )

class UserSettingsResponse(BaseModel):
    preferred_language: str
    theme: str | None = None

class UpdateUserSettingsRequest(BaseModel):
    preferred_language: str | None = None
    theme: str | None = None

@router.get("/user/settings", response_model=UserSettingsResponse)
def get_user_settings(
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user),
):
    if not current_user.settings:
        current_user.settings = db_models.Settings(user_id=current_user.id, preferred_language="en", theme="light")
        db.add(current_user.settings)
        db.commit()
        db.refresh(current_user)
    return UserSettingsResponse(
        preferred_language=current_user.settings.preferred_language or "en",
        theme=current_user.settings.theme,
    )

@router.put("/user/settings", response_model=UserSettingsResponse)
def update_user_settings(
    req: UpdateUserSettingsRequest,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user),
):
    if not current_user.settings:
        current_user.settings = db_models.Settings(user_id=current_user.id, preferred_language="en", theme="light")
        db.add(current_user.settings)

    if req.preferred_language is not None:
        lang = (req.preferred_language or "").strip().lower() or "en"
        if lang not in ("en", "hi", "gu"):
            lang = "en"
        current_user.settings.preferred_language = lang

    if req.theme is not None:
        theme = (req.theme or "").strip().lower() or "light"
        if theme not in ("light", "dark"):
            theme = "light"
        current_user.settings.theme = theme

    db.commit()
    db.refresh(current_user)
    return UserSettingsResponse(
        preferred_language=current_user.settings.preferred_language or "en",
        theme=current_user.settings.theme,
    )

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def _pw_strength(cls, v: str):
        from security_config import validate_password_strength
        is_valid, error_msg = validate_password_strength(v)
        if not is_valid:
            raise ValueError(error_msg)
        return v

@router.put("/user/change-password")
def change_password(
    req: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user),
):
    if not verify_password(req.old_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Old password is incorrect", "code": "OLD_PASSWORD_INVALID"},
        )
    current_user.password_hash = get_password_hash(req.new_password)
    db.commit()
    return {"message": "Password updated successfully"}

class AvatarUploadResponse(BaseModel):
    avatar_url: str
    storage: Literal["cloudinary", "local"]

def _upload_to_cloudinary(file: UploadFile) -> str:
    # Cloudinary optional integration (preferred for production)
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    api_key = os.getenv("CLOUDINARY_API_KEY")
    api_secret = os.getenv("CLOUDINARY_API_SECRET")
    if not (cloud_name and api_key and api_secret):
        raise RuntimeError("Cloudinary env vars not configured.")

    try:
        import cloudinary
        import cloudinary.uploader
    except Exception as exc:  # pragma: no cover
        raise RuntimeError("Cloudinary package is not installed.") from exc

    cloudinary.config(cloud_name=cloud_name, api_key=api_key, api_secret=api_secret, secure=True)
    res = cloudinary.uploader.upload(file.file, folder="aaroh/avatars", resource_type="image")
    url = res.get("secure_url") or res.get("url")
    if not url:
        raise RuntimeError("Cloudinary upload failed.")
    return str(url)

@router.post("/user/avatar", response_model=AvatarUploadResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user),
):
    from security_config import (
        AVATAR_MAX_SIZE,
        validate_image_file,
        SecurityEventLogger,
    )
    
    # Validate file size first
    content = await file.read(AVATAR_MAX_SIZE + 1)
    if len(content) > AVATAR_MAX_SIZE:
        raise HTTPException(
            status_code=413,
            detail={
                "message": f"Avatar file too large. Maximum size is 5MB",
                "code": "FILE_TOO_LARGE"
            }
        )
    
    # Validate MIME type header
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Please upload an image file",
                "code": "INVALID_FILE"
            }
        )
    
    # Validate file using magic numbers
    is_valid, error_msg = validate_image_file(content, file.content_type)
    if not is_valid:
        SecurityEventLogger.log_suspicious_request(
            str(current_user.id),
            "/user/avatar",
            f"Invalid avatar upload attempt: {error_msg}"
        )
        raise HTTPException(
            status_code=400,
            detail={
                "message": error_msg,
                "code": "INVALID_FILE"
            }
        )
    
    SecurityEventLogger.log_file_upload(
        current_user.id,
        file.filename or "avatar",
        len(content),
        file.content_type
    )

    # Try cloud storage first; fallback to local (still production-safe behind a CDN/reverse proxy)
    try:
        url = _upload_to_cloudinary(file)
        storage: Literal["cloudinary", "local"] = "cloudinary"
    except Exception:
        from app import UPLOAD_DIR  # local static mount already configured

        ext = ".jpg"
        if file.filename and "." in file.filename:
            candidate = os.path.splitext(file.filename)[1].lower()
            if candidate in [".jpg", ".jpeg", ".png", ".webp"]:
                ext = candidate
        name = f"avatar_{current_user.id}_{uuid.uuid4().hex}{ext}"
        out_path = os.path.join(UPLOAD_DIR, name)
        try:
            with open(out_path, "wb") as f:
                f.write(content)
        except Exception:
            raise HTTPException(status_code=500, detail={"message": "Failed to store avatar", "code": "AVATAR_STORE_FAILED"})
        url = f"/uploads/{name}"
        storage = "local"

    current_user.avatar_url = url
    db.commit()
    return AvatarUploadResponse(avatar_url=url, storage=storage)

