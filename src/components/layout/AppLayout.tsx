"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore, UserRole } from "@/store/useAppStore";
import { useAuthStore } from "@/store/useAuthStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Trophy,
  Calendar,
  HelpingHand,
  Shield,
  HeartPulse,
  Lock,
  Settings,
  User,
  HelpCircle,
  Menu,
  X,
  Sun,
  Moon,
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  role: UserRole;
  icon: React.ComponentType<any>;
}

const navItems: NavItem[] = [
  { name: "Home Portal", href: "/", role: "home", icon: Home },
  { name: "Fan Experience", href: "/fan", role: "fan", icon: Trophy },
  { name: "Match Organizer", href: "/organizer", role: "organizer", icon: Calendar },
  { name: "Volunteer Center", href: "/volunteer", role: "volunteer", icon: HelpingHand },
  { name: "Stadium Security", href: "/security", role: "security", icon: Shield },
  { name: "Medical Dispatch", href: "/medical", role: "medical", icon: HeartPulse },
  { name: "System Admin", href: "/admin", role: "admin", icon: Lock },
];

const utilityItems: NavItem[] = [
  { name: "Profile", href: "/profile", role: "profile", icon: User },
  { name: "Settings", href: "/settings", role: "settings", icon: Settings },
  { name: "Help Center", href: "/help", role: "help", icon: HelpCircle },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    activeRole,
    setActiveRole,
    isSidebarOpen,
    toggleSidebar,
    themeMode,
    toggleTheme,
    demoModeEnabled,
  } = useAppStore();

  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Sync role based on pathname
  React.useEffect(() => {
    const matchingItem = [...navItems, ...utilityItems].find(
      (item) => item.href === pathname
    );
    if (matchingItem) {
      setActiveRole(matchingItem.role);
    }
  }, [pathname, setActiveRole]);

  // Filter navigation items based on user role (if not in Demo Mode)
  const allowedNavItems = navItems.filter((item) => {
    if (demoModeEnabled) return true;
    if (item.role === "home") return true;
    if (user?.role === "admin") return true; // Admins see everything
    return item.role === user?.role;
  });

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "US";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const currentRoleLabel = demoModeEnabled ? activeRole : (user?.role || "fan");

  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-background">
      {/* DESKTOP SIDEBAR / NAVIGATION RAIL */}
      <motion.aside
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        transition={{ duration: 0.3, ease: [0.25, 0.8, 0.25, 1] }}
        className="hidden md:flex flex-col border-r border-outline-variant bg-surface-container-lowest text-on-surface h-screen sticky top-0 shrink-0 z-40 overflow-hidden"
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-outline-variant">
          <Link href="/" className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-md bg-primary flex items-center justify-center text-on-primary font-bold text-lg shadow-elevation-1">
              🏆
            </div>
            {isSidebarOpen && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-bold text-sm tracking-wider uppercase bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent truncate"
              >
                Stadium Copilot
              </motion.span>
            )}
          </Link>
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-full hover:bg-surface-variant hover:text-on-surface-variant transition-colors"
          >
            {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 select-none">
          <div className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest h-4 overflow-hidden">
            {isSidebarOpen ? "Control Panels" : ""}
          </div>
          {allowedNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setActiveRole(item.role)}
                className={`relative flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all group overflow-hidden ${
                  isActive
                    ? "text-on-primary-container"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 bg-primary-container rounded-lg -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <div className={`p-1 rounded-md transition-colors ${isActive ? "text-primary" : "text-on-surface-variant group-hover:text-primary"}`}>
                  <Icon size={20} />
                </div>
                {isSidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="truncate"
                  >
                    {item.name}
                  </motion.span>
                )}
              </Link>
            );
          })}

          <div className="h-px bg-outline-variant my-4" />

          <div className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest h-4 overflow-hidden">
            {isSidebarOpen ? "Personal" : ""}
          </div>
          {utilityItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setActiveRole(item.role)}
                className={`relative flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all group overflow-hidden ${
                  isActive
                    ? "text-on-primary-container"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 bg-primary-container rounded-lg -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <div className={`p-1 rounded-md transition-colors ${isActive ? "text-primary" : "text-on-surface-variant group-hover:text-primary"}`}>
                  <Icon size={20} />
                </div>
                {isSidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="truncate"
                  >
                    {item.name}
                  </motion.span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Footer Area with Theme Toggle */}
        <div className="p-4 border-t border-outline-variant flex flex-col gap-3">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full p-2.5 rounded-lg text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all"
          >
            {themeMode === "light" ? (
              <>
                <Moon size={18} className="text-secondary" />
                {isSidebarOpen && <span>Dark Mode</span>}
              </>
            ) : (
              <>
                <Sun size={18} className="text-secondary" />
                {isSidebarOpen && <span>Light Mode</span>}
              </>
            )}
          </button>
        </div>
      </motion.aside>

      {/* MAIN VIEW CONTENT CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER BAR */}
        <header className="h-16 border-b border-outline-variant bg-surface/80 backdrop-blur-md sticky top-0 z-30 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-full hover:bg-surface-container-high md:hidden"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded bg-primary-container text-on-primary-container font-semibold capitalize shadow-sm">
                Role: {currentRoleLabel}
              </span>
              {demoModeEnabled && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container font-bold uppercase tracking-wider animate-pulse">
                  DEMO MODE ACTIVE
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Show Role Switcher only if Demo Mode is enabled */}
            {demoModeEnabled ? (
              <select
                value={activeRole}
                onChange={(e) => {
                  const newRole = e.target.value as UserRole;
                  setActiveRole(newRole);
                  router.push(newRole === "home" ? "/" : `/${newRole}`);
                }}
                className="bg-surface-container border border-outline-variant rounded-md text-xs py-1.5 px-3 font-semibold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer hover:bg-surface-container-high transition-colors"
              >
                <option value="home">Home Portal</option>
                <option value="fan">Fan Experience</option>
                <option value="organizer">Match Organizer</option>
                <option value="volunteer">Volunteer Center</option>
                <option value="security">Stadium Security</option>
                <option value="medical">Medical Dispatch</option>
                <option value="admin">System Admin</option>
                <option value="profile">Profile</option>
                <option value="settings">Settings</option>
                <option value="help">Help Center</option>
              </select>
            ) : null}

            <button className="p-2 rounded-full hover:bg-surface-container-high relative">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error" />
            </button>

            {/* Profile Dropdown Trigger */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-tertiary flex items-center justify-center text-xs font-bold text-white shadow-sm border border-outline select-none cursor-pointer"
              >
                {getInitials(user?.displayName || null)}
              </button>

              <AnimatePresence>
                {profileDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setProfileDropdownOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 rounded-xl bg-surface-container border border-outline-variant p-3 shadow-elevation-3 z-50 space-y-2 text-xs"
                    >
                      <div className="border-b border-outline-variant pb-2">
                        <div className="font-bold truncate">{user?.displayName || "Anonymous User"}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{user?.email}</div>
                      </div>
                      
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 p-2 rounded-lg text-error hover:bg-error-container/20 transition-all font-semibold"
                      >
                        <LogOut size={14} />
                        <span>Sign Out Workspace</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* ROUTE CHILD VIEW WRAPPER */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* MOBILE BOTTOM NAVIGATION BAR */}
        <nav className="md:hidden border-t border-outline-variant bg-surface-container-lowest text-on-surface h-16 flex items-center justify-around z-30 sticky bottom-0">
          {allowedNavItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setActiveRole(item.role)}
                className={`flex flex-col items-center justify-center flex-1 h-full text-[10px] gap-1 font-medium transition-all ${
                  isActive ? "text-primary font-semibold" : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <div className={`p-1 rounded-full ${isActive ? "bg-primary-container text-primary" : ""}`}>
                  <Icon size={18} />
                </div>
                <span className="max-w-[70px] truncate">{item.name.split(" ")[0]}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* MOBILE FULL-SCREEN MENU DRAWER */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black z-50 md:hidden"
            />
            {/* Menu Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-4/5 max-w-sm bg-surface-container-lowest text-on-surface z-50 flex flex-col p-6 shadow-elevation-5 md:hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-on-primary font-bold">
                    🏆
                  </div>
                  <span className="font-bold text-base bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Stadium Copilot
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-full hover:bg-surface-container-high"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2">
                {allowedNavItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        setActiveRole(item.role);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-4 p-3 rounded-lg text-sm font-medium ${
                        isActive
                          ? "bg-primary-container text-on-primary-container"
                          : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                      }`}
                    >
                      <Icon size={20} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}

                <div className="h-px bg-outline-variant my-4" />

                {utilityItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        setActiveRole(item.role);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-4 p-3 rounded-lg text-sm font-medium ${
                        isActive
                          ? "bg-primary-container text-on-primary-container"
                          : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                      }`}
                    >
                      <Icon size={20} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="border-t border-outline-variant pt-4 mt-auto">
                <button
                  onClick={() => {
                    toggleTheme();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-4 w-full p-3 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-high"
                >
                  {themeMode === "light" ? (
                    <>
                      <Moon size={20} />
                      <span>Dark Mode</span>
                    </>
                  ) : (
                    <>
                      <Sun size={20} />
                      <span>Light Mode</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
