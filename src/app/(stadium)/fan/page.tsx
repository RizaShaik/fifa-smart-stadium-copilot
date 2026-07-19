"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import { useAppStore } from "@/store/useAppStore";
import { useRecommendations, useMissionControl } from "@/hooks/useStadiumApi";
import { apiClient } from "@/lib/api-client";
import { MD3DashboardSkeleton } from "@/components/ui/MD3Skeleton";
import ErrorRetryCard from "@/components/ui/ErrorRetryCard";
import {
  Trophy,
  Compass,
  Coffee,
  CloudRain,
  MapPin,
  Train,
  Bus,
  Car,
  AlertCircle,
  Accessibility,
  Plus,
  Heart,
  Clock,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Leaf,
  Activity,
  User,
  Wifi,
  WifiOff,
  RefreshCw,
  Tv,
  CheckCircle2,
} from "lucide-react";

type MatchPhase = "warmup" | "kickoff" | "first-half" | "halftime" | "second-half" | "ended";

interface Recommendation {
  id: string;
  title: string;
  desc: string;
  icon: React.ComponentType<any>;
  severity: "info" | "warning" | "success";
  phase: MatchPhase[];
  // XAI fields
  reason: string;
  confidence: number;
  benefit: string;
  timestamp: string;
  trigger_telemetry?: string;
  risk_if_ignored?: string;
  resolutionTime?: string;
}

interface FoodVendor {
  name: string;
  item: string;
  queueTime: number;
  distance: number; // in meters
  price: string; // $, $$, $$$
  type: ("vegetarian" | "vegan" | "halal" | "gluten-free" | "kids" | "healthy")[];
  aiBadge?: string;
}

interface TransportOption {
  type: string;
  icon: React.ComponentType<any>;
  time: string;
  crowd: "Low" | "Medium" | "High";
  available: boolean;
  aiBadge?: string;
}

