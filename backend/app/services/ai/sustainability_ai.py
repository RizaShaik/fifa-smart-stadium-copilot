from typing import List, Dict, Any
from app.models.stadium_state import Recommendation
from app.services.ai.gemini_client import gemini_client
from app.services.ai.prompts import SUSTAINABILITY_SYSTEM, SUSTAINABILITY_TEMPLATE
from app.services.ai.base_agent import BaseAgent
import time
import logging

logger = logging.getLogger("uvicorn")

class SustainabilityAgent(BaseAgent):
    def analyze(self, scenario: str, state: Dict[str, Any] = None) -> Dict[str, Any]:
        return {
            "agent": "Sustainability AI",
            "active_rules": "HVAC compressor cycle limits",
            "telemetry_link": "Grid energy saved metrics"
        }

    def recommend(self, scenario: str, state: Dict[str, Any] = None, phase: str = "Warmup") -> List[Recommendation]:
        timestamp = time.strftime("%H:%M:%S")
        
        fallback_map = {
            "Heavy Rain": {
                "summary": "Optimize Climate Control Roof Ventilation",
                "reasoning": "Roof closed. Set HVAC filters to ambient recirculate to save 12% power load.",
                "confidence": 0.94,
                "recommended_actions": ["Switch HVAC grids to eco mode.", "Close high-loss corridor vents."],
                "priority": "Medium",
                "estimated_impact": "Conserve 12% stadium cooling power load",
                "estimated_resolution_time": "10 mins",
                "trigger_telemetry": "Roof status: Closed, humidity: 88%",
                "risk_if_ignored": "High cooling power draw during closed dome operation"
            },
            "Fire Alarm": {
                "summary": "Cut Grid HVAC Loads on Evacuation Stands",
                "reasoning": "Evacuation active. Divert power loads away from stand cooling units to support emergency exits.",
                "confidence": 0.99,
                "recommended_actions": ["Halt cooling grid compressors.", "Lock secondary lighting panels."],
                "priority": "High",
                "estimated_impact": "Divert 4,500 kW electrical power to emergency evacuation systems",
                "estimated_resolution_time": "5 mins",
                "trigger_telemetry": "Fire alarm override command",
                "risk_if_ignored": "Overloaded backup generators during emergency evacuation"
            }
        }
        
        fallback = fallback_map.get(scenario, {
            "summary": "Metro transit reducing spectator car emissions",
            "reasoning": "Redirecting spectator shuttles by 12% via south loop during matches decreases diesel idle emissions by approximately 7.2%.",
            "confidence": 0.92,
            "recommended_actions": ["Promote Metro usage rewards program."],
            "priority": "Low",
            "estimated_impact": "Reduce diesel carbon footprint emissions by 7.2%",
            "estimated_resolution_time": "15 mins",
            "trigger_telemetry": "Spectator egress options: Metro choice eco",
            "risk_if_ignored": "Spectator traffic congestion and diesel emission peaks"
        })

        prompt = SUSTAINABILITY_TEMPLATE.format(
            scenario=scenario,
            hvac_load="Medium" if scenario == "Normal" else "High",
            energy_saved="12,000 kWh"
        )

        ai_data = gemini_client.generate_explainable_ai(
            prompt=prompt,
            system_instruction=SUSTAINABILITY_SYSTEM,
            fallback_response=fallback
        )

        actions = ai_data.get("recommended_actions", fallback["recommended_actions"])
        rec_actions_str = " | ".join(actions)

        return [
            Recommendation(
                id="rec-sustain-gen",
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
        return "Green grids eco-active."

sustainability_agent = SustainabilityAgent()

def get_sustainability_recommendations(scenario: str) -> dict:
    recs = sustainability_agent.recommend(scenario)
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
