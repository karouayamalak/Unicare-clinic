export type UserRole = "Patient" | "Doctor" | "Admin";

export interface AuthUser {
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  image?: string;
}

const API_BASE = "http://localhost:5000";

export async function requestJson(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export async function postJson(path: string, body: unknown) {
  return requestJson(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getJson(path: string) {
  return requestJson(path, { method: "GET" });
}
