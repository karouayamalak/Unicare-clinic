import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarDays, Clock, CheckCircle2, XCircle, PlusCircle } from "lucide-react";
import { fetchAppointments, fetchDoctors, type ApiError } from "../../lib/api";
import { useAuth } from "../../lib/authStore";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/patient/")({
  component: PatientHome,
});

type Appointment = {
  _id: string;
  doctorName: string;
  speciality: string;
  date: string;
  time: string;
  status: string;
  mode: string;
};

const STATUS_COLORS: Record<string, string> = {
  Confirmé: "bg-emerald-100 text-emerald-700",
  "En attente": "bg-amber-100 text-amber-700",
  "En consultation": "bg-blue-100 text-blue-700",
  Terminé: "bg-slate-100 text-slate-500",
  Annulé: "bg-red-100 text-red-600",
};

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white/70 p-5 shadow-sm flex items-center gap-4">
      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-ink">{value}</p>
        <p className="text-xs text-ink-soft">{label}</p>
      </div>
    </div>
  );
}

export default function PatientHome() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorCount, setDoctorCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [apptRes, docRes] = await Promise.all([
          fetchAppointments(),
          fetchDoctors({ status: "Actif" }),
        ]);
        setAppointments(apptRes.data?.appointments ?? []);
        setDoctorCount(docRes.data?.doctors?.length ?? 0);
      } catch {
        /* silently handled */
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const upcoming = appointments.filter(
    (a) => a.status === "Confirmé" || a.status === "En attente",
  );
  const completed = appointments.filter((a) => a.status === "Terminé").length;
  const cancelled = appointments.filter((a) => a.status === "Annulé").length;
  const firstName = user?.firstName ?? "Patient";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-ink">
            Bonjour, {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Voici un aperçu de vos rendez-vous et de votre santé.
          </p>
        </div>
        <Link
          to="/patient/appointments"
          className="flex items-center gap-2 rounded-full bg-[#06122e] px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90 transition"
        >
          <PlusCircle className="h-4 w-4" />
          Prendre rendez-vous
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="À venir"
          value={upcoming.length}
          icon={CalendarDays}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Terminés"
          value={completed}
          icon={CheckCircle2}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Annulés"
          value={cancelled}
          icon={XCircle}
          color="bg-red-50 text-red-500"
        />
        <StatCard
          label="Médecins disponibles"
          value={doctorCount}
          icon={Clock}
          color="bg-violet-50 text-violet-600"
        />
      </div>

      {/* Upcoming Appointments */}
      <section>
        <h2 className="mb-4 text-base font-bold text-ink">
          Prochains rendez-vous
        </h2>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-2xl bg-slate-100"
              />
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white/50 py-12 text-center">
            <CalendarDays className="mx-auto mb-3 h-10 w-10 text-ink-soft/40" />
            <p className="text-sm font-semibold text-ink-soft">Aucun rendez-vous à venir</p>
            <p className="mt-1 text-xs text-ink-soft/60">
              Prenez rendez-vous avec l'un de nos médecins.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {upcoming.map((a) => (
              <li
                key={a._id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-white/80 px-5 py-4 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500 font-bold text-sm">
                    {a.doctorName.split(" ")[1]?.[0] ?? "D"}
                  </div>
                  <div>
                    <p className="font-semibold text-ink text-sm">{a.doctorName}</p>
                    <p className="text-xs text-ink-soft">{a.speciality}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div>
                    <p className="text-xs font-semibold text-ink">{a.date}</p>
                    <p className="text-[11px] text-ink-soft">{a.time} · {a.mode}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${STATUS_COLORS[a.status] ?? "bg-slate-100 text-slate-500"}`}
                  >
                    {a.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
