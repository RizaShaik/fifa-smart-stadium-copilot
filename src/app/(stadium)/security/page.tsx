"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { useRecommendations, useMissionControl, useToggleLock, useTogglePatrol, useVoiceCommand } from "@/hooks/useStadiumApi";
import { MD3DashboardSkeleton } from "@/components/ui/MD3Skeleton";
import ErrorRetryCard from "@/components/ui/ErrorRetryCard";
import {
  Sparkles,
  Shield,
  Eye,
  ShieldAlert,
  Key,
  Wifi,
  WifiOff,
  Bell,
  RefreshCw,
  Sliders,
  CheckCircle,
  Siren,
  Terminal,
  TrendingUp,
  Mic,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface PatrolChecklist {
  id: string;
  zone: string;
  status: "Checked" | "Pending" | "Patrolling";
  criticalRate: "Low" | "Medium" | "High";
}

interface OfflineReport {
  id: string;
  zone: string;
  category: string;
  details: string;
  timestamp: string;
}

export default function SecurityDashboard() {
  const { demoEvent } = useAppStore();
  const queryClient = useQueryClient();

  // Call React Query hooks
  const { data: state, isLoading: stateLoading, error: stateError, refetch: refetchState } = useMissionControl();
  const { data: apiRecs, isLoading: recsLoading, error: recsError, refetch: refetchRecs } = useRecommendations("security");

  // Mutation hooks
  const toggleLockMutation = useToggleLock();
  const togglePatrolMutation = useTogglePatrol();
  const voiceCommandMutation = useVoiceCommand();

  // Local/Offline state
  const [isOffline, setIsOffline] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<OfflineReport[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Security Metrics loaded from backend state
  const metrics = {
    activePatrols: state?.security.active_patrols ?? 18,
    criticalZones: state?.security.critical_zones ?? 2,
    alerts: state?.security.alerts_count ?? 1,
    gateStatus: state?.security.gate_status ?? "All Secured",
  };

  // Lock status state loaded from backend state
  const locks = state?.security.locks || {
    vipLift: true,
    southRamp: true,
    pitchGate: true,
  };

  // Security patrol checklists loaded from backend state
  const patrols: PatrolChecklist[] = (state?.security.patrols || []).map((p: any) => ({
    id: p.id,
    zone: p.zone,
    status: p.status,
    criticalRate: p.criticalRate as any
  }));

  // Voice States
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceResult, setVoiceResult] = useState<string | null>(null);
  const [voiceAnalysis, setVoiceAnalysis] = useState<any | null>(null);

  // Form States
  const [reportZone, setReportZone] = useState("Gate 12 Plaza");
  const [reportCat, setReportCat] = useState("Suspicious behavior");
  const [reportDetails, setReportDetails] = useState("");
  const [submittedReport, setSubmittedReport] = useState<any | null>(null);

  // Event timeline logs
  const [eventLogs, setEventLogs] = useState<string[]>([
    "[18:00] Perimeter sweeps initialized by Team Delta.",
    "[18:15] Shift logs: CCTV camera feeds calibrated.",
    "[18:32] All external security doors locked.",
  ]);

  // AI Security Assistant Recommendation
  const activeRec = React.useMemo(() => {
    if (apiRecs && apiRecs.length > 0) {
      const rec = apiRecs[0];
      return {
        title: rec.title,
        desc: rec.description,
        reason: rec.reason,
        confidence: rec.confidence,
        priority: rec.priority,
        impact: rec.expectedImpact,
        location: rec.affectedZones[0] || "Gate 12",
        expectedOutcome: rec.recommendedAction,
        trigger_telemetry: rec.trigger_telemetry,
        risk_if_ignored: rec.risk_if_ignored,
        resolutionTime: rec.estimatedResolutionTime
      };
    }
    return {
      title: "Direct Sector B ramp crowd flow",
      desc: "Slight congestion developing on Sector B access ramp. Deploy additional nav squads to ease bottlenecks.",
      reason: "Ramp telemetry flow sensors indicate spectator crowd velocity is decreasing.",
      confidence: 88,
      priority: "Low",
      impact: "Restore nominal ramp flow speed.",
      location: "Sector B West Ramp",
      expectedOutcome: "Flow speed restored to standard parameters."
    };
  }, [apiRecs]);

  // Handle Offline reports queue
  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDetails.trim()) return;

    const time = new Date().toLocaleTimeString("en-US", { hour12: false });
    const newReport: OfflineReport = {
      id: "rep-" + Math.random().toString(36).substr(2, 9),
      zone: reportZone,
      category: reportCat,
      details: reportDetails,
      timestamp: time,
    };

    if (isOffline) {
      setOfflineQueue((prev) => [...prev, newReport]);
      setReportDetails("");
      alert("Offline Mode active. Security alert queued locally. Will sync automatically.");
    } else {
      simulateAISubmission(newReport);
    }
  };

  const simulateAISubmission = (report: OfflineReport) => {
    setReportDetails("");
    setSubmittedReport({
      summary: `AI Security Warning: ${report.category} at ${report.zone}`,
      action: `Recommendation: Dispatch Patrol Squad 3. Stream CAM-012 visual override.`,
      priority: report.category.includes("unauthorized") || report.category.includes("child") ? "High" : "Medium",
      assigned: "Patrol Team 3",
      eta: "3 mins",
    });

    setEventLogs((prev) => [
      `[${report.timestamp}] Alert logged: ${report.category} at ${report.zone}`,
      `[${report.timestamp}] AI dispatched: Patrol Team 3 to ${report.zone}`,
      ...prev,
    ]);
  };

  // Sync Offline Queue on reconnect
  useEffect(() => {
    if (!isOffline && offlineQueue.length > 0) {
      setIsSyncing(true);
      
      const timer = setTimeout(() => {
        const time = new Date().toLocaleTimeString("en-US", { hour12: false });
        
        const newLogs = offlineQueue.map((item) => 
          `[${time}] (SYNCED) Offline security alert processed: ${item.category} at ${item.zone}`
        );

        setEventLogs((prev) => [...newLogs, ...prev]);
        setOfflineQueue([]);
        setIsSyncing(false);
        alert("Security logs synced. Telemetry database updated.");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isOffline, offlineQueue]);

  // Simulate Voice input trigger
  const handleTriggerVoice = () => {
    setVoiceActive(true);
    setVoiceResult(null);
    setVoiceAnalysis(null);

    const sampleTranscript = "Gate 12 scan hardware malfunction cleared, turnstiles back online.";

    voiceCommandMutation.mutate({
      role: "security",
      transcript: sampleTranscript
    }, {
      onSuccess: (res) => {
        setVoiceResult(sampleTranscript);
        setVoiceAnalysis(res);
        
        const time = new Date().toLocaleTimeString("en-US", { hour12: false });
        setEventLogs((prev) => [
          `[${time}] Voice report processed: ${res.summary}`,
          `[${time}] AI Action: ${res.action}`,
          ...prev,
        ]);
        setVoiceActive(false);
      },
      onError: (err) => {
        console.error("Voice security command failed:", err);
        setVoiceActive(false);
      }
    });
  };

  const togglePatrol = (id: string) => {
    togglePatrolMutation.mutate(id, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["stadium-state"] });
      }
    });
  };

  const toggleLock = (key: string) => {
    toggleLockMutation.mutate({ lock_key: key, status: !locks[key] }, {
      onSuccess: () => {
        const time = new Date().toLocaleTimeString("en-US", { hour12: false });
        setEventLogs((prev) => [
          `[${time}] Security OVERRIDE: ${key} lock toggled.`,
          ...prev,
        ]);
        queryClient.invalidateQueries({ queryKey: ["stadium-state"] });
      }
    });
  };

  if (stateLoading || recsLoading) {
    return <MD3DashboardSkeleton />;
  }

  if (stateError || recsError) {
    return (
      <ErrorRetryCard
        message={stateError?.message || recsError?.message || "Error loading security operations parameters"}
        onRetry={() => {
          refetchState();
          refetchRecs();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER & OFFLINE TOGGLE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">Security AI Assistant</h1>
          <p className="text-on-surface-variant">Live surveillance monitor, access lock overrides, safety protocols, and AI dispatcher.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOffline(!isOffline)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all border cursor-pointer ${
              isOffline
                ? "bg-error/15 border-error text-error"
                : "bg-primary-container border-primary/20 text-on-primary-container"
            }`}
          >
            {isOffline ? <WifiOff size={14} /> : <Wifi size={14} />}
            <span>{isOffline ? "OFFLINE MODE ACTIVE" : "ONLINE CONNECTED"}</span>
          </button>

          {isSyncing && (
            <div className="flex items-center gap-1.5 text-xs text-primary font-semibold animate-pulse">
              <RefreshCw size={14} className="animate-spin" />
              <span>Syncing database...</span>
            </div>
          )}
        </div>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Patrols", value: metrics.activePatrols, sub: "Staff positioned in sectors" },
          { label: "Critical Risk Zones", value: metrics.criticalZones, sub: "High monitoring focus" },
          { label: "Live System Alerts", value: metrics.alerts, sub: "Unresolved alerts log" },
          { label: "Gate Egress Locks", value: metrics.gateStatus, sub: "Emergency exit overrides" },
        ].map((item, idx) => (
          <div key={idx} className="p-4 rounded-xl bg-surface-container border border-outline-variant shadow-elevation-1">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">{item.label}</span>
            <div className="text-xl font-bold text-primary mt-0.5">{item.value}</div>
            <p className="text-[9px] text-on-surface-variant font-semibold">{item.sub}</p>
          </div>
        ))}
      </div>

      {/* PROACTIVE AI RECOMMENDATIONS & EXPLAINABLE AI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Proactive security warnings */}
        <div className="lg:col-span-7 p-6 rounded-xl bg-surface-container border border-outline-variant space-y-4 shadow-sm ring-1 ring-primary/10">
          <div className="flex justify-between items-center border-b border-outline-variant pb-2">
            <h3 className="font-extrabold text-sm flex items-center gap-1.5 text-primary">
              <Sparkles size={16} className="animate-pulse text-secondary" />
              <span>Proactive AI Security Recommendations</span>
            </h3>
            
            <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase ${
              activeRec.priority === "Critical" ? "bg-error-container text-error" : "bg-secondary-container text-on-secondary-container"
            }`}>
              {activeRec.priority} Priority
            </span>
          </div>

          <div className="bg-background rounded-xl p-4 border border-outline-variant space-y-3">
            <h4 className="font-bold text-sm text-primary">{activeRec.title}</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">{activeRec.desc}</p>
            
            <div className="grid grid-cols-3 gap-2 text-[10px] text-center font-semibold">
              <div className="bg-surface-container p-2 rounded">
                <span className="block text-muted-foreground text-[8px] uppercase">Zone Location</span>
                <span>{activeRec.location}</span>
              </div>
              <div className="bg-surface-container p-2 rounded">
                <span className="block text-muted-foreground text-[8px] uppercase">Expected Impact</span>
                <span className="text-primary">{activeRec.impact}</span>
              </div>
              <div className="bg-surface-container p-2 rounded">
                <span className="block text-muted-foreground text-[8px] uppercase">Confidence</span>
                <span>{activeRec.confidence}%</span>
              </div>
            </div>
            
            <div className="flex gap-2 pt-2 text-[10px] font-bold">
              <button
                onClick={() => {
                  alert("AI Security Protocol approved! Comm logs updated.");
                  setEventLogs(prev => [`[Now] Approved security protocol: ${activeRec.title}`, ...prev]);
                }}
                className="bg-primary text-on-primary px-3 py-2 rounded-lg hover:bg-opacity-95 transition-all shadow-sm cursor-pointer"
              >
                Approve Protocol
              </button>
              <button className="bg-background border border-outline-variant px-3 py-2 rounded-lg hover:bg-surface-container-high cursor-pointer text-muted-foreground">
                Dismiss
              </button>
            </div>
          </div>
        </div>

        {/* Explainable AI */}
        <div className="lg:col-span-5 p-6 rounded-xl bg-surface-container border border-outline-variant flex flex-col justify-between min-h-[240px]">
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <TrendingUp size={16} /> Explainable AI (XAI) Matrix
            </h3>

            <div className="space-y-3 text-xs leading-relaxed overflow-y-auto max-h-[240px]">
              <div className="bg-background p-2.5 rounded border border-outline-variant">
                <span className="font-bold text-primary block text-[9px] uppercase mb-0.5">Why Generated</span>
                {activeRec.reason}
              </div>
              <div className="bg-background p-2.5 rounded border border-outline-variant">
                <span className="font-bold text-primary block text-[9px] uppercase mb-0.5">Trigger Telemetry</span>
                {activeRec.trigger_telemetry || "Locks and gate scanner logs"}
              </div>
              <div className="bg-background p-2.5 rounded border border-outline-variant">
                <span className="font-bold text-primary block text-[9px] uppercase mb-0.5">Confidence Score</span>
                {activeRec.confidence}% security threat match
              </div>
              <div className="bg-background p-2.5 rounded border border-outline-variant">
                <span className="font-bold text-primary block text-[9px] uppercase mb-0.5">Expected Benefit</span>
                {activeRec.impact}
              </div>
              <div className="bg-background p-2.5 rounded border border-outline-variant">
                <span className="font-bold text-primary block text-[9px] uppercase mb-0.5">Resolution Time</span>
                {activeRec.resolutionTime || "10 mins"}
              </div>
              <div className="bg-background p-2.5 rounded border border-outline-variant">
                <span className="font-bold text-primary block text-[9px] uppercase mb-0.5">Risk If Ignored</span>
                {activeRec.risk_if_ignored || "Low Risk"}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* CCTV FEEDS & CHECKLIST */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CCTV stream placeholder */}
        <div className="lg:col-span-8 p-6 rounded-xl bg-surface-container border border-outline-variant space-y-4">
          <h3 className="font-bold text-base flex items-center gap-2 border-b border-outline-variant pb-2">
            <Eye size={18} className="text-primary animate-pulse" />
            <span>Live Surveillance CCTV Feeds</span>
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {[
              { id: "CAM-012", label: "Gate 12 Turnstile entry", state: "Active" },
              { id: "CAM-104", label: "Section 104 concourse B", state: "Active" },
            ].map((feed) => (
              <div key={feed.id} className="relative bg-background aspect-video rounded-lg border border-outline-variant flex flex-col justify-between p-3 select-none">
                <div className="absolute inset-0 bg-neutral-900/10 pointer-events-none" />
                <div className="flex justify-between items-center text-[10px] font-mono font-bold z-10 bg-black/60 text-white p-1 rounded">
                  <span>{feed.id}</span>
                  <span className="text-emerald-400">● LIVE</span>
                </div>
                <div className="text-center font-bold text-[10px] text-muted-foreground uppercase py-4">
                  {feed.label}
                </div>
                <button
                  onClick={() => alert(`AI Analysis override requested on ${feed.id}. Telemetry scanning active.`)}
                  className="w-full bg-surface-container hover:bg-surface-container-high border border-outline-variant text-[9px] font-bold py-1 px-2 rounded mt-auto"
                >
                  Request AI Analytics Scan
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Patrol Checklist */}
        <div className="lg:col-span-4 p-6 rounded-xl bg-surface-container border border-outline-variant space-y-4">
          <h3 className="font-bold text-base flex items-center gap-2 border-b border-outline-variant pb-2">
            <Shield size={18} className="text-secondary" />
            <span>Zone Patrol Checklist</span>
          </h3>

          <div className="space-y-3">
            {patrols.map((pat) => (
              <div
                key={pat.id}
                onClick={() => togglePatrol(pat.id)}
                className="p-3 bg-background rounded border border-outline-variant cursor-pointer hover:bg-surface-container-high transition-colors text-xs flex justify-between items-center"
              >
                <div>
                  <h4 className="font-bold text-on-surface">{pat.zone}</h4>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Critical risk: {pat.criticalRate}</p>
                </div>

                <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase ${
                  pat.status === "Checked"
                    ? "bg-primary-container text-on-primary-container"
                    : pat.status === "Patrolling"
                    ? "bg-secondary-container text-on-secondary-container"
                    : "bg-surface-container text-muted-foreground"
                }`}>
                  {pat.status}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* LOCKS, ACTIONS, VOICE & TIMELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Secure Access & Alarms */}
        <div className="lg:col-span-4 p-6 rounded-xl bg-surface-container border border-outline-variant space-y-6">
          <div className="space-y-3">
            <h3 className="font-bold text-sm flex items-center gap-1.5 text-primary border-b border-outline-variant pb-2">
              <Key size={16} /> Access Locks controls
            </h3>
            
            <div className="grid grid-cols-3 gap-2 text-[10px] text-center font-bold">
              <button
                onClick={() => toggleLock("vipLift")}
                className={`p-3 rounded border transition-all cursor-pointer ${
                  locks.vipLift ? "bg-error/15 border-error text-error" : "bg-background border-outline-variant text-on-surface"
                }`}
              >
                {locks.vipLift ? "🔒 VIP Lift LOCKED" : "🔓 VIP Lift OPEN"}
              </button>
              <button
                onClick={() => toggleLock("southRamp")}
                className={`p-3 rounded border transition-all cursor-pointer ${
                  locks.southRamp ? "bg-error/15 border-error text-error" : "bg-background border-outline-variant text-on-surface"
                }`}
              >
                {locks.southRamp ? "🔒 South Ramp LOCKED" : "🔓 South Ramp OPEN"}
              </button>
              <button
                onClick={() => toggleLock("pitchGate")}
                className={`p-3 rounded border transition-all cursor-pointer ${
                  locks.pitchGate ? "bg-error/15 border-error text-error" : "bg-background border-outline-variant text-on-surface"
                }`}
              >
                {locks.pitchGate ? "🔒 Pitch Gate LOCKED" : "🔓 Pitch Gate OPEN"}
              </button>
            </div>
          </div>

          <div className="space-y-3 border-t border-outline-variant pt-4">
            <h3 className="font-bold text-sm flex items-center gap-1.5 text-error">
              <Siren size={16} /> Emergency Alarms
            </h3>
            
            <button
              onClick={() => {
                alert("Triggered stadium warning siren! Police dispatch activated.");
                setEventLogs(prev => ["[Now] ALERT: Dispatcher manually triggered perimeter safety siren.", ...prev]);
              }}
              className="w-full bg-error text-on-error font-extrabold text-xs py-2 px-3 rounded-lg hover:bg-opacity-95 transition-all cursor-pointer"
            >
              Dispatch Police & Sirens
            </button>
          </div>
        </div>

        {/* Security Intake form */}
        <div className="lg:col-span-4 p-6 rounded-xl bg-surface-container border border-outline-variant flex flex-col justify-between h-[270px]">
          <div>
            <h3 className="font-bold text-base mb-3 flex items-center gap-2">
              <ShieldAlert size={18} className="text-error" />
              <span>Report Security Anomaly</span>
            </h3>

            <form onSubmit={handleReportSubmit} className="space-y-3 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground block font-bold">Zone Location</label>
                <select
                  value={reportZone}
                  onChange={(e) => setReportZone(e.target.value)}
                  className="w-full bg-background border border-outline-variant p-2 rounded cursor-pointer"
                >
                  <option value="Gate 12 Plaza">Gate 12 Plaza</option>
                  <option value="Presidential Suites">Presidential elevator foyer</option>
                  <option value="Metro Walkway">Metro Entrance Walkway</option>
                  <option value="West Stand corridor">West Stand concourse</option>
                </select>
              </div>

              <div className="space-y-1">
                <textarea
                  placeholder="Details of suspicious activity, surge, or locks malfunction..."
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  rows={2}
                  className="w-full bg-background border border-outline-variant p-2 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-on-primary font-bold py-2 rounded text-xs hover:bg-opacity-95 transition-all cursor-pointer"
              >
                Submit Security Alert
              </button>
            </form>
          </div>

          {submittedReport && (
            <div className="bg-background p-2.5 border border-primary/20 rounded text-[9px] leading-relaxed mt-1 flex justify-between">
              <span>{submittedReport.summary}</span>
              <span className="font-bold text-primary">{submittedReport.assigned}</span>
            </div>
          )}
        </div>

        {/* Voice and Timeline */}
        <div className="lg:col-span-4 p-6 rounded-xl bg-surface-container border border-outline-variant flex flex-col justify-between h-[270px]">
          <div className="space-y-4">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Mic size={18} className="text-secondary" />
              <span>AI Voice Security input</span>
            </h3>

            <div className="flex gap-4 items-center bg-background p-3 rounded-xl border border-outline-variant">
              <button
                onClick={handleTriggerVoice}
                disabled={voiceActive}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm cursor-pointer transition-all ${
                  voiceActive ? "bg-error animate-ping" : "bg-primary hover:scale-105 active:scale-95"
                }`}
              >
                <Mic size={18} />
              </button>

              <div className="text-[10px]">
                {voiceActive ? (
                  <span className="text-error font-bold animate-pulse">Recording Speech...</span>
                ) : voiceResult ? (
                  <span className="text-on-surface font-semibold"><em>"{voiceResult}"</em></span>
                ) : (
                  <span className="text-muted-foreground">Tap mic to speak (Simulate: "Gate 12 scanner offline")</span>
                )}
              </div>
            </div>

            {voiceAnalysis && (
              <div className="bg-background p-2.5 rounded border border-outline-variant text-[9px] leading-relaxed">
                <strong>Recommended Action:</strong> {voiceAnalysis.action} (ETA: {voiceAnalysis.resolution})
              </div>
            )}
          </div>

          <div className="border-t border-outline-variant pt-2">
            <span className="block text-[8px] uppercase font-bold text-muted-foreground mb-1">Live Security Logs</span>
            <div className="bg-background rounded p-2 border border-outline-variant font-mono text-[9px] text-primary h-[60px] overflow-y-auto space-y-0.5">
              {eventLogs.map((log, idx) => (
                <div key={idx}>{log}</div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
