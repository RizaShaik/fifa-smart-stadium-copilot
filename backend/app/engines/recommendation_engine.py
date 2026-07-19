from typing import List
from app.models.stadium_state import Recommendation
from app.services.ai.mission_ai import get_mission_recommendations
from app.services.ai.fan_ai import get_fan_recommendations
from app.services.ai.volunteer_ai import get_volunteer_suggestions
from app.services.ai.security_ai import get_security_recommendations
from app.services.ai.medical_ai import get_medical_recommendations

import threading
import logging

logger = logging.getLogger("uvicorn")

_recommendations_cache = {}
_cache_lock = threading.Lock()

def clear_recommendations_cache():
    with _cache_lock:
        _recommendations_cache.clear()
        logger.info("[Recommendation Cache] Cache cleared.")

def calculate_recommendations(scenario: str, role: str = "organizer", phase: str = "Warmup") -> List[Recommendation]:
    """
    Compile AI recommendations for the specified role workspace.
    Later, Gemini will generate this array dynamically.
    """
    role_normalized = role.lower()
    cache_key = (scenario, phase, role_normalized)

    with _cache_lock:
        if cache_key in _recommendations_cache:
            logger.info(f"[Recommendation Cache] Cache HIT for key: {cache_key}")
            return _recommendations_cache[cache_key]

    logger.info(f"[Recommendation Cache] Cache MISS for key: {cache_key}. Calculating...")

    if role_normalized == "organizer":
        recs = get_mission_recommendations(scenario, phase)
    elif role_normalized == "fan":
        recs = get_fan_recommendations(scenario, phase)
    elif role_normalized == "volunteer":
        recs = get_volunteer_suggestions(scenario, phase)
    elif role_normalized == "security":
        recs = get_security_recommendations(scenario, phase)
    elif role_normalized == "medical":
        recs = get_medical_recommendations(scenario, phase)
    else:
        # Default all combined
        recs = get_mission_recommendations(scenario, phase)

    with _cache_lock:
        _recommendations_cache[cache_key] = recs

    return recs
