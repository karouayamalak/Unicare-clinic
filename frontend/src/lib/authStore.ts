import { useEffect, useState } from "react";
import type { AuthUser, UserRole } from "./api";

const KEY = "unicare:user";
const listeners = new Set<() => void>();

function isRole(value: unknown): value is UserRole {
  return value === "Patient" || value === "Doctor" || value === "Admin";
}

function normalizeUser(value: unknown): AuthUser | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;

  if (record.user && typeof record.user === "object") {
    return normalizeUser(record.user);
  }

  const email = typeof record.email === "string" ? record.email : "";
  if (!email) {
    return null;
  }

  return {
    id: typeof record.id === "string" ? record.id : typeof record._id === "string" ? record._id : undefined,
    email,
    firstName: typeof record.firstName === "string" ? record.firstName : undefined,
    lastName: typeof record.lastName === "string" ? record.lastName : undefined,
    role: isRole(record.role) ? record.role : "Patient",
    image: typeof record.image === "string" ? record.image : undefined,
  };
}

function getStored(): AuthUser | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? normalizeUser(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function notify() {
  listeners.forEach((fn) => fn());
}

export const authStore = {
  get user(): AuthUser | null {
    return getStored();
  },

  saveUser(user: unknown) {
    const normalized = normalizeUser(user);
    if (normalized) {
      localStorage.setItem(KEY, JSON.stringify(normalized));
    } else {
      localStorage.removeItem(KEY);
    }
    notify();
  },

  getUser() {
    return getStored();
  },

  clearUser() {
    localStorage.removeItem(KEY);
    notify();
  },

  login(user: AuthUser) {
    localStorage.setItem(KEY, JSON.stringify(user));
    notify();
  },

  logout() {
    localStorage.removeItem(KEY);
    notify();
  },

  dashboardFor(user: AuthUser): string {
    switch (user.role) {
      case "Admin":
        return "/admin";
      case "Doctor":
        return "/doctor";
      case "Patient":
      default:
        return "/patient";
    }
  },
};

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
