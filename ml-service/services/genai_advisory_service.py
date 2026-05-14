"""
GenAI advisory module for AAROH.

This module uses the Groq LLM API to generate *dynamic* crop protection advice
based on:
- detected pest name
- calculated risk level
- live environment (temperature, humidity, soil moisture)

The goal is to keep things simple and beginner-friendly:
- one public function: `generate_ai_advisory(...)`
- plain Python dictionary output (easy to return from FastAPI)
- clear comments explaining what is happening
"""

from __future__ import annotations

import json
import os
from typing import Any, Dict

from groq import Groq

# We read the Groq API key from an environment variable so the secret is NOT
# hard-coded in the source code.
#
# In your terminal (before starting uvicorn), set:
#   - On Linux / macOS:
#       export GROQ_API_KEY="gsk_..."
#   - On Windows PowerShell:
#       $env:GROQ_API_KEY = "gsk_..."
#
# Then FastAPI can safely access the key at runtime.
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    # Failing fast makes debugging easier during development.
    # In production you might want to raise a custom error instead.
    raise RuntimeError(
        "GROQ_API_KEY environment variable is not set. "
        "Please set it before running the backend."
    )

# Groq hosts high-speed open models such as Llama 3, which are ideal
# for low-latency advisory use-cases like AAROH.
client = Groq(api_key=GROQ_API_KEY)

def _build_prompt(
    pest: str,
    risk_level: str,
    temperature: float,
    humidity: float,
    soil_moisture: float,
    language: str = "en",
    crop_type: str | None = None,
    growth_stage: str | None = None,
    weather_summary: str | None = None,
) -> str:
    """
    Create a natural-language prompt for the GenAI model.

    The prompt:
    - describes the farming context
    - passes the sensor values and risk level
    - clearly specifies the JSON structure we expect back
    """
    lang = (language or "en").strip().lower()
    if lang not in ("en", "hi", "gu"):
        lang = "en"
    language_map = {
        "en": "English",
        "hi": "Hindi",
        "gu": "Gujarati"
    }
    lang_name = language_map.get(lang, "English")

    return f"""
You are an experienced agricultural extension officer helping smallholder farmers.
You must give clear, practical and safe crop protection guidance.
Respond in {lang_name}.

CURRENT FIELD CONTEXT:
- Pest: {pest}
- Overall pest risk level: {risk_level}
- Temperature: {temperature} °C
- Humidity: {humidity} %
- Soil moisture: {soil_moisture} %
- Crop type: {crop_type or "Unknown"}
- Crop growth stage: {growth_stage or "Unknown"}
- Weather summary: {weather_summary or "Unavailable"}

TASK:
Using the above information, generate a detailed advisory for controlling this pest
under these environmental conditions. Focus on recommendations that are realistic
for typical Indian smallholder farmers (simple equipment, limited budget).

IMPORTANT INSTRUCTIONS:
- Explain WHY the recommended treatment makes sense given the pest and conditions.
- Prefer safe, label-compliant doses and intervals.
- Keep language simple and beginner-friendly.
- Avoid brand names; use generic product types only.
- For image URLs, you can use generic example URLs (e.g. from educational or stock
  image sites). They do NOT need to be real or verified, but they should look
  sensible and descriptive (e.g. "https://example.com/neem-oil-spray.jpg").

OUTPUT FORMAT:
Return ONLY a single JSON object with the following structure and keys:

{{
  "explanation": "Why the treatment is recommended based on pest and environment.",

  "chemical_treatment": {{
    "name": "Short, generic name of chemical control option.",
    "image": "https://example.com/chemical-treatment.jpg"
  }},

  "organic_treatment": {{
    "name": "Short, generic name of organic/biological control option.",
    "image": "https://example.com/organic-treatment.jpg"
  }},

  "preventive_treatment": {{
    "name": "Short, generic preventive action (sanitation, traps, rotation, resistant varieties).",
    "image": "https://example.com/preventive-measure.jpg"
  }},

  "application_steps": [
    "Step 1 in simple language...",
    "Step 2...",
    "Step 3..."
  ],

  "preventive_measures": [
    "Preventive practice 1...",
    "Preventive practice 2..."
  ],

  "video_tutorials": [
    {{
      "title": "Short title describing what the farmer will learn.",
      "url": "https://www.youtube.com/results?search_query=example+pest+management+video"
    }}
  ]
}}

Do NOT include any extra text outside the JSON. The response must be valid JSON.
    """.strip()

def generate_ai_advisory(
    pest: str,
    risk_level: str,
    temperature: float,
    humidity: float,
    soil_moisture: float,
    language: str = "en",
    crop_type: str | None = None,
    growth_stage: str | None = None,
    weather_summary: str | None = None,
) -> Dict[str, Any]:
    """
    Call OpenAI to generate structured pest management advice.

    Parameters
    ----------
    pest:
        Name of the detected pest (e.g. "Rice Leaf Roller").
    risk_level:
        Overall risk level from the decision engine (e.g. "Low", "Medium", "High").
    temperature, humidity, soil_moisture:
        Current environmental readings from the IoT module.

    Returns
    -------
    dict
        A dictionary with keys:
        - explanation (str)
        - chemical_treatment (dict: name, image)
        - organic_treatment (dict: name, image)
        - fertilizer_support (dict: name, image)
        - application_steps (list[str])
        - preventive_measures (list[str])
    """

    prompt = _build_prompt(
        pest,
        risk_level,
        temperature,
        humidity,
        soil_moisture,
        language=language,
        crop_type=crop_type,
        growth_stage=growth_stage,
        weather_summary=weather_summary,
    )

    # We use the Llama 3 8B model hosted on Groq. It offers fast inference
    # and is well-suited for structured, instructional outputs.
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an agricultural expert helping farmers control crop pests safely."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.6,
        )

        content = response.choices[0].message.content or "{}"

        # Clean up common formatting issues before JSON parsing.
        # Sometimes models wrap JSON in ```json ``` fences, which would
        # make json.loads() fail. Here we:
        content = content.strip()
        if content.startswith("```"):
            # e.g. "```json\n{...}\n```" -> ["", "json\n{...}\n", ""]
            parts = content.split("```")
            if len(parts) > 1:
                content = parts[1]
        content = content.strip()

        advisory = json.loads(content)

    except Exception as exc:
        # a very simple, safe fallback message instead of crashing the API.
        advisory = {
            "explanation": (
                "The AI advisory system could not generate detailed advice at this "
                "moment. Please try again shortly or consult a local agriculture "
                "extension officer for guidance."
            ),
            "chemical_treatment": {
                "name": "Consult local expert",
                "image": "https://example.com/consult-agronomist.jpg",
            },
            "organic_treatment": {
                "name": "Regular field scouting and removal of heavily infested plants",
                "image": "https://example.com/manual-scouting.jpg",
            },
            "preventive_treatment": {
                "name": "Field sanitation and prevention-first practices",
                "image": "https://example.com/field-sanitation.jpg",
            },
            "application_steps": [
                "Monitor the field closely for changes in pest pressure.",
                "Avoid overuse of any single pesticide.",
                "If possible, seek advice from a nearby agriculture officer.",
            ],
            "preventive_measures": [
                "Follow recommended crop rotation practices.",
                "Use healthy, certified seed material where available.",
                "Maintain good field sanitation and remove crop residues if advised.",
            ],
            "video_tutorials": [
                {
                    "title": "General guide on safe pesticide handling",
                    "url": "https://www.youtube.com/results?search_query=safe+pesticide+use+training",
                }
            ],
            "_error": str(exc),
        }

    return advisory

