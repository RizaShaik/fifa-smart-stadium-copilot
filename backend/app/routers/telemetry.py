from fastapi import APIRouter
from app.services.stadium_manager import manager
from app.models.stadium_state import StadiumState, CrowdState, WeatherState, TransportState, Incident, Recommendation
from app.engines.recommendation_engine import calculate_recommendations
from typing import Dict, Any, List
from pydantic import BaseModel
from google.genai import types
import logging

logger = logging.getLogger("uvicorn")

router = APIRouter(prefix="/api")

@router.get("/mission-control", response_model=StadiumState)
async def get_mission_control():
    """
    Returns the complete unified StadiumState.
    """
    return manager.get_state()

@router.get("/stadium/state", response_model=StadiumState)
async def get_stadium_state():
    """
    Returns the complete unified StadiumState (primary).
    """
    return manager.get_state()

@router.get("/digital-twin")
async def get_digital_twin():
    """
    Returns Digital Twin stands metrics.
    """
    state = manager.get_state()
    return state.crowd.stand_densities

@router.get("/heatmap")
async def get_heatmap() -> List[List[str]]:
    """
    Returns turnstile crowd flow heatmap matrix.
    """
    state = manager.get_state()
    return state.crowd.heatmap

@router.get("/crowd", response_model=CrowdState)
async def get_crowd():
    state = manager.get_state()
    return state.crowd

@router.get("/weather", response_model=WeatherState)
async def get_weather():
    state = manager.get_state()
    return state.weather

@router.get("/transport", response_model=TransportState)
async def get_transport():
    state = manager.get_state()
    return state.transport

@router.get("/resources")
async def get_resources():
    state = manager.get_state()
    return {
        "food": state.food,
        "restrooms": state.restrooms,
        "sustainability": state.sustainability
    }

@router.get("/analytics")
async def get_analytics():
    """
    Generate score models: health, safety, accessibility, sustainability.
    """
    state = manager.get_state()
    
    # Calculate responsive analytical scores
    health = state.crowd.health_score
    safety = int(state.crowd.safety_rate.replace("%", ""))
    
    # Generate mock procedural score adjustments
    crowd_eff = 94 if manager.scenario == "Normal" else 55 if manager.scenario == "Metro Delay" else 20 if manager.scenario == "Fire Alarm" else 80
    trans_eff = 98 if manager.scenario == "Normal" else 42 if manager.scenario == "Metro Delay" else 30 if manager.scenario == "Fire Alarm" else 88
    access_score = 99 if manager.scenario == "Normal" else 90 if manager.scenario == "Medical Emergency" else 40 if manager.scenario == "Fire Alarm" else 95
    sustain_score = 96
    
    overall = int((health + safety + crowd_eff + trans_eff + access_score + sustain_score) / 6)
    
    return {
        "health_score": health,
        "safety_score": safety,
        "crowd_efficiency": crowd_eff,
        "transport_efficiency": trans_eff,
        "accessibility_score": access_score,
        "sustainability_score": sustain_score,
        "overall_score": overall
    }

@router.get("/incidents", response_model=List[Incident])
async def get_incidents():
    """
    Returns active incidents.
    """
    state = manager.get_state()
    return state.incidents

@router.get("/recommendations", response_model=List[Recommendation])
async def get_recommendations(role: str = "organizer", phase: str = None):
    """
    Returns role-specific recommendations.
    """
    current_phase = phase or (manager.get_state().match_status if manager.get_state() else "Warmup")
    return calculate_recommendations(manager.scenario, role, current_phase)


class ChatRequest(BaseModel):
    role: str
    scenario: str
    phase: str
    query: str
    history: List[Dict[str, str]] = []


@router.post("/stadium/chat")
async def chat_with_copilot(payload: ChatRequest):
    """
    Context-aware Chatbot for stadium copilot.
    """
    from app.services.ai.gemini_client import gemini_client
    
    # Get current stadium state for telemetry context
    state = manager.get_state()
    state_json = state.json() if state else "{}"
    
    # Build a comprehensive context prompt for Gemini
    system_instruction = (
        "You are the FIFA Smart Stadium AI Assistant.\n"
        "You are assisting a user in a smart stadium platform. Answer user queries accurately and concisely based on the provided live stadium state context.\n"
        "Do NOT give generic or irrelevant recommendations (e.g. if the user asks for their seat, do not recommend food; direct them to their seating portal or row. If they ask about food, recommend concessions based on their food list. If they ask about safety, guide them safely).\n"
        f"Active User Dashboard Persona/Role: {payload.role}\n"
        f"Active Scenario: {payload.scenario}\n"
        f"Current Timeline Stage: {payload.phase}\n"
        f"Active Incidents: {[inc.dict() for inc in state.incidents] if state else []}\n"
        f"Active AI Recommendations: {[rec.dict() for rec in state.recommendations] if state else []}\n"
        f"Current Weather: {state.weather.dict() if state else {}}\n"
        f"Current Transportation Platform Load: {state.transport.platform_load if state else ''}\n"
        f"Full Stadium State JSON: {state_json}\n"
        "Keep responses short, clear, professional, and matching the user's dashboard persona."
    )
    
    # Build conversation content including history
    contents = []
    # Add history (limit to last 6 messages to keep it short)
    for msg in payload.history[-6:]:
        role = "user" if msg.get("sender") == "user" else "model"
        contents.append({"role": role, "parts": [msg.get("text", "")]})
        
    # Append the current query
    contents.append({"role": "user", "parts": [payload.query]})
    
    try:
        if gemini_client.client:
            config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.7,
                max_output_tokens=150
            )
            response = gemini_client.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=contents,
                config=config
            )
            reply = response.text or "I'm checking the stadium logs but couldn't get a response. Please try again."
        else:
            raise Exception("Gemini client is offline")
    except Exception as e:
        logger.error(f"Chatbot Gemini call failed: {str(e)}")
        # Graceful fallback response
        query_lower = payload.query.lower()
        if "seat" in query_lower:
            reply = f"According to your virtual companion, your seat is in Sector 104, Row GG, Seat 14. Follow the signs to Portal 104 in Concourse B."
        elif "food" in query_lower or "eat" in query_lower or "halal" in query_lower:
            reply = f"Since your preference is set to Halal food, we recommend Lusail Grill at Concourse B (queue time: 4 mins). Green Pitch Salad Bar is also nearby."
        elif "metro" in query_lower or "transport" in query_lower or "leave" in query_lower:
            reply = f"The Doha Metro platform is currently at {state.transport.platform_load if state else '35%'} capacity. Status: {state.transport.metro_status if state else 'Normal'}."
        else:
            reply = f"I've processed your query '{payload.query}' against our live sensor telemetry. All systems are reporting nominal status under scenario '{payload.scenario}'."

    return {"reply": reply}


