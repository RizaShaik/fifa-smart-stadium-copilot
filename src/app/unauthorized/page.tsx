"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative select-none">
      
      {/* Background blobs */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-10">
        <div className="absolute top-[20%] left-[20%] w-[300px] h-[300px] rounded-full bg-error blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md text-center bg-surface-container border border-outline-variant rounded-2xl p-8 shadow-elevation-2 space-y-6"
      >
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-error-container text-error flex items-center justify-center animate-bounce">
            <ShieldAlert size={36} />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-error">Access Denied</h2>
          <h3 className="font-bold text-sm tracking-wide text-on-surface">Insufficient Credentials</h3>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Your active role doesn't have permissions to view this terminal workspace. For hackathon testing, enable <strong>Demo Mode</strong> inside settings.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="w-full bg-primary text-on-primary font-bold text-xs py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-opacity-95 transition-all shadow-sm"
          >
            <ArrowLeft size={14} />
            <span>Return to Home Portal</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
