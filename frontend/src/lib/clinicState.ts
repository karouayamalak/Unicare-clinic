// ── Clinic Unified State Manager (localStorage Database) ──────────────────
import { Doctor, doctors as SEED_DOCTORS } from "./data";

export interface ClinicAppointment {
  id: string;
  patientName: string;
  doctorName: string;
  speciality: string;
  time: string;
  reason: string;
  status: "Confirmed" | "En attente" | "En consultation" | "Terminé" | "Annulé";
  mode: "In-clinic" | "Video";
  arrivedAt?: string;
}

export interface ClinicPrescription {
  id: string;
  patientName: string;
  doctorName: string;
  date: string;
  drug: string;
  dose: string;
  freq: string;
  refills: number;
  notes?: string;
  status: "Active" | "Completed" | "Pending";
}

const SEED_APPOINTMENTS: ClinicAppointment[] = [];
const SEED_PRESCRIPTIONS: ClinicPrescription[] = [];

export function getAppointments(): ClinicAppointment[] {
  if (typeof window === "undefined") return SEED_APPOINTMENTS;
  const val = localStorage.getItem("unicare_appointments");
  if (!val) {
    localStorage.setItem("unicare_appointments", JSON.stringify(SEED_APPOINTMENTS));
    return SEED_APPOINTMENTS;
  }
  try { return JSON.parse(val); } catch { return SEED_APPOINTMENTS; }
}

