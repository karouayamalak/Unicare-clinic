import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatCard, DefaultAvatar } from "@/components/ui-ext/primitives";
import {
  getPatientDocuments,
  type PatientDocument,
  addPatientDocument,
} from "@/lib/clinicState";
import {
  fetchAppointments,
  fetchDoctors,
  updateAppointmentStatus,
  fetchPatientProfile,
  fetchDependentsByParent,
  type ApiAppointment,
  type ApiDoctor,
  type ApiDependent,
} from "@/lib/api";
import {
  CheckCircle2,
  DollarSign,
  Download,
  Eye,
  Users,
  Printer,
  FileText,
  Plus,
  Trash2,
  X,
  Upload,
  RefreshCw,
  AlertCircle,
  Clock,
  UserCheck,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/lib/authStore";
import { printOrdonnance, printReceipt } from "@/lib/printHelper";

export const Route = createFileRoute("/doctor/")({
  component: DoctorOverview,
});

/** Opens a base64 data-URL as a Blob in a new tab.
 *  Modern browsers block large data: URIs as navigation targets, so we convert to an object URL first.
 */
function openInNewTab(dataUrl: string) {
  try {
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] ?? "application/octet-stream";
    const bstr = atob(arr[1]);
    const n = bstr.length;
    const u8arr = new Uint8Array(n);
    for (let i = 0; i < n; i++) u8arr[i] = bstr.charCodeAt(i);
    const blob = new Blob([u8arr], { type: mime });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  } catch {
    window.open(dataUrl, "_blank");
  }
}

const CHART_COLORS = [
  "#0f766e",
  "#0d9488",
  "#14b8a6",
  "#2dd4bf",
  "#5eead4",
  "#99f6e4",
  "#ccfbf1",
];

