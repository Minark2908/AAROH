from dotenv import load_dotenv
load_dotenv()

import io
import os
import json
import httpx
from datetime import datetime
import torch
import torch.nn as nn
from torchvision import models, transforms
from sqlalchemy.orm import Session
from sqlalchemy import desc

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from PIL import Image
from pydantic import BaseModel

from database import engine, get_db
import models as db_models
from routers.auth import router as auth_router
from security_config import SecurityHeadersMiddleware, get_cors_config
from routers.dashboard import router as dashboard_router
from routers.user import router as user_router
from routers.farm import router as farm_router
from services.auth_service import get_current_user
from services.iot_service import get_sensor_data
from services.iot_monitoring_service import (
    DEFAULT_SENSORS,
    get_active_alerts,
    get_history as get_iot_history,
    get_latest_reading,
    get_sensors_summary,
    smart_irrigation_suggestion,
    start_simulator_if_needed,
)
from services.risk_engine import calculate_risk
from services.history_service import add_prediction
from services.xai_service import generate_heatmap
from services.genai_advisory_service import generate_ai_advisory
from services.chatbot_service import generate_chat_response
from services.pest_inference_service import get_bundle
from routers.crop_health import router as crop_health_router
from routers.admin import router as admin_router
from routers.reports import router as reports_router
from routers.ai import router as ai_router
from routers.notifications import router as notifications_router

app = FastAPI(title="AAROH - Smart Farming Assistant (Pest Classifier)")

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# CORS middleware must be added BEFORE routers
cors_config = get_cors_config()
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_config["allow_origins"],
    allow_credentials=cors_config["allow_credentials"],
    allow_methods=cors_config["allow_methods"],
    allow_headers=cors_config["allow_headers"],
    max_age=cors_config.get("max_age", 600),
    expose_headers=cors_config.get("expose_headers", []),
)

app.add_middleware(SecurityHeadersMiddleware)

# Register routers
app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(user_router)
app.include_router(farm_router)
app.include_router(crop_health_router)
app.include_router(admin_router)
app.include_router(reports_router)
app.include_router(ai_router)
app.include_router(notifications_router)

try:
    db_models.Base.metadata.create_all(bind=engine)
    print("[AAROH] Database tables ready.")

    # Lightweight schema patching for existing DBs (no Alembic in this repo).
    # Adds newly introduced nullable columns used by exports.
    try:
        from sqlalchemy import text, inspect

        insp = inspect(engine)
        # Patch users table (avatar support)
        if "users" in insp.get_table_names():
            cols = {c["name"] for c in insp.get_columns("users")}
            with engine.begin() as conn:
                if "avatar_url" not in cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN avatar_url VARCHAR NULL"))
                    print("[AAROH] Patched DB: added users.avatar_url")
                if "is_disabled" not in cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN is_disabled BOOLEAN NOT NULL DEFAULT FALSE"))
                    print("[AAROH] Patched DB: added users.is_disabled")

        # Patch farms table (geocoding support)
        if "farms" in insp.get_table_names():
            cols = {c["name"] for c in insp.get_columns("farms")}
            with engine.begin() as conn:
                if "latitude" not in cols:
                    conn.execute(text("ALTER TABLE farms ADD COLUMN latitude DOUBLE PRECISION NULL"))
                    print("[AAROH] Patched DB: added farms.latitude")
                if "longitude" not in cols:
                    conn.execute(text("ALTER TABLE farms ADD COLUMN longitude DOUBLE PRECISION NULL"))
                    print("[AAROH] Patched DB: added farms.longitude")

        if "detections" in insp.get_table_names():
            cols = {c["name"] for c in insp.get_columns("detections")}
            with engine.begin() as conn:
                if "ai_advisory" not in cols:
                    conn.execute(text("ALTER TABLE detections ADD COLUMN ai_advisory JSONB NULL"))
                    print("[AAROH] Patched DB: added detections.ai_advisory")
                if "preventive_measures" not in cols:
                    conn.execute(text("ALTER TABLE detections ADD COLUMN preventive_measures JSONB NULL"))
                    print("[AAROH] Patched DB: added detections.preventive_measures")
    except Exception as _migrate_err:
        print(f"[AAROH] WARNING: Could not patch DB schema: {_migrate_err}")
