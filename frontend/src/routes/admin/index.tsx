import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Users,
  Stethoscope,
  CalendarDays,
  Activity,
  TrendingUp,
} from "lucide-react";
import {
  fetchAppointments,
  fetchDoctors,
  fetchPatientsList,
  fetchLogs,
} from "../../lib/api";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
  component: AdminHome,
});

type Appointment = {
  _id: string;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  status: string;
  speciality: string;
};

type LogEntry = {
  _id: string;
  actorName: string;
  actorRole: string;
  action: string;
  objectType: string;
  createdAt: string;
};

const STATUS_COLORS: Record<string, string> = {
  Confirmé: "bg-emerald-100 text-emerald-700",
  "En attente": "bg-amber-100 text-amber-700",
  "En consultation": "bg-blue-100 text-blue-700",
  Terminé: "bg-slate-100 text-slate-500",
  Annulé: "bg-red-100 text-red-600",
};

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  to,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  to?: string;
}) {
  const inner = (
    <div className="rounded-2xl border border-border bg-white/70 p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition">
      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-ink">{value}</p>
        <p className="text-xs text-ink-soft">{label}</p>
      </div>
    </div>
  );
  return to ? <Link to={to as "/"}>{inner}</Link> : inner;
}

export default function AdminHome() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorCount, setDoctorCount] = useState(0);
  const [patientCount, setPatientCount] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [apptRes, docRes, patientsRes, logsRes] = await Promise.all([
          fetchAppointments(),
          fetchDoctors(),
          fetchPatientsList(),
          fetchLogs({ limit: "5" }),
        ]);
        setAppointments(apptRes.data?.appointments ?? []);
        setDoctorCount(docRes.data?.doctors?.length ?? 0);
        setPatientCount(patientsRes.data?.patients?.length ?? 0);
        setLogs(logsRes.data?.logs ?? []);
      } catch {
        /* silently handled */
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const todayStr = new Date().toISOString().split("T")[0];
  const todayAppts = appointments.filter((a) => a.date === todayStr);
  const activeAppts = appointments.filter(
    (a) => a.status !== "Annulé" && a.status !== "Terminé",
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-ink">
            Tableau de bord Administration
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Vue d'ensemble de l'activité de la clinique.
          </p>
        </div>
        <Link
          to="/admin/doctors"
          className="flex items-center gap-2 rounded-full bg-[#06122e] px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90 transition"
        >
          <Stethoscope className="h-4 w-4" />
          Gérer les médecins
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Médecins actifs"
          value={doctorCount}
          icon={Stethoscope}
          color="bg-blue-50 text-blue-600"
          to="/admin/doctors"
        />
        <StatCard
          label="Patients"
          value={patientCount}
          icon={Users}
          color="bg-violet-50 text-violet-600"
          to="/admin/patients"
        />
        <StatCard
          label="RDV actifs"
          value={activeAppts.length}
          icon={CalendarDays}
          color="bg-emerald-50 text-emerald-600"
          to="/admin/appointments"
        />
        <StatCard
          label="Consultations auj."
          value={todayAppts.length}
          icon={TrendingUp}
          color="bg-amber-50 text-amber-600"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Appointments */}
        <section>
          <h2 className="mb-4 text-base font-bold text-ink">
            Derniers rendez-vous
          </h2>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : appointments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-white/50 py-10 text-center">
              <CalendarDays className="mx-auto mb-2 h-8 w-8 text-ink-soft/40" />
              <p className="text-sm text-ink-soft">Aucun rendez-vous</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {appointments.slice(0, 5).map((a) => (
                <li
                  key={a._id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-white/80 px-4 py-3 shadow-sm"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">{a.patientName}</p>
                    <p className="text-xs text-ink-soft">
                      {a.doctorName} · {a.date} {a.time}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[a.status] ?? "bg-slate-100 text-slate-500"}`}
                  >
                    {a.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent Audit Logs */}
        <section>
          <h2 className="mb-4 text-base font-bold text-ink">
            Activité récente
          </h2>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-white/50 py-10 text-center">
              <Activity className="mx-auto mb-2 h-8 w-8 text-ink-soft/40" />
              <p className="text-sm text-ink-soft">Aucun log d'activité</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {logs.map((log) => (
                <li
                  key={log._id}
                  className="flex items-start gap-3 rounded-2xl border border-border bg-white/80 px-4 py-3 shadow-sm"
                >
                  <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-ink truncate">
                      {log.actorName}{" "}
                      <span className="font-normal text-ink-soft">
                        — {log.action}
                      </span>
                    </p>
                    <p className="text-[10px] text-ink-soft mt-0.5">
                      {log.actorRole} ·{" "}
                      {new Date(log.createdAt).toLocaleString("fr-DZ")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
