from typing import Dict, Any, List
import random

def calculate_crowd_state(scenario: str) -> Dict[str, Any]:
    """
    Calculate stand densities, attendance, turnstile rates, and heatmaps.
    """
    # Base defaults
    total_attendance = "79,840"
    gate_scans = "1,350/min"
    safety = "99%"
    health = 98
    
    stand_occupancies = {
        "North Stand": 91,
        "South Stand": 89,
        "East Stand": 93,
        "West Stand": 94,
        "Pitch Area": 100
    }
    
    heatmap = [
        ["green", "green", "yellow", "green"],
        ["yellow", "green", "green", "orange"],
        ["green", "orange", "green", "green"],
        ["green", "green", "yellow", "green"]
    ]

    if scenario == "Goal Scored":
        stand_occupancies["South Stand"] = 97
        gate_scans = "2,100/min"
        safety = "98%"
        health = 95
        heatmap[1][3] = "orange"
        heatmap[2][1] = "orange"
        
    elif scenario == "Heavy Rain":
        stand_occupancies["North Stand"] = 95
        gate_scans = "420/min"
        safety = "94%"
        health = 88
        heatmap = [
            ["yellow", "yellow", "orange", "yellow"],
            ["orange", "yellow", "yellow", "orange"],
            ["yellow", "orange", "yellow", "yellow"],
            ["yellow", "yellow", "orange", "yellow"]
        ]
        
    elif scenario == "Metro Delay":
        gate_scans = "110/min"
        safety = "91%"
        health = 84
        stand_occupancies["West Stand"] = 98
        heatmap[0][2] = "red"
        heatmap[1][3] = "red"
        
    elif scenario == "Medical Emergency":
        safety = "95%"
        health = 89
        heatmap[0][2] = "red"
        
    elif scenario == "Fire Alarm":
        gate_scans = "8,900/min"
        safety = "31%"
        health = 22
        heatmap = [
            ["red", "red", "red", "red"],
            ["red", "red", "red", "red"],
            ["red", "red", "red", "red"],
            ["red", "red", "red", "red"]
        ]
        
    elif scenario == "Lost Child":
        gate_scans = "980/min"
        safety = "96%"
        health = 91
        heatmap[1][0] = "yellow"
        
    elif scenario == "VIP Arrival":
        gate_scans = "1,450/min"
        safety = "99%"
        health = 97
        heatmap[2][1] = "green"
        
    elif scenario == "Power Failure":
        safety = "79%"
        health = 75
        heatmap = [
            ["yellow", "green", "green", "green"],
            ["green", "yellow", "green", "green"],
            ["green", "green", "yellow", "green"],
            ["green", "green", "green", "yellow"]
        ]
        
    elif scenario == "Crowd Surge":
        gate_scans = "1,800/min"
        safety = "86%"
        health = 86
        stand_occupancies["South Stand"] = 99
        heatmap[0][1] = "red"
        heatmap[2][1] = "red"

    # Add light fluctuation if standard operations
    if scenario == "Normal":
        for i in range(len(heatmap)):
            for j in range(len(heatmap[i])):
                if random.random() < 0.1:
                    heatmap[i][j] = random.choice(["green", "yellow"])

    return {
        "total_attendance": total_attendance,
        "gate_scans_rate": gate_scans,
        "safety_rate": safety,
        "health_score": health,
        "stand_densities": stand_occupancies,
        "heatmap": heatmap
    }
