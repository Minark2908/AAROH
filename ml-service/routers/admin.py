from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from database import get_db
from models import User, Detection, SystemLog, SystemSettings
from schemas import (
    UserAdminView,
    UserResponse,
    DetectionResponse,
    TreatmentOverrideRequest,
    FlagUserRequest,
    SystemLogResponse,
    PaginatedSystemLogResponse,
    SystemSettingResponse,
    SystemSettingUpdate,
)
from services.auth_service import require_admin
from utils.logger import log_activity

router = APIRouter(prefix="/api/admin", tags=["admin"])

def _get_user_or_404(user_id: int, db: Session) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def _log_admin_action(db: Session, admin_id: int, action: str, target: Optional[str] = None, target_user_id: Optional[int] = None, details: Optional[str] = None, level: str = "INFO"):
    log_activity(db, admin_id, action, target=target, target_user_id=target_user_id, details=details, level=level)

@router.get("/stats")
def get_stats(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    """Return real platform stats for the admin dashboard."""
    total_users = db.query(func.count(User.id)).scalar() or 0
    admin_count = db.query(func.count(User.id)).filter(User.role == "admin").scalar() or 0
    disabled_count = db.query(func.count(User.id)).filter(User.is_disabled == True).scalar() or 0
    total_detections = db.query(func.count(Detection.id)).scalar() or 0

    # Average AI confidence across all detections
    avg_conf = db.query(func.avg(Detection.confidence)).scalar()
    ai_accuracy = round(float(avg_conf or 0) * 100, 1)

    # High-risk detection count
    high_risk = db.query(func.count(Detection.id)).filter(Detection.risk_level == "High Risk").scalar() or 0

    return {
        "total_users": total_users,
        "admin_count": admin_count,
        "disabled_count": disabled_count,
        "regular_user_count": total_users - admin_count,
        "total_detections": total_detections,
        "high_risk_detections": high_risk,
        "ai_accuracy": ai_accuracy,
    }

@router.get("/users")
def get_users(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    """Get all users with their detection counts."""
    users = db.query(User).all()
    result = []
    for u in users:
        detection_count = (
            db.query(func.count(Detection.id))
            .filter(Detection.user_id == u.id)
            .scalar()
            or 0
        )
        result.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "phone": u.phone,
            "role": u.role,
            "is_disabled": getattr(u, "is_disabled", False),
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "detection_count": detection_count,
        })
    return result

@router.get("/user/{user_id}/history", response_model=List[DetectionResponse])
def get_user_history(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Get pest detection history for a specific user."""
    _get_user_or_404(user_id, db)
    return (
        db.query(Detection)
        .filter(Detection.user_id == user_id)
        .order_by(Detection.timestamp.desc())
        .all()
    )

@router.delete("/user/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    """Delete a user (Admin only)."""
    user = _get_user_or_404(user_id, db)
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot delete yourself")
    user_name = user.name
    db.delete(user)
    _log_admin_action(db, admin.id, "DELETE_USER", target_user_id=user_id, details=f"Deleted user {user_name}", level="WARNING")
    db.commit()
    return {"message": f"User {user_id} deleted successfully"}

@router.patch("/user/{user_id}/promote")
def promote_user(user_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    """Promote a user to admin role."""
    user = _get_user_or_404(user_id, db)
    if user.role == "admin":
        raise HTTPException(status_code=400, detail="User is already an admin")
    user.role = "admin"
    _log_admin_action(db, admin.id, "PROMOTE_USER", target_user_id=user_id, details=f"Promoted {user.name} to admin")
    db.commit()
    return {"message": f"User {user.name} promoted to admin successfully", "role": "admin"}

@router.patch("/user/{user_id}/demote")
def demote_user(user_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    """Demote an admin back to regular user."""
    user = _get_user_or_404(user_id, db)
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot demote yourself")
    if user.role == "user":
        raise HTTPException(status_code=400, detail="User is already a regular user")
    user.role = "user"
    _log_admin_action(db, admin.id, "DEMOTE_USER", target_user_id=user_id, details=f"Demoted {user.name} to user")
    db.commit()
    return {"message": f"User {user.name} demoted to user successfully", "role": "user"}

@router.patch("/user/{user_id}/disable")
def disable_user(user_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    """Disable a user account — they cannot log in or use the API."""
    user = _get_user_or_404(user_id, db)
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot disable yourself")
    user.is_disabled = True
    _log_admin_action(db, admin.id, "DISABLE_USER", target_user_id=user_id, details=f"Disabled user {user.name}", level="WARNING")
    db.commit()
    return {"message": f"User {user.name} has been disabled"}

@router.patch("/user/{user_id}/enable")
def enable_user(user_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    """Re-enable a previously disabled user account."""
    user = _get_user_or_404(user_id, db)
    user.is_disabled = False
    _log_admin_action(db, admin.id, "ENABLE_USER", target_user_id=user_id, details=f"Re-enabled user {user.name}")
    db.commit()
    return {"message": f"User {user.name} has been re-enabled"}

@router.patch("/user/{user_id}/flag")
def flag_user(user_id: int, request: FlagUserRequest, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    """Flag a user for suspicious activity."""
    user = _get_user_or_404(user_id, db)
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot flag yourself")
    
    _log_admin_action(db, admin.id, "FLAG_USER", target_user_id=user_id, details=f"Flagged: {request.note}", level="WARNING")
    
    return {"message": f"User {user.name} has been flagged"}

@router.get("/predictions", response_model=List[DetectionResponse])
def get_all_predictions(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    """Get all predictions (Admin only)."""
    return db.query(Detection).order_by(Detection.timestamp.desc()).all()

@router.post("/treatment/{prediction_id}")
def override_treatment(
    prediction_id: int,
    request: TreatmentOverrideRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Override AI treatment for a specific detection (Admin only)."""
    prediction = db.query(Detection).filter(Detection.id == prediction_id).first()
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    prediction.treatment_override = request.treatment_override
    _log_admin_action(db, admin.id, "TREATMENT_OVERRIDE", details=f"Overrode treatment for detection {prediction.id}")
    db.commit()
    return {"message": "Treatment overridden successfully"}

@router.get("/logs", response_model=PaginatedSystemLogResponse)
def get_system_logs(
    search: Optional[str] = Query(None),
    level: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    page: int = Query(1, ge=1),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    query = db.query(SystemLog)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (SystemLog.action.ilike(search_filter)) |
            (SystemLog.details.ilike(search_filter)) |
            (SystemLog.target.ilike(search_filter))
        )
    
    if level:
        query = query.filter(SystemLog.level == level.upper())
    
    if action:
        query = query.filter(SystemLog.action == action.upper())
        
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date)
            query = query.filter(SystemLog.timestamp >= start_dt)
        except ValueError:
            pass

    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date)
            query = query.filter(SystemLog.timestamp <= end_dt)
        except ValueError:
            pass

    total = query.count()
    pages = (total + limit - 1) // limit
    offset = (page - 1) * limit
    
    items = query.order_by(SystemLog.timestamp.desc()).offset(offset).limit(limit).all()
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "pages": pages,
        "limit": limit
    }

