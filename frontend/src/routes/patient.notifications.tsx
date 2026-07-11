import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-ext/primitives";
import { fetchAppointments, type ApiAppointment } from "@/lib/api";
import { Bell, CalendarCheck, CheckCircle2, Clock, AlertTriangle, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/patient/notifications")({
  component: PatientNotifications,
});

interface Notification {
  id: string;
  icon: typeof Bell;
  iconCls: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

function relativeTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const diffMs = Date.now() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  return d.toLocaleDateString("fr-DZ");
}

function buildNotifications(appointments: ApiAppointment[]): Notification[] {
  const notes: Notification[] = [];

  appointments.slice(0, 10).forEach((a) => {
    if (a.status === "Confirmé") {
      notes.push({
        id: `confirmed-${a._id}`,
        icon: CalendarCheck,
        iconCls: "bg-teal/10 text-teal",
        title: "Rendez-vous confirmé",
        body: `${a.doctorName} · ${a.date} à ${a.time}`,
        time: relativeTime(a.createdAt),
        read: false,
      });
    } else if (a.status === "Terminé" && a.prescription) {
      notes.push({
        id: `rx-${a._id}`,
        icon: CheckCircle2,
        iconCls: "bg-emerald-50 text-emerald-600",
        title: "Ordonnance disponible",
        body: `${a.prescription.drug} ${a.prescription.dose} · Prescrit par ${a.doctorName}`,
        time: relativeTime(a.date),
        read: false,
      });
    } else if (a.status === "Terminé") {
      notes.push({
        id: `done-${a._id}`,
        icon: CheckCircle2,
        iconCls: "bg-slate-100 text-slate-500",
        title: "Consultation terminée",
        body: `Consultation avec ${a.doctorName} le ${a.date}`,
        time: relativeTime(a.date),
        read: true,
      });
    } else if (a.status === "Annulé") {
      notes.push({
        id: `cancel-${a._id}`,
        icon: AlertTriangle,
        iconCls: "bg-red-50 text-red-500",
        title: "Rendez-vous annulé",
        body: `Rendez-vous avec ${a.doctorName} le ${a.date} a été annulé.`,
        time: relativeTime(a.date),
        read: true,
      });
    } else if (a.status === "En attente") {
      notes.push({
        id: `waiting-${a._id}`,
        icon: Clock,
        iconCls: "bg-amber-50 text-amber-600",
        title: "Vous êtes en salle d'attente",
        body: `Rendez-vous avec ${a.doctorName} — arrivée enregistrée.`,
        time: relativeTime(a.date),
        read: false,
      });
    }
  });

  return notes;
}

function PatientNotifications() {
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchAppointments();
      setAppointments(res.data.appointments);
    } catch {
      toast.error("Impossible de charger les notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const notifications = buildNotifications(appointments);
  const unreadCount = notifications.filter((n) => !readIds.has(n.id) && !n.read).length;

  const markAllRead = () => {
    setReadIds(new Set(notifications.map((n) => n.id)));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Mises à jour de vos rendez-vous et prescriptions."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="cursor-pointer rounded-xl border border-border bg-white p-2.5 hover:bg-slate-50 transition shadow-sm"
            >
              <RefreshCw className={`h-4 w-4 text-ink-soft ${loading ? "animate-spin" : ""}`} />
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="cursor-pointer rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink-soft hover:bg-slate-50 transition shadow-sm"
              >
                Tout marquer comme lu ({unreadCount})
              </button>
            )}
          </div>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Chargement…
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <Bell className="h-12 w-12 opacity-20" />
          <p className="text-sm font-medium">Aucune notification pour le moment.</p>
          <p className="text-xs">Les notifications apparaîtront dès votre premier rendez-vous.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-white shadow-soft overflow-hidden">
          <ul className="divide-y divide-border">
            {notifications.map((n) => {
              const isRead = readIds.has(n.id) || n.read;
              const Icon = n.icon;
              return (
                <li
                  key={n.id}
                  onClick={() => setReadIds((prev) => new Set([...prev, n.id]))}
                  className={`flex items-start gap-4 p-5 cursor-pointer transition ${
                    isRead ? "opacity-60" : "hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${n.iconCls}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-ink">{n.title}</p>
                      {!isRead && <span className="h-2 w-2 rounded-full bg-teal shrink-0" />}
                    </div>
                    <p className="mt-0.5 text-sm text-ink-soft truncate">{n.body}</p>
                  </div>
                  <span className="text-xs text-ink-soft shrink-0 whitespace-nowrap">{n.time}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
