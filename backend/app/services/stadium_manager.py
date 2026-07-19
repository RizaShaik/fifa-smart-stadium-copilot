import asyncio
import time
import math
import random
from typing import Dict, Any, List
from fastapi import WebSocket
from app.models.stadium_state import (
    StadiumState,
    WeatherState,
    CrowdState,
    TransportState,
    TransportOptionState,
    FoodVendorState,
    RestroomState,
    VolunteerState,
    SecurityState,
    MedicalState,
    ParkingState,
    SustainabilityState,
    Incident,
    Recommendation,
    SimulatorStatus,
    VolunteerTask,
    PatrolChecklist
)
from app.engines.crowd_engine import calculate_crowd_state
from app.engines.transport_engine import calculate_transport_state
from app.engines.weather_engine import calculate_weather_state
from app.engines.incident_engine import calculate_incidents
from app.engines.recommendation_engine import calculate_recommendations
from app.services.ai.ai_orchestrator import ai_orchestrator

SCENARIOS = [
    "Normal Match",
    "Goal Scored",
    "Halftime Rush",
    "Heavy Rain",
    "Medical Emergency",
    "Fire Emergency",
    "Metro Delay",
    "VIP Arrival",
    "Power Failure"
]

def lerp(current: float, target: float, rate: float = 0.15, max_step: float = 2.0) -> float:
    diff = target - current
    if abs(diff) < 0.05:
        return target
    step = diff * rate
    if abs(step) > max_step:
        step = max_step if step > 0 else -max_step
    if abs(step) < 0.05:
        step = 0.05 if step > 0 else -0.05
    return round(current + step, 2)

