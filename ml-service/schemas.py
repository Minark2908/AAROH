from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List, Any
from datetime import datetime
import re

class UserBase(BaseModel):
    name: str
    phone: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: EmailStr):
        # Keep canonical form for uniqueness checks and logins.
        return str(v).strip().lower()

    @field_validator("phone")
    @classmethod
    def normalize_phone(cls, v: str):
        # Normalize typical input like "+91 99999 99999" or "99999-99999".
        raw = (v or "").strip()
        # Keep leading '+' if present, strip other separators.
        if raw.startswith("+"):
            return "+" + re.sub(r"[^\d]", "", raw[1:])
        return re.sub(r"[^\d]", "", raw)
    
    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str):
        from security_config import validate_password_strength
        is_valid, error_msg = validate_password_strength(v)
        if not is_valid:
            raise ValueError(error_msg)
        return v

class UserResponse(UserBase):
    id: int
    role: str
    is_disabled: bool = False
    created_at: datetime
    class Config:
        from_attributes = True

# Fixed Token schema — role, name and user_id are included in the login response
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    name: str
    user_id: int

# Admin-specific user view with extra fields
class UserAdminView(BaseModel):
    id: int
    name: str
    phone: str
    email: str
    role: str
    is_disabled: bool
    created_at: datetime
    detection_count: int = 0
    class Config:
        from_attributes = True

# Farmer login (JSON body)
class FarmerLoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def normalize_identifier(cls, v: str):
        # Frontend label is "Phone Number / Email" but payload key is "email".
        # Normalize to improve deterministic matching.
        return (v or "").strip().lower()

# Master admin login (JSON body, not OAuth form)
class AdminLoginRequest(BaseModel):
    username: str
    password: str

class ResetPasswordRequest(BaseModel):
    email: str
    new_password: str

    @field_validator("email")
    @classmethod
    def normalize_identifier(cls, v: str):
        return (v or "").strip().lower()

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str):
        from security_config import validate_password_strength
        is_valid, error_msg = validate_password_strength(v)
        if not is_valid:
            raise ValueError(error_msg)
        return v

class FlagUserRequest(BaseModel):
    note: str

class SettingsBase(BaseModel):
    preferred_language: str
    theme: str

class FarmBase(BaseModel):
    land_area: float
    primary_crop: str
    secondary_crop: Optional[str] = None
    irrigation_type: Optional[str] = None

class DetectionBase(BaseModel):
    pest_name: str
    confidence: float
    severity: str
    risk_index: float
    risk_level: str
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    soil_moisture: Optional[float] = None
    light_intensity: Optional[float] = None
    conditions: Optional[str] = None
    treatment_override: Optional[str] = None

class DetectionResponse(DetectionBase):
    id: int
    user_id: int
    timestamp: datetime
    image_url: Optional[str] = None
    class Config:
        from_attributes = True

class TreatmentOverrideRequest(BaseModel):
    treatment_override: str

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    type: str
    message: str
    is_read: bool
    created_at: datetime
    class Config:
        from_attributes = True

class FieldHealthHistoryBase(BaseModel):
    ndvi_value: float
    health_status: str
    recommendation: Optional[str] = None
    problem: Optional[str] = None
    soil_moisture: Optional[float] = None
    humidity: Optional[float] = None
    confidence: Optional[float] = None

class FieldHealthHistoryResponse(FieldHealthHistoryBase):
    id: int
    field_id: int
    recorded_at: datetime
    class Config:
        from_attributes = True

class FieldBase(BaseModel):
    name: str
    crop_type: str
    coordinates: Any
    area_acres: Optional[float] = None
    growth_stage: Optional[str] = None
    progress_percentage: Optional[int] = None

class FieldResponse(FieldBase):
    id: int
    user_id: int
    created_at: datetime
    history: List[FieldHealthHistoryResponse] = []
    class Config:
        from_attributes = True

class SystemLogResponse(BaseModel):
    id: int
    user_id: int
    target: Optional[str] = None
    target_user_id: Optional[int] = None
    action: str
    details: Optional[str] = None
    level: str
    timestamp: datetime
    class Config:
        from_attributes = True

class SystemSettingResponse(BaseModel):
    id: int
    key: str
    value: str
    description: Optional[str] = None
    updated_at: datetime
    class Config:
        from_attributes = True

class SystemSettingUpdate(BaseModel):
    key: str
    value: str

class PaginatedSystemLogResponse(BaseModel):
    items: List[SystemLogResponse]
    total: int
    page: int
    pages: int
    limit: int