@router.get("/settings", response_model=List[SystemSettingResponse])
def get_system_settings(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    defaults = [
        {"key": "moisture_alert_threshold", "value": "30", "description": "Soil moisture percentage below which alerting happens."},
        {"key": "max_daily_reports", "value": "5", "description": "Maximum number of reports a standard user can generate per day."},
        {"key": "enable_ai_advisory", "value": "true", "description": "Globally enable/disable AI recommendations."},
    ]
    settings = db.query(SystemSettings).all()
    if not settings:
        for d in defaults:
            db.add(SystemSettings(**d))
        db.commit()
        settings = db.query(SystemSettings).all()
        
    return settings

@router.put("/settings")
def update_system_settings(updates: List[SystemSettingUpdate], db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    for update in updates:
        setting = db.query(SystemSettings).filter(SystemSettings.key == update.key).first()
        if setting:
            setting.value = update.value
        else:
            new_setting = SystemSettings(key=update.key, value=update.value, description="Custom setting")
            db.add(new_setting)
    
    _log_admin_action(db, admin.id, "UPDATE_SETTINGS", details=f"Updated settings: {[u.key for u in updates]}")
    db.commit()
    return {"message": "Settings updated successfully"}

@router.get("/activity")
def get_activity_timeline(limit: int = 20, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    logs = db.query(SystemLog).order_by(SystemLog.timestamp.desc()).limit(limit).all()
    detections = db.query(Detection).filter(Detection.risk_level == "High Risk").order_by(Detection.timestamp.desc()).limit(limit).all()
    
    timeline = []
    
    for l in logs:
        log_user = db.query(User).filter(User.id == l.user_id).first()
        u_name = log_user.name if log_user else "System"
        timeline.append({
            "id": f"log_{l.id}",
            "type": "log",
            "action": l.action,
            "details": l.details,
            "user": u_name,
            "level": l.level,
            "target": l.target,
            "timestamp": l.timestamp.isoformat() if l.timestamp else None
        })
    
    for d in detections:
        user = db.query(User).filter(User.id == d.user_id).first()
        user_name = user.name if user else "Unknown"
        timeline.append({
            "id": f"det_{d.id}",
            "type": "alert",
            "action": "HIGH_RISK_DETECTION",
            "details": f"High risk {d.pest_name} detected by {user_name}",
            "user": user_name,
            "level": "WARNING",
            "timestamp": d.timestamp.isoformat() if d.timestamp else None
        })
        
    timeline.sort(key=lambda x: x["timestamp"] or "", reverse=True)
    return timeline[:limit]
