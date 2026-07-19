"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { useRecommendations, useIncidents, useMissionControl, useToggleTask, useVoiceCommand } from "@/hooks/useStadiumApi";
import { MD3DashboardSkeleton } from "@/components/ui/MD3Skeleton";
import ErrorRetryCard from "@/components/ui/ErrorRetryCard";
import {
  Sparkles,
  CheckCircle,
  Clock,
  MapPin,
  Bell,
  Activity,
  Wifi,
  WifiOff,
  AlertTriangle,
  Compass,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Mic,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface VolunteerTask {
  id: string;
  text: string;
  completed: boolean;
  priority: "High" | "Medium" | "Low";
  location: string;
}

interface OfflineReport {
  id: string;
  category: string;
  details: string;
  timestamp: string;
}

interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  acknowledged: boolean;
}

export default function VolunteerDashboard() {
  const { demoEvent } = useAppStore();
  const queryClient = useQueryClient();

  // Call React Query hooks
  const { data: state, isLoading: stateLoading, error: stateError, refetch: refetchState } = useMissionControl();
  const { data: apiRecs, isLoading: recsLoading, error: recsError, refetch: refetchRecs } = useRecommendations("volunteer");
  const { data: apiIncidents, isLoading: incidentsLoading, error: incidentsError, refetch: refetchIncidents } = useIncidents();

  // Mutation hooks
  const toggleTaskMutation = useToggleTask();
  const voiceCommandMutation = useVoiceCommand();

  // Local/Offline state
  const [isOffline, setIsOffline] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<OfflineReport[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [ackedNotifs, setAckedNotifs] = useState<string[]>([]);

  // Volunteer metrics derived from backend state
  const metrics = {
    completed: state?.volunteers?.completed_tasks ?? 14,
    active: state?.volunteers?.active_assignments ?? 2,
    responseTime: state?.volunteers?.response_time ?? "4.2m",
    nearbyStaff: state?.volunteers?.nearby_staff ?? 8,
  };

  // Shift check-in status
  const [checkedIn, setCheckedIn] = useState(true);

  // Active checklists derived from backend
  const tasks: VolunteerTask[] = (state?.volunteers?.tasks || []).map((t: any) => ({
    id: t.id,
    text: t.text,
    completed: t.completed,
    priority: t.priority as any,
    location: t.location,
  }));

  // Priority notifications loaded from active incidents
  const notifications: NotificationItem[] = React.useMemo(() => {
    return (apiIncidents || []).map((inc) => ({
      id: inc.id,
      title: `${inc.type}`,
      desc: `Location: ${inc.location}. Status: ${inc.status}. Severity: ${inc.severity}.`,
      priority: (inc.severity === "Critical" ? "Critical" : inc.severity === "High" ? "High" : "Medium") as any,
      acknowledged: ackedNotifs.includes(inc.id)
    }));
  }, [apiIncidents, ackedNotifs]);

  // AI Assistant active suggestions (Reactive to demoEvent)
  const activeRec = React.useMemo(() => {
    if (apiRecs && apiRecs.length > 0) {
      const rec = apiRecs[0];
      return {
        title: rec.title,
        desc: rec.description,
        location: rec.affectedZones[0] || "Plaza B",
        eta: rec.estimatedResolutionTime,
        reminder: rec.recommendedAction,
        reason: rec.reason,
        confidence: rec.confidence,
        benefit: rec.expectedImpact,
        trigger_telemetry: rec.trigger_telemetry,
        risk_if_ignored: rec.risk_if_ignored
      };
    }
    return {
      title: "Guide Visitors near Gate 12 Entrance",
      desc: "Gate 12 scans speed dipped. Proactively route volunteer team to assist with ticket QR validation.",
      location: "Gate 12 Outer Plaza",
      eta: "5 mins",
      reminder: "Direct visitors with high phone brightness. Route families to express lane.",
      reason: "Flow telemetry indicates ticket scan rate is dipping. Volunteer presence assists ticket validation speed.",
      confidence: 92,
      benefit: "Reduce visitor queuing time at Gate 12 by 15%."
    };
  }, [apiRecs]);

  // Live AI event timeline
  const [eventTimeline, setEventTimeline] = useState<string[]>([
    "[18:30] Volunteer Alex Carter checked in for Crowd Navigator shift.",
    "[18:45] Gate 12 access points configured for stadium entry.",
    "[18:52] Task: turnstile calibration checklist processed.",
  ]);

  // Voice widget states
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceResult, setVoiceResult] = useState<string | null>(null);
  const [voiceAnalysis, setVoiceAnalysis] = useState<any | null>(null);

  // Form states
  const [reportCat, setReportCat] = useState("Crowd Bottleneck");
  const [reportDetails, setReportDetails] = useState("");
  const [submittedReport, setSubmittedReport] = useState<any | null>(null);

  // Handle Offline report queuing
  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDetails.trim()) return;

    const time = new Date().toLocaleTimeString("en-US", { hour12: false });
    const newReport: OfflineReport = {
      id: "vol-rep-" + Math.random().toString(36).substr(2, 9),
      category: reportCat,
      details: reportDetails,
      timestamp: time,
    };

    if (isOffline) {
      setOfflineQueue((prev) => [...prev, newReport]);
      setReportDetails("");
      alert("Offline Mode active. Incident queued locally on volunteer nodes.");
    } else {
      setReportDetails("");
      setSubmittedReport({
        summary: `Spectator report: ${newReport.category} at volunteer grid sector.`,
        action: `AI Recommendation: Dispatch regional lead to inspect and deploy additional volunteers.`,
        priority: newReport.category.includes("Safety") || newReport.category.includes("Medical") ? "High" : "Medium",
        assigned: "Sector B Response Lead",
        eta: "5 mins",
      });

      setEventTimeline((prev) => [
        `[${time}] Reported issue: ${reportCat} - ${reportDetails}`,
        ...prev,
      ]);
      alert("Report successfully pushed to Mission Control!");
    }
  };

  // Sync Offline Queue on reconnect
  useEffect(() => {
    if (!isOffline && offlineQueue.length > 0) {
      setIsSyncing(true);
      
      const timer = setTimeout(() => {
        const time = new Date().toLocaleTimeString("en-US", { hour12: false });
        
        const newTimelineLogs = offlineQueue.map((item) => 
          `[${time}] (SYNCED) Offline incident report processed: ${item.category}`
        );

        setEventTimeline((prev) => [...newTimelineLogs, ...prev]);
        setOfflineQueue([]);
        setIsSyncing(false);
        alert("Connectivity restored. Synchronized pending reports with Main Mission Control.");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isOffline, offlineQueue]);

  // Simulate Voice input trigger
  const handleTriggerVoice = () => {
    setVoiceActive(true);
    setVoiceResult(null);
    setVoiceAnalysis(null);

    const sampleTranscript = "There is heavy congestion near Gate 5.";

    voiceCommandMutation.mutate({
      role: "volunteer",
      transcript: sampleTranscript
    }, {
      onSuccess: (res) => {
        setVoiceResult(sampleTranscript);
        setVoiceAnalysis(res);
        
        const time = new Date().toLocaleTimeString("en-US", { hour12: false });
        setEventTimeline((prev) => [
          `[${time}] Voice report processed: ${res.summary}`,
          `[${time}] AI Action: ${res.action}`,
          ...prev,
        ]);
        setVoiceActive(false);
      },
      onError: (err) => {
        console.error("Voice volunteer triage failed:", err);
        setVoiceActive(false);
      }
    });
  };

  const handleAckNotification = (id: string) => {
    setAckedNotifs((prev) => [...prev, id]);
  };

  const toggleTask = (id: string) => {
    toggleTaskMutation.mutate(id, {
      onSuccess: () => {
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
        message={stateError?.message || recsError?.message || incidentsError?.message || "Error loading volunteer dashboard parameters"}
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
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">Volunteer AI Assistant</h1>
          <p className="text-on-surface-variant">Access AI-prioritized shift tasks, report issues, and sync offline telemetry.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Offline Sync State Simulator */}
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

      {/* METRICS BANNER */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Completed Tasks", value: metrics.completed, sub: "This shift logs" },
          { label: "Active Assignments", value: metrics.active, sub: "Checklist remaining" },
          { label: "Avg Response Time", value: metrics.responseTime, sub: "Target under 5m" },
          { label: "Nearby Staff", value: metrics.nearbyStaff, sub: "Sector B Grid" },
        ].map((item, idx) => (
          <div key={idx} className="p-4 rounded-xl bg-surface-container border border-outline-variant shadow-elevation-1">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">{item.label}</span>
            <div className="text-xl font-bold text-primary mt-0.5">{item.value}</div>
            <p className="text-[9px] text-on-surface-variant font-semibold">{item.sub}</p>
          </div>
        ))}
      </div>

      {/* DYNAMIC PROACTIVE AI CO-PILOT ASSISTANT & XAI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Proactive Task assistant */}
        <div className="lg:col-span-7 p-6 rounded-xl bg-surface-container border border-outline-variant space-y-4 shadow-sm ring-1 ring-primary/10">
          <div className="flex justify-between items-center border-b border-outline-variant pb-2">
            <h3 className="font-extrabold text-sm flex items-center gap-1.5 text-primary">
              <Sparkles size={16} className="animate-pulse text-secondary" />
              <span>Proactive AI Assistant Recommendations</span>
            </h3>
            <span className="text-[8px] bg-secondary-container text-on-secondary-container font-extrabold px-2 py-0.5 rounded-full">
              Live updates
            </span>
          </div>

          <div className="bg-background rounded-xl p-4 border border-outline-variant space-y-3">
            <h4 className="font-bold text-sm text-primary">{activeRec.title}</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">{activeRec.desc}</p>
            
            <div className="grid grid-cols-3 gap-2 text-[10px] text-center font-semibold">
              <div className="bg-surface-container p-2 rounded">
                <span className="block text-muted-foreground text-[8px] uppercase">Closest Grid</span>
                <span>{activeRec.location}</span>
              </div>
              <div className="bg-surface-container p-2 rounded">
                <span className="block text-muted-foreground text-[8px] uppercase">Walking ETA</span>
                <span className="text-primary">{activeRec.eta}</span>
              </div>
              <div className="bg-surface-container p-2 rounded">
                <span className="block text-muted-foreground text-[8px] uppercase">Confidence</span>
                <span>{activeRec.confidence}%</span>
              </div>
            </div>
            
            <p className="text-[10px] text-on-surface-variant bg-surface-container p-2.5 rounded border border-outline-variant leading-relaxed">
              <strong>Safety Reminder:</strong> {activeRec.reminder}
            </p>
          </div>
        </div>

        {/* Explainable AI Panel */}
        <div className="lg:col-span-5 p-6 rounded-xl bg-surface-container border border-outline-variant flex flex-col justify-between min-h-[220px]">
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
                {activeRec.trigger_telemetry || "Stands and concessions sensor flows"}
              </div>
              <div className="bg-background p-2.5 rounded border border-outline-variant">
                <span className="font-bold text-primary block text-[9px] uppercase mb-0.5">Confidence Score</span>
                {activeRec.confidence}% match with historical event grids
              </div>
              <div className="bg-background p-2.5 rounded border border-outline-variant">
                <span className="font-bold text-primary block text-[9px] uppercase mb-0.5">Expected Benefit</span>
                {activeRec.benefit}
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

      {/* SMART NOTIFICATIONS & CHECKLIST */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Prioritized Notifications */}
        <div className="p-6 rounded-xl bg-surface-container border border-outline-variant space-y-4">
          <h3 className="font-bold text-base flex items-center gap-2 border-b border-outline-variant pb-2">
            <Bell size={18} className="text-secondary" />
            <span>Smart Supervisor Alerts</span>
          </h3>

          <div className="space-y-2">
            {notifications
              .filter((n) => !n.acknowledged)
              .map((not) => (
                <div
                  key={not.id}
                  className={`p-3 rounded-lg border text-xs flex justify-between items-start gap-4 ${
                    not.priority === "Critical"
                      ? "bg-error-container text-on-error-container border-error/20"
                      : not.priority === "High"
                      ? "bg-secondary-container text-on-secondary-container border-secondary/20"
                      : "bg-background border-outline-variant text-on-surface"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{not.title}</span>
                      <span className="text-[8px] bg-black/10 px-1.5 py-0.25 rounded font-extrabold uppercase">
                        {not.priority}
                      </span>
                    </div>
                    <p className="text-on-surface-variant leading-relaxed text-[11px]">
                      {not.desc}
                    </p>
                  </div>

                  <button
                    onClick={() => handleAckNotification(not.id)}
                    className="bg-black/5 hover:bg-black/10 px-2 py-1 rounded text-[10px] font-bold shrink-0"
                  >
                    Acknowledge
                  </button>
                </div>
              ))}
            
            {notifications.filter((n) => !n.acknowledged).length === 0 && (
              <div className="text-center py-8 text-xs text-muted-foreground">
                All supervisor alerts acknowledged. Good job!
              </div>
            )}
          </div>
        </div>

        {/* Checklists */}
        <div className="p-6 rounded-xl bg-surface-container border border-outline-variant space-y-4">
          <h3 className="font-bold text-base flex items-center gap-2 border-b border-outline-variant pb-2">
            <CheckCircle size={18} className="text-primary" />
            <span>Shift Assignments Checklist</span>
          </h3>

          <div className="space-y-2.5">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className="flex items-start gap-3 p-2 bg-background hover:bg-surface-container-high rounded border border-outline-variant cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => {}}
                  className="mt-0.5 accent-primary cursor-pointer"
                />
                <div className="flex-1 text-xs">
                  <span className={`font-semibold block ${task.completed ? "line-through text-muted-foreground" : "text-on-surface"}`}>
                    {task.text}
                  </span>
                  <span className="text-[9px] text-muted-foreground mt-0.5">Location: {task.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* INCIDENT REPORT & VOICE REACTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Incident Reporting form */}
        <div className="p-6 rounded-xl bg-surface-container border border-outline-variant flex flex-col justify-between h-[360px]">
          <div>
            <h3 className="font-bold text-base mb-3 flex items-center gap-2">
              <AlertTriangle size={18} className="text-error animate-pulse" />
              <span>Report Security / Crowd Incident</span>
            </h3>

            <form onSubmit={handleReportSubmit} className="space-y-3 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase font-bold">Anomaly Category</label>
                <select
                  value={reportCat}
                  onChange={(e) => setReportCat(e.target.value)}
                  className="w-full bg-background border border-outline-variant p-2 rounded cursor-pointer"
                >
                  <option value="Crowd Bottleneck">Crowd Egress Bottleneck</option>
                  <option value="Scanner Malfunction">Ticket Scanner offline</option>
                  <option value="Dehydration Alert">Medical: Mild Heat Exhaustion</option>
                  <option value="Suites Lock Out">Suites Elevator error</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase font-bold">Intake Details</label>
                <textarea
                  placeholder="Describe location, crowd flow, and urgency details..."
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  rows={3}
                  className="w-full bg-background border border-outline-variant p-2 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-on-primary font-bold py-2.5 rounded-lg hover:bg-opacity-95 transition-all cursor-pointer"
              >
                Submit Incident Report {offlineQueue.length > 0 ? `(${offlineQueue.length} queued)` : ""}
              </button>
            </form>
          </div>

          {submittedReport && (
            <div className="bg-background p-3 border border-primary/20 rounded-lg text-[10px] leading-relaxed mt-2.5">
              <span className="font-bold text-primary block mb-0.5">AI Analysis Response</span>
              <p className="font-bold text-on-surface">{submittedReport.summary}</p>
              <p className="text-muted-foreground font-semibold mt-0.5">{submittedReport.action}</p>
              <div className="mt-1 flex justify-between font-bold text-primary">
                <span>Assigned: {submittedReport.assigned}</span>
                <span>ETA: {submittedReport.eta}</span>
              </div>
            </div>
          )}
        </div>

        {/* Voice widget & Timeline */}
        <div className="p-6 rounded-xl bg-surface-container border border-outline-variant flex flex-col justify-between h-[360px]">
          <div className="space-y-4">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Mic size={18} className="text-secondary" />
              <span>AI Voice Telemetry input</span>
            </h3>

            <div className="flex gap-4 items-center bg-background p-4 rounded-xl border border-outline-variant">
              <button
                onClick={handleTriggerVoice}
                disabled={voiceActive}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white shrink-0 shadow-elevation-1 cursor-pointer transition-all ${
                  voiceActive ? "bg-error animate-ping" : "bg-primary hover:scale-105 active:scale-95"
                }`}
              >
                <Mic size={20} />
              </button>

              <div className="text-xs">
                <span className="block text-[8px] uppercase font-bold text-muted-foreground mb-0.5">Voice input Status</span>
                {voiceActive ? (
                  <span className="text-error font-bold animate-pulse">Listening / Recording...</span>
                ) : voiceResult ? (
                  <span className="text-on-surface font-semibold">Recognized: <em>"{voiceResult}"</em></span>
                ) : (
                  <span className="text-muted-foreground">Tap mic to speak (Simulate: "There is heavy congestion near Gate 5")</span>
                )}
              </div>
            </div>

            {voiceAnalysis && (
              <div className="bg-background p-3 rounded-lg border border-outline-variant text-[10px] leading-relaxed space-y-1 shadow-sm">
                <div className="flex justify-between font-bold border-b border-outline-variant pb-1">
                  <span className="text-secondary uppercase">AI Speech Understanding</span>
                  <span>Priority: {voiceAnalysis.priority}</span>
                </div>
                <div><strong>Summary:</strong> {voiceAnalysis.summary}</div>
                <div><strong>Recommended Action:</strong> {voiceAnalysis.action}</div>
                <div className="flex justify-between font-bold text-primary mt-1">
                  <span>Squad: {voiceAnalysis.volunteers}</span>
                  <span>Resolution: {voiceAnalysis.resolution}</span>
                </div>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="border-t border-outline-variant pt-3 mt-4">
            <span className="block text-[8px] uppercase font-bold text-muted-foreground mb-2">Live AI Shift logs</span>
            <div className="bg-background rounded p-2.5 border border-outline-variant font-mono text-[9px] text-primary h-[80px] overflow-y-auto space-y-1">
              {eventTimeline.map((log, idx) => (
                <div key={idx}>{log}</div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
