from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from database import get_db
import models as db_models
from services.auth_service import get_current_user


router = APIRouter(prefix="", tags=["notifications"])


class CreateNotificationRequest(BaseModel):
    type: str
    message: str
    level: str | None = None  # info | warning | critical
    meta: dict | None = None

    @field_validator("type")
    @classmethod
    def _type(cls, v: str):
        v = (v or "").strip()
        if not v:
            raise ValueError("type is required")
        return v

    @field_validator("message")
    @classmethod
    def _message(cls, v: str):
        v = (v or "").strip()
        if not v:
            raise ValueError("message is required")
        return v


@router.get("/notifications")
def list_notifications(
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user),
):
    rows = (
        db.query(db_models.Notification)
        .filter(db_models.Notification.user_id == current_user.id)
        .order_by(db_models.Notification.created_at.desc())
        .limit(200)
        .all()
    )
    return rows


@router.post("/notifications")
def create_notification(
    request: CreateNotificationRequest,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user),
):
    lvl = (request.level or "info").strip().lower()
    if lvl not in ("info", "warning", "critical"):
        lvl = "info"

    n = db_models.Notification(
        user_id=current_user.id,
        type=request.type.strip(),
        level=lvl,
        message=request.message.strip(),
        meta=request.meta,
    )
    db.add(n)
    db.commit()
    db.refresh(n)
    return n


@router.put("/notifications/{notif_id}/read")
def mark_read(
    notif_id: int,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user),
):
    row = (
        db.query(db_models.Notification)
        .filter(db_models.Notification.id == notif_id, db_models.Notification.user_id == current_user.id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Notification not found")
    row.is_read = True
    db.commit()
    db.refresh(row)
    return row

