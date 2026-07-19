from typing import List, Dict, Any
from app.models.stadium_state import Recommendation
from app.services.ai.gemini_client import gemini_client
from app.services.ai.prompts import SECURITY_SYSTEM, SECURITY_TEMPLATE
from app.services.ai.base_agent import BaseAgent
import time
import logging

logger = logging.getLogger("uvicorn")

class SecurityAgent(BaseAgent):
    def analyze(self, scenario: str, state: Dict[str, Any] = None) -> Dict[str, Any]:
        return {
            "agent": "Security AI",
            "active_rules": "Corridor Lock override",
            "telemetry_link": "Gate turnstiles checks"
        }

    def recommend(self, scenario: str, state: Dict[str, Any] = None, phase: str = "Warmup") -> List[Recommendation]:
        timestamp = time.strftime("%H:%M:%S")
        
        fallback_map = {
            "Normal Match": {
                "summary": "Direct Sector B ramp crowd flow",
                "reasoning": "Ramp telemetry flow sensors indicate spectator crowd velocity is decreasing.",
                "confidence": 0.88,
                "recommended_actions": ["Divert spectator flow via Portal 106 signs."],
                "priority": "Low",
                "estimated_impact": "Restore nominal ramp flow speed.",
                "estimated_resolution_time": "10 mins",
                "trigger_telemetry": "Ramp velocity index: Nominal",
                "risk_if_ignored": "Minor ramp queuing backups"
            },
            "Goal Scored": {
                "summary": "Goal Scored: Monitor Standcelebration boundaries",
                "reasoning": "Goal scored. Strobe lights active. Celebrations peaking in stands.",
                "confidence": 0.93,
                "recommended_actions": ["Keep stairs clear during celebration.", "Ensure standing rails are secured."],
                "priority": "Medium",
                "estimated_impact": "Avert front rail spectator pushes",
                "estimated_resolution_time": "5 mins",
                "trigger_telemetry": "Pitch scoring sensor active",
                "risk_if_ignored": "Stairwell crowd surges"
            },
            "Halftime Rush": {
                "summary": "Halftime Concourse B Queue Guidance",
                "reasoning": "Halftime break started. Restrooms Concourse B occupancy at 98%. Spectators crowding snack bars.",
                "confidence": 0.94,
                "recommended_actions": ["Direct spectators to Concourse C family restrooms.", "Guide visitors to shorter Green Salad line."],
                "priority": "High",
                "estimated_impact": "Reduce restroom waiting bottleneck by 25%",
                "estimated_resolution_time": "8 mins",
                "trigger_telemetry": "Restroom pressure mats: 98%",
                "risk_if_ignored": "High hallway queue density"
            },
            "Heavy Rain": {
                "summary": "Direct Fans to Covered Portal 108 Walkways",
                "reasoning": "Moisture sensors show wet concrete friction co-efficient below safety threshold. Directing crowd via covered Portal 108 bypasses slick plaza stairs.",
                "confidence": 0.96,
                "recommended_actions": ["Divert crowd flow to portal 108 covered corridors.", "Wear high-visibility ponchos."],
                "priority": "High",
                "estimated_impact": "Bypass plaza slip hazard surfaces",
                "estimated_resolution_time": "10 mins",
                "trigger_telemetry": "Plaza moisture sensors: Wet",
                "risk_if_ignored": "High slips and falls risk"
            },
            "Metro Delay": {
                "summary": "Retain Exit Gates in Holding State",
                "reasoning": "Platform pressure mats exceed 94% queue density. Uncontrolled egress will generate crushing risks at escalators.",
                "confidence": 0.97,
                "recommended_actions": ["Halt West plaza turnstile releases.", "Shift announcements to platform status."],
                "priority": "High",
                "estimated_impact": "Avert platform escalator queuing bottlenecks",
                "estimated_resolution_time": "15 mins",
                "trigger_telemetry": "Platform mats capacity: 94%",
                "risk_if_ignored": "Metro platform crushing danger"
            },
            "Medical Emergency": {
                "summary": "Clear Escalator Path for First Aid Post 1",
                "reasoning": "Medical Team Alpha dispatched to Sector 104 Row GG. Clearance of escalator avoids responder transit delay.",
                "confidence": 0.98,
                "recommended_actions": ["Clear escalator walkway.", "Keep spectators moving to stairs."],
                "priority": "Critical",
                "estimated_impact": "Save en route transit emergency time",
                "estimated_resolution_time": "5 mins",
                "trigger_telemetry": "Responder en route track active",
                "risk_if_ignored": "Responder delayed reaching emergency area"
            },
            "Fire Emergency": {
                "summary": "EMERGENCY OVERRIDE: Unlock Security Doors",
                "reasoning": "Critical heat reading on sensor 44 (58°C). Evacuation script automatically locks lifts and releases fire gate overrides.",
                "confidence": 1.00,
                "recommended_actions": ["Verify all electromagnetic lock releases.", "Halt suite elevators."],
                "priority": "Critical",
                "estimated_impact": "Evacuation exits electromagnetic release",
                "estimated_resolution_time": "3 mins",
                "trigger_telemetry": "Heat sensor: 58°C",
                "risk_if_ignored": "Emergency escape paths locked"
            },
            "Gate Congestion": {
                "summary": "Divert Gate 12 entry lines to Gate 10",
                "reasoning": "Gate 12 scanning throughput bottlenecked. Queue wait times growing in plaza.",
                "confidence": 0.92,
                "recommended_actions": ["Direct arriving guests to Gate 10 entry.", "Assist guests with ticket display brightness."],
                "priority": "High",
                "estimated_impact": "Direct 40% traffic to alternative gate",
                "estimated_resolution_time": "8 mins",
                "trigger_telemetry": "Gate 12 ticket scans: Delayed",
                "risk_if_ignored": "Plaza queue overcrowding"
            },
            "Power Failure": {
                "summary": "Power Grid Failure: Lockout Lifts & Secure Corridors",
                "reasoning": "Substation grid power failure. Stadium backup batteries have activated exit signs. Lifts lockout active.",
                "confidence": 0.95,
                "recommended_actions": ["Secure Presidential corridor.", "Halt lift usage. Keep concourses clear."],
                "priority": "High",
                "estimated_impact": "Lockout vertical transit lifts to prevent trapping",
                "estimated_resolution_time": "12 mins",
                "trigger_telemetry": "Substation grid: Off",
                "risk_if_ignored": "Elevator passenger trapping and panic"
            },
            "VIP Arrival": {
                "summary": "Lockout Presidential Suite Elevator Gates",
                "reasoning": "VIP convoy transit tracker has entered gate 1 tunnel. Standard secure corridor protocol requirements.",
                "confidence": 0.96,
                "recommended_actions": ["Activate elevator VIP-1 lockouts.", "Clear secure corridor tunnel."],
                "priority": "Medium",
                "estimated_impact": "Isolate elevator shaft for VIP delegation",
                "estimated_resolution_time": "6 mins",
                "trigger_telemetry": "VIP convoy gate entrance sensor",
                "risk_if_ignored": "Unauthorized access to Presidential corridor"
            }
        }

        fallback = fallback_map.get(scenario, fallback_map["Normal Match"])

        prompt = SECURITY_TEMPLATE.format(
            scenario=scenario,
            critical_zones=2 if scenario == "Fire Emergency" else 1,
            locks="VIP Lift: Locked, South Ramp: Locked"
        )

        ai_data = gemini_client.generate_explainable_ai(
            prompt=prompt,
            system_instruction=SECURITY_SYSTEM,
            fallback_response=fallback
        )

        actions = ai_data.get("recommended_actions", fallback["recommended_actions"])
        rec_actions_str = " | ".join(actions)

        return [
            Recommendation(
                id="rec-sec-gen",
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
        return "Perimeter secure."

security_agent = SecurityAgent()

def get_security_recommendations(scenario: str, phase: str = "Warmup") -> List[Recommendation]:
    return security_agent.recommend(scenario, phase=phase)
