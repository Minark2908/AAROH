from sqlalchemy.orm import Session
from typing import Optional
from models import SystemLog

def log_activity(
    db: Session,
    user_id: int,
    action: str,
    target: Optional[str] = None,
    target_user_id: Optional[int] = None,
    details: Optional[str] = None,
    level: str = "INFO",
    commit: bool = False
):
    """
    Standard utility to log system activities.
    
    Levels: INFO, WARNING, ERROR
    """
    log = SystemLog(
        user_id=user_id,
        action=action,
        target=target,
        target_user_id=target_user_id,
        details=details,
        level=level
    )
    db.add(log)
    try:
        if commit:
            db.commit()
        else:
            db.flush() 
    except Exception as exc:
        import sys
        print(f"[WARN] log_activity failed for action={action}: {exc}", file=sys.stderr)
