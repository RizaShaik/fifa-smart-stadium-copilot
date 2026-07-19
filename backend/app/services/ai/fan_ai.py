from typing import List, Dict, Any
from app.models.stadium_state import Recommendation
from app.services.ai.gemini_client import gemini_client
from app.services.ai.prompts import FAN_SYSTEM, FAN_TEMPLATE
from app.services.ai.base_agent import BaseAgent
import time
import logging

logger = logging.getLogger("uvicorn")

class FanAgent(BaseAgent):
    def analyze(self, scenario: str, state: Dict[str, Any] = None) -> Dict[str, Any]:
        return {
            "agent": "Fan AI",
            "active_rules": "Comfort Guidance",
            "telemetry_link": "Snacks pre-order grids"
        }

    def recommend(self, scenario: str, state: Dict[str, Any] = None, phase: str = "Warmup") -> List[Recommendation]:
        timestamp = time.strftime("%H:%M:%S")
        
        fallback_map = {
            "Normal Match": {
                "summary": "Pre-Order snack halftime fast pass",
                "reasoning": "Concession queue wait time is under 3 minutes before halftime break.",
                "confidence": 0.89,
                "recommended_actions": ["Tap food panel and order combo now.", "Enjoy the match!"],
                "priority": "Low",
                "estimated_impact": "Bypass halftime queues completely",
                "estimated_resolution_time": "3 mins",
                "trigger_telemetry": "Grill wait time: 2 mins",
                "risk_if_ignored": "Long queues during halftime break"
            },
            "Goal Scored": {
                "summary": "Goal celebration strobe protocol active",
                "reasoning": "Goal scored. Strobe light celebrant scripts active in stands.",
                "confidence": 0.92,
                "recommended_actions": ["Enjoy stadium celebratory lighting.", "Check live match stats on replay screen."],
                "priority": "Medium",
                "estimated_impact": "Synchronized fan celebration experience",
                "estimated_resolution_time": "5 mins",
                "trigger_telemetry": "Crowd decibels: 112dB",
                "risk_if_ignored": "None"
            },
            "Halftime Rush": {
                "summary": "Smart Concessions Redirect: Avoid Concourse B Grill",
                "reasoning": "Halftime rush queue exceeds 20 minutes at Concourse B. Green Pitch Salad bar wait time is only 4 minutes.",
                "confidence": 0.93,
                "recommended_actions": ["Proceed to Green Pitch Salad Bar (Portal 108).", "Order snacks via app to pre-book."],
                "priority": "High",
                "estimated_impact": "Save 16 minutes on food lines",
                "estimated_resolution_time": "4 mins",
                "trigger_telemetry": "Concourse B queue: 24 mins",
                "risk_if_ignored": "Spectators get stuck in long concession queues"
            },
            "Heavy Rain": {
                "summary": "Weather Alert: Stadium Roof Closing",
                "reasoning": "Humidity index at 84%, roof sensor triggered closing sequence. Exposed walkways are wet.",
                "confidence": 0.98,
                "recommended_actions": ["Follow covered signs to Concourse B.", "Keep screen scan brightness high."],
                "priority": "High",
                "estimated_impact": "Stay dry and avoid slippery surfaces",
                "estimated_resolution_time": "8 mins",
                "trigger_telemetry": "Humidity sensor: 84%",
                "risk_if_ignored": "Exposure to rain and potential slippage"
            },
            "Metro Delay": {
                "summary": "Doha Metro platform delay warning",
                "reasoning": "Platform sensors register 98% occupancy. Inbound trains experiencing 8-minute delays.",
                "confidence": 0.94,
                "recommended_actions": ["Stay in Concourse B dining lounge.", "Check queue updates in 10 mins."],
                "priority": "High",
                "estimated_impact": "Avoid congested platform gates",
                "estimated_resolution_time": "15 mins",
                "trigger_telemetry": "Platform load: 98%",
                "risk_if_ignored": "Getting stuck in congested waiting corridors"
            },
            "Medical Emergency": {
                "summary": "Clear escalator path Portal 104",
                "reasoning": "Cardiac distress report logged. Responders transit path mapped via Portal 104.",
                "confidence": 0.98,
                "recommended_actions": ["Move to stairwells.", "Maintain clear pathway on escalator."],
                "priority": "Critical",
                "estimated_impact": "Enable critical medical team access en route",
                "estimated_resolution_time": "5 mins",
                "trigger_telemetry": "Medical responder active dispatch en route",
                "risk_if_ignored": "Delayed emergency team arrival"
            },
            "Fire Emergency": {
                "summary": "CRITICAL: EVACUATE BUILDING IMMEDIATELY",
                "reasoning": "Emergency alarms active concourse level D. All egress pathway doors unlocked.",
                "confidence": 1.00,
                "recommended_actions": ["Follow emergency green path lights to exits.", "Maintain calm. Shout instructions."],
                "priority": "Critical",
                "estimated_impact": "Immediate hazard evacuation",
                "estimated_resolution_time": "15 mins",
                "trigger_telemetry": "Smoke sensor trigger Level D",
                "risk_if_ignored": "Smoke inhalation and fire danger"
            },
            "Gate Congestion": {
                "summary": "Direct entry route: Use Gate 10",
                "reasoning": "Gate 12 scanning throughput is delayed. Gate 10 is operating nominal with 0 queue.",
                "confidence": 0.91,
                "recommended_actions": ["Follow signs to Gate 10 entrance.", "Increase screen brightness for ticket scans."],
                "priority": "High",
                "estimated_impact": "Reduce entry wait times by 10 minutes",
                "estimated_resolution_time": "5 mins",
                "trigger_telemetry": "Gate 12 scans/min: 90",
                "risk_if_ignored": "Long gate waiting queues"
            },
            "Power Failure": {
                "summary": "Stay seated. Auxiliary lighting active.",
                "reasoning": "Substation grid power failure. Stadium backup batteries have activated exit signs.",
                "confidence": 0.95,
                "recommended_actions": ["Remain seated. Keep pathways clear.", "Auxiliary emergency channels en route."],
                "priority": "High",
                "estimated_impact": "Ensure spectator safety in dark stands",
                "estimated_resolution_time": "10 mins",
                "trigger_telemetry": "Substation power: 0%",
                "risk_if_ignored": "Stairwell crowd hazards and slips"
            },
            "VIP Arrival": {
                "summary": "Presidential lift lockout active",
                "reasoning": "VIP convoy en route. Private lift lockout active.",
                "confidence": 0.96,
                "recommended_actions": ["Use stairs or adjacent Concourse C lifts.", "Follow steward routing indicators."],
                "priority": "Medium",
                "estimated_impact": "Maintain secure corridor transfer",
                "estimated_resolution_time": "6 mins",
                "trigger_telemetry": "VIP vehicle tracker gps active",
                "risk_if_ignored": "Elevator traffic congestion"
            }
        }

        fallback = fallback_map.get(scenario, fallback_map["Normal Match"])

        # Timeline-specific overrides for Normal Match
        phase_lower = phase.lower() if phase else "warmup"
        if scenario == "Normal Match":
            if "warmup" in phase_lower:
                fallback = {
                    "summary": "Find your seat & prepare for entry",
                    "reasoning": "Gates are clear, players are warming up on the pitch. Sector 104 is quiet.",
                    "confidence": 0.95,
                    "recommended_actions": ["Proceed to Portal 104.", "Keep ticket code ready."],
                    "priority": "Low",
                    "estimated_impact": "Comfortable seating before match kickoff",
                    "estimated_resolution_time": "5 mins",
                    "trigger_telemetry": "Stands occupancy: 10%",
                    "risk_if_ignored": "Last-minute gate rush congestion"
                }
            elif "kickoff" in phase_lower:
                fallback = {
                    "summary": "Match is beginning! Minimize movement",
                    "reasoning": "Kickoff started. Stands are at peak capacity. Avoid movement in aisles.",
                    "confidence": 0.92,
                    "recommended_actions": ["Stay seated.", "Enjoy the opening play!"],
                    "priority": "Medium",
                    "estimated_impact": "Safety and clear aisles",
                    "estimated_resolution_time": "2 mins",
                    "trigger_telemetry": "Active match clock: 0:01",
                    "risk_if_ignored": "Blocking views and concourse congestion"
                }
            elif "halftime" in phase_lower:
                fallback = {
                    "summary": "Halftime Concessions Redirect: Lusail Grill",
                    "reasoning": "Main concourse food courts are congested. Green Pitch Salad bar has low wait times.",
                    "confidence": 0.90,
                    "recommended_actions": ["Pre-order snacks via fast pass.", "Use restroom C."],
                    "priority": "High",
                    "estimated_impact": "Bypass peak queue times",
                    "estimated_resolution_time": "5 mins",
                    "trigger_telemetry": "Queue times Concourse B: 15m",
                    "risk_if_ignored": "Getting stuck in long lines during second half kickoff"
                }
            elif "ended" in phase_lower or "full" in phase_lower:
                fallback = {
                    "summary": "Egress optimization: Board Metro early",
                    "reasoning": "Match concluded. Standard egress wait times at platform Red Line is 25 minutes.",
                    "confidence": 0.94,
                    "recommended_actions": ["Board Metro post-haste or wait in suites dining lounge.", "Follow green path lights."],
                    "priority": "High",
                    "estimated_impact": "Avoid peak egress crowd pressure at Metro platform",
                    "estimated_resolution_time": "15 mins",
                    "trigger_telemetry": "Metro queue pressure: High",
                    "risk_if_ignored": "Queue wait times exceeding 30 minutes"
                }

        prompt = FAN_TEMPLATE.format(
            scenario=scenario,
            location="Sector 104 Concourse",
            weather="Rainy" if scenario == "Heavy Rain" else "Clear, 21.5°C"
        ) + f"\nCurrent Match Phase/Timeline Stage: {phase}"

        ai_data = gemini_client.generate_explainable_ai(
            prompt=prompt,
            system_instruction=FAN_SYSTEM,
            fallback_response=fallback
        )

        actions = ai_data.get("recommended_actions", fallback["recommended_actions"])
        rec_actions_str = " | ".join(actions)

        return [
            Recommendation(
                id="rec-fan-gen",
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
        return "Nominal conditions en-route."

fan_agent = FanAgent()

def get_fan_recommendations(scenario: str, phase: str = "Warmup") -> List[Recommendation]:
    return fan_agent.recommend(scenario, phase=phase)
