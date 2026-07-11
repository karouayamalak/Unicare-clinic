import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-ext/primitives";
import { Chip, DataTable } from "@/components/ui-ext/DataTable";
import { doctors } from "@/lib/data";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, X, Plus, Trash2, Save, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/authStore";
import {
  fetchAppointments,
  fetchDoctors,
  updateAppointmentStatus,
  updatePrescription,
  type ApiDoctor,
} from "@/lib/api";
import { addPatientDocument } from "@/lib/clinicState";

export const Route = createFileRoute("/doctor/appointments")({
  component: DoctorAppointments,
});

interface ApiAppointment {
  _id: string;
  patientName: string;
  patientEmail: string;
  doctorId: string;
  date: string;
  time: string;
  status: "Confirmé" | "En attente" | "En consultation" | "Terminé" | "Annulé";
  speciality: string;
  reason: string;
  notes?: string;
  dependentId?: string;
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
}

interface DrugLine {
  drug: string;
  dose: string;
  freq: string;
  refills: number;
  notes?: string;
}

const EMPTY_DRUG: DrugLine = { drug: "", dose: "", freq: "", refills: 0, notes: "" };

const STATUS_COLORS: Record<string, { cls: string; label: string }> = {
  "En attente": { cls: "border-yellow-300 bg-yellow-50 text-yellow-700", label: "Waiting" },
  "En consultation": { cls: "border-blue-300 bg-blue-50 text-blue-700", label: "In Progress" },
  Terminé: { cls: "border-green-300 bg-green-50 text-green-700", label: "Completed" },
  Annulé: { cls: "border-red-300 bg-red-50 text-red-700", label: "Cancelled" },
};

