from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    avatar_url = Column(String, nullable=True)
    role = Column(String, default="user", nullable=False)
    is_disabled = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    farms = relationship("Farm", back_populates="owner", cascade="all, delete-orphan")
    detections = relationship("Detection", back_populates="owner", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="owner", cascade="all, delete-orphan")
    settings = relationship("Settings", back_populates="owner", uselist=False, cascade="all, delete-orphan")
    fields = relationship("Field", back_populates="owner", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="owner", cascade="all, delete-orphan")

class Settings(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    preferred_language = Column(String, default="en")
    theme = Column(String, default="light")

    owner = relationship("User", back_populates="settings")

class Farm(Base):
    __tablename__ = "farms"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    land_area = Column(Float, nullable=False)
    primary_crop = Column(String, nullable=False)
    secondary_crop = Column(String, nullable=True)
    irrigation_type = Column(String, nullable=True)
    farm_location = Column(String, nullable=True)
    crop_growth_stage = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    owner = relationship("User", back_populates="farms")

class Detection(Base):
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    image_url = Column(String, nullable=True)
    pest_name = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    severity = Column(String, nullable=False)
    risk_index = Column(Float, nullable=False)
    risk_level = Column(String, nullable=False)
    temperature = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    soil_moisture = Column(Float, nullable=True)
    light_intensity = Column(Float, nullable=True)
    conditions = Column(String, nullable=True)
    # Persisted advisory + measures used for PDF exports & analytics
    ai_advisory = Column(JSON, nullable=True)
    preventive_measures = Column(JSON, nullable=True)  # list[str] (stored as JSON)
    treatment_override = Column(String, nullable=True)
    status = Column(String, nullable=False, default="Pending")
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="detections")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False)  # 'ALERT', 'SYSTEM', 'DETECTION'
    level = Column(String, nullable=False, default="info")  # info | warning | critical
    message = Column(String, nullable=False)
    is_read = Column(Boolean, default=False)
    meta = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="notifications")

class Field(Base):
    __tablename__ = "fields"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    crop_type = Column(String, nullable=False)
    coordinates = Column(JSON, nullable=False) # list of [lat, lng] arrays
    area_acres = Column(Float, nullable=True)
    growth_stage = Column(String, nullable=True)
    progress_percentage = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="fields")
    history = relationship("FieldHealthHistory", back_populates="field", cascade="all, delete-orphan")

class FieldHealthHistory(Base):
    __tablename__ = "field_health_history"

    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(Integer, ForeignKey("fields.id", ondelete="CASCADE"), nullable=False)
    ndvi_value = Column(Float, nullable=False)
    health_status = Column(String, nullable=False) # Healthy, Moderate, Critical
    recommendation = Column(String, nullable=True)
    problem = Column(String, nullable=True)
    soil_moisture = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    confidence = Column(Float, nullable=True)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())

    field = relationship("Field", back_populates="history")


class SensorData(Base):
    __tablename__ = "sensor_data"

    id = Column(Integer, primary_key=True, index=True)
    sensor_id = Column(String, index=True, nullable=False)
    soil_moisture = Column(Float, nullable=False)
    temperature = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    light_intensity = Column(Float, nullable=False)
    status = Column(String, nullable=False, default="online")  # online | offline | warning
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)


class SensorAlert(Base):
    __tablename__ = "sensor_alerts"

    id = Column(Integer, primary_key=True, index=True)
    sensor_id = Column(String, index=True, nullable=False)
    alert_type = Column(String, nullable=False)  # soil_moisture_low | temperature_high | sensor_offline
    level = Column(String, nullable=False, default="warning")  # warning | critical
    message = Column(String, nullable=False)
    meta = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    name = Column(String, nullable=False)
    category = Column(String, nullable=False, default="General")
    format = Column(String, nullable=False, default="csv")  # csv | pdf (optional)

    file_size_bytes = Column(Integer, nullable=True)
    meta = Column(JSON, nullable=True)   # parameters used to generate (date range, etc.)
    payload = Column(JSON, nullable=True)  # denormalized report data for export

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    owner = relationship("User", back_populates="reports", lazy="joined")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String, nullable=False)  # system | user | assistant
    content = Column(String, nullable=False)
    meta = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    owner = relationship("User")

class SystemLog(Base):
    __tablename__ = "system_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    target = Column(String, nullable=True) # Description/Name of target
    target_user_id = Column(Integer, nullable=True, index=True) # ID of target user if applicable
    action = Column(String, nullable=False, index=True)
    details = Column(String, nullable=True)
    level = Column(String, nullable=False, default="INFO") # INFO, WARNING, ERROR
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    user = relationship("User", foreign_keys=[user_id])

class SystemSettings(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, nullable=False, index=True)
    value = Column(String, nullable=False)
    description = Column(String, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

