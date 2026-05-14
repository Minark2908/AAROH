"""
Unified Pest Risk Index (UPRI) decision engine for AAROH.

Goal:
- Combine the model's prediction confidence with environmental sensor readings
  into a single, easy-to-understand risk score (0–100) and risk level label.
"""

from __future__ import annotations

def _clamp(value: float, lo: float, hi: float) -> float:
    """Keep value inside [lo, hi]."""
    return max(lo, min(hi, value))

def calculate_risk(
    confidence: float,
    temperature: float,
    humidity: float,
    soil_moisture: float,
) -> dict:
    """
    Calculate the Unified Pest Risk Index (0–100) and a risk level label.

    Inputs:
    - confidence: model confidence in [0.0, 1.0] (typical softmax probability)
    - temperature: °C
    - humidity: %
    - soil_moisture: %

    Output shape:
    {
      "risk_index": 72,
      "risk_level": "High Risk"
    }
    """

    # Start with the model confidence and convert it to a 0–100 score.
    # Example: confidence=0.72 -> base risk=72
    risk = float(confidence) * 100.0

    # These simple rules nudge the risk up when conditions are known to
    # make pest outbreaks more likely.

    if humidity > 80:
        risk += 10

    if temperature > 35:
        risk += 5

    if soil_moisture < 25:
        risk += 5

    risk = _clamp(risk, 0.0, 100.0)

    # Use an integer for a clean API response.
    risk_index = int(round(risk))

    # - < 40      -> Low Risk
    # - 40 to 70  -> Moderate Risk
    # - > 70      -> High Risk
    if risk_index < 40:
        risk_level = "Low Risk"
    elif risk_index <= 70:
        risk_level = "Moderate Risk"
    else:
        risk_level = "High Risk"

    return {
        "risk_index": risk_index,
        "risk_level": risk_level,
    }

