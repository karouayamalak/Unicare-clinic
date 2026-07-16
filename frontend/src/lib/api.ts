let rawBase = (import.meta.env.VITE_API_BASE ?? import.meta.env.VITE_API_URL ?? "http://localhost:5000").trim();
if (rawBase.endsWith("/")) {
  rawBase = rawBase.slice(0, -1);
}
const BASE = rawBase.endsWith("/api/v1") ? rawBase : `${rawBase}/api/v1`;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      0,
      "Impossible de joindre le serveur. Vérifiez que le backend est démarré et redémarrez le frontend.",
    );
  }

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(res.status, json?.message ?? `HTTP ${res.status}`);
  }

  return json as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "Patient" | "Doctor" | "Admin";
  image?: string;
}

interface AuthResponse {
  status: string;
  message: string;
  data: { user: AuthUser };
}

export const registerUser = (payload: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  passwordConfirm: string;
}) => api.post<AuthResponse>("/auth/register", payload);

export const verifyEmailCode = (payload: { email: string; code: string }) =>
  api.post<{ status: string; message: string }>("/auth/verify-email", payload);

export const loginUser = (payload: { email: string; password: string }) =>
  api.post<{ status: string; message: string; data: { email?: string; user?: AuthUser } }>("/auth/login", payload);

export const verifyLoginOtp = (payload: { email: string; otp: string }) =>
  api.post<AuthResponse>("/auth/verify-login-otp", payload);

export const googleLoginUser = (payload: { idToken: string }) =>
  api.post<AuthResponse>("/auth/google", payload);

export const logoutUser = () => api.post<{ status: string; message: string }>("/auth/logout");

export const refreshSession = () => api.post<{ status: string; message: string }>("/auth/refresh");

export interface ApiDoctor {
  _id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  speciality: string;
  specialitySlug: string;
  bio: string;
  image: string;
  location: string;
  fee: number;
  rating: number;
  reviews: number;
  patients: number;
  availableDays: string[];
  availableHours: { start: string; end: string };
  breaks?: Array<{ start: string; end: string }>;
  vacationDays?: string[];
  languages: string[];
  status: "Actif" | "Inactif" | "Congé";
  blockedSlots?: Array<{ _id: string; date: string; hour?: string }>;
  userId?: string;
}

interface DoctorListResponse {
  status: string;
  results: number;
  data: { doctors: ApiDoctor[] };
}

interface DoctorResponse {
  status: string;
  data: { doctor: ApiDoctor };
}

export const fetchDoctors = (params?: { speciality?: string; status?: string; q?: string }) => {
  const qs = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : "";
  return api.get<DoctorListResponse>(`/doctors${qs}`);
};

export const fetchDoctor = (id: string) => api.get<DoctorResponse>(`/doctors/${id}`);

export const createDoctorProfile = (payload: {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  speciality: string;
  specialitySlug?: string;
  bio?: string;
  image?: string;
  location?: string;
  fee?: number;
  availableDays?: string[];
  availableHours?: { start: string; end: string };
  languages?: string[];
}) => api.post<DoctorResponse>("/doctors", payload);

export const updateDoctorProfile = (id: string, payload: Partial<ApiDoctor>) =>
  api.patch<DoctorResponse>(`/doctors/${id}`, payload);

export const deleteDoctorProfile = (id: string) =>
  api.delete<{ status: string; message: string }>(`/doctors/${id}`);

export interface ApiAppointment {
  _id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  dependentId?: string;
  doctorId: string;
  doctorName: string;
  speciality: string;
  date: string;
  time: string;
  reason: string;
  mode: "In-clinic" | "Video";
  status: "Confirmé" | "En attente" | "En consultation" | "Terminé" | "Annulé";
  arrivedAt?: string;
  notes?: string;
  prescription?: {
    drug: string;
    dose: string;
    freq: string;
    refills: number;
    notes?: string;
    drugs?: DrugLine[];
  };
  price?: number;
  receiptNumber?: string;
  dependentInfo?: {
    isDependent: boolean;
    label: string;
    childName: string;
    parentEmail?: string;
    dateOfBirth?: string;
    gender?: string;
    bloodType?: string;
    allergies?: string;
    chronicConditions?: string;
    weight?: number;
    height?: number;
    notes?: string;
    relationship?: string;
  };
  createdAt: string;
}

interface AppointmentListResponse {
  status: string;
  results: number;
  data: { appointments: ApiAppointment[] };
}

interface AppointmentResponse {
  status: string;
  data: { appointment: ApiAppointment };
}

export const fetchAppointments = (params?: { status?: string; date?: string }) => {
  const qs = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : "";
  return api.get<AppointmentListResponse>(`/appointments${qs}`);
};

export const fetchBookedSlots = (doctorId: string, date: string) =>
  api.get<{ status: string; data: { bookedTimes: string[] } }>(
    `/appointments/booked-slots?doctorId=${doctorId}&date=${date}`,
  );

export const bookAppointment = (payload: {
  doctorId: string;
  date: string;
  time: string;
  reason: string;
  mode?: string;
  patientEmail?: string;
  dependentId?: string;
}) => api.post<AppointmentResponse>("/appointments", payload);

export const updateAppointmentStatus = (
  id: string,
  payload: {
    status: string;
    arrivedAt?: string;
    notes?: string;
    prescription?: {
      drug: string;
      dose: string;
      freq: string;
      refills: number;
      notes?: string;
      drugs?: DrugLine[];
    };
    price?: number;
    receiptNumber?: string;
  },
) => api.patch<AppointmentResponse>(`/appointments/${id}/status`, payload);

