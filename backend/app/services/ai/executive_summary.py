from typing import List, Dict, Any
from app.models.stadium_state import Recommendation
from app.services.ai.gemini_client import gemini_client
from app.services.ai.prompts import EXECUTIVE_SYSTEM, EXECUTIVE_TEMPLATE
from app.services.ai.base_agent import BaseAgent
import logging

logger = logging.getLogger("uvicorn")

class ExecutiveBriefingAgent(BaseAgent):
    def analyze(self, scenario: str, state: Dict[str, Any] = None) -> Dict[str, Any]:
        return {
            "agent": "Executive Briefing Agent",
            "active_rules": "Summary direct generation",
            "telemetry_link": "Combined engine reports"
        }

    def recommend(self, scenario: str, state: Dict[str, Any] = None, phase: str = "Warmup") -> List[Recommendation]:
        return []

    def summarize(self, scenario: str, state: Dict[str, Any] = None, phase: str = "Warmup") -> str:
        # Normalize scenario names
        scenario_map = {
            "normal": "Normal Match",
            "normal match": "Normal Match",
            "goal": "Goal Scored",
            "goal scored": "Goal Scored",
            "halftime": "Halftime Rush",
            "halftime rush": "Halftime Rush",
            "rain": "Heavy Rain",
            "heavy rain": "Heavy Rain",
            "medical": "Medical Emergency",
            "medical emergency": "Medical Emergency",
            "fire": "Fire Emergency",
            "fire alarm": "Fire Emergency",
            "fire emergency": "Fire Emergency",
            "lost_child": "Goal Scored", # legacy fallback
            "gate congestion": "Gate Congestion",
            "metro delay": "Metro Delay",
            "power failure": "Power Failure",
            "vip": "VIP Arrival",
            "vip arrival": "VIP Arrival"
        }
        
        normalized = scenario_map.get(scenario.lower(), scenario)

        fallback_briefings = {
            "Normal Match": "Stadium operations are stable. All sensor channels nominal. Attendance at 99.8%. Weather is dry. Overall operational health: 98%.",
            "Goal Scored": "GOAL SCORED! Stadium decibels peaking at 112dB. Crowds stable but celebrate in stands. Synchronizing strobe light show. Overall health: 95%.",
            "Halftime Rush": "Halftime intermission active. Restroom and concessions queues peaking in concourses. Directing crowds to secondary outlets. Health: 96%.",
            "Heavy Rain": "Heavy rain warning active. Stadium roof close sequence completed. Spectators directed to covered concourse corridors. Health: 88%.",
            "Metro Delay": "Metro platform queue delay detected. Platform wait time: 35 mins. Directing crowds to suites/concessions to clear bottlenecks. Health: 84%.",
            "Medical Emergency": "Medical dispatch active in Sector 104. Team Alpha en-route to patient. Portal 104 clearing path. Health: 89%.",
            "Fire Emergency": "CRITICAL: Fire alarm triggered Sector D. Automating evacuation broadcast. Outbound security doors unlocked. Health: 22%.",
            "Gate Congestion": "Gate 12 scanning throughput bottleneck detected. Crowd guides deployed to direct visitors to adjacent entry turnstiles. Health: 90%.",
            "Power Failure": "ALERT: Backup power generators online on South Stand. HVAC systems on power-saving mode. Evac path lighting clear. Health: 79%.",
            "VIP Arrival": "VIP motorcade entered tunnel. VIP Suite level secured. Private elevator lockout active. Health: 97%."
        }
        
        fallback = fallback_briefings.get(
            normalized, 
            "Stadium operations are stable. All sensor channels nominal. Attendance at 99.8%. Weather is dry. Overall operational health: 98%."
        )

        if not gemini_client.client:
            return fallback

        try:
            # Construct prompt
            prompt = EXECUTIVE_TEMPLATE.format(scenario=normalized, weather="sensors normal")
            
            # Request text content
            response = gemini_client.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config={"system_instruction": EXECUTIVE_SYSTEM}
            )
            
            text = response.text.strip()
            if text:
                return text
                
        except Exception as e:
            logger.error(f"Error calling Gemini in executive briefing: {str(e)}")
            
        return fallback

executive_agent = ExecutiveBriefingAgent()

def get_briefing(scenario: str) -> str:
    return executive_agent.summarize(scenario)