except Exception as _db_err:
    print(f"[AAROH] WARNING: Could not connect to database: {_db_err}")
    print("[AAROH] Run 'python -m database.setup_db' (from ml-service/) to configure your PostgreSQL connection.")

@app.on_event("startup")
def _startup_iot_simulator():
    # Starts a lightweight background simulator so dashboards get real-time-ish data
    # even when no hardware is connected.
    start_simulator_if_needed(sensor_ids=DEFAULT_SENSORS, interval_seconds=5)

# Project structure:
# ml-service/
#  ├── app.py
#  ├── model/
#  │   ├── aaroh_model.pth
#  │   └── class_mapping.json
# Model bundle is now loaded lazily via get_bundle() in services.pest_inference_service

@app.get("/iot-data")
def iot_data(
    sensor_id: str | None = None,
    hours: int = 24,
    include_history: bool = True,
    include_alerts: bool = True,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user),
):
    """
    Real-time-ish IoT data endpoint.

    - Supports multiple sensor nodes via `sensor_id` query param.
    - Returns current reading + last 24h history + active alerts.
    - Uses background simulator when no hardware is present.
    """
    sensor_ids = DEFAULT_SENSORS
    selected = sensor_id or sensor_ids[0]
    if selected not in sensor_ids:
        selected = sensor_ids[0]

    latest = get_latest_reading(db, sensor_id=selected)
    if not latest:
        # Fallback: generate a single snapshot if DB isn't ready yet.
        snap = get_sensor_data()
        now = datetime.utcnow().isoformat()
        return {
            "sensor_id": selected,
            "soil_moisture": float(snap["soil_moisture"]),
            "temperature": float(snap["temperature"]),
            "humidity": float(snap["humidity"]),
            "light_intensity": float(snap["light_intensity"]),
            "status": "online",
            "timestamp": now,
            "history": [],
            "alerts": [],
            "sensors": sensor_ids,
            "summary": {"total": len(sensor_ids), "online": len(sensor_ids), "warning": 0, "offline": 0},
            "smart_irrigation": smart_irrigation_suggestion(
                soil_moisture=float(snap["soil_moisture"]),
                temperature=float(snap["temperature"]),
                humidity=float(snap["humidity"]),
            ),
        }

    history = []
    if include_history:
        hist_rows = get_iot_history(db, sensor_id=selected, hours=max(1, min(72, int(hours))))
        history = [
            {
                "timestamp": r.timestamp.isoformat() if r.timestamp else None,
                "soil_moisture": float(r.soil_moisture),
                "temperature": float(r.temperature),
                "humidity": float(r.humidity),
                "light_intensity": float(r.light_intensity),
                "status": r.status,
            }
            for r in hist_rows
        ]

    alerts = []
    if include_alerts:
        alert_rows = get_active_alerts(db, sensor_id=selected, limit=50)
        alerts = [
            {
                "id": int(a.id),
                "sensor_id": a.sensor_id,
                "type": a.alert_type,
                "level": a.level,
                "message": a.message,
                "meta": a.meta,
                "created_at": a.created_at.isoformat() if a.created_at else None,
                "is_active": bool(a.is_active),
            }
            for a in alert_rows
        ]

    summary = get_sensors_summary(db, sensor_ids=sensor_ids)
    return {
        "sensor_id": latest.sensor_id,
        "soil_moisture": float(latest.soil_moisture),
        "temperature": float(latest.temperature),
        "humidity": float(latest.humidity),
        "light_intensity": float(latest.light_intensity),
        "status": latest.status,
        "timestamp": latest.timestamp.isoformat() if latest.timestamp else None,
        "history": history,
        "alerts": alerts,
        "sensors": sensor_ids,
        "summary": summary,
        "smart_irrigation": smart_irrigation_suggestion(
            soil_moisture=float(latest.soil_moisture),
            temperature=float(latest.temperature),
            humidity=float(latest.humidity),
        ),
    }

