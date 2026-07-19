from typing import List, Dict, Any
from app.models.stadium_state import Recommendation
from app.services.ai.gemini_client import gemini_client
from app.services.ai.prompts import MEDICAL_SYSTEM, MEDICAL_TEMPLATE
from app.services.ai.base_agent import BaseAgent
import time
import logging

logger = logging.getLogger("uvicorn")

class MedicalAgent(BaseAgent):
    def analyze(self, scenario: str, state: Dict[str, Any] = None) -> Dict[str, Any]:
        return {
            "agent": "Medical AI",
            "active_rules": "Triage Priority dispatch",
            "telemetry_link": "First aid status check"
        }

    def recommend(self, scenario: str, state: Dict[str, Any] = None, phase: str = "Warmup") -> List[Recommendation]:
        timestamp = time.strftime("%H:%M:%S")
        
        fallback_map = {
            "Normal Match": {
                "summary": "Triage Alert: Heat Exhaustion (Sector 104)",
                "reasoning": "Spectator reports dizziness under closed roof environment. Team Alpha has hydration kit and is closest to concourse B.",
                "confidence": 0.92,
                "recommended_actions": ["Dispatch Team Alpha.", "Handout rehydration salts."],
                "priority": "Low",
                "estimated_impact": "Provide hydration first-aid care",
                "estimated_resolution_time": "5 mins",
                "trigger_telemetry": "Heat index sensors active Concourse B",
                "risk_if_ignored": "Spectator symptom severity increases"
            },
            "Goal Scored": {
                "summary": "Monitor celebrant safety stands",
                "reasoning": "Celebration active in stands. Standing rails checked.",
                "confidence": 0.92,
                "recommended_actions": ["Keep medical teams Alpha & Beta on standby.", "Update active triage grids."],
                "priority": "Low",
                "estimated_impact": "Ensure medical dispatch readiness",
                "estimated_resolution_time": "10 mins",
                "trigger_telemetry": "Stands decibel levels: 112dB",
                "risk_if_ignored": "Delayed response to potential standing rail fall injuries"
            },
            "Halftime Rush": {
                "summary": "Deploy first-aid kits Concourse B",
                "reasoning": "Halftime rush active. Crowds at concession stands. Slip risk is low but active.",
                "confidence": 0.93,
                "recommended_actions": ["Send volunteer guides to assist.", "Check First Aid Kit supplies Concourse B."],
                "priority": "Low",
                "estimated_impact": "Fast first-aid kit accessibility",
                "estimated_resolution_time": "10 mins",
                "trigger_telemetry": "Restroom queue lines: Peak",
                "risk_if_ignored": "First aid kit accessibility delayed"
            },
            "Heavy Rain": {
                "summary": "Triage Alert: Plaza Gate 8 Minor Injury",
                "reasoning": "Slippage telemetry sensors active at outer Plaza. Team Beta is positioned nearest to North ramp.",
                "confidence": 0.94,
                "recommended_actions": ["Dispatch Team Beta with splint kits.", "Monitor slippery surface telemetry."],
                "priority": "High",
                "estimated_impact": "Treat minor slip injuries at Plaza Gate 8",
                "estimated_resolution_time": "6 mins",
                "trigger_telemetry": "Plaza Gate 8 slip sensors: Active",
                "risk_if_ignored": "Slippage victim delay in receiving first aid"
            },
            "Metro Delay": {
                "summary": "Metro platform wait triage check",
                "reasoning": "Transit platforms congested (98% load). Crowd heat index check en-route.",
                "confidence": 0.94,
                "recommended_actions": ["Send hydration teams to Metro platform waiting queues.", "Monitor queue density."],
                "priority": "High",
                "estimated_impact": "Provide hydration cups to waiting queue crowd",
                "estimated_resolution_time": "8 mins",
                "trigger_telemetry": "Platform load Mat: 98%",
                "risk_if_ignored": "Heat exhaustion in congested queues"
            },
            "Medical Emergency": {
                "summary": "Critical Triage: Cardiac Distress (Sector 104)",
                "reasoning": "Patient reports radiating arm pain. Sector 104 location is closest to First Aid Post 1. Team Alpha has AED device.",
                "confidence": 0.98,
                "recommended_actions": ["Dispatch Team Alpha.", "Unlock elevator VIP-1 overrides.", "Sound emergency alert."],
                "priority": "Critical",
                "estimated_impact": "Deliver immediate defibrillation/AED care",
                "estimated_resolution_time": "3 mins",
                "trigger_telemetry": "Cardiac incident ticket Sector 104",
                "risk_if_ignored": "Severe cardiac arrest outcome due to delay"
            },
            "Fire Emergency": {
                "summary": "Emergency Triage: Concourse Smoke Inhalation",
                "reasoning": "Sector D fire alarms registered. Egress evacuation flows will divert smoke-exposed guests to main medical post.",
                "confidence": 0.99,
                "recommended_actions": ["Prepare oxygen posts.", "Standby medical posts 1, 2, and ambulance loops."],
                "priority": "Critical",
                "estimated_impact": "Stabilize smoke inhalation cases",
                "estimated_resolution_time": "15 mins",
                "trigger_telemetry": "Smoke alarms concourse Level D: Active",
                "risk_if_ignored": "Smoke inhalation respiratory failure"
            },
            "Gate Congestion": {
                "summary": "Dehydration triage checks: Gate 12 entry line",
                "reasoning": "Gate 12 scanning throughput delayed. Waiting queues in outdoor sun. Minor dehydration risk.",
                "confidence": 0.91,
                "recommended_actions": ["Direct auxiliary guides to hand out water bottles.", "Keep Team Gamma en-route."],
                "priority": "High",
                "estimated_impact": "Avert heat distress in entry waiting lines",
                "estimated_resolution_time": "8 mins",
                "trigger_telemetry": "Entry scans: Bottlenecked",
                "risk_if_ignored": "Spectators faint due to outdoor queue dehydration"
            },
            "Power Failure": {
                "summary": "Auxiliary medical station lighting active",
                "reasoning": "Substation grid offline. Station backup battery active. Emergency medical posts en-route.",
                "confidence": 0.95,
                "recommended_actions": ["Activate medical backup torches.", "Ensure evacuation paths remain clear."],
                "priority": "High",
                "estimated_impact": "Keep emergency medical post illuminated",
                "estimated_resolution_time": "10 mins",
                "trigger_telemetry": "Power grid voltage: 0V",
                "risk_if_ignored": "Triage treatments delayed in dark rooms"
            },
            "VIP Arrival": {
                "summary": "VIP medical convoy corridor check",
                "reasoning": "VIP convoy en route. Escort medical check cleared.",
                "confidence": 0.96,
                "recommended_actions": ["Clear Presidential suite lift route.", "Ensure medical escort team en-route."],
                "priority": "Medium",
                "estimated_impact": "Escort path clear check completed",
                "estimated_resolution_time": "6 mins",
                "trigger_telemetry": "VIP arrival convoy trigger: Active",
                "risk_if_ignored": "Convoy delay en route"
            }
        }

        fallback = fallback_map.get(scenario, fallback_map["Normal Match"])

        prompt = MEDICAL_TEMPLATE.format(
            scenario=scenario,
            symptoms="Cardiac distress" if scenario == "Medical Emergency" else "Mild Heat Exhaustion",
            location="Sector 104 Row GG",
            teams_avail=3
        )

        ai_data = gemini_client.generate_explainable_ai(
            prompt=prompt,
            system_instruction=MEDICAL_SYSTEM,
            fallback_response=fallback
        )

        actions = ai_data.get("recommended_actions", fallback["recommended_actions"])
        rec_actions_str = " | ".join(actions)

        return [
            Recommendation(
                id="rec-med-gen",
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
        return "Medical standby ready."

medical_agent = MedicalAgent()

def get_medical_recommendations(scenario: str, phase: str = "Warmup") -> List[Recommendation]:
    return medical_agent.recommend(scenario, phase=phase)
