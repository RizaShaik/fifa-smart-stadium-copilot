import { create } from "zustand";
import { UserRole } from "./useAppStore";
import { auth, db, isMockFirebase } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  User as FirebaseUser,
  getIdTokenResult,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  preferredLanguage: string;
  createdAt: string;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string, role: UserRole) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: () => () => void; // Returns unsubscribe function
  clearError: () => void;
}

// In-memory mock database for testing Auth + Firestore without active credentials
const mockUsersDb: Record<string, Omit<AuthUser, "createdAt"> & { password?: string }> = {
  "admin@fifa.com": { uid: "mock-uid-admin", email: "admin@fifa.com", displayName: "System Admin User", role: "admin", preferredLanguage: "English (US)" },
  "security@fifa.com": { uid: "mock-uid-sec", email: "security@fifa.com", displayName: "Head Officer Chen", role: "security", preferredLanguage: "English (US)" },
  "medical@fifa.com": { uid: "mock-uid-med", email: "medical@fifa.com", displayName: "Dr. Sarah Paul", role: "medical", preferredLanguage: "English (US)" },
  "organizer@fifa.com": { uid: "mock-uid-org", email: "organizer@fifa.com", displayName: "Match Supervisor Al Thani", role: "organizer", preferredLanguage: "English (US)" },
  "volunteer@fifa.com": { uid: "mock-uid-vol", email: "volunteer@fifa.com", displayName: "Volunteer Alex Carter", role: "volunteer", preferredLanguage: "English (US)" },
  "fan@fifa.com": { uid: "mock-uid-fan", email: "fan@fifa.com", displayName: "John Doe", role: "fan", preferredLanguage: "English (US)" },
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  error: null,
  isInitialized: false,

  clearError: () => set({ error: null }),

  loginWithEmail: async (email, password) => {
    set({ loading: true, error: null });
    try {
      if (isMockFirebase) {
        // Simulate mock login
        const normalizedEmail = email.trim().toLowerCase();
        const found = mockUsersDb[normalizedEmail];
        
        if (found && password === "password123") {
          const userObj: AuthUser = {
            ...found,
            createdAt: new Date().toISOString(),
          };
          set({ user: userObj, loading: false });
        } else {
          throw new Error("Invalid mock credentials. Try email@fifa.com with password 'password123'");
        }
        return;
      }

      // Real Firebase login
      const credential = await signInWithEmailAndPassword(auth, email, password);
      // The onAuthStateChanged listener handles state hydration
    } catch (err: any) {
      set({ error: err.message || "Login failed", loading: false });
      throw err;
    }
  },

  loginWithGoogle: async () => {
    set({ loading: true, error: null });
    try {
      if (isMockFirebase) {
        // Simulate google login with fan role
        const userObj: AuthUser = {
          uid: "mock-google-uid-" + Math.random().toString(36).substr(2, 9),
          email: "googleuser@gmail.com",
          displayName: "Google Fan User",
          role: "fan",
          preferredLanguage: "English (US)",
          createdAt: new Date().toISOString(),
        };
        set({ user: userObj, loading: false });
        return;
      }

      // Real Firebase Google Login
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(auth, provider);
      
      // On new user Google sign-in, we check/create their Firestore profile
      const firebaseUser = credential.user;
      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || "Google Fan User",
          role: "fan", // Default google logins to fan role
          preferredLanguage: "English (US)",
          createdAt: serverTimestamp(),
        });
      }
    } catch (err: any) {
      set({ error: err.message || "Google Login failed", loading: false });
      throw err;
    }
  },

  signUpWithEmail: async (email, password, displayName, role) => {
    console.log("Starting signup...");
    set({ loading: true, error: null });
    try {
      if (isMockFirebase) {
        // Simulate mock registration
        const normalizedEmail = email.trim().toLowerCase();
        if (mockUsersDb[normalizedEmail]) {
          throw new Error("User already exists in mock database.");
        }
        
        const newMockUser = {
          uid: "mock-uid-" + Math.random().toString(36).substr(2, 9),
          email: normalizedEmail,
          displayName,
          role,
          preferredLanguage: "English (US)",
        };
        mockUsersDb[normalizedEmail] = newMockUser;
        
        const userObj: AuthUser = {
          ...newMockUser,
          createdAt: new Date().toISOString(),
        };
        set({ user: userObj, loading: false });
        return;
      }

      // Real Firebase registration
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = credential.user;
      console.log("Firebase account created");
      // Create document in Firestore users collection
      const userRef = doc(db, "users", firebaseUser.uid);
      await setDoc(userRef, {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: displayName || "Anonymous User",
        role: role,
        preferredLanguage: "English (US)",
        createdAt: serverTimestamp(),
      });
      console.log("Firestore document created");
    } catch (err: any) {
      set({ error: err.message || "Sign up failed", loading: false });
      throw err;
    }
  },

  sendPasswordReset: async (email) => {
    set({ loading: true, error: null });
    try {
      if (isMockFirebase) {
        set({ loading: false });
        alert(`[Mock Mode] Password reset link sent to ${email}`);
        return;
      }
      await sendPasswordResetEmail(auth, email);
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message || "Password reset failed", loading: false });
      throw err;
    }
  },

  logout: async () => {
    set({ loading: true, error: null });
    try {
      if (isMockFirebase) {
        set({ user: null, loading: false });
        return;
      }
      await signOut(auth);
      set({ user: null, loading: false });
    } catch (err: any) {
      set({ error: err.message || "Logout failed", loading: false });
      throw err;
    }
  },

  initializeAuth: () => {
    if (isMockFirebase) {
      // In mock mode, check if we already have a session, else default to null
      set({ loading: false, isInitialized: true });
      return () => {}; // No-op cleanup
    }

    // Subscribe to Firebase Auth changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (!firebaseUser) {
        set({ user: null, loading: false, isInitialized: true });
        return;
      }
      console.log("Auth changed", firebaseUser);
      try {
        // 1. Check for custom claims (supporting token-issued roles first)
        const tokenResult = await getIdTokenResult(firebaseUser);
        let role: UserRole = "fan"; // Default fallback

        if (tokenResult.claims && typeof tokenResult.claims.role === "string") {
          role = tokenResult.claims.role as UserRole;
        } else {
          // 2. Fetch role from Firestore users/{uid} collection document
          const userRef = doc(db, "users", firebaseUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data && typeof data.role === "string") {
              role = data.role as UserRole;
            }
          } else {
            // Auto-create document if missing in Firestore
            await setDoc(userRef, {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || "Anonymous Fan",
              role: "fan",
              preferredLanguage: "English (US)",
              createdAt: serverTimestamp(),
            });
          }
        }

        // Retrieve extra details from firestore if available
        let displayName = firebaseUser.displayName;
        let preferredLanguage = "English (US)";
        
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          displayName = data.displayName || displayName;
          preferredLanguage = data.preferredLanguage || preferredLanguage;
        }

        const userObj: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName,
          role,
          preferredLanguage,
          createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
        };

        set({ user: userObj, loading: false, isInitialized: true });
      } catch (err: any) {
        console.error("Failed to sync user role from Firestore:", err);
        // Fallback to fan user if database read fails
        const fallbackUser: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || "Anonymous Fan",
          role: "fan",
          preferredLanguage: "English (US)",
          createdAt: new Date().toISOString(),
        };
        set({ user: fallbackUser, loading: false, isInitialized: true });
      }
    });

    return unsubscribe;
  },
}));