@app.get("/weather")
async def weather(lat: float = 22.3039, lon: float = 70.8022, current_user: db_models.User = Depends(get_current_user)):
    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto"
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()
            
        current = data.get("current", {})
        daily = data.get("daily", {})
        
        temperature = current.get("temperature_2m", 32)
        humidity = current.get("relative_humidity_2m", 65)
        wind_speed = current.get("wind_speed_10m", 12)
        
        def get_icon(code):
            if code in [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99]:
                return "CloudRain"
            if code == 0:
                return "ThermometerSun"
            return "CloudSun"
            
        forecast_graph = []
        for i in range(min(7, len(daily.get("time", [])))):
            date_str = daily["time"][i]
            d = datetime.strptime(date_str, "%Y-%m-%d").date()
            today = datetime.now().date()
            delta_days = (d - today).days
            
            if delta_days == 0:
                day_name = "Today"
            elif delta_days == 1:
                day_name = "Tomorrow"
            else:
                day_name = d.strftime("%A")[:3]
                
            code = daily.get("weather_code", [])[i] if i < len(daily.get("weather_code", [])) else 0
            max_temp = daily.get("temperature_2m_max", [])[i] if i < len(daily.get("temperature_2m_max", [])) else temperature
            rain_prob = daily.get("precipitation_probability_max", [])[i] if i < len(daily.get("precipitation_probability_max", [])) else 0
            
            forecast_graph.append({
                "day": day_name,
                "temp": f"{round(max_temp)}°",
                "icon": get_icon(code),
                "rain": f"{rain_prob}%"
            })
            
        current_rain_prob = daily.get("precipitation_probability_max", [0])[0]
        
        # Real AI advisory logic (from mock soil + real weather)
        sensor_data = get_sensor_data()
        soil_moisture = float(sensor_data.get("soil_moisture", 45))
        
        # Decide if irrigation is needed
        if current_rain_prob > 70:
            recommendation = "irrigation is NOT recommended"
            reason = f"heavy rain forecasted for today ({current_rain_prob}% probability)"
            savings = "15,000"
        elif soil_moisture < 30 and current_rain_prob < 30:
            recommendation = "irrigation is HIGHLY recommended"
            reason = f"low soil moisture ({soil_moisture}%) and no immediate rain forecasted"
            savings = "0"
        else:
            recommendation = "irrigation is optionally recommended"
            reason = f"current soil moisture ({soil_moisture}%) and moderate weather conditions"
            savings = "5,000"
            
        return {
            "temperature": round(temperature),
            "humidity": round(humidity),
            "wind_speed": round(wind_speed),
            "rain_probability": current_rain_prob,
            "forecast_graph": forecast_graph,
            "advisory": {
                "recommendation": recommendation,
                "reason": reason,
                "soil_moisture": soil_moisture,
                "savings": savings
            }
        }
            
    except Exception as e:
        print(f"Weather fetch error: {e}")
        # Fallback to sensor data
        data = get_sensor_data()
        return {
            "temperature": data["temperature"],
            "humidity": data["humidity"],
            "wind_speed": 12,
            "rain_probability": 20, 
            "forecast_graph": [
                { "day": "Today", "temp": f"{data['temperature']}°", "icon": "CloudSun", "rain": "20%" },
                { "day": "Tomorrow", "temp": "30°", "icon": "CloudRain", "rain": "80%" },
                { "day": "Wed", "temp": "28°", "icon": "CloudRain", "rain": "60%" },
                { "day": "Thu", "temp": "31°", "icon": "CloudSun", "rain": "20%" },
                { "day": "Fri", "temp": "33°", "icon": "ThermometerSun", "rain": "5%" },
                { "day": "Sat", "temp": "34°", "icon": "ThermometerSun", "rain": "0%" },
                { "day": "Sun", "temp": "34°", "icon": "CloudSun", "rain": "10%" },
            ],
            "advisory": {
                "recommendation": "irrigation is optionally recommended",
                "reason": "unavailable live data (fallback mode)",
                "soil_moisture": 45,
                "savings": "0"
            }
        }

