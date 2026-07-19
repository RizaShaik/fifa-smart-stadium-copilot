from typing import Dict, Any, List

def calculate_transport_state(scenario: str) -> Dict[str, Any]:
    """
    Calculate metro intervals, platform occupancy, and options waiting list.
    """
    metro_status = "Stable (2m intervals)"
    platform_load = "35% (Clear)"
    
    options = [
        {"route": "Doha Metro (Red Line)", "time": "8 mins walk", "load": "35% (Clear)", "ai_badge": "Eco-Choice"},
        {"route": "Shuttle Loop B (Plaza South)", "time": "12 mins walk", "load": "48% (Clear)", "ai_badge": None},
        {"route": "Shuttle Loop A (Plaza North)", "time": "14 mins walk", "load": "74% (Busy)", "ai_badge": None},
        {"route": "Stadium Taxi (Exit East)", "time": "25 mins wait", "load": "92% (Busy)", "ai_badge": None},
        {"route": "Ride Sharing (Exit West)", "time": "18 mins wait", "load": "84% (Busy)", "ai_badge": None}
    ]

    if scenario == "Metro Delay":
        metro_status = "Delayed (35m wait)"
        platform_load = "98% (Congested)"
        options[0]["time"] = "Delayed (35m wait)"
        options[0]["load"] = "98% (Congested)"
        options[0]["ai_badge"] = "Avoid Route"
        
    elif scenario == "Heavy Rain":
        metro_status = "Reduced Speed (Weather)"
        platform_load = "60% (Busy)"
        options[0]["time"] = "12 mins walk (Slippery)"
        options[0]["load"] = "60% (Busy)"
        options[1]["time"] = "18 mins (Slow Speed)"
        options[1]["load"] = "80% (Busy)"
        options[2]["time"] = "22 mins (Slow Speed)"
        options[2]["load"] = "85% (Busy)"
        options[3]["time"] = "40 mins wait (Traffic)"
        options[4]["time"] = "30 mins wait (Traffic)"
        
    elif scenario == "VIP Arrival":
        options[3]["time"] = "35 mins wait"
        options[3]["load"] = "95% (Congested)"
        
    elif scenario == "Crowd Surge":
        platform_load = "88% (Busy)"
        options[0]["time"] = "15 mins walk"
        options[0]["load"] = "88% (Busy)"

    return {
        "metro_status": metro_status,
        "platform_load": platform_load,
        "options": options
    }
