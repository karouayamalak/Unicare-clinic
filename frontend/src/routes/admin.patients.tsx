import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-ext/primitives";
import { fetchPatients, type ApiPatient } from "@/lib/api";
import { Search, RefreshCw, UserCheck, CalendarCheck, User } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { DefaultAvatar } from "@/components/ui-ext/primitives";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/patients")({
  component: AdminPatients,
});

function AdminPatients() {
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState<ApiPatient[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchPatients();
      setPatients(res.data.patients);
    } catch {
      toast.error("Impossible de charger les patients.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.speciality.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patients"
        description="Répertoire complet des patients enregistrés au centre."
        actions={
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un patient…"
                className="w-64 rounded-xl border border-border bg-white py-2.5 pl-9 pr-4 text-sm focus:border-primary focus:outline-none shadow-sm"
              />
            </div>
            <button
              onClick={load}
              className="cursor-pointer rounded-xl border border-border bg-white p-2.5 hover:bg-slate-50 transition shadow-sm"
            >
              <RefreshCw className={cn("h-4 w-4 text-ink-soft", loading && "animate-spin")} />
            </button>
          </div>
        }
      />

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Patients totaux",
            value: patients.length,
            icon: User,
            cls: "text-ink bg-white/60 border-border",
          },
          {
            label: "Consultations",
            value: patients.reduce((s, p) => s + p.visitCount, 0),
            icon: CalendarCheck,
            cls: "text-primary bg-primary/10 border-primary/20",
          },
          {
            label: "Patients actifs",
            value: patients.filter((p) => p.lastStatus !== "Annulé").length,
            icon: UserCheck,
            cls: "text-teal bg-teal/10 border-teal/20",
          },
        ].map((s) => (
          <div key={s.label} className={cn("rounded-2xl border p-4 text-center shadow-sm", s.cls)}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-semibold opacity-70 mt-0.5">{s.label}</p>
          </div>
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
              <thead className="border-b border-border bg-white/40 text-[10px] font-bold uppercase tracking-wider text-ink-soft/60 text-left">
                <tr>
                  <th className="px-5 py-3.5">Patient</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Spécialité</th>
                  <th className="px-5 py-3.5">Consultations</th>
                  <th className="px-5 py-3.5">Dernier statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-ink-soft text-sm">
                      {patients.length === 0 ? "Aucun patient enregistré." : "Aucun résultat."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((p, i) => (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-white/40 transition"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <DefaultAvatar className="h-9 w-9 border border-border shrink-0" />
                          <p className="font-bold text-ink">{p.name}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-ink-soft text-xs">{p.email}</td>
                      <td className="px-5 py-3.5 text-ink-soft text-xs font-medium">
                        {p.speciality}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-bold text-primary">
                          {p.visitCount}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                            p.lastStatus === "Terminé"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : p.lastStatus === "En consultation"
                                ? "bg-teal/10 text-teal border-teal/20"
                                : p.lastStatus === "Annulé"
                                  ? "bg-red-50 text-red-600 border-red-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200",
                          )}
                        >
                          {p.lastStatus}
                        </span>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
