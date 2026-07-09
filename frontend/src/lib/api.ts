export type UserRole = "Patient" | "Doctor" | "Admin";

export interface AuthUser {
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  image?: string;
}

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:5000";

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

export async function requestJson(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.message || "Request failed", res.status);
  }

  return data;
}

export async function postJson(path: string, body: unknown) {
  return requestJson(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function loginUser(body: { email: string; password: string }) {
  return postJson("/auth/login", body) as Promise<{ data: { user: AuthUser } }>;
}

export async function registerUser(body: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) {
  return postJson("/auth/register", body) as Promise<{ data: { user: AuthUser } }>;
}

export async function googleLoginUser(body: { idToken: string }) {
  return postJson("/auth/google", body) as Promise<{ data: { user: AuthUser } }>;
}

export async function getJson(path: string) {
  return requestJson(path, { method: "GET" });
}
