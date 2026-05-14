import time
from fastapi import HTTPException, status, Request

# Form: {"ip_or_email": {"attempts": int, "lock_until": float}}
FAILED_ATTEMPTS = {}
MAX_ATTEMPTS = 5
LOCK_DURATION_SECONDS = 15 * 60  # 15 minutes

def prune_old_entries():
    """Removes expired lock entries to prevent memory leaks."""
    now = time.time()
    to_delete = [
        k for k, v in FAILED_ATTEMPTS.items() 
        if now > v["lock_until"] + (2 * LOCK_DURATION_SECONDS)
    ]
    for k in to_delete:
        del FAILED_ATTEMPTS[k]

def check_rate_limit(key: str):
    # Proactively prune every time we check (lightweight)
    if len(FAILED_ATTEMPTS) > 1000:
        prune_old_entries()

    record = FAILED_ATTEMPTS.get(key)
    if record:
        if time.time() < record["lock_until"]:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many failed login attempts. Account temporarily locked for 15 minutes."
            )
        elif time.time() > record["lock_until"] and record["attempts"] >= MAX_ATTEMPTS:
            # Lock has expired, reset attempts
            FAILED_ATTEMPTS[key] = {"attempts": 0, "lock_until": 0}

def record_failed_attempt(key: str):
    record = FAILED_ATTEMPTS.get(key, {"attempts": 0, "lock_until": 0})
    record["attempts"] += 1
    
    if record["attempts"] >= MAX_ATTEMPTS:
        record["lock_until"] = time.time() + LOCK_DURATION_SECONDS
        
    FAILED_ATTEMPTS[key] = record

def reset_attempts(key: str):
    if key in FAILED_ATTEMPTS:
        del FAILED_ATTEMPTS[key]

def get_client_ip(request: Request):
    return request.client.host if request.client else "unknown"
