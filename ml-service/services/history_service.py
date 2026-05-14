"""
Prediction history service for AAROH.

This module keeps a rolling, in-memory history of the most recent predictions.
It is designed to be:
- dynamic: new entries are added at runtime on every /predict call
- bounded: only the latest 50 records are kept (rolling window)
"""

from __future__ import annotations

from datetime import datetime
from threading import Lock
from typing import Any, Dict, List

# Requirement: maintain a *dynamic list* called `prediction_history`.
# We keep it module-level so it persists across requests while the API process
# is running.
prediction_history: List[Dict[str, Any]] = []

# Keep only the most recent N predictions.
_HISTORY_LIMIT = 50

# FastAPI can serve concurrent requests; a lock keeps list operations safe.
_history_lock = Lock()

def add_prediction(record: Dict[str, Any]) -> Dict[str, Any]:
    """
    Add a new prediction record to the rolling history.

    - Automatically attaches a timestamp using datetime.now().
    - Automatically trims old entries to keep only the most recent 50.

    The caller is expected to pass in dynamic values coming from:
    - the model prediction output
    - the IoT sensor module output
    - the risk decision engine output
    """
    # Timestamp format matches the example response shape: "YYYY-MM-DD HH:MM"
    record_with_timestamp = dict(record)
    record_with_timestamp["timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M")

    with _history_lock:
        prediction_history.append(record_with_timestamp)

        # Rolling history: keep only the most recent 50 records.
        if len(prediction_history) > _HISTORY_LIMIT:
            del prediction_history[:-_HISTORY_LIMIT]

    return record_with_timestamp

def get_history() -> List[Dict[str, Any]]:
    """
    Return the stored prediction history dynamically.

    A shallow copy is returned so callers can't mutate internal state.
    """
    with _history_lock:
        return list(prediction_history)

