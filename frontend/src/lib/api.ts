export type UserRole = "Patient" | "Doctor" | "Admin";

export interface AuthUser {
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  image?: string;
}

const BASE = (import.meta.env.VITE_API_BASE ?? "http://localhost:5000") + "/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Core fetch wrapper ────────────────────────────────────────────────────────
// credentials:"include" is required so signed httpOnly cookies are sent

export async function requestJson(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    ...options,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.message || "Request failed", res.status);
  }
  return data;
}

export async function postJson(path: string, body: unknown) {
  return requestJson(path, { method: "POST", body: JSON.stringify(body) });
}

export async function patchJson(path: string, body: unknown) {
  return requestJson(path, { method: "PATCH", body: JSON.stringify(body) });
}

export async function deleteJson(path: string) {
  return requestJson(path, { method: "DELETE" });
}

export async function getJson(path: string) {
  return requestJson(path, { method: "GET" });
}

// ─── Auth endpoints ───────────────────────────────────────────────────────────

export async function loginUser(body: { email: string; password: string }) {
  return postJson("/auth/login", body) as Promise<{ data: { user: AuthUser } }>;
}

export async function registerUser(body: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  passwordConfirm: string;
}) {
  return postJson("/auth/register", body) as Promise<{ data: { user: AuthUser } }>;
}

export async function googleLoginUser(body: { idToken: string }) {
  return postJson("/auth/google", body) as Promise<{ data: { user: AuthUser } }>;
}

export async function verifyEmail(body: { email: string; code: string }) {
  return postJson("/auth/verify-email", body);
}

export async function refreshSession() {
  return postJson("/auth/refresh", {});
}

export async function logoutUser() {
  return postJson("/auth/logout", {});
}

// ─── Doctors ──────────────────────────────────────────────────────────────────

export async function fetchDoctors(params?: { speciality?: string; status?: string }) {
  const qs = params ? "?" + new URLSearchParams(params as any).toString() : "";
  return getJson(`/doctors${qs}`);
}

export async function fetchDoctor(id: string) {
  return getJson(`/doctors/${id}`);
}

// ─── Appointments ─────────────────────────────────────────────────────────────

export async function fetchAppointments(params?: { status?: string; date?: string }) {
  const qs = params ? "?" + new URLSearchParams(params as any).toString() : "";
  return getJson(`/appointments${qs}`);
}

export async function createAppointment(body: Record<string, unknown>) {
  return postJson("/appointments", body);
}

export async function updateAppointmentStatus(id: string, body: Record<string, unknown>) {
  return patchJson(`/appointments/${id}/status`, body);
}

export async function deleteAppointment(id: string) {
  return deleteJson(`/appointments/${id}`);
}

export async function updatePrescription(id: string, prescription: unknown) {
  return patchJson(`/appointments/${id}/prescription`, { prescription });
}

export async function fetchPatientsList() {
  return getJson("/appointments/patients");
}

// ─── Patient Profiles ─────────────────────────────────────────────────────────

export async function fetchMyProfile() {
  return getJson("/patient-profiles/me");
}

export async function updateMyProfile(email: string, body: Record<string, unknown>) {
  return patchJson(`/patient-profiles/${email}`, body);
}

// ─── Dependents ───────────────────────────────────────────────────────────────

export async function fetchDependents() {
  return getJson("/dependents");
}

export async function createDependent(body: Record<string, unknown>) {
  return postJson("/dependents", body);
}

export async function updateDependent(id: string, body: Record<string, unknown>) {
  return patchJson(`/dependents/${id}`, body);
}

export async function deleteDependent(id: string) {
  return deleteJson(`/dependents/${id}`);
}

// ─── Logs (Admin) ─────────────────────────────────────────────────────────────

export async function fetchLogs(params?: { actorRole?: string; limit?: string }) {
  const qs = params ? "?" + new URLSearchParams(params as any).toString() : "";
  return getJson(`/logs${qs}`);
}
