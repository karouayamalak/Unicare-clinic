import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, DefaultAvatar } from "@/components/ui-ext/primitives";
import { fetchAppointments, updateAppointmentStatus, type ApiAppointment } from "@/lib/api";
import { CalendarPlus, Clock, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { printOrdonnance, printReceipt } from "@/lib/printHelper";

export const Route = createFileRoute("/patient/appointments")({
  component: PatientAppointments,
});

const statusStyles: Record<string, string> = {
  Confirmé: "bg-teal/10 text-teal border border-teal/20",
  "En attente": "bg-amber-500/10 text-amber-600 border border-amber-500/20",
  "En consultation": "bg-teal/10 text-teal border border-teal/20 animate-pulse",
  Terminé: "bg-slate-100 text-slate-700 border-slate-200",
  Annulé: "bg-red-500/10 text-red-600 border-red-500/20",
};

function PatientAppointments() {
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchAppointments();
      setAppointments(res.data.appointments);
    } catch {
      toast.error("Impossible de charger vos rendez-vous.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleMarkArrived = async (id: string, currentStatus: string) => {
    try {
      await updateAppointmentStatus(id, {
        status: currentStatus as any, // keep current status, just add arrivedAt
        arrivedAt: new Date().toLocaleTimeString("fr-DZ", { hour: "2-digit", minute: "2-digit" }),
      });
      toast.success(
        "Votre arrivée a été signalée au médecin. Veuillez vous installer dans la salle d'attente.",
      );
      await load();
    } catch {
      toast.error("Erreur lors du signalement.");
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm("Annuler ce rendez-vous ?")) return;
    try {
      await updateAppointmentStatus(id, { status: "Annulé" });
      toast.success("Rendez-vous annulé.");
      await load();
    } catch {
      toast.error("Impossible d'annuler le rendez-vous.");
    }
  };

  const todayStr = (() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  })();

  const upcoming = appointments.filter((a) => a.status !== "Terminé" && a.status !== "Annulé");
  const past = appointments.filter((a) => a.status === "Terminé" || a.status === "Annulé");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mes Rendez-vous"
        description="Gérez vos consultations à venir et accédez à votre historique médical."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="cursor-pointer rounded-xl border border-border bg-white p-2.5 hover:bg-slate-50 transition shadow-sm"
            >
              <RefreshCw className={cn("h-4 w-4 text-ink-soft", loading && "animate-spin")} />
            </button>
            <Link to="/doctors" className="btn-primary">
              <CalendarPlus className="h-4 w-4" /> Réserver un rendez-vous
            </Link>
          </div>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Chargement…
        </div>
      ) : (
        <>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-soft/60">
            Rendez-vous à venir ({upcoming.length})
          </h2>
          <div className="space-y-3">
            {upcoming.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-white/30 p-8 text-center text-ink-soft">
                <Clock className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                <p className="text-sm">Aucun rendez-vous à venir.</p>
                <Link
                  to="/doctors"
                  className="mt-3 inline-block text-xs font-bold text-primary hover:underline"
                >
                  Prendre un rendez-vous →
                </Link>
              </div>
            ) : (
              upcoming.map((a) => (
                <div
                  key={a._id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-white/50 p-5 backdrop-blur-sm shadow-soft transition hover:bg-white/70"
                >
                  <div className="flex items-center gap-4">
                    <DefaultAvatar className="h-14 w-14 border border-border" />
                    <div>
                      <p className="font-bold text-ink">{a.doctorName}</p>
                      <p className="text-xs font-semibold text-teal">{a.speciality}</p>
                      <p className="mt-1 text-xs text-ink-soft/80 font-semibold">
                        {a.date} à {a.time} • En clinique
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-bold border capitalize",
                        a.status === "En attente" && !a.arrivedAt
                          ? "bg-amber-50 text-amber-700 border-amber-100"
                          : statusStyles[a.status],
                      )}
                    >
                      {a.status === "En attente" && !a.arrivedAt ? "En attente de confirmation" : a.status}
                    </span>
                    {(a.status === "Confirmé" || (a.status === "En attente" && !a.arrivedAt)) ? (
                      <button
                        onClick={() => handleMarkArrived(a._id, a.status)}
                        className="cursor-pointer inline-flex items-center gap-1 rounded bg-[#0284c7] px-3.5 py-2 text-xs font-bold text-white shadow hover:opacity-90 transition"
                      >
                        Je suis arrivé
                      </button>
                    ) : a.arrivedAt ? (
                      <span className="text-xs font-bold text-[#0284c7] bg-sky-50 px-3 py-2 rounded border border-sky-100 animate-pulse">
                        Salle d'attente {a.arrivedAt ? `(depuis ${a.arrivedAt})` : ""}
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-2 rounded border border-slate-100">
                        Présentiel
                      </span>
                    )}
                    {(a.status === "Confirmé" || (a.status === "En attente" && !a.arrivedAt)) && (
                      <button
                        onClick={() => handleCancel(a._id)}
                        className="cursor-pointer text-xs text-red-400 hover:text-red-600 font-semibold px-2 py-1"
                      >
                        Annuler
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <h2 className="mb-3 mt-8 text-xs font-bold uppercase tracking-wider text-ink-soft/60">
            Historique des consultations
          </h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-white/50 backdrop-blur-sm shadow-soft">
            {past.length === 0 ? (
              <p className="text-sm text-ink-soft text-center py-8">
                Aucun antécédent de consultation enregistré.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-white/40 text-[10px] font-bold uppercase tracking-wider text-ink-soft/60 text-left">
                    <tr>
                      <th className="px-6 py-3">Médecin</th>
                      <th className="px-6 py-3">Spécialité</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Statut</th>
                      <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {past.map((a) => (
                      <tr key={a._id} className="hover:bg-white/40 transition">
                        <td className="flex items-center gap-3 px-6 py-4">
                          <DefaultAvatar className="h-8 w-8" />
                          <span className="font-bold text-ink">{a.doctorName}</span>
                        </td>
                        <td className="px-6 py-4 text-ink-soft font-semibold text-xs">
                          {a.speciality}
                        </td>
                        <td className="px-6 py-4 text-ink-soft font-medium text-xs">
                          {a.date} — {a.time}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide border",
                              statusStyles[a.status],
                            )}
                          >
                            {a.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-3 text-xs font-bold">
                            {a.status === "Terminé" && a.prescription && (
                              <button
                                onClick={() =>
                                  printOrdonnance({
                                    id: a._id,
                                    date: a.date,
                                    doctorName: a.doctorName,
                                    patientName: a.patientName,
                                    drug: a.prescription!.drug,
                                    dose: a.prescription!.dose,
                                    freq: a.prescription!.freq,
                                    refills: a.prescription!.refills,
                                    notes: a.prescription!.notes,
                                    drugs: a.prescription!.drugs,
                                  })
                                }
                                className="text-teal hover:underline cursor-pointer"
                              >
                                Ordonnance
                              </button>
                            )}
                            {a.status === "Terminé" && a.price !== undefined && a.price > 0 && (
                              <button
                                onClick={() =>
                                  printReceipt({
                                    receiptNumber: a.receiptNumber || `REC-${a._id.substring(18)}`,
                                    date: a.date,
                                    doctorName: a.doctorName,
                                    speciality: a.speciality,
                                    patientName: a.patientName,
                                    patientEmail: a.patientEmail,
                                    price: a.price!,
                                  })
                                }
                                className="text-amber-600 hover:underline cursor-pointer"
                              >
                                Reçu
                              </button>
                            )}
                            {a.status === "Annulé" && (
                              <span className="text-slate-400 font-medium">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
