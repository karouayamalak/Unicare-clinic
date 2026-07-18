import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-ext/primitives";
import { ChevronLeft, ChevronRight, Plus, Trash2, Clock, CalendarDays, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  fetchAppointments,
  fetchDoctors,
  addBlockedSlot as apiAddBlockedSlot,
  removeBlockedSlot as apiRemoveBlockedSlot,
  bookAppointment,
  fetchDependentsByParent,
  type ApiAppointment,
  type ApiDoctor,
  type ApiDependent,
} from "@/lib/api";
import { useAuth } from "@/lib/authStore";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const Route = createFileRoute("/doctor/schedule")({
  component: DoctorSchedule,
});

const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];
const HOURS = [
  "00:00", "00:30",
  "01:00", "01:30",
  "02:00", "02:30",
  "03:00", "03:30",
  "04:00", "04:30",
  "05:00", "05:30",
  "06:00", "06:30",
  "07:00", "07:30",
  "08:00", "08:30",
  "09:00", "09:30",
  "10:00", "10:30",
  "11:00", "11:30",
  "12:00", "12:30",
  "13:00", "13:30",
  "14:00", "14:30",
  "15:00", "15:30",
  "16:00", "16:30",
  "17:00", "17:30",
  "18:00", "18:30",
  "19:00", "19:30",
  "20:00", "20:30",
  "21:00", "21:30",
  "22:00", "22:30",
  "23:00", "23:30",
];

function getWeekDates(baseDate: Date) {
  const date = new Date(baseDate);
  date.setHours(12, 0, 0, 0); // Avoid timezone shifts across midnight
  const day = date.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // go to Monday
  date.setDate(date.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(date);
    d.setDate(d.getDate() + i);
    return d;
  });
}

// Tone mapping per appointment mode/speciality
function getEventTone(mode: string, speciality: string) {
  if (mode === "Video") return "bg-sky-100 text-sky-700 border border-sky-200";
  if (speciality.includes("Cardio")) return "bg-rose-100 text-rose-700 border border-rose-200";
  if (speciality.includes("Neuro")) return "bg-violet-100 text-violet-700 border border-violet-200";
  if (speciality.includes("Péd"))
    return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  return "bg-teal/10 text-teal border border-teal/20";
}

