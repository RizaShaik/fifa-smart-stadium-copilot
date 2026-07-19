from typing import List, Dict, Any
from app.models.stadium_state import Recommendation
from app.services.ai.gemini_client import gemini_client
from app.services.ai.prompts import ACCESSIBILITY_SYSTEM, ACCESSIBILITY_TEMPLATE
from app.services.ai.base_agent import BaseAgent
import time
import logging

logger = logging.getLogger("uvicorn")

class AccessibilityAgent(BaseAgent):
    def analyze(self, scenario: str, state: Dict[str, Any] = None) -> Dict[str, Any]:
        return {
            "agent": "Accessibility AI",
            "active_rules": "Elevator lock overrides",
            "telemetry_link": "Stands ADA pathways"
        }

    def recommend(self, scenario: str, state: Dict[str, Any] = None, phase: str = "Warmup") -> List[Recommendation]:
        timestamp = time.strftime("%H:%M:%S")
        
        fallback_map = {
            "Medical Emergency": {
                "summary": "Clear Elevator VIP-1 for Responder access",
                "reasoning": "First aid team needs elevator path cleared to reach Sector 104 patient.",
                "confidence": 0.98,
                "recommended_actions": ["Restrict VIP elevator 1 for medical use.", "Guide spectators to escalators."],
                "priority": "High",
                "estimated_impact": "Reduce first-responder transit delay by 120 seconds",
                "estimated_resolution_time": "5 mins",
                "trigger_telemetry": "Medical Team Alpha en route VIP-1",
                "risk_if_ignored": "Responder en route blockages and triage delays"
            },
            "Fire Alarm": {
                "summary": "Halt Lifts; Open Ground Level Wheelchair Exits",
                "reasoning": "Elevator operations automatically locked by fire panel. Divert ADA guests to perimeter ramps.",
                "confidence": 1.00,
                "recommended_actions": ["Direct ADA guests to ramps 2 and 4.", "Deploy volunteer access guides."],
                "priority": "Critical",
                "estimated_impact": "Evacuate ADA spectators safely via ground access ramps",
                "estimated_resolution_time": "15 mins",
                "trigger_telemetry": "Fire panel lift lockout: Active",
                "risk_if_ignored": "ADA guests trapped in lift shafts during fire hazard"
            }
        }
        
        fallback = fallback_map.get(scenario, {
            "summary": "Nominal wheelchair path conditions active",
            "reasoning": "All elevator lifts and sensor ramps are operational.",
            "confidence": 0.95,
            "recommended_actions": ["Monitor ramp entry telemetry."],
            "priority": "Low",
            "estimated_impact": "ADA guest pathways clear",
            "estimated_resolution_time": "5 mins",
            "trigger_telemetry": "Lift diagnostics: nominal",
            "risk_if_ignored": "Minor ramp queues"
        })

        prompt = ACCESSIBILITY_TEMPLATE.format(
            scenario=scenario,
            stands="North: 91%, South: 89%, East: 93%, West: 94%"
        )

        ai_data = gemini_client.generate_explainable_ai(
            prompt=prompt,
            system_instruction=ACCESSIBILITY_SYSTEM,
            fallback_response=fallback
        )

        actions = ai_data.get("recommended_actions", fallback["recommended_actions"])
        rec_actions_str = " | ".join(actions)

        return [
            Recommendation(
                id="rec-access-gen",
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
        return "Ramps clear."

accessibility_agent = AccessibilityAgent()

def get_accessibility_recommendations(scenario: str, phase: str = "Warmup") -> dict:
    recs = accessibility_agent.recommend(scenario, phase=phase)
    if recs:
        rec = recs[0]
        return {
            "summary": rec.title,
            "reasoning": rec.reason,
            "confidence": float(rec.confidence / 100.0),
            "recommended_actions": rec.recommendedAction.split(" | "),
            "priority": rec.priority,
            "estimated_impact": rec.expectedImpact,
            "estimated_resolution_time": rec.estimatedResolutionTime,
            "trigger_telemetry": rec.trigger_telemetry,
            "risk_if_ignored": rec.risk_if_ignored
        }
    return {}
