from typing import List
from app.models.stadium_state import Incident
import time

def calculate_incidents(scenario: str) -> List[Incident]:
    """
    Generate incident triage logs corresponding to active scenario.
    In the future, this syncs with Firestore.
    """
    timestamp = time.strftime("%H:%M")
    
    # Base defaults
    incidents = [
        Incident(id="MED-23", location="Sector 104, Row GG", type="Heat Exhaustion", time="17:28", status="Responding", severity="High"),
        Incident(id="MED-22", location="Gate 12 Entrance", type="Minor Cut / First Aid", time="16:45", status="Resolved", severity="Medium")
    ]

    if scenario == "Medical Emergency":
        incidents.insert(0, Incident(
            id="MED-24",
            location="Sector 104, Row GG",
            type="Chest Discomfort / Cardiac",
            time=timestamp,
            status="Responding",
            severity="Critical"
        ))
    elif scenario == "Fire Alarm":
        incidents.insert(0, Incident(
            id="SEC-50",
            location="Sector D Concourse",
            type="Fire Alarm sensor 44",
            time=timestamp,
            status="Active",
            severity="Critical"
        ))
    elif scenario == "Lost Child":
        incidents.insert(0, Incident(
            id="SEC-49",
            location="Gate 12 Play zone",
            type="Lost Child reported",
            time=timestamp,
            status="Searching",
            severity="High"
        ))
    elif scenario == "VIP Arrival":
        incidents.insert(0, Incident(
            id="SEC-48",
            location="VIP garage tunnel",
            type="VIP motorcade security check",
            time=timestamp,
            status="Cleared",
            severity="Medium"
        ))
    elif scenario == "Heavy Rain":
        incidents.insert(0, Incident(
            id="SEC-51",
            location="North Plaza Walkway",
            type="Slippery Floor Alert",
            time=timestamp,
            status="Active Warning",
            severity="Medium"
        ))

    return incidents