class IncidentCreateRequest(BaseModel):
    location: str
    type: str
    status: str
    severity: str

@router.post("/stadium/incidents")
async def add_incident(payload: IncidentCreateRequest):
    new_inc = manager.add_incident(
        location=payload.location,
        incident_type=payload.type,
        status=payload.status,
        severity=payload.severity
    )
    return new_inc

@router.post("/stadium/incidents/{incident_id}/resolve")
async def resolve_incident(incident_id: str):
    manager.resolve_incident(incident_id)
    return {"status": "success", "resolved": incident_id}

class LockToggleRequest(BaseModel):
    lock_key: str
    status: bool

@router.post("/stadium/security/locks")
async def toggle_lock(payload: LockToggleRequest):
    manager.toggle_lock(payload.lock_key, payload.status)
    return {"status": "success", "lock_key": payload.lock_key, "value": payload.status}

class ToggleTaskRequest(BaseModel):
    task_id: str

@router.post("/stadium/volunteer/tasks/toggle")
async def toggle_task(payload: ToggleTaskRequest):
    manager.toggle_task(payload.task_id)
    return {"status": "success", "task_id": payload.task_id}

class TogglePatrolRequest(BaseModel):
    patrol_id: str

@router.post("/stadium/security/patrols/toggle")
async def toggle_patrol(payload: TogglePatrolRequest):
    manager.toggle_patrol(payload.patrol_id)
    return {"status": "success", "patrol_id": payload.patrol_id}

@router.post("/stadium/organizer/approve-protocol")
async def approve_protocol():
    msg = manager.approve_protocol()
    return {"status": "success", "message": msg}

class VoiceRequest(BaseModel):
    role: str
    transcript: str

@router.post("/stadium/voice-command")
async def process_voice_command(payload: VoiceRequest):
    """
    Process spoken voice transcripts from medical, volunteer, or security dashboards.
    Sends them to Gemini for structured triage analysis.
    """
    from app.services.ai.gemini_client import gemini_client
    
    system_instruction = (
        "You are the FIFA Smart Stadium Voice Dispatch Assistant.\n"
        "Analyze the user's spoken voice transcript and output a JSON object matching this schema exactly:\n"
        "{\n"
        "  \"summary\": \"Short title of the report\",\n"
        "  \"priority\": \"Low\" | \"High\" | \"Critical\",\n"
        "  \"action\": \"Actionable resolution steps\",\n"
        "  \"volunteers\": \"Assigned squads or resources\",\n"
        "  \"resolution\": \"Estimated time, e.g. 4 mins\"\n"
        "}\n"
        f"The user role/context is: {payload.role}"
    )
    
    fallback = {
        "summary": "Voice triage report",
        "priority": "Low",
        "action": f"Action logged: {payload.transcript}",
        "volunteers": "Pending assignment",
        "resolution": "5 mins"
    }
    
    trans_lower = payload.transcript.lower()
    if payload.role == "medical":
        if "restock" in trans_lower or "post 2" in trans_lower:
            fallback = {
                "summary": "Medical inventory restock Post 2",
                "priority": "Low",
                "action": "Update inventory check lists. No further action needed.",
                "volunteers": "Medical Inventory logs",
                "resolution": "1 min"
            }
        elif "heat" in trans_lower or "dizzy" in trans_lower:
            fallback = {
                "summary": "Heat distress Sector 104",
                "priority": "High",
                "action": "Dispatch Team Alpha to Sector 104 GG-14 with hydration packs.",
                "volunteers": "Team Alpha",
                "resolution": "3 mins"
            }
    elif payload.role == "volunteer":
        if "gate 5" in trans_lower or "congestion" in trans_lower:
            fallback = {
                "summary": "Spectator queue blockage Gate 5",
                "priority": "High",
                "action": "Direct Volunteer squad Gamma to open reserve queue lines.",
                "volunteers": "Squad Gamma (3 staff available)",
                "resolution": "4 mins"
            }
    elif payload.role == "security":
        if "package" in trans_lower or "gate 12" in trans_lower:
            fallback = {
                "summary": "Suspicious unattended package Gate 12",
                "priority": "Critical",
                "action": "Dispatch security squad Delta. Secure perimeter.",
                "volunteers": "Squad Delta (4 officers)",
                "resolution": "5 mins"
            }
            
    try:
        if gemini_client.client:
            config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.2,
                response_mime_type="application/json"
            )
            response = gemini_client.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[payload.transcript],
                config=config
            )
            import json
            reply_dict = json.loads(response.text)
        else:
            raise Exception("Gemini client offline")
    except Exception as e:
        logger.error(f"Voice triage call failed: {str(e)}")
        reply_dict = fallback
        
    return reply_dict
