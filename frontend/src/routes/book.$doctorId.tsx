import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/layouts/MarketingLayout";
import { useState, useEffect } from "react";
import { addDays, format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarCheck, CheckCircle2, FileText, Users, CreditCard } from "lucide-react";
import { toast } from "sonner";
import {
  fetchDoctor,
  fetchBookedSlots,
  bookAppointment,
  fetchDependents,
  type ApiDoctor,
  type ApiDependent,
} from "@/lib/api";
import { DefaultAvatar } from "@/components/ui-ext/primitives";
import { useAuth } from "@/lib/authStore";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/book/$doctorId")({
  loader: async ({ params }) => {
    try {
      const res = await fetchDoctor(params.doctorId);
      return { doctor: res.data.doctor };
    } catch {
      throw notFound();
    }
  },
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ title: `Réserver ${loaderData.doctor.name} — Thazmarth clinic` }] : [],
  }),
  component: BookingPage,
});

// Helper: convert "HH:MM" to total minutes
const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
};

// Helper: all 30-minute slots in a day
const ALL_TIMES: string[] = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

// Filter slots to only those within doctor working hours and not in a break
function getAvailableSlots(doctor: ApiDoctor): string[] {
  const open = toMinutes(doctor.availableHours.start);
  const close = toMinutes(doctor.availableHours.end);
  const breaks = doctor.breaks ?? [];

  return ALL_TIMES.filter((t) => {
    const start = toMinutes(t);
    const end = start + 30;

    // Must be within working hours
    const inHours = open < close
      ? start >= open && end <= close
      : start >= open || end <= close; // cross-midnight shift
    if (!inHours) return false;

    // Must not overlap any break
    for (const br of breaks) {
      const bStart = toMinutes(br.start);
      const bEnd = toMinutes(br.end);
      if (start < bEnd && bStart < end) return false;
    }
    return true;
  });
}

// French day names matching the backend
const FR_DAY_NAMES = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

