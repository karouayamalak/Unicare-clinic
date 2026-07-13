import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, CalendarDays, CheckCircle2, Clock } from "lucide-react";
import { fetchAppointments, fetchPatientsList } from "../../lib/api";
import { useAuth } from "../../lib/authStore";

export const Route = createFileRoute("/doctor/")({
  component: DoctorHome,
});

type Appointment = {
  _id: string;
  patientName: string;
  patientEmail: string;
  date: string;
  time: string;
  status: string;
  reason: string;
  speciality: string;
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

export default function DoctorHome() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientCount, setPatientCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const load = async () => {
      try {
        const [apptRes, patientsRes] = await Promise.all([
          fetchAppointments(),
          fetchPatientsList(),
        ]);
        setAppointments(apptRes.data?.appointments ?? []);
        setPatientCount(patientsRes.data?.patients?.length ?? 0);
      } catch {
        /* silently handled */
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const todayAppts = appointments.filter((a) => a.date === todayStr);
  const pending = appointments.filter((a) => a.status === "En attente").length;
  const inConsultation = appointments.filter((a) => a.status === "En consultation").length;
  const doctorName = user ? `Dr. ${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() : "Dr.";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ink">
          Bonjour, {doctorName} 👋
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          {todayStr} · {todayAppts.length} consultation(s) aujourd'hui
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Patients total"
          value={patientCount}
          icon={Users}
          color="bg-violet-50 text-violet-600"
        />
        <StatCard
          label="Consultations auj."
          value={todayAppts.length}
          icon={CalendarDays}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="En consultation"
          value={inConsultation}
          icon={Clock}
          color="bg-amber-50 text-amber-600"
        />
        <StatCard
          label="En attente"
          value={pending}
          icon={CheckCircle2}
          color="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* Today's Schedule */}
      <section>
        <h2 className="mb-4 text-base font-bold text-ink">Consultations du jour</h2>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : todayAppts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white/50 py-12 text-center">
            <CalendarDays className="mx-auto mb-3 h-10 w-10 text-ink-soft/40" />
            <p className="text-sm font-semibold text-ink-soft">Aucune consultation aujourd'hui</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {todayAppts
              .sort((a, b) => a.time.localeCompare(b.time))
              .map((a) => (
                <li
                  key={a._id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-white/80 px-5 py-4 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 font-bold text-sm">
                      {a.patientName.split(" ")[0]?.[0] ?? "P"}
                    </div>
                    <div>
                      <p className="font-semibold text-ink text-sm">{a.patientName}</p>
                      <p className="text-xs text-ink-soft">{a.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-xs font-semibold text-ink">{a.time}</p>
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
