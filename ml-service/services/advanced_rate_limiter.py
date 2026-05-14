"""
Advanced Rate Limiting Module
Implements Redis-compatible in-memory rate limiting with sliding windows
"""

import time
from fastapi import HTTPException, status, Request
from typing import Dict, Tuple
from collections import defaultdict
import logging

logger = logging.getLogger("aaroh.ratelimit")

# ============================================================================
# SLIDING WINDOW RATE LIMITER
# ============================================================================

class SlidingWindowRateLimiter:
    """
    Implements sliding window rate limiting.
    Uses in-memory storage; replace with Redis for distributed systems.
    """
    
    def __init__(self, max_requests: int, window_seconds: int):
        """
        Initialize rate limiter.
        
        Args:
            max_requests: Maximum requests allowed in the window
            window_seconds: Time window size in seconds
        """
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: Dict[str, list] = defaultdict(list)
    
    def is_allowed(self, identifier: str) -> bool:
        """
        Check if request is allowed for the identifier.
        
        Args:
            identifier: Unique identifier (e.g., "user_123" or "ip_192.168.1.1")
            
        Returns:
            True if allowed, False if rate limit exceeded
        """
        now = time.time()
        window_start = now - self.window_seconds
        
        request_times = self.requests[identifier]
        
        # Remove old requests outside the window
        request_times[:] = [t for t in request_times if t > window_start]
        
        if len(request_times) >= self.max_requests:
            return False
        
        request_times.append(now)
        
        # Cleanup old entries to prevent memory leaks
        if len(self.requests) > 10000:
            self._cleanup()
        
        return True
    
    def get_remaining(self, identifier: str) -> int:
        """Get remaining requests for identifier"""
        now = time.time()
        window_start = now - self.window_seconds
        request_times = [t for t in self.requests.get(identifier, []) if t > window_start]
        return max(0, self.max_requests - len(request_times))
    
    def get_reset_time(self, identifier: str) -> int:
        """Get seconds until rate limit resets"""
        request_times = self.requests.get(identifier, [])
        if not request_times:
            return 0
        oldest = min(request_times)
        reset_time = int(oldest + self.window_seconds - time.time())
        return max(0, reset_time)
    
    def _cleanup(self):
        """Remove stale identifier entries"""
        now = time.time()
        window_start = now - self.window_seconds
        
        to_remove = []
        for identifier, times in self.requests.items():
            active_times = [t for t in times if t > window_start]
            if not active_times:
                to_remove.append(identifier)
        
        for identifier in to_remove:
            del self.requests[identifier]
        
        logger.debug(f"Rate limiter cleanup: removed {len(to_remove)} stale entries")

# ============================================================================
# GLOBAL RATE LIMITER INSTANCES
# ============================================================================

# Rate limiters for different endpoints
auth_limiter = SlidingWindowRateLimiter(max_requests=5, window_seconds=900)  # 5 req per 15 min
admin_limiter = SlidingWindowRateLimiter(max_requests=3, window_seconds=900)  # 3 req per 15 min
api_limiter = SlidingWindowRateLimiter(max_requests=100, window_seconds=60)  # 100 req per min
upload_limiter = SlidingWindowRateLimiter(max_requests=10, window_seconds=60)  # 10 uploads per min

# ============================================================================
# RATE LIMIT MIDDLEWARE & UTILITIES
# ============================================================================

def get_rate_limit_key(request: Request, user_id: str = None) -> str:
    """
    Generate rate limit key from request and optional user.
    Uses IP + user ID for authenticated requests, IP only for anonymous.
    """
    ip = request.client.host if request.client else "unknown"
    
    if user_id:
        return f"user_{user_id}"
    else:
        return f"ip_{ip}"

def check_rate_limit(identifier: str, limiter: SlidingWindowRateLimiter, endpoint: str = "api"):
    """
    Check if request is allowed.
    
    Args:
        identifier: Unique identifier for rate limiting
        limiter: Rate limiter instance
        endpoint: Endpoint name for logging
        
    Raises:
        HTTPException: 429 Too Many Requests if limit exceeded
    """
    if not limiter.is_allowed(identifier):
        reset_time = limiter.get_reset_time(identifier)
        logger.warning(f"Rate limit exceeded for {identifier} on {endpoint}")
        
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "message": "Too many requests. Please try again later.",
                "retry_after": reset_time,
                "code": "RATE_LIMIT_EXCEEDED"
            },
            headers={"Retry-After": str(reset_time)}
        )

def get_rate_limit_headers(identifier: str, limiter: SlidingWindowRateLimiter) -> dict:
    """
    Get rate limit headers for response.
    
    Returns:
        Dictionary with X-RateLimit-* headers
    """
    return {
        "X-RateLimit-Limit": str(limiter.max_requests),
        "X-RateLimit-Remaining": str(limiter.get_remaining(identifier)),
        "X-RateLimit-Reset": str(int(time.time()) + limiter.get_reset_time(identifier)),
    }

# ============================================================================
# DECORATOR FOR ROUTE-LEVEL RATE LIMITING
# ============================================================================

def rate_limit(limiter: SlidingWindowRateLimiter, use_user_id: bool = False):
    """
    Decorator to apply rate limiting to FastAPI routes.
    
    Args:
        limiter: SlidingWindowRateLimiter instance
        use_user_id: If True, use authenticated user ID; if False, use IP
        
    Example:
        @app.post("/api/send-email")
        @rate_limit(email_limiter, use_user_id=True)
        async def send_email(current_user: User = Depends(get_current_user)):
            ...
    """
    def decorator(func):
        async def wrapper(request: Request, *args, **kwargs):
            user_id = None
            if use_user_id and "current_user" in kwargs:
                user_id = str(kwargs["current_user"].id)
            
            identifier = get_rate_limit_key(request, user_id)
            endpoint = f"{request.method} {request.url.path}"
            check_rate_limit(identifier, limiter, endpoint)
            
            return await func(request, *args, **kwargs) if hasattr(func, '__await__') else func(request, *args, **kwargs)
        
        return wrapper
    return decorator
