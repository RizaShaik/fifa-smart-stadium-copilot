"use client";

import React from "react";
import { Sliders, Bell, Accessibility, Globe, Sparkles } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export default function SettingsPage() {
  const { themeMode, toggleTheme, demoModeEnabled, setDemoModeEnabled } = useAppStore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-on-surface">Settings</h1>
        <p className="text-on-surface-variant">Manage global UI layout presets, custom notifications, accessibility options, and app profiles.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Hackathon Demo Options */}
        <div className="p-6 rounded-xl bg-surface-container border border-outline-variant space-y-4 shadow-sm ring-1 ring-primary/10">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Sparkles size={20} className="text-secondary animate-pulse" />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Hackathon Demo Options</span>
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs pb-3 border-b border-outline-variant">
              <div>
                <h4 className="font-bold">Enable Demo Mode</h4>
                <p className="text-[10px] text-muted-foreground">Bypasses account role restrictions and enables header role switcher</p>
              </div>
              <input
                type="checkbox"
                checked={demoModeEnabled}
                onChange={(e) => setDemoModeEnabled(e.target.checked)}
                className="accent-primary w-4 h-4 cursor-pointer"
              />
            </div>
            <p className="text-[10px] text-on-surface-variant leading-relaxed">
              When enabled, a dropdown menu appears in the header allowing presenters to toggle between the six different stadium views instantly.
            </p>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="p-6 rounded-xl bg-surface-container border border-outline-variant space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Sliders size={20} className="text-primary" />
            <span>Appearance & Theme Settings</span>
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs pb-3 border-b border-outline-variant">
              <div>
                <h4 className="font-bold">Dark / Light Mode Toggle</h4>
                <p className="text-[10px] text-muted-foreground">Adjust high-contrast dashboard visualization</p>
              </div>
              <button
                onClick={toggleTheme}
                className="bg-primary text-on-primary text-xs font-semibold py-1.5 px-3 rounded-md hover:bg-opacity-95 transition-all"
              >
                Switch to {themeMode === "light" ? "Dark" : "Light"} Mode
              </button>
            </div>
            
            <div className="flex items-center justify-between text-xs pb-3 border-b border-outline-variant">
              <div>
                <h4 className="font-bold">Layout Density</h4>
                <p className="text-[10px] text-muted-foreground">Adjust grid spacing size in dashboard</p>
              </div>
              <select className="bg-background border border-outline-variant rounded p-1 text-xs">
                <option>Comfortable</option>
                <option>Compact</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="p-6 rounded-xl bg-surface-container border border-outline-variant space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Bell size={20} className="text-secondary" />
            <span>Notification Controls</span>
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs pb-3 border-b border-outline-variant">
              <div>
                <h4 className="font-bold">Audio Siren Alerts</h4>
                <p className="text-[10px] text-muted-foreground">Trigger sounds for critical safety dispatch events</p>
              </div>
              <input type="checkbox" defaultChecked className="accent-primary" />
            </div>
            
            <div className="flex items-center justify-between text-xs pb-3 border-b border-outline-variant">
              <div>
                <h4 className="font-bold">Volunteer Group Push Notifications</h4>
                <p className="text-[10px] text-muted-foreground">Broadcast messages directly to sector groups</p>
              </div>
              <input type="checkbox" defaultChecked className="accent-primary" />
            </div>
          </div>
        </div>

        {/* Language Section */}
        <div className="p-6 rounded-xl bg-surface-container border border-outline-variant space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Globe size={20} className="text-tertiary" />
            <span>Internationalization</span>
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs pb-3 border-b border-outline-variant">
              <div>
                <h4 className="font-bold">Default System Language</h4>
                <p className="text-[10px] text-muted-foreground">Select local language for directions and guidelines</p>
              </div>
              <select className="bg-background border border-outline-variant rounded p-1 text-xs">
                <option>English (US)</option>
                <option>العربية (Arabic)</option>
                <option>Español (Spanish)</option>
                <option>Français (French)</option>
              </select>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
