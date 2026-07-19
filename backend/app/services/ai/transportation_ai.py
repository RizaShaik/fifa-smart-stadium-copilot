from typing import List, Dict, Any
from app.models.stadium_state import Recommendation
from app.services.ai.gemini_client import gemini_client
from app.services.ai.prompts import TRANSPORT_SYSTEM, TRANSPORT_TEMPLATE
from app.services.ai.base_agent import BaseAgent
import time
import logging

logger = logging.getLogger("uvicorn")

class TransportationAgent(BaseAgent):
    def analyze(self, scenario: str, state: Dict[str, Any] = None) -> Dict[str, Any]:
        return {
            "agent": "Transportation AI",
            "active_rules": "Platform Load optimization",
            "telemetry_link": "Doha Metro red line streams"
        }

    def recommend(self, scenario: str, state: Dict[str, Any] = None, phase: str = "Warmup") -> List[Recommendation]:
        timestamp = time.strftime("%H:%M:%S")
        
        fallback_map = {
            "Metro Delay": {
                "summary": "Avoid West Plaza Metro Exit Platform Delay",
                "reasoning": "Platform pressure mats exceed 94% queue density. Metro train frequency delayed by 8 mins.",
                "confidence": 0.97,
                "recommended_actions": ["Diverting passengers to Concourse Cafes.", "Announce shuttle buses loop B availability."],
                "priority": "High",
                "estimated_impact": "Reduce platform queue load density by 30%",
                "estimated_resolution_time": "15 mins",
                "trigger_telemetry": "Platform density: 94%",
                "risk_if_ignored": "Metro escalator bottlenecks and crushing risks"
            },
            "Heavy Rain": {
                "summary": "Increase Shuttle Loop Frequencies",
                "reasoning": "Plaza walkways are wet, increasing walking transit load times to shuttles.",
                "confidence": 0.93,
                "recommended_actions": ["Increase shuttle dispatch intervals.", "Announce covered concourse paths."],
                "priority": "High",
                "estimated_impact": "Maintain nominal shuttle passenger clearing speeds",
                "estimated_resolution_time": "10 mins",
                "trigger_telemetry": "Moisture levels: Wet plaza concrete",
                "risk_if_ignored": "Long queues exposed to rain"
            }
        }
        
        fallback = fallback_map.get(scenario, {
            "summary": "Nominal Metro platform intervals active",
            "reasoning": "Spectator egress rates match Lusail Red Line schedules.",
            "confidence": 0.88,
            "recommended_actions": ["Verify turnstile tap sensor indicators."],
            "priority": "Low",
            "estimated_impact": "Passenger egress clears within schedule parameters",
            "estimated_resolution_time": "5 mins",
            "trigger_telemetry": "Metro intervals: 2 mins",
            "risk_if_ignored": "Minor passenger lobby queuing"
        })

        prompt = TRANSPORT_TEMPLATE.format(
            scenario=scenario,
            platform_load="98% (Congested)" if scenario == "Metro Delay" else "35% (Clear)",
            options="Metro, Shuttle Loop A, Shuttle Loop B"
        )

        ai_data = gemini_client.generate_explainable_ai(
            prompt=prompt,
            system_instruction=TRANSPORT_SYSTEM,
            fallback_response=fallback
        )

        actions = ai_data.get("recommended_actions", fallback["recommended_actions"])
        rec_actions_str = " | ".join(actions)

        return [
            Recommendation(
                id="rec-trans-gen",
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
        return "Metro stable."

transportation_agent = TransportationAgent()

def get_transport_recommendations(scenario: str) -> dict:
    # Keeps backwards compatibility dictionary return format
    recs = transportation_agent.recommend(scenario)
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
