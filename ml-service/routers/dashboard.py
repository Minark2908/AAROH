from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Farm, Settings, Notification, Detection
from services.auth_service import get_current_user
from services.iot_service import get_sensor_data
from datetime import datetime, timezone, timedelta
import hashlib
import json
import logging
import httpx
from sqlalchemy import desc, func
import models as db_models
from pydantic import BaseModel, field_validator

logger = logging.getLogger("aaroh.dashboard")

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

# Simple in-memory weather cache with TTL
_weather_cache = {}
_weather_cache_ttl = 3600  # Cache for 1 hour

async def _fetch_weather_cached(lat: float | None, lon: float | None) -> dict | None:
    """Fetch weather with in-memory caching to reduce external API calls."""
    latitude = lat if lat is not None else 22.3039
    longitude = lon if lon is not None else 70.8022
    
    cache_key = f"{latitude:.4f}_{longitude:.4f}"
    now = datetime.now(timezone.utc)
    
    if cache_key in _weather_cache:
        cached_data, cached_time = _weather_cache[cache_key]
        if (now - cached_time).total_seconds() < _weather_cache_ttl:
            return cached_data
    
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            r = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": latitude,
                    "longitude": longitude,
                    "daily": "precipitation_probability_max",
                    "timezone": "auto",
                },
            )
            r.raise_for_status()
            data = r.json() or {}
            daily = data.get("daily") or {}
            
            # Cache the result
            _weather_cache[cache_key] = (daily, now)
            return daily
    except Exception:
        if cache_key in _weather_cache:
            return _weather_cache[cache_key][0]
        return None

async def _fetch_weather(lat: float | None, lon: float | None) -> dict | None:
    """Legacy wrapper - now uses cached version."""
    return await _fetch_weather_cached(lat, lon)

def _safe_pct(v) -> float | None:
    if v is None:
        return None
    try:
        if isinstance(v, str):
            v = v.strip().replace("%", "")
        return float(v)
    except Exception:
        return None

