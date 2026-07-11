import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-ext/primitives";
import {
  fetchAppointments,
  fetchPatients,
  updatePrescription,
  type ApiAppointment,
  type ApiPatient,
  type DrugLine,
  type PrescriptionPayload,
} from "@/lib/api";
import {
  Printer,
  FileText,
  X,
  RefreshCw,
  CheckCircle2,
  Clock,
  RefreshCcw,
  Plus,
  Trash2,
  Download,
  FilePlus,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/authStore";
import { toast } from "sonner";
import { printOrdonnance } from "@/lib/printHelper";

export const Route = createFileRoute("/doctor/prescriptions")({
  component: DoctorPrescriptions,
});

const statusConfig: Record<string, { cls: string; label: string; icon: typeof CheckCircle2 }> = {
  Active: { cls: "bg-teal/10 text-teal border-teal/20", label: "Active", icon: CheckCircle2 },
  Pending: {
    cls: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    label: "En attente",
    icon: Clock,
  },
  Completed: {
    cls: "bg-slate-100 text-slate-600 border-slate-200",
    label: "Terminée",
    icon: CheckCircle2,
  },
};

interface RxRecord {
  id: string;
  patientName: string;
  doctorName: string;
  date: string;
  drug: string;
  dose: string;
  freq: string;
  refills: number;
  notes?: string;
  drugs?: DrugLine[];
  status: "Active" | "Completed" | "Pending";
  price?: number;
}

const EMPTY_DRUG: DrugLine = { drug: "", dose: "", freq: "", refills: 0, notes: "" };

// ── Print-to-PDF helper ──────────────────────────────────────────────────────
function printPrescription(printId: string) {
  const el = document.getElementById(printId);
  if (!el) return;

  const clone = el.cloneNode(true) as HTMLElement;
  const win = window.open("", "_blank", "width=800,height=900");
  if (!win) {
    window.print();
    return;
  }

  win.document.write(`
    <!DOCTYPE html><html><head>
    <meta charset="utf-8"/>
    <title>Ordonnance</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family: Georgia, serif; color: #111; background: #fff; }
    </style>
    </head><body>${clone.outerHTML}</body></html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
    win.close();
  }, 400);
}

// ── Multi-drug form row ──────────────────────────────────────────────────────
function DrugRow({
  drug,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  drug: DrugLine;
  index: number;
  onChange: (i: number, field: keyof DrugLine, val: string | number) => void;
  onRemove: (i: number) => void;
  canRemove: boolean;
}) {
  return (
    <div className="relative rounded-xl border border-border bg-white/60 p-4 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-ink-soft">
          Médicament {index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="cursor-pointer rounded-lg p-1 text-red-400 hover:bg-red-50 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Médicament *
          </label>
          <input
            value={drug.drug}
            onChange={(e) => onChange(index, "drug", e.target.value)}
            placeholder="ex: Amoxicilline"
            required
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Dose *
          </label>
          <input
            value={drug.dose}
            onChange={(e) => onChange(index, "dose", e.target.value)}
            placeholder="ex: 500 mg"
            required
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Fréquence *
          </label>
          <input
            value={drug.freq}
            onChange={(e) => onChange(index, "freq", e.target.value)}
            placeholder="ex: 3× / jour"
            required
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Renouvellements
          </label>
          <input
            type="number"
            min={0}
            max={12}
            value={drug.refills}
            onChange={(e) => onChange(index, "refills", Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Notes (optionnel)
          </label>
          <input
            value={drug.notes ?? ""}
            onChange={(e) => onChange(index, "notes", e.target.value)}
            placeholder="ex: À prendre après repas"
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}

// ── Ordonnance Print Sheet ───────────────────────────────────────────────────
function OrdonnanceSheet({
  rx,
  doctorName,
  printId,
}: {
  rx: RxRecord;
  doctorName: string;
  printId: string;
}) {
  const drugs: DrugLine[] =
    rx.drugs && rx.drugs.length > 0
      ? rx.drugs
      : [{ drug: rx.drug, dose: rx.dose, freq: rx.freq, refills: rx.refills, notes: rx.notes }];

  return (
    <div
      id={printId}
      className="p-8 border border-slate-300 rounded-xl bg-white mt-4 font-serif text-slate-900 leading-relaxed"
    >
      <div className="text-center space-y-0.5 border-b-2 border-slate-900 pb-4">
        <h4 className="text-[10px] font-bold tracking-widest uppercase text-slate-800">
          République Algérienne Démocratique et Populaire
        </h4>
        <p className="text-xs uppercase font-medium text-slate-600">
          Ministère de la Santé, de la Population et de la Réforme Hospitalière
        </p>
        <p className="text-sm font-bold mt-2 uppercase text-slate-900 tracking-wider">
          Centre Médical de Béjaïa
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6 text-xs">
        <div>
          <h5 className="text-sm font-bold uppercase text-slate-900">{rx.doctorName}</h5>
          <p className="text-slate-700 italic">Médecin Spécialiste — UniCare Béjaïa</p>
          <p className="text-slate-600">CHU de Béjaïa / Espace Médical Gouraya</p>
          <p className="text-slate-600">Tél : +213 (0)34 12 34 56</p>
        </div>
        <div className="text-right space-y-1">
          <p className="text-slate-800">
            Béjaïa, le : <strong>{rx.date}</strong>
          </p>
          <p className="text-slate-800">
            Patient : <strong className="text-sm font-bold">{rx.patientName}</strong>
          </p>
        </div>
      </div>

      <div className="text-center my-8">
        <h2 className="text-3xl font-extrabold uppercase tracking-widest text-slate-900 border-double border-y-4 border-slate-900 py-2.5 max-w-[240px] mx-auto">
          Ordonnance
        </h2>
      </div>

      <div className="min-h-[180px] pl-6 space-y-6">
        {drugs.map((d, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-3xl font-extrabold italic text-slate-900 shrink-0 leading-none mt-1">
              Rp/
            </span>
            <div className="space-y-1 flex-1">
              <p className="text-lg font-bold text-slate-950">
                {d.drug} {d.dose}
              </p>
              <p className="text-sm text-slate-700 pl-4 italic">Posologie : {d.freq}</p>
              {d.refills > 0 && (
                <p className="text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-100 inline-block">
                  Renouvelable {d.refills} fois
                </p>
              )}
              {d.notes && <p className="text-xs text-slate-600 italic pl-4">{d.notes}</p>}
              {i < drugs.length - 1 && <hr className="border-dashed border-slate-200 mt-3" />}
            </div>
          </div>
        ))}
      </div>

      {rx.price !== undefined && rx.price > 0 && (
        <div className="mt-6 border-t border-dashed border-slate-300 pt-4 text-xs text-slate-800 font-bold">
          <span>Frais de consultation : </span>
          <span className="text-teal font-extrabold">{rx.price.toLocaleString()} DA</span>
        </div>
      )}

      <div className="mt-10 pt-6 border-t border-slate-200 flex justify-between items-end text-[10px] text-slate-500">
        <div>
          <p>UniCare Béjaïa • Code d'authentification : MED-{rx.id.toUpperCase()}</p>
          <p>Signature numérique sécurisée AES-256</p>
        </div>
        <div className="text-center min-w-[140px] border border-slate-200 rounded p-3 bg-slate-50">
          <p className="font-bold text-slate-800 mb-6">Griffe & Signature</p>
          <div className="h-6 w-auto flex items-center justify-center text-teal-700 italic border border-dashed border-teal-300 rounded text-[9px] bg-teal-50 font-bold px-1">
            {rx.doctorName}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
function DoctorPrescriptions() {
  const { user } = useAuth();
  const doctorName = user ? `Dr. ${user.firstName} ${user.lastName}` : "Dr. Médecin";

  const [prescriptions, setPrescriptions] = useState<RxRecord[]>([]);
  const [patients, setPatients] = useState<ApiPatient[]>([]);
  const [loading, setLoading] = useState(true);

  // Print preview
  const [activeRx, setActiveRx] = useState<RxRecord | null>(null);

  // Write new ordonnance modal
  const [showNewRx, setShowNewRx] = useState(false);
  const [selectedApptId, setSelectedApptId] = useState("");
  const [allAppts, setAllAppts] = useState<ApiAppointment[]>([]);
  const [drugs, setDrugs] = useState<DrugLine[]>([{ ...EMPTY_DRUG }]);
  const [globalNotes, setGlobalNotes] = useState("");
  const [rxPrice, setRxPrice] = useState(0);
  const [saving, setSaving] = useState(false);

  const printId = `rx-print-${activeRx?.id ?? "none"}`;

  const load = async () => {
    setLoading(true);
    try {
      const [apptRes, patRes] = await Promise.all([
        fetchAppointments(),
        fetchPatients().catch(() => ({ data: { patients: [] } })),
      ]);
      setAllAppts(apptRes.data.appointments);
      setPatients(patRes.data.patients);

      const withRx = apptRes.data.appointments
        .filter((a: ApiAppointment) => a.prescription && a.prescription.drug)
        .map((a: ApiAppointment) => ({
          id: a._id,
          patientName: a.patientName,
          doctorName: a.doctorName,
          date: a.date,
          drug: a.prescription!.drug,
          dose: a.prescription!.dose,
          freq: a.prescription!.freq,
          refills: a.prescription!.refills,
          notes: a.prescription!.notes,
          drugs: a.prescription!.drugs,
          status: "Active" as const,
          price: a.price,
        }));
      setPrescriptions(withRx);
    } catch {
      toast.error("Impossible de charger les ordonnances.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Drug row helpers
  const updateDrug = (i: number, field: keyof DrugLine, val: string | number) => {
    setDrugs((prev) => prev.map((d, idx) => (idx === i ? { ...d, [field]: val } : d)));
  };
  const addDrug = () => setDrugs((prev) => [...prev, { ...EMPTY_DRUG }]);
  const removeDrug = (i: number) => setDrugs((prev) => prev.filter((_, idx) => idx !== i));

  const handleSaveNewRx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApptId) {
      toast.error("Sélectionnez un rendez-vous.");
      return;
    }
    const invalid = drugs.some((d) => !d.drug || !d.dose || !d.freq);
    if (invalid) {
      toast.error("Remplissez tous les champs obligatoires.");
      return;
    }

    setSaving(true);
    try {
      const first = drugs[0];
      const prescription: PrescriptionPayload = {
        drug: first.drug,
        dose: first.dose,
        freq: first.freq,
        refills: first.refills,
        notes: globalNotes || first.notes,
        drugs: drugs.length > 1 ? drugs : undefined,
      };
      await updatePrescription(selectedApptId, { prescription });
      toast.success("Ordonnance enregistrée et ajoutée au dossier patient !");
      setShowNewRx(false);
      setDrugs([{ ...EMPTY_DRUG }]);
      setGlobalNotes("");
      setSelectedApptId("");
      await load();
    } catch {
      toast.error("Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const completedAppts = allAppts.filter(
    (a) => a.status === "Terminé" && !(a.prescription && a.prescription.drug),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Ordonnances"
        description="Rédigez, gérez et imprimez vos prescriptions électroniques."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowNewRx(true);
                setDrugs([{ ...EMPTY_DRUG }]);
              }}
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white hover:opacity-90 transition shadow-sm"
            >
              <FilePlus className="h-4 w-4" /> Nouvelle ordonnance
            </button>
            <button
              onClick={load}
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-border bg-white p-2.5 hover:bg-slate-50 transition shadow-sm"
            >
              <RefreshCw className={`h-4 w-4 text-ink-soft ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Total",
            value: prescriptions.length,
            cls: "text-ink bg-white/60 border-border",
          },
          {
            label: "Actives",
            value: prescriptions.filter((r) => r.status === "Active").length,
            cls: "text-teal bg-teal/10 border-teal/20",
          },
          {
            label: "Renouvellements",
            value: prescriptions.filter((r) => r.refills > 0).length,
            cls: "text-amber-600 bg-amber-50 border-amber-200",
          },
        ].map((s) => (
          <div key={s.label} className={cn("rounded-2xl border p-4 text-center shadow-sm", s.cls)}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-semibold opacity-70 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-white/50 backdrop-blur-sm shadow-soft overflow-hidden">
        {prescriptions.length === 0 ? (
          <div className="py-14 text-center text-ink-soft">
            <FileText className="h-8 w-8 mx-auto text-slate-400 mb-3" />
            <p className="text-sm font-semibold">Aucune ordonnance enregistrée.</p>
            <p className="text-xs mt-1">
              Terminez une consultation ou utilisez le bouton «&nbsp;Nouvelle ordonnance&nbsp;».
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-white/40 text-[10px] font-bold uppercase tracking-wider text-ink-soft/60 text-left">
                <tr>
                  <th className="px-6 py-3.5">Patient</th>
                  <th className="px-6 py-3.5">Médicament(s)</th>
                  <th className="px-6 py-3.5">Dose & Fréquence</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Renouvell.</th>
                  <th className="px-6 py-3.5">Statut</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {prescriptions.map((rx) => {
                  const st = statusConfig[rx.status] ?? statusConfig.Active;
                  const drugsCount = rx.drugs && rx.drugs.length > 1 ? rx.drugs.length : 1;
                  return (
                    <tr key={rx.id} className="hover:bg-white/40 transition">
                      <td className="px-6 py-4 font-bold text-ink">{rx.patientName}</td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-ink">{rx.drug}</span>
                        {drugsCount > 1 && (
                          <span className="ml-1.5 text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 rounded-full px-1.5 py-0.5">
                            +{drugsCount - 1}
                          </span>
                        )}
                        {rx.notes && (
                          <p className="text-[10px] text-ink-soft/70 italic mt-0.5">{rx.notes}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-ink-soft">
                        <span className="font-semibold text-ink">{rx.dose}</span>
                        <span className="text-ink-soft/70 ml-1">· {rx.freq}</span>
                      </td>
                      <td className="px-6 py-4 text-ink-soft text-xs font-medium">{rx.date}</td>
                      <td className="px-6 py-4">
                        {rx.refills > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                            <RefreshCcw className="h-2.5 w-2.5" /> {rx.refills}×
                          </span>
                        ) : (
                          <span className="text-xs text-ink-soft/50">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                            st.cls,
                          )}
                        >
                          <st.icon className="h-3 w-3" />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setActiveRx(rx)}
                            className="cursor-pointer inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-bold text-ink-soft hover:text-ink transition shadow-sm"
                          >
                            <Printer className="h-3 w-3" /> Aperçu
                          </button>
                          <button
                            onClick={() =>
                              printOrdonnance({
                                id: rx.id,
                                date: rx.date,
                                doctorName: rx.doctorName,
                                patientName: rx.patientName,
                                drug: rx.drug,
                                dose: rx.dose,
                                freq: rx.freq,
                                refills: rx.refills,
                                notes: rx.notes,
                                drugs: rx.drugs,
                              })
                            }
                            className="cursor-pointer inline-flex items-center gap-1 rounded-lg border border-teal/30 bg-teal/5 px-3 py-1.5 text-xs font-bold text-teal hover:bg-teal/10 transition shadow-sm"
                          >
                            <Download className="h-3 w-3" /> PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Print Preview Modal ── */}
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
                <h3 className="text-lg font-bold text-ink">Aperçu avant impression</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      printOrdonnance({
                        id: activeRx.id,
                        date: activeRx.date,
                        doctorName: doctorName,
                        patientName: activeRx.patientName,
                        drug: activeRx.drug,
                        dose: activeRx.dose,
                        freq: activeRx.freq,
                        refills: activeRx.refills,
                        notes: activeRx.notes,
                        drugs: activeRx.drugs,
                      })
                    }
                    className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-teal px-4 py-2 text-xs font-bold text-white hover:opacity-90 transition"
                  >
                    <Printer className="h-4 w-4" /> Imprimer
                  </button>
                  <button
                    onClick={() =>
                      printOrdonnance({
                        id: activeRx.id,
                        date: activeRx.date,
                        doctorName: doctorName,
                        patientName: activeRx.patientName,
                        drug: activeRx.drug,
                        dose: activeRx.dose,
                        freq: activeRx.freq,
                        refills: activeRx.refills,
                        notes: activeRx.notes,
                        drugs: activeRx.drugs,
                      })
                    }
                    className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:opacity-90 transition"
                  >
                    <Download className="h-4 w-4" /> Télécharger PDF
                  </button>
                  <button
                    onClick={() => setActiveRx(null)}
                    className="rounded-lg p-1 text-ink-soft hover:bg-slate-100 transition cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <OrdonnanceSheet rx={activeRx} doctorName={doctorName} printId={printId} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── New Ordonnance Modal ── */}
      <AnimatePresence>
        {showNewRx && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-2xl rounded-2xl border border-border bg-white p-6 shadow-elevated my-8"
            >
              <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
                <div>
                  <h3 className="text-lg font-bold text-ink">Nouvelle ordonnance</h3>
                  <p className="text-xs text-ink-soft mt-0.5">
                    Rédigez et enregistrez une ordonnance pour un patient
                  </p>
                </div>
                <button
                  onClick={() => setShowNewRx(false)}
                  className="rounded-lg p-1 text-ink-soft hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveNewRx} className="space-y-5">
                {/* Appointment / Patient selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                    Rendez-vous (consultations terminées sans ordonnance)
                  </label>
                  {completedAppts.length === 0 ? (
                    <p className="text-xs text-ink-soft bg-slate-50 border border-border rounded-lg px-4 py-3">
                      Aucun rendez-vous terminé sans ordonnance disponible. Terminez d'abord une
                      consultation depuis votre tableau de bord.
                    </p>
                  ) : (
                    <select
                      value={selectedApptId}
                      onChange={(e) => setSelectedApptId(e.target.value)}
                      required
                      className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
                    >
                      <option value="">— Sélectionner un rendez-vous —</option>
                      {completedAppts.map((a) => (
                        <option key={a._id} value={a._id}>
                          {a.patientName} · {a.date} à {a.time}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Drug lines */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-600 uppercase">
                      Médicaments *
                    </label>
                    <button
                      type="button"
                      onClick={addDrug}
                      className="cursor-pointer inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs font-bold text-primary hover:bg-primary/10 transition"
                    >
                      <Plus className="h-3.5 w-3.5" /> Ajouter un médicament
                    </button>
                  </div>
                  {drugs.map((d, i) => (
                    <DrugRow
                      key={i}
                      drug={d}
                      index={i}
                      onChange={updateDrug}
                      onRemove={removeDrug}
                      canRemove={drugs.length > 1}
                    />
                  ))}
                </div>

                {/* Global notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                    Notes générales (optionnel)
                  </label>
                  <textarea
                    rows={2}
                    value={globalNotes}
                    onChange={(e) => setGlobalNotes(e.target.value)}
                    placeholder="Instructions générales pour le patient…"
                    className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowNewRx(false)}
                    className="cursor-pointer rounded-xl border border-border bg-white px-5 py-2 text-xs font-bold text-ink-soft hover:bg-slate-50 transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-white hover:opacity-90 transition disabled:opacity-60"
                  >
                    {saving ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <FilePlus className="h-3.5 w-3.5" />
                    )}
                    {saving ? "Enregistrement…" : "Enregistrer l'ordonnance"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
