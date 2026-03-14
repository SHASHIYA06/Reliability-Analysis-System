import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { BEML_USERS } from "@/lib/taxonomy";

export type UserRole = "admin" | "engineer" | "officer" | "data-entry";

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  initials: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (userId: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  isAdmin: boolean;
  canWrite: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "beml_fracas_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = (userId: string, password: string): { success: boolean; error?: string } => {
    const found = BEML_USERS.find(
      u => (u.id === userId || u.name.toUpperCase() === userId.toUpperCase()) && u.password === password
    );
    if (!found) {
      return { success: false, error: "Invalid credentials. Please check your User ID and password." };
    }
    const authUser: AuthUser = {
      id: found.id,
      name: found.name,
      role: found.role as UserRole,
      initials: found.initials,
    };
    setUser(authUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAdmin: user?.role === "admin",
      canWrite: ["admin", "engineer", "officer", "data-entry"].includes(user?.role || ""),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
