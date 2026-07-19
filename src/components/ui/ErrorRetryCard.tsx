import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorRetryCardProps {
  message?: string;
  onRetry: () => void;
}

export default function ErrorRetryCard({ message = "An error occurred fetching data.", onRetry }: ErrorRetryCardProps) {
  const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false });

  return (
    <div className="p-6 rounded-2xl bg-error-container text-on-error-container border border-error/20 flex flex-col items-center justify-center text-center gap-4 shadow-sm ring-1 ring-error/5 max-w-md mx-auto my-8">
      <div className="p-3 bg-error/15 rounded-full text-error">
        <AlertTriangle size={32} className="animate-bounce" />
      </div>
      
      <div className="space-y-1">
        <h3 className="font-extrabold text-base">Connection Telemetry Error</h3>
        <p className="text-xs text-on-error-container/80 font-medium leading-relaxed">
          {message}
        </p>
      </div>

      <div className="text-[10px] text-muted-foreground font-mono font-bold bg-neutral-900/10 px-2 py-0.5 rounded">
        TIMESTAMP: {timestamp}
      </div>

      <button
        onClick={onRetry}
        className="px-4 py-2 bg-error text-on-error hover:bg-opacity-95 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
      >
        <RefreshCw size={14} />
        <span>Retry Connection</span>
      </button>
    </div>
  );
}
