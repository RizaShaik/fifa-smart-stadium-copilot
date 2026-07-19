"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore, UserRole } from "@/store/useAppStore";
import { motion } from "framer-motion";
import {
  Trophy,
  Calendar,
  HelpingHand,
  Shield,
  HeartPulse,
  Lock,
  ArrowRight,
  Sparkles,
  Compass,
  Cpu,
  Tv,
  Sun,
  Moon,
  ChevronRight,
} from "lucide-react";

interface RoleCard {
  title: string;
  desc: string;
  role: UserRole;
  href: string;
  icon: React.ComponentType<any>;
  color: string;
  badge: string;
}

const roleCards: RoleCard[] = [
  {
    title: "Fan Experience",
    desc: "Access digital tickets, concessions fast pass, and AR-guided wayfinding to seat.",
    role: "fan",
    href: "/fan",
    icon: Trophy,
    color: "from-amber-500 to-yellow-600",
    badge: "Matchday Companion",
  },
  {
    title: "Match Organizer",
    desc: "Configure stadium light shows, track attendance volumes, and manage protocols.",
    role: "organizer",
    href: "/organizer",
    icon: Calendar,
    color: "from-emerald-600 to-teal-800",
    badge: "Operations Center",
  },
  {
    title: "Volunteer Center",
    desc: "Check-in for shifts, track assignments, and view broadcasts from leads.",
    role: "volunteer",
    href: "/volunteer",
    icon: HelpingHand,
    color: "from-blue-600 to-cyan-700",
    badge: "Crowd Support",
  },
  {
    title: "Stadium Security",
    desc: "Monitor mock CCTV feeds, check door locks, and respond to safety alerts.",
    role: "security",
    href: "/security",
    icon: Shield,
    color: "from-red-600 to-rose-800",
    badge: "Safety Control",
  },
  {
    title: "Medical Dispatch",
    desc: "Track first-aid responders, dispatch personnel, and log incident reports.",
    role: "medical",
    href: "/medical",
    icon: HeartPulse,
    color: "from-pink-600 to-red-700",
    badge: "Emergency Response",
  },
  {
    title: "System Admin",
    desc: "Verify telemetry logs, check CPU/RAM dials, and trigger database backups.",
    role: "admin",
    href: "/admin",
    icon: Lock,
    color: "from-violet-600 to-indigo-800",
    badge: "Infrastructure",
  },
];