export const deleteAppointment = (id: string) =>
  api.delete<{ status: string; message: string }>(`/appointments/${id}`);

export interface ApiPatient {
  id: string;
  name: string;
  email: string;
  visitCount: number;
  lastStatus: string;
  speciality: string;
}

export const fetchPatients = () =>
  api.get<{ status: string; results: number; data: { patients: ApiPatient[] } }>(
    "/appointments/patients",
  );

export const updateProfile = (payload: { firstName?: string; lastName?: string; image?: string }) =>
  api.patch<{ status: string; message: string; data: { user: any } }>("/auth/profile", payload);

export const addBlockedSlot = (payload: { date: string; hour?: string }) =>
  api.post<{
    status: string;
    message: string;
    data: { blockedSlots: Array<{ _id: string; date: string; hour?: string }> };
  }>("/doctors/me/blocked-slots", payload);

export const removeBlockedSlot = (slotId: string) =>
  api.delete<{
    status: string;
    message: string;
    data: { blockedSlots: Array<{ _id: string; date: string; hour?: string }> };
  }>(`/doctors/me/blocked-slots/${slotId}`);

export interface DrugLine {
  drug: string;
  dose: string;
  freq: string;
  refills: number;
  notes?: string;
}

export interface PrescriptionPayload {
  /** Legacy single-drug (kept for backward compat) */
  drug: string;
  dose: string;
  freq: string;
  refills: number;
  notes?: string;
  /** Multi-drug array */
  drugs?: DrugLine[];
}

export const updatePrescription = (id: string, payload: { prescription: PrescriptionPayload }) =>
  api.patch<AppointmentResponse>(`/appointments/${id}/prescription`, payload);

export interface ApiPatientProfile {
  _id?: string;
  patientEmail: string;
  patientName: string;
  phone: string;
  address: string;
  emergencyContact: string;
  dateOfBirth: string;
  gender: string;
  weight: number;
  height: number;
  age: number;
  allergies: string;
  bloodType: string;
  chronicConditions: string;
  notes: string;
  lastModifiedByDoctor?: string;
}

export const fetchPatientProfile = (email: string) =>
  api.get<{ status: string; data: { profile: ApiPatientProfile } }>(`/patient-profiles/${email}`);

export const fetchMyPatientProfile = () =>
  api.get<{ status: string; data: { profile: ApiPatientProfile } }>("/patient-profiles/me");

export const updatePatientProfile = (email: string, payload: Partial<ApiPatientProfile>) =>
  api.patch<{ status: string; message: string; data: { profile: ApiPatientProfile } }>(
    `/patient-profiles/${email}`,
    payload,
  );

export interface ApiDependent {
  _id: string;
  parentEmail: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  relationship: "Enfant" | "Autre dépendant";
  bloodType: string;
  allergies: string;
  chronicConditions: string;
  weight: number;
  height: number;
  notes: string;
  photo: string;
  createdAt: string;
  updatedAt: string;
}

interface DependentListResponse {
  status: string;
  results: number;
  data: { dependents: ApiDependent[] };
}

interface DependentResponse {
  status: string;
  message: string;
  data: { dependent: ApiDependent };
}

export interface ApiActionLog {
  _id: string;
  actorId?: string;
  actorEmail: string;
  actorName: string;
  actorRole: "Patient" | "Doctor" | "Admin";
  action: string;
  objectType: string;
  objectId?: string;
  details?: string;
  createdAt: string;
}

interface ActionLogListResponse {
  status: string;
  results: number;
  data: { logs: ApiActionLog[] };
}

export const fetchDependents = () => api.get<DependentListResponse>("/dependents");

export const createDependent = (payload: {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: string;
  bloodType?: string;
  allergies?: string;
  chronicConditions?: string;
  weight?: number;
  height?: number;
  notes?: string;
  photo?: string;
  relationship?: "Enfant" | "Autre dépendant";
}) => api.post<DependentResponse>("/dependents", payload);

export const updateDependent = (id: string, payload: Partial<ApiDependent>) =>
  api.patch<DependentResponse>(`/dependents/${id}`, payload);

export const deleteDependent = (id: string) =>
  api.delete<{ status: string; message: string }>(`/dependents/${id}`);

/** Doctor/Admin: fetch all children registered under a patient email */
export const fetchDependentsByParent = (parentEmail: string) =>
  api.get<DependentListResponse>(`/dependents/by-parent/${encodeURIComponent(parentEmail)}`);

export const fetchActionLogs = (params?: { actorRole?: string; objectType?: string; limit?: number }) => {
  const qs = params
    ? "?" +
      new URLSearchParams(
        Object.entries(params).reduce(
          (acc, [key, value]) => {
            if (value !== undefined && value !== null) {
              acc[key] = String(value);
            }
            return acc;
          },
          {} as Record<string, string>,
        ),
      ).toString()
    : "";
  return api.get<ActionLogListResponse>(`/logs${qs}`);
};

export const verifyEmail = verifyEmailCode;

// ── Backward-compat aliases used by copied route files ────────────────────────
export const fetchMyProfile = fetchMyPatientProfile;
export const fetchPatientsList = fetchPatients;
export const updateMyProfile = updateProfile;

