import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatCard } from "@/components/ui-ext/primitives";
import { fetchAppointments, fetchDoctors, type ApiAppointment, type ApiDoctor } from "@/lib/api";
import { Activity, Users, ThumbsUp, TrendingUp, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from "recharts";
import { toast } from "sonner";
import { useAuth } from "@/lib/authStore";

export const Route = createFileRoute("/doctor/analytics")({
  component: DoctorAnalytics,
});

function DoctorAnalytics() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [doctorProfile, setDoctorProfile] = useState<ApiDoctor | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [apptRes, docRes] = await Promise.all([fetchAppointments(), fetchDoctors()]);
      setAppointments(apptRes.data.appointments);
      if (user) {
        const mine =
          docRes.data.doctors.find(
            (d) =>
              d.userId === user.id ||
              (d.firstName === user.firstName && d.lastName === user.lastName),
          ) ?? null;
        setDoctorProfile(mine);
      }
    } catch {
      toast.error("Impossible de charger les analytiques.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const completed = appointments.filter((a) => a.status === "Terminé").length;
  const cancelled = appointments.filter((a) => a.status === "Annulé").length;
  const totalRevenue = completed * (doctorProfile?.fee ?? 2000);
  const retentionRate =
    appointments.length > 0
      ? Math.round(((appointments.length - cancelled) / appointments.length) * 100)
      : 0;

  const monthlyData = (() => {
    const months = [
      "Jan",
      "Fév",
      "Mar",
      "Avr",
      "Mai",
      "Jun",
      "Jul",
      "Aoû",
      "Sep",
      "Oct",
      "Nov",
      "Déc",
    ];
    const counts: Record<number, number> = {};
    appointments.forEach((a) => {
      const m = new Date(a.date).getMonth();
      if (!isNaN(m)) counts[m] = (counts[m] || 0) + 1;
    });
    return months.map((m, i) => ({ m, visites: counts[i] ?? 0 }));
  })();

  const statusData = [
    { name: "Confirmé", count: appointments.filter((a) => a.status === "Confirmé").length },
    { name: "En attente", count: appointments.filter((a) => a.status === "En attente").length },
    { name: "Terminé", count: completed },
    { name: "Annulé", count: cancelled },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytiques"
        description="Performances détaillées de votre activité médicale."
        actions={
          <button
            onClick={load}
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-border bg-white p-2.5 hover:bg-slate-50 transition shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 text-ink-soft ${loading ? "animate-spin" : ""}`} />
          </button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Chargement des données réelles…
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Consultations totales"
              value={appointments.length.toString()}
              hint="Toutes périodes confondues"
              icon={Activity}
            />
            <StatCard
              label="Patients suivis"
              value={doctorProfile ? doctorProfile.patients.toLocaleString() : "—"}
              hint="Total des patients enregistrés"
              icon={Users}
            />
            <StatCard
              label="Taux de complétion"
              value={`${retentionRate}%`}
              hint="Rendez-vous non annulés"
              icon={ThumbsUp}
            />
            <StatCard
              label="Revenus cumulés"
              value={`${totalRevenue.toLocaleString()} DA`}
              hint={`${(doctorProfile?.fee ?? 2000).toLocaleString()} DA / consultation`}
              icon={TrendingUp}
            />
          </div>

          <div className="rounded-2xl border border-border bg-white/60 p-6 shadow-soft">
            <p className="text-sm font-bold text-ink mb-1">Visites mensuelles (temps réel)</p>
            <p className="text-xs text-ink-soft mb-4">
              Nombre de rendez-vous par mois sur l'année en cours
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid rgba(15,23,42,0.08)",
                      fontSize: 12,
                    }}
                  />
                  <XAxis
                    dataKey="m"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                    width={30}
                    allowDecimals={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="visites"
                    stroke="#0f172a"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#0f172a" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white/60 p-6 shadow-soft">
            <p className="text-sm font-bold text-ink mb-1">Répartition par statut</p>
            <p className="text-xs text-ink-soft mb-4">Distribution des rendez-vous par statut</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} barCategoryGap="40%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                    width={30}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid rgba(15,23,42,0.08)",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="count" fill="#0f172a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
