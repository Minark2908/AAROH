from __future__ import annotations

import random
import threading
import time
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Iterable, Optional

from sqlalchemy.orm import Session

import models as db_models
from database import SessionLocal
from services.iot_service import get_sensor_data


@dataclass(frozen=True)
class Thresholds:
    soil_moisture_low: float = 28.0  # %
    temperature_high: float = 36.0  # °C


DEFAULT_SENSORS: list[str] = [
    "Node Alpha-1",
    "Node Beta-2",
    "Node Gamma-3",
]


def _compute_status(soil_moisture: float, temperature: float) -> str:
    if soil_moisture < 22.0 or temperature > 38.0:
        return "warning"
    return "online"


def _maybe_mark_offline(sensor_id: str) -> bool:
    # Small chance to simulate intermittent connectivity.
    # Keep it low so dashboards are stable.
    seed = hash((sensor_id, int(time.time() // 30)))
    rnd = random.Random(seed)
    return rnd.random() < 0.02


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _create_or_refresh_alert(
    db: Session,
    *,
    sensor_id: str,
    alert_type: str,
    level: str,
    message: str,
    meta: Optional[dict] = None,
    dedupe_window_minutes: int = 20,
) -> None:
    since = _utcnow() - timedelta(minutes=dedupe_window_minutes)
    existing = (
        db.query(db_models.SensorAlert)
        .filter(db_models.SensorAlert.sensor_id == sensor_id)
        .filter(db_models.SensorAlert.alert_type == alert_type)
        .filter(db_models.SensorAlert.is_active == True)  # noqa: E712
        .filter(db_models.SensorAlert.created_at >= since)
        .order_by(db_models.SensorAlert.created_at.desc())
        .first()
    )
    if existing:
        return

    db.add(
        db_models.SensorAlert(
            sensor_id=sensor_id,
            alert_type=alert_type,
            level=level,
            message=message,
            meta=meta or None,
            is_active=True,
        )
    )


def _resolve_alert(db: Session, *, sensor_id: str, alert_type: str) -> None:
    active = (
        db.query(db_models.SensorAlert)
        .filter(db_models.SensorAlert.sensor_id == sensor_id)
        .filter(db_models.SensorAlert.alert_type == alert_type)
        .filter(db_models.SensorAlert.is_active == True)  # noqa: E712
        .all()
    )
    for a in active:
        a.is_active = False


def smart_irrigation_suggestion(
    *,
    soil_moisture: float,
    temperature: float,
    humidity: float,
    thresholds: Thresholds = Thresholds(),
) -> Optional[dict]:
    if soil_moisture >= thresholds.soil_moisture_low:
        return None

    # Simple explainable heuristic; can be replaced by a model later.
    urgency = "high" if soil_moisture < (thresholds.soil_moisture_low - 6.0) else "medium"
    liters_per_acre = 1200 if urgency == "high" else 700
    return {
        "should_irrigate": True,
        "urgency": urgency,
        "reason": f"Soil moisture is low ({soil_moisture:.1f}%).",
        "suggested_volume_liters_per_acre": liters_per_acre,
        "notes": "Irrigate in early morning/evening to reduce evaporation.",
        "context": {"temperature": temperature, "humidity": humidity},
    }


def insert_simulated_reading(db: Session, *, sensor_id: str, thresholds: Thresholds = Thresholds()) -> db_models.SensorData:
    if _maybe_mark_offline(sensor_id):
        status = "offline"
        # Keep last-known-ish values when offline: generate but do not alert on thresholds.
        snapshot = get_sensor_data()
    else:
        snapshot = get_sensor_data()
        status = _compute_status(float(snapshot["soil_moisture"]), float(snapshot["temperature"]))

    reading = db_models.SensorData(
        sensor_id=sensor_id,
        soil_moisture=float(snapshot["soil_moisture"]),
        temperature=float(snapshot["temperature"]),
        humidity=float(snapshot["humidity"]),
        light_intensity=float(snapshot["light_intensity"]),
        status=status,
    )
    db.add(reading)

    # Alerts + smart trigger
    if status == "offline":
        _create_or_refresh_alert(
            db,
            sensor_id=sensor_id,
            alert_type="sensor_offline",
            level="critical",
            message=f"{sensor_id} is offline.",
        )
    else:
        _resolve_alert(db, sensor_id=sensor_id, alert_type="sensor_offline")

        if reading.soil_moisture < thresholds.soil_moisture_low:
            _create_or_refresh_alert(
                db,
                sensor_id=sensor_id,
                alert_type="soil_moisture_low",
                level="warning",
                message=f"Low soil moisture detected on {sensor_id} ({reading.soil_moisture:.1f}%).",
                meta={"threshold": thresholds.soil_moisture_low, "value": reading.soil_moisture},
            )
        else:
            _resolve_alert(db, sensor_id=sensor_id, alert_type="soil_moisture_low")

        if reading.temperature > thresholds.temperature_high:
            _create_or_refresh_alert(
                db,
                sensor_id=sensor_id,
                alert_type="temperature_high",
                level="warning",
                message=f"High temperature detected on {sensor_id} ({reading.temperature:.1f}°C).",
                meta={"threshold": thresholds.temperature_high, "value": reading.temperature},
            )
        else:
            _resolve_alert(db, sensor_id=sensor_id, alert_type="temperature_high")

    return reading


def get_latest_reading(db: Session, *, sensor_id: str) -> Optional[db_models.SensorData]:
    return (
        db.query(db_models.SensorData)
        .filter(db_models.SensorData.sensor_id == sensor_id)
        .order_by(db_models.SensorData.timestamp.desc())
        .first()
    )


def get_history(db: Session, *, sensor_id: str, hours: int = 24, limit: int = 1000) -> list[db_models.SensorData]:
    since = _utcnow() - timedelta(hours=hours)
    return (
        db.query(db_models.SensorData)
        .filter(db_models.SensorData.sensor_id == sensor_id)
        .filter(db_models.SensorData.timestamp >= since)
        .order_by(db_models.SensorData.timestamp.asc())
        .limit(limit)
        .all()
    )


def get_active_alerts(db: Session, *, sensor_id: Optional[str] = None, limit: int = 50) -> list[db_models.SensorAlert]:
    q = db.query(db_models.SensorAlert).filter(db_models.SensorAlert.is_active == True)  # noqa: E712
    if sensor_id:
        q = q.filter(db_models.SensorAlert.sensor_id == sensor_id)
    return q.order_by(db_models.SensorAlert.created_at.desc()).limit(limit).all()


def get_sensors_summary(db: Session, *, sensor_ids: Iterable[str]) -> dict:
    online = 0
    warning = 0
    offline = 0
    for sid in sensor_ids:
        latest = get_latest_reading(db, sensor_id=sid)
        if not latest:
            offline += 1
            continue
        if latest.status == "online":
            online += 1
        elif latest.status == "warning":
            warning += 1
        else:
            offline += 1

    return {"total": len(list(sensor_ids)), "online": online, "warning": warning, "offline": offline}


_sim_thread: Optional[threading.Thread] = None
_sim_started = False


def start_simulator_if_needed(sensor_ids: Optional[list[str]] = None, interval_seconds: int = 5) -> None:
    global _sim_thread, _sim_started
    if _sim_started:
        return

    sensor_ids = sensor_ids or DEFAULT_SENSORS
    _sim_started = True

    def _run() -> None:
        while True:
            db = SessionLocal()
            try:
                for sid in sensor_ids:
                    insert_simulated_reading(db, sensor_id=sid)
                db.commit()
            except Exception:
                db.rollback()
            finally:
                db.close()
            time.sleep(max(2, int(interval_seconds)))

    _sim_thread = threading.Thread(target=_run, name="iot-simulator", daemon=True)
    _sim_thread.start()
