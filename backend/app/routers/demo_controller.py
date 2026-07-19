import time
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.stadium_manager import manager
from app.models.stadium_state import StadiumState

router = APIRouter(prefix="/api/demo")

class EventRequest(BaseModel):
    event: str

class AutoRequest(BaseModel):
    enabled: bool

@router.post("/event", response_model=StadiumState)
async def trigger_demo_event(payload: EventRequest):
    # Triggers manual override, turns off Auto Mode
    manager.auto_mode = False
    manager.set_scenario(payload.event)
    return manager.get_state()

@router.post("/auto")
async def toggle_auto_mode(payload: AutoRequest):
    manager.auto_mode = payload.enabled
    if manager.auto_mode:
        manager.last_auto_time = time.time()
        manager.scenario_timer = 20
    manager.update_state_lerp()
    return {
        "auto_mode": manager.auto_mode,
        "scenario": manager.scenario,
        "timer": manager.scenario_timer
    }

@router.post("/pause")
async def pause_simulation():
    manager.pause()
    return {
        "status": "paused",
        "is_paused": manager.is_paused
    }

@router.post("/resume")
async def resume_simulation():
    manager.resume()
    return {
        "status": "resumed",
        "is_paused": manager.is_paused
    }

@router.post("/reset")
async def reset_simulation():
    manager.reset_simulator()
    return {
        "status": "reset",
        "is_paused": manager.is_paused,
        "scenario": manager.scenario,
        "tick_counter": manager.tick_counter
    }
