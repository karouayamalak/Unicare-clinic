import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, StatCard, DefaultAvatar } from "@/components/ui-ext/primitives";
import {
  Activity,
  ArrowRight,
  CalendarCheck,
  FileText,
  Heart,
  Pill,
  Plus,
  Star,
  Video,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/authStore";
import { fetchAppointments, type ApiAppointment } from "@/lib/api";
import { getPrescriptions } from "@/lib/clinicState";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/patient/")({
  component: PatientOverview,
});

const heartData = Array.from({ length: 14 }).map((_, i) => ({
  d: `J${i + 1}`,
  v: 65 + Math.round(Math.sin(i) * 8 + Math.cos(i / 2) * 4),
}));

const vitals = [
  { label: "Tension artérielle", value: "120/80", unit: "mmHg", status: "normal", icon: Heart },
  { label: "Fréquence cardiaque", value: "72", unit: "bpm", status: "normal", icon: Activity },
  { label: "Glycémie", value: "95", unit: "mg/dL", status: "normal", icon: Activity },
  { label: "SpO₂", value: "98", unit: "%", status: "normal", icon: Activity },
];

  const quickActions = [
    {
      icon: CalendarCheck,
      label: "Prendre RDV",
      to: "/doctors",
      color: "bg-primary/10 text-primary border-primary/20",
    },
    {
      icon: FileText,
      label: "Mes ordonnances",
      to: "/patient/medical",
      color: "bg-violet-500/10 text-violet-600 border-violet-500/20",
    },
    {
      icon: FileText,
      label: "Mes Documents",
      to: "/patient/documents",
      color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    },
  ];

function PatientOverview() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const prescriptions = getPrescriptions();

  useEffect(() => {
    fetchAppointments()
      .then((res) => setAppointments(res.data.appointments))
      .catch(() => {});
  }, []);

  const myAppts = appointments;
  const myRx = prescriptions.filter(
    (p) =>
      p.patientName.toLowerCase() ===
      `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.toLowerCase().trim(),
  );
  const upcoming = myAppts.filter((a) => a.status === "Confirmé" || a.status === "En attente");

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Bonjour, ${user?.firstName || "Amina"} `}
        description="Voici votre tableau de bord santé du jour."
        actions={
          <Link
            to="/doctors"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-glow hover:opacity-90 transition"
          >
            <Plus className="h-4 w-4" />
            Nouveau rendez-vous
          </Link>
        }
      />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quickActions.map((a, i) => (
          <motion.div
            key={a.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Link
              to={a.to}
              className={cn(
                "flex flex-col items-center gap-3 rounded-2xl border p-5 text-center backdrop-blur-sm transition hover:scale-[1.02] hover:shadow-soft",
                "bg-white/50 border-border",
              )}
            >
              <span
                className={cn(
                  "grid h-11 w-11 place-items-center rounded-xl border shadow-sm",
                  a.color,
                )}
              >
                <a.icon className="h-5 w-5" />
              </span>
              <span className="text-xs font-semibold text-ink">{a.label}</span>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Rendez-vous réservés"
          value={myAppts.length.toString()}
          hint={`${upcoming.length} à venir`}
          icon={CalendarCheck}
        />
        <StatCard
          label="Ordonnances reçues"
          value={myRx.length.toString()}
          hint="Disponibles pour impression"
          icon={Pill}
        />
        <StatCard
          label="Consultations terminées"
          value={myAppts.filter((a) => a.status === "Terminé").length.toString()}
          hint="Historique complet"
          icon={Activity}
        />
        <StatCard label="Dossier Médical" value="Actif" hint="Chiffré AES-256" icon={Heart} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Heart rate chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 rounded-2xl border border-border bg-white/50 p-6 backdrop-blur-sm shadow-soft"
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ink-soft/60">
                Fréquence cardiaque
              </p>
              <p className="mt-1 text-2xl font-bold text-ink">
                72 <span className="text-sm font-semibold text-ink-soft/70">bpm moy.</span>
              </p>
            </div>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
              Normal
            </span>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={heartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="hgrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="d"
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
                stroke="#4f46e5"
                strokeWidth={2}
                fill="url(#hgrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Vitals */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-border bg-white/50 p-6 backdrop-blur-sm shadow-soft space-y-4"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-ink-soft/60">
            Constantes vitales
          </p>
          {vitals.map((v) => (
            <div
              key={v.label}
              className="flex items-center justify-between rounded-xl bg-white/40 border border-border/50 px-4 py-3 shadow-sm"
            >
              <div>
                <p className="text-xs text-ink-soft">{v.label}</p>
                <p className="mt-0.5 text-lg font-bold text-ink">
                  {v.value} <span className="text-xs font-medium text-ink-soft/70">{v.unit}</span>
                </p>
              </div>
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-600 uppercase tracking-wide">
                Normal
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Upcoming appointments */}
      <div className="rounded-2xl border border-border bg-white/50 p-6 backdrop-blur-sm shadow-soft">
        <div className="mb-5 flex items-center justify-between">
          <p className="font-semibold text-ink">Prochains rendez-vous</p>
          <Link
            to="/patient/appointments"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            Tous <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {myAppts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-ink-soft">Aucun rendez-vous à venir.</p>
            <Link
              to="/doctors"
              className="mt-3 inline-flex text-xs font-bold text-primary hover:underline"
            >
              Réserver une consultation avec un médecin &rarr;
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {myAppts.slice(0, 5).map((appt) => (
              <div
                key={appt._id}
                className="flex items-center gap-4 rounded-xl bg-white/40 border border-border/50 px-4 py-3.5 shadow-sm"
              >
                <DefaultAvatar className="h-10 w-10 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{appt.doctorName}</p>
                  <p className="text-xs text-ink-soft truncate">{appt.speciality}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-ink">
                    {new Date(appt.date).toLocaleDateString("fr-DZ", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </p>
                  <p className="text-xs text-ink-soft">{appt.time}</p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                    appt.status === "En consultation"
                      ? "bg-amber-50 text-amber-600 border border-amber-200"
                      : appt.status === "Terminé"
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        : "bg-indigo-50 text-indigo-600 border border-indigo-200",
                  )}
                >
                  {appt.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Medical records quick links */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: FileText,
            label: "Dossier médical",
            desc: "Historique complet",
            to: "/patient/medical",
            color: "text-violet-600 bg-violet-500/10 border-violet-500/20",
          },
          {
            icon: Pill,
            label: "Ordonnances",
            desc: `${myRx.length} disponibles`,
            to: "/patient/medical",
            color: "text-orange-600 bg-orange-500/10 border-orange-500/20",
          },
          {
            icon: Star,
            label: "Favoris",
            desc: "Praticiens enregistrés",
            to: "/patient/favorites",
            color: "text-teal bg-teal/10 border-teal/20",
          },
        ].map((item, i) => (
          <Link
            key={item.label}
            to={item.to}
            className="flex items-center gap-4 rounded-2xl border border-border bg-white/50 p-5 backdrop-blur-sm transition hover:bg-white/80 hover:border-border-strong group shadow-soft"
          >
            <span
              className={cn(
                "grid h-11 w-11 shrink-0 place-items-center rounded-xl border shadow-sm",
                item.color,
              )}
            >
              <item.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-ink group-hover:text-primary transition">
                {item.label}
              </p>
              <p className="text-xs text-ink-soft">{item.desc}</p>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 text-ink-soft/40 group-hover:text-ink transition" />
          </Link>
        ))}
      </div>
    </div>
  );
}
