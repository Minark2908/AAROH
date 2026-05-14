import os
from typing import Any, Literal

import httpx
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel, field_validator
from sqlalchemy import desc
from sqlalchemy.orm import Session
from PIL import Image

from database import get_db
import models as db_models
from services.auth_service import get_current_user
from services.pest_inference_service import predict_pest

router = APIRouter(prefix="/ai", tags=["ai"])

SupportedLanguage = Literal["en", "hi", "gu"]

class ChatMessageOut(BaseModel):
    id: int
    role: Literal["system", "user", "assistant"]
    content: str
    created_at: str | None = None
    meta: dict[str, Any] | None = None

class ChatHistoryResponse(BaseModel):
    messages: list[ChatMessageOut]

class ChatRequest(BaseModel):
    message: str
    language: SupportedLanguage | None = None

    @field_validator("message")
    @classmethod
    def _msg(cls, v: str):
        v = (v or "").strip()
        if not v:
            raise ValueError("Message cannot be empty.")
        if len(v) > 4000:
            raise ValueError("Message is too long.")
        return v

class ChatResponse(BaseModel):
    reply: str
    message_id: int

def _lang_name(code: str) -> str:
    code = (code or "en").lower()
    if code == "hi":
        return "Hindi"
    if code == "gu":
        return "Gujarati"
    return "English"

async def _fetch_weather_context(lat: float | None, lon: float | None) -> dict[str, Any] | None:
    if lat is None or lon is None:
        return None
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            r = await client.get("https://api.open-meteo.com/v1/forecast", params={
                "latitude": lat,
                "longitude": lon,
                "current": "temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m",
                "timezone": "auto",
            })
            r.raise_for_status()
            data = r.json() or {}
            cur = data.get("current") or {}
            return {
                "temperature_c": cur.get("temperature_2m"),
                "humidity_pct": cur.get("relative_humidity_2m"),
                "wind_kmh": cur.get("wind_speed_10m"),
                "rain_mm": cur.get("rain") if cur.get("rain") is not None else cur.get("precipitation"),
            }
    except Exception:
        return None

def _latest_iot_context(db: Session) -> dict[str, Any] | None:
    try:
        row = db.query(db_models.SensorData).order_by(desc(db_models.SensorData.timestamp)).first()
        if not row:
            return None
        return {
            "sensor_id": row.sensor_id,
            "soil_moisture_pct": float(row.soil_moisture),
            "temperature_c": float(row.temperature),
            "humidity_pct": float(row.humidity),
            "light_intensity": float(row.light_intensity),
            "status": row.status,
            "timestamp": row.timestamp.isoformat() if row.timestamp else None,
        }
    except Exception:
        return None

def _recent_pest_context(db: Session, user_id: int) -> list[dict[str, Any]]:
    try:
        rows = (
            db.query(db_models.Detection)
            .filter(db_models.Detection.user_id == user_id)
            .order_by(desc(db_models.Detection.timestamp))
            .limit(5)
            .all()
        )
        out: list[dict[str, Any]] = []
        for d in rows:
            out.append({
                "pest_name": d.pest_name,
                "severity": d.severity,
                "risk_level": d.risk_level,
                "risk_index": float(d.risk_index) if d.risk_index is not None else None,
                "timestamp": d.timestamp.isoformat() if d.timestamp else None,
            })
        return out
    except Exception:
        return []

