"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Terminal,
  Database,
  RefreshCw,
  Cpu,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Activity,
  ToggleLeft,
  ToggleRight,
  Sliders,
  AlertTriangle,
} from "lucide-react";
import {
  useStadiumState,
  useTriggerDemoEvent,
  usePauseSimulation,
  useResumeSimulation,
  useResetSimulation,
  useToggleAutoMode,
} from "@/hooks/useStadiumApi";
import { MD3DashboardSkeleton } from "@/components/ui/MD3Skeleton";
import ErrorRetryCard from "@/components/ui/ErrorRetryCard";

export default function AdminPage() {
  const { data: state, isLoading, error, refetch } = useStadiumState();

  const triggerMutation = useTriggerDemoEvent();
  const pauseMutation = usePauseSimulation();
  const resumeMutation = useResumeSimulation();
  const resetMutation = useResetSimulation();
  const autoMutation = useToggleAutoMode();

  if (isLoading) {
    return <MD3DashboardSkeleton />;
  }

  if (error) {
    return <ErrorRetryCard message={error.message} onRetry={refetch} />;
  }

  const sim = state?.simulator || {
    tick_counter: 0,
    scenario_timer: 30,
    is_paused: false,
    fps: 1.0,
    auto_mode: false,
  };

  const currentScenario = state?.scenario || "Normal Match";

  const handleScenarioChange = (scenarioName: string) => {
    triggerMutation.mutate(scenarioName);
  };

  const handleToggleAuto = () => {
    autoMutation.mutate(!sim.auto_mode);
  };

  const scenariosList = [
    { id: "Normal Match", label: "Normal Match", icon: "🟢", color: "border-emerald-500/20" },
    { id: "Goal Scored", label: "Goal Scored", icon: "⚽", color: "border-emerald-600/30" },
    { id: "Halftime Rush", label: "Halftime Rush", icon: "🌭", color: "border-yellow-500/20" },
    { id: "Heavy Rain", label: "Heavy Rain", icon: "🌧️", color: "border-blue-500/20" },
    { id: "Medical Emergency", label: "Medical Emergency", icon: "🚨", color: "border-rose-500/20" },
    { id: "Fire Emergency", label: "Fire Emergency", icon: "🔥", color: "border-red-600/30" },
    { id: "Metro Delay", label: "Metro Delay", icon: "🚇", color: "border-orange-500/20" },
    { id: "VIP Arrival", label: "VIP Arrival", icon: "👑", color: "border-amber-600/30" },
    { id: "Power Failure", label: "Power Failure", icon: "🔌", color: "border-purple-500/20" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">System Admin & Simulator Console</h1>
          <p className="text-on-surface-variant">Control procedural engine scenarios, cycle auto ticks, and override access controls.</p>
        </div>

        {/* Global Reset Trigger */}
        <button
          onClick={() => resetMutation.mutate()}
          className="px-4 py-2 bg-error text-on-error hover:bg-opacity-95 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <RotateCcw size={14} />
          <span>Reset Simulation</span>
        </button>
      </div>

      {/* Simulator Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Tick Counter & FPS */}
        <div className="p-5 rounded-xl bg-surface-container border border-outline-variant flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-semibold uppercase flex items-center gap-1.5">
              <Cpu size={14} /> Simulator Clock
            </span>
            <div className="text-2xl font-bold text-primary">{sim.tick_counter} Ticks</div>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Activity size={10} /> Active Frame rate: {sim.fps} Hz (FPS)
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-extrabold text-xs">
            {sim.tick_counter}
          </div>
        </div>

        {/* Scenario Timer / Countdown */}
        <div className="p-5 rounded-xl bg-surface-container border border-outline-variant flex items-center justify-between shadow-sm">
          <div className="space-y-1 flex-1">
            <span className="text-xs text-muted-foreground font-semibold uppercase flex items-center gap-1.5">
              <Clock size={14} /> Cycle Countdown
            </span>
            <div className="text-2xl font-bold text-primary">
              {sim.auto_mode ? `${sim.scenario_timer}s remaining` : "Manual Hold"}
            </div>
            
            {/* Progress countdown bar */}
            {sim.auto_mode && (
              <div className="w-32 bg-outline-variant h-1.5 rounded-full overflow-hidden mt-1.5">
                <motion.div
                  className="bg-primary h-full"
                  animate={{ width: `${(sim.scenario_timer / 20) * 100}%` }}
                  transition={{ duration: 1, ease: "linear" }}
                />
              </div>
            )}
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-extrabold text-xs">
            ⌛
          </div>
        </div>

        {/* Simulation Toggles */}
        <div className="p-5 rounded-xl bg-surface-container border border-outline-variant flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-semibold uppercase flex items-center gap-1.5">
              Simulation Engine State
            </span>
            <div className="text-lg font-bold text-on-surface">
              {sim.is_paused ? "PAUSED" : "ACTIVE RUNNING"}
            </div>
            <div className="flex gap-2 mt-1">
              {sim.is_paused ? (
                <button
                  onClick={() => resumeMutation.mutate()}
                  className="px-2.5 py-1 bg-primary text-on-primary font-bold text-[10px] rounded-lg hover:bg-opacity-95 flex items-center gap-1 cursor-pointer"
                >
                  <Play size={10} /> Resume
                </button>
              ) : (
                <button
                  onClick={() => pauseMutation.mutate()}
                  className="px-2.5 py-1 bg-surface-container-high border border-outline-variant font-bold text-[10px] rounded-lg hover:bg-surface-container-highest flex items-center gap-1 cursor-pointer"
                >
                  <Pause size={10} /> Pause
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Auto Mode Control */}
        <div className="p-5 rounded-xl bg-surface-container border border-outline-variant flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-semibold uppercase">
              Presenter Auto cycle
            </span>
            <div className="text-lg font-bold text-on-surface">
              {sim.auto_mode ? "Enabled (20s interval)" : "Disabled"}
            </div>
            
            <button
              onClick={handleToggleAuto}
              className="mt-1 flex items-center gap-1 text-xs text-primary font-bold hover:underline cursor-pointer"
            >
              {sim.auto_mode ? (
                <>
                  <ToggleRight className="text-primary" size={24} />
                  <span>Disable Auto Mode</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="text-muted-foreground" size={24} />
                  <span>Enable Auto Mode</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Scenario Control Panel */}
      <div className="p-6 rounded-xl bg-surface-container border border-outline-variant space-y-4 shadow-sm">
        <div className="flex justify-between items-center border-b border-outline-variant pb-3">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <Sliders size={18} className="text-secondary animate-pulse" />
              <span>Simulator Presets Deck</span>
            </h3>
            <p className="text-xs text-muted-foreground">Select any scenario. Telemetry LERPs smoothly across all dashboards.</p>
          </div>
          <div className="text-xs font-bold px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg">
            Active: {currentScenario}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {scenariosList.map((scen) => {
            const isSelected = currentScenario === scen.id;
            return (
              <button
                key={scen.id}
                onClick={() => handleScenarioChange(scen.id)}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center gap-2.5 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-primary text-on-primary border-primary shadow-elevation-2 font-extrabold"
                    : `bg-background text-on-surface-variant hover:bg-surface-container-high ${scen.color}`
                }`}
              >
                <span className="text-2xl">{scen.icon}</span>
                <span className="text-xs font-bold leading-tight">{scen.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Simulator logs and backup twin */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Terminal Logs */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-surface-container border border-outline-variant flex flex-col justify-between h-[300px] shadow-sm">
          <div>
            <h3 className="font-bold text-base mb-3 flex items-center gap-2">
              <Terminal size={18} className="text-secondary" />
              <span>Simulator Engine Telemetry Logs</span>
            </h3>
            
            <div className="bg-background font-mono text-[10px] p-3 rounded border border-outline-variant text-primary overflow-y-auto h-[160px] space-y-1.5">
              <div>[{state?.current_time}] [INFO] Active Scenario: {currentScenario}</div>
              <div>[{state?.current_time}] [INFO] Attendance: {state?.attendance} | Weather temp: {state?.weather.temp}°C</div>
              <div>[{state?.current_time}] [INFO] Metro plat wait time platform load: {state?.transport.platform_load}</div>
              <div>[{state?.current_time}] [INFO] Solar/HVAC status: {state?.weather.roof_status} | HVAC grid: {state?.weather.hvac_load}</div>
              {state?.incidents.map((inc) => (
                <div key={inc.id} className="text-rose-400">
                  [{inc.time}] [ALERT] Anomaly {inc.id}: {inc.type} at {inc.location} ({inc.status})
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between items-center text-xs border-t border-outline-variant pt-2 mt-2">
            <span className="text-muted-foreground text-[10px]">Ticking: {sim.tick_counter} | Auto: {sim.auto_mode ? "ON" : "OFF"}</span>
            <button className="text-[10px] text-primary hover:underline font-bold" onClick={() => refetch()}>
              Force Refresh State
            </button>
          </div>
        </div>

        {/* System Warnings */}
        <div className="p-6 rounded-xl bg-surface-container border border-outline-variant flex flex-col justify-between h-[300px] shadow-sm">
          <div>
            <h3 className="font-bold text-base mb-4 flex items-center gap-2">
              <AlertTriangle size={18} className="text-error" />
              <span>Simulated Locks Status</span>
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between text-xs pb-2.5 border-b border-outline-variant">
                <span>VIP Suites Elevator</span>
                <span className={state?.security.locks.vipLift ? "text-error font-bold" : "text-emerald-500 font-bold"}>
                  {state?.security.locks.vipLift ? "🔒 LOCKED" : "🔓 OPEN"}
                </span>
              </div>
              <div className="flex justify-between text-xs pb-2.5 border-b border-outline-variant">
                <span>South Exit Access Ramp</span>
                <span className={state?.security.locks.southRamp ? "text-error font-bold" : "text-emerald-500 font-bold"}>
                  {state?.security.locks.southRamp ? "🔒 LOCKED" : "🔓 OPEN"}
                </span>
              </div>
              <div className="flex justify-between text-xs pb-2.5 border-b border-outline-variant">
                <span>Pitch Entry Gate</span>
                <span className={state?.security.locks.pitchGate ? "text-error font-bold" : "text-emerald-500 font-bold"}>
                  {state?.security.locks.pitchGate ? "🔒 LOCKED" : "🔓 OPEN"}
                </span>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-muted-foreground bg-background p-2.5 rounded border border-outline-variant leading-relaxed">
            <strong>Lock logic:</strong> Evacuation scenarios release all gates automatically. VIP scenarios isolate suite lifts.
          </div>
        </div>

      </div>
    </div>
  );
}