export default function FanDashboard() {
  const { user } = useAuthStore();
  const { demoEvent } = useAppStore();

  // Call React Query hooks
  const { data: state, isLoading: stateLoading, error: stateError, refetch: refetchState } = useMissionControl();

  // Assistant State (Preloaded/editable mock values)
  const [favoriteFood, setFavoriteFood] = useState("Halal");
  const [preferredLang, setPreferredLang] = useState("English (US)");
  const [accessibilityOpt, setAccessibilityOpt] = useState("None");
  const [favoriteTransport, setFavoriteTransport] = useState("Metro");
  const [seatLocation, setSeatLocation] = useState("Sect 104, GG-14");

  // Interactive UI state
  const [matchPhase, setMatchPhase] = useState<MatchPhase>("warmup");
  const [selectedXai, setSelectedXai] = useState<Recommendation | null>(null);
  const [foodFilter, setFoodFilter] = useState<string>("all");
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderedItem, setOrderedItem] = useState("");
  const [ticketBlurred, setTicketBlurred] = useState(true);

  // Stepper route state
  const [navigationStep, setNavigationStep] = useState(2); // Current: Concourse

  // AI assistant chat state
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    { sender: "ai", text: "Marhaban! I am your AI Stadium Assistant. I've automatically loaded your favorite preferences (Halal food & Metro navigation). How can I assist you right now?" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const { data: apiRecommendations, isLoading: recLoading, error: recError, refetch: refetchRecs } = useRecommendations("fan", matchPhase);

  // Map API recommendations dynamically to the existing UI interfaces
  const activeRecommendations: Recommendation[] = React.useMemo(() => {
    return (apiRecommendations || []).map((rec) => ({
      id: rec.id,
      title: rec.title,
      desc: rec.description,
      icon: rec.title.includes("Weather") || rec.title.includes("Roof") ? CloudRain : rec.title.includes("Metro") ? Train : AlertCircle,
      severity: rec.priority === "Critical" ? "warning" : rec.priority === "High" ? "warning" : "info",
      phase: ["warmup", "first-half", "halftime", "second-half", "ended"],
      reason: rec.reason,
      confidence: rec.confidence,
      benefit: rec.expectedImpact,
      timestamp: rec.timestamp,
      trigger_telemetry: rec.trigger_telemetry,
      risk_if_ignored: rec.risk_if_ignored,
      resolutionTime: rec.estimatedResolutionTime
    }));
  }, [apiRecommendations]);

  // Derive weatherData from backend state
  const weatherData = state?.weather;

  // Map backend food vendors
  const foodVendors = React.useMemo(() => {
    return (state?.food || []).map((vendor) => ({
      name: vendor.name,
      item: vendor.item,
      queueTime: vendor.queue_time,
      distance: vendor.distance,
      price: vendor.price,
      type: vendor.types as any,
      aiBadge: vendor.ai_recommended ? "AI Recommended" : undefined,
    }));
  }, [state?.food]);

  // Map backend transport options
  const transportOptions = React.useMemo(() => {
    const iconMap: Record<string, any> = {
      "Doha Metro": Train,
      "Metro": Train,
      "Shuttle Bus B": Bus,
      "Shuttle": Bus,
      "Stadium Taxi": Car,
      "Taxi": Car,
      "Ride Sharing": Car,
      "Uber/UberXL": Car,
      "Walking Path": Compass,
      "Walking": Compass
    };

    return (state?.transport?.options || []).map((opt) => {
      let Icon = Compass;
      for (const key in iconMap) {
        if (opt.route.toLowerCase().includes(key.toLowerCase())) {
          Icon = iconMap[key];
          break;
        }
      }
      return {
        type: opt.route,
        icon: Icon,
        time: opt.time,
        crowd: opt.load as any,
        available: true,
        aiBadge: opt.ai_badge || undefined
      };
    });
  }, [state?.transport?.options]);

  // Sync XAI panel with first item of active list on data refresh
  useEffect(() => {
    if (activeRecommendations.length > 0) {
      setSelectedXai(activeRecommendations[0]);
    } else {
      setSelectedXai(null);
    }
  }, [activeRecommendations]);

  if (stateLoading || recLoading) {
    return <MD3DashboardSkeleton />;
  }

  if (stateError || recError) {
    return (
      <ErrorRetryCard
        message={stateError?.message || recError?.message || "Error fetching fan operations telemetry"}
        onRetry={() => {
          refetchState();
          refetchRecs();
        }}
      />
    );
  }

  const handleSendMessage = (textToSend?: string) => {
    const input = textToSend || chatInput;
    if (!input.trim()) return;

    setChatMessages(prev => [...prev, { sender: "user", text: input }]);
    setChatInput("");
    setChatLoading(true);

    apiClient.post<{ reply: string }>("api/stadium/chat", {
      role: "fan",
      scenario: demoEvent,
      phase: matchPhase,
      query: input,
      history: chatMessages
    })
      .then((res) => {
        setChatMessages(prev => [...prev, { sender: "ai", text: res.reply }]);
      })
      .catch((err) => {
        console.error("Chat failed:", err);
        setChatMessages(prev => [...prev, { sender: "ai", text: "Sorry, I am having trouble connecting to the stadium core server." }]);
      })
      .finally(() => {
        setChatLoading(false);
      });
  };



  return (
    <div className="space-y-6">

      {/* 1. TOP WELCOME SCREEN & ACTION BANNER */}
      <div className="bg-gradient-to-r from-primary/95 to-secondary/90 text-on-primary rounded-2xl p-6 shadow-elevation-2 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        {/* Glow vector overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />

        <div className="space-y-2.5 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-[10px] font-bold tracking-wide uppercase">
            <Trophy size={12} className="animate-spin-slow" />
            <span>Lusail Iconic Stadium • Seat GG-14</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Ahlan wa Sahlan, {user?.displayName || "John Doe"}!
          </h1>
          <p className="text-sm text-white/80 max-w-xl">
            Welcome to the final match. Your AI Stadium Assistant is monitoring crowds, weather, and queues to optimize your experience.
          </p>
        </div>

        {/* Dynamic Digital Ticket */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl text-on-surface shadow-elevation-1 shrink-0 w-full sm:w-[280px] z-10"
        >
          <div className="flex justify-between items-center pb-2 border-b border-outline-variant mb-2">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Digital Ticket Code</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary-container text-on-primary-container">
              Verified
            </span>
          </div>

          <div className="flex items-center gap-3 justify-between">
            <div>
              <div className="text-xs font-bold">Portal 104 • Row GG</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Assigned Seat: 14</div>
            </div>

            <button
              onClick={() => setTicketBlurred(!ticketBlurred)}
              className="text-[10px] font-extrabold text-primary border border-primary/20 px-2 py-1 rounded hover:bg-primary-container transition-colors"
            >
              {ticketBlurred ? "Reveal QR" : "Hide QR"}
            </button>
          </div>

          {/* Blur Code Grid */}
          <div className="mt-3 flex items-center justify-center bg-white p-2.5 rounded border border-outline-variant select-none">
            <div className={`w-36 h-8 flex items-center justify-center font-mono text-[10px] text-black font-bold tracking-widest transition-all duration-300 ${ticketBlurred ? "blur-[5px]" : "blur-0"}`}>
              [QR-CODE-GG-14-LUSAIL]
            </div>
          </div>
        </motion.div>
      </div>

      {/* 2. MATCH STATE CONTROLLER (SIMULATING HACKATHON DIALS) */}
      <div className="bg-surface-container p-4 rounded-xl border border-outline-variant flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Tv size={14} /> Smart Match Timeline Control
          </h3>
          <p className="text-[10px] text-on-surface-variant">Click different match phases to simulate Generative AI suggestions shifting in real-time.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { phase: "warmup", label: "Warmup" },
            { phase: "first-half", label: "1st Half" },
            { phase: "halftime", label: "Halftime" },
            { phase: "second-half", label: "2nd Half" },
            { phase: "ended", label: "Match End" },
          ].map((item) => (
            <button
              key={item.phase}
              onClick={() => setMatchPhase(item.phase as MatchPhase)}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all border cursor-pointer ${matchPhase === item.phase
                  ? "bg-primary border-primary text-on-primary shadow-sm"
                  : "bg-background border-outline-variant hover:bg-surface-container-high text-on-surface-variant"
                }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. PROACTIVE COPILOT FEED & EXPLAINABLE AI PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Proactive Recommendations List */}
        <div className="lg:col-span-7 p-6 rounded-xl bg-surface-container border border-outline-variant space-y-4">
          <div className="flex justify-between items-center border-b border-outline-variant pb-3">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2 text-on-surface">
                <Sparkles size={20} className="text-secondary animate-pulse" />
                <span>Proactive AI Suggestions</span>
              </h2>
              <p className="text-[10px] text-on-surface-variant">AI-generated routing, queue bypasses, and safety instructions for current phase.</p>
            </div>
            <span className="text-[9px] px-2 py-0.5 bg-primary/10 text-primary font-bold rounded uppercase">
              {activeRecommendations.length} Live
            </span>
          </div>

          <div className="space-y-3">
            {activeRecommendations.map((rec) => {
              const Icon = rec.icon;
              const isSelected = selectedXai?.id === rec.id;
              return (
                <motion.div
                  key={rec.id}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => setSelectedXai(rec)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex gap-4 items-start ${isSelected
                      ? "bg-primary-container border-primary shadow-sm"
                      : "bg-background border-outline-variant hover:bg-surface-container-high"
                    }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${rec.severity === "warning"
                      ? "bg-error-container text-error"
                      : rec.severity === "success"
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary-container text-on-secondary-container"
                    }`}>
                    <Icon size={18} />
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-center">
                      <h4 className="font-extrabold text-sm">{rec.title}</h4>
                      <ChevronRight size={14} className="text-muted-foreground" />
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {rec.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}

            {activeRecommendations.length === 0 && (
              <div className="text-center py-8 text-xs text-muted-foreground">
                No active notifications for this phase. Nominals running normal.
              </div>
            )}
          </div>
        </div>

        {/* Explainable AI (XAI) Panel */}
        <div className="lg:col-span-5 p-6 rounded-xl bg-surface-container border border-outline-variant flex flex-col justify-between min-h-[300px]">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5">
              <TrendingUp size={16} /> Explainable AI (XAI) telemetry
            </h3>

            {selectedXai ? (
              <div className="space-y-4">
                <div className="bg-primary/5 p-3 rounded-lg border border-primary/10 space-y-1.5">
                  <span className="text-[9px] uppercase font-bold text-primary block">AI Confidence Index</span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-outline-variant h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-500"
                        style={{ width: `${selectedXai.confidence}%` }}
                      />
                    </div>
                    <span className="font-extrabold text-sm">{selectedXai.confidence}%</span>
                  </div>
                </div>

                <div className="space-y-3 text-xs leading-relaxed overflow-y-auto max-h-[220px]">
                  <div>
                    <span className="font-bold text-muted-foreground block text-[9px] uppercase">Why Generated</span>
                    <p className="text-on-surface-variant font-medium mt-0.5">{selectedXai.reason}</p>
                  </div>
                  <div>
                    <span className="font-bold text-muted-foreground block text-[9px] uppercase">Trigger Telemetry</span>
                    <p className="text-on-surface-variant font-medium mt-0.5">{selectedXai.trigger_telemetry || "Sensors within normal range"}</p>
                  </div>
                  <div>
                    <span className="font-bold text-muted-foreground block text-[9px] uppercase">Expected Benefit</span>
                    <p className="text-primary font-bold mt-0.5">{selectedXai.benefit}</p>
                  </div>
                  <div>
                    <span className="font-bold text-muted-foreground block text-[9px] uppercase">Resolution Time</span>
                    <p className="text-on-surface-variant font-medium mt-0.5">{selectedXai.resolutionTime || "10 mins"}</p>
                  </div>
                  <div>
                    <span className="font-bold text-muted-foreground block text-[9px] uppercase">Risk If Ignored</span>
                    <p className="text-error font-bold mt-0.5">{selectedXai.risk_if_ignored || "Low Risk"}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-xs text-muted-foreground">
                Select an AI suggestion on the left to see explainable statistics.
              </div>
            )}
          </div>

          {selectedXai && (
            <div className="border-t border-outline-variant pt-3 text-[10px] text-muted-foreground font-mono mt-4">
              TELEMETRY GENERATION TIME: {selectedXai.timestamp}
            </div>
          )}
        </div>
      </div>

      {/* 4. VISUAL INDOOR NAVIGATION STEPPER */}
      <div className="bg-surface-container p-6 rounded-xl border border-outline-variant space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Compass size={18} /> Visual Indoor Wayfinding Stepper
        </h3>

        <div className="grid grid-cols-5 gap-2 items-center text-center relative select-none">
          {[
            { step: 1, label: "Current Location", val: "North Plaza Gate" },
            { step: 2, label: "Entrance Gate", val: "Gate 12" },
            { step: 3, label: "Concourse", val: "Concourse B East" },
            { step: 4, label: "Section Portal", val: "Portal 104" },
            { step: 5, label: "My Seat", val: "Seat GG-14" },
          ].map((item, idx) => {
            const isActive = navigationStep === item.step;
            const isCompleted = navigationStep > item.step;
            return (
              <React.Fragment key={item.step}>
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm transition-colors ${isActive
                      ? "bg-primary text-on-primary ring-4 ring-primary/20 animate-pulse"
                      : isCompleted
                        ? "bg-primary-container text-on-primary-container"
                        : "bg-background border border-outline-variant text-muted-foreground"
                    }`}>
                    {isCompleted ? "✓" : item.step}
                  </div>
                  <span className="block text-[10px] font-bold mt-2 text-on-surface truncate max-w-full">
                    {item.label}
                  </span>
                  <span className="block text-[9px] text-muted-foreground mt-0.5 truncate max-w-full">
                    {item.val}
                  </span>
                </div>

                {idx < 4 && (
                  <div className={`h-[2px] w-full rounded transition-colors ${navigationStep > item.step ? "bg-primary" : "bg-outline-variant"
                    }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 5. FOOD DISCOVERY WITH DIET FILTERS */}
      <div className="p-6 rounded-xl bg-surface-container border border-outline-variant space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant pb-4">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2 text-on-surface">
              <Coffee size={20} className="text-primary" />
              <span>Food & Concessions Discovery</span>
            </h2>
            <p className="text-[10px] text-on-surface-variant">Locate outlets, check line wait times, and place orders directly to bypass halftime queues.</p>
          </div>

          {/* Diet filters */}
          <div className="flex flex-wrap gap-1.5 bg-background p-1 rounded-lg border border-outline-variant">
            {[
              { id: "all", label: "All Outlets" },
              { id: "halal", label: "Halal" },
              { id: "vegan", label: "Vegan" },
              { id: "vegetarian", label: "Vegetarian" },
              { id: "gluten-free", label: "Gluten-Free" },
              { id: "kids", label: "Kids Meals" },
              { id: "healthy", label: "Healthy" },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setFoodFilter(filter.id)}
                className={`px-3 py-1 rounded-md text-[10px] font-extrabold cursor-pointer transition-colors ${foodFilter === filter.id
                    ? "bg-primary-container text-on-primary-container"
                    : "hover:bg-surface-container text-on-surface-variant"
                  }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Vendors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {foodVendors
            .filter((vendor) => foodFilter === "all" || vendor.type.includes(foodFilter as any))
            .map((vendor, idx) => {
              const isRecommended = vendor.name === "Lusail Grill" && favoriteFood === "Halal";
              return (
                <motion.div
                  key={idx}
                  whileHover={{ y: -4 }}
                  className="bg-background rounded-xl p-4 border border-outline-variant flex flex-col justify-between h-[180px] shadow-sm relative overflow-hidden"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-extrabold text-sm text-on-surface">{vendor.name}</h4>
                        <p className="text-[11px] text-on-surface-variant mt-0.5">{vendor.item}</p>
                      </div>

                      {/* AI Badging */}
                      {(vendor.aiBadge || isRecommended) && (
                        <span className="text-[9px] bg-secondary-container text-on-secondary-container font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Sparkles size={10} className="text-secondary animate-pulse" />
                          <span>{isRecommended ? "AI Recommended" : vendor.aiBadge}</span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-4 text-center text-[10px]">
                      <div className="bg-surface-container p-1 rounded border border-outline-variant">
                        <span className="block text-muted-foreground text-[8px] uppercase">Queue Wait</span>
                        <span className="font-bold text-primary">{vendor.queueTime} mins</span>
                      </div>
                      <div className="bg-surface-container p-1 rounded border border-outline-variant">
                        <span className="block text-muted-foreground text-[8px] uppercase">Distance</span>
                        <span className="font-bold">{vendor.distance} meters</span>
                      </div>
                      <div className="bg-surface-container p-1 rounded border border-outline-variant">
                        <span className="block text-muted-foreground text-[8px] uppercase">Pricing</span>
                        <span className="font-bold">{vendor.price}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setOrderedItem(vendor.item);
                      setOrderModalOpen(true);
                    }}
                    className="w-full bg-primary text-on-primary text-[10px] font-bold py-2 px-3 rounded-lg hover:bg-opacity-95 transition-all mt-3 cursor-pointer"
                  >
                    Pre-Order Food
                  </button>
                </motion.div>
              );
            })}
        </div>
      </div>

      {/* 6. INTERACTIVE TRANSPORTATION HUB */}
      <div className="p-6 rounded-xl bg-surface-container border border-outline-variant space-y-6">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2 text-on-surface">
            <Train size={20} className="text-primary" />
            <span>Transportation & Transit Hub</span>
          </h2>
          <p className="text-[10px] text-on-surface-variant">Check real-time metro schedules, taxi lines, shuttle busses, and walking paths for your exit journey.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {transportOptions.map((opt, idx) => {
            const Icon = opt.icon;
            return (
              <div
                key={idx}
                className="bg-background rounded-xl p-4 border border-outline-variant flex flex-col justify-between h-[160px] shadow-sm relative overflow-hidden"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="p-2 rounded-lg bg-surface-container text-primary">
                      <Icon size={18} />
                    </div>
                    {opt.aiBadge && (
                      <span className="text-[8px] bg-primary-container text-on-primary-container font-extrabold px-1.5 py-0.5 rounded">
                        {opt.aiBadge}
                      </span>
                    )}
                  </div>

                  <h4 className="font-extrabold text-xs text-on-surface">{opt.type}</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Time: {opt.time}</p>
                </div>

                <div className="text-[10px] border-t border-outline-variant pt-2 mt-2 flex justify-between items-center">
                  <span className="text-muted-foreground">Crowd: <strong>{opt.crowd}</strong></span>
                  <span className="font-bold text-primary">Boarding</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. PARKING LOCATOR & SUSTAINABILITY WIDGET */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Parking locator */}
        <div className="p-6 rounded-xl bg-surface-container border border-outline-variant flex flex-col justify-between min-h-[220px]">
          <div>
            <h3 className="font-bold text-base mb-3 flex items-center gap-2">
              <MapPin size={18} className="text-secondary" />
              <span>Assigned Parking Zone</span>
            </h3>

            <div className="space-y-3 text-xs leading-relaxed">
              <p className="text-on-surface-variant">Your vehicle ticket is assigned to the North Stadium Lot.</p>

              <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                <div className="bg-background p-2 rounded border border-outline-variant">
                  <span className="block text-muted-foreground text-[8px] uppercase">Parking Lot</span>
                  <span className="font-bold text-sm">{state?.parking.lot || "Zone B"}</span>
                </div>
                <div className="bg-background p-2 rounded border border-outline-variant">
                  <span className="block text-muted-foreground text-[8px] uppercase">Row / Spot</span>
                  <span className="font-bold text-sm">{state?.parking.row}, #{state?.parking.space || 21}</span>
                </div>
                <div className="bg-background p-2 rounded border border-outline-variant">
                  <span className="block text-muted-foreground text-[8px] uppercase">Walking Time</span>
                  <span className="font-bold text-sm text-primary">{state?.parking.walk_time || 12} mins</span>
                </div>
              </div>
            </div>
          </div>

          <button className="w-full bg-secondary-container text-on-secondary-container font-extrabold text-[10px] py-2 px-3 rounded-lg hover:bg-opacity-90 transition-all mt-4 cursor-pointer">
            Get Directions to {state?.parking.lot || "Zone B"}
          </button>
        </div>

        {/* Sustainability widget */}
        <div className="p-6 rounded-xl bg-surface-container border border-outline-variant flex flex-col justify-between min-h-[220px]">
          <div>
            <h3 className="font-bold text-base mb-3 flex items-center gap-2">
              <Leaf size={18} className="text-primary animate-pulse" />
              <span>Matchday Sustainability Score</span>
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1 bg-background p-2.5 rounded border border-outline-variant">
                <span className="text-muted-foreground block text-[9px] uppercase">CO2 Offset Saved</span>
                <span className="font-bold text-sm text-primary">{state?.sustainability.carbon_saved || "1.8 kg Carbon"}</span>
              </div>
              <div className="space-y-1 bg-background p-2.5 rounded border border-outline-variant">
                <span className="text-muted-foreground block text-[9px] uppercase">Energy Saved</span>
                <span className="font-bold text-sm text-primary">{state?.sustainability.energy_saved || "2 Reusable Cups"}</span>
              </div>
            </div>

            <div className="mt-4 p-3 rounded bg-primary-container/20 border border-primary/20 text-[10px] leading-relaxed flex items-start gap-2">
              <Sparkles size={16} className="text-primary shrink-0 mt-0.5" />
              <p className="text-on-surface-variant font-semibold">
                <strong>AI Sustainability Insight:</strong> {state?.sustainability.ai_insight || "You saved carbon emissions equivalent to 10 stadium spotlight hours by selecting Metro transportation today."}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* 8. PERSONAL ASSISTANT STADIUM PREFERENCES & ACCESSIBILITY OPTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Personal Assistant Prefs */}
        <div className="p-6 rounded-xl bg-surface-container border border-outline-variant space-y-4 lg:col-span-2">
          <h3 className="font-bold text-base flex items-center gap-2">
            <User size={18} className="text-primary" />
            <span>Personal Stadium Assistant Preferences</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground uppercase font-bold">Favorite Food Option</label>
              <select
                value={favoriteFood}
                onChange={(e) => setFavoriteFood(e.target.value)}
                className="w-full bg-background border border-outline-variant p-2 rounded cursor-pointer"
              >
                <option value="Halal">Halal Concessions</option>
                <option value="Vegan">Vegan Concessions</option>
                <option value="Gluten-Free">Gluten-Free Snacks</option>
                <option value="Vegetarian">Vegetarian Cafes</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground uppercase font-bold">Preferred Language</label>
              <select
                value={preferredLang}
                onChange={(e) => setPreferredLang(e.target.value)}
                className="w-full bg-background border border-outline-variant p-2 rounded cursor-pointer"
              >
                <option value="English (US)">English (US)</option>
                <option value="العربية (Arabic)">العربية (Arabic)</option>
                <option value="Español (Spanish)">Español (Spanish)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground uppercase font-bold">Preferred Transportation</label>
              <select
                value={favoriteTransport}
                onChange={(e) => setFavoriteTransport(e.target.value)}
                className="w-full bg-background border border-outline-variant p-2 rounded cursor-pointer"
              >
                <option value="Metro">Doha Metro (Red Line)</option>
                <option value="Shuttle">Shuttle Bus (Terminal A/B)</option>
                <option value="Taxi">Ride Sharing / Cab service</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground uppercase font-bold">Seat Verification</label>
              <input
                type="text"
                value={seatLocation}
                onChange={(e) => setSeatLocation(e.target.value)}
                className="w-full bg-background border border-outline-variant p-2 rounded"
              />
            </div>
          </div>
        </div>

        {/* Accessibility & Assistance options */}
        <div className="p-6 rounded-xl bg-surface-container border border-outline-variant space-y-4">
          <h3 className="font-bold text-base flex items-center gap-2">
            <Accessibility size={18} className="text-secondary" />
            <span>Accessibility & Assistance</span>
          </h3>

          <div className="space-y-3.5 text-xs font-semibold">
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant">
              <div>
                <h4>Wheelchair Routing</h4>
                <p className="text-[9px] text-muted-foreground">Adjust wayfinding to elevator-only routes</p>
              </div>
              <input type="checkbox" className="accent-primary" />
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-outline-variant">
              <div>
                <h4>Hearing Loop Sync</h4>
                <p className="text-[9px] text-muted-foreground">Enable hearing-aid broadcast channel 7</p>
              </div>
              <input type="checkbox" className="accent-primary" />
            </div>

            <div className="flex justify-between items-center">
              <div>
                <h4>Visual Contrast Scale</h4>
                <p className="text-[9px] text-muted-foreground">High-contrast dashboard styling</p>
              </div>
              <input type="checkbox" className="accent-primary" />
            </div>
          </div>
        </div>

      </div>

      {/* 9. AI COPILOT CHAT BOX (INTEGRATED ON THE SIDE FOR QUICK ACCESS) */}
      <div className="p-6 rounded-xl bg-surface-container border border-outline-variant space-y-4">
        <h3 className="font-bold text-base flex items-center gap-2">
          <Sparkles size={18} className="text-secondary animate-pulse" />
          <span>Ask Your AI Stadium Assistant</span>
        </h3>

        {/* Chat log wrapper */}
        <div className="bg-background rounded-lg border border-outline-variant p-4 h-[200px] overflow-y-auto space-y-3">
          {chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`p-3 rounded-lg text-xs leading-relaxed max-w-[80%] ${msg.sender === "user"
                  ? "bg-primary text-on-primary rounded-tr-none"
                  : "bg-surface-container text-on-surface rounded-tl-none border border-outline-variant"
                }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="flex justify-start">
              <div className="p-3 bg-surface-container text-on-surface rounded-lg rounded-tl-none border border-outline-variant text-xs flex items-center gap-1.5">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full" />
                Thinking...
              </div>
            </div>
          )}
        </div>

        {/* Action prompts quick select */}
        <div className="flex flex-wrap gap-2 text-[10px] font-extrabold">
          <button
            onClick={() => handleSendMessage("Where is my seat?")}
            className="bg-background border border-outline-variant rounded-full px-3 py-1 hover:bg-surface-container transition-colors cursor-pointer"
          >
            📍 Find my Seat
          </button>
          <button
            onClick={() => handleSendMessage("Nearest restroom?")}
            className="bg-background border border-outline-variant rounded-full px-3 py-1 hover:bg-surface-container transition-colors cursor-pointer"
          >
            🚻 Restroom wait times
          </button>
          <button
            onClick={() => handleSendMessage("Suggest Halal food")}
            className="bg-background border border-outline-variant rounded-full px-3 py-1 hover:bg-surface-container transition-colors cursor-pointer"
          >
            🍔 Search Halal food
          </button>
          <button
            onClick={() => handleSendMessage("Doha metro status?")}
            className="bg-background border border-outline-variant rounded-full px-3 py-1 hover:bg-surface-container transition-colors cursor-pointer"
          >
            🚇 Metro directions
          </button>
        </div>

        {/* Input box */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type your question..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            className="flex-1 bg-background border border-outline-variant px-3 py-2 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={() => handleSendMessage()}
            className="bg-primary text-on-primary px-4 py-2 rounded-lg text-xs font-bold hover:bg-opacity-95 transition-all cursor-pointer"
          >
            Send
          </button>
        </div>
      </div>

      {/* 10. DIALOG MOCK CONFIRMATIONS */}
      <AnimatePresence>
        {orderModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setOrderModalOpen(false)}
              className="fixed inset-0 bg-black z-50"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed inset-x-4 bottom-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-96 rounded-2xl bg-surface-container border border-outline-variant p-6 shadow-elevation-5 z-50 space-y-4"
            >
              <div className="flex items-center gap-3 text-primary">
                <CheckCircle2 size={32} />
                <div>
                  <h3 className="font-extrabold text-base text-on-surface">Order Confirmed!</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">Pre-order placed successfully.</p>
                </div>
              </div>

              <div className="bg-background p-3 rounded-lg border border-outline-variant text-xs space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Selected Item</span>
                  <span className="text-primary">{orderedItem}</span>
                </div>
                <div className="flex justify-between text-muted-foreground text-[10px]">
                  <span>Pick up Location</span>
                  <span>Concourse B (Portal 104)</span>
                </div>
                <div className="flex justify-between text-muted-foreground text-[10px]">
                  <span>Estimated Ready time</span>
                  <span className="text-emerald-500 font-bold">3 minutes</span>
                </div>
              </div>

              <button
                onClick={() => setOrderModalOpen(false)}
                className="w-full bg-primary text-on-primary font-bold text-xs py-2.5 rounded-lg hover:bg-opacity-95 transition-all cursor-pointer"
              >
                Close Receipt
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
