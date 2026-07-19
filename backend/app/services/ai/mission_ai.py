from typing import List, Dict, Any
from app.models.stadium_state import Recommendation
from app.services.ai.gemini_client import gemini_client
from app.services.ai.prompts import ORGANIZER_SYSTEM, ORGANIZER_TEMPLATE
from app.services.ai.base_agent import BaseAgent
import time
import logging

logger = logging.getLogger("uvicorn")

class OrganizerAgent(BaseAgent):
    def analyze(self, scenario: str, state: Dict[str, Any] = None) -> Dict[str, Any]:
        return {
            "agent": "Organizer AI",
            "active_rules": "Emergency Broadcast System" if scenario == "Fire Emergency" else "Crowd Flow Mitigation",
            "telemetry_link": "Stands crowd densities"
        }

    def recommend(self, scenario: str, state: Dict[str, Any] = None, phase: str = "Warmup") -> List[Recommendation]:
        timestamp = time.strftime("%H:%M:%S")
        
        fallback_map = {
            "Normal Match": {
                "summary": "Optimize Concourse B Egress Routes",
                "reasoning": "Sensor flow index: 42/min, queue time: 2 mins. Normal spectator peak flows. All channels clear.",
                "confidence": 0.88,
                "recommended_actions": ["Divert spectator flow via Portal 106 signs.", "Keep security checklists active."],
                "priority": "Low",
                "estimated_impact": "Reduce queue wait time below 2 minutes",
                "estimated_resolution_time": "10 mins",
                "trigger_telemetry": "Flow velocity index: 42/min",
                "risk_if_ignored": "Spectator comfort level drops slightly"
            },
            "Goal Scored": {
                "summary": "Activate Goal Celebration Strobe Protocol",
                "reasoning": "Audio sensor index: 112dB, Light levels: Nominal. Goal registered on pitch. North/East Stand celebrant clusters active.",
                "confidence": 0.94,
                "recommended_actions": ["Deploy Strobe Script 4 in ambient lighting controller.", "Sync stadium board displays."],
                "priority": "Medium",
                "estimated_impact": "Elevate spectator match experience and engagement",
                "estimated_resolution_time": "5 mins",
                "trigger_telemetry": "Audio sensor levels: 112dB",
                "risk_if_ignored": "Missed marketing/visual synchronization window"
            },
            "Halftime Rush": {
                "summary": "Deploy Concourse B auxiliary food staff",
                "reasoning": "Concourse restrooms reach 98% capacity rate. Concession queue wait times exceed 20 minutes.",
                "confidence": 0.93,
                "recommended_actions": ["Divert crowd to secondary concession stands.", "Open backup restrooms Concourse C."],
                "priority": "High",
                "estimated_impact": "Reduce concession waiting bottleneck by 35%",
                "estimated_resolution_time": "8 mins",
                "trigger_telemetry": "Restroom occupancy rate: 98%",
                "risk_if_ignored": "High concourse corridor congestion and customer friction"
            },
            "Heavy Rain": {
                "summary": "Close Stadium Roof & Open Covered Plaza Gates",
                "reasoning": "Roof moisture indicator: 88%, wind: 14km/h. Rain onset, temperature falling to 19°C. Match walking corridors slippery.",
                "confidence": 0.99,
                "recommended_actions": ["Trigger roof close command.", "Open Gate 8 covered pathway."],
                "priority": "High",
                "estimated_impact": "Keep spectator stands dry. Eliminate outdoor walkway slips.",
                "estimated_resolution_time": "8 mins",
                "trigger_telemetry": "Moisture indicator: 88%, wind: 14km/h",
                "risk_if_ignored": "High risk of spectator injuries and slips"
            },
            "Medical Emergency": {
                "summary": "Dispatch Medical Post 1 to Sector 104",
                "reasoning": "AED post telemetry connected, GPS tracker en-route. Medical Team Alpha dispatched to Sector 104 Row GG.",
                "confidence": 0.98,
                "recommended_actions": ["Dispatch post 1 responders.", "Open secure elevator VIP-1 overrides."],
                "priority": "Critical",
                "estimated_impact": "Provide immediate medical triage support",
                "estimated_resolution_time": "3 mins",
                "trigger_telemetry": "AED connection alert logged from Sector 104",
                "risk_if_ignored": "Critical delay in responder arrival"
            },
            "Fire Emergency": {
                "summary": "INITIATE FULL STADIUM EVACUATION",
                "reasoning": "Heat sensor 44: 58°C, smoke detectors: High. Rapid evacuation flow towards Gates 2, 4, 8.",
                "confidence": 1.00,
                "recommended_actions": ["Sound voice alarm EVAC-1.", "Unlock all turnstile exits."],
                "priority": "Critical",
                "estimated_impact": "Complete evacuation of 79,000 spectators",
                "estimated_resolution_time": "15 mins",
                "trigger_telemetry": "Heat sensor index: 58°C, smoke level: Critical",
                "risk_if_ignored": "Severe smoke inhalation and fire safety hazard"
            },
            "Gate Congestion": {
                "summary": "Divert Incoming Crowd to Gate 10 Turnstiles",
                "reasoning": "Gate 12 scanning throughput bottleneck detected (90 scans/min). Plaza waiting queues increasing.",
                "confidence": 0.91,
                "recommended_actions": ["Activate sign overrides directing fans to Gate 10.", "Send volunteer guides to Gate 12 entry."],
                "priority": "High",
                "estimated_impact": "Ease turnstile bottleneck. Reduce entry wait times.",
                "estimated_resolution_time": "10 mins",
                "trigger_telemetry": "Gate 12 scanning rate: 90 scans/min",
                "risk_if_ignored": "Plaza queue overcrowding and ticketing bottlenecks"
            },
            "Metro Delay": {
                "summary": "Redirect Crowd to Concessions & Suites Area",
                "reasoning": "Platform pressure mats: 94% cap, Egress: 80/min. Metro train frequency delayed by 8 mins.",
                "confidence": 0.97,
                "recommended_actions": ["Hold exit gates turnstiles.", "Display plaza food court vouchers on screens."],
                "priority": "High",
                "estimated_impact": "Reduce metro platform overcrowding",
                "estimated_resolution_time": "12 mins",
                "trigger_telemetry": "Platform occupancy load: 94%",
                "risk_if_ignored": "Platform passenger crushing risk"
            },
            "Power Failure": {
                "summary": "Activate Backup South Stand Generators",
                "reasoning": "Main substation telemetry: 0% power, Generator load: 12% capacity. Grid drop detected.",
                "confidence": 0.95,
                "recommended_actions": ["Engage south generators.", "Set stand cooling to low power mode."],
                "priority": "High",
                "estimated_impact": "Stabilize emergency electrical feeds and stand lighting",
                "estimated_resolution_time": "5 mins",
                "trigger_telemetry": "Main power line voltage: 0V",
                "risk_if_ignored": "Total black out and panic hazard in hallways"
            },
            "VIP Arrival": {
                "summary": "Activate Secure VIP Corridor Protocols",
                "reasoning": "Tunnel gate indicator: LOCKED, Lift status: Active. VIP convoy transit tracker has entered gate 1.",
                "confidence": 0.96,
                "recommended_actions": ["Deploy escort patrol.", "Lock lift VIP-A for public use."],
                "priority": "Medium",
                "estimated_impact": "Secure delegation transfer en route",
                "estimated_resolution_time": "6 mins",
                "trigger_telemetry": "VIP vehicle locator GPS en route",
                "risk_if_ignored": "Security breach in VIP corridor"
            }
        }

        fallback = fallback_map.get(scenario, fallback_map["Normal Match"])

        prompt = ORGANIZER_TEMPLATE.format(
            scenario=scenario,
            stands="North: 91%, South: 89%, East: 93%, West: 94%",
            incidents=f"Active anomalies related to {scenario}"
        )

        ai_data = gemini_client.generate_explainable_ai(
            prompt=prompt,
            system_instruction=ORGANIZER_SYSTEM,
            fallback_response=fallback
        )

        actions = ai_data.get("recommended_actions", fallback["recommended_actions"])
        rec_actions_str = " | ".join(actions)

        return [
            Recommendation(
                id="rec-org-gen",
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
        # Import to prevent circular dependencies
        from app.services.ai.executive_summary import get_briefing
        return get_briefing(scenario)

organizer_agent = OrganizerAgent()

def get_mission_recommendations(scenario: str, phase: str = "Warmup") -> List[Recommendation]:
    return organizer_agent.recommend(scenario, phase=phase)