export default function HomePage() {
  const router = useRouter();
  const { setActiveRole, themeMode, toggleTheme } = useAppStore();

  const handleRoleSelection = (role: UserRole, href: string) => {
    setActiveRole(role);
    router.push(href);
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden transition-colors duration-500 bg-background text-foreground flex flex-col">
      {/* Dynamic Background Mesh Gradient */}
      <div className="absolute inset-0 -z-35 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/15 blur-[120px]" />
      </div>

      {/* TOP HEADER */}
      <header className="h-20 border-b border-outline-variant bg-surface/50 backdrop-blur-md sticky top-0 z-50 px-6 max-w-7xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary font-bold text-xl shadow-elevation-2">
            🏆
          </div>
          <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            FIFA Stadium Copilot
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-full hover:bg-surface-container-high transition-colors"
            title="Toggle theme mode"
          >
            {themeMode === "light" ? <Moon size={20} className="text-secondary" /> : <Sun size={20} className="text-secondary" />}
          </button>
          
          <Link
            href="/fan"
            onClick={() => setActiveRole("fan")}
            className="hidden sm:inline-flex bg-primary text-on-primary font-bold text-xs py-2.5 px-4 rounded-full shadow-elevation-1 hover:bg-opacity-95 transition-all"
          >
            Enter App Dashboard
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto w-full px-6 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center flex-1">
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-container text-on-primary-container text-xs font-bold shadow-sm">
            <Sparkles size={14} className="animate-spin-slow" />
            <span>Virtual PromptWars Showcase Project</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-on-surface">
            The Digital Brain of the{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Smart Stadium
            </span>
          </h1>

          <p className="text-lg md:text-xl text-on-surface-variant max-w-xl">
            A production-ready stadium copilot connecting fans, organizers, safety crews, and admin teams. Modular architecture pre-configured for AI agency and digital twin simulations.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <a
              href="#portals"
              className="bg-primary text-on-primary font-extrabold text-sm py-3 px-6 rounded-full flex items-center gap-2 shadow-elevation-2 hover:bg-opacity-95 transition-all group"
            >
              <span>Explore Operations Portals</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </a>
            
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="border border-outline-variant font-bold text-sm py-3 px-6 rounded-full hover:bg-surface-container-high transition-all"
            >
              System Documentation
            </a>
          </div>
        </div>

        {/* ANIMATED DIGITAL TWIN STADIUM GRAPHIC */}
        <div className="lg:col-span-5 flex justify-center items-center">
          <div className="relative w-full max-w-[400px] aspect-square rounded-2xl bg-surface-container border border-outline-variant shadow-elevation-3 flex items-center justify-center p-6 overflow-hidden">
            
            {/* Animated Radar Pulse */}
            <div className="absolute w-[280px] h-[280px] rounded-full border border-primary/20 animate-ping duration-3000 pointer-events-none" />
            <div className="absolute w-[180px] h-[180px] rounded-full border border-secondary/20 animate-ping duration-2000 pointer-events-none" />

            {/* Stadium Shape Mockup SVG */}
            <svg
              className="w-full h-full text-on-surface"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Outer Ring */}
              <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="0.75" strokeDasharray="3 3" className="text-muted-foreground opacity-30" />
              <circle cx="50" cy="50" r="36" stroke="var(--primary)" strokeWidth="1" />
              
              {/* Stands */}
              <circle cx="50" cy="50" r="28" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground opacity-40" />
              <circle cx="50" cy="50" r="22" stroke="var(--secondary)" strokeWidth="0.75" />
              
              {/* Pitch */}
              <rect x="38" y="32" width="24" height="36" rx="1.5" stroke="var(--primary)" strokeWidth="1" fill="var(--primary-container)" fillOpacity="0.15" />
              <line x1="38" y1="50" x2="62" y2="50" stroke="var(--primary)" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="4" stroke="var(--primary)" strokeWidth="0.5" />

              {/* Glowing Sensor Nodes */}
              <circle cx="28" cy="28" r="1.5" fill="var(--primary)" className="animate-pulse" />
              <circle cx="72" cy="28" r="1.5" fill="var(--secondary)" />
              <circle cx="28" cy="72" r="1.5" fill="var(--tertiary)" className="animate-pulse" />
              <circle cx="72" cy="72" r="1.5" fill="var(--error)" />
              
              {/* Holographic lines */}
              <line x1="50" y1="50" x2="28" y2="28" stroke="var(--primary)" strokeWidth="0.25" strokeDasharray="1 1" className="opacity-50 animate-pulse" />
              <line x1="50" y1="50" x2="72" y2="72" stroke="var(--error)" strokeWidth="0.25" strokeDasharray="1 1" className="opacity-50" />
            </svg>

            {/* Micro Badge Details */}
            <div className="absolute top-4 left-4 bg-background/80 backdrop-blur border border-outline-variant rounded px-2 py-1 text-[9px] font-mono font-semibold">
              TWIN SYNC: 100%
            </div>
            <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur border border-outline-variant rounded px-2 py-1 text-[9px] font-mono font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              LUSAIL STADIUM
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE HIGHLIGHTS */}
      <section className="bg-surface-container-low border-y border-outline-variant py-16">
        <div className="max-w-7xl mx-auto w-full px-6">
          <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold">Architecture Highlights</h2>
            <p className="text-sm text-on-surface-variant">Built to scale for subsequent Gemini, Firebase, Google Maps, and physical sensor integrations.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Cpu,
                title: "Agentic Telemetry Ready",
                desc: "Clean modular store configurations using Zustand and types framework, ensuring seamless API attachment in subsequent milestones.",
              },
              {
                icon: Compass,
                title: "Stadium Wayfinding Grid",
                desc: "Ready-to-use routing configurations for fans and dispatchers, easily linkable to real-time indoor AR positioning services.",
              },
              {
                icon: Tv,
                title: "Digital Twin Mock Streams",
                desc: "Integrated state dashboard views displaying CCTV cameras, environmental settings, and emergency security flags.",
              },
            ].map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div key={i} className="flex gap-4 items-start">
                  <div className="p-3 rounded-lg bg-surface-container border border-outline-variant text-primary shadow-sm shrink-0">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm mb-1">{feat.title}</h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* QUICK ROLE ENTRY PORTALS */}
      <section id="portals" className="max-w-7xl mx-auto w-full px-6 py-16 space-y-12">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl md:text-4xl font-extrabold">Operations Control Portals</h2>
          <p className="text-sm text-on-surface-variant">Choose your workspace role. Access custom tools for fans, safety leads, or system support.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roleCards.map((card) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.role}
                whileHover={{ y: -6, boxShadow: "var(--shadow-elevation-2)" }}
                transition={{ duration: 0.25 }}
                className="group relative rounded-2xl bg-surface-container border border-outline-variant overflow-hidden flex flex-col justify-between h-[230px]"
              >
                {/* Visual Gradient Corner */}
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${card.color} opacity-[0.08] group-hover:opacity-[0.14] rounded-bl-full transition-all duration-300`} />

                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] bg-background border border-outline-variant px-2.5 py-0.5 rounded-full font-bold text-muted-foreground">
                      {card.badge}
                    </span>
                    <div className="text-primary group-hover:scale-110 transition-transform duration-300">
                      <Icon size={24} />
                    </div>
                  </div>

                  <h3 className="font-extrabold text-lg text-on-surface group-hover:text-primary transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-2 leading-relaxed max-w-[240px]">
                    {card.desc}
                  </p>
                </div>

                <div className="px-6 py-4 bg-surface-container-high border-t border-outline-variant flex items-center justify-between select-none">
                  <span className="text-xs font-semibold text-muted-foreground group-hover:text-on-surface transition-colors">
                    Launch Role Workspace
                  </span>
                  <button
                    onClick={() => handleRoleSelection(card.role, card.href)}
                    className="p-1.5 rounded-full bg-primary text-on-primary hover:scale-105 active:scale-95 transition-all shadow-sm"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-outline-variant bg-surface-container-low py-8 mt-auto">
        <div className="max-w-7xl mx-auto w-full px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground font-semibold">
          <div>© 2026 FIFA Smart Stadium Copilot. All Rights Reserved.</div>
          <div className="flex items-center gap-6">
            <Link href="/help" className="hover:underline">Help</Link>
            <Link href="/settings" className="hover:underline">Settings</Link>
            <Link href="/profile" className="hover:underline">Profile</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
