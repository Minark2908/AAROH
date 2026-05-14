import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session, selectinload

from database import get_db
from models import User

# Ensure `.env` is loaded even when importing this module directly (e.g. routers/import checks).
# `app.py` also calls load_dotenv(), but that doesn't help if this module is imported before `app.py`.
load_dotenv()

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def _get_secret_key() -> str:
    """
    Production must provide SECRET_KEY. In development, we allow a fallback so the app
    doesn't fail as an opaque "Network Error" from the frontend.
    """
    secret = (os.getenv("SECRET_KEY") or "").strip()
    if secret:
        return secret
    environment = (os.getenv("ENVIRONMENT") or "development").strip().lower()
    if environment == "production":
        raise RuntimeError("SECRET_KEY environment variable is not set. Refusing to start in production.")
    # Dev-only fallback: stable across a single process lifetime (ok for local dev).
    print("[Auth] WARNING: SECRET_KEY not set; using an ephemeral dev key. Set SECRET_KEY for stable sessions.")
    return os.urandom(32).hex()


_SECRET_KEY = _get_secret_key()


def verify_password(plain_password: str | None, hashed_password: str | None) -> bool:
    """
    Stable bcrypt verification using the `bcrypt` package directly.
    Accepts standard bcrypt hashes like "$2b$..." (passlib-generated hashes are compatible).
    """
    if not plain_password or not hashed_password:
        return False
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        # Treat any hash parsing/verification failure as invalid password (prevents 500s).
        return False


def get_password_hash(password: str) -> str:
    """
    Stable bcrypt hashing using the `bcrypt` package directly.
    """
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = (
        datetime.now(timezone.utc) + expires_delta
        if expires_delta
        else datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, _SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, _SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    # Avoid logging full tokens; even prefix logging is unnecessary in production.
    payload = decode_access_token(token)
    user_id: str | None = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")

    try:
        user_id_int = int(user_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")

    # Use eager loading to avoid N+1 queries for farms and settings
    user = (
        db.query(User)
        .filter(User.id == user_id_int)
        .options(selectinload(User.farms), selectinload(User.settings))
        .first()
    )
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    if getattr(user, "is_disabled", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been disabled. Please contact an administrator.",
        )

    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have sufficient permissions to access this resource",
        )
    return current_user