def _build_context_summary(
    *,
    user: db_models.User,
    farm: db_models.Farm | None,
    weather: dict[str, Any] | None,
    iot: dict[str, Any] | None,
    pest_history: list[dict[str, Any]],
) -> str:
    parts: list[str] = []
    if farm:
        crops = [c for c in [farm.primary_crop, farm.secondary_crop] if c]
        if crops:
            parts.append(f"Crop(s): {', '.join(crops)}")
        if farm.crop_growth_stage:
            parts.append(f"Growth stage: {farm.crop_growth_stage}")
        if farm.farm_location:
            parts.append(f"Location: {farm.farm_location}")
        if farm.irrigation_type:
            parts.append(f"Irrigation: {farm.irrigation_type}")
        if farm.latitude is not None and farm.longitude is not None:
            parts.append(f"Coordinates: {farm.latitude:.4f}, {farm.longitude:.4f}")

    if weather:
        w = []
        if weather.get("temperature_c") is not None:
            w.append(f"{weather['temperature_c']}°C")
        if weather.get("humidity_pct") is not None:
            w.append(f"{weather['humidity_pct']}% humidity")
        if weather.get("wind_kmh") is not None:
            w.append(f"{weather['wind_kmh']} km/h wind")
        if weather.get("rain_mm") is not None:
            w.append(f"{weather['rain_mm']} mm rain")
        if w:
            parts.append("Weather now: " + ", ".join(map(str, w)))

    if iot:
        parts.append(
            "IoT: "
            + f"soil moisture {iot.get('soil_moisture_pct')}%, "
            + f"temp {iot.get('temperature_c')}°C, "
            + f"humidity {iot.get('humidity_pct')}%, "
            + f"light {iot.get('light_intensity')}"
        )

    if pest_history:
        latest = pest_history[0]
        parts.append(f"Recent pest detection: {latest.get('pest_name')} ({latest.get('severity')}, {latest.get('risk_level')})")

    return " | ".join([p for p in parts if p]) or "No farm context available yet."

def _load_recent_chat(db: Session, user_id: int, limit: int = 16) -> list[db_models.ChatMessage]:
    return (
        db.query(db_models.ChatMessage)
        .filter(db_models.ChatMessage.user_id == user_id)
        .order_by(desc(db_models.ChatMessage.created_at))
        .limit(limit)
        .all()
    )

def _call_llm(messages: list[dict[str, str]]) -> str:
    """
    Best-effort provider selection:
    - If GROQ_API_KEY exists, use Groq Llama (already used in this repo).
    - If OPENAI_API_KEY exists, use OpenAI Responses API via HTTP (no extra dependency).
    """
    groq_key = os.getenv("GROQ_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")

    if groq_key:
        try:
            from groq import Groq  # type: ignore
        except Exception as exc:
            raise RuntimeError("Groq SDK not installed, but GROQ_API_KEY is set.") from exc
        client = Groq(api_key=groq_key)
        resp = client.chat.completions.create(
            model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
            messages=messages,
            temperature=0.5,
            max_tokens=900,
        )
        return (resp.choices[0].message.content or "").strip()

    if openai_key:
        model = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
        try:
            with httpx.Client(timeout=20.0) as client:
                r = client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"},
                    json={
                        "model": model,
                        "messages": messages,
                        "temperature": 0.5,
                        "max_tokens": 900,
                    },
                )
                r.raise_for_status()
                data = r.json()
                return (data["choices"][0]["message"]["content"] or "").strip()
        except Exception as exc:
            raise RuntimeError(f"OpenAI call failed: {exc}") from exc

    raise RuntimeError("No AI provider configured. Set GROQ_API_KEY or OPENAI_API_KEY.")

