import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-ext/primitives";
import { useAuth } from "@/lib/authStore";
import { useState } from "react";
import { Save, Building2, Globe, Shield, Bell, Database } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const { user } = useAuth();
  const [clinicName, setClinicName] = useState("UniCare Centre Médical Béjaïa");
  const [clinicAddress, setClinicAddress] = useState("Rue des Sablettes, Béjaïa 06000, Algérie");
  const [clinicPhone, setClinicPhone] = useState("+213 (0)34 12 34 56");
  const [clinicEmail, setClinicEmail] = useState("contact@unicare.dz");
  const [maxAppts, setMaxAppts] = useState("25");
  const [slotDuration, setSlotDuration] = useState("30");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [backupEnabled, setBackupEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);

  return (
    <div className="space-y-8 max-w-3xl">
      <PageHeader
        title="Paramètres Système"
        description="Configuration globale du UniCare Centre Médical Béjaïa."
        actions={
          <button
            onClick={() => toast.success("Paramètres système sauvegardés !")}
            className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-glow hover:opacity-90 transition"
          >
            <Save className="h-4 w-4" /> Sauvegarder
          </button>
        }
      />

      {/* Clinic info */}
      <Section title="Informations du Centre" icon={Building2}>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { label: "Nom du centre", val: clinicName, set: setClinicName },
            { label: "Numéro de téléphone", val: clinicPhone, set: setClinicPhone },
            { label: "Adresse complète", val: clinicAddress, set: setClinicAddress, full: true },
            { label: "Email de contact", val: clinicEmail, set: setClinicEmail },
          ].map((f) => (
            <div key={f.label} className={f.full ? "sm:col-span-2" : ""}>
              <label className="block text-xs font-bold uppercase tracking-wide text-ink-soft mb-1.5">
                {f.label}
              </label>
              <input
                value={f.val}
                onChange={(e) => f.set(e.target.value)}
                className="w-full rounded-xl border border-border bg-slate-50/50 px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:bg-white focus:outline-none shadow-sm"
              />
            </div>
          ))}
        </div>
      </Section>

      {/* Booking */}
      <Section title="Paramètres de Réservation" icon={Globe}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-ink-soft mb-1.5">
              Max rendez-vous / jour / médecin
            </label>
            <input
              type="number"
              value={maxAppts}
              onChange={(e) => setMaxAppts(e.target.value)}
              className="w-full rounded-xl border border-border bg-slate-50/50 px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:bg-white focus:outline-none shadow-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-ink-soft mb-1.5">
              Durée d'un créneau (minutes)
            </label>
            <select
              value={slotDuration}
              onChange={(e) => setSlotDuration(e.target.value)}
              className="w-full rounded-xl border border-border bg-slate-50/50 px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:bg-white focus:outline-none shadow-sm"
            >
              {["15", "20", "30", "45", "60"].map((v) => (
                <option key={v} value={v}>
                  {v} minutes
                </option>
              ))}
            </select>
          </div>
        </div>
      </Section>

      {/* Notifications */}
      <Section title="Notifications" icon={Bell}>
        {[
          {
            label: "Notifications par SMS",
            desc: "Rappels et confirmations par SMS aux patients",
            val: smsEnabled,
            set: setSmsEnabled,
          },
          {
            label: "Notifications par Email",
            desc: "Confirmation de rendez-vous par e-mail",
            val: emailEnabled,
            set: setEmailEnabled,
          },
          {
            label: "Sauvegarde automatique",
            desc: "Sauvegarder les données toutes les 24h sur le cloud",
            val: backupEnabled,
            set: setBackupEnabled,
          },
        ].map((n) => (
          <div
            key={n.label}
            className="flex items-center justify-between rounded-xl border border-border/50 bg-white/40 px-4 py-3.5 shadow-sm"
          >
            <div>
              <p className="text-sm font-semibold text-ink">{n.label}</p>
              <p className="text-xs text-ink-soft/70 mt-0.5">{n.desc}</p>
            </div>
            <button
              onClick={() => n.set(!n.val)}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors duration-200 cursor-pointer",
                n.val ? "bg-teal" : "bg-slate-200",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
                  n.val ? "translate-x-5" : "translate-x-0.5",
                )}
              />
            </button>
          </div>
        ))}
      </Section>

      {/* Danger */}
      <Section title="Zone Sensible" icon={Shield} danger>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3.5">
            <div>
              <p className="text-sm font-semibold text-amber-800">Mode maintenance</p>
              <p className="text-xs text-amber-700/70 mt-0.5">
                Rend le système inaccessible aux patients pendant la maintenance
              </p>
            </div>
            <button
              onClick={() => {
                setMaintenanceMode(!maintenanceMode);
                toast.warning(
                  maintenanceMode ? "Mode maintenance désactivé" : "Mode maintenance activé",
                );
              }}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors duration-200 cursor-pointer",
                maintenanceMode ? "bg-amber-500" : "bg-slate-200",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
                  maintenanceMode ? "translate-x-5" : "translate-x-0.5",
                )}
              />
            </button>
          </div>
          <button
            onClick={() => toast.error("Action irréversible — contactez le support technique.")}
            className="rounded-xl border border-red-200 bg-red-50/50 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition cursor-pointer"
          >
            Réinitialiser toutes les données (DANGER)
          </button>
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
  danger = false,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-6 backdrop-blur-sm shadow-soft space-y-4",
        danger ? "border-red-200 bg-red-50/30" : "border-border bg-white/50",
      )}
    >
      <h3
        className={cn(
          "text-sm font-bold flex items-center gap-2",
          danger ? "text-red-700" : "text-ink",
        )}
      >
        <Icon className="h-4 w-4 text-ink-soft" />
        {title}
      </h3>
      {children}
    </div>
  );
}
