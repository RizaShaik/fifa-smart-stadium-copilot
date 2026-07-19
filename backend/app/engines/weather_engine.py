from typing import Dict, Any

def calculate_weather_state(scenario: str) -> Dict[str, Any]:
    """
    Simulate temperature, humidity, wind, and stadium HVAC/roof status.
    """
    temp = 21.5
    humidity = 42.0
    wind_speed = 8.4
    roof_status = "OPEN"
    hvac_load = "Low"

    if scenario == "Heavy Rain":
        temp = 19.0
        humidity = 88.0
        wind_speed = 14.5
        roof_status = "CLOSED"
        hvac_load = "High"
        
    elif scenario == "Medical Emergency":
        # Keep inside climate controlled
        roof_status = "CLOSED"
        hvac_load = "Medium"
        
    elif scenario == "Fire Alarm":
        temp = 24.5
        humidity = 35.0
        wind_speed = 4.2
        roof_status = "OPEN" # Vent smoke
        hvac_load = "Power Saving"
        
    elif scenario == "VIP Arrival":
        # Make it comfortable
        roof_status = "CLOSED"
        hvac_load = "Medium"

    return {
        "temp": temp,
        "humidity": humidity,
        "wind_speed": wind_speed,
        "roof_status": roof_status,
        "hvac_load": hvac_load
    }
