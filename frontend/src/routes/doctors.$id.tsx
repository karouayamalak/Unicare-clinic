import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/layouts/MarketingLayout";
import { fetchDoctor, type ApiDoctor } from "@/lib/api";
import {
  Award,
  CalendarCheck,
  Clock,
  GraduationCap,
  MapPin,
  Users,
  ArrowLeft,
  Stethoscope,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/authStore";

export const Route = createFileRoute("/doctors/$id")({
  loader: async ({ params }) => {
    try {
      const res = await fetchDoctor(params.id);
      return { doctor: res.data.doctor };
    } catch {
      throw notFound();
    }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.doctor.name} — UniCare` },
          { name: "description", content: loaderData.doctor.bio },
        ]
      : [],
  }),
  component: DoctorProfile,
  notFoundComponent: () => (
    <MarketingLayout>
      <div className="py-32 text-center text-muted-foreground">Médecin introuvable.</div>
    </MarketingLayout>
  ),
});

function DoctorProfile() {
  const { doctor: d } = Route.useLoaderData();
  const isBookable = d.status === "Actif";

  return (
    <MarketingLayout>
      {/* Hero */}
      <div className="px-6 pb-16 pt-14">
        <div className="hero-panel mx-auto max-w-6xl px-6 py-10 sm:px-8 lg:px-10">
          {/* Back link */}
          <Link
            to="/doctors"
            className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-ink transition"
          >
            <ArrowLeft className="h-4 w-4" />
            All doctors
          </Link>

          <div className="grid gap-10 lg:grid-cols-[340px_1fr]">
            {/* Photo */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="overflow-hidden rounded-[28px] border border-border/70 bg-slate-50 shadow-elevated w-full sm:w-[340px] aspect-[3/4] flex items-center justify-center"
            >
              {d.image ? (
                <img
                  src={d.image}
                  alt={d.name}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-300">
                  <Stethoscope className="h-16 w-16" />
                  <span className="text-sm font-semibold">
                    {d.firstName?.[0]}
                    {d.lastName?.[0]}
                  </span>
                </div>
              )}
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col justify-center"
            >
              <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-teal">
                <span className="h-1.5 w-4 rounded-full bg-teal" />
                {d.speciality}
              </p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
                {d.name}
              </h1>

              {/* Meta chips */}
              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  { icon: Award, label: "Praticien Conventionné", fill: false },
                  {
                    icon: Users,
                    label: `${d.patients.toLocaleString()} patients suivis`,
                    fill: false,
                  },
                  { icon: MapPin, label: d.location, fill: false },
                  { icon: Clock, label: "Ouvert 24h/24 · 7j/7", fill: false },
                ].map(({ icon: Icon, label, fill }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-ink-soft shadow-soft"
                  >
                    <Icon className={`h-3.5 w-3.5 text-teal ${fill ? "fill-teal" : ""}`} />
                    {label}
                  </span>
                ))}
              </div>

              <p className="mt-6 max-w-lg text-sm leading-relaxed text-muted-foreground">
                {d.bio || "Aucune description fournie par le praticien pour le moment."}
              </p>

              {/* Action card */}
              <div className="landing-card mt-7 flex items-center gap-4 p-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Disponibilité
                  </p>
                  <p
                    className={`mt-1 text-sm font-bold ${isBookable ? "text-teal" : "text-amber-600"}`}
                  >
                    {isBookable ? "Cabinet" : d.status === "Congé" ? "En congé" : "Indisponible"}
                  </p>
                </div>
                <div className="ml-auto flex flex-col gap-2 sm:flex-row">
                  {isBookable ? (
                    <BookCta doctorId={d._id} />
                  ) : (
                    <span className="inline-flex items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-6 py-3 text-sm font-semibold text-amber-700">
                      Réservation indisponible
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Details section */}
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-5 lg:grid-cols-3">
          <InfoCard icon={GraduationCap} title="Parcours & Diplômes">
            <ul className="space-y-2 text-sm text-ink-soft">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />
                Diplôme d'Études Médicales Spécialisées (DEMS)
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />
                Praticien résident hospitalier
              </li>
            </ul>
          </InfoCard>
          {/* Languages card removed per request */}
          <InfoCard icon={Clock} title="Horaires d'ouverture">
            <p className="text-sm font-bold text-teal">Ouvert 24h/24 · 7j/7</p>
            <p className="mt-1 text-sm text-ink-soft">Tous les jours de la semaine, sans interruption.</p>
          </InfoCard>
        </div>

      </div>
    </MarketingLayout>
  );
}

function InfoCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="landing-card p-6">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal/10 text-teal">
          <Icon className="h-4 w-4" />
        </span>
        <p className="text-sm font-semibold text-ink">{title}</p>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function BookCta({ doctorId }: { doctorId: string }) {
  const { user } = useAuth();
  if (user) {
    return (
      <Link
        to="/book/$doctorId"
        params={{ doctorId }}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-90 transition cursor-pointer"
      >
        <CalendarCheck className="h-4 w-4" />
        Prendre rendez-vous
      </Link>
    );
  }

  return (
    <Link
      to="/login"
      search={{ redirect: `/book/${doctorId}` }}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-90 transition cursor-pointer"
    >
      <CalendarCheck className="h-4 w-4" />
      Prendre rendez-vous
    </Link>
  );
}