class StadiumStateManager:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(StadiumStateManager, cls).__new__(cls, *args, **kwargs)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        
        # Simulator parameters
        self.scenario = "Normal Match"
        self.tick_counter = 0
        self.scenario_timer = 20
        self.is_paused = False
        self.fps = 1.0
        self.auto_mode = False
        self.last_auto_time = time.time()
        self.active_connections: List[WebSocket] = []
        
        # AI cache
        self.cached_recs: List[Recommendation] = []
        self.cached_briefing: str = "Stadium operations are nominal."
        self.cached_trans_ai: Dict[str, Any] = {}
        self.cached_access_ai: Dict[str, Any] = {}
        self.cached_sustain_ai: Dict[str, Any] = {}
        
        # Initial interpolated metrics
        self.current_attendance = 79840.0
        self.current_scans_rate = 1350.0
        self.current_safety_rate = 99.0
        self.current_health_score = 98.0
        self.current_temp = 21.5
        self.current_humidity = 42.0
        self.current_wind_speed = 8.4
        self.current_platform_load = 35.0
        self.current_rain_intensity = 0.0
        
        self.current_stand_occupancies = {
            "North Stand": 91.0,
            "South Stand": 89.0,
            "East Stand": 93.0,
            "West Stand": 94.0,
            "Pitch Area": 100.0
        }
        
        self.current_restrooms = {
            "Concourse B": 12.0,
            "Concourse C": 0.0
        }
        
        self.current_waiting_count = 1.0
        self.current_teams_available = 3.0
        self.current_active_assignments = 2.0
        self.current_tasks = [
            {"id": "t-1", "text": "Verify QR turnstile scanners Gate 12", "completed": True, "priority": "High", "location": "Gate 12"},
            {"id": "t-2", "text": "Distribute fan seat guides concourse B", "completed": False, "priority": "Medium", "location": "Concourse B"},
            {"id": "t-3", "text": "Assist family seating portal 104", "completed": False, "priority": "High", "location": "Portal 104"},
            {"id": "t-4", "text": "Conduct post-match route signage checks", "completed": False, "priority": "Low", "location": "Exit Gates"}
        ]
        self.current_patrols = [
            {"id": "p-1", "zone": "VIP Suites Elevator Foyer", "status": "Checked", "criticalRate": "Medium"},
            {"id": "p-2", "zone": "Sector D Concourse B corridor", "status": "Patrolling", "criticalRate": "High"},
            {"id": "p-3", "zone": "Gate 12 Turnstiles Plaza", "status": "Pending", "criticalRate": "High"},
            {"id": "p-4", "zone": "South Perimeter fence Gate 4", "status": "Checked", "criticalRate": "Low"}
        ]
        self.current_completed_tasks = 14.0
        
        self.current_locks = {
            "vipLift": True,
            "southRamp": True,
            "pitchGate": True
        }
        
        self.tick_durations = []
        self.gemini_latencies = []
        self.websocket_latencies = []
        self.api_latencies = []

        self.state = None
        self.current_incidents = calculate_incidents("Normal Match")
        self.regenerate_ai()
        self.update_state_lerp()

    def add_metric(self, metric_list: List[float], val: float):
        metric_list.append(val)
        if len(metric_list) > 20:
            metric_list.pop(0)

    def get_average(self, metric_list: List[float]) -> float:
        return round(sum(metric_list) / len(metric_list), 4) if metric_list else 0.0

    def set_scenario(self, scenario: str):
        # Normalize incoming UI trigger mapping names
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
            "lost_child": "Normal Match", # legacy fallback
            "gate congestion": "Gate Congestion",
            "metro delay": "Metro Delay",
            "power failure": "Power Failure",
            "vip": "VIP Arrival",
            "vip arrival": "VIP Arrival"
        }
        
        normalized = scenario.lower()
        if normalized in scenario_map:
            self.scenario = scenario_map[normalized]
        elif scenario in SCENARIOS:
            self.scenario = scenario
        else:
            self.scenario = "Normal Match"

        self.scenario_timer = 30
        self.last_auto_time = time.time()
        self.current_incidents = calculate_incidents(self.scenario)
        self.regenerate_ai()
        self.update_state_lerp()

    def get_state(self) -> StadiumState:
        return self.state

    def pause(self):
        self.is_paused = True
        self.update_state_lerp()

    def resume(self):
        self.is_paused = False
        self.last_auto_time = time.time()
        self.update_state_lerp()

    def reset_simulator(self):
        self.scenario = "Normal Match"
        self.tick_counter = 0
        self.scenario_timer = 30
        self.is_paused = False
        self.auto_mode = False
        self.last_auto_time = time.time()
        
        self.current_attendance = 79840.0
        self.current_scans_rate = 1350.0
        self.current_safety_rate = 99.0
        self.current_health_score = 98.0
        self.current_temp = 21.5
        self.current_humidity = 42.0
        self.current_wind_speed = 8.4
        self.current_platform_load = 35.0
        self.current_rain_intensity = 0.0
        
        self.current_stand_occupancies = {
            "North Stand": 91.0,
            "South Stand": 89.0,
            "East Stand": 93.0,
            "West Stand": 94.0,
            "Pitch Area": 100.0
        }
        self.current_restrooms = {
            "Concourse B": 12.0,
            "Concourse C": 0.0
        }
        self.current_waiting_count = 1.0
        self.current_teams_available = 3.0
        self.current_active_assignments = 2.0
        self.current_completed_tasks = 14.0
        self.current_tasks = [
            {"id": "t-1", "text": "Verify QR turnstile scanners Gate 12", "completed": True, "priority": "High", "location": "Gate 12"},
            {"id": "t-2", "text": "Distribute fan seat guides concourse B", "completed": False, "priority": "Medium", "location": "Concourse B"},
            {"id": "t-3", "text": "Assist family seating portal 104", "completed": False, "priority": "High", "location": "Portal 104"},
            {"id": "t-4", "text": "Conduct post-match route signage checks", "completed": False, "priority": "Low", "location": "Exit Gates"}
        ]
        self.current_patrols = [
            {"id": "p-1", "zone": "VIP Suites Elevator Foyer", "status": "Checked", "criticalRate": "Medium"},
            {"id": "p-2", "zone": "Sector D Concourse B corridor", "status": "Patrolling", "criticalRate": "High"},
            {"id": "p-3", "zone": "Gate 12 Turnstiles Plaza", "status": "Pending", "criticalRate": "High"},
            {"id": "p-4", "zone": "South Perimeter fence Gate 4", "status": "Checked", "criticalRate": "Low"}
        ]
        
        self.current_locks = {
            "vipLift": True,
            "southRamp": True,
            "pitchGate": True
        }
        self.current_incidents = calculate_incidents("Normal Match")
        self.regenerate_ai()
        self.update_state_lerp()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast_state(self, state_json: str):
        for connection in list(self.active_connections):
            try:
                await connection.send_text(state_json)
            except Exception:
                self.disconnect(connection)

    def regenerate_ai(self):
        from app.engines.recommendation_engine import clear_recommendations_cache
        clear_recommendations_cache()
        # Coordinates multi-agent analysis via central AI Orchestrator
        state_dict = self.state.dict() if self.state else None
        phase = self.state.match_status if self.state else "Warmup"
        decision = ai_orchestrator.orchestrate(self.scenario, state_dict, phase)
        self.cached_recs = decision["recommendations"]
        self.cached_briefing = decision["briefing"]
        
        # Maintain compatibility with legacy sub-agent telemetry caches
        self.cached_trans_ai = decision["analysis"].get("transportation", {})
        self.cached_access_ai = decision["analysis"].get("accessibility", {})
        self.cached_sustain_ai = decision["analysis"].get("sustainability", {})

    def update_state_lerp(self):
        timestamp_str = time.strftime("%H:%M:%S")
        
        # 1. Calculate Target Values
        target_attendance = 79840.0
        target_scans = 1350.0
        target_safety = 99.0
        target_health = 98.0
        
        target_temp = 21.5
        target_humidity = 42.0
        target_wind_speed = 8.4
        target_roof_status = "OPEN"
        target_hvac_load = "Low"
        
        target_platform_load = 35.0
        target_rain_intensity = 0.0
        target_metro_status = "Stable (2m intervals)"
        
        target_stand_occupancies = {
            "North Stand": 91.0,
            "South Stand": 89.0,
            "East Stand": 93.0,
            "West Stand": 94.0,
            "Pitch Area": 100.0
        }
        
        target_restroom_b = 12.0
        target_waiting_count = 1.0
        target_teams_available = 3.0
        target_active_assignments = 2.0
        target_completed_tasks = self.current_completed_tasks
        
        target_locks = dict(self.current_locks) if hasattr(self, "current_locks") else {
            "vipLift": True,
            "southRamp": True,
            "pitchGate": True
        }
        
        # Apply procedural changes for 10 specific scenarios
        if self.scenario == "Goal Scored":
            target_stand_occupancies["South Stand"] = 98.0
            target_scans = 2100.0
            target_safety = 98.0
            target_health = 95.0
            target_completed_tasks = 16.0
            
        elif self.scenario == "Halftime Rush":
            target_scans = 800.0
            target_safety = 97.0
            target_health = 96.0
            target_temp = 22.0
            target_humidity = 45.0
            target_platform_load = 45.0
            target_restroom_b = 98.0
            target_active_assignments = 6.0
            target_stand_occupancies = {
                "North Stand": 78.0,
                "South Stand": 72.0,
                "East Stand": 76.0,
                "West Stand": 74.0,
                "Pitch Area": 100.0
            }
            
        elif self.scenario == "Heavy Rain":
            target_attendance = 78410.0
            target_scans = 420.0
            target_safety = 94.0
            target_health = 88.0
            target_temp = 19.0
            target_humidity = 88.0
            target_wind_speed = 14.5
            target_roof_status = "CLOSED"
            target_hvac_load = "High"
            target_platform_load = 60.0
            target_rain_intensity = 95.0
            
        elif self.scenario == "Medical Emergency":
            target_scans = 1200.0
            target_safety = 95.0
            target_health = 89.0
            target_waiting_count = 3.0
            target_teams_available = 2.0
            
        elif self.scenario == "Fire Emergency":
            target_scans = 8900.0
            target_safety = 31.0
            target_health = 22.0
            target_temp = 26.5
            target_humidity = 30.0
            target_wind_speed = 12.0
            target_platform_load = 95.0
            target_roof_status = "OPEN"
            target_hvac_load = "Power Saving"
            target_waiting_count = 8.0
            target_teams_available = 1.0
            target_locks = {
                "vipLift": False,
                "southRamp": False,
                "pitchGate": False
            }
            
        elif self.scenario == "Gate Congestion":
            target_scans = 90.0
            target_safety = 92.0
            target_health = 90.0
            
        elif self.scenario == "Metro Delay":
            target_scans = 110.0
            target_safety = 91.0
            target_health = 84.0
            target_platform_load = 99.0
            target_metro_status = "Delayed (35m wait)"
            
        elif self.scenario == "Power Failure":
            target_scans = 50.0
            target_safety = 72.0
            target_health = 68.0
            target_temp = 23.5
            target_humidity = 65.0
            target_wind_speed = 0.0
            target_roof_status = "CLOSED"
            target_hvac_load = "OFF"
            target_locks["vipLift"] = False
            
        elif self.scenario == "VIP Arrival":
            target_scans = 1450.0
            target_safety = 99.0
            target_health = 97.0
            target_temp = 20.8
            target_roof_status = "CLOSED"
            target_hvac_load = "Medium"
            target_locks["vipLift"] = False
            
        # 2. LERP Interpolation (smooth transitions over ticks)
        # Apply LERP only if simulator is running, otherwise freeze/keep values
        if not self.is_paused:
            self.current_attendance = lerp(self.current_attendance, target_attendance, rate=0.1, max_step=100.0)
            self.current_scans_rate = lerp(self.current_scans_rate, target_scans, rate=0.2, max_step=150.0)
            self.current_safety_rate = lerp(self.current_safety_rate, target_safety, rate=0.15, max_step=2.0)
            self.current_health_score = lerp(self.current_health_score, target_health, rate=0.15, max_step=2.0)
            
            self.current_temp = lerp(self.current_temp, target_temp, rate=0.08, max_step=0.2)
            self.current_humidity = lerp(self.current_humidity, target_humidity, rate=0.1, max_step=2.0)
            self.current_wind_speed = lerp(self.current_wind_speed, target_wind_speed, rate=0.1, max_step=0.5)
            self.current_platform_load = lerp(self.current_platform_load, target_platform_load, rate=0.12, max_step=2.5)
            self.current_rain_intensity = lerp(self.current_rain_intensity, target_rain_intensity, rate=0.1, max_step=10.0)
            
            for stand in target_stand_occupancies:
                self.current_stand_occupancies[stand] = lerp(
                    self.current_stand_occupancies[stand], target_stand_occupancies[stand], rate=0.1, max_step=1.0
                )
                
            self.current_restrooms["Concourse B"] = lerp(self.current_restrooms["Concourse B"], target_restroom_b, rate=0.12, max_step=3.0)
            self.current_waiting_count = lerp(self.current_waiting_count, target_waiting_count, rate=0.2, max_step=1.0)
            self.current_teams_available = lerp(self.current_teams_available, target_teams_available, rate=0.2, max_step=1.0)
            self.current_active_assignments = lerp(self.current_active_assignments, target_active_assignments, rate=0.15, max_step=1.0)
            self.current_completed_tasks = lerp(self.current_completed_tasks, target_completed_tasks, rate=0.1, max_step=1.0)
            
            # Locks transfer instantly for security override safety
            self.current_locks = target_locks

        # 3. Procedural Heatmap calculation based on LERP densities
        grid_heatmap = [
            ["green", "green", "green", "green"],
            ["green", "green", "green", "green"],
            ["green", "green", "green", "green"],
            ["green", "green", "green", "green"]
        ]
        
        # Map stand densities to heatmap cells with slight noise
        d_north = self.current_stand_occupancies["North Stand"]
        d_south = self.current_stand_occupancies["South Stand"]
        d_east = self.current_stand_occupancies["East Stand"]
        d_west = self.current_stand_occupancies["West Stand"]
        
        def density_to_color(d: float) -> str:
            # Deterministic mapping
            if d >= 95.0: return "red"
            if d >= 85.0: return "orange"
            if d >= 70.0: return "yellow"
            return "green"
            
        grid_heatmap[0][1] = density_to_color(d_north)
        grid_heatmap[1][3] = density_to_color(d_south)
        grid_heatmap[2][1] = density_to_color(d_east)
        grid_heatmap[3][2] = density_to_color(d_west)
        
        # Add tiny deterministic noise fluctuations based on ticks
        if self.tick_counter % 2 == 0:
            grid_heatmap[0][2] = "yellow" if self.current_scans_rate > 1500 else "green"
            grid_heatmap[2][3] = "orange" if self.scenario == "Halftime Rush" else "green"

        # 4. Add accessibility recommendation to recs
        timestamp = time.strftime("%H:%M:%S")
        recs_list = list(self.cached_recs)
        
        if self.cached_access_ai and "summary" in self.cached_access_ai:
            recs_list.append(Recommendation(
                id="rec-access-gen",
                title=self.cached_access_ai.get("summary", "ADA Pathway Optimization"),
                description=self.cached_access_ai.get("summary", ""),
                reason=self.cached_access_ai.get("reasoning", "Accessibility path audit"),
                confidence=int(self.cached_access_ai.get("confidence", 0.95) * 100),
                priority="High" if self.scenario in ["Fire Emergency", "Medical Emergency"] else "Low",
                expectedImpact="Ensure clear routes for wheelchair & limited mobility spectators",
                estimatedResolutionTime="5 mins",
                affectedZones=["East Stand", "West Stand"],
                recommendedAction=" | ".join(self.cached_access_ai.get("recommended_actions", ["Check elevator status"])),
                timestamp=timestamp,
                status="Active"
            ))

        # Retrieve incident list
        inc_list = self.current_incidents

        # Retrieve transport details
        trans_data = calculate_transport_state(self.scenario)

        # 5. Build Digital Twin
        digital_twin = {
            "North": {
                "name": "North Stand Sector",
                "occupancy": int(self.current_stand_occupancies["North Stand"]),
                "temp": round(self.current_temp, 1),
                "security": "Alert" if self.scenario == "Fire Emergency" else "Nominal",
                "risk": "High" if self.scenario == "Fire Emergency" else "Low",
                "incidents": 1 if self.scenario == "Fire Emergency" else 0
            },
            "South": {
                "name": "South Stand Sector",
                "occupancy": int(self.current_stand_occupancies["South Stand"]),
                "temp": round(self.current_temp + 0.5, 1),
                "security": "Nominal",
                "risk": "Low",
                "incidents": 0
            },
            "East": {
                "name": "East Stand Sector",
                "occupancy": int(self.current_stand_occupancies["East Stand"]),
                "temp": round(self.current_temp + 0.2, 1),
                "security": "Nominal",
                "risk": "Low",
                "incidents": 0
            },
            "West": {
                "name": "West Stand Sector",
                "occupancy": int(self.current_stand_occupancies["West Stand"]),
                "temp": round(self.current_temp - 0.3, 1),
                "security": "Nominal",
                "risk": "Low",
                "incidents": 0
            },
            "VIP": {
                "name": "VIP Delegation Suites",
                "occupancy": 85 if self.scenario == "VIP Arrival" else 40,
                "temp": 20.5,
                "security": "Secure" if self.scenario == "VIP Arrival" else "Nominal",
                "risk": "Low",
                "incidents": 0
            },
            "Food Court": {
                "name": "Concourse Food Court",
                "occupancy": 95 if self.scenario == "Halftime Rush" else 30,
                "temp": round(self.current_temp + 1.0, 1),
                "security": "Nominal",
                "risk": "Low",
                "incidents": 0
            },
            "Medical": {
                "name": "Medical Dispatch Post",
                "occupancy": 80 if self.scenario == "Medical Emergency" else 15,
                "temp": 21.0,
                "security": "Nominal",
                "risk": "Low",
                "incidents": 1 if self.scenario == "Medical Emergency" else 0
            },
            "Parking": {
                "name": "Outer Stadium Parking Lot",
                "occupancy": 92 if self.scenario in ["Normal Match", "VIP Arrival"] else 60,
                "temp": 28.0,
                "security": "Nominal",
                "risk": "Low",
                "incidents": 0
            },
            "Metro": {
                "name": "Metro Platform Station",
                "occupancy": int(self.current_platform_load),
                "temp": 22.0,
                "security": "Congested" if self.scenario == "Metro Delay" else "Nominal",
                "risk": "Medium" if self.scenario == "Metro Delay" else "Low",
                "incidents": 1 if self.scenario == "Metro Delay" else 0
            }
        }

        # 6. Build Sustainability metrics
        carbon_offset = "18.4%"
        energy_saved = "12,000 kWh"
        if self.scenario == "Power Failure":
            carbon_offset = "45.2%"
            energy_saved = "24,500 kWh"
        elif self.scenario == "Heavy Rain":
            carbon_offset = "28.5%"
            energy_saved = "18,000 kWh"

        phases = ["Warmup", "Kickoff", "First Half", "Halftime", "Second Half", "Full Time", "Extra Time", "Penalties"]
        if self.scenario == "Halftime Rush":
            match_status = "Halftime"
        elif self.scenario in ["Metro Delay", "Fire Emergency"]:
            match_status = "Second Half"
        else:
            phase_idx = (self.tick_counter // 30) % len(phases)
            match_status = phases[phase_idx]

        # Simulation Subsystems Validation Constraints
        sim_warnings = []
        if not self.current_attendance or self.current_attendance <= 0:
            sim_warnings.append("Simulation Subsystem Warning: Crowd attendance metric failed to populate.")
        if self.scenario == "Heavy Rain":
            if target_roof_status != "CLOSED":
                sim_warnings.append("Simulation Subsystem Warning: Roof status did not close for Heavy Rain.")
            if self.current_rain_intensity <= 0:
                sim_warnings.append("Simulation Subsystem Warning: Rain intensity is 0% during Heavy Rain scenario.")
        if self.scenario == "Metro Delay" and target_metro_status != "DELAYED":
            sim_warnings.append("Simulation Subsystem Warning: Metro transit status did not update to DELAYED under Metro Delay.")
        if not grid_heatmap or len(grid_heatmap) != 4:
            sim_warnings.append("Simulation Subsystem Warning: Crowd Turnstile Heatmap did not generate standard grid matrix.")
        if "VIP" not in digital_twin or "North" not in digital_twin:
            sim_warnings.append("Simulation Subsystem Warning: Digital twin stands registry is incomplete.")
        if self.scenario == "Medical Emergency" and not any("medical" in i.type.lower() or "cardiac" in i.type.lower() for i in inc_list):
            sim_warnings.append("Simulation Subsystem Warning: Medical incident not registered under Medical Emergency.")
        if not recs_list:
            sim_warnings.append("Simulation Subsystem Warning: Recommendations list is empty.")
        if not self.cached_briefing:
            sim_warnings.append("Simulation Subsystem Warning: Executive briefing summary is empty.")
        if self.scenario == "Fire Emergency" and any(self.current_locks.values()):
            sim_warnings.append("Simulation Subsystem Warning: Gate lock override did not release for evacuation evacuation.")
        if self.scenario == "Medical Emergency" and self.current_teams_available == 3:
            sim_warnings.append("Simulation Subsystem Warning: Medical dispatch allocation failed under Emergency.")
        if not self.current_tasks:
            sim_warnings.append("Simulation Subsystem Warning: Volunteer tasks checklist is empty.")

        for warn in sim_warnings:
            logger.warning(warn)

        self.state = StadiumState(
            match_status=match_status,
            current_time=timestamp_str,
            attendance=f"{int(self.current_attendance):,}",
            weather=WeatherState(
                temp=self.current_temp,
                humidity=self.current_humidity,
                wind_speed=self.current_wind_speed,
                roof_status=target_roof_status,
                hvac_load=target_hvac_load,
                rain_intensity=f"{int(self.current_rain_intensity)}%"
            ),
            crowd=CrowdState(
                total_attendance=f"{int(self.current_attendance):,}",
                gate_scans_rate=f"{int(self.current_scans_rate)}/min",
                safety_rate=f"{int(self.current_safety_rate)}%",
                health_score=int(self.current_health_score),
                stand_densities={k: int(v) for k, v in self.current_stand_occupancies.items()},
                heatmap=grid_heatmap
            ),
            transport=TransportState(
                metro_status=target_metro_status,
                platform_load=f"{int(self.current_platform_load)}%",
                options=[TransportOptionState(**opt) for opt in trans_data["options"]]
            ),
            food=[
                FoodVendorState(name="Lusail Grill", item="Chicken Shawarma", queue_time=8 if self.scenario == "Halftime Rush" else 4, distance=45, price="$$", types=["halal", "healthy"], ai_recommended=True),
                FoodVendorState(name="Green Pitch Salad Bar", item="Avocado & Falafel Salad", queue_time=4 if self.scenario == "Halftime Rush" else 2, distance=80, price="$", types=["vegan", "vegetarian", "gluten-free", "healthy"], ai_recommended=True),
                FoodVendorState(name="Stadium Sweets", item="FIFA Churros & Popcorn", queue_time=24 if self.scenario == "Halftime Rush" else 12, distance=30, price="$", types=["vegetarian", "kids"]),
                FoodVendorState(name="Desert Oasis", item="Date Muffins", queue_time=6 if self.scenario == "Halftime Rush" else 3, distance=110, price="$$$", types=["vegetarian", "gluten-free", "healthy"])
            ],
            restrooms=[
                RestroomState(location="Concourse B (Portal 104)", gender="Male/Female/ADA", occupancy_rate=int(self.current_restrooms["Concourse B"]), status="Nominal"),
                RestroomState(location="Concourse C", gender="Family/ADA", occupancy_rate=int(self.current_restrooms["Concourse C"]), status="Nominal")
            ],
            volunteers=VolunteerState(
                completed_tasks=int(self.current_completed_tasks),
                active_assignments=int(self.current_active_assignments),
                response_time="4.2m",
                nearby_staff=8,
                tasks=[VolunteerTask(**t) for t in self.current_tasks]
            ),
            security=SecurityState(
                active_patrols=22 if self.scenario == "Gate Congestion" else 24 if self.scenario == "VIP Arrival" else 18,
                critical_zones=6 if self.scenario == "Fire Emergency" else 3 if self.scenario == "VIP Arrival" else 2,
                alerts_count=4 if self.scenario == "Fire Emergency" else 2 if self.scenario in ["Metro Delay", "Power Failure"] else 1,
                gate_status="Emergency Open" if self.scenario == "Fire Emergency" else "All Secured",
                locks=self.current_locks,
                patrols=[PatrolChecklist(**p) for p in self.current_patrols]
            ),
            medical=MedicalState(
                waiting_count=int(self.current_waiting_count),
                teams_available=int(self.current_teams_available),
                response_time="3.4m",
                emergency_status="Critical Emergency" if self.scenario == "Medical Emergency" else "Operational"
            ),
            parking=ParkingState(lot="Zone B", row="Row 4", space=21, walk_time=12),
            sustainability=SustainabilityState(
                carbon_saved=carbon_offset,
                bottles_recycled="2,410 kg",
                energy_saved=energy_saved,
                ai_insight=self.cached_sustain_ai.get("summary", "Divert cooling systems grid load.")
            ),
            incidents=inc_list,
            recommendations=recs_list,
            executive_briefing=self.cached_briefing,
            scenario=self.scenario,
            
            # Unified fields
            timestamp=timestamp_str,
            transportation=TransportState(
                metro_status=target_metro_status,
                platform_load=f"{int(self.current_platform_load)}%",
                options=[TransportOptionState(**opt) for opt in trans_data["options"]]
            ),
            volunteer=VolunteerState(
                completed_tasks=int(self.current_completed_tasks),
                active_assignments=int(self.current_active_assignments),
                response_time="4.2m",
                nearby_staff=8
            ),
            digital_twin=digital_twin,
            heatmap=grid_heatmap,
            simulator=SimulatorStatus(
                tick_counter=self.tick_counter,
                scenario_timer=self.scenario_timer,
                is_paused=self.is_paused,
                fps=self.fps,
                auto_mode=self.auto_mode,
                avg_tick_duration_ms=self.get_average(self.tick_durations),
                avg_gemini_latency_s=self.get_average(self.gemini_latencies),
                avg_websocket_latency_ms=self.get_average(self.websocket_latencies),
                avg_api_latency_ms=self.get_average(self.api_latencies)
            )
        )

    async def run_loop(self):
        last_time = time.time()
        while True:
            await asyncio.sleep(1.0)
            
            # FPS calculation
            now = time.time()
            elapsed = now - last_time
            self.fps = round(1.0 / elapsed if elapsed > 0 else 1.0, 2)
            last_time = now
            
            if not self.is_paused:
                start_tick = time.perf_counter()
                self.tick_counter += 1
                if self.auto_mode:
                    self.scenario_timer -= 1
                    if self.scenario_timer <= 0:
                        # Cycles scenarios in circular order
                        try:
                            curr_idx = SCENARIOS.index(self.scenario)
                            next_idx = (curr_idx + 1) % len(SCENARIOS)
                        except ValueError:
                            next_idx = 0
                        self.scenario = SCENARIOS[next_idx]
                        self.scenario_timer = 20
                        self.regenerate_ai()
                
                # Smoothly interpolate metrics towards the current scenario targets
                self.update_state_lerp()
                
                tick_duration_ms = (time.perf_counter() - start_tick) * 1000.0
                self.add_metric(self.tick_durations, tick_duration_ms)
                
            # Broadcast the updated state over WebSocket
            if self.state:
                await self.broadcast_state(self.state.json())

    def add_incident(self, location: str, incident_type: str, status: str, severity: str) -> Incident:
        timestamp = time.strftime("%H:%M:%S")
        max_num = 50
        for inc in self.current_incidents:
            try:
                parts = inc.id.split("-")
                num = int(parts[1])
                if num > max_num:
                    max_num = num
            except Exception:
                pass
        new_id = f"SEC-{max_num + 1}"
        new_inc = Incident(
            id=new_id,
            location=location,
            type=incident_type,
            time=timestamp,
            status=status,
            severity=severity
        )
        self.current_incidents.insert(0, new_inc)
        self.regenerate_ai()
        self.update_state_lerp()
        return new_inc

    def resolve_incident(self, incident_id: str):
        for inc in self.current_incidents:
            if inc.id == incident_id:
                inc.status = "Resolved"
                break
        self.regenerate_ai()
        self.update_state_lerp()

    def toggle_lock(self, lock_key: str, status: bool):
        self.current_locks[lock_key] = status
        self.regenerate_ai()
        self.update_state_lerp()

    def toggle_task(self, task_id: str):
        for task in self.current_tasks:
            if task["id"] == task_id:
                task["completed"] = not task["completed"]
                if task["completed"]:
                    self.current_completed_tasks += 1
                else:
                    self.current_completed_tasks = max(0.0, self.current_completed_tasks - 1)
                break
        self.regenerate_ai()
        self.update_state_lerp()

    def toggle_patrol(self, patrol_id: str):
        for patrol in self.current_patrols:
            if patrol["id"] == patrol_id:
                patrol["status"] = "Checked" if patrol["status"] != "Checked" else "Pending"
                break
        self.regenerate_ai()
        self.update_state_lerp()

    def approve_protocol(self) -> str:
        self.current_completed_tasks += 1
        self.regenerate_ai()
        self.update_state_lerp()
        return f"Protocol approved. Completed tasks: {int(self.current_completed_tasks)}"

manager = StadiumStateManager()