@router.get("")
async def get_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Unified dashboard aggregator.

    Combines:
    - crop health (from latest detections / risk index)
    - soil moisture (from latest sensor reading)
    - active alerts (unread notifications)
    - next rain (from Open-Meteo)
    - 30d performance series (soil moisture + crop health)
    """
    # --- Active alerts / notifications ---
    unread_count = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id, Notification.is_read.is_(False))
        .count()
    )

    # --- Latest IoT reading ---
    latest_sensor = db.query(db_models.SensorData).order_by(desc(db_models.SensorData.timestamp)).first()
    soil_moisture_pct = float(latest_sensor.soil_moisture) if latest_sensor else None

    # --- Latest detection -> crop health approximation ---
    latest_det = (
        db.query(Detection)
        .filter(Detection.user_id == current_user.id)
        .order_by(Detection.timestamp.desc())
        .first()
    )
    crop_health_pct = None
    if latest_det and getattr(latest_det, "risk_index", None) is not None:
        try:
            # Risk index is 0..100 (higher = worse). Dashboard wants "health" (higher = better).
            crop_health_pct = max(0.0, min(100.0, 100.0 - float(latest_det.risk_index)))
        except Exception:
            crop_health_pct = None

    # --- Weather -> next rain ---
    farm = current_user.farms[0] if current_user.farms else None
    daily = await _fetch_weather(getattr(farm, "latitude", None), getattr(farm, "longitude", None))
    next_rain = None
    if daily:
        times = daily.get("time") or []
        probs = daily.get("precipitation_probability_max") or []
        best_idx = None
        best_prob = -1.0
        for i in range(min(len(times), len(probs))):
            p = _safe_pct(probs[i])
            if p is None:
                continue
            if p > best_prob:
                best_prob = p
                best_idx = i
        if best_idx is not None:
            raw_day = str(times[best_idx])
            try:
                d = datetime.strptime(raw_day, "%Y-%m-%d").date()
                today = datetime.now(timezone.utc).date()
                delta = (d - today).days
                if delta == 0:
                    day_label = "Today"
                elif delta == 1:
                    day_label = "Tomorrow"
                else:
                    day_label = d.strftime("%a")
            except Exception:
                day_label = raw_day
            next_rain = {"day": day_label, "probability_pct": float(best_prob)}

    # --- 30d series from DB ---
    end = datetime.now(timezone.utc)
    start = end - timedelta(days=30)

    # Soil moisture daily avg (best-effort)
    soil_daily = (
        db.query(
            func.date(db_models.SensorData.timestamp).label("d"),
            func.avg(db_models.SensorData.soil_moisture).label("soil"),
        )
        .filter(db_models.SensorData.timestamp >= start)
        .group_by(func.date(db_models.SensorData.timestamp))
        .order_by(func.date(db_models.SensorData.timestamp).asc())
        .all()
    )
    soil_by_date = {str(r.d): float(r.soil) for r in soil_daily if r.d is not None and r.soil is not None}

    # Detections daily health avg (100-risk)
    det_daily = (
        db.query(
            func.date(Detection.timestamp).label("d"),
            func.avg(Detection.risk_index).label("risk"),
        )
        .filter(Detection.user_id == current_user.id, Detection.timestamp >= start)
        .group_by(func.date(Detection.timestamp))
        .order_by(func.date(Detection.timestamp).asc())
        .all()
    )
    health_by_date = {}
    for r in det_daily:
        if r.d is None or r.risk is None:
            continue
        try:
            health_by_date[str(r.d)] = max(0.0, min(100.0, 100.0 - float(r.risk)))
        except Exception:
            pass

    series = []
    for i in range(30, -1, -1):
        day = (end - timedelta(days=i)).date().isoformat()
        series.append(
            {
                "date": day,
                "crop_health_pct": health_by_date.get(day),
                "soil_moisture_pct": soil_by_date.get(day),
            }
        )

    return {
        "metrics": {
            "crop_health_pct": crop_health_pct,
            "soil_moisture_pct": soil_moisture_pct,
            "active_alerts": int(unread_count),
            "next_rain": next_rain,
        },
        "performance_30d": series,
        "last_updated_utc": datetime.now(timezone.utc).isoformat(),
    }

@router.get("/settings")
def get_user_settings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user_data = {
        "name": current_user.name,
        "phone": current_user.phone,
        "email": current_user.email,
        "preferred_language": current_user.settings.preferred_language if current_user.settings else "en",
    }
    
    farm_data = None
    if current_user.farms and len(current_user.farms) > 0:
        farm = current_user.farms[0]
        farm_data = {
            "land_area": farm.land_area,
            "primary_crop": farm.primary_crop,
            "secondary_crop": farm.secondary_crop,
            "irrigation_type": farm.irrigation_type,
            "farm_location": getattr(farm, "farm_location", None),
            "crop_growth_stage": getattr(farm, "crop_growth_stage", None),
        }
        
    return {
        "user": user_data,
        "farm": farm_data
    }

from pydantic import BaseModel
class UpdateSettingsRequest(BaseModel):
    name: str = None
    preferred_language: str = None
    land_area: float = None
    primary_crop: str = None
    secondary_crop: str = None
    irrigation_type: str = None
    farm_location: str = None
    crop_growth_stage: str = None

@router.put("/settings")
def update_user_settings(request: UpdateSettingsRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if request.name is not None:
        current_user.name = request.name
        
    if request.preferred_language is not None:
        if not current_user.settings:
            current_user.settings = Settings(user_id=current_user.id, preferred_language=request.preferred_language)
        else:
            current_user.settings.preferred_language = request.preferred_language
            
    if (
        request.land_area is not None
        or request.primary_crop is not None
        or request.secondary_crop is not None
        or request.irrigation_type is not None
        or request.farm_location is not None
        or request.crop_growth_stage is not None
    ):
        if not current_user.farms or len(current_user.farms) == 0:
            new_farm = Farm(
                user_id=current_user.id,
                land_area=request.land_area or 0.0,
                primary_crop=request.primary_crop or "Unknown",
                secondary_crop=request.secondary_crop,
                irrigation_type=request.irrigation_type,
                farm_location=request.farm_location,
                crop_growth_stage=request.crop_growth_stage,
            )
            db.add(new_farm)
        else:
            farm = current_user.farms[0]
            if request.land_area is not None: farm.land_area = request.land_area
            if request.primary_crop is not None: farm.primary_crop = request.primary_crop
            if request.secondary_crop is not None: farm.secondary_crop = request.secondary_crop
            if request.irrigation_type is not None: farm.irrigation_type = request.irrigation_type
            if request.farm_location is not None: farm.farm_location = request.farm_location
            if request.crop_growth_stage is not None: farm.crop_growth_stage = request.crop_growth_stage
            
    db.commit()
    return {"message": "Settings updated successfully"}

@router.get("/notifications")
def get_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notifs = db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).all()
    return notifs

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

@router.post("/notifications")
def create_notification(
    request: CreateNotificationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lvl = (request.level or "info").strip().lower()
    if lvl not in ("info", "warning", "critical"):
        lvl = "info"
    n = Notification(
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
def mark_notification_read(notif_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notif = db.query(Notification).filter(Notification.id == notif_id, Notification.user_id == current_user.id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif

@router.get("/history")
def get_user_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Reports/Analytics history feed.

    Contract: ALWAYS return structured JSON (never a bare string).
    """
    try:
        detections = (
            db.query(Detection)
            .filter(Detection.user_id == current_user.id)
            .order_by(Detection.timestamp.desc())
            .all()
        )

        history = []
        for item in detections:
            formatted_date = item.timestamp.strftime("%Y-%m-%d") if item.timestamp else None
            # Keep a stable, structured history item shape for the frontend.
            history.append(
                {
                    "id": int(item.id),
                    "report_name": f"AAROH {item.pest_name} Analysis",
                    "category": "Pest Scan",
                    "date": formatted_date,
                    "file_size_bytes": None,
                    "detection_id": int(item.id),
                }
            )

        # Backward-compatible keys retained so other UIs don't break,
        # but the canonical payload is `history`.
        legacy_mapped = [
            {
                "title": h["report_name"],
                "type": h["category"],
                "date": h["date"] or "N/A",
                "size": None,
            }
            for h in history
        ]

        return {
            "history": history,
            "crop_health_timeline": [],
            "risk_index_trends": [],
            "pest_detection_history": legacy_mapped,
        }
    except Exception as exc:
        logger.exception("Failed to build /dashboard/history for user_id=%s", getattr(current_user, "id", None))
        raise HTTPException(
            status_code=500,
            detail={"message": "Failed to load history", "code": "HISTORY_LOAD_FAILED"},
        ) from exc

