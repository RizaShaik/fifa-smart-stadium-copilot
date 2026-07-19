from typing import Dict, Any, List
from app.models.stadium_state import Recommendation

class BaseAgent:
    def analyze(self, scenario: str, state: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Analyze current state/scenario context and return raw logs/metrics details.
        """
        return {"status": "nominal"}
        
    def recommend(self, scenario: str, state: Dict[str, Any] = None, phase: str = "Warmup") -> List[Recommendation]:
        """
        Generate list of explainable AI recommendations matching the schema contract.
        """
        return []
        
    def summarize(self, scenario: str, state: Dict[str, Any] = None, phase: str = "Warmup") -> str:
        """
        Return a short text briefing paragraph summarizing this agent's actions/insights.
        """
        return ""
