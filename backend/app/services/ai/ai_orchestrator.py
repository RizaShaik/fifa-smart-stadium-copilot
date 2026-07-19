import logging
from typing import Dict, Any, List
from app.models.stadium_state import Recommendation
from app.services.ai.mission_ai import organizer_agent
from app.services.ai.fan_ai import fan_agent
from app.services.ai.volunteer_ai import volunteer_agent
from app.services.ai.security_ai import security_agent
from app.services.ai.medical_ai import medical_agent
from app.services.ai.transportation_ai import transportation_agent
from app.services.ai.accessibility_ai import accessibility_agent
from app.services.ai.sustainability_ai import sustainability_agent
from app.services.ai.executive_summary import executive_agent

logger = logging.getLogger("uvicorn")

SCENARIO_AGENT_MAPPING = {
    "Normal Match": ["organizer", "fan", "sustainability", "executive"],
    "Goal Scored": ["fan", "organizer", "sustainability", "executive"],
    "Halftime Rush": ["organizer", "fan", "volunteer", "executive"],
    "Heavy Rain": ["organizer", "transportation", "accessibility", "sustainability", "executive"],
    "Medical Emergency": ["medical", "security", "organizer", "volunteer", "executive"],
    "Fire Emergency": ["organizer", "security", "medical", "volunteer", "executive"],
    "Gate Congestion": ["transportation", "organizer", "security", "executive"],
    "Metro Delay": ["organizer", "transportation", "fan", "executive"],
    "Power Failure": ["organizer", "security", "sustainability", "executive"],
    "VIP Arrival": ["organizer", "security", "accessibility", "executive"]
}

class AIOrchestrator:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(AIOrchestrator, cls).__new__(cls, *args, **kwargs)
            cls._instance._agents = {
                "organizer": organizer_agent,
                "fan": fan_agent,
                "volunteer": volunteer_agent,
                "security": security_agent,
                "medical": medical_agent,
                "transportation": transportation_agent,
                "accessibility": accessibility_agent,
                "sustainability": sustainability_agent,
                "executive": executive_agent
            }
        return cls._instance

    def orchestrate(self, scenario: str, state: Dict[str, Any] = None, phase: str = "Warmup") -> Dict[str, Any]:
        """
        Run selected agents matching the active scenario and compile combined decisions.
        """
        active_keys = SCENARIO_AGENT_MAPPING.get(scenario, ["organizer", "fan", "executive"])
        
        aggregated_recommendations: List[Recommendation] = []
        executive_summaries: List[str] = []
        analysis_reports: Dict[str, Any] = {}
        
        for key in active_keys:
            agent = self._agents.get(key)
            if not agent:
                continue
            
            try:
                # 1. Run Analysis
                analysis_reports[key] = agent.analyze(scenario, state)
                
                # 2. Collect Recommendations
                recs = agent.recommend(scenario, state, phase)
                aggregated_recommendations.extend(recs)
                
                # 3. Get Summary (Briefing)
                summary = agent.summarize(scenario, state, phase)
                if summary:
                    executive_summaries.append(summary)
            except Exception as e:
                logger.error(f"Error executing agent {key} in orchestrator: {str(e)}")
                
        # Combine summaries into single paragraph
        combined_briefing = " ".join(executive_summaries)
        if not combined_briefing:
            combined_briefing = "Stadium operations are stable and nominal."
            
        return {
            "recommendations": aggregated_recommendations,
            "briefing": combined_briefing,
            "analysis": analysis_reports
        }

ai_orchestrator = AIOrchestrator()
