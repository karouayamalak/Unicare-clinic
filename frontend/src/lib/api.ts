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

export async function postJson(path: string, body: unknown) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}