function DoctorAppointments() {
  const [selectedAppointment, setSelectedAppointment] = useState<ApiAppointment | null>(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [drugs, setDrugs] = useState<DrugLine[]>([EMPTY_DRUG]);
  const [prescriptionNotes, setPrescriptionNotes] = useState("");
  const [paymentPrice, setPaymentPrice] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const {
    data: appointments = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["doctorAppointments"],
    queryFn: async () => {
      const res = await fetchAppointments();
      return res.data.appointments;
    },
    refetchInterval: 10000,
  });

  const handleOpenPrescription = (appt: ApiAppointment) => {
    setSelectedAppointment(appt);
    setDrugs([EMPTY_DRUG]);
    setPrescriptionNotes("");
    setShowPrescriptionModal(true);
  };

  const handleDrugChange = (index: number, field: keyof DrugLine, value: any) => {
    const newDrugs = [...drugs];
    newDrugs[index] = { ...newDrugs[index], [field]: value };
    setDrugs(newDrugs);
  };

  const handleAddDrug = () => {
    setDrugs([...drugs, EMPTY_DRUG]);
  };

  const handleRemoveDrug = (index: number) => {
    setDrugs(drugs.filter((_, i) => i !== index));
  };

  const handleSavePrescription = async () => {
    if (!selectedAppointment) return;

    const validDrugs = drugs.filter((d) => d.drug && d.dose && d.freq);
    if (validDrugs.length === 0) {
      alert("Veuillez ajouter au moins un médicament avec nom, dose et fréquence.");
      return;
    }

    setSubmitting(true);
    try {
      await updatePrescription(selectedAppointment._id, {
        prescription: {
          drug: validDrugs[0].drug,
          dose: validDrugs[0].dose,
          freq: validDrugs[0].freq,
          refills: validDrugs[0].refills,
          notes: prescriptionNotes || validDrugs[0].notes,
          drugs: validDrugs,
        },
      });
      await refetch();
      setShowPrescriptionModal(false);
      setShowPaymentModal(true);
    } catch (err) {
      console.error("Error saving prescription:", err);
      alert("Erreur lors de l'enregistrement de l'ordonnance.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSavePayment = async () => {
    if (!selectedAppointment) return;

    if (!paymentPrice || !receiptNumber) {
      alert("Veuillez remplir le montant et le numéro de reçu.");
      return;
    }

    setSubmitting(true);
    try {
      await updateAppointmentStatus(selectedAppointment._id, {
        status: "Terminé",
        price: parseFloat(paymentPrice),
        receiptNumber,
      });

      // Auto-add prescription as Rx document in patient's dossier
      try {
        addPatientDocument(selectedAppointment.patientName, {
          name: `Ordonnance_${selectedAppointment.patientName.replace(/ /g, "_")}_${new Date().toLocaleDateString("fr-DZ").replace(/\//g, "-")}.pdf`,
          category: "Rx",
          size: "—",
          fileDataUrl: undefined,
        });
      } catch (err) {
        console.error("Error saving prescription document:", err);
      }

      await refetch();
      setShowPaymentModal(false);
      setPaymentPrice("");
      setReceiptNumber("");
      setSelectedAppointment(null);
    } catch (err) {
      console.error("Error saving payment:", err);
      alert("Erreur lors du traitement du paiement.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatus = async (appointmentId: string, newStatus: string) => {
    try {
      await updateAppointmentStatus(appointmentId, { status: newStatus });
      await refetch();
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Erreur lors de la mise à jour du statut.");
    }
  };

  return (
    <div className="space-y-4 p-4">
      <PageHeader
        title="Appointments"
        description="Manage patient appointments and consultations."
      />

      {isLoading ? (
        <div className="text-center py-8 text-ink-soft">Chargement des rendez-vous...</div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-8 text-ink-soft">Aucun rendez-vous trouvé.</div>
      ) : (
        <div className="space-y-2">
          {appointments.map((appt) => {
            const st = STATUS_COLORS[appt.status] || STATUS_COLORS["En attente"];
            return (
              <motion.div
                key={appt._id}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-between gap-4 rounded-lg border border-border bg-white p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-ink truncate">{appt.patientName}</h3>
                  <div className="flex items-center gap-2 text-xs text-ink-soft mt-1">
                    <span>
                      {appt.date} à {appt.time}
                    </span>
                    <span>•</span>
                    <span>{appt.speciality}</span>
                    <span>•</span>
                    <span>{appt.reason}</span>
                  </div>
                  {appt.dependentInfo?.isDependent && appt.dependentInfo.label && (
                    <div className="mt-2 space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-2 text-[11px] text-slate-600">
                      <div className="inline-flex items-center rounded-full bg-white px-2.5 py-1 font-semibold text-slate-700">
                        {appt.dependentInfo.childName ? `${appt.dependentInfo.childName} • ` : ""}
                        {appt.dependentInfo.label}
                      </div>
                      {appt.dependentInfo.dateOfBirth && (
                        <div>Naissance : {appt.dependentInfo.dateOfBirth}</div>
                      )}
                      {appt.dependentInfo.allergies && (
                        <div>Allergies : {appt.dependentInfo.allergies}</div>
                      )}
                      {appt.dependentInfo.chronicConditions && (
                        <div>Antécédents : {appt.dependentInfo.chronicConditions}</div>
                      )}
                      {appt.dependentInfo.bloodType && (
                        <div>Groupe : {appt.dependentInfo.bloodType}</div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wide",
                      st.cls,
                    )}
                  >
                    {st.label}
                  </span>
                  {appt.status === "En attente" && (
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                        Liste d’attente
                      </span>
                      <button
                        onClick={() => handleStatus(appt._id, "En consultation")}
                        className="cursor-pointer rounded-lg bg-teal px-3 py-1.5 text-xs font-bold text-white hover:opacity-90 transition"
                      >
                        Commencer
                      </button>
                    </div>
                  )}
                  {appt.status === "En consultation" && (
                    <button
                      onClick={() => handleOpenPrescription(appt)}
                      className="cursor-pointer rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:opacity-90 transition flex items-center gap-1"
                    >
                      <FileText className="h-3 w-3" /> Ordonnance
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Prescription Modal */}
      <AnimatePresence>
        {showPrescriptionModal && selectedAppointment && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-lg w-full max-w-lg my-8"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-white rounded-t-2xl">
                <div>
                  <h2 className="text-lg font-bold text-ink">Ordonnance médicale</h2>
                  <p className="text-xs text-ink-soft mt-1">
                    {selectedAppointment.patientName} - {selectedAppointment.date} à{" "}
                    {selectedAppointment.time}
                  </p>
                  {selectedAppointment.dependentInfo?.isDependent && (
                    <p className="text-[11px] text-slate-500 mt-1">
                      {selectedAppointment.dependentInfo.label}
                      {selectedAppointment.dependentInfo.allergies &&
                        ` • Allergies : ${selectedAppointment.dependentInfo.allergies}`}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setShowPrescriptionModal(false)}
                  className="cursor-pointer p-2 rounded-lg hover:bg-slate-100 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-3">
                  {drugs.map((drug, i) => (
                    <div
                      key={i}
                      className="border border-border rounded-lg p-4 space-y-3 bg-slate-50"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-ink-soft">
                          Médicament {i + 1}
                        </span>
                        {drugs.length > 1 && (
                          <button
                            onClick={() => handleRemoveDrug(i)}
                            className="cursor-pointer p-1 text-red-500 hover:bg-red-50 rounded transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-ink-soft mb-1">
                            Médicament *
                          </label>
                          <input
                            value={drug.drug}
                            onChange={(e) => handleDrugChange(i, "drug", e.target.value)}
                            placeholder="ex: Amoxicilline"
                            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-ink-soft mb-1">
                            Dose *
                          </label>
                          <input
                            value={drug.dose}
                            onChange={(e) => handleDrugChange(i, "dose", e.target.value)}
                            placeholder="ex: 500 mg"
                            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-ink-soft mb-1">
                            Fréquence *
                          </label>
                          <input
                            value={drug.freq}
                            onChange={(e) => handleDrugChange(i, "freq", e.target.value)}
                            placeholder="ex: 3× / jour"
                            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-ink-soft mb-1">
                            Renouvellements
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={drug.refills}
                            onChange={(e) => handleDrugChange(i, "refills", Number(e.target.value))}
                            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                          />
                        </div>
                      </div>
                      {drug.notes !== undefined && (
                        <div>
                          <label className="block text-xs font-bold text-ink-soft mb-1">
                            Notes
                          </label>
                          <textarea
                            value={drug.notes}
                            onChange={(e) => handleDrugChange(i, "notes", e.target.value)}
                            placeholder="ex: Avant les repas"
                            rows={2}
                            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleAddDrug}
                  className="w-full cursor-pointer rounded-lg border border-dashed border-primary text-primary py-2.5 text-sm font-semibold hover:bg-primary/5 transition flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" /> Ajouter un médicament
                </button>

                <div>
                  <label className="block text-xs font-bold text-ink-soft mb-1">
                    Notes d'ordonnance (optionnel)
                  </label>
                  <textarea
                    value={prescriptionNotes}
                    onChange={(e) => setPrescriptionNotes(e.target.value)}
                    placeholder="ex: À prendre avec du lait, Éviter l'exposition au soleil..."
                    rows={3}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 p-6 border-t border-border bg-white rounded-b-2xl">
                <button
                  onClick={() => setShowPrescriptionModal(false)}
                  className="flex-1 cursor-pointer rounded-lg border border-border bg-white text-ink font-semibold py-2.5 hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSavePrescription}
                  disabled={submitting}
                  className="flex-1 cursor-pointer rounded-lg bg-teal text-white font-semibold py-2.5 hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="h-4 w-4" />{" "}
                  {submitting ? "Enregistrement..." : "Enregistrer & Facturer"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && selectedAppointment && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-lg w-full max-w-md"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-emerald-50 to-teal/10 rounded-t-2xl">
                <div>
                  <h2 className="text-lg font-bold text-ink">Ticket de paiement</h2>
                  <p className="text-xs text-ink-soft mt-1">
                    {format(new Date(), "dd MMMM yyyy HH:mm")}
                  </p>
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="cursor-pointer p-2 rounded-lg hover:bg-white/50 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-soft">Patient</span>
                    <span className="font-semibold text-ink">
                      {selectedAppointment.patientName}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-soft">Service</span>
                    <span className="font-semibold text-ink">{selectedAppointment.speciality}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-soft">Date</span>
                    <span className="font-semibold text-ink">
                      {selectedAppointment.date} à {selectedAppointment.time}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-ink-soft mb-2">
                      Montant (DZD) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft font-semibold">
                        DA
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={paymentPrice}
                        onChange={(e) => setPaymentPrice(e.target.value)}
                        placeholder="0.00"
                        className="w-full rounded-lg border border-border bg-white pl-10 pr-3 py-3 text-lg font-bold focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink-soft mb-2">
                      Numéro de reçu *
                    </label>
                    <input
                      type="text"
                      value={receiptNumber}
                      onChange={(e) => setReceiptNumber(e.target.value)}
                      placeholder="ex: REC-2026-0001"
                      className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/10"
                    />
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  <p className="text-xs text-emerald-700 font-semibold">
                    Le patient sera automatiquement retiré de la salle d'attente après
                    confirmation du paiement.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 p-6 border-t border-border bg-white rounded-b-2xl">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 cursor-pointer rounded-lg border border-border bg-white text-ink font-semibold py-2.5 hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSavePayment}
                  disabled={submitting}
                  className="flex-1 cursor-pointer rounded-lg bg-emerald-600 text-white font-semibold py-2.5 hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />{" "}
                  {submitting ? "Traitement..." : "Confirmer le paiement"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
