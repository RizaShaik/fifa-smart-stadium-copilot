from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class WeatherState(BaseModel):
  temp: float
  humidity: float
  wind_speed: float
  roof_status: str
  hvac_load: str
  rain_intensity: Optional[str] = "0%"

class StandState(BaseModel):
  name: str = "" # Placeholder for Stand metadata
  occupancy: int
  temp: float
  queue_time: int
  security: str
  medical: str
  volunteers: int
  risk: str

class CrowdState(BaseModel):
  total_attendance: str
  gate_scans_rate: str
  safety_rate: str
  health_score: int
  stand_densities: Dict[str, Any]
  heatmap: List[List[str]]

class TransportOptionState(BaseModel):
  route: str
  time: str
  load: str
  ai_badge: Optional[str] = None

class TransportState(BaseModel):
  metro_status: str
  platform_load: str
  options: List[TransportOptionState]

class FoodVendorState(BaseModel):
  name: str
  item: str
  queue_time: int
  distance: int
  price: str
  types: List[str]
  ai_recommended: bool = False

class RestroomState(BaseModel):
  location: str
  gender: str
  occupancy_rate: int
  status: str

class VolunteerTask(BaseModel):
  id: str
  text: str
  completed: bool
  priority: str
  location: str

class VolunteerState(BaseModel):
  completed_tasks: int
  active_assignments: int
  response_time: str
  nearby_staff: int
  tasks: List[VolunteerTask] = []

class PatrolChecklist(BaseModel):
  id: str
  zone: str
  status: str
  criticalRate: str

class SecurityState(BaseModel):
  active_patrols: int
  critical_zones: int
  alerts_count: int
  gate_status: str
  locks: Dict[str, bool]
  patrols: List[PatrolChecklist] = []

class MedicalState(BaseModel):
  waiting_count: int
  teams_available: int
  response_time: str
  emergency_status: str

class ParkingState(BaseModel):
  lot: str
  row: str
  space: int
  walk_time: int

class SustainabilityState(BaseModel):
  carbon_saved: str
  bottles_recycled: str
  energy_saved: str
  ai_insight: str

class Incident(BaseModel):
  id: str
  location: str
  type: str
  time: str
  status: str
  severity: str

class Recommendation(BaseModel):
  id: str
  title: str
  description: str
  reason: str
  confidence: int
  priority: str
  expectedImpact: str
  estimatedResolutionTime: str
  affectedZones: List[str]
  recommendedAction: str
  timestamp: str
  status: str
  trigger_telemetry: Optional[str] = "Sensors within normal range"
  risk_if_ignored: Optional[str] = "Low risk"

class SimulatorStatus(BaseModel):
  tick_counter: int
  scenario_timer: int
  is_paused: bool
  fps: float
  auto_mode: bool
  avg_tick_duration_ms: Optional[float] = 0.0
  avg_gemini_latency_s: Optional[float] = 0.0
  avg_websocket_latency_ms: Optional[float] = 0.0
  avg_api_latency_ms: Optional[float] = 0.0

class StadiumState(BaseModel):
  match_status: str
  current_time: str
  attendance: str
  weather: WeatherState
  crowd: CrowdState
  transport: TransportState
  food: List[FoodVendorState]
  restrooms: List[RestroomState]
  volunteers: VolunteerState
  security: SecurityState
  medical: MedicalState
  parking: ParkingState
  sustainability: SustainabilityState
  incidents: List[Incident]
  recommendations: List[Recommendation]
  executive_briefing: str
  scenario: str
  
  # Unified fields
  timestamp: str
  transportation: TransportState
  volunteer: VolunteerState
  digital_twin: Dict[str, Any]
  heatmap: List[List[str]]
  simulator: SimulatorStatus