@router.get("/detections")
def get_user_detections(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    detections = (
        db.query(Detection)
        .filter(Detection.user_id == current_user.id)
        .order_by(Detection.timestamp.desc())
        .all()
    )
    items = []
    for d in detections:
        items.append(
            {
                "id": d.id,
                "image_url": d.image_url,
                "pest_name": d.pest_name,
                "confidence": d.confidence,
                "severity": d.severity,
                "risk_index": d.risk_index,
                "risk_level": d.risk_level,
                "timestamp": d.timestamp.isoformat() if d.timestamp else None,
                "status": getattr(d, "status", "Pending"),
            }
        )
    return {"items": items}

class UpdateDetectionRequest(BaseModel):
    status: str

@router.patch("/detections/{detection_id}")
def update_detection(
    detection_id: int,
    request: UpdateDetectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    det = (
        db.query(Detection)
        .filter(Detection.id == detection_id, Detection.user_id == current_user.id)
        .first()
    )
    if not det:
        raise HTTPException(status_code=404, detail="Detection not found")

    status = (request.status or "").strip()
    if status not in ["Pending", "Treated"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    det.status = status
    db.commit()
    return {"message": "Detection updated"}

def _dedupe_key(payload: dict) -> str:
    raw = json.dumps(payload, sort_keys=True, ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()[:24]

@router.post("/alerts/refresh")
def refresh_alerts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Evaluate latest conditions and generate in-app notifications.

    This is designed for polling (e.g. every 30-60s) to simulate real-time alerts.
    We dedupe alerts within a short time window to avoid spamming.
    """
    now = datetime.now(timezone.utc)

    created = []
    sensor = get_sensor_data()
    window_start = now - timedelta(minutes=30)

    def recently_sent(message: str) -> bool:
        return (
            db.query(Notification)
            .filter(
                Notification.user_id == current_user.id,
                Notification.message == message,
                Notification.created_at >= window_start,
            )
            .first()
            is not None
        )

    humidity = float(sensor.get("humidity", 0))
    if humidity >= 85:
        payload = {"kind": "HUMIDITY", "threshold": 85, "humidity": humidity}
        key = _dedupe_key(payload)
        msg = f"High humidity detected ({humidity}%). Increased pest/fungal risk."
        if not recently_sent(msg):
            n = Notification(
                user_id=current_user.id,
                type="ALERT",
                level="warning",
                message=msg,
                meta={"dedupeKey": key, "rule": "humidity>=85", "sensor": {"humidity": humidity}},
            )
            db.add(n)
            created.append(n)

    # 1.5) Temperature high alert
    temperature = float(sensor.get("temperature", 0))
    if temperature >= 38:
        payload = {"kind": "TEMPERATURE", "threshold": 38, "temperature": temperature}
        key = _dedupe_key(payload)
        msg = f"Heat alert: high temperature detected ({temperature}°C). Protect crops and irrigate wisely."
        if not recently_sent(msg):
            n = Notification(
                user_id=current_user.id,
                type="ALERT",
                level="warning" if temperature < 42 else "critical",
                message=msg,
                meta={"dedupeKey": key, "rule": "temperature>=38", "sensor": {"temperature": temperature}},
            )
            db.add(n)
            created.append(n)

    # 1.6) Soil moisture low alert
    soil = float(sensor.get("soil_moisture", 0))
    if soil <= 25:
        payload = {"kind": "SOIL_MOISTURE", "threshold": 25, "soil_moisture": soil}
        key = _dedupe_key(payload)
        msg = f"Low soil moisture detected ({soil}%). Consider irrigation if no rain is expected."
        if not recently_sent(msg):
            n = Notification(
                user_id=current_user.id,
                type="ALERT",
                level="warning",
                message=msg,
                meta={"dedupeKey": key, "rule": "soil_moisture<=25", "sensor": {"soil_moisture": soil}},
            )
            db.add(n)
            created.append(n)

    latest = (
        db.query(Detection)
        .filter(Detection.user_id == current_user.id)
        .order_by(Detection.timestamp.desc())
        .first()
    )
    if latest:
        risk_index = float(getattr(latest, "risk_index", 0) or 0)
        if risk_index >= 75:
            payload = {"kind": "PEST_RISK", "threshold": 75, "detection_id": latest.id, "risk_index": risk_index}
            key = _dedupe_key(payload)
            msg = f"Critical pest risk ({int(risk_index)}/100). Immediate action recommended."
            if not recently_sent(msg):
                n = Notification(
                    user_id=current_user.id,
                    type="ALERT",
                    level="critical",
                    message=msg,
                    meta={"dedupeKey": key, "rule": "risk_index>=75", "detection_id": latest.id},
                )
                db.add(n)
                created.append(n)

    db.commit()
    return {"created": len(created)}
