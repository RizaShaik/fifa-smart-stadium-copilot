"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useAppStore, UserRole } from "@/store/useAppStore";
import { motion, AnimatePresence } from "framer-motion";
import { Key, Mail, User, Sparkles, AlertCircle, RefreshCw } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, error, loginWithEmail, loginWithGoogle, signUpWithEmail, sendPasswordReset, clearError } = useAuthStore();
  const { themeMode, toggleTheme } = useAppStore();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("fan");
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // If user is already authenticated, redirect to home
  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  // Clear errors on tab transition
  useEffect(() => {
    clearError();
    setFeedbackMsg(null);
  }, [isSignUp, forgotPasswordMode, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);

    if (forgotPasswordMode) {
      if (!email) {
        return;
      }
      try {
        await sendPasswordReset(email);
        setFeedbackMsg("Password reset email sent. Please check your inbox.");
      } catch (err) {}
      return;
    }

    if (isSignUp) {
      if (!email || !password || !displayName) {
        return;
      }
      try {
        await signUpWithEmail(email, password, displayName, role);
      } catch (err) {}
    } else {
      if (!email || !password) {
        return;
      }
      try {
        await loginWithEmail(email, password);
      } catch (err) {}
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative select-none transition-colors duration-500">
      
      {/* Background blobs */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[10%] left-[10%] w-[400px] h-[400px] rounded-full bg-primary blur-[120px]" />
        <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-secondary blur-[120px]" />
      </div>

      {/* Floating Theme Button */}
      <div className="absolute top-6 right-6">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-full bg-surface-container border border-outline-variant hover:bg-surface-container-high transition-colors"
        >
          {themeMode === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
        </button>
      </div>

      {/* Auth Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl bg-surface-container border border-outline-variant p-8 shadow-elevation-3 relative"
      >
        {/* Branding header */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center gap-1 bg-primary-container text-on-primary-container px-3 py-1 rounded-full text-[10px] font-bold shadow-sm">
            <Sparkles size={12} />
            <span>FIFA Smart Stadium Copilot</span>
          </div>
          
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {forgotPasswordMode
              ? "Recover Credentials"
              : isSignUp
              ? "Create Workspace"
              : "Access Workspace"}
          </h2>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {forgotPasswordMode
              ? "Enter your registered email to receive a password reset link."
              : isSignUp
              ? "Sign up below and choose your stadium operational role."
              : "Sign in with your email or Google account to continue."}
          </p>
        </div>

        {/* Feedback / Error Alerts */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3 rounded-lg bg-error-container text-on-error-container text-xs font-semibold flex items-start gap-2 border border-error/20"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {feedbackMsg && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3 rounded-lg bg-primary-container text-on-primary-container text-xs font-semibold flex items-start gap-2 border border-primary/20"
            >
              <Sparkles size={16} className="shrink-0 mt-0.5" />
              <span>{feedbackMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Forms */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Full Name (Sign Up only) */}
          {isSignUp && !forgotPasswordMode && (
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide block">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-3 text-muted-foreground" />
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-background border border-outline-variant p-2.5 pl-10 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-semibold"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide block">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3 text-muted-foreground" />
              <input
                type="email"
                required
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background border border-outline-variant p-2.5 pl-10 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-semibold"
              />
            </div>
          </div>

          {/* Password (Login / Sign Up only) */}
          {!forgotPasswordMode && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide block">Password</label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => setForgotPasswordMode(true)}
                    className="text-[10px] font-bold text-primary hover:underline focus:outline-none"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Key size={16} className="absolute left-3 top-3 text-muted-foreground" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background border border-outline-variant p-2.5 pl-10 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-semibold"
                />
              </div>
            </div>
          )}

          {/* Role selector dropdown (Sign Up only) */}
          {isSignUp && !forgotPasswordMode && (
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide block">System Access Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full bg-background border border-outline-variant p-2.5 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors font-semibold cursor-pointer"
              >
                <option value="fan">Fan Experience (Ticket & Seat access)</option>
                <option value="organizer">Match Organizer (Stadium Operations)</option>
                <option value="volunteer">Volunteer Navigator (Visitor Support)</option>
                <option value="security">Stadium Security (Safety dispatch)</option>
                <option value="medical">Medical Dispatch (First aid squad)</option>
                <option value="admin">System Admin (Server controls)</option>
              </select>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary font-bold text-xs py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-opacity-95 disabled:opacity-50 transition-all shadow-elevation-1 cursor-pointer"
          >
            {loading ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : forgotPasswordMode ? (
              "Send Reset Link"
            ) : isSignUp ? (
              "Create My Account"
            ) : (
              "Login to Workspace"
            )}
          </button>
        </form>

        {/* Divider / Alternate Logins (Login / Sign Up only) */}
        {!forgotPasswordMode && (
          <div className="space-y-4 mt-6">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-x-0 h-px bg-outline-variant" />
              <span className="relative bg-surface-container px-3 text-[10px] font-bold text-muted-foreground uppercase">
                Or Continue With
              </span>
            </div>

            <button
              onClick={loginWithGoogle}
              disabled={loading}
              className="w-full border border-outline-variant hover:bg-surface-container-high transition-colors font-bold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4 mr-1 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.5 3.77v3.13h4.04c2.37-2.18 3.73-5.39 3.73-8.75z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-4.04-3.13c-1.12.75-2.55 1.2-3.89 1.2-2.99 0-5.52-2.02-6.42-4.74H1.36v3.23C3.33 21.88 7.39 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.58 14.42a7.12 7.12 0 0 1 0-4.51V6.68H1.36a11.96 11.96 0 0 0 0 10.97l4.22-3.23z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.39 0 3.33 2.12 1.36 6.68l4.22 3.23c.9-2.72 3.43-4.74 6.42-4.74z"
                />
              </svg>
              <span>Google Account SSO</span>
            </button>
          </div>
        )}

        {/* Toggle Mode Link */}
        <div className="text-center mt-6">
          {forgotPasswordMode ? (
            <button
              onClick={() => setForgotPasswordMode(false)}
              className="text-xs font-bold text-primary hover:underline"
            >
              Back to Login
            </button>
          ) : (
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
            >
              {isSignUp ? (
                <>
                  Already have an account? <span className="font-bold text-primary hover:underline">Sign In</span>
                </>
              ) : (
                <>
                  Don't have an account? <span className="font-bold text-primary hover:underline">Create Account</span>
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