@router.get("/insights")
async def get_insights(
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user),
):
    """
    Lightweight, production-safe insights endpoint for the dashboard.

    Returns best-effort insights generated from:
    - recent pest detections (risk index)
    - latest IoT readings (soil moisture / humidity / temperature)
    - current weather (rain)
    """
    farm = current_user.farms[0] if current_user.farms else None
    weather = await _fetch_weather_context(getattr(farm, "latitude", None), getattr(farm, "longitude", None))
    iot = _latest_iot_context(db)
    pest = _recent_pest_context(db, int(current_user.id))

    items: list[dict[str, Any]] = []

    if pest:
        latest = pest[0]
        risk = latest.get("risk_index")
        if isinstance(risk, (int, float)) and risk >= 75:
            items.append(
                {
                    "id": "pest-high-risk",
                    "title": "High pest risk",
                    "message": f"Recent detection suggests elevated risk ({int(risk)}/100). Review treatment and monitoring today.",
                    "level": "alert",
                    "source": "Pest detection",
                    "created_at": latest.get("timestamp"),
                }
            )
        elif isinstance(risk, (int, float)) and risk >= 50:
            items.append(
                {
                    "id": "pest-medium-risk",
                    "title": "Monitor pest activity",
                    "message": f"Recent detection shows moderate risk ({int(risk)}/100). Scout your field and set traps if needed.",
                    "level": "warning",
                    "source": "Pest detection",
                    "created_at": latest.get("timestamp"),
                }
            )

    if iot:
        soil = iot.get("soil_moisture_pct")
        humidity = iot.get("humidity_pct")
        temp = iot.get("temperature_c")

        if isinstance(soil, (int, float)) and soil <= 25:
            items.append(
                {
                    "id": "soil-low",
                    "title": "Low soil moisture",
                    "message": f"Soil moisture is low ({int(soil)}%). Consider irrigation if rain is not expected soon.",
                    "level": "warning",
                    "source": "IoT sensors",
                    "created_at": iot.get("timestamp"),
                }
            )
        if isinstance(humidity, (int, float)) and humidity >= 85:
            items.append(
                {
                    "id": "humidity-high",
                    "title": "High humidity risk",
                    "message": f"Humidity is high ({int(humidity)}%). Fungal/pest pressure may increase—inspect leaves for early symptoms.",
                    "level": "warning",
                    "source": "IoT sensors",
                    "created_at": iot.get("timestamp"),
                }
            )
        if isinstance(temp, (int, float)) and temp >= 38:
            items.append(
                {
                    "id": "heat-alert",
                    "title": "Heat alert",
                    "message": f"High temperature detected ({int(temp)}°C). Avoid midday spraying and irrigate strategically.",
                    "level": "warning" if temp < 42 else "alert",
                    "source": "IoT sensors",
                    "created_at": iot.get("timestamp"),
                }
            )

    if weather:
        rain_mm = weather.get("rain_mm")
        if isinstance(rain_mm, (int, float)) and rain_mm > 0:
            items.append(
                {
                    "id": "rain-now",
                    "title": "Rain detected",
                    "message": "Rain is currently detected. Avoid irrigation and plan pesticide sprays around dry windows.",
                    "level": "info",
                    "source": "Weather",
                    "created_at": None,
                }
            )

    # Fallback
    if not items:
        items.append(
            {
                "id": "all-clear",
                "title": "All clear",
                "message": "No critical risks detected right now. Keep monitoring your sensors and scans.",
                "level": "info",
                "source": "AAROH",
                "created_at": None,
            }
        )

    return items[:6]

@router.get("/history", response_model=ChatHistoryResponse)
def get_history(
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user),
):
    rows = (
        db.query(db_models.ChatMessage)
        .filter(db_models.ChatMessage.user_id == current_user.id)
        .order_by(db_models.ChatMessage.created_at.asc())
        .limit(50)
        .all()
    )
    return ChatHistoryResponse(
        messages=[
            ChatMessageOut(
                id=int(r.id),
                role=r.role,  # type: ignore[arg-type]
                content=r.content,
                created_at=r.created_at.isoformat() if r.created_at else None,
                meta=r.meta,
            )
            for r in rows
        ]
    )

