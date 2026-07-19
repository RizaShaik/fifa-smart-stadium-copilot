export interface Weather {
  temp: number;
  humidity: number;
  wind_speed: number;
  roof_status: string;
  hvac_load: string;
  rain_intensity?: string;
}

export interface Telemetry {
  total_attendance: string;
  gate_scans_rate: string;
  safety_rate: string;
  health_score: number;
  stand_densities: Record<string, number>;
  heatmap: string[][];
}

export interface Incident {
  id: string;
  location: string;
  type: string;
  time: string;
  status: string;
  severity: string;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  reason: string;
  confidence: number;
  priority: string;
  expectedImpact: string;
  estimatedResolutionTime: string;
  affectedZones: string[];
  recommendedAction: string;
  timestamp: string;
  status: string;
  trigger_telemetry?: string;
  risk_if_ignored?: string;
}

export interface TransportOption {
  route: string;
  time: string;
  load: string;
  ai_badge?: string;
}

export interface Transportation {
  metro_status: string;
  platform_load: string;
  options: TransportOption[];
}

export interface FoodVendor {
  name: string;
  item: string;
  queue_time: number;
  distance: number;
  price: string;
  types: string[];
  ai_recommended?: boolean;
}

export interface Restroom {
  location: string;
  gender: string;
  occupancy_rate: number;
  status: string;
}

export interface VolunteerTask {
  id: string;
  text: string;
  completed: boolean;
  priority: string;
  location: string;
}

export interface VolunteerState {
  completed_tasks: number;
  active_assignments: number;
  response_time: string;
  nearby_staff: number;
  tasks: VolunteerTask[];
}

export interface PatrolChecklist {
  id: string;
  zone: string;
  status: string;
  criticalRate: string;
}

export interface SecurityState {
  active_patrols: number;
  critical_zones: number;
  alerts_count: number;
  gate_status: string;
  locks: Record<string, boolean>;
  patrols: PatrolChecklist[];
}

export interface MedicalState {
  waiting_count: number;
  teams_available: number;
  response_time: string;
  emergency_status: string;
}

export interface ParkingState {
  lot: string;
  row: string;
  space: number;
  walk_time: number;
}

export interface SustainabilityState {
  carbon_saved: string;
  bottles_recycled: string;
  energy_saved: string;
  ai_insight: string;
}

export interface SimulatorStatus {
  tick_counter: number;
  scenario_timer: number;
  is_paused: boolean;
  fps: number;
  auto_mode: boolean;
  avg_tick_duration_ms?: number;
  avg_gemini_latency_s?: number;
  avg_websocket_latency_ms?: number;
  avg_api_latency_ms?: number;
}

export interface MissionControl {
  match_status: string;
  current_time: string;
  attendance: string;
  weather: Weather;
  crowd: Telemetry;
  transport: Transportation;
  food: FoodVendor[];
  restrooms: Restroom[];
  volunteers: VolunteerState;
  security: SecurityState;
  medical: MedicalState;
  parking: ParkingState;
  sustainability: SustainabilityState;
  incidents: Incident[];
  recommendations: Recommendation[];
  executive_briefing: string;
  scenario: string;
  
  // Unified fields
  timestamp: string;
  transportation: Transportation;
  volunteer: VolunteerState;
  digital_twin: Record<string, any>;
  heatmap: string[][];
  simulator: SimulatorStatus;
}