function DoctorSchedule() {
  const { user } = useAuth();
  const doctorName = user ? `Dr. ${user.firstName} ${user.lastName}` : "Dr. Sarah Chen";

  const [baseDate, setBaseDate] = useState(new Date());
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<
    Array<{ _id: string; date: string; hour?: string }>
  >([]);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [doctorProfileId, setDoctorProfileId] = useState<string>("");

  // Modal states for blocking slots
  const [blockDate, setBlockDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [blockType, setBlockType] = useState<"day" | "hour">("hour");
  const [blockHour, setBlockHour] = useState("09:00");

  // Patient booking modal states
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookPatientEmail, setBookPatientEmail] = useState("");
  const [bookPatientChildren, setBookPatientChildren] = useState<ApiDependent[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [bookDate, setBookDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [bookTime, setBookTime] = useState("09:00");
  const [bookReason, setBookReason] = useState("");
  const [bookMode, setBookMode] = useState("Cabinet");
  const [bookingLoading, setBookingLoading] = useState(false);

  const weekDates = getWeekDates(baseDate);

  // Load all info from backend
  const load = async () => {
    try {
      // 1. Fetch ALL appointments (backend filters by doctorId for Doctor role)
      const apptsRes = await fetchAppointments();
      setAppointments(apptsRes.data.appointments);

      // 2. Fetch doctor profile to get blockedSlots and doctorId
      if (user?.email) {
        const docRes = await fetchDoctors();
        const profile = docRes.data.doctors.find(
          (d) => d.email.trim().toLowerCase() === user.email.trim().toLowerCase(),
        );
        if (profile) {
          setBlockedSlots(profile.blockedSlots || []);
          setDoctorProfileId(profile._id);
        }
      }
    } catch {
      toast.error("Impossible de charger les données de l'agenda.");
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  // Reload when navigating to a different week
  useEffect(() => {
    if (user) load();
  }, [baseDate]);

  // Map appointments to grid: key = "dayIndex-hourIndex"
  const eventMap: Record<string, ApiAppointment> = {};
  appointments.forEach((appt) => {
    // Find column index (0 to 6) by matching week dates (yyyy-MM-dd)
    const colIdx = weekDates.findIndex((wDate) => {
      const wDateFormatted = format(wDate, "yyyy-MM-dd");
      return appt.date === wDateFormatted;
    });

    // Find hour index (0 to 18) by exact matching the appointment time
    const hourIdx = HOURS.findIndex((hr) => hr === appt.time);

    if (colIdx >= 0 && hourIdx >= 0) {
      eventMap[`${colIdx}-${hourIdx}`] = appt;
    }
  });

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockDate) {
      toast.error("Veuillez sélectionner une date.");
      return;
    }

    const hr = blockType === "day" ? undefined : blockHour;
    try {
      await apiAddBlockedSlot({ date: blockDate, hour: hr });
      toast.success("Plage horaire bloquée avec succès !");
      load();
      setShowBlockModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erreur lors du blocage.");
    }
  };

  const handleRemoveBlock = async (id: string) => {
    try {
      await apiRemoveBlockedSlot(id);
      toast.success("Horaire débloqué avec succès !");
      load();
    } catch {
      toast.error("Impossible de débloquer l'horaire.");
    }
  };

  const handleEmailBlur = async () => {
    if (!bookPatientEmail || !bookPatientEmail.includes("@")) return;
    try {
      const res = await fetchDependentsByParent(bookPatientEmail);
      setBookPatientChildren(res.data.dependents || []);
    } catch {
      setBookPatientChildren([]);
    }
  };

  const handleBookPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookPatientEmail || !bookDate || !bookTime) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setBookingLoading(true);
    try {
      await bookAppointment({
        doctorId: doctorProfileId,
        patientEmail: bookPatientEmail,
        date: bookDate,
        time: bookTime,
        reason: bookReason || "Consultation",
        mode: "In-clinic",
        dependentId: selectedChildId || undefined,
      });
      toast.success("Rendez-vous enregistré et confirmation envoyée au patient !");
      setShowBookModal(false);
      setBookPatientEmail("");
      setBookPatientChildren([]);
      setSelectedChildId("");
      setBookReason("");
      // Navigate to the booked week FIRST, then reload — so weekDates and appointments update together
      setBaseDate(new Date(bookDate + "T12:00:00"));
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erreur lors de la prise de rendez-vous.");
    } finally {
      setBookingLoading(false);
    }
  };

  const prevWeek = () => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - 7);
    setBaseDate(d);
  };

  const nextWeek = () => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + 7);
    setBaseDate(d);
  };

  const monthLabel = `${MONTHS_FR[weekDates[0].getMonth()]} ${weekDates[0].getFullYear()}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda"
        description={`Semaine du ${weekDates[0].getDate()} au ${weekDates[6].getDate()} ${MONTHS_FR[weekDates[6].getMonth()]}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={prevWeek}
              className="grid h-9 w-9 place-items-center rounded-md border border-slate-200 bg-white hover:bg-slate-50 transition cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="h-4 w-4 text-slate-500" />
            </button>
            <span className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-[#06122e] shadow-2xs min-w-[120px] text-center">
              {monthLabel}
            </span>
            <button
              onClick={nextWeek}
              className="grid h-9 w-9 place-items-center rounded-md border border-slate-200 bg-white hover:bg-slate-50 transition cursor-pointer shadow-2xs"
            >
              <ChevronRight className="h-4 w-4 text-slate-500" />
            </button>
            <button
              onClick={() => setBaseDate(new Date())}
              className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => setShowBlockModal(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#06122e] px-4 py-2 text-xs font-bold text-white shadow hover:opacity-90 transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Bloquer horaire
            </button>
            <button
              onClick={() => setShowBookModal(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-teal px-4 py-2 text-xs font-bold text-white shadow hover:opacity-90 transition cursor-pointer"
            >
              <CalendarDays className="h-3.5 w-3.5" /> Prendre RDV Patient
            </button>
          </div>
        }
      />

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow">
        {/* Header row */}
        <div
          className={`grid border-b border-slate-200 bg-slate-50`}
          style={{ gridTemplateColumns: "72px repeat(7, 1fr)" }}
        >
          <div className="p-3" />
          {weekDates.map((d, i) => {
            const isToday = d.toDateString() === new Date().toDateString();
            return (
              <div
                key={i}
                className={cn(
                  "p-3 text-center border-l border-slate-200 first:border-0",
                  isToday && "bg-sky-50/40",
                )}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {DAYS_FR[i]}
                </p>
                <p
                  className={cn(
                    "mt-0.5 text-base font-extrabold",
                    isToday ? "text-[#0284c7]" : "text-[#06122e]",
                  )}
                >
                  {d.getDate()}
                </p>
              </div>
            );
          })}
        </div>

        {/* Hour rows */}
        {HOURS.map((hour, hi) => (
          <div
            key={hour}
            className="grid border-b border-slate-100 last:border-0"
            style={{ gridTemplateColumns: "72px repeat(7, 1fr)" }}
          >
            <div className="flex items-start justify-end px-3 pt-2 text-[10px] font-bold text-slate-400">
              {hour}
            </div>
            {weekDates.map((d, di) => {
              const ev = eventMap[`${di}-${hi}`];
              const isToday = d.toDateString() === new Date().toDateString();

              // Check if slot is blocked
              const formattedDateStr = format(d, "yyyy-MM-dd");
              const block = blockedSlots.find(
                (s) =>
                  s.date === formattedDateStr && (!s.hour || s.hour === hour),
              );

              return (
                <div
                  key={di}
                  className={cn(
                    "min-h-[68px] border-l border-slate-100 p-1.5 flex flex-col justify-center",
                    isToday && "bg-slate-50/20",
                  )}
                >
                  {block ? (
                    <div className="group relative rounded border border-slate-200 bg-slate-100/80 px-2 py-1.5 text-center text-[10px] font-bold text-slate-500 shadow-2xs flex flex-col items-center justify-center min-h-[50px] transition">
                      <span className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider">
                        Bloqué
                      </span>
                      <span className="text-[8px] text-slate-400 font-medium mt-0.5">
                        {block.hour ? block.hour : "Journée"}
                      </span>
                      <button
                        onClick={() => handleRemoveBlock(block._id!)}
                        className="absolute -top-1.5 -right-1.5 opacity-0 group-hover:opacity-100 transition rounded-full bg-white border border-slate-200 p-1 text-slate-400 hover:text-red-500 hover:border-red-200 shadow-sm cursor-pointer z-10"
                        title="Débloquer"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ) : ev ? (
                    <div
                      className={cn(
                        "rounded border px-2 py-1.5 text-xs font-semibold shadow-2xs transition",
                        getEventTone(ev.mode, ev.speciality),
                      )}
                    >
                      <p className="truncate font-bold text-slate-900">{ev.patientName}</p>
                      <p className="truncate text-[9px] opacity-75">{ev.speciality}</p>
                      <p className="text-[8px] mt-0.5 font-bold text-slate-600 bg-slate-50 border border-slate-100 rounded px-1 py-0.5 inline-block">
                        Cabinet
                      </p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bloquer Horaire Modal Overlay */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-md border border-slate-200 bg-white p-6 shadow-elevated">
            <button
              onClick={() => setShowBlockModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-bold text-[#06122e] mb-4">Bloquer des plages horaires</h3>

            <form onSubmit={handleAddBlock} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                  Date *
                </label>
                <input
                  type="date"
                  value={blockDate}
                  onChange={(e) => setBlockDate(e.target.value)}
                  required
                  className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-slate-300 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                  Type de blocage *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBlockType("hour")}
                    className={cn(
                      "rounded border py-2 text-xs font-bold transition cursor-pointer",
                      blockType === "hour"
                        ? "border-[#0284c7] bg-sky-50 text-[#0284c7]"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                    )}
                  >
                    Créneau horaire
                  </button>
                  <button
                    type="button"
                    onClick={() => setBlockType("day")}
                    className={cn(
                      "rounded border py-2 text-xs font-bold transition cursor-pointer",
                      blockType === "day"
                        ? "border-[#0284c7] bg-sky-50 text-[#0284c7]"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                    )}
                  >
                    Toute la journée
                  </button>
                </div>
              </div>

              {blockType === "hour" && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                    Heure *
                  </label>
                  <select
                    value={blockHour}
                    onChange={(e) => setBlockHour(e.target.value)}
                    className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-slate-300 focus:outline-none bg-white"
                  >
                    {HOURS.map((hr) => (
                      <option key={hr} value={hr}>
                        {hr}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBlockModal(false)}
                  className="rounded border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded bg-[#06122e] px-5 py-2 text-xs font-bold text-white hover:opacity-90 transition cursor-pointer shadow"
                >
                  Bloquer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Patient Booking Modal ── */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-border shadow-elevated p-6">
            <div className="flex items-center justify-between mb-5 border-b border-border pb-4">
              <div>
                <h3 className="text-base font-bold text-ink">Prendre un Rendez-vous Patient</h3>
                <p className="text-xs text-ink-soft mt-0.5">
                  Le patient recevra une confirmation par email
                </p>
              </div>
              <button
                onClick={() => setShowBookModal(false)}
                className="rounded-lg p-1 text-ink-soft hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleBookPatient} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-ink-soft mb-1.5">
                  Email du patient *
                </label>
                <input
                  type="email"
                  required
                  value={bookPatientEmail}
                  onChange={(e) => setBookPatientEmail(e.target.value)}
                  onBlur={handleEmailBlur}
                  placeholder="patient@email.com"
                  className="w-full rounded-xl border border-border bg-slate-50/50 px-3 py-2.5 text-sm focus:border-teal focus:outline-none"
                />
              </div>
              {bookPatientChildren.length > 0 && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-ink-soft mb-1.5">
                    Rendez-vous pour l'enfant (Dépendant)
                  </label>
                  <select
                    value={selectedChildId}
                    onChange={(e) => setSelectedChildId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-slate-50/50 px-3 py-2.5 text-sm focus:border-teal focus:outline-none"
                  >
                    <option value="">Le parent lui-même</option>
                    {bookPatientChildren.map((child) => (
                      <option key={child._id} value={child._id}>
                        {child.firstName} {child.lastName} ({child.relationship})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-ink-soft mb-1.5">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                    className="w-full rounded-xl border border-border bg-slate-50/50 px-3 py-2.5 text-sm focus:border-teal focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-ink-soft mb-1.5">
                    Heure *
                  </label>
                  <select
                    value={bookTime}
                    onChange={(e) => setBookTime(e.target.value)}
                    className="w-full rounded-xl border border-border bg-slate-50/50 px-3 py-2.5 text-sm focus:border-teal focus:outline-none"
                  >
                    {HOURS.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-ink-soft mb-1.5">
                  Mode de consultation
                </label>
                <select
                  value={bookMode}
                  onChange={(e) => setBookMode(e.target.value)}
                  className="w-full rounded-xl border border-border bg-slate-50/50 px-3 py-2.5 text-sm focus:border-teal focus:outline-none"
                >
                  <option value="Cabinet">Cabinet</option>
                  <option value="Domicile">Domicile</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-ink-soft mb-1.5">
                  Motif / Raison
                </label>
                <input
                  value={bookReason}
                  onChange={(e) => setBookReason(e.target.value)}
                  placeholder="ex: Chirurgie, Suivi post-opératoire..."
                  className="w-full rounded-xl border border-border bg-slate-50/50 px-3 py-2.5 text-sm focus:border-teal focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="rounded-xl bg-teal px-5 py-2 text-xs font-bold text-white hover:opacity-90 transition cursor-pointer shadow disabled:opacity-60"
                >
                  {bookingLoading ? "Enregistrement..." : "Confirmer le RDV"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