function BookingPage() {
  const { user } = useAuth();
  const { doctor: d } = Route.useLoaderData();
  const nav = useNavigate();
  const isBookable = d.status === "Actif";
  const [step, setStep] = useState(1);
  const [dateIdx, setDateIdx] = useState(0); // default to first available tomorrow
  const [time, setTime] = useState<string | null>(null);
  const [reason, setReason] = useState("Consultation Générale");

  // Dependent selection
  const [dependents, setDependents] = useState<ApiDependent[]>([]);
  const [selectedDependentId, setSelectedDependentId] = useState<string | null>(null); // null = self
  const [loadingDependents, setLoadingDependents] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  // bookedTimes: set of "HH:MM" already taken for the selected date
  const [bookedTimes, setBookedTimes] = useState<Set<string>>(new Set());

  // Fetch dependents on mount
  useEffect(() => {
    const loadDependents = async () => {
      if (!user) return;
      try {
        setLoadingDependents(true);
        const res = await fetchDependents();
        const fetchedDependents =
          (res as any).data?.dependents ?? (res as any).data?.data?.dependents ?? [];
        setDependents(fetchedDependents);
      } catch (error) {
        console.error("Failed to load dependents:", error);
      } finally {
        setLoadingDependents(false);
      }
    };
    loadDependents();
  }, [user]);

  // Clinic shows 14 days ahead
  const dates = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));

  // Pre-compute available time slots for this doctor (respects working hours + breaks)
  const availableSlots = getAvailableSlots(d);

  // Fetch already-booked slots for the selected date (public endpoint)
  useEffect(() => {
    const fetchBooked = async () => {
      try {
        const selectedDateStr = format(dates[dateIdx], "yyyy-MM-dd");
        const res = await fetchBookedSlots(d._id, selectedDateStr);
        setBookedTimes(new Set(res.data.bookedTimes));
      } catch {
        // Not critical — fail silently
        setBookedTimes(new Set());
      }
    };
    fetchBooked();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateIdx, d._id]);

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Veuillez vous connecter pour réserver un rendez-vous.");
      void nav({ to: "/login", search: { redirect: window.location.pathname } as any });
      return;
    }
    if (!time) {
      toast.error("Veuillez choisir un horaire.");
      return;
    }

    const selectedDate = format(dates[dateIdx], "yyyy-MM-dd");
    const displayDate = format(dates[dateIdx], "dd MMMM yyyy", { locale: fr });

    setSubmitting(true);
    try {
      await bookAppointment({
        doctorId: d._id,
        date: selectedDate,
        time: time,
        reason,
        mode: "In-clinic",
        dependentId: selectedDependentId || undefined,
      });

      toast.success("Rendez-vous réservé avec succès !", {
        description: `Avec ${d.name} le ${displayDate} à ${time}`,
      });
      nav({ to: "/patient/appointments" });
    } catch (error: any) {
      toast.error("Échec de la réservation", { description: error?.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isBookable) {
    return (
      <MarketingLayout>
        <div className="mx-auto max-w-5xl px-6 py-16">
          <Link to="/doctors" className="text-sm font-semibold text-ink-soft hover:text-ink">
            ← Retour à l'annuaire des médecins
          </Link>
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-soft">
            <p className="text-lg font-bold text-amber-800">Réservation indisponible</p>
            <p className="mt-2 text-sm text-amber-700">
              {d.status === "Congé"
                ? "Ce médecin est actuellement en congé. Les patients ne peuvent pas prendre de rendez-vous avec lui pour le moment."
                : "Ce médecin n’est actuellement pas disponible pour de nouvelles réservations."}
            </p>
          </div>
        </div>
      </MarketingLayout>
    );
  }

  return (
    <MarketingLayout>
      <div className="mx-auto max-w-5xl px-6 py-16">
        <Link
          to="/doctors/$id"
          params={{ id: d._id }}
          className="text-sm font-semibold text-ink-soft hover:text-ink"
        >
          ← Retour au profil du médecin
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="rounded-2xl border border-border bg-white/50 backdrop-blur-sm p-4 sm:p-6 md:p-8 shadow-soft">
            <Stepper step={step} />

            {step === 1 && (
              <div className="mt-8">
                {/* Dependent Selection */}
                {dependents.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-sm font-bold text-ink mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" /> Pour qui est ce rendez-vous ?
                    </h3>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {/* Self option */}
                      <button
                        onClick={() => setSelectedDependentId(null)}
                        className={`rounded-lg border-2 p-4 text-left transition cursor-pointer ${
                          selectedDependentId === null
                            ? "border-teal bg-teal/5"
                            : "border-border bg-white/40 hover:border-teal/40"
                        }`}
                      >
                        <p className="font-semibold text-sm text-ink">Moi-même</p>
                        <p className="text-xs text-ink-soft mt-1">
                          {user?.firstName} {user?.lastName}
                        </p>
                      </button>

                      {/* Dependent options */}
                      {dependents.map((dep) => (
                        <button
                          key={dep._id}
                          onClick={() => setSelectedDependentId(dep._id)}
                          className={`rounded-lg border-2 p-4 text-left transition cursor-pointer ${
                            selectedDependentId === dep._id
                              ? "border-teal bg-teal/5"
                              : "border-border bg-white/40 hover:border-teal/40"
                          }`}
                        >
                          <p className="font-semibold text-sm text-ink">
                            {dep.firstName} {dep.lastName}
                          </p>
                          <p className="text-xs text-ink-soft mt-1">{dep.relationship}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <h2 className="text-xl font-bold text-ink">Type de consultation</h2>
                <div className="mt-6">
                  <div className="rounded-2xl border-2 p-6">
                    <CalendarCheck className="h-6 w-6 text-teal" />
                    <p className="mt-4 font-bold text-ink">Consultation en clinique</p>
                    <p className="mt-1 text-xs text-ink-soft">{d.location}</p>
                  </div>
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="mt-8 cursor-pointer rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-glow hover:opacity-90 transition"
                >
                  Continuer
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-[#06122e]">Sélectionnez la date & l'heure</h2>
                <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
                  {dates.map((date, i) => {
                    const formattedDateStr = format(date, "yyyy-MM-dd");
                    const dayName = FR_DAY_NAMES[date.getDay()];
                    const isNonWorkingDay = !d.availableDays.includes(dayName);
                    const isDayBlocked =
                      d.blockedSlots?.some(
                        (s) => s.date === formattedDateStr && !s.hour,
                      ) ||
                      (d.vacationDays ?? []).includes(formattedDateStr) ||
                      isNonWorkingDay;
                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={isDayBlocked}
                        onClick={() => {
                          setDateIdx(i);
                          setTime(null);
                        }}
                        className={cn(
                          "min-w-[80px] rounded-md border p-3 text-center transition",
                          isDayBlocked
                            ? "border-red-200 bg-red-50 text-red-400 cursor-not-allowed opacity-80"
                            : dateIdx === i
                              ? "border-[#0284c7] bg-sky-50 text-[#0284c7] cursor-pointer"
                              : "border-slate-200 bg-white hover:border-[#0284c7]/40 text-slate-700 cursor-pointer",
                        )}
                        title={isNonWorkingDay ? `${d.name} ne travaille pas le ${dayName}` : isDayBlocked ? "Jour non disponible" : undefined}
                      >
                        <p className="text-[10px] uppercase font-bold tracking-wider opacity-85">
                          {format(date, "EEE", { locale: fr })}
                        </p>
                        <p className="mt-1 text-lg font-extrabold">{format(date, "d")}</p>
                        <p className="text-[10px] opacity-75 font-medium">
                          {format(date, "MMM", { locale: fr })}
                        </p>
                        {isDayBlocked && (
                          <p className="text-[8px] font-bold text-red-400 mt-0.5">Fermé</p>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {availableSlots.length === 0 ? (
                    <p className="col-span-4 text-sm text-ink-soft text-center py-6">
                      Aucun créneau disponible pour ce médecin.
                    </p>
                  ) : availableSlots.map((t) => {
                    const selectedDateStr = format(dates[dateIdx], "yyyy-MM-dd");
                    const isSlotBlocked = d.blockedSlots?.some(
                      (s) => s.date === selectedDateStr && s.hour === t,
                    );
                    const isAlreadyBooked = bookedTimes.has(t);
                    const isUnavailable = isSlotBlocked || isAlreadyBooked;
                    return (
                      <button
                        key={t}
                        type="button"
                        disabled={isUnavailable}
                        onClick={() => setTime(t)}
                        title={isAlreadyBooked ? "Créneau déjà réservé" : isSlotBlocked ? "Créneau bloqué par le médecin" : undefined}
                        className={cn(
                          "rounded-md border py-3 text-sm font-bold transition",
                          isUnavailable
                            ? "border-red-200 bg-red-50 text-red-500 cursor-not-allowed line-through opacity-70"
                            : time === t
                              ? "border-[#0284c7] bg-[#0284c7] text-white cursor-pointer"
                              : "border-slate-200 bg-white text-slate-700 hover:border-[#0284c7]/40 cursor-pointer",
                        )}
                      >
                        {t}
                        {isAlreadyBooked && <span className="block text-[8px] mt-0.5 font-semibold">Réservé</span>}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-8 flex justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="cursor-pointer rounded-xl border border-border bg-white/80 px-5 py-2.5 text-xs font-bold text-ink-soft hover:text-ink transition"
                  >
                    Retour
                  </button>
                  <button
                    disabled={!time}
                    onClick={() => setStep(3)}
                    className="cursor-pointer rounded-xl bg-primary px-6 py-3 text-xs font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition"
                  >
                    Continuer
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-ink">Validation de votre rendez-vous</h2>
                <p className="mt-1 text-sm text-ink-soft">
                  Medicare ne requiert aucun paiement en ligne pour valider la réservation. Les
                  frais de consultation sont réglés directement sur place à la clinique.
                </p>
                <form onSubmit={handleConfirmBooking} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft">
                      Motif de la consultation
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ex: Consultation de suivi, douleurs thoraciques..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-border bg-white/60 p-3.5 text-sm text-ink focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 shadow-sm"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border/60">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="cursor-pointer rounded-xl border border-border bg-white/80 px-5 py-2.5 text-xs font-bold text-ink-soft hover:text-ink transition"
                    >
                      Retour
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="cursor-pointer rounded-xl bg-teal px-6 py-3 text-xs font-bold text-white shadow-glow hover:opacity-90 transition disabled:opacity-50"
                    >
                      Confirmer la réservation
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          <aside className="h-fit rounded-2xl border border-border bg-white/50 p-6 backdrop-blur-sm shadow-soft lg:sticky lg:top-24">
            <div className="flex items-center gap-3">
              <DefaultAvatar className="h-14 w-14 border border-border shadow-soft" />
              <div>
                <p className="font-bold text-ink">{d.name}</p>
                <p className="text-xs font-semibold text-teal">{d.speciality}</p>
              </div>
            </div>
            <dl className="mt-6 space-y-3 text-sm">
              <Row label="Type de visite" value={"En clinique"} />
              <Row label="Date" value={format(dates[dateIdx], "EEEE d MMMM", { locale: fr })} />
              <Row label="Heure" value={time ?? "—"} />
              <Row label="Lieu" value={d.location} />
            </dl>
            <div className="mt-6 border-t border-border pt-4">
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 font-semibold leading-relaxed flex gap-2">
                <CreditCard className="h-4.5 w-4.5 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  Les frais de consultation sont fixés par le médecin à l'issue de chaque séance et
                  réglés directement à la réception de la clinique.
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-ink-soft font-semibold">
                <span>Frais de réservation en ligne</span>
                <span className="text-teal font-bold">Gratuit</span>
              </div>
            </div>
            <div className="mt-6 space-y-2.5 text-xs text-ink-soft/80 font-semibold">
              {[
                "Annulation gratuite jusqu'à 4h avant",
                "Réglement sur place au cabinet",
                "Confirmation instantanée",
              ].map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal shrink-0" /> {t}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </MarketingLayout>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink-soft/75 font-semibold text-xs">{label}</dt>
      <dd className="font-bold text-ink text-xs text-right">{value}</dd>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  const labels = ["Visite", "Planning", "Validation"];
  return (
    <ol className="flex items-center w-full justify-between gap-2">
      {labels.map((l, i) => {
        const n = i + 1;
        const active = step >= n;
        return (
          <div key={l} className="flex items-center flex-1 last:flex-none gap-2">
            <li className="flex items-center gap-1.5 sm:gap-2">
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                  active ? "bg-primary text-white" : "bg-slate-100 text-ink-soft"
                }`}
              >
                {n}
              </span>
              <span className={`text-xs font-bold hidden sm:inline whitespace-nowrap ${active ? "text-ink" : "text-ink-soft/70"}`}>
                {l}
              </span>
            </li>
            {i < labels.length - 1 && <span className="h-px flex-1 bg-border/60 min-w-[8px]" />}
          </div>
        );
      })}
    </ol>
  );
}
