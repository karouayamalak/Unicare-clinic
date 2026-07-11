// ── Auth Store ────────────────────────────────────────────────────────────────
// Simple, framework-agnostic store that wraps localStorage.
// Components subscribe via a custom React hook.

import { useState, useEffect } from "react";
import type { AuthUser } from "./api";

const KEY = "unicare:user";

function getStored(): AuthUser | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

// ── Internal event bus so all hook instances stay in sync ────────────────────
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

// ── Public store API ─────────────────────────────────────────────────────────

export const authStore = {
  get user(): AuthUser | null {
    return getStored();
  },

  login(user: AuthUser) {
    localStorage.setItem(KEY, JSON.stringify(user));
    notify();
  },

  logout() {
    localStorage.removeItem(KEY);
    notify();
  },

  /** Returns the role-specific dashboard path for a given user */
  dashboardFor(user: AuthUser): string {
    switch (user.role) {
      case "Admin":
        return "/admin";
      case "Doctor":
        return "/doctor";
      case "Patient":
        return "/patient";
      default:
        return "/";
    }
  },
};

// ── React hook ───────────────────────────────────────────────────────────────

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(getStored);

  useEffect(() => {
    const update = () => setUser(getStored());
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);

  return {
    user,
    isLoggedIn: user !== null,
    role: user?.role ?? null,
  };
}
