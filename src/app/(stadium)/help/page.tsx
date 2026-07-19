"use client";

import React from "react";
import { HelpCircle, PhoneCall, ShieldAlert, Compass, ChevronRight } from "lucide-react";

export default function HelpPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-on-surface">Help Center</h1>
        <p className="text-on-surface-variant">Access stadium safety guidelines, request medical/security support, and explore venue FAQs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Emergency Contacts */}
        <div className="p-6 rounded-xl bg-surface-container border border-outline-variant flex flex-col justify-between h-[250px] shadow-elevation-1">
          <div>
            <h3 className="font-bold text-base mb-2 flex items-center gap-2">
              <ShieldAlert size={18} className="text-error" />
              <span>Safety Emergency Hotline</span>
            </h3>
            <p className="text-xs text-on-surface-variant">Immediately alert local stadium medical or security teams of issues in your sector.</p>
          </div>
          
          <div className="space-y-2 mt-4 text-xs font-bold">
            <a href="tel:999" className="block p-3 rounded bg-error-container text-on-error-container text-center hover:bg-opacity-90 transition-all">
              📞 Direct Call Security Desk
            </a>
            <a href="tel:911" className="block p-3 rounded bg-secondary-container text-on-secondary-container text-center hover:bg-opacity-90 transition-all">
              🚨 Dispatch First Aid Post
            </a>
          </div>
        </div>

        {/* FAQs */}
        <div className="p-6 rounded-xl bg-surface-container border border-outline-variant md:col-span-2 space-y-4">
          <h3 className="font-bold text-base flex items-center gap-2">
            <HelpCircle size={18} className="text-primary" />
            <span>Frequently Asked Questions</span>
          </h3>
          
          <div className="space-y-3.5 text-xs">
            {[
              { q: "Where are the nearest medical posts located?", a: "Medical posts are positioned near Gate 4, Gate 12, and concourse level B west corridor." },
              { q: "What should I do if my digital ticket QR code fails to load?", a: "Proceed to Gate 12 manual assistance desk. Bring your passport or fan pass for ID check." },
              { q: "How can I join the volunteer navigation force?", a: "Register inside the settings page or visit the Volunteer Center headquarters at Sector A." },
            ].map((faq, idx) => (
              <div key={idx} className="bg-background p-3 rounded-lg border border-outline-variant space-y-1">
                <h4 className="font-bold flex items-center gap-1">
                  <ChevronRight size={14} className="text-primary" />
                  <span>{faq.q}</span>
                </h4>
                <p className="text-on-surface-variant pl-4">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
