import logging
import os
import secrets
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from database import get_db
from models import User, Settings
from schemas import UserCreate, UserResponse, Token, FarmerLoginRequest, AdminLoginRequest
from services.auth_service import get_password_hash, verify_password, create_access_token
from services.rate_limiter import check_rate_limit, record_failed_attempt, reset_attempts, get_client_ip
from security_config import SecurityEventLogger
from services.advanced_rate_limiter import SlidingWindowRateLimiter

logger = logging.getLogger("aaroh.auth")

# Rate limiters
_register_limiter = SlidingWindowRateLimiter(max_requests=10, window_seconds=3600)  # 10 per hour per IP
_login_limiter = SlidingWindowRateLimiter(max_requests=5, window_seconds=300)  # 5 per 5 min per user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, request: Request, db: Session = Depends(get_db)):
    # Rate limit by IP address
    ip_addr = get_client_ip(request)
    if not _register_limiter.is_allowed(ip_addr):
        reset_time = _register_limiter.get_reset_time(ip_addr)
        raise HTTPException(
            status_code=429,
            detail=f"Registration rate limit exceeded. Try again in {reset_time}s"
        )
    
    # UserCreate validators normalize email/phone.
    email = (user.email or "").strip().lower()
    phone = (user.phone or "").strip()

    db_user = db.query(User).filter(User.email == email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    db_phone = db.query(User).filter(User.phone == phone).first()
    if db_phone:
        raise HTTPException(status_code=400, detail="Phone already registered")

    try:
        hashed_password = get_password_hash(user.password)
    except Exception:
        # Avoid leaking internals; keep API contract stable.
        raise HTTPException(status_code=500, detail="Registration failed. Please try again later.")
    new_user = User(
        name=user.name,
        email=email,
        phone=phone,
        password_hash=hashed_password
    )
    db.add(new_user)
    db.flush()  # Get the user ID without committing
    # Pre-create settings to prevent lazy initialization issues on first access
    default_settings = Settings(
        user_id=new_user.id,
        preferred_language="en",
        theme="light"
    )
    db.add(default_settings)
    try:
        db.commit()
        db.refresh(new_user)
    except IntegrityError:
        db.rollback()
        # Race-safe: keep the original API behavior (400) for uniqueness conflicts.
        # We avoid brittle DB-specific parsing; re-check both keys to decide message.
        if db.query(User).filter(User.email == email).first():
            raise HTTPException(status_code=400, detail="Email already registered")
        if db.query(User).filter(User.phone == phone).first():
            raise HTTPException(status_code=400, detail="Phone already registered")
        raise HTTPException(status_code=400, detail="Email or phone already registered")
    except Exception:
        db.rollback()
        # Handles rare races/DB issues without crashing the process.
        raise HTTPException(status_code=500, detail="Registration failed. Please try again later.")

    from utils.logger import log_activity
    log_activity(db, new_user.id, "REGISTER", details=f"New user registered: {new_user.email}", level="INFO", commit=True)

    return new_user

@router.post("/login", response_model=Token)
def login(request: Request, body: FarmerLoginRequest, db: Session = Depends(get_db)):
    ip_addr = get_client_ip(request)
    ident = (body.email or "").strip()
    redacted = ident[:3] + "***" if len(ident) >= 3 else "***"
    logger.debug("Login attempt from %s for: %s", ip_addr, redacted)
    
    identifier = f"{ip_addr}_{(body.email or '').strip().lower()}"

    check_rate_limit(identifier)

    # Backward compatible: frontend sends key "email" but UI allows phone/email.
    login_id = (body.email or "").strip().lower()
    # Phone normalization: keep digits and optional leading +
    phone_norm = "".join(ch for ch in login_id if ch.isdigit() or ch == "+")

    user = (
        db.query(User)
        .filter(or_(User.email == login_id, User.phone == phone_norm, User.phone == login_id))
        .first()
    )
    if not user:
        SecurityEventLogger.log_failed_auth(login_id, ip_addr, "User not found")
        record_failed_attempt(identifier)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    try:
        ok = verify_password(body.password, user.password_hash)
    except Exception:
        ok = False
    if not ok:
        SecurityEventLogger.log_failed_auth(login_id, ip_addr, "Invalid password")
        record_failed_attempt(identifier)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    if getattr(user, "is_disabled", False):
        SecurityEventLogger.log_failed_auth(login_id, ip_addr, "Account disabled")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been disabled. Please contact an administrator."
        )

    reset_attempts(identifier)

    from utils.logger import log_activity
    log_activity(db, user.id, "LOGIN", details=f"User logged in from {ip_addr}", level="INFO", commit=True)
    SecurityEventLogger.log_admin_action(user.id, "LOGIN", f"Logged in from {ip_addr}")

    try:
        access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    except Exception:
        raise HTTPException(status_code=500, detail="Login failed. Please try again later.")
    response = {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "name": user.name,
        "user_id": user.id,
    }
    logger.debug("Login successful for user_id=%s role=%s", user.id, user.role)
    return response


@router.post("/admin-login", response_model=Token)
def admin_login(request: Request, body: AdminLoginRequest, db: Session = Depends(get_db)):
    ip_addr = get_client_ip(request)
    logger.debug("Admin login attempt from %s", ip_addr)
    
    """
    Master admin login — credentials validated against env vars only.
    Never stores or exposes ADMIN_USERNAME / ADMIN_PASSWORD to the frontend.
    """
    ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "")
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "")

    identifier = f"{ip_addr}_admin_login"

    # Rate limit admin login to prevent brute-force
    check_rate_limit(identifier)

    if not ADMIN_USERNAME or not ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Admin login is not configured on this server."
        )

    if not secrets.compare_digest(body.username, ADMIN_USERNAME) or not secrets.compare_digest(body.password, ADMIN_PASSWORD):
        SecurityEventLogger.log_failed_auth(body.username, ip_addr, "Invalid admin credentials")
        record_failed_attempt(identifier)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials"
        )

    reset_attempts(identifier)

    # Find or create the master admin user record in DB
    admin_user = db.query(User).filter(User.email == "master@aaroh.admin").first()
    if not admin_user:
        admin_user = User(
            name="Master Admin",
            email="master@aaroh.admin",
            phone="0000000000",
            password_hash=get_password_hash(ADMIN_PASSWORD),
            role="admin",
        )
        db.add(admin_user)
        try:
            db.commit()
            db.refresh(admin_user)
        except Exception:
            db.rollback()
            raise HTTPException(status_code=500, detail="Admin login failed. Please try again later.")
    elif admin_user.role != "admin":
        # Ensure the master record always has admin role
        admin_user.role = "admin"
        try:
            db.commit()
        except Exception:
            db.rollback()
            raise HTTPException(status_code=500, detail="Admin login failed. Please try again later.")

    from utils.logger import log_activity
    log_activity(db, admin_user.id, "ADMIN_LOGIN", details=f"Admin logged in from {ip_addr}", level="INFO", commit=True)
    SecurityEventLogger.log_admin_action(admin_user.id, "ADMIN_LOGIN", f"Admin login from {ip_addr}")

    try:
        access_token = create_access_token(data={"sub": str(admin_user.id), "role": "admin"})
    except Exception:
        raise HTTPException(status_code=500, detail="Admin login failed. Please try again later.")
    response = {
        "access_token": access_token,
        "token_type": "bearer",
        "role": "admin",
        "name": admin_user.name,
        "user_id": admin_user.id,
    }
    logger.debug("Admin login successful for user_id=%s", admin_user.id)
    return response