function DoctorOverview() {
  const { user } = useAuth();
  const doctorName = user
    ? `Dr. ${[user.firstName, user.lastName].filter(Boolean).join(" ")}`.trim()
    : "Dr.";

  const [doctorProfile, setDoctorProfile] = useState<ApiDoctor | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    data: appointments = [],
    refetch: refetchAppointments,
  } = useQuery<ApiAppointment[], Error>({
    queryKey: ["doctorAppointments"],
    queryFn: async () => {
      const res = await fetchAppointments();
      return res.data.appointments;
    },
    refetchInterval: 5000,
  });

  const appointmentsList: ApiAppointment[] = appointments as unknown as ApiAppointment[];
  const [selectedAppt, setSelectedAppt] = useState<ApiAppointment | null>(null);

  const todayStr = (() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  })();

  const todayAppointments = appointmentsList.filter((a) => a.date === todayStr);
  // Appointments needing doctor confirmation (patient booked, not yet confirmed)
  const pendingConfirmationAppointments = appointmentsList.filter(
    (a) => a.status === "En attente" && !a.arrivedAt,
  );
  // Patients physically in the waiting room:
  // - "En attente" WITH arrivedAt (patient clicked Arriver)
  // - "Confirmé" WITH arrivedAt (patient arrived but doc hasn't moved to En attente)
  // - "En consultation" (currently being seen)
  const waitingAppointments = appointmentsList.filter(
    (a) =>
      a.status !== "Terminé" &&
      a.status !== "Annulé" &&
      (a.arrivedAt || a.status === "En consultation"),
  );
  const completedCount = appointmentsList.filter((a) => a.status === "Terminé").length;
  const waitingRoomCount = waitingAppointments.filter(
    (a) => a.arrivedAt || a.status === "En consultation",
  ).length;

  // Patient dossier state
  const [activePatientName, setActivePatientName] = useState<string | null>(null);
  const [activePatientEmail, setActivePatientEmail] = useState<string | null>(null);
  const [dossierTab, setDossierTab] = useState<"docs" | "ordonnances" | "history" | "infos">("docs");
  const [patientDocs, setPatientDocs] = useState<PatientDocument[]>([]);
  const [selectedPreviewDoc, setSelectedPreviewDoc] = useState<PatientDocument | null>(null);
  const [dossierHistory, setDossierHistory] = useState<ApiAppointment[]>([]);
  const [dossierProfile, setDossierProfile] = useState<{
    weight?: number;
    height?: number;
    age?: number;
    bloodType?: string;
    allergies?: string;
    chronicConditions?: string;
  } | null>(null);
  const [dossierLoading, setDossierLoading] = useState(false);

  const [uploadCategory, setUploadCategory] = useState("Imaging");
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Patient profile state (for prescription form)
  const [weight, setWeight] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [age, setAge] = useState<number>(0);
  const [allergies, setAllergies] = useState<string>("");
  const [bloodType, setBloodType] = useState<string>("");
  const [chronicConditions, setChronicConditions] = useState<string>("");
  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);
  const [selectedDependent, setSelectedDependent] = useState<ApiDependent | null>(null);

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activePatientName) return;

    setUploadingDoc(true);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        addPatientDocument(activePatientName, {
          name: file.name,
          category: uploadCategory,
          size: `${Math.round(file.size / 1024)} KB`,
          fileDataUrl: reader.result as string,
        });
        toast.success("Document téléversé et partagé avec le patient.");
        setPatientDocs(getPatientDocuments(activePatientName));
      } catch (err) {
        console.error(err);
        toast.error("Erreur lors de l'enregistrement du fichier.");
      } finally {
        setUploadingDoc(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Multi-drug ordonnance state
  const EMPTY_DRUG = { drug: "", dose: "", freq: "", refills: 0, notes: "" };
  const [drugs, setDrugs] = useState([{ ...EMPTY_DRUG }]);
  const [globalNotes, setGlobalNotes] = useState("");
  const [price, setPrice] = useState<number>(2000);

  const [activeRx, setActiveRx] = useState<{
    id: string;
    patientName: string;
    doctorName: string;
    date: string;
    drug: string;
    dose: string;
    freq: string;
    refills: number;
    notes?: string;
    drugs?: Array<{ drug: string; dose: string; freq: string; refills: number; notes?: string }>;
    price?: number;
    receiptNumber?: string;
    patientEmail?: string;
  } | null>(null);

  const updateDrug = (i: number, field: string, val: string | number) =>
    setDrugs((prev) => prev.map((d, idx) => (idx === i ? { ...d, [field]: val } : d)));
  const addDrug = () => setDrugs((prev) => [...prev, { ...EMPTY_DRUG }]);
  const removeDrug = (i: number) =>
    setDrugs((prev) => prev.filter((_, idx) => idx !== i));

  // Track arrival notifications
  const prevWaitingIdsRef = useRef<string[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const docRes = await fetchDoctors();
        if (!mounted) return;
        if (user) {
          const myProfile =
            docRes.data.doctors.find(
              (d) =>
                d.userId === user.id ||
                (d.firstName === user.firstName && d.lastName === user.lastName),
            ) ?? null;
          setDoctorProfile(myProfile);
        }
      } catch {
        toast.error("Impossible de charger le profil du praticien.");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [doctorName]); // eslint-disable-line react-hooks/exhaustive-deps

  // Arrival notifications
  useEffect(() => {
    const prevIds = prevWaitingIdsRef.current;
    const newPatients = waitingAppointments.filter((a) => !prevIds.includes(a._id));
    if (prevIds.length > 0 && newPatients.length > 0) {
      newPatients.forEach((a) => {
        toast.info(`${a.patientName} vient d'arriver en salle d'attente.`);
      });
    }
    prevWaitingIdsRef.current = waitingAppointments.map((a) => a._id);
  }, [waitingAppointments.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Open patient dossier from waitlist
  const openDossier = async (appt: ApiAppointment) => {
    setActivePatientName(appt.patientName);
    setActivePatientEmail(appt.patientEmail || null);
    setDossierTab("docs");
    setPatientDocs(getPatientDocuments(appt.patientName));
    setDossierHistory([]);
    setDossierProfile(null);
    setDossierLoading(true);
    try {
      const allAppts = appointmentsList.filter(
        (a) => a.patientName === appt.patientName,
      );
      setDossierHistory(allAppts);
      if (appt.patientEmail) {
        try {
          const res = await fetchPatientProfile(appt.patientEmail);
          setDossierProfile(res.data.profile);
        } catch {
          // profile not found, ignore
        }
      }
    } finally {
      setDossierLoading(false);
    }
  };

  const handleArrival = async (id: string) => {
    try {
      await updateAppointmentStatus(id, {
        status: "En attente",
        arrivedAt: new Date().toLocaleTimeString("fr-DZ", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
      toast.success("Patient marqué comme arrivé en salle d'attente.");
      refetchAppointments();
    } catch {
      toast.error("Erreur lors de la mise à jour du statut.");
    }
  };

  const handleStartConsultation = async (id: string) => {
    try {
      await updateAppointmentStatus(id, { status: "En consultation" });
      toast.success("Consultation démarrée.");
      refetchAppointments();
    } catch {
      toast.error("Erreur lors du démarrage de la consultation.");
    }
  };

  const handleConfirmAppointment = async (id: string) => {
    try {
      await updateAppointmentStatus(id, { status: "Confirmé" });
      toast.success("Rendez-vous confirmé.");
      refetchAppointments();
    } catch {
      toast.error("Erreur lors de la confirmation.");
    }
  };

  const handleRejectAppointment = async (id: string) => {
    try {
      await updateAppointmentStatus(id, { status: "Annulé" });
      toast.success("Rendez-vous refusé / annulé.");
      refetchAppointments();
    } catch {
      toast.error("Erreur lors du rejet du rendez-vous.");
    }
  };

  const handleOpenPrescription = async (appt: ApiAppointment) => {
    setSelectedAppt(appt);
    setDrugs([{ ...EMPTY_DRUG }]);
    setGlobalNotes("");
    setPrice(doctorProfile?.fee || 2000);
    setSelectedDependent(null);
    setLoadingProfile(true);
    try {
      if (appt.dependentId) {
        const depRes = await fetchDependentsByParent(appt.patientEmail);
        const deps: ApiDependent[] = (depRes as any).data?.data?.dependents || [];
        const child = deps.find((d: ApiDependent) => d._id === appt.dependentId);
        if (child) {
          setSelectedDependent(child);
          setWeight(child.weight || 0);
          setHeight(child.height || 0);
          setAge(
            Math.floor(
              (Date.now() - new Date(child.dateOfBirth).getTime()) /
                (365.25 * 24 * 60 * 60 * 1000),
            ),
          );
          setAllergies(child.allergies || "");
          setBloodType(child.bloodType || "");
          setChronicConditions(child.chronicConditions || "");
          return;
        }
      }
      const res = await fetchPatientProfile(appt.patientEmail);
      const p = res.data.profile;
      setWeight(p.weight || 0);
      setHeight(p.height || 0);
      setAge(p.age || 0);
      setAllergies(p.allergies || "");
      setBloodType(p.bloodType || "");
      setChronicConditions(p.chronicConditions || "");
    } catch {
      setWeight(0);
      setHeight(0);
      setAge(0);
      setAllergies("");
      setBloodType("");
      setChronicConditions("");
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSubmitPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppt) return;

    const invalid = drugs.some((d) => !d.drug || !d.dose || !d.freq);
    if (invalid) {
      toast.error(
        "Veuillez remplir tous les champs obligatoires (Médicament, Dose, Fréquence).",
      );
      return;
    }

    const firstDrug = drugs[0];
    const prescription = {
      drug: firstDrug.drug,
      dose: firstDrug.dose,
      freq: firstDrug.freq,
      refills: firstDrug.refills,
      notes: firstDrug.notes,
      drugs: drugs,
    };

    const rxId = `rx-${Date.now()}`;
    const patientEmail = selectedAppt.patientEmail;
    const rn = `REC-${Date.now()}`;

    try {
      await updateAppointmentStatus(selectedAppt._id, {
        status: "Terminé",
        prescription,
        price,
        receiptNumber: rn,
      });

      toast.success("Consultation terminée. Ordonnance sauvegardée.");
      refetchAppointments();

      setActiveRx({
        id: rxId,
        patientName: selectedAppt.patientName,
        doctorName: doctorName,
        date: selectedAppt.date,
        drug: firstDrug.drug,
        dose: firstDrug.dose,
        freq: firstDrug.freq,
        refills: firstDrug.refills,
        notes: prescription.notes,
        drugs: drugs,
        price: price,
        receiptNumber: rn,
        patientEmail: patientEmail,
      });

      setSelectedAppt(null);
      setDrugs([{ ...EMPTY_DRUG }]);
      setGlobalNotes("");
    } catch {
      toast.error("Erreur lors de la sauvegarde de l'ordonnance.");
    }
  };

  // Weekly analytics chart data
  const weeklyData = (() => {
    const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    appointmentsList.forEach((a) => {
      const d = new Date(a.date);
      if (!isNaN(d.getTime())) counts[d.getDay()]++;
    });
    return days.map((d, i) => ({ day: d, count: counts[i] }));
  })();

  return (
    <div className="space-y-6">
      {/* Doctor Profile Header */}
      <div className="rounded-2xl border border-border bg-white/50 p-5 backdrop-blur-sm shadow-soft flex flex-col sm:flex-row sm:items-center gap-4">
        <DefaultAvatar className="h-14 w-14 shrink-0" />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-extrabold text-ink truncate">
            {loading ? "Chargement..." : doctorName}
          </h1>
          <p className="text-sm text-ink-soft">
            {doctorProfile?.speciality ?? "Médecin"} &bull;{" "}
            {doctorProfile?.location ?? "UniCare Béjaïa"}
          </p>
        </div>
        <span className="text-xs font-bold text-ink-soft bg-slate-100 px-3 py-1.5 rounded-full border border-border shrink-0">
          {doctorProfile?.speciality ?? "Médecin généraliste"}
        </span>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="En salle d'attente"
          value={String(waitingRoomCount)}
          hint={`${todayAppointments.filter((a) => a.status === "En consultation").length} en cours`}
          icon={Users}
        />
        <StatCard
          label="Consultations terminées"
          value={String(completedCount)}
          hint="Toutes périodes"
          icon={CheckCircle2}
        />
        <StatCard
          label="Revenus estimés"
          value={`${(completedCount * (doctorProfile?.fee ?? 2000)).toLocaleString()} DA`}
          hint={`${doctorProfile?.fee?.toLocaleString() ?? 2000} DA / consultation`}
          icon={DollarSign}
        />
        <StatCard
          label="Patients suivis"
          value={doctorProfile ? doctorProfile.patients.toLocaleString() : "—"}
          hint="Total des patients enregistrés"
          icon={Users}
        />
      </div>

      {/* Live Waiting Room Monitor */}
      <div className="rounded-2xl border border-border bg-white/50 p-6 backdrop-blur-sm shadow-soft">
        <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
              Suivi de la salle d&apos;attente
            </h2>
            <p className="text-xs text-ink-soft">
              Gérez les arrivées des patients en temps réel
            </p>
          </div>
          <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary">
            {waitingAppointments.length} Patient(s) en attente
          </span>
        </div>

        <div className="space-y-3">
          {waitingAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <AlertCircle className="h-8 w-8 text-slate-300 mb-2" />
              <p className="text-sm text-ink-soft">
                Aucun patient actif en salle d&apos;attente.
              </p>
            </div>
          ) : (
            waitingAppointments.map((appt) => (
              <div
                key={appt._id}
                className={cn(
                  "flex flex-col gap-4 rounded-xl border p-4 transition shadow-sm sm:flex-row sm:items-center",
                  appt.status === "En consultation"
                    ? "bg-teal/5 border-teal/40 ring-1 ring-teal/30"
                    : appt.status === "En attente"
                      ? "bg-amber-500/5 border-amber-500/30"
                      : appt.status === "Terminé"
                        ? "bg-slate-50/50 border-border opacity-70"
                        : "bg-white/40 border-border/60",
                )}
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <DefaultAvatar className="h-10 w-10 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-ink truncate">
                        {appt.patientName}
                      </p>
                      <button
                        onClick={() => openDossier(appt)}
                        className="cursor-pointer inline-flex items-center gap-1 rounded bg-sky-50 px-2 py-0.5 text-[9px] font-bold text-[#0284c7] border border-sky-100 hover:bg-sky-100 transition"
                      >
                        <FileText className="h-2.5 w-2.5" /> Dossier
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-ink-soft">
                      <span>
                        RDV :{" "}
                        <strong className="text-ink">{appt.time}</strong>
                      </span>
                      {appt.arrivedAt && (
                        <>
                          <span className="text-ink-soft/40">&bull;</span>
                          <span>
                            Arrivé à :{" "}
                            <strong className="text-ink">{appt.arrivedAt}</strong>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide border",
                      appt.status === "Confirmé" &&
                        "bg-slate-100 text-slate-700 border-slate-200",
                      appt.status === "En attente" &&
                        "bg-amber-500/10 text-amber-700 border-amber-500/20 animate-pulse",
                      appt.status === "En consultation" &&
                        "bg-teal/10 text-teal border-teal/20",
                      appt.status === "Terminé" &&
                        "bg-green-100 text-green-700 border-green-200",
                    )}
                  >
                    {appt.status === "Confirmé" ? "Non arrivé" : appt.status}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  {appt.status === "Confirmé" && (
                    <button
                      onClick={() => handleArrival(appt._id)}
                      className="cursor-pointer rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600 transition"
                    >
                      Valider arrivée
                    </button>
                  )}
                  {appt.status === "En attente" && (
                    <button
                      onClick={() => handleStartConsultation(appt._id)}
                      className="cursor-pointer rounded-lg bg-teal px-3 py-1.5 text-xs font-bold text-white hover:opacity-90 transition"
                    >
                      Commencer la consultation
                    </button>
                  )}
                  {appt.status === "En consultation" && (
                    <button
                      onClick={() => handleOpenPrescription(appt)}
                      className="cursor-pointer rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white hover:opacity-90 transition"
                    >
                      Terminer &amp; rédiger ordonnance
                    </button>
                  )}
                  {appt.status === "Terminé" && appt.prescription?.drug && (
                    <button
                      onClick={() => {
                        setActiveRx({
                          id: appt._id,
                          patientName: appt.patientName,
                          doctorName: appt.doctorName,
                          date: appt.date,
                          drug: appt.prescription!.drug,
                          dose: appt.prescription!.dose,
                          freq: appt.prescription!.freq,
                          refills: appt.prescription!.refills,
                          notes: appt.prescription!.notes,
                          drugs: appt.prescription!.drugs as any,
                          price: appt.price,
                        });
                      }}
                      className="cursor-pointer inline-flex items-center gap-1 rounded-lg border border-border bg-white/80 px-3 py-1.5 text-xs font-bold text-ink-soft hover:text-ink transition"
                    >
                      <Printer className="h-3 w-3" /> Imprimer
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ---- Section: Demandes de rendez-vous en attente (Doctor Confirmation Required) ---- */}
      <div className="rounded-2xl border border-border bg-white/50 p-6 backdrop-blur-sm shadow-soft">
        <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Demandes de rendez-vous en attente
            </h2>
            <p className="text-xs text-ink-soft">
              Approuvez ou refusez les demandes de rendez-vous formulées par les patients
            </p>
          </div>
          <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-bold text-amber-700">
            {pendingConfirmationAppointments.length} demande(s) en attente
          </span>
        </div>

        <div className="space-y-3">
          {pendingConfirmationAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <UserCheck className="h-8 w-8 text-slate-300 mb-2" />
              <p className="text-sm text-ink-soft">
                Aucune demande de rendez-vous en attente de confirmation.
              </p>
            </div>
          ) : (
            pendingConfirmationAppointments.map((appt) => (
              <div
                key={appt._id}
                className="flex flex-col gap-4 rounded-xl border border-border bg-white/40 p-4 transition shadow-sm sm:flex-row sm:items-center justify-between"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <DefaultAvatar className="h-10 w-10 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink truncate">
                      {appt.patientName}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-ink-soft">
                      <span className="font-bold text-primary">{appt.speciality}</span>
                      <span className="text-ink-soft/40">&bull;</span>
                      <span>Le <strong>{appt.date}</strong> à <strong>{appt.time}</strong></span>
                      <span className="text-ink-soft/40">&bull;</span>
                      <span className="italic">Motif : {appt.reason}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleRejectAppointment(appt._id)}
                    className="cursor-pointer rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 transition"
                  >
                    Refuser
                  </button>
                  <button
                    onClick={() => handleConfirmAppointment(appt._id)}
                    className="cursor-pointer rounded-lg bg-teal px-3 py-1.5 text-xs font-bold text-white hover:opacity-90 transition shadow-sm"
                  >
                    Confirmer
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Weekly Analytics */}
      <div className="rounded-2xl border border-border bg-white/50 p-6 backdrop-blur-sm shadow-soft">
        <h3 className="text-base font-bold text-ink mb-4">Activité hebdomadaire</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart
            data={weeklyData}
            margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
          >
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "11px",
              }}
            />
            <Bar dataKey="count" name="Consultations" radius={[4, 4, 0, 0]}>
              {weeklyData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ---- Prescription Form Modal ---- */}
      <AnimatePresence>
        {selectedAppt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-2xl rounded-2xl border border-border bg-white p-6 shadow-elevated my-8"
            >
              <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
                <div>
                  <h3 className="text-base font-extrabold text-ink">
                    Consultation — {selectedAppt.patientName}
                  </h3>
                  {selectedDependent && (
                    <p className="text-xs text-amber-600 font-semibold mt-0.5">
                      Mineur : {selectedDependent.firstName}{" "}
                      {selectedDependent.lastName}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedAppt(null)}
                  className="rounded-lg p-1 text-ink-soft hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Patient vitals */}
              {loadingProfile ? (
                <div className="flex items-center justify-center py-4 text-slate-400 text-xs gap-2">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Chargement
                  du profil...
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: "Poids", value: weight ? `${weight} kg` : "—" },
                    { label: "Taille", value: height ? `${height} cm` : "—" },
                    { label: "Age", value: age ? `${age} ans` : "—" },
                    {
                      label: "Groupe sanguin",
                      value: bloodType || "—",
                    },
                    {
                      label: "Allergies",
                      value: allergies || "Aucune",
                    },
                    {
                      label: "Antécédents",
                      value: chronicConditions || "Aucun",
                    },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="rounded-xl bg-slate-50 p-3 border border-border"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                        {row.label}
                      </p>
                      <p className="text-xs font-bold text-ink truncate">
                        {row.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleSubmitPrescription} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                      Médicaments prescrits
                    </h4>
                    <button
                      type="button"
                      onClick={addDrug}
                      className="cursor-pointer inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary hover:bg-primary/20 transition"
                    >
                      <Plus className="h-3 w-3" /> Ajouter
                    </button>
                  </div>

                  <div className="space-y-3">
                    {drugs.map((d, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-border bg-slate-50/50 p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-ink-soft">
                            Médicament {i + 1}
                          </p>
                          {drugs.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeDrug(i)}
                              className="cursor-pointer text-red-400 hover:text-red-600 transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        <div className="grid gap-2 sm:grid-cols-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                              Médicament *
                            </label>
                            <input
                              value={d.drug}
                              onChange={(e) =>
                                updateDrug(i, "drug", e.target.value)
                              }
                              required
                              placeholder="ex: Amoxicilline"
                              className="w-full rounded-xl border border-border bg-white p-2.5 text-xs focus:border-teal focus:outline-none shadow-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                              Dose *
                            </label>
                            <input
                              value={d.dose}
                              onChange={(e) =>
                                updateDrug(i, "dose", e.target.value)
                              }
                              required
                              placeholder="ex: 500mg"
                              className="w-full rounded-xl border border-border bg-white p-2.5 text-xs focus:border-teal focus:outline-none shadow-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                              Fréquence *
                            </label>
                            <input
                              value={d.freq}
                              onChange={(e) =>
                                updateDrug(i, "freq", e.target.value)
                              }
                              required
                              placeholder="ex: 3x/jour"
                              className="w-full rounded-xl border border-border bg-white p-2.5 text-xs focus:border-teal focus:outline-none shadow-sm"
                            />
                          </div>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                              Renouvellements
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={5}
                              value={d.refills}
                              onChange={(e) =>
                                updateDrug(i, "refills", Number(e.target.value))
                              }
                              className="w-full rounded-xl border border-border bg-white p-2.5 text-xs focus:border-teal focus:outline-none shadow-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                              Notes
                            </label>
                            <input
                              value={d.notes}
                              onChange={(e) =>
                                updateDrug(i, "notes", e.target.value)
                              }
                              placeholder="ex: Prendre avec le repas"
                              className="w-full rounded-xl border border-border bg-white p-2.5 text-xs focus:border-teal focus:outline-none shadow-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Frais de consultation (DA)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full rounded-xl border border-border bg-slate-50/50 p-3 text-sm font-bold text-ink focus:border-teal focus:outline-none shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Notes globales
                    </label>
                    <textarea
                      value={globalNotes}
                      onChange={(e) => setGlobalNotes(e.target.value)}
                      rows={2}
                      placeholder="Instructions supplémentaires..."
                      className="w-full rounded-xl border border-border bg-slate-50/50 p-3 text-xs focus:border-teal focus:outline-none shadow-sm resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedAppt(null)}
                    className="cursor-pointer rounded-xl border border-border px-4 py-2.5 text-xs font-bold text-ink-soft hover:bg-slate-100 transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="cursor-pointer rounded-xl bg-teal px-5 py-2.5 text-xs font-bold text-white hover:opacity-90 transition shadow-sm"
                  >
                    Terminer &amp; enregistrer
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---- Ordonnance Print Preview Modal ---- */}
      <AnimatePresence>
        {activeRx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-2xl rounded-2xl border border-border bg-white p-6 shadow-elevated my-8"
            >
              <div className="flex items-center justify-between border-b border-border pb-4">
                <h3 className="text-lg font-bold text-ink">
                  Aperçu avant impression
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      printOrdonnance({
                        id: activeRx.id,
                        date: activeRx.date,
                        doctorName: activeRx.doctorName,
                        patientName: activeRx.patientName,
                        drug: activeRx.drugs?.[0]?.drug || activeRx.drug,
                        dose: activeRx.drugs?.[0]?.dose || activeRx.dose,
                        freq: activeRx.drugs?.[0]?.freq || activeRx.freq,
                        refills:
                          activeRx.drugs?.[0]?.refills ?? activeRx.refills,
                        notes: activeRx.notes,
                        drugs: activeRx.drugs as any,
                      })
                    }
                    className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-teal px-4 py-2 text-xs font-bold text-white hover:opacity-90 transition"
                  >
                    <Printer className="h-4 w-4" /> Imprimer ordonnance
                  </button>
                  {activeRx.price !== undefined && activeRx.price > 0 && (
                    <button
                      onClick={() =>
                        printReceipt({
                          receiptNumber:
                            activeRx.receiptNumber || `REC-${Date.now()}`,
                          date: activeRx.date,
                          doctorName: activeRx.doctorName,
                          speciality:
                            doctorProfile?.speciality || "Médecin Généraliste",
                          patientName: activeRx.patientName,
                          patientEmail: activeRx.patientEmail || "",
                          price: activeRx.price!,
                        })
                      }
                      className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:opacity-90 transition"
                    >
                      <Printer className="h-4 w-4" /> Imprimer reçu
                    </button>
                  )}
                  <button
                    onClick={() => setActiveRx(null)}
                    className="rounded-lg p-1 text-ink-soft hover:bg-slate-100 transition cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Ordonnance Sheet */}
              <div
                id={`rx-sheet-${activeRx.id}`}
                className="p-8 border border-slate-300 rounded-xl bg-white mt-4 font-serif text-slate-900 leading-relaxed"
              >
                <div className="text-center space-y-0.5 border-b-2 border-slate-900 pb-4">
                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-slate-800">
                    République Algérienne Démocratique et Populaire
                  </h4>
                  <p className="text-xs uppercase font-medium text-slate-600">
                    Ministère de la Santé, de la Population et de la Réforme
                    Hospitalière
                  </p>
                  <p className="text-sm font-bold mt-2 uppercase text-slate-900 tracking-wider">
                    UniCare Béjaïa
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6 text-xs">
                  <div>
                    <h5 className="text-sm font-bold uppercase text-slate-900">
                      {activeRx.doctorName}
                    </h5>
                    <p className="text-slate-700 italic">
                      Médecin Praticien Agréé
                    </p>
                    <p className="text-slate-600">
                      Unicare / Espace Médical Gouraya
                    </p>
                    <p className="text-slate-600">Tél : +213 (0)34 12 34 56</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-slate-800">
                      Béjaïa, le : <strong>{activeRx.date}</strong>
                    </p>
                    <p className="text-slate-800">
                      Patient :{" "}
                      <strong className="text-sm font-bold">
                        {activeRx.patientName}
                      </strong>
                    </p>
                  </div>
                </div>

                <div className="text-center my-8">
                  <h2 className="text-3xl font-extrabold uppercase tracking-widest text-slate-900 border-double border-y-4 border-slate-900 py-2.5 max-w-60 mx-auto">
                    Ordonnance
                  </h2>
                </div>

                <div className="min-h-45 pl-6 space-y-5">
                  {(
                    activeRx.drugs || [
                      {
                        drug: activeRx.drug,
                        dose: activeRx.dose,
                        freq: activeRx.freq,
                        refills: activeRx.refills,
                        notes: activeRx.notes,
                      },
                    ]
                  ).map((d, i, arr) => (
                    <div key={i}>
                      <div className="flex gap-2">
                        <span className="text-3xl font-extrabold italic text-slate-900 shrink-0 leading-none mt-1">
                          Rp/
                        </span>
                        <div className="space-y-1 flex-1">
                          <p className="text-lg font-bold text-slate-950">
                            {d.drug} {d.dose}
                          </p>
                          <p className="text-sm text-slate-700 pl-4 italic">
                            Posologie : {d.freq}
                          </p>
                          {(d as any).refills > 0 && (
                            <p className="text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-100 inline-block">
                              Renouvelable {(d as any).refills} fois
                            </p>
                          )}
                          {(d as any).notes && (
                            <p className="text-xs text-slate-600 italic pl-4">
                              {(d as any).notes}
                            </p>
                          )}
                        </div>
                      </div>
                      {i < arr.length - 1 && (
                        <hr className="border-dashed border-slate-200 mt-3" />
                      )}
                    </div>
                  ))}
                </div>

                {activeRx.notes && (
                  <div className="mt-6 border-t border-dashed border-slate-300 pt-4 text-xs text-slate-600">
                    <strong className="text-slate-900">Notes :</strong>
                    <p className="mt-1 italic">{activeRx.notes}</p>
                  </div>
                )}

                {activeRx.price !== undefined && activeRx.price > 0 && (
                  <div className="mt-4 border-t border-dashed border-slate-300 pt-4 text-xs text-slate-800 font-bold">
                    <span>Frais de consultation : </span>
                    <span className="text-teal font-extrabold">
                      {activeRx.price.toLocaleString()} DA
                    </span>
                  </div>
                )}

                <div className="mt-10 pt-6 border-t border-slate-200 flex justify-between items-end text-[10px] text-slate-500">
                  <div>
                    <p>
                      Unicare &bull; Code d&apos;authentification : MED-
                      {activeRx.id.toUpperCase()}
                    </p>
                    <p>Signature numérique sécurisée AES-256</p>
                  </div>
                  <div className="text-center min-w-35 border border-slate-200 rounded p-3 bg-slate-50">
                    <p className="font-bold text-slate-800 mb-6">
                      Griffe &amp; Signature
                    </p>
                    <div className="h-6 w-auto flex items-center justify-center text-slate-700 italic border border-dashed border-slate-300 rounded text-[9px] bg-slate-100 font-bold px-1">
                      {activeRx.doctorName}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---- Patient Dossier Modal (tabbed) ---- */}
      {activePatientName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-elevated flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center gap-3.5 px-6 py-5 border-b border-slate-100">
              <DefaultAvatar className="h-11 w-11 border border-slate-100 shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-extrabold text-[#06122e] truncate">
                  {activePatientName}
                </h3>
                <p className="text-xs text-slate-400 font-semibold">
                  {activePatientEmail ?? "Dossier médical patient"}
                </p>
              </div>
              <button
                onClick={() => setActivePatientName(null)}
                className="shrink-0 text-slate-400 hover:text-slate-600 transition rounded-lg p-1 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 px-4">
              {(
                [
                  { key: "docs", label: "Documents" },
                  { key: "ordonnances", label: "Ordonnances" },
                  { key: "history", label: "Historique" },
                  { key: "infos", label: "Infos médicales" },
                ] as const
              ).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setDossierTab(t.key)}
                  className={cn(
                    "px-4 py-3 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap",
                    dossierTab === t.key
                      ? "border-[#0284c7] text-[#0284c7]"
                      : "border-transparent text-slate-500 hover:text-slate-700",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {dossierLoading ? (
                <div className="flex items-center justify-center py-12 text-slate-400 text-sm gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" /> Chargement du
                  dossier...
                </div>
              ) : (
                <>
                  {/* DOCUMENTS TAB */}
                  {dossierTab === "docs" && (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4">
                        <h4 className="text-xs font-bold text-[#06122e] mb-3">
                          Téléverser un document
                        </h4>
                        <div className="flex flex-wrap items-end gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                              Catégorie
                            </label>
                            <select
                              value={uploadCategory}
                              onChange={(e) => setUploadCategory(e.target.value)}
                              className="rounded border border-slate-200 bg-white px-2 py-1.5 text-xs focus:border-slate-300 focus:outline-none"
                            >
                              <option value="Imaging">
                                Radiographie / Scanner
                              </option>
                              <option value="Lab">Analyse Labo</option>
                              <option value="Records">
                                Dossier / Historique
                              </option>
                              <option value="Rx">Ordonnance</option>
                            </select>
                          </div>
                          <label className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
                            <Upload className="h-3.5 w-3.5 text-slate-400" />
                            {uploadingDoc
                              ? "Chargement..."
                              : "Choisir un fichier"}
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={handleDocUpload}
                              disabled={uploadingDoc}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>

                      {patientDocs.length === 0 ? (
                        <p className="text-center text-xs text-slate-400 py-8">
                          Aucun document pour ce patient.
                        </p>
                      ) : (
                        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden bg-white">
                          {patientDocs.map((doc) => (
                            <li
                              key={doc.id}
                              className="flex items-center justify-between gap-3 p-4 hover:bg-slate-50 transition"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <FileText className="h-4 w-4 text-[#0284c7] shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-[#06122e] truncate">
                                    {doc.name}
                                  </p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    {doc.category} &bull; {doc.date} &bull;{" "}
                                    {doc.size}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                {doc.fileDataUrl && (
                                  <button
                                    onClick={() => setSelectedPreviewDoc(doc)}
                                    className="cursor-pointer inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition"
                                  >
                                    <Eye className="h-3 w-3" /> Aperçu
                                  </button>
                                )}
                                {doc.fileDataUrl && (
                                  <button
                                    onClick={() =>
                                      openInNewTab(doc.fileDataUrl!)
                                    }
                                    className="cursor-pointer inline-flex items-center gap-1 rounded bg-[#06122e] px-2 py-1 text-[10px] font-bold text-white hover:opacity-90 transition"
                                  >
                                    <Download className="h-3 w-3" /> Ouvrir
                                  </button>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {/* ORDONNANCES TAB */}
                  {dossierTab === "ordonnances" && (
                    <div className="space-y-3">
                      {dossierHistory.filter((a) => a.prescription?.drug)
                        .length === 0 ? (
                        <p className="text-center text-xs text-slate-400 py-8">
                          Aucune ordonnance pour ce patient.
                        </p>
                      ) : (
                        dossierHistory
                          .filter((a) => a.prescription?.drug)
                          .map((a) => (
                            <div
                              key={a._id}
                              className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-[#06122e]">
                                  {a.date} — {a.doctorName}
                                </p>
                                <button
                                  onClick={() =>
                                    setActiveRx({
                                      id: a._id,
                                      patientName: a.patientName,
                                      doctorName: a.doctorName,
                                      date: a.date,
                                      drug: a.prescription!.drug,
                                      dose: a.prescription!.dose,
                                      freq: a.prescription!.freq,
                                      refills: a.prescription!.refills,
                                      notes: a.prescription!.notes,
                                      drugs: a.prescription!.drugs as any,
                                      price: a.price,
                                    })
                                  }
                                  className="cursor-pointer inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 hover:text-ink transition"
                                >
                                  <Printer className="h-3 w-3" /> Imprimer
                                </button>
                              </div>
                              <div className="text-xs text-slate-700 space-y-1">
                                {(
                                  (a.prescription!.drugs as any) || [
                                    {
                                      drug: a.prescription!.drug,
                                      dose: a.prescription!.dose,
                                      freq: a.prescription!.freq,
                                    },
                                  ]
                                ).map(
                                  (
                                    d: {
                                      drug: string;
                                      dose: string;
                                      freq: string;
                                    },
                                    i: number,
                                  ) => (
                                    <p key={i}>
                                      <strong>{d.drug}</strong> {d.dose} —{" "}
                                      {d.freq}
                                    </p>
                                  ),
                                )}
                                {a.prescription!.notes && (
                                  <p className="text-slate-500 italic">
                                    {a.prescription!.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  )}

                  {/* HISTORIQUE TAB */}
                  {dossierTab === "history" && (
                    <div className="space-y-2">
                      {dossierHistory.length === 0 ? (
                        <p className="text-center text-xs text-slate-400 py-8">
                          Aucun historique disponible.
                        </p>
                      ) : (
                        dossierHistory.map((a) => (
                          <div
                            key={a._id}
                            className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
                          >
                            <div>
                              <p className="text-xs font-bold text-[#06122e]">
                                {a.date} à {a.time}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {a.speciality} &bull;{" "}
                                En clinique
                              </p>
                            </div>
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-1 text-[10px] font-bold border",
                                a.status === "Terminé" &&
                                  "bg-green-50 text-green-700 border-green-100",
                                a.status === "Annulé" &&
                                  "bg-red-50 text-red-600 border-red-100",
                                a.status === "Confirmé" &&
                                  "bg-slate-50 text-slate-600 border-slate-200",
                                a.status === "En attente" &&
                                  "bg-amber-50 text-amber-700 border-amber-100",
                                a.status === "En consultation" &&
                                  "bg-teal/10 text-teal border-teal/20",
                              )}
                            >
                              {a.status}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* INFOS MEDICALES TAB */}
                  {dossierTab === "infos" && (
                    <div className="space-y-4">
                      {!dossierProfile ? (
                        <p className="text-center text-xs text-slate-400 py-8">
                          Aucune information médicale disponible.
                        </p>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {[
                            {
                              label: "Groupe sanguin",
                              value: dossierProfile.bloodType,
                            },
                            {
                              label: "Age",
                              value: dossierProfile.age
                                ? `${dossierProfile.age} ans`
                                : undefined,
                            },
                            {
                              label: "Poids",
                              value: dossierProfile.weight
                                ? `${dossierProfile.weight} kg`
                                : undefined,
                            },
                            {
                              label: "Taille",
                              value: dossierProfile.height
                                ? `${dossierProfile.height} cm`
                                : undefined,
                            },
                            {
                              label: "Allergies",
                              value: dossierProfile.allergies,
                            },
                            {
                              label: "Antécédents chroniques",
                              value: dossierProfile.chronicConditions,
                            },
                          ].map((row) => (
                            <div
                              key={row.label}
                              className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5"
                            >
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                {row.label}
                              </p>
                              <p className="text-sm font-semibold text-[#06122e]">
                                {row.value || (
                                  <span className="text-slate-300">—</span>
                                )}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-slate-100">
              <button
                onClick={() => setActivePatientName(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Document Preview Modal ---- */}
      {selectedPreviewDoc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-elevated">
            <button
              onClick={() => setSelectedPreviewDoc(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition z-10 bg-white rounded-full p-1 border border-slate-100 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-sm font-bold text-[#06122e] mb-4 pr-8 truncate">
              Aperçu : {selectedPreviewDoc.name} ({selectedPreviewDoc.category})
            </h3>

            <div className="mt-2 flex max-h-[60vh] items-center justify-center overflow-auto rounded bg-slate-50 p-4 border border-slate-100">
              {selectedPreviewDoc.fileDataUrl?.startsWith("data:image/") ? (
                <img
                  src={selectedPreviewDoc.fileDataUrl}
                  alt={selectedPreviewDoc.name}
                  className="max-h-[50vh] w-auto object-contain rounded shadow"
                />
              ) : selectedPreviewDoc.fileDataUrl?.startsWith(
                  "data:application/pdf",
                ) ? (
                <iframe
                  src={selectedPreviewDoc.fileDataUrl}
                  title={selectedPreviewDoc.name}
                  className="min-h-[55vh] w-full rounded border-0"
                />
              ) : (
                <div className="text-center p-8">
                  <FileText className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                  <p className="text-xs text-slate-500 font-semibold">
                    Aperçu non pris en charge.
                  </p>
                  {selectedPreviewDoc.fileDataUrl && (
                    <button
                      onClick={() =>
                        openInNewTab(selectedPreviewDoc.fileDataUrl!)
                      }
                      className="mt-4 cursor-pointer inline-flex items-center gap-1.5 rounded bg-[#06122e] px-4 py-2 text-xs font-bold text-white shadow hover:opacity-90 transition"
                    >
                      <Eye className="h-4 w-4" /> Ouvrir dans l&apos;onglet
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
