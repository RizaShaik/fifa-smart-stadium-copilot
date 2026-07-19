"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useAppStore } from "@/store/useAppStore";
import { motion } from "framer-motion";
import { ShieldAlert } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, isInitialized, initializeAuth } = useAuthStore();
  const { activeRole, demoModeEnabled } = useAppStore();

  // Initialize Auth state listener
  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => unsubscribe();
  }, [initializeAuth]);

  // Handle route protection and redirections
  useEffect(() => {
    if (demoModeEnabled) return; // Bypass AuthGuard completely when Demo Mode is enabled

    if (!isInitialized || loading) return;

    if (!user) {
      // Unauthenticated users are redirected to login
      router.push("/login");
      return;
    }

    // Determine the user's role for access checks
    const effectiveRole = user.role;

    // RBAC Route Protection Rules
    const isAccessDenied = () => {
      if (pathname.startsWith("/admin") && effectiveRole !== "admin") return true;
      if (pathname.startsWith("/security") && effectiveRole !== "security" && effectiveRole !== "admin") return true;
      if (pathname.startsWith("/medical") && effectiveRole !== "medical" && effectiveRole !== "admin") return true;
      if (pathname.startsWith("/organizer") && effectiveRole !== "organizer" && effectiveRole !== "admin") return true;
      if (pathname.startsWith("/volunteer") && effectiveRole !== "volunteer" && effectiveRole !== "admin") return true;
      return false;
    };

    if (isAccessDenied()) {
      router.push("/unauthorized");
    }
  }, [user, loading, isInitialized, pathname, activeRole, demoModeEnabled, router]);

  if (demoModeEnabled) {
    return <>{children}</>;
  }

  if (!isInitialized || loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 select-none">
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-[20%] left-[20%] w-[300px] h-[300px] rounded-full bg-primary blur-[80px]" />
          <div className="absolute bottom-[20%] right-[20%] w-[300px] h-[300px] rounded-full bg-secondary blur-[80px]" />
        </div>

        <div className="space-y-6 text-center max-w-sm">
          {/* Glowing Spinner */}
          <div className="flex justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent shadow-elevation-1"
            />
          </div>
          
          <div className="space-y-2">
            <h3 className="font-extrabold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent tracking-wide">
              Stadium Copilot Sync
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Authenticating user credentials and downloading security roles from Firestore...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If user is authenticated, render child page content
  return user ? <>{children}</> : null;
}