@router.post("/chat", response_model=ChatResponse)
async def chat(
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user),
):
    # STEP 3: Receive language
    user_lang = req.language or "en"
    
    # STEP 4: Map language to full name
    language_map = {
        "en": "English",
        "hi": "Hindi",
        "gu": "Gujarati"
    }
    selected_lang = language_map.get(user_lang, "English")

    # STEP 6: Debug Logging
    print(f"User language: {user_lang}")
    print(f"Selected language: {selected_lang}")

    farm = current_user.farms[0] if current_user.farms else None
    weather = await _fetch_weather_context(getattr(farm, "latitude", None), getattr(farm, "longitude", None))
    iot = _latest_iot_context(db)
    pest_history = _recent_pest_context(db, int(current_user.id))

    context_summary = _build_context_summary(user=current_user, farm=farm, weather=weather, iot=iot, pest_history=pest_history)

    # Build conversation memory (last N pairs)
    recent = list(reversed(_load_recent_chat(db, int(current_user.id), limit=18)))
    memory_msgs: list[dict[str, str]] = []
    for m in recent:
        if m.role == "user":
            memory_msgs.append({"role": "user", "content": m.content})
        elif m.role == "assistant":
            memory_msgs.append({"role": "assistant", "content": m.content})

    # STEP 4: AI Prompt Construction
    system_prompt = (
        "You are an agricultural expert AI.\n\n"
        f"Respond ONLY in {selected_lang}.\n"
        "Use simple, clear language suitable for farmers.\n\n"
        "Format your response in structured sections:\n"
        "* Problem\n"
        "* Treatment\n"
        "* Organic Solution\n"
        "* Precautions\n\n"
        f"User context (real app data): {context_summary}\n"
    )

    # Final check: reiterate rules to prevent history bias
    messages = [
        {"role": "system", "content": system_prompt},
        *memory_msgs,
        {"role": "user", "content": f"{req.message}\n\n(IMPORTANT: Respond in {selected_lang} using the 4 sections specified above.)"}
    ]

    # Persist user message
    user_row = db_models.ChatMessage(
        user_id=int(current_user.id),
        role="user",
        content=req.message,
        meta={"language": user_lang, "context_summary": context_summary},
    )
    db.add(user_row)
    db.commit()
    db.refresh(user_row)

    try:
        reply = _call_llm(messages)
        if not reply:
            raise RuntimeError("Empty AI response.")
    except Exception:
        # Graceful fallback
        reply = (
            "Sorry — I couldn’t reach the AI service right now. "
            "Please try again in a moment. If you tell me your crop, location, and what you’re seeing, I can guide you step-by-step."
            if user_lang == "en"
            else "माफ़ कीजिए — अभी AI सेवा उपलब्ध नहीं है। कृपया थोड़ी देर बाद फिर कोशिश करें।"
            if user_lang == "hi"
            else "માફ કરશો — હાલ AI સેવા ઉપલબ્ધ નથી. કૃપા કરીને થોડીવાર પછી ફરી પ્રયાસ કરો."
        )

    assistant_row = db_models.ChatMessage(
        user_id=int(current_user.id),
        role="assistant",
        content=reply,
        meta={"language": user_lang},
    )
    db.add(assistant_row)
    db.commit()
    db.refresh(assistant_row)

    return ChatResponse(reply=reply, message_id=int(assistant_row.id))

@router.post("/chat-image", response_model=ChatResponse)
async def chat_with_image(
    message: str | None = None,
    language: str | None = None,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user),
):
    """Image-based query: run pest inference + respond with combined advice."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image file.")

    try:
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Empty file.")
    except HTTPException:
        raise
    except Exception:
        # Fallback if PIL open fails
        try:
            import io
            pil = Image.open(io.BytesIO(contents)).convert("RGB")
        except Exception:
            raise HTTPException(status_code=500, detail="Could not read uploaded image.")
    else:
        # Normal path
        import io
        try:
            pil = Image.open(io.BytesIO(contents)).convert("RGB")
        except Exception:
            raise HTTPException(status_code=500, detail="Could not read uploaded image.")

    pred = predict_pest(pil.convert("RGB"))
    pest = pred.get("pest", "Unknown")
    conf = pred.get("confidence", None)
    prefix = f"Image analysis result: likely pest '{pest}'"
    if conf is not None:
        prefix += f" (confidence {conf})."
    else:
        prefix += "."

    combined = f"{prefix}\n\nUser question: {message or 'Please advise treatment, prevention, and next steps.'}"
    req = ChatRequest(message=combined, language=language if language in ("en", "hi", "gu") else None)
    return await chat(req=req, db=db, current_user=current_user)
