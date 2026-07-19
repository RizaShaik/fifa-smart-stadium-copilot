from typing import List, Dict, Any
from app.models.stadium_state import Recommendation
from app.services.ai.gemini_client import gemini_client
from app.services.ai.prompts import VOLUNTEER_SYSTEM, VOLUNTEER_TEMPLATE
from app.services.ai.base_agent import BaseAgent
import time
import logging

logger = logging.getLogger("uvicorn")

class VolunteerAgent(BaseAgent):
    def analyze(self, scenario: str, state: Dict[str, Any] = None) -> Dict[str, Any]:
        return {
            "agent": "Volunteer AI",
            "active_rules": "Task Queue Management",
            "telemetry_link": "Checklists en-route"
        }

    def recommend(self, scenario: str, state: Dict[str, Any] = None, phase: str = "Warmup") -> List[Recommendation]:
        timestamp = time.strftime("%H:%M:%S")
        
        fallback_map = {
            "Normal Match": {
                "summary": "Guide Visitors near Gate 12 Entrance",
                "reasoning": "Flow telemetry indicates ticket scan rate is dipping. Volunteer presence assists ticket validation speed.",
                "confidence": 0.92,
                "recommended_actions": ["Assist scan validations at Gate 12.", "Check screen brightness."],
                "priority": "Low",
                "estimated_impact": "Speed scan validation rate by 15%",
                "estimated_resolution_time": "10 mins",
                "trigger_telemetry": "Scans/min: 1350",
                "risk_if_ignored": "Arriving fans experience minor delays"
            },
            "Goal Scored": {
                "summary": "Monitor celebrant clusters stands",
                "reasoning": "Goal registered. Strobe lights active. Celebrations peaking in stands.",
                "confidence": 0.93,
                "recommended_actions": ["Keep stairs clear during celebration.", "Ensure standing rails are secured."],
                "priority": "Medium",
                "estimated_impact": "Ensure celebratory crowd safety compliance",
                "estimated_resolution_time": "5 mins",
                "trigger_telemetry": "Stand decibels: 112dB",
                "risk_if_ignored": "Stairwell congestion and minor falls"
            },
            "Halftime Rush": {
                "summary": "Halftime Concourse B Queue Guidance",
                "reasoning": "Halftime break started. Restrooms Concourse B occupancy at 98%. Spectators crowding snack bars.",
                "confidence": 0.94,
                "recommended_actions": ["Direct spectators to Concourse C family restrooms.", "Guide visitors to shorter Green Salad line."],
                "priority": "High",
                "estimated_impact": "Disperse Concourse restroom queues by 25%",
                "estimated_resolution_time": "8 mins",
                "trigger_telemetry": "Restroom occupancy B: 98%",
                "risk_if_ignored": "Severe queue wait bottlenecks"
            },
            "Heavy Rain": {
                "summary": "Direct Fans to Covered Portal 108 Walkways",
                "reasoning": "Moisture sensors show wet concrete friction co-efficient below safety threshold. Directing crowd via covered Portal 108 bypasses slick plaza stairs.",
                "confidence": 0.96,
                "recommended_actions": ["Divert crowd flow to portal 108 covered corridors.", "Wear high-visibility ponchos."],
                "priority": "High",
                "estimated_impact": "Completely bypass outdoor wet stairs",
                "estimated_resolution_time": "10 mins",
                "trigger_telemetry": "Friction coefficient: Low",
                "risk_if_ignored": "High visitor slips and falls"
            },
            "Metro Delay": {
                "summary": "Hold Spectators in Plaza Concessions Area",
                "reasoning": "Transit platform queue wait exceeded 30 minutes. Retaining spectators in food court prevents platform crowding.",
                "confidence": 0.94,
                "recommended_actions": ["Hold spectator exit rate.", "Offer concessions discount tokens."],
                "priority": "High",
                "estimated_impact": "Prevent passenger queuing bottleneck",
                "estimated_resolution_time": "15 mins",
                "trigger_telemetry": "Metro platform wait: 35 mins",
                "risk_if_ignored": "Escalator gate crowd crushing hazard"
            },
            "Medical Emergency": {
                "summary": "Clear Escalator Path for First Aid Post 1",
                "reasoning": "Medical Team Alpha dispatched to Sector 104 Row GG. Clearance of escalator avoids responder transit delay.",
                "confidence": 0.98,
                "recommended_actions": ["Clear escalator walkway.", "Keep spectators moving to stairs."],
                "priority": "Critical",
                "estimated_impact": "Save 120s transit responder route time",
                "estimated_resolution_time": "5 mins",
                "trigger_telemetry": "Active medical dispatch logged",
                "risk_if_ignored": "Responder delayed reaching emergency area"
            },
            "Fire Emergency": {
                "summary": "EMERGENCY: Open Evacuation Exits 2 & 4",
                "reasoning": "Emergency evacuation protocol activated by fire alarm. Egress override protocol releasing locks.",
                "confidence": 1.00,
                "recommended_actions": ["Direct crowd towards outer gates.", "Check elevators for lock state."],
                "priority": "Critical",
                "estimated_impact": "Rapid safe evacuation exit",
                "estimated_resolution_time": "15 mins",
                "trigger_telemetry": "Fire alarm code 44 sensor",
                "risk_if_ignored": "Evacuation path blockage and panic"
            },
            "Gate Congestion": {
                "summary": "Redirect scan lines to Gate 10",
                "reasoning": "Gate 12 scanning throughput bottlenecked. Queue wait times growing in plaza.",
                "confidence": 0.92,
                "recommended_actions": ["Direct arriving guests to Gate 10 entry.", "Assist guests with ticket display brightness."],
                "priority": "High",
                "estimated_impact": "Divert 40% entry traffic, reduce delays",
                "estimated_resolution_time": "8 mins",
                "trigger_telemetry": "Gate 12 scans/min: 90",
                "risk_if_ignored": "Ticketing queue backups and lobby congestion"
            },
            "Power Failure": {
                "summary": "Direct fans to stay seated. Keep paths clear.",
                "reasoning": "Power grid offline. Emergency backup lighting active. Elevators are locked out.",
                "confidence": 0.95,
                "recommended_actions": ["Guide visitors away from dark stairwells.", "Halt lift usage. Keep concourses clear."],
                "priority": "High",
                "estimated_impact": "Prevent stairwell slips in dark environments",
                "estimated_resolution_time": "12 mins",
                "trigger_telemetry": "Substation status: Off",
                "risk_if_ignored": "Panic and staircase bottlenecks"
            },
            "VIP Arrival": {
                "summary": "Clear secure corridor for VIP convoy",
                "reasoning": "VIP convoy en route. Secure corridor and elevator overrides en route.",
                "confidence": 0.96,
                "recommended_actions": ["Direct public away from Presidential suite elevator.", "Assist with corridor sweeps."],
                "priority": "Medium",
                "estimated_impact": "Verify delegation route clear",
                "estimated_resolution_time": "6 mins",
                "trigger_telemetry": "VIP escort protocol active",
                "risk_if_ignored": "VIP pathway access delays"
            }
        }

        fallback = fallback_map.get(scenario, fallback_map["Normal Match"])

        prompt = VOLUNTEER_TEMPLATE.format(
            scenario=scenario,
            tasks="Concourse guides, ticket help",
            staff_count=8
        )

        ai_data = gemini_client.generate_explainable_ai(
            prompt=prompt,
            system_instruction=VOLUNTEER_SYSTEM,
            fallback_response=fallback
        )

        actions = ai_data.get("recommended_actions", fallback["recommended_actions"])
        rec_actions_str = " | ".join(actions)

        return [
            Recommendation(
                id="rec-vol-gen",
                title=ai_data.get("summary", fallback["summary"]),
                description=ai_data.get("summary", fallback["summary"]),
                reason=ai_data.get("reasoning", fallback["reasoning"]),
                confidence=int(ai_data.get("confidence", fallback["confidence"]) * 100) if ai_data.get("confidence", fallback["confidence"]) <= 1.0 else int(ai_data.get("confidence", fallback["confidence"])),
                priority=ai_data.get("priority", fallback["priority"]),
                expectedImpact=ai_data.get("estimated_impact", fallback["estimated_impact"]),
                estimatedResolutionTime=ai_data.get("estimated_resolution_time", fallback["estimated_resolution_time"]),
                affectedZones=["North Stand"],
                recommendedAction=rec_actions_str,
                timestamp=timestamp,
                status="Active",
                trigger_telemetry=ai_data.get("trigger_telemetry", fallback["trigger_telemetry"]),
                risk_if_ignored=ai_data.get("risk_if_ignored", fallback["risk_if_ignored"])
            )
        ]

    def summarize(self, scenario: str, state: Dict[str, Any] = None, phase: str = "Warmup") -> str:
        recs = self.recommend(scenario, state, phase)
        if recs:
            return recs[0].description
        return "Volunteer tasks clear."

volunteer_agent = VolunteerAgent()

def get_volunteer_suggestions(scenario: str, phase: str = "Warmup") -> List[Recommendation]:
    return volunteer_agent.recommend(scenario, phase=phase)
