"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { useRecommendations, useIncidents, useMissionControl, useAddIncident, useResolveIncident, useVoiceCommand } from "@/hooks/useStadiumApi";
import { MD3DashboardSkeleton } from "@/components/ui/MD3Skeleton";
import ErrorRetryCard from "@/components/ui/ErrorRetryCard";
import {
  Sparkles,
  HeartPulse,
  Plus,
  Radio,
  Navigation,
  Clock,
  Send,
  CheckCircle2,
  Check,
  Flame,
  AlertTriangle,
  UserCheck,
  Activity,
  Wifi,
  WifiOff,
  RefreshCw,
  TrendingUp,
  Mic,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface MedicalIncident {
  id: string;
  location: string;
  type: string;
  time: string;
  status: "Dispatching" | "Responding" | "Resolved";
  severity: "Low" | "Medium" | "High" | "Critical";
}

interface OfflineReport {
  id: string;
  age: string;
  sex: string;
  location: string;
  symptoms: string;
  timestamp: string;
}

export default function MedicalDashboard() {
  const { demoEvent } = useAppStore();
  const queryClient = useQueryClient();

  // Call React Query hooks
  const { data: state, isLoading: stateLoading, error: stateError, refetch: refetchState } = useMissionControl();
  const { data: apiRecs, isLoading: recsLoading, error: recsError, refetch: refetchRecs } = useRecommendations("medical");
  const { data: apiIncidents, isLoading: incidentsLoading, error: incidentsError, refetch: refetchIncidents } = useIncidents();

  // Mutation hooks
  const addIncidentMutation = useAddIncident();
  const resolveIncidentMutation = useResolveIncident();
  const voiceCommandMutation = useVoiceCommand();

  // Local/Offline state
  const [isOffline, setIsOffline] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<OfflineReport[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Medical Metrics loaded from backend state
  const metrics = {
    waiting: state?.medical.waiting_count ?? 1,
    teamsAvailable: state?.medical.teams_available ?? 3,
    avgResponse: state?.medical.response_time ?? "3.4m",
    emergencyStatus: state?.medical.emergency_status ?? "Operational",
  };

  // Active Incident list loaded from backend
  const incidents = React.useMemo(() => {
    return (apiIncidents || []).map((inc) => ({
      id: inc.id,
      location: inc.location,
      type: inc.type,
      time: inc.time,
      status: (inc.status === "Responding" || inc.status === "Resolved" || inc.status === "Dispatching" ? inc.status : "Responding") as any,
      severity: (inc.severity === "Critical" || inc.severity === "High" || inc.severity === "Medium" ? inc.severity : "High") as any,
    }));
  }, [apiIncidents]);

  // Voice States
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceResult, setVoiceResult] = useState<string | null>(null);
  const [voiceAnalysis, setVoiceAnalysis] = useState<any | null>(null);

  // Form States
  const [age, setAge] = useState("32");
  const [sex, setSex] = useState("Male");
  const [location, setLocation] = useState("Sector 104, Row D");
  const [symptoms, setSymptoms] = useState("Heat Exhaustion");
  const [submittedReport, setSubmittedReport] = useState<any | null>(null);

  // Event Logs
  const [eventLogs, setEventLogs] = useState<string[]>([
    "[17:00] Shift start: Medical Teams Alpha, Beta, Gamma checked in.",
    "[17:15] First Aid Kit check Concourse B complete.",
    "[17:29] Case MED-23: Dispatched First Aid Team Alpha.",
  ]);

  // AI Medical Triage Assistant Recommendation (Reactive to state)
  const activeRec = React.useMemo(() => {
    if (apiRecs && apiRecs.length > 0) {
      const rec = apiRecs[0];
      const isCardiac = rec.title.toLowerCase().includes("cardiac") || rec.reason.toLowerCase().includes("cardiac");
      return {
        title: rec.title,
        desc: rec.description,
        reason: rec.reason,
        confidence: rec.confidence,
        priority: rec.priority,
        severity: isCardiac ? "Critical" : "High",
        team: isCardiac ? "Team Alpha (AED)" : "Team Beta (First Aid)",
        unit: rec.affectedZones[0] || "Sector 104",
        eta: rec.estimatedResolutionTime,
        protocol: rec.recommendedAction,
        trigger_telemetry: rec.trigger_telemetry,
        risk_if_ignored: rec.risk_if_ignored,
        impact: rec.expectedImpact
      };
    }
    return {
      title: "Triage Alert: Heat Exhaustion (Sector 104)",
      desc: "Spectator reports dizziness and dehydration at Sector 104 Row GG. Hydration dispatch required.",
      priority: "High",
      severity: "High",
      team: "First Aid Team Alpha",
      unit: "Concourse B East Post",
      eta: "3 mins",
      protocol: "Rehydration salts, move patient to shaded Concourse corridor, monitor vitals.",
      reason: "Spectator reports dizziness under closed roof environment. Team Alpha has hydration kit and is closest to concourse B.",
      confidence: 92,
      expectedOutcome: "Immediate patient hydration recovery."
    };
  }, [apiRecs]);

  // Handle Offline triage queuing
  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const time = new Date().toLocaleTimeString("en-US", { hour12: false });
    const newReport: OfflineReport = {
      id: "rep-" + Math.random().toString(36).substr(2, 9),
      age,
      sex,
      location,
      symptoms,
      timestamp: time,
    };

    if (isOffline) {
      setOfflineQueue((prev) => [...prev, newReport]);
      alert("Offline Mode active. Triage ticket queued locally. Will sync automatically.");
    } else {
      simulateAISubmission(newReport);
    }
  };

  const simulateAISubmission = (report: OfflineReport) => {
    const isCardiac = report.symptoms.toLowerCase().includes("cardiac") || report.symptoms.toLowerCase().includes("chest");
    const rec = {
      summary: `AI Triage: ${isCardiac ? "Critical Cardiac distress" : "Heat Exhaustion"} report at ${report.location}`,
      action: `Recommendation: Dispatch ${isCardiac ? "Team Alpha" : "Team Beta"}. Priority: ${isCardiac ? "Critical" : "High"}`,
      assigned: isCardiac ? "First Aid Team Alpha" : "First Aid Team Beta",
      eta: "3 mins",
    };
    
    setSubmittedReport(rec);

    addIncidentMutation.mutate({
      location: report.location,
      type: report.symptoms,
      status: "Responding",
      severity: isCardiac ? "Critical" : "High",
    }, {
      onSuccess: () => {
        setEventLogs((prev) => [
          `[${report.timestamp}] Medical alert: ${report.symptoms} logged at ${report.location}`,
          `[${report.timestamp}] AI Triage: Dispatched ${rec.assigned} (ETA ${rec.eta})`,
          ...prev,
        ]);
        queryClient.invalidateQueries({ queryKey: ["stadium-state"] });
      }
    });
  };

  // Sync Offline Queue on reconnect
  useEffect(() => {
    if (!isOffline && offlineQueue.length > 0) {
      setIsSyncing(true);
      
      Promise.all(
        offlineQueue.map((item) => {
          const isCardiac = item.symptoms.toLowerCase().includes("cardiac") || item.symptoms.toLowerCase().includes("chest");
          return addIncidentMutation.mutateAsync({
            location: item.location,
            type: item.symptoms,
            status: "Responding",
            severity: isCardiac ? "Critical" : "High",
          });
        })
      ).then(() => {
        const time = new Date().toLocaleTimeString("en-US", { hour12: false });
        const newLogs = offlineQueue.map((item) => 
          `[${time}] (SYNCED) Offline medical dispatch processed: ${item.symptoms} at ${item.location}`
        );

        setEventLogs((prev) => [...newLogs, ...prev]);
        setOfflineQueue([]);
        setIsSyncing(false);
        alert("Medical dispatch tickets synced with main database.");
        queryClient.invalidateQueries({ queryKey: ["stadium-state"] });
      }).catch((err) => {
        console.error("Sync failed:", err);
        setIsSyncing(false);
      });
    }
  }, [isOffline, offlineQueue, queryClient]);

  // Simulate Voice input trigger
  const handleTriggerVoice = () => {
    setVoiceActive(true);
    setVoiceResult(null);
    setVoiceAnalysis(null);

    const sampleTranscript = "First Aid post 2 reports restocking complete. Dehydration kits filled.";

    voiceCommandMutation.mutate({
      role: "medical",
      transcript: sampleTranscript
    }, {
      onSuccess: (res) => {
        setVoiceResult(sampleTranscript);
        setVoiceAnalysis(res);
        const time = new Date().toLocaleTimeString("en-US", { hour12: false });
        setEventLogs((prev) => [
          `[${time}] Voice report processed: ${res.summary}`,
          ...prev,
        ]);
        setVoiceActive(false);
      },
      onError: (err) => {
        console.error("Voice triage command failed:", err);
        setVoiceActive(false);
      }
    });
  };

  const handleResolveCase = (id: string) => {
    resolveIncidentMutation.mutate(id, {
      onSuccess: () => {
        const time = new Date().toLocaleTimeString("en-US", { hour12: false });
        setEventLogs((prev) => [`[${time}] Case ${id} resolved by responder squad.`, ...prev]);
        queryClient.invalidateQueries({ queryKey: ["stadium-state"] });
      }
    });
  };

  if (stateLoading || recsLoading || incidentsLoading) {
    return <MD3DashboardSkeleton />;
  }

  if (stateError || recsError || incidentsError) {
    return (
      <ErrorRetryCard
        message={stateError?.message || recsError?.message || incidentsError?.message || "Error loading medical operations telemetry"}
        onRetry={() => {
          refetchState();
          refetchRecs();
          refetchIncidents();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER & OFFLINE TOGGLE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">Medical AI Assistant</h1>
          <p className="text-on-surface-variant">Emergency medical dispatch center, AI patient triage systems, and responder telemetry.</p>
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
          { label: "Patients Waiting", value: metrics.waiting, sub: "Triage queue count" },
          { label: "Responder Teams Available", value: metrics.teamsAvailable, sub: "Alpha/Beta/Gamma standby" },
          { label: "Avg Response ETA", value: metrics.avgResponse, sub: "Target under 4m" },
          { label: "Emergency Status", value: metrics.emergencyStatus, sub: "Operations clearance" },
        ].map((item, idx) => (
          <div key={idx} className="p-4 rounded-xl bg-surface-container border border-outline-variant shadow-elevation-1">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">{item.label}</span>
            <div className="text-xl font-bold text-primary mt-0.5">{item.value}</div>
            <p className="text-[9px] text-on-surface-variant font-semibold">{item.sub}</p>
          </div>
        ))}
      </div>

      {/* PROACTIVE AI TRIAGE ASSISTANT & EXPLAINABLE AI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Proactive medical triage card */}
        <div className="lg:col-span-7 p-6 rounded-xl bg-surface-container border border-outline-variant space-y-4 shadow-sm ring-1 ring-primary/10">
          <div className="flex justify-between items-center border-b border-outline-variant pb-2">
            <h3 className="font-extrabold text-sm flex items-center gap-1.5 text-primary">
              <Sparkles size={16} className="animate-pulse text-secondary" />
              <span>AI Triage Dispatch Recommendations</span>
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
            
            <div className="grid grid-cols-4 gap-2 text-[9px] text-center font-bold">
              <div className="bg-surface-container p-2 rounded">
                <span className="block text-muted-foreground text-[8px] uppercase">Severity</span>
                <span>{activeRec.severity}</span>
              </div>
              <div className="bg-surface-container p-2 rounded">
                <span className="block text-muted-foreground text-[8px] uppercase">Recommend Team</span>
                <span className="text-primary">{activeRec.team}</span>
              </div>
              <div className="bg-surface-container p-2 rounded">
                <span className="block text-muted-foreground text-[8px] uppercase">Closest Unit</span>
                <span>{activeRec.unit}</span>
              </div>
              <div className="bg-surface-container p-2 rounded">
                <span className="block text-muted-foreground text-[8px] uppercase">ETA</span>
                <span className="text-primary">{activeRec.eta}</span>
              </div>
            </div>

            <p className="text-[10px] text-on-surface-variant bg-surface-container p-2.5 rounded border border-outline-variant leading-relaxed">
              <strong>Treatment Protocol:</strong> {activeRec.protocol}
            </p>
            
            <div className="flex gap-2 pt-2 text-[10px] font-bold">
              <button
                onClick={() => {
                  alert(`Medics Dispatched: ${activeRec.team}. Dispatch telemetry locked.`);
                  setEventLogs(prev => [`[Now] Dispatched medical response: ${activeRec.team} to ${activeRec.unit}`, ...prev]);
                }}
                className="bg-primary text-on-primary px-3 py-2 rounded-lg hover:bg-opacity-95 transition-all shadow-sm cursor-pointer"
              >
                Approve Dispatch
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
              <TrendingUp size={16} /> Explainable AI (XAI) Triage Reasoning
            </h3>

            <div className="space-y-3 text-xs leading-relaxed overflow-y-auto max-h-[240px]">
              <div className="bg-background p-2.5 rounded border border-outline-variant">
                <span className="font-bold text-primary block text-[9px] uppercase mb-0.5">Why Generated</span>
                {activeRec.reason}
              </div>
              <div className="bg-background p-2.5 rounded border border-outline-variant">
                <span className="font-bold text-primary block text-[9px] uppercase mb-0.5">Trigger Telemetry</span>
                {activeRec.trigger_telemetry || "Vital sign and location trackers"}
              </div>
              <div className="bg-background p-2.5 rounded border border-outline-variant">
                <span className="font-bold text-primary block text-[9px] uppercase mb-0.5">Confidence Score</span>
                {activeRec.confidence}% clinical path match
              </div>
              <div className="bg-background p-2.5 rounded border border-outline-variant">
                <span className="font-bold text-primary block text-[9px] uppercase mb-0.5">Expected Benefit</span>
                {activeRec.impact}
              </div>
              <div className="bg-background p-2.5 rounded border border-outline-variant">
                <span className="font-bold text-primary block text-[9px] uppercase mb-0.5">Resolution Time</span>
                {activeRec.eta || "10 mins"}
              </div>
              <div className="bg-background p-2.5 rounded border border-outline-variant">
                <span className="font-bold text-primary block text-[9px] uppercase mb-0.5">Risk If Ignored</span>
                {activeRec.risk_if_ignored || "Low Risk"}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* DISPATCH QUEUE & POST STATUS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Active cases queue */}
        <div className="lg:col-span-8 p-6 rounded-xl bg-surface-container border border-outline-variant space-y-4">
          <h3 className="font-bold text-base flex items-center gap-2 border-b border-outline-variant pb-2">
            <Radio size={18} className="text-primary animate-pulse" />
            <span>Active Dispatch Queue</span>
          </h3>

          <div className="space-y-2.5">
            {incidents.map((incident) => (
              <div key={incident.id} className="p-3 bg-background rounded border border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded">
                      {incident.id}
                    </span>
                    <span className="font-bold">{incident.type}</span>
                    <span className={`text-[8px] px-1.5 rounded uppercase font-bold ${
                      incident.severity === "Critical"
                        ? "bg-error-container text-on-error-container"
                        : "bg-secondary-container text-on-secondary-container"
                    }`}>
                      {incident.severity}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-3">
                    <span className="flex items-center gap-0.5"><Navigation size={10} /> {incident.location}</span>
                    <span className="flex items-center gap-0.5"><Clock size={10} /> Reported {incident.time}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[9px] px-1.5 py-0.25 rounded font-extrabold ${
                    incident.status === "Responding" ? "bg-primary-container text-on-primary-container" : "bg-surface-container text-muted-foreground"
                  }`}>
                    {incident.status}
                  </span>
                  
                  {incident.status === "Responding" && (
                    <button
                      onClick={() => handleResolveCase(incident.id)}
                      className="bg-primary text-on-primary text-[10px] font-bold py-1 px-2.5 rounded hover:bg-opacity-95 transition-all cursor-pointer"
                    >
                      Resolve Case
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Post tracking */}
        <div className="lg:col-span-4 p-6 rounded-xl bg-surface-container border border-outline-variant space-y-4">
          <h3 className="font-bold text-base flex items-center gap-2 border-b border-outline-variant pb-2">
            <Activity size={18} className="text-secondary" />
            <span>Medical Post Status</span>
          </h3>

          <div className="space-y-3.5 text-xs font-semibold">
            {[
              { name: "First Aid Post 1 (Concourse B)", status: "Active Dispatch", cap: "High" },
              { name: "First Aid Post 2 (Concourse C)", status: "Available", cap: "Low" },
              { name: "Presidential Suite Post", status: "Available", cap: "Low" },
              { name: "South Ambulance Gate 4", status: "Available", cap: "Low" },
            ].map((post, idx) => (
              <div key={idx} className="flex justify-between items-center pb-2 border-b border-outline-variant last:border-0 last:pb-0">
                <div>
                  <h4>{post.name}</h4>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Post Capacity: {post.cap}</p>
                </div>

                <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                  post.status.includes("Dispatch") ? "bg-error-container text-error" : "bg-primary-container text-on-primary-container"
                }`}>
                  {post.status}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* DISPATCH INPUTS, ACTIONS, VOICE & TIMELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Triage intake form */}
        <div className="lg:col-span-4 p-6 rounded-xl bg-surface-container border border-outline-variant flex flex-col justify-between h-[270px]">
          <div>
            <h3 className="font-bold text-base mb-3 flex items-center gap-2">
              <Plus size={18} className="text-primary" />
              <span>Report Triage Incident</span>
            </h3>

            <form onSubmit={handleReportSubmit} className="space-y-3 text-xs font-semibold">
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] text-muted-foreground uppercase font-bold">Age</label>
                  <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full bg-background border border-outline-variant p-2 rounded" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-muted-foreground uppercase font-bold">Sex</label>
                  <select value={sex} onChange={(e) => setSex(e.target.value)} className="w-full bg-background border border-outline-variant p-2 rounded cursor-pointer">
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-muted-foreground uppercase font-bold">Symptom</label>
                  <select value={symptoms} onChange={(e) => setSymptoms(e.target.value)} className="w-full bg-background border border-outline-variant p-2 rounded cursor-pointer">
                    <option value="Heat Exhaustion">Heat Exhaustion</option>
                    <option value="Cardiac distress">Cardiac distress</option>
                    <option value="Minor cut / bleed">Minor cut / bleed</option>
                    <option value="Structural slip">Structural slip</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase font-bold">Stand coordinates</label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-background border border-outline-variant p-2 rounded" />
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-on-primary font-bold py-2 rounded text-xs hover:bg-opacity-95 transition-all cursor-pointer"
              >
                Submit Triage Ticket
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

        {/* Voice report */}
        <div className="lg:col-span-4 p-6 rounded-xl bg-surface-container border border-outline-variant flex flex-col justify-between h-[270px]">
          <div className="space-y-4">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Mic size={18} className="text-secondary" />
              <span>AI Voice Triage input</span>
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
                  <span className="text-muted-foreground">Tap mic (Simulate: "First Aid post 2 restocked")</span>
                )}
              </div>
            </div>

            {voiceAnalysis && (
              <div className="bg-background p-2.5 rounded border border-outline-variant text-[9px] leading-relaxed">
                <strong>Recommended Action:</strong> {voiceAnalysis.action}
              </div>
            )}
          </div>

          <div className="border-t border-outline-variant pt-2">
            <span className="block text-[8px] uppercase font-bold text-muted-foreground mb-1">Live Medical Logs</span>
            <div className="bg-background rounded p-2 border border-outline-variant font-mono text-[9px] text-primary h-[60px] overflow-y-auto space-y-0.5">
              {eventLogs.map((log, idx) => (
                <div key={idx}>{log}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Emergency dispatch override */}
        <div className="lg:col-span-4 p-6 rounded-xl bg-surface-container border border-outline-variant space-y-6 flex flex-col justify-between h-[270px]">
          <div className="space-y-3">
            <h3 className="font-bold text-sm flex items-center gap-1.5 text-error border-b border-outline-variant pb-2">
              <AlertTriangle size={16} /> Emergency Hospital Routing
            </h3>
            
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              Auto-assign ambulance extraction route to Hamad General Hospital. Override gate locks on exit tunnels.
            </p>
          </div>

          <button
            onClick={() => {
              alert("Presidential medical evac corridor unlocked. Emergency ambulance routing en-route.");
              setEventLogs(prev => ["[Now] ALERT: Hospital evacuation tunnel routing activated.", ...prev]);
            }}
            className="w-full bg-error text-on-error font-extrabold text-xs py-2.5 rounded-lg hover:bg-opacity-95 transition-all cursor-pointer"
          >
            Activate Evacuation Route
          </button>
        </div>

      </div>

    </div>
  );
}
