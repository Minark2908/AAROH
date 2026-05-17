"""
AAROH Security Configuration Module
Implements security headers, CORS, and other protective measures
"""

import os
from fastapi import Request
from fastapi.responses import Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.cors import CORSMiddleware
import logging

logger = logging.getLogger("aaroh.security")

# ============================================================================
# SECURITY HEADERS MIDDLEWARE
# ============================================================================

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Adds security headers to all responses:
    - Content-Security-Policy (CSP)
    - Strict-Transport-Security (HSTS)
    - X-Content-Type-Options
    - X-Frame-Options
    - X-XSS-Protection
    - Referrer-Policy
    """

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # OWASP Recommended Security Headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Strict-Transport-Security (HSTS)
        # Tells browsers to only communicate via HTTPS (max-age: 1 year)
        if os.getenv("ENVIRONMENT") == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        
        # Content-Security-Policy (CSP)
        # Prevents inline scripts and restricts script sources
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "  # Adjust based on your needs
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self'; "
            "connect-src 'self' https:; "
            "frame-ancestors 'none'; "
            "base-uri 'self'; "
            "form-action 'self'"
        )
        response.headers["Content-Security-Policy"] = csp
        
        # Additional headers
        response.headers["Permissions-Policy"] = (
            "accelerometer=(), "
            "camera=(), "
            "geolocation=(), "
            "gyroscope=(), "
            "magnetometer=(), "
            "microphone=(), "
            "payment=(), "
            "usb=()"
        )
        
        return response

# ============================================================================
# CORS CONFIGURATION
# ============================================================================

def _parse_extra_cors_origins() -> list[str]:
    """Comma-separated optional origins from CORS_EXTRA_ORIGINS (any environment)."""
    raw = os.getenv("CORS_EXTRA_ORIGINS", "")
    return [o.strip() for o in raw.split(",") if o.strip()]

def _development_localhost_origins() -> list[str]:
    """
    Common Next.js dev servers: 3000–3010 on localhost / 127.0.0.1 / ::1 (http + https).
    When port 3000 is taken, Next uses 3001+; previously only :3000 was allowed → browser CORS / failed fetch.
    """
    origins: list[str] = []
    ports = range(3000, 3020)
    hosts = ("localhost", "127.0.0.1", "[::1]")
    for host in hosts:
        for port in ports:
            origins.append(f"http://{host}:{port}")
            origins.append(f"https://{host}:{port}")
    origins.extend(_parse_extra_cors_origins())
    seen: set[str] = set()
    unique: list[str] = []
    for o in origins:
        if o not in seen:
            seen.add(o)
            unique.append(o)
    return unique

def get_cors_config():
    """
    Returns CORS configuration based on environment.
    Development: localhost (multiple ports) + CORS_EXTRA_ORIGINS
    Production: FRONTEND_URL + CORS_EXTRA_ORIGINS
    """
    environment = os.getenv("ENVIRONMENT", "development")
    
    if environment == "production":
        allowed_origins = []
        primary = os.getenv("FRONTEND_URL", "https://aaroh.example.com").strip()
        if primary:
            allowed_origins.append(primary)
        allowed_origins.extend(_parse_extra_cors_origins())
        seen: set[str] = set()
        unique: list[str] = []
        for o in allowed_origins:
            if o not in seen:
                seen.add(o)
                unique.append(o)
        allowed_origins = unique
    else:
        allowed_origins = _development_localhost_origins()
    
    return {
        "allow_origins": allowed_origins,
        "allow_credentials": True,
        "allow_methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        "allow_headers": [
            "Authorization",
            "Content-Type",
            "Accept",
            "Accept-Language",
            "X-CSRF-Token",
            "X-Requested-With",
        ],
        "max_age": 600,  # 10 minutes
        "expose_headers": ["X-Total-Count", "X-Page-Count"],
    }

# ============================================================================
# REQUEST SIZE LIMITS
# ============================================================================

DEFAULT_MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10MB
AVATAR_MAX_SIZE = 5 * 1024 * 1024  # 5MB

# Allowed image MIME types
ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
}

# Image file magic numbers (signatures)
IMAGE_MAGIC_NUMBERS = {
    b'\xFF\xD8\xFF': 'jpeg',      # JPEG
    b'\x89PNG\r\n\x1a\n': 'png',  # PNG
    b'GIF8': 'gif',               # GIF
    b'RIFF': 'webp',              # WEBP (simplified check)
}

def validate_image_file(file_bytes: bytes, content_type: str) -> tuple[bool, str]:
    """
    Validates image file by checking magic numbers and content type.
    
    Args:
        file_bytes: Raw file bytes
        content_type: MIME type from request
        
    Returns:
        (is_valid, error_message)
    """
    if not file_bytes:
        return False, "Empty file"
    
    if content_type not in ALLOWED_IMAGE_TYPES:
        return False, f"Invalid image type: {content_type}"
    
    is_valid_magic = False
    for magic, file_type in IMAGE_MAGIC_NUMBERS.items():
        if file_bytes.startswith(magic):
            is_valid_magic = True
            break
    
    if not is_valid_magic:
        return False, "File does not match expected image format (invalid magic number)"
    
    return True, ""

# ============================================================================
# SECURITY LOGGING
# ============================================================================

class SecurityEventLogger:
    """Logs security-relevant events"""
    
    @staticmethod
    def log_failed_auth(email: str, ip: str, reason: str):
        logger.warning(f"Failed authentication for {email} from {ip}: {reason}")
    
    @staticmethod
    def log_admin_action(admin_id: int, action: str, details: str):
        logger.info(f"Admin action by user {admin_id}: {action} - {details}")
    
    @staticmethod
    def log_file_upload(user_id: int, filename: str, file_size: int, file_type: str):
        logger.info(f"File upload by user {user_id}: {filename} ({file_size} bytes, {file_type})")
    
    @staticmethod
    def log_suspicious_request(ip: str, endpoint: str, reason: str):
        logger.warning(f"Suspicious request from {ip} to {endpoint}: {reason}")
    
    @staticmethod
    def log_rate_limit_exceeded(identifier: str, endpoint: str):
        logger.warning(f"Rate limit exceeded for {identifier} on {endpoint}")

# ============================================================================
# PASSWORD VALIDATION
# ============================================================================

import re

def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validates password strength according to NIST guidelines.
    
    Requirements:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    
    Args:
        password: The password to validate
        
    Returns:
        (is_valid, error_message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r'\d', password):
        return False, "Password must contain at least one digit"
    
    if not re.search(r'[!@#$%^&*()_+\-=\[\]{};:,.<>?]', password):
        return False, "Password must contain at least one special character"
    
    weak_patterns = ['1234', 'qwerty', 'password', 'admin', 'aaroh']
    for pattern in weak_patterns:
        if pattern.lower() in password.lower():
            return False, f"Password contains common pattern: {pattern}"
    
    return True, ""

# ============================================================================
# API RATE LIMITING CONFIGURATION
# ============================================================================

# Global rate limits
RATE_LIMIT_CONFIG = {
    "auth_login": {"max_attempts": 5, "window_seconds": 900},  # 5 attempts per 15 min
    "admin_login": {"max_attempts": 3, "window_seconds": 900},  # 3 attempts per 15 min
    "api_general": {"max_requests": 100, "window_seconds": 60},  # 100 req/min per user
    "api_upload": {"max_requests": 10, "window_seconds": 60},  # 10 uploads/min per user
}
