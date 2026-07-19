"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { useMissionControl, useTriggerDemoEvent, useApproveProtocol } from "@/hooks/useStadiumApi";
import MD3Skeleton, { MD3DashboardSkeleton } from "@/components/ui/MD3Skeleton";
import ErrorRetryCard from "@/components/ui/ErrorRetryCard";
import {
  Sparkles,
  ShieldAlert,
  Users,
  Compass,
  Train,
  CloudRain,
  Activity,
  Zap,
  TrendingUp,
  Sliders,
  CheckCircle,
  AlertTriangle,
  Play,
  Terminal,
  Bell,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";

// Definitions
interface SectorState {
  name: string;
  occupancy: number;
  temp: number;
  security: string;
  risk: string;
  incidents: number;
}

interface EventLog {
  time: string;
  message: string;
  type: "info" | "warning" | "success" | "critical";
}

interface AICommanderRecommendation {
  title: string;
  reasoning: string;
  confidence: number;
  impact: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  resolutionTime: string;
  // XAI metrics
  sensorValues: string;
  crowdDensity: string;
  weather: string;
  transport: string;
  historyComp: string;
  riskAssessment: string;
}

export default function OrganizerDashboard() {
  const { data: state, isLoading, error, refetch } = useMissionControl();
  const triggerDemo = useTriggerDemoEvent();
  const approveProtocolMutation = useApproveProtocol();

  const activeEvent = state?.scenario || "Normal";
  const setActiveEvent = (evt: string) => {
    triggerDemo.mutate(evt);
  };

  // Interactive state
  const [selectedSector, setSelectedSector] = useState<string>("North");
  const [xaiExpanded, setXaiExpanded] = useState(false);
  const [approvedLogsCount, setApprovedLogsCount] = useState(0);

  // Dynamic Heatmap cells (Green/Yellow/Orange/Red)

  const heatmapData = state?.crowd.heatmap || [
    ["green", "green", "yellow", "green"],
    ["yellow", "green", "green", "orange"],
    ["green", "orange", "green", "green"],
    ["green", "green", "yellow", "green"],
  ];

  // Main Stadium Operational Metrics (Reactive to activeEvent)
  const getMetrics = () => {
    return {
      attendance: state?.attendance || "79,840",
      gateFlow: state?.crowd.gate_scans_rate || "1,350/min",
      safety: state?.crowd.safety_rate || "99%",
      hvacLoad: state?.weather.hvac_load || "Low",
      health: state?.crowd.health_score ?? 98
    };
  };

  // Executive Summary text (Reactive)
  const getExecutiveSummary = () => {
    return state?.executive_briefing || "Stadium operations are stable.";
  };

  // Holographic sectors metadata (Reactive from live backend Digital Twin)
  const sectors: Record<string, SectorState> = (state?.digital_twin as any) || {
    "North": { name: "North Stand Sector", occupancy: 91, temp: 21.4, security: "Nominal", risk: "Low", incidents: 0 },
    "South": { name: "South Stand Sector", occupancy: 89, temp: 21.6, security: "Nominal", risk: "Low", incidents: 0 },
    "East": { name: "East Stand Sector", occupancy: 93, temp: 21.5, security: "Nominal", risk: "Low", incidents: 0 },
    "West": { name: "West Stand Sector", occupancy: 94, temp: 21.2, security: "Nominal", risk: "Low", incidents: 0 },
    "VIP": { name: "VIP Delegation Suites", occupancy: 40, temp: 20.5, security: "Nominal", risk: "Low", incidents: 0 },
    "Food Court": { name: "Concourse Food Court", occupancy: 30, temp: 22.5, security: "Nominal", risk: "Low", incidents: 0 },
    "Medical": { name: "Medical Dispatch Post", occupancy: 15, temp: 21.0, security: "Nominal", risk: "Low", incidents: 0 },
    "Parking": { name: "Outer Stadium Parking Lot", occupancy: 60, temp: 28.0, security: "Nominal", risk: "Low", incidents: 0 },
    "Metro": { name: "Metro Platform Station", occupancy: 35, temp: 22.0, security: "Nominal", risk: "Low", incidents: 0 }
  };

  const getSectionColor = (id: string) => {
    const sec = sectors[id];
    if (!sec) return "currentColor";
    if (sec.incidents > 0 || sec.security === "Alert" || sec.security === "Congested") return "var(--error)";
    if (sec.occupancy >= 90) return "var(--tertiary)";
    if (sec.occupancy >= 75) return "var(--secondary)";
    return "var(--primary)";
  };

  const getAIRecommendation = (): AICommanderRecommendation => {
    if (state?.recommendations && state.recommendations.length > 0) {
      const rec = state.recommendations[0];
      return {
        title: rec.title,
        reasoning: rec.reason,
        confidence: rec.confidence,
        impact: rec.expectedImpact,
        priority: rec.priority as any,
        resolutionTime: rec.estimatedResolutionTime,
        sensorValues: rec.trigger_telemetry || rec.reason,
        crowdDensity: "Stands telemetry verified",
        weather: `Roof status: ${state.weather.roof_status}`,
        transport: state.transport.metro_status,
        historyComp: "95% match with historical high-sentiment events",
        riskAssessment: rec.risk_if_ignored || "Risk parameters active"
      };
    }

    return {
      title: "Optimize Concourse B Egress Routes",
      reasoning: "Sensor flow index: 42/min, queue time: 2 mins. Normal spectator peak flows. All channels clear.",
      confidence: 88,
      impact: "Reduce queue wait time below 2 minutes",
      priority: "Low",
      resolutionTime: "10 mins",
      sensorValues: "Turnstile sensor: 1350/min, Platform load: 35%",
      crowdDensity: "Portal 106 and Gate 12 nominal flow rates",
      weather: `Roof status: ${state?.weather?.roof_status || 'OPEN'}, Temp: ${state?.weather?.temp || 21.5}°C`,
      transport: state?.transport?.metro_status || "Stable (2m intervals)",
      historyComp: "92% correlation with nominal flow models",
      riskAssessment: "Risk: Low. Standard monitoring active."
    };
  };

  // AI-Generated Event Timeline (Reactive + Animating additions)
  const [eventLogs, setEventLogs] = useState<EventLog[]>([
    { time: "18:20", message: "Internal security checkpoints checked & cleared.", type: "info" },
    { time: "18:25", message: "Match broadcast feed verified and online.", type: "success" },
    { time: "18:30", message: "Stadium public gates opened. Flow rate nominal.", type: "success" },
  ]);

  // Append new logs when activeEvent changes
  useEffect(() => {
    const time = new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
    let newLog: EventLog | null = null;

    switch (activeEvent) {
      case "Goal Scored":
        newLog = { time, message: "GOAL SCORED! Decibel levels exceeded 110dB. Strobe lighting activated.", type: "success" };
        break;
      case "Heavy Rain":
        newLog = { time, message: "Moisture sensors triggered. Automated roof closing sequence finished.", type: "warning" };
        break;
      case "Metro Delay":
        newLog = { time, message: "Doha Metro transit delay flagged. Platform sensor warning active.", type: "warning" };
        break;
      case "Medical Emergency":
        newLog = { time, message: "Sector 104: Emergency medical dispatch button pressed.", type: "critical" };
        break;
      case "Fire Alarm":
        newLog = { time, message: "CRITICAL: Fire alarm sensors triggered Sector D. Egress unlock active.", type: "critical" };
        break;
      case "Lost Child":
        newLog = { time, message: "Lost child alert registered Gate 12. Security sweeps en route.", type: "warning" };
        break;
      case "VIP Arrival":
        newLog = { time, message: "VIP convoy entered secure garage tunnel. Escort detail deployed.", type: "info" };
        break;
      default:
        newLog = { time, message: "Stadium operations running in standard nominal state.", type: "info" };
    }

    if (newLog) {
      setEventLogs((prev) => [newLog!, ...prev].slice(0, 10)); // keep last 10
    }
  }, [activeEvent]);

  // AI Recommendation Approve action
  const handleApproveProtocol = () => {
    approveProtocolMutation.mutate(undefined, {
      onSuccess: (res) => {
        const time = new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
        const log: EventLog = {
          time,
          message: `Organizer APPROVED AI Protocol: "${getAIRecommendation().title}". Telemetry logs updated.`,
          type: "success",
        };
        setEventLogs((prev) => [log, ...prev]);
        setApprovedLogsCount(prev => prev + 1);
        alert(res?.message || `Protocol approved successfully! Dynamic updates pushed to stadium nodes.`);
      }
    });
  };

  if (isLoading) {
    return <MD3DashboardSkeleton />;
  }

  if (error) {
    return <ErrorRetryCard message={error.message} onRetry={refetch} />;
  }

  const metrics = getMetrics();
  const currentRecommendation = getAIRecommendation();

  return (
    <div className="space-y-6">
      
      {/* 1. STATE & EXECUTIVE SUMMARY */}
      <div className="bg-gradient-to-br from-surface-container-lowest to-surface-container-low border border-outline-variant p-6 rounded-2xl shadow-elevation-2 relative overflow-hidden">
        {/* Neon warning line if critical event is active */}
        {activeEvent === "Fire Alarm" && (
          <div className="absolute top-0 inset-x-0 h-1.5 bg-error animate-pulse" />
        )}
        {activeEvent === "Medical Emergency" && (
          <div className="absolute top-0 inset-x-0 h-1.5 bg-error animate-pulse" />
        )}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 flex-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-container text-on-primary-container text-[10px] font-bold uppercase tracking-wider shadow-sm">
              <Sparkles size={12} className="animate-spin-slow" />
              <span>Stadium AI Mission Commander Dashboard</span>
            </div>
            
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-on-surface">
              Executive Stadium Briefing
            </h1>
            
            <p className="text-xs md:text-sm text-on-surface-variant font-medium leading-relaxed max-w-4xl">
              "{getExecutiveSummary()}"
            </p>
          </div>

          {/* Health Index Dial */}
          <div className="flex items-center gap-4 shrink-0 bg-background/50 p-4 rounded-xl border border-outline-variant">
            <div className="relative w-16 h-16 flex items-center justify-center font-extrabold text-lg">
              <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-outline-variant"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <motion.path
                  initial={{ strokeDasharray: "0, 100" }}
                  animate={{ strokeDasharray: `${metrics.health}, 100` }}
                  transition={{ duration: 0.6 }}
                  className={metrics.health < 50 ? "text-error" : metrics.health < 90 ? "text-secondary" : "text-primary"}
                  strokeWidth="3.5"
                  strokeDasharray={`${metrics.health}, 100`}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="z-10">{metrics.health}%</span>
            </div>
            <div>
              <span className="block text-[10px] text-muted-foreground uppercase font-bold">Operational Health</span>
              <span className="text-xs font-bold text-on-surface">System Performance</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DEMO TRIGGER PANEL (HACKATHON CONTROLLER CONTROLS ALL STADIUM TELEMETRY) */}
      <div className="p-5 rounded-xl bg-surface-container border border-outline-variant space-y-3.5 shadow-sm ring-1 ring-primary/10">
        <div className="flex justify-between items-center border-b border-outline-variant pb-2">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-secondary flex items-center gap-1.5">
              <Sliders size={16} className="text-secondary animate-pulse" />
              <span>Simulated Demo triggers</span>
            </h3>
            <p className="text-[10px] text-muted-foreground">Select an operational scenario to dynamically alter Digital Twins, heatmaps, alerts, and charts.</p>
          </div>
          <span className="text-[9px] px-2 py-0.5 bg-secondary-container text-on-secondary-container font-extrabold rounded">
            Scenario: {activeEvent}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: "Normal", label: "Normal Operations", color: "border-outline-variant" },
            { id: "Goal Scored", label: "⚽ Goal Scored", color: "border-emerald-500/20" },
            { id: "Heavy Rain", label: "🌧️ Heavy Rain", color: "border-blue-500/20" },
            { id: "Metro Delay", label: "🚇 Metro Delay", color: "border-orange-500/20" },
            { id: "Medical Emergency", label: "🚨 Medical Emergency", color: "border-rose-500/20" },
            { id: "Fire Alarm", label: "🔥 Fire Alarm Evac", color: "border-red-600/30" },
            { id: "Lost Child", label: "👦 Lost Child Lock", color: "border-purple-500/20" },
            { id: "VIP Arrival", label: "👑 VIP Delegation", color: "border-amber-500/20" },
          ].map((evt) => (
            <button
              key={evt.id}
              onClick={() => setActiveEvent(evt.id)}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                activeEvent === evt.id
                  ? "bg-secondary text-on-secondary border-secondary shadow-sm"
                  : `bg-background text-on-surface-variant hover:bg-surface-container-high ${evt.color}`
              }`}
            >
              {evt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. METRICS BANNER GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Gate Attendance", value: metrics.attendance, sub: "99.8% Capacity Rate", icon: Users, color: "text-primary" },
          { label: "Gate Flow Velocity", value: metrics.gateFlow, sub: "Real-time ticket scans", icon: Compass, color: "text-secondary" },
          { label: "Crowd Safety Rate", value: metrics.safety, sub: "Sector stability matrix", icon: ShieldAlert, color: "text-tertiary" },
          { label: "HVAC Energy Usage", value: metrics.hvacLoad, sub: "Active cooling level", icon: Zap, color: "text-primary" },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="p-5 rounded-xl bg-surface-container border border-outline-variant shadow-elevation-1 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">{item.label}</span>
                <div className={`text-2xl font-black ${item.color}`}>{item.value}</div>
                <div className="text-[10px] text-on-surface-variant font-medium">{item.sub}</div>
              </div>
              <div className={`p-2 rounded-lg bg-background border border-outline-variant ${item.color}`}>
                <Icon size={18} />
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. DIGITAL TWIN SVG & CROWD HEATMAP */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Holographic Digital Twin */}
        <div className="lg:col-span-8 p-6 rounded-xl bg-surface-container border border-outline-variant space-y-4">
          <div className="flex justify-between items-center border-b border-outline-variant pb-2">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Compass size={20} className="text-primary" />
                <span>Holographic Digital Twin Projection</span>
              </h2>
              <p className="text-[10px] text-on-surface-variant">Hover over stands to display sensor logs. Click to lock/filter metrics.</p>
            </div>
            
            <div className="text-xs bg-background border border-outline-variant px-3 py-1 rounded font-bold flex items-center gap-1.5">
              <span>Selected Stand:</span>
              <span className="text-primary">{selectedSector}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            
            {/* SVG Stadium Drawing */}
            <div className="md:col-span-2 flex justify-center items-center p-4 bg-background/50 rounded-xl border border-outline-variant min-h-[280px]">
              <svg className="w-full max-w-[320px] h-auto select-none" viewBox="0 0 100 100" fill="none">
                {/* Background guides */}
                <circle cx="50" cy="50" r="46" stroke="var(--outline-variant)" strokeWidth="0.5" strokeDasharray="1.5,1.5" className="opacity-40 animate-pulse" />
                <circle cx="50" cy="50" r="32" stroke="var(--outline-variant)" strokeWidth="0.5" strokeDasharray="1.5,1.5" className="opacity-30" />
                
                {/* 1. North Sector Path */}
                <motion.path
                  d="M 22 28 A 38 38 0 0 1 78 28"
                  stroke={getSectionColor("North")}
                  strokeWidth={selectedSector === "North" ? "4.5" : "2.5"}
                  className="cursor-pointer hover:stroke-primary focus:stroke-primary focus:outline-none transition-all duration-300 stroke-linecap-round"
                  onClick={() => setSelectedSector("North")}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedSector("North"); }}
                  tabIndex={0}
                  role="button"
                  aria-label="Select North Stand Sector"
                  animate={{ strokeWidth: selectedSector === "North" ? 4.5 : 2.5 }}
                />
                
                {/* 2. East Sector Path */}
                <motion.path
                  d="M 78 28 A 38 38 0 0 1 78 72"
                  stroke={getSectionColor("East")}
                  strokeWidth={selectedSector === "East" ? "4.5" : "2.5"}
                  className="cursor-pointer hover:stroke-primary focus:stroke-primary focus:outline-none transition-all duration-300 stroke-linecap-round"
                  onClick={() => setSelectedSector("East")}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedSector("East"); }}
                  tabIndex={0}
                  role="button"
                  aria-label="Select East Stand Sector"
                  animate={{ strokeWidth: selectedSector === "East" ? 4.5 : 2.5 }}
                />
                
                {/* 3. South Sector Path */}
                <motion.path
                  d="M 78 72 A 38 38 0 0 1 22 72"
                  stroke={getSectionColor("South")}
                  strokeWidth={selectedSector === "South" ? "4.5" : "2.5"}
                  className="cursor-pointer hover:stroke-primary focus:stroke-primary focus:outline-none transition-all duration-300 stroke-linecap-round"
                  onClick={() => setSelectedSector("South")}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedSector("South"); }}
                  tabIndex={0}
                  role="button"
                  aria-label="Select South Stand Sector"
                  animate={{ strokeWidth: selectedSector === "South" ? 4.5 : 2.5 }}
                />
                
                {/* 4. West Sector Path */}
                <motion.path
                  d="M 22 72 A 38 38 0 0 1 22 28"
                  stroke={getSectionColor("West")}
                  strokeWidth={selectedSector === "West" ? "4.5" : "2.5"}
                  className="cursor-pointer hover:stroke-primary focus:stroke-primary focus:outline-none transition-all duration-300 stroke-linecap-round"
                  onClick={() => setSelectedSector("West")}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedSector("West"); }}
                  tabIndex={0}
                  role="button"
                  aria-label="Select West Stand Sector"
                  animate={{ strokeWidth: selectedSector === "West" ? 4.5 : 2.5 }}
                />
                
                {/* 5. VIP Lounge (Center Box) */}
                <motion.rect
                  x="38"
                  y="43"
                  width="24"
                  height="14"
                  rx="2"
                  stroke={getSectionColor("VIP")}
                  strokeWidth={selectedSector === "VIP" ? "3" : "1.5"}
                  fill={getSectionColor("VIP")}
                  fillOpacity={selectedSector === "VIP" ? "0.3" : "0.1"}
                  className="cursor-pointer hover:fill-opacity-20 focus:fill-opacity-20 focus:outline-none transition-all"
                  onClick={() => setSelectedSector("VIP")}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedSector("VIP"); }}
                  tabIndex={0}
                  role="button"
                  aria-label="Select VIP Suites"
                  animate={{ strokeWidth: selectedSector === "VIP" ? 3 : 1.5, fillOpacity: selectedSector === "VIP" ? 0.3 : 0.1 }}
                />
                <text x="50" y="52" textAnchor="middle" fill="currentColor" className="text-[5px] font-bold opacity-60 pointer-events-none uppercase tracking-wider">VIP</text>

                {/* 6. Medical (Top-Left Outer Node) */}
                <line x1="22" y1="28" x2="10" y2="16" stroke="var(--outline-variant)" strokeWidth="0.5" strokeDasharray="1,1" />
                <motion.circle
                  cx="10"
                  cy="16"
                  r="5"
                  stroke={getSectionColor("Medical")}
                  strokeWidth={selectedSector === "Medical" ? "2" : "1"}
                  fill={getSectionColor("Medical")}
                  fillOpacity={selectedSector === "Medical" ? "0.3" : "0.1"}
                  className="cursor-pointer hover:fill-opacity-25 focus:fill-opacity-25 focus:outline-none transition-all"
                  onClick={() => setSelectedSector("Medical")}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedSector("Medical"); }}
                  tabIndex={0}
                  role="button"
                  aria-label="Select Medical Dispatch Post"
                />
                <text x="10" y="18" textAnchor="middle" fill={getSectionColor("Medical")} className="text-[7px] font-extrabold pointer-events-none">+</text>

                {/* 7. Food Court (Top-Right Outer Node) */}
                <line x1="78" y1="28" x2="90" y2="16" stroke="var(--outline-variant)" strokeWidth="0.5" strokeDasharray="1,1" />
                <motion.circle
                  cx="90"
                  cy="16"
                  r="5"
                  stroke={getSectionColor("Food Court")}
                  strokeWidth={selectedSector === "Food Court" ? "2" : "1"}
                  fill={getSectionColor("Food Court")}
                  fillOpacity={selectedSector === "Food Court" ? "0.3" : "0.1"}
                  className="cursor-pointer hover:fill-opacity-25 focus:fill-opacity-25 focus:outline-none transition-all"
                  onClick={() => setSelectedSector("Food Court")}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedSector("Food Court"); }}
                  tabIndex={0}
                  role="button"
                  aria-label="Select Concourse Food Court"
                />
                <text x="90" y="18" textAnchor="middle" fill="currentColor" className="text-[6px] font-bold pointer-events-none">☕</text>

                {/* 8. Parking (Bottom-Left Outer Node) */}
                <line x1="22" y1="72" x2="10" y2="84" stroke="var(--outline-variant)" strokeWidth="0.5" strokeDasharray="1,1" />
                <motion.rect
                  x="6"
                  y="80"
                  width="8"
                  height="8"
                  rx="1.5"
                  stroke={getSectionColor("Parking")}
                  strokeWidth={selectedSector === "Parking" ? "2" : "1"}
                  fill={getSectionColor("Parking")}
                  fillOpacity={selectedSector === "Parking" ? "0.3" : "0.1"}
                  className="cursor-pointer hover:fill-opacity-25 focus:fill-opacity-25 focus:outline-none transition-all"
                  onClick={() => setSelectedSector("Parking")}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedSector("Parking"); }}
                  tabIndex={0}
                  role="button"
                  aria-label="Select Outer Parking Lot"
                />
                <text x="10" y="86" textAnchor="middle" fill={getSectionColor("Parking")} className="text-[6px] font-extrabold pointer-events-none">P</text>

                {/* 9. Metro Station (Bottom-Right Outer Node) */}
                <line x1="78" y1="72" x2="90" y2="84" stroke="var(--outline-variant)" strokeWidth="0.5" strokeDasharray="1,1" />
                <motion.rect
                  x="86"
                  y="80"
                  width="8"
                  height="8"
                  rx="1.5"
                  stroke={getSectionColor("Metro")}
                  strokeWidth={selectedSector === "Metro" ? "2" : "1"}
                  fill={getSectionColor("Metro")}
                  fillOpacity={selectedSector === "Metro" ? "0.3" : "0.1"}
                  className="cursor-pointer hover:fill-opacity-25 focus:fill-opacity-25 focus:outline-none transition-all"
                  onClick={() => setSelectedSector("Metro")}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedSector("Metro"); }}
                  tabIndex={0}
                  role="button"
                  aria-label="Select Metro Platform Station"
                />
                <text x="90" y="86" textAnchor="middle" fill="currentColor" className="text-[5px] font-bold pointer-events-none">🚇</text>
              </svg>
            </div>

            {/* Hover details of selected stand */}
            <div className="space-y-4 text-xs font-semibold">
              <h4 className="font-extrabold text-sm border-b border-outline-variant pb-1.5">{sectors[selectedSector]?.name || selectedSector} Telemetry</h4>
              
              <div className="space-y-2.5 leading-normal">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Crowd Density:</span>
                  <span className="text-on-surface font-bold">{sectors[selectedSector]?.occupancy ?? 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Temperature:</span>
                  <span className="text-on-surface font-bold">{sectors[selectedSector]?.temp ?? 0}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Safety Level:</span>
                  <span className={`font-bold uppercase ${
                    (sectors[selectedSector]?.security || "Nominal") === "Nominal" || (sectors[selectedSector]?.security || "Nominal") === "Secure" ? "text-primary" : "text-error"
                  }`}>{sectors[selectedSector]?.security || "Nominal"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Incidents:</span>
                  <span className={`font-bold ${
                    (sectors[selectedSector]?.incidents ?? 0) > 0 ? "text-error animate-pulse" : "text-on-surface"
                  }`}>{sectors[selectedSector]?.incidents ?? 0} active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Risk Level:</span>
                  <span className={`font-bold ${
                    sectors[selectedSector]?.risk === "High" ? "text-error" : sectors[selectedSector]?.risk === "Medium" ? "text-secondary" : "text-on-surface-variant"
                  }`}>{sectors[selectedSector]?.risk || "Low"}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Animated Heatmap */}
        <div className="lg:col-span-4 p-6 rounded-xl bg-surface-container border border-outline-variant flex flex-col justify-between min-h-[300px]">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-2">
              <Activity size={20} className="text-primary" />
              <span>Sensory Heatmap Matrix</span>
            </h2>
            <p className="text-[10px] text-on-surface-variant mb-4">Gate turnstile flow & concourse entry occupancy index tracking grid.</p>
            
            <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono font-bold select-none">
              {heatmapData.map((row, rIdx) =>
                row.map((cell, cIdx) => (
                  <div
                    key={`${rIdx}-${cIdx}`}
                    className={`aspect-square rounded-md border border-outline-variant flex items-center justify-center transition-all duration-500 shadow-sm ${
                      cell === "green"
                        ? "bg-primary/20 text-primary border-primary/20"
                        : cell === "yellow"
                        ? "bg-secondary/20 text-secondary border-secondary/20"
                        : cell === "orange"
                        ? "bg-orange-500/20 text-orange-600 border-orange-500/20"
                        : "bg-error-container text-error border-error/20"
                    }`}
                  >
                    G-{rIdx * 4 + cIdx + 1}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-between items-center text-[9px] text-muted-foreground font-semibold border-t border-outline-variant pt-4 mt-4">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-primary/20 border border-primary/20" /> Safe</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-secondary/20 border border-secondary/20" /> Moderate</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-orange-500/20 border border-orange-500/20" /> Busy</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-error-container border border-error/20" /> Peak</span>
          </div>
        </div>

      </div>

      {/* 5. AI MISSION COMMANDER & EXPLAINABLE AI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Proactive Commander Decision Support */}
        <div className="lg:col-span-7 p-6 rounded-xl bg-surface-container border border-outline-variant space-y-4">
          <div className="flex justify-between items-center border-b border-outline-variant pb-2">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Sparkles size={20} className="text-secondary animate-pulse" />
                <span>AI Mission Commander Action Center</span>
              </h2>
              <p className="text-[10px] text-on-surface-variant font-medium">Automatic system protocols generated from live crowd and transit sensor models.</p>
            </div>
            
            <span className={`text-[10px] px-2.5 py-0.5 rounded font-extrabold uppercase ${
              currentRecommendation.priority === "Critical"
                ? "bg-error-container text-error animate-pulse"
                : "bg-secondary-container text-on-secondary-container"
            }`}>
              Priority: {currentRecommendation.priority}
            </span>
          </div>

          {/* Commander Card */}
          <div className="bg-background rounded-xl p-5 border border-outline-variant space-y-4">
            <div className="space-y-1">
              <span className="text-[9px] uppercase font-bold text-muted-foreground block">Active Smart Protocol Recommendation</span>
              <h4 className="font-extrabold text-base text-primary">{currentRecommendation.title}</h4>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              {currentRecommendation.reasoning}
            </p>

            <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
              <div className="bg-surface-container p-2.5 rounded border border-outline-variant">
                <span className="block text-[8px] text-muted-foreground uppercase mb-0.5">Confidence Index</span>
                <span className="font-bold text-primary">{currentRecommendation.confidence}%</span>
              </div>
              <div className="bg-surface-container p-2.5 rounded border border-outline-variant">
                <span className="block text-[8px] text-muted-foreground uppercase mb-0.5">Calculated Impact</span>
                <span className="font-bold text-primary">{currentRecommendation.impact}</span>
              </div>
            </div>

            {/* Decision Actions */}
            <div className="flex gap-2 pt-2 text-xs font-bold">
              <button
                onClick={handleApproveProtocol}
                className="bg-primary text-on-primary py-2 px-4 rounded-lg flex items-center gap-1.5 hover:bg-opacity-95 shadow-sm cursor-pointer shrink-0"
              >
                <CheckCircle size={14} />
                <span>Approve Protocol</span>
              </button>
              
              <button className="bg-background border border-outline-variant hover:bg-surface-container-high py-2 px-4 rounded-lg cursor-pointer">
                Modify Parameters
              </button>
              
              <button className="bg-background border border-outline-variant text-muted-foreground hover:bg-surface-container-high py-2 px-4 rounded-lg cursor-pointer ml-auto">
                Dismiss
              </button>
            </div>
          </div>
        </div>

        {/* Explainable AI Details */}
        <div className="lg:col-span-5 p-6 rounded-xl bg-surface-container border border-outline-variant flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <TrendingUp size={16} /> Explainable AI (XAI) Matrix
              </h3>
              <button
                onClick={() => setXaiExpanded(!xaiExpanded)}
                className="text-[10px] font-bold text-primary hover:underline"
              >
                {xaiExpanded ? "Hide Indices" : "Show All Indices"}
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="bg-background/80 p-3 rounded border border-outline-variant leading-relaxed">
                <span className="font-bold text-primary block text-[10px] uppercase mb-0.5">Current Stadium Conditions</span>
                {currentRecommendation.sensorValues}
              </div>

              <div className="bg-background/80 p-3 rounded border border-outline-variant leading-relaxed">
                <span className="font-bold text-primary block text-[10px] uppercase mb-0.5">Risk & Safety Assessment</span>
                {currentRecommendation.riskAssessment}
              </div>

              {xaiExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-3.5"
                >
                  <div className="bg-background/80 p-3 rounded border border-outline-variant leading-relaxed">
                    <span className="font-bold text-primary block text-[10px] uppercase mb-0.5">Historical Comparison</span>
                    {currentRecommendation.historyComp}
                  </div>
                  <div className="bg-background/80 p-3 rounded border border-outline-variant leading-relaxed">
                    <span className="font-bold text-primary block text-[10px] uppercase mb-0.5">Weather Telemetry Link</span>
                    {currentRecommendation.weather}
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          <div className="text-[10px] text-muted-foreground border-t border-outline-variant pt-3 mt-4">
            ESTIMATED PROTOCOL RESOLUTION TIME: <strong>{currentRecommendation.resolutionTime}</strong>
          </div>
        </div>

      </div>

      {/* 6. LIVE AI EVENT FEED & QUICK ACTIONS COMMAND CENTER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Live AI Event Feed */}
        <div className="lg:col-span-8 p-6 rounded-xl bg-surface-container border border-outline-variant space-y-4 h-[320px] flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2 border-b border-outline-variant pb-2">
              <Terminal size={20} className="text-secondary" />
              <span>Live AI Event Ticker Feed</span>
            </h2>
            
            <div className="space-y-2 mt-4 max-h-[190px] overflow-y-auto pr-1">
              <AnimatePresence>
                {eventLogs.map((log, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-3 text-xs leading-relaxed"
                  >
                    <span className="font-mono font-bold text-secondary shrink-0 bg-background border border-outline-variant px-2 py-0.5 rounded">
                      {log.time}
                    </span>
                    <span className={`font-semibold flex-1 ${
                      log.type === "critical"
                        ? "text-error"
                        : log.type === "warning"
                        ? "text-secondary"
                        : "text-on-surface"
                    }`}>
                      {log.message}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
          
          <div className="text-[10px] text-muted-foreground border-t border-outline-variant pt-2">
            Approved protocols this session: <strong>{approvedLogsCount} runs</strong>
          </div>
        </div>

        {/* Command Center Quick Actions */}
        <div className="lg:col-span-4 p-6 rounded-xl bg-surface-container border border-outline-variant flex flex-col justify-between h-[320px]">
          <div>
            <h3 className="font-bold text-base mb-3 flex items-center gap-2">
              <SlidersHorizontal size={18} className="text-primary" />
              <span>Command Center Console</span>
            </h3>
            
            <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
              <button
                onClick={() => {
                  alert("Gate locks overridden. All gates unlocked.");
                  setEventLogs(prev => [{ time: "Now", message: "Console: Emergency gate exit locks unlocked.", type: "warning" }, ...prev]);
                }}
                className="bg-background border border-outline-variant p-3 rounded-lg hover:bg-surface-container-high transition-colors text-center cursor-pointer"
              >
                🔓 Open Evac Gates
              </button>
              <button
                onClick={() => {
                  alert("Broadcast announcement dispatched to all spectator screens.");
                  setEventLogs(prev => [{ time: "Now", message: "Console: Broadcast notification sent to spectators.", type: "info" }, ...prev]);
                }}
                className="bg-background border border-outline-variant p-3 rounded-lg hover:bg-surface-container-high transition-colors text-center cursor-pointer"
              >
                📢 Broadcast Screen Alert
              </button>
              <button
                onClick={() => {
                  alert("Deploying extra Volunteer Teams to Gate 12.");
                  setEventLogs(prev => [{ time: "Now", message: "Console: Deploying additional volunteer nav squads Gate 12.", type: "success" }, ...prev]);
                }}
                className="bg-background border border-outline-variant p-3 rounded-lg hover:bg-surface-container-high transition-colors text-center cursor-pointer"
              >
                👥 Deploy Volunteers
              </button>
              <button
                onClick={() => {
                  alert("Emergency Evacuation Script initiated.");
                  setActiveEvent("Fire Alarm");
                }}
                className="bg-background border border-error text-error p-3 rounded-lg hover:bg-error/10 transition-colors text-center cursor-pointer animate-pulse"
              >
                🔥 Activate Evacuation
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              alert("AI Report generated. Pushed to head organizer console.");
              setEventLogs(prev => [{ time: "Now", message: "Console: Generated stadium AI operations health report.", type: "success" }, ...prev]);
            }}
            className="w-full bg-primary text-on-primary font-bold text-xs py-2.5 rounded-lg hover:bg-opacity-95 transition-all cursor-pointer mt-4"
          >
            Generate AI Status Report
          </button>
        </div>

      </div>

      {/* 7. AI PREDICTIONS, SUSTAINABILITY & TRANSIT TELEMETRY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Next 30 Minutes Predictions */}
        <div className="p-6 rounded-xl bg-surface-container border border-outline-variant space-y-4">
          <h3 className="font-bold text-base flex items-center gap-2">
            <TrendingUp size={18} className="text-primary" />
            <span>AI Predictive Analytics (Next 30m)</span>
          </h3>

          <div className="space-y-3 text-xs leading-normal">
            {[
              { label: "Expected Crowd Surge (Gate 12)", score: activeEvent === "Heavy Rain" ? 85 : 42 },
              { label: "Halftime Food Demand (Concourse B)", score: 94 },
              { label: "Transit Egress Queue (Doha Metro)", score: activeEvent === "Metro Delay" ? 98 : 38 },
              { label: "First Aid Post Load", score: activeEvent === "Medical Emergency" ? 75 : 12 },
            ].map((pred, idx) => (
              <div key={idx} className="space-y-1 font-semibold">
                <div className="flex justify-between">
                  <span>{pred.label}</span>
                  <span>{pred.score}% Prob</span>
                </div>
                <div className="bg-background border border-outline-variant h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      pred.score > 80 ? "bg-error" : pred.score > 40 ? "bg-secondary" : "bg-primary"
                    }`}
                    style={{ width: `${pred.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sustainability Intelligence */}
        <div className="p-6 rounded-xl bg-surface-container border border-outline-variant flex flex-col justify-between min-h-[220px]">
          <div>
            <h3 className="font-bold text-base mb-3 flex items-center gap-2">
              <Zap size={18} className="text-primary" />
              <span>Sustainability Intelligence</span>
            </h3>
            
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
              <div className="bg-background p-2.5 rounded border border-outline-variant">
                <span className="text-muted-foreground block text-[9px] uppercase">Carbon Offset Saved</span>
                <span className="font-bold text-sm text-primary">18.4% (Target: 15%)</span>
              </div>
              <div className="bg-background p-2.5 rounded border border-outline-variant">
                <span className="text-muted-foreground block text-[9px] uppercase">Waste Recycled</span>
                <span className="font-bold text-sm text-primary">2,410 kg (92% recycle rate)</span>
              </div>
            </div>

            <div className="mt-4 p-3 rounded bg-primary-container/20 border border-primary/20 text-[10px] leading-relaxed flex items-start gap-2">
              <Sparkles size={16} className="text-primary shrink-0 mt-0.5 animate-pulse" />
              <p className="text-on-surface-variant font-semibold">
                <strong>AI Sustainability Insight:</strong> Redirecting spectator shuttles by 12% via south loop during matches decreases diesel idle emissions by approximately 7.2%. Recommend activating this loop protocol.
              </p>
            </div>
          </div>
        </div>

        {/* Transit Telemetry */}
        <div className="p-6 rounded-xl bg-surface-container border border-outline-variant space-y-4">
          <h3 className="font-bold text-base flex items-center gap-2">
            <Train size={18} className="text-secondary" />
            <span>Transit & Metro Platform Load</span>
          </h3>

          <div className="space-y-3 text-xs leading-normal">
            {[
              { route: "Doha Metro (Red Line)", time: activeEvent === "Metro Delay" ? "Delayed (35m wait)" : "Stable (2m intervals)", load: activeEvent === "Metro Delay" ? "98% (Congested)" : "35% (Clear)" },
              { route: "Shuttle Loop B (Plaza South)", time: "Running (4m wait)", load: "48% (Clear)" },
              { route: "Shuttle Loop A (Plaza North)", time: "Running (6m wait)", load: "74% (Busy)" },
              { route: "Taxi Queue (Exit East)", time: "25m queue wait", load: "92% (Busy)" },
            ].map((trans, idx) => (
              <div key={idx} className="bg-background p-2.5 rounded border border-outline-variant font-semibold">
                <div className="flex justify-between items-center">
                  <h4 className="font-extrabold text-xs">{trans.route}</h4>
                  <span className={`text-[9px] px-1.5 rounded font-bold uppercase ${
                    trans.load.includes("Congested") || trans.load.includes("Busy")
                      ? "bg-secondary-container text-on-secondary-container"
                      : "bg-primary-container text-on-primary-container"
                  }`}>
                    {trans.load}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Status: {trans.time}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