export function saveAppointments(appts: ClinicAppointment[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("unicare_appointments", JSON.stringify(appts));
}

export function getPrescriptions(): ClinicPrescription[] {
  if (typeof window === "undefined") return SEED_PRESCRIPTIONS;
  const val = localStorage.getItem("unicare_prescriptions");
  if (!val) {
    localStorage.setItem("unicare_prescriptions", JSON.stringify(SEED_PRESCRIPTIONS));
    return SEED_PRESCRIPTIONS;
  }
  try { return JSON.parse(val); } catch { return SEED_PRESCRIPTIONS; }
}

export function savePrescriptions(rxs: ClinicPrescription[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("unicare_prescriptions", JSON.stringify(rxs));
}

export function addAppointment(appt: Omit<ClinicAppointment, "id">) {
  const all = getAppointments();
  const newAppt = { ...appt, id: `appt-${Date.now()}` };
  all.push(newAppt);
  saveAppointments(all);
  return newAppt;
}

export function markArrived(apptId: string) {
  const all = getAppointments();
  const appt = all.find((a) => a.id === apptId);
  if (appt) {
    appt.status = "En attente";
    appt.arrivedAt = new Date().toLocaleTimeString("fr-DZ", { hour: "2-digit", minute: "2-digit" });
    saveAppointments(all);
  }
}

export function startConsultation(apptId: string) {
  const all = getAppointments();
  const appt = all.find((a) => a.id === apptId);
  if (appt) {
    appt.status = "En consultation";
    saveAppointments(all);
  }
}

export function completeConsultation(
  apptId: string,
  rx: { drug: string; dose: string; freq: string; refills: number; notes?: string },
) {
  const allAppts = getAppointments();
  const appt = allAppts.find((a) => a.id === apptId);
  if (appt) {
    appt.status = "Terminé";
    saveAppointments(allAppts);

    // Create prescription
    const allRxs = getPrescriptions();
    const newRx: ClinicPrescription = {
      id: `rx-${Date.now()}`,
      patientName: appt.patientName,
      doctorName: appt.doctorName,
      date: new Date().toLocaleDateString("fr-DZ", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      drug: rx.drug,
      dose: rx.dose,
      freq: rx.freq,
      refills: rx.refills,
      notes: rx.notes,
      status: "Active",
    };
    allRxs.unshift(newRx);
    savePrescriptions(allRxs);
    return newRx;
  }
  return null;
}

export function getDoctors(): Doctor[] {
  if (typeof window === "undefined") return [];
  const val = localStorage.getItem("unicare_doctors");
  if (!val) {
    localStorage.setItem("unicare_doctors", JSON.stringify([]));
    return [];
  }
  try { return JSON.parse(val); } catch { return []; }
}

export function saveDoctors(docs: Doctor[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("unicare_doctors", JSON.stringify(docs));
}

export function addDoctor(doc: Omit<Doctor, "id" | "rating" | "reviews" | "patients">) {
  const all = getDoctors();
  const newDoc: Doctor = {
    ...doc,
    id: `doc-${Date.now()}`,
    rating: 5.0,
    reviews: 0,
    patients: 0,
  };
  all.unshift(newDoc);
  saveDoctors(all);
  return newDoc;
}

export interface PatientDocument {
  id: string;
  patientName: string;
  name: string;
  category: string;
  date: string;
  size: string;
  fileDataUrl?: string;
}

const SEED_DOCUMENTS: PatientDocument[] = [
  {
    id: "doc-1",
    patientName: "Amina Bouzid",
    name: "Analyse_Sang_Fevrier.pdf",
    category: "Lab",
    date: "22 Feb 2026",
    size: "412 KB",
  },
  {
    id: "doc-2",
    patientName: "Amina Bouzid",
    name: "Radiographie_Epaule.jpg",
    category: "Imaging",
    date: "14 Jan 2026",
    size: "1.8 MB",
  },
  {
    id: "doc-3",
    patientName: "Amina Bouzid",
    name: "Carnet_Vaccination.pdf",
    category: "Records",
    date: "02 Jan 2026",
    size: "88 KB",
  },
];

export function getPatientDocuments(patientName: string): PatientDocument[] {
  if (typeof window === "undefined") return [];
  const val = localStorage.getItem("unicare_patient_documents");
  let docs: PatientDocument[] = [];
  if (!val) {
    localStorage.setItem("unicare_patient_documents", JSON.stringify(SEED_DOCUMENTS));
    docs = SEED_DOCUMENTS;
  } else {
    docs = JSON.parse(val);
  }
  return docs.filter((d) => d.patientName.toLowerCase() === patientName.toLowerCase());
}

export function getAllPatientDocuments(): PatientDocument[] {
  if (typeof window === "undefined") return [];
  const val = localStorage.getItem("unicare_patient_documents");
  if (!val) {
    localStorage.setItem("unicare_patient_documents", JSON.stringify(SEED_DOCUMENTS));
    return SEED_DOCUMENTS;
  }
  try { return JSON.parse(val); } catch { return SEED_DOCUMENTS; }
}

export function savePatientDocuments(docs: PatientDocument[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("unicare_patient_documents", JSON.stringify(docs));
}

export function addPatientDocument(
  patientName: string,
  doc: Omit<PatientDocument, "id" | "patientName" | "date">,
) {
  const all = getAllPatientDocuments();
  const newDoc: PatientDocument = {
    ...doc,
    id: `doc-${Date.now()}`,
    patientName,
    date: new Date().toLocaleDateString("fr-DZ", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  };
  all.unshift(newDoc);
  savePatientDocuments(all);
  return newDoc;
}

// ── BLOCKED SLOTS MANAGEMENT FOR DOCTORS ──
export interface BlockedSlot {
  id: string;
  doctorName: string;
  date: string; // "YYYY-MM-DD"
  hour?: string; // e.g., "10:00"
}

export function getBlockedSlots(doctorName: string): BlockedSlot[] {
  if (typeof window === "undefined") return [];
  const val = localStorage.getItem("medigen_blocked_slots");
  if (!val) return [];
  const all: BlockedSlot[] = JSON.parse(val);
  return all.filter((s) => s.doctorName.toLowerCase() === doctorName.toLowerCase());
}

export function saveBlockedSlots(slots: BlockedSlot[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("medigen_blocked_slots", JSON.stringify(slots));
}

export function addBlockedSlot(doctorName: string, date: string, hour?: string) {
  if (typeof window === "undefined") return;
  const val = localStorage.getItem("medigen_blocked_slots");
  const all: BlockedSlot[] = val ? JSON.parse(val) : [];

  const exists = all.some(
    (s) =>
      s.doctorName.toLowerCase() === doctorName.toLowerCase() && s.date === date && s.hour === hour,
  );
  if (exists) return null;

  const newBlock: BlockedSlot = {
    id: `block-${Date.now()}`,
    doctorName,
    date,
    hour,
  };
  all.push(newBlock);
  saveBlockedSlots(all);
  return newBlock;
}

export function removeBlockedSlot(id: string) {
  if (typeof window === "undefined") return;
  const val = localStorage.getItem("medigen_blocked_slots");
  if (!val) return;
  const all: BlockedSlot[] = JSON.parse(val);
  const filtered = all.filter((s) => s.id !== id);
  saveBlockedSlots(filtered);
}

export function isSlotBlocked(doctorName: string, date: string, hour?: string): boolean {
  const slots = getBlockedSlots(doctorName);
  return slots.some((s) => s.date === date && (!s.hour || s.hour === hour));
}
