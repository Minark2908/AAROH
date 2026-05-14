"""
IoT sensor simulation for AAROH (smart farming backend).

This module generates realistic *changing* readings for common farm sensors.
Key idea: each new reading is based on the previous one + a small random drift,
so values feel natural instead of jumping randomly every time.
"""

from __future__ import annotations

import random
from typing import Dict, Tuple

# Realistic ranges (min, max)
# These are *configuration values* (not outputs). Actual readings are generated
# dynamically on every call to `get_sensor_data()`.
RANGES: Dict[str, Tuple[float, float]] = {
    "temperature": (24.0, 38.0),  # °C
    "humidity": (45.0, 90.0),  # %
    "soil_moisture": (20.0, 70.0),  # %
    "light_intensity": (10000.0, 60000.0),  # lux
}

# Maximum step change per reading (kept small for realism)
MAX_STEP: Dict[str, float] = {
    "temperature": 0.6,
    "humidity": 2.0,
    "soil_moisture": 1.5,
    "light_intensity": 3500.0,
}

def _clamp(value: float, lo: float, hi: float) -> float:
    """Keep value inside [lo, hi]."""
    return max(lo, min(hi, value))

def _drift(prev: float, key: str) -> float:
    """
    Add a small natural variation (drift) to the previous sensor value.

    We use a combination of:
    - uniform drift: small bounded change each call
    - gaussian jitter: tiny noise for realism
    """
    lo, hi = RANGES[key]
    step = MAX_STEP[key]

    # Bounded drift so values change smoothly between consecutive readings.
    uniform_drift = random.uniform(-step, step)

    # Small jitter (kept much smaller than 'step').
    jitter = random.gauss(0.0, step / 6.0)

    return _clamp(prev + uniform_drift + jitter, lo, hi)

# Module-level state: "last reading" for each sensor.
# This is what creates natural variation between readings.
_state: Dict[str, float] = {
    name: random.uniform(r[0], r[1]) for name, r in RANGES.items()
}

def get_sensor_data() -> Dict[str, float | str]:
    """
    Return a realistic simulated sensor snapshot.

    Output includes:
    - temperature (°C)
    - humidity (%)
    - soil_moisture (%)
    - light_intensity (lux)
    - conditions (str): human-readable status label
    """

    temperature = _drift(_state["temperature"], "temperature")
    humidity = _drift(_state["humidity"], "humidity")
    soil_moisture = _drift(_state["soil_moisture"], "soil_moisture")
    light_intensity = _drift(_state["light_intensity"], "light_intensity")

    # When light is higher, temperature tends to go slightly up.
    light_mid = (RANGES["light_intensity"][0] + RANGES["light_intensity"][1]) / 2.0
    light_span = RANGES["light_intensity"][1] - RANGES["light_intensity"][0]
    light_factor = (light_intensity - light_mid) / light_span  # ~ -0.5 .. +0.5

    temperature = _clamp(
        temperature + (light_factor * 0.6), *RANGES["temperature"]
    )

    # Higher temperature tends to reduce humidity a bit (air holds more moisture).
    temp_mid = (RANGES["temperature"][0] + RANGES["temperature"][1]) / 2.0
    humidity = _clamp(
        humidity - ((temperature - temp_mid) * 0.4), *RANGES["humidity"]
    )

    # Hotter conditions dry soil slightly faster.
    soil_moisture = _clamp(
        soil_moisture - max(0.0, temperature - 32.0) * 0.08, *RANGES["soil_moisture"]
    )

    # Persist the updated state for next call.
    _state["temperature"] = temperature
    _state["humidity"] = humidity
    _state["soil_moisture"] = soil_moisture
    _state["light_intensity"] = light_intensity

    # This is determined dynamically from the sensor values (no static outputs).
    high_humidity = humidity > 80.0
    dry_soil = soil_moisture < 25.0
    high_temperature = temperature > 35.0

    if high_humidity and dry_soil:
        conditions = "High humidity & Dry soil"
    elif high_humidity:
        conditions = "High humidity"
    elif dry_soil:
        conditions = "Dry soil"
    elif high_temperature:
        conditions = "High temperature"
    else:
        conditions = "Normal"

    return {
        "temperature": round(temperature, 1),
        "humidity": round(humidity, 1),
        "soil_moisture": round(soil_moisture, 1),
        "light_intensity": round(light_intensity, 1),
        "conditions": conditions,
    }

