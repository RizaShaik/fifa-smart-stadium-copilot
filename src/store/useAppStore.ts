import { create } from "zustand";

export type UserRole =
  | "fan"
  | "organizer"
  | "volunteer"
  | "security"
  | "medical"
  | "admin"
  | "settings"
  | "profile"
  | "help"
  | "home";

interface AppState {
  activeRole: UserRole;
  isSidebarOpen: boolean;
  themeMode: "light" | "dark";
  demoModeEnabled: boolean;
  demoEvent: string; // Dynamic hackathon event scenario (e.g. Normal, Goal Scored, Heavy Rain, etc.)
  setActiveRole: (role: UserRole) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  toggleTheme: () => void;
  setDemoModeEnabled: (enabled: boolean) => void;
  setDemoEvent: (event: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeRole: "home",
  isSidebarOpen: true,
  themeMode: "dark",
  demoModeEnabled: typeof window !== "undefined" ? localStorage.getItem("demoModeEnabled") === "true" : false,
  demoEvent: "Normal",
  setActiveRole: (role) => set({ activeRole: role }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  toggleTheme: () =>
    set((state) => {
      const nextTheme = state.themeMode === "light" ? "dark" : "light";
      if (typeof window !== "undefined") {
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(nextTheme);
      }
      return { themeMode: nextTheme };
    }),
  setDemoModeEnabled: (enabled) =>
    set(() => {
      if (typeof window !== "undefined") {
        localStorage.setItem("demoModeEnabled", String(enabled));
      }
      return { demoModeEnabled: enabled };
    }),
  setDemoEvent: (event) => set({ demoEvent: event }),
}));
