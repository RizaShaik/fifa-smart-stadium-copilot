"use client";

import React from "react";
import { User, Shield, CreditCard, Clock, MapPin } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-on-surface">My Profile</h1>
        <p className="text-on-surface-variant">Update user details, verify stadium digital badges, and review match history logs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Basic Info */}
        <div className="p-6 rounded-xl bg-surface-container border border-outline-variant md:col-span-2 space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <User size={20} className="text-primary" />
            <span>Account Details</span>
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-muted-foreground block text-[10px] uppercase font-bold">Full Name</label>
              <input type="text" defaultValue="John Doe" disabled className="w-full bg-background border border-outline-variant p-2 rounded cursor-not-allowed opacity-80" />
            </div>
            <div className="space-y-1">
              <label className="text-muted-foreground block text-[10px] uppercase font-bold">Email Address</label>
              <input type="email" defaultValue="john.doe@fifa-copilot.com" disabled className="w-full bg-background border border-outline-variant p-2 rounded cursor-not-allowed opacity-80" />
            </div>
            <div className="space-y-1">
              <label className="text-muted-foreground block text-[10px] uppercase font-bold">Phone Number</label>
              <input type="text" defaultValue="+974 5555 1234" disabled className="w-full bg-background border border-outline-variant p-2 rounded cursor-not-allowed opacity-80" />
            </div>
            <div className="space-y-1">
              <label className="text-muted-foreground block text-[10px] uppercase font-bold">Preferred Seat Zone</label>
              <input type="text" defaultValue="Sector 104 • Level 1" disabled className="w-full bg-background border border-outline-variant p-2 rounded cursor-not-allowed opacity-80" />
            </div>
          </div>
        </div>

        {/* Digital Fan Pass ID */}
        <div className="p-6 rounded-xl bg-surface-container border border-outline-variant flex flex-col justify-between h-[250px] shadow-elevation-1">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Digital ID Card</span>
              <CreditCard className="text-secondary" size={20} />
            </div>
            
            <h3 className="font-bold text-lg">John Doe</h3>
            <p className="text-xs text-on-surface-variant">Qatar World Cup Fan ID Pass</p>
            
            <div className="mt-4 inline-block bg-primary-container text-on-primary-container text-[10px] px-2.5 py-1 rounded font-bold uppercase tracking-wide">
              ID Verified • Active
            </div>
          </div>
          
          <div className="text-[10px] text-muted-foreground font-mono">
            PASSPORT: *******9832
          </div>
        </div>

      </div>

      {/* Matchday logs / history */}
      <div className="p-6 rounded-xl bg-surface-container border border-outline-variant">
        <h3 className="font-bold text-base mb-4 flex items-center gap-2">
          <Clock size={18} className="text-tertiary" />
          <span>My Stadium Match History</span>
        </h3>
        
        <div className="space-y-3.5 text-xs">
          {[
            { date: "17 Dec 2026", match: "Argentina vs France (Final)", seat: "Sector 104, Row GG, Seat 14" },
            { date: "13 Dec 2026", match: "Argentina vs Croatia (Semi-final)", seat: "Sector 202, Row AA, Seat 3" },
            { date: "09 Dec 2026", match: "Netherlands vs Argentina (Quarter-final)", seat: "Sector 112, Row D, Seat 9" },
          ].map((hist, idx) => (
            <div key={idx} className="flex justify-between items-center border-b border-outline-variant pb-2 last:border-0 last:pb-0">
              <div>
                <h4 className="font-bold">{hist.match}</h4>
                <p className="text-[10px] text-muted-foreground">{hist.seat}</p>
              </div>
              <span className="font-bold text-muted-foreground">{hist.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
