import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-ext/primitives";
import { fetchAppointments, updateAppointmentStatus, type ApiAppointment } from "@/lib/api";
import { CheckCircle2, Clock, AlertTriangle, Search, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/appointments")({
  component: AdminAppointments,
});

const statusConfig: Record<string, { cls: string; label: string; icon: typeof CheckCircle2 }> = {
  Confirmé: {
    cls: "bg-slate-100 text-slate-700 border-slate-200",
    label: "Confirmé",
    icon: CheckCircle2,
  },
  "En attente": {
    cls: "bg-amber-500/10 text-amber-700 border-amber-500/20",
    label: "En attente",
    icon: Clock,
  },
  "En consultation": {
    cls: "bg-teal/10 text-teal border-teal/20",
    label: "En consultation",
    icon: Clock,
  },
  Terminé: {
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    label: "Terminé",
    icon: CheckCircle2,
  },
  Annulé: { cls: "bg-red-50 text-red-600 border-red-200", label: "Annulé", icon: AlertTriangle },
};

function AdminAppointments() {
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchAppointments();
      setAppointments(res.data.appointments);
    } catch {
      toast.error("Impossible de charger les rendez-vous.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateAppointmentStatus(id, { status });
      setAppointments((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status: status as ApiAppointment["status"] } : a)),
      );
      toast.success("Statut mis à jour.");
    } catch {
      toast.error("Erreur lors de la mise à jour.");
    }
  };

  const filtered = appointments.filter((a) => {
    const matchSearch =
      a.patientName.toLowerCase().includes(search.toLowerCase()) ||
      a.doctorName.toLowerCase().includes(search.toLowerCase()) ||
      a.speciality.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: appointments.length,
    confirmed: appointments.filter((a) => a.status === "Confirmé").length,
    inProgress: appointments.filter(
      (a) => a.status === "En consultation" || a.status === "En attente",
    ).length,
    done: appointments.filter((a) => a.status === "Terminé").length,
    cancelled: appointments.filter((a) => a.status === "Annulé").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tous les Rendez-vous"
        description="Supervision globale des rendez-vous de la clinique."
        actions={
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher…"
                className="w-56 rounded border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm focus:border-slate-300 focus:outline-none shadow-sm"
              />
            </div>
            <button
              onClick={load}
              className="cursor-pointer rounded border border-slate-200 bg-white p-2 hover:bg-slate-50 transition shadow-sm"
            >
              <RefreshCw className={cn("h-4 w-4 text-slate-400", loading && "animate-spin")} />
            </button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, cls: "text-ink bg-white border-border" },
          {
            label: "En cours",
            value: stats.inProgress,
            cls: "text-amber-700 bg-amber-50 border-amber-200",
          },
          {
            label: "Terminés",
            value: stats.done,
            cls: "text-emerald-700 bg-emerald-50 border-emerald-200",
          },
          {
            label: "Annulés",
            value: stats.cancelled,
            cls: "text-red-600 bg-red-50 border-red-200",
          },
        ].map((s) => (
          <div key={s.label} className={cn("rounded-xl border p-4 text-center shadow-sm", s.cls)}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-semibold opacity-70 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {["all", "Confirmé", "En attente", "En consultation", "Terminé", "Annulé"].map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={cn(
              "rounded px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer border",
              statusFilter === f
                ? "bg-[#06122e] text-white border-[#06122e]"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
            )}
          >
            {f === "all" ? "Tous" : f}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Chargement…
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-white/50 backdrop-blur-sm shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-white/40 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-left">
                <tr>
                  <th className="px-5 py-3.5">Patient</th>
                  <th className="px-5 py-3.5">Médecin</th>
                  <th className="px-5 py-3.5">Date / Heure</th>
                  <th className="px-5 py-3.5">Mode</th>
                  <th className="px-5 py-3.5">Statut</th>
                  <th className="px-5 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                      Aucun rendez-vous trouvé.
                    </td>
                  </tr>
                ) : (
                  filtered.map((a, i) => {
                    const sc = statusConfig[a.status] ?? statusConfig["Confirmé"];
                    const Icon = sc.icon;
                    return (
                      <motion.tr
                        key={a._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="hover:bg-white/40 transition"
                      >
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-[#06122e]">{a.patientName}</p>
                          <p className="text-xs text-slate-400">{a.patientEmail}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-slate-700">{a.doctorName}</p>
                          <p className="text-xs text-slate-400">{a.speciality}</p>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-600 font-mono">
                          {a.date} — {a.time}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs text-slate-500">Cabinet</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                              sc.cls,
                            )}
                          >
                            <Icon className="h-3 w-3" /> {sc.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <select
                            value={a.status}
                            onChange={(e) => handleStatusChange(a._id, e.target.value)}
                            className="cursor-pointer rounded border border-slate-200 bg-white px-2 py-1 text-xs focus:outline-none"
                          >
                            {Object.entries(statusConfig).map(([k, v]) => (
                              <option key={k} value={k}>
                                {v.label}
                              </option>
                            ))}
                          </select>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