# Rate limiter for predictions (20 per 5 minutes per user)
_predict_rate_limiter = None

def _get_predict_limiter():
    from services.advanced_rate_limiter import SlidingWindowRateLimiter
    global _predict_rate_limiter
    if _predict_rate_limiter is None:
        _predict_rate_limiter = SlidingWindowRateLimiter(max_requests=20, window_seconds=300)
    return _predict_rate_limiter

@app.post("/predict")
async def predict(
    language: str | None = None,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user),
):
    # Apply rate limit per user
    limiter = _get_predict_limiter()
    user_id_str = str(current_user.id)
    if not limiter.is_allowed(user_id_str):
        reset_time = limiter.get_reset_time(user_id_str)
        raise HTTPException(
            status_code=429,
            detail=f"Prediction rate limited. Maximum 20 per 5 minutes. Try again in {reset_time}s"
        )
    
    from security_config import (
        DEFAULT_MAX_UPLOAD_SIZE,
        validate_image_file,
        SecurityEventLogger,
    )
    
    # Security: Limit file size to 10MB
    MAX_FILE_SIZE = DEFAULT_MAX_UPLOAD_SIZE
    
    # Read file with size check
    content = await file.read(MAX_FILE_SIZE + 1)
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File too large. Maximum size is 10MB."
        )
    
    await file.seek(0)  # Reset pointer
    
    print("Received file:", file.filename)
    
    # Validate MIME type
    if file.content_type is None:
        raise HTTPException(status_code=400, detail="File type not specified")
    
    # Validate file using magic numbers
    is_valid, error_msg = validate_image_file(content, file.content_type)
    if not is_valid:
        SecurityEventLogger.log_suspicious_request(
            "unknown",
            "/predict",
            f"Invalid file upload attempt: {error_msg}"
        )
        raise HTTPException(status_code=400, detail=error_msg)
    
    image_bytes = content
    SecurityEventLogger.log_file_upload(
        current_user.id,
        file.filename or "unknown",
        len(image_bytes),
        file.content_type
    )
    
    # Save image locally
    import uuid
    safe_ext = ".jpg"
    if file.filename and "." in file.filename:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext in [".jpg", ".jpeg", ".png", ".webp"]:
            safe_ext = ext
    image_name = f"{uuid.uuid4().hex}{safe_ext}"
    image_path = os.path.join(UPLOAD_DIR, image_name)
    try:
        with open(image_path, "wb") as f:
            f.write(image_bytes)
    except Exception:
        raise HTTPException(status_code=500, detail="Could not store uploaded image.")

    image_url = f"/uploads/{image_name}"

    try:
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read the uploaded image.")

    bundle = get_bundle()
    device = bundle["device"]
    preprocess = bundle["preprocess"]
    model = bundle["model"]
    class_mapping = bundle["class_mapping"]

    # Apply preprocessing and add batch dimension: [1, 3, 224, 224]
    input_tensor = preprocess(pil_image).unsqueeze(0).to(device)

    # We keep prediction under torch.no_grad() for efficiency,
    # and call Grad-CAM separately (it needs gradients enabled).
    with torch.no_grad():
        logits = model(input_tensor)
        probs = torch.softmax(logits, dim=1)
        conf, pred_idx = torch.max(probs, dim=1)

    pred_idx_int = int(pred_idx.item())
    confidence = float(conf.item())

    pest_name = class_mapping.get(str(pred_idx_int), str(pred_idx_int))

    # Grad-CAM highlights which regions of the crop image most influenced
    # the predicted pest class. The helper returns a base64-encoded PNG
    # of the original image with a colored heatmap overlay.
    heatmap_image_b64 = generate_heatmap(model, input_tensor)

    crop_type = None
    growth_stage = None
    location = None
    coordinates = None  # reserved for future: lat/lon derived from fields
    try:
        if current_user.farms and len(current_user.farms) > 0:
            farm = current_user.farms[0]
            crop_type = getattr(farm, "primary_crop", None)
            growth_stage = getattr(farm, "crop_growth_stage", None)
            location = getattr(farm, "farm_location", None)
    except Exception:
        # Keep prediction resilient even if settings are missing.
        pass

    # Severity rule based on confidence:
    # - confidence > 0.8  -> High
    # - confidence > 0.6  -> Medium
    # - otherwise         -> Low
    if confidence > 0.8:
        severity = "High"
    elif confidence > 0.6:
        severity = "Medium"
    else:
        severity = "Low"

    sensor_data = get_sensor_data()

    # risk engine and the GenAI advisory module.
    temperature = float(sensor_data["temperature"])
    humidity = float(sensor_data["humidity"])
    soil_moisture = float(sensor_data["soil_moisture"])

    #    - Start from confidence * 100
    #    - Increase risk under certain environmental conditions
    risk_result = calculate_risk(
        confidence=confidence,
        temperature=temperature,
        humidity=humidity,
        soil_moisture=soil_moisture,
    )

    risk_level = risk_result["risk_level"]

    # We don't always have coordinates saved, so we derive a short summary from
    # the current sensor "conditions" as a fallback.
    weather_summary = None
    try:
        cond = str(sensor_data.get("conditions", "") or "").strip()
        if cond:
            weather_summary = f"{cond}; temp={temperature}°C; humidity={humidity}%; soil moisture={soil_moisture}%"
        else:
            weather_summary = f"temp={temperature}°C; humidity={humidity}%; soil moisture={soil_moisture}%"
    except Exception:
        weather_summary = None

    # This call is wrapped in try/except so that if the advisory system
    # fails for any reason, the core prediction API still works.
    # Resolve preferred language (request overrides user setting)
    req_lang = (language or (current_user.settings.preferred_language if current_user.settings else "en") or "en").strip().lower()
    if req_lang not in ("en", "hi", "gu"):
        req_lang = "en"

    try:
        ai_advisory = generate_ai_advisory(
            pest_name,
            risk_level,
            temperature,
            humidity,
            soil_moisture,
            language=req_lang,
            crop_type=crop_type,
            growth_stage=growth_stage,
            weather_summary=weather_summary,
        )
    except Exception as exc:
        ai_advisory = {
            "error": "AI advisory could not be generated.",
            "details": str(exc),
        }

    # Preventive measures (best-effort; stored for PDF exports)
    preventive_measures = None
    try:
        if isinstance(ai_advisory, dict):
            pm = ai_advisory.get("preventive_measures")
            if isinstance(pm, list):
                preventive_measures = pm
    except Exception:
        preventive_measures = None

    # These are simple, production-friendly signals that can be refined over time.
    # - spread_probability: 0..1 influenced by humidity/wind + risk score
    # - urgency_level: Low/Medium/High based on risk + severity
    # - nearby_risk: Low/Medium/High based on conditions that favor outbreaks
    try:
        spread = 0.35 * (risk_result["risk_index"] / 100.0)
        if humidity >= 80:
            spread += 0.25
        if float(sensor_data.get("light_intensity", 0) or 0) < 250:
            spread += 0.05
        # Clamp to [0,1]
        spread_probability = max(0.0, min(1.0, float(spread)))
    except Exception:
        spread_probability = None

    try:
        urgency_level = "Low"
        if risk_result["risk_index"] >= 75 or severity == "High":
            urgency_level = "High"
        elif risk_result["risk_index"] >= 45 or severity == "Medium":
            urgency_level = "Medium"
    except Exception:
        urgency_level = "Medium"

    try:
        nearby_risk = "Low"
        rationale = []
        if humidity >= 80:
            nearby_risk = "High"
            rationale.append("High humidity can accelerate pest spread and secondary infections.")
        elif humidity >= 65:
            nearby_risk = "Medium"
            rationale.append("Moderate humidity can support pest persistence.")
        if temperature >= 35:
            rationale.append("High temperature can increase pest activity for some species.")
        if soil_moisture <= 25:
            rationale.append("Plant stress (dry soil) may increase vulnerability.")
    except Exception:
        nearby_risk = "Medium"
        rationale = []

    # We have a Grad-CAM heatmap. Additionally we extract lightweight visual signals
    # from the uploaded image to describe what the model likely used: color shifts,
    # texture roughness, spot-like patterns, and localized damage areas.
    def _extract_visual_signals(img: Image.Image) -> list[dict]:
        try:
            import numpy as np
            import cv2
            arr = np.array(img)  # RGB uint8

            # Basic color statistics
            mean_rgb = arr.reshape(-1, 3).mean(axis=0) / 255.0
            green_ratio = float(mean_rgb[1])

            # Texture / edge density (proxy for roughness)
            gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)
            edges = cv2.Canny(gray, 80, 160)
            edge_density = float(edges.mean() / 255.0)  # 0..1

            # Spot / pattern proxy: threshold on local contrast
            blur = cv2.GaussianBlur(gray, (0, 0), 1.2)
            local_contrast = cv2.absdiff(gray, blur)
            spot_score = float((local_contrast > 18).mean())  # 0..1

            signals = []
            # color
            if green_ratio < 0.35:
                signals.append({
                    "feature": "color",
                    "evidence": "Leaves show reduced green tone (possible chlorosis/yellowing).",
                    "strength": "medium",
                })
            else:
                signals.append({
                    "feature": "color",
                    "evidence": "Overall leaf color appears within typical green range.",
                    "strength": "low",
                })

            # texture
            if edge_density > 0.12:
                signals.append({
                    "feature": "texture",
                    "evidence": "High texture/edge density suggests roughness, lesions, or damage boundaries.",
                    "strength": "high",
                })
            elif edge_density > 0.08:
                signals.append({
                    "feature": "texture",
                    "evidence": "Moderate texture signal suggests mild surface disruption.",
                    "strength": "medium",
                })
            else:
                signals.append({
                    "feature": "texture",
                    "evidence": "Low texture signal; damage boundaries are not strongly defined.",
                    "strength": "low",
                })

            # patterns
            if spot_score > 0.10:
                signals.append({
                    "feature": "patterns",
                    "evidence": "High local-contrast regions indicate spot-like or patchy patterns.",
                    "strength": "high",
                })
            elif spot_score > 0.06:
                signals.append({
                    "feature": "patterns",
                    "evidence": "Some patchy patterning detected (minor spots/uneven regions).",
                    "strength": "medium",
                })
            else:
                signals.append({
                    "feature": "patterns",
                    "evidence": "Spot-like patterns are not strongly detected.",
                    "strength": "low",
                })

            # localized damage (best-effort: based on edges+contrast)
            if edge_density > 0.10 and spot_score > 0.08:
                signals.append({
                    "feature": "localized_damage",
                    "evidence": "Damage appears localized (patch/spot boundaries) rather than uniform stress.",
                    "strength": "medium",
                })
            return signals
        except Exception:
            return []

    visual_signals = _extract_visual_signals(pil_image)

    new_detection = db_models.Detection(
        user_id=current_user.id,
        pest_name=pest_name,
        confidence=round(confidence, 2),
        severity=severity,
        risk_index=float(risk_result["risk_index"]),
        risk_level=risk_level,
        temperature=float(sensor_data["temperature"]),
        humidity=float(sensor_data["humidity"]),
        soil_moisture=float(sensor_data["soil_moisture"]),
        light_intensity=float(sensor_data["light_intensity"]),
        conditions=sensor_data["conditions"],
        image_url=image_url,
        status="Pending",
        ai_advisory=ai_advisory if isinstance(ai_advisory, dict) else None,
        preventive_measures=preventive_measures,
    )
    db.add(new_detection)
    
    # Also create a notification about the detection
    notification_msg = f"Detected {severity} risk of {pest_name}."
    # Alert level derived from risk
    if risk_level == "High Risk":
        notif_level = "critical"
    elif risk_level == "Moderate Risk":
        notif_level = "warning"
    else:
        notif_level = "info"

    new_notification = db_models.Notification(
        user_id=current_user.id,
        type="DETECTION",
        level=notif_level,
        message=notification_msg
    )
    db.add(new_notification)
    
    db.commit()
    # refresh so we have ID + timestamp
    db.refresh(new_detection)

    from utils.logger import log_activity
    log_activity(
        db, 
        current_user.id, 
        "PEST_DETECTION", 
        target=pest_name, 
        details=f"Detected {pest_name} with {round(confidence*100, 1)}% confidence. Risk: {risk_level}", 
        level="INFO" if risk_level != "High Risk" else "WARNING",
        commit=True
    )

    history_recent = []
    trend = "stable"
    try:
        recent = (
            db.query(db_models.Detection)
            .filter(db_models.Detection.user_id == current_user.id)
            .order_by(desc(db_models.Detection.timestamp))
            .limit(10)
            .all()
        )
        for d in recent:
            history_recent.append(
                {
                    "id": d.id,
                    "pest_name": d.pest_name,
                    "confidence": float(d.confidence),
                    "severity": d.severity,
                    "risk_index": float(d.risk_index) if d.risk_index is not None else None,
                    "timestamp": d.timestamp.isoformat() if d.timestamp else None,
                    "image_url": d.image_url,
                }
            )

        # Trend based on average risk index: last 3 vs previous 3 (if available)
        scores = [float(d.risk_index or 0) for d in recent if d.risk_index is not None]
        if len(scores) >= 6:
            last_avg = sum(scores[:3]) / 3.0
            prev_avg = sum(scores[3:6]) / 3.0
            if last_avg - prev_avg >= 7:
                trend = "increasing"
            elif prev_avg - last_avg >= 7:
                trend = "decreasing"
            else:
                trend = "stable"
    except Exception:
        history_recent = []
        trend = "stable"

    # Final API response combines:
    # - pest classification + confidence
    # - rule-based severity
    # - unified risk index from decision engine
    # - latest IoT sensor readings
    # - Grad-CAM explainability image (base64)
    return {
        "pest": pest_name,
        "confidence": round(confidence, 2),
        "severity": severity,
        # New: structured UPRI (replaces vague "Risk Index" in the UI)
        "upri": {
            "score": int(risk_result["risk_index"]),
            "level": risk_level,
            "drivers": [
                {"key": "model_confidence", "impact": "high", "reason": "Primary signal from the vision model."},
                {"key": "humidity", "impact": "high" if humidity >= 80 else "medium" if humidity >= 65 else "low", "reason": f"Humidity {humidity}% affects outbreak probability."},
                {"key": "temperature", "impact": "medium" if temperature >= 35 else "low", "reason": f"Temperature {temperature}°C influences pest activity."},
                {"key": "soil_moisture", "impact": "medium" if soil_moisture <= 25 else "low", "reason": f"Soil moisture {soil_moisture}% relates to plant stress."},
            ],
        },
        # Legacy keys kept for backward compatibility (frontend should prefer upri.*)
        "risk_index": risk_result["risk_index"],
        "risk_level": risk_level,
        "temperature": sensor_data["temperature"],
        "humidity": sensor_data["humidity"],
        "soil_moisture": sensor_data["soil_moisture"],
        "light_intensity": sensor_data["light_intensity"],
        "conditions": sensor_data["conditions"],
        "heatmap": heatmap_image_b64,
        "image_url": image_url,
        "detection_id": int(new_detection.id),
        "timestamp": new_detection.timestamp.isoformat() if new_detection.timestamp else datetime.utcnow().isoformat(),
        "context": {
            "crop_type": crop_type,
            "growth_stage": growth_stage,
            "location": location,
            "coordinates": coordinates,
        },
        "insights": {
            "spread_probability": spread_probability,
            "urgency_level": urgency_level,
            "nearby_risk": nearby_risk,
            "rationale": rationale,
        },
        "why": {
            "summary": "The model focused on localized regions (heatmap) and visual cues consistent with pest damage patterns.",
            "signals": visual_signals,
            "heatmap_available": bool(heatmap_image_b64),
        },
        "history": {
            "recent": history_recent,
            "trend": trend,
        },
        # Structured GenAI advisory (includes explanation, treatments,
        # step-by-step instructions, preventive measures, and videos).
        "ai_advisory": ai_advisory,
    }

# Legacy /chat endpoint removed — use /ai/chat (authenticated, with context + history).

