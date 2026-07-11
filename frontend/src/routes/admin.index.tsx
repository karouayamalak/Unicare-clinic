import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatCard } from "@/components/ui-ext/primitives";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  Stethoscope,
  TrendingUp,
  Users,
  RefreshCw,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import {
  fetchDoctors,
  fetchAppointments,
  fetchPatients,
  type ApiDoctor,
  type ApiAppointment,
  type ApiPatient,
} from "@/lib/api";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

const COLORS = ["#0f172a", "#0d9488", "#7c3aed", "#ea580c", "#16a34a"];

const statusConfig: Record<
  string,
  { color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  Confirmé: { color: "bg-teal/10 text-teal border border-teal/20", icon: CheckCircle2 },
  "En consultation": { color: "bg-primary/10 text-primary border border-primary/20", icon: Clock },
  "En attente": { color: "bg-amber-500/10 text-amber-600 border border-amber-500/20", icon: Clock },
  Terminé: {
    color: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    icon: CheckCircle2,
  },
  Annulé: { color: "bg-red-500/10 text-red-600 border border-red-500/20", icon: AlertTriangle },
};

function AdminOverview() {
  const [doctors, setDoctors] = useState<ApiDoctor[]>([]);
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [patients, setPatients] = useState<ApiPatient[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [docsRes, apptsRes, patsRes] = await Promise.all([
        fetchDoctors(),
        fetchAppointments(),
        fetchPatients(),
      ]);
      setDoctors(docsRes.data.doctors);
      setAppointments(apptsRes.data.appointments);
      setPatients(patsRes.data.patients);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const escapeCSV = (str: any) => {
      if (str === undefined || str === null) return "";
      const text = String(str);
      if (text.includes(",") || text.includes('"') || text.includes("\n")) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    };

    const headers = [
      "ID Rendez-vous",
      "Nom du Patient",
      "Email du Patient",
      "Medecin",
      "Specialite",
      "Date",
      "Heure",
      "Motif",
      "Mode",
      "Statut",
      "Tarif (DA)",
      "Numero de Recu",
      "Date de Creation",
    ];

    const rows = appointments.map((a) => [
      escapeCSV(a._id),
      escapeCSV(a.patientName),
      escapeCSV(a.patientEmail),
      escapeCSV(a.doctorName),
      escapeCSV(a.speciality),
      escapeCSV(a.date),
      escapeCSV(a.time),
      escapeCSV(a.reason),
      escapeCSV(a.mode === "Video" ? "Teleconsultation" : "En clinique"),
      escapeCSV(a.status),
      a.price || 0,
      escapeCSV(a.receiptNumber || "N/A"),
      escapeCSV(new Date(a.createdAt).toLocaleString("fr-DZ")),
    ]);

    const summary = [
      ["--- EXPORT REPORT UNICARE ---"],
      ["Date d'exportation", new Date().toLocaleString("fr-DZ")],
      ["Total Patients", totalPatients],
      ["Total Rendez-vous", totalAppointments],
      ["Medecins Actifs", activeDoctors],
      ["Revenus Cumules (DA)", totalRevenue],
      [],
      ["--- HISTORIQUE DES CONSULTATIONS ---"],
      headers,
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," + [...summary, ...rows].map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rapport_clinique_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Rapport exporté avec succès en format CSV !");
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalPatients = patients.length;
  const totalAppointments = appointments.length;
  const activeDoctors = doctors.filter((d) => d.status === "Actif").length;

  const feeMap = new Map(doctors.map((d) => [d._id, d.fee]));
  const totalRevenue = appointments
    .filter((a) => ["Confirmé", "En attente", "En consultation", "Terminé"].includes(a.status))
    .reduce((sum, a) => sum + (feeMap.get(a.doctorId) ?? 2000), 0);

  const specCounts: Record<string, number> = {};
  doctors.forEach((d) => {
    specCounts[d.speciality] = (specCounts[d.speciality] || 0) + 1;
  });
  const totalDocs = doctors.length || 1;
  const mix = Object.entries(specCounts)
    .map(([name, count]) => ({
      name,
      value: Math.round((count / totalDocs) * 100),
    }))
    .slice(0, 5);

  if (mix.length === 0) {
    mix.push({ name: "Générale", value: 100 });
  }

  const recent = appointments.slice(0, 5);

  const revenueData = Array.from({ length: 6 }).map((_, idx) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    return {
      m: months[idx],
      v: Math.round((totalRevenue * (0.6 + idx * 0.08)) / 1000),
    };
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tableau de bord Administrateur"
        description="Performances en temps réel — UniCare Centre Médical"
        actions={
          <div className="flex gap-2">
            <button
              onClick={loadData}
              className="inline-flex items-center gap-1 rounded-xl border border-border bg-white/60 p-2.5 hover:bg-slate-50 transition shadow-sm"
            >
              <RefreshCw className={cn("h-4 w-4 text-ink-soft", loading && "animate-spin")} />
            </button>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white/60 px-4 py-2.5 text-sm font-semibold text-ink backdrop-blur-sm hover:bg-white/85 transition cursor-pointer"
            >
              <Download className="h-4 w-4" />
              Exporter rapport
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Chargement des données réelles...
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Patients totaux"
              value={totalPatients.toString()}
              hint="Enregistrés dans la base"
              icon={Users}
            />
            <StatCard
              label="Rendez-vous totaux"
              value={totalAppointments.toString()}
              hint="Toutes périodes confondues"
              icon={CalendarDays}
            />
            <StatCard
              label="Médecins actifs"
              value={activeDoctors.toString()}
              hint="Personnel médical actif"
              icon={Stethoscope}
            />
            <StatCard
              label="Revenus cumulés"
              value={`${totalRevenue.toLocaleString()} DA`}
              hint="Sur les consultations valides"
              icon={DollarSign}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2 rounded-2xl border border-border bg-white/50 p-6 backdrop-blur-sm shadow-soft"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-soft/60">
                    Estimation des revenus (x1000 DA)
                  </p>
                  <p className="mt-1 text-2xl font-bold text-ink">
                    {totalRevenue.toLocaleString()} DA
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-teal/10 px-3 py-1 text-xs font-semibold text-teal border border-teal/20">
                  <TrendingUp className="h-3 w-3" /> Réel
                </span>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={revenueData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f172a" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="m"
                    tick={{ fill: "#4b5563", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#6b7280", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#ffffff",
                      border: "1px solid rgba(15,23,42,0.08)",
                      borderRadius: 10,
                      color: "#111827",
                      fontSize: 12,
                      boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
                    }}
                    cursor={{ stroke: "rgba(15,23,42,0.05)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke="#0f172a"
                    strokeWidth={2}
                    fill="url(#revGrad)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="rounded-2xl border border-border bg-white/50 p-6 backdrop-blur-sm shadow-soft"
            >
              <p className="mb-4 text-xs font-bold uppercase tracking-wider text-ink-soft/60">
                Mix par spécialité
              </p>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={mix}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={66}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {mix.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#ffffff",
                      border: "1px solid rgba(15,23,42,0.08)",
                      borderRadius: 10,
                      color: "#111827",
                      fontSize: 12,
                      boxShadow: "0 8px 30px rgba(0,0,0,0.04)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5">
                {mix.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-ink-soft font-medium">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: COLORS[i % COLORS.length] }}
                      />
                      {item.name}
                    </span>
                    <span className="font-bold text-ink">{item.value}%</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="rounded-2xl border border-border bg-white/50 p-6 backdrop-blur-sm shadow-soft"
          >
            <div className="mb-5 flex items-center justify-between">
              <p className="font-semibold text-ink">Rendez-vous récents (Temps Réel)</p>
              <span className="text-xs text-ink-soft">
                {new Date().toLocaleDateString("fr-DZ", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[10px] font-bold uppercase tracking-wider text-ink-soft/60">
                    <th className="pb-3 pr-4">Patient</th>
                    <th className="pb-3 pr-4">Médecin</th>
                    <th className="pb-3 pr-4">Département</th>
                    <th className="pb-3 pr-4">Heure</th>
                    <th className="pb-3">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {recent.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400 text-sm">
                        Aucun rendez-vous planifié.
                      </td>
                    </tr>
                  ) : (
                    recent.map((row) => {
                      const cfg = statusConfig[row.status] ?? statusConfig["Confirmé"];
                      const Icon = cfg.icon;
                      return (
                        <tr key={row._id} className="hover:bg-white/40 transition">
                          <td className="py-3.5 pr-4 font-semibold text-ink">{row.patientName}</td>
                          <td className="py-3.5 pr-4 text-ink-soft font-medium">
                            {row.doctorName}
                          </td>
                          <td className="py-3.5 pr-4 text-ink-soft/80">{row.speciality}</td>
                          <td className="py-3.5 pr-4 font-mono text-sm text-ink-soft">
                            {row.date} {row.time}
                          </td>
                          <td className="py-3.5">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                                cfg.color,
                              )}
                            >
                              <Icon className="h-3 w-3" />
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
