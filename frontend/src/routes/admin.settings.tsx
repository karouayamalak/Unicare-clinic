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
  
  const [clinicName, setClinicName] = useState(() => 
    localStorage.getItem("unicare:clinic_name") || "UniCare Centre Médical Béjaïa"
  );
  const [clinicAddress, setClinicAddress] = useState(() => 
    localStorage.getItem("unicare:clinic_address") || "Rue des Sablettes, Béjaïa 06000, Algérie"
  );
  const [clinicPhone, setClinicPhone] = useState(() => 
    localStorage.getItem("unicare:clinic_phone") || "+213 (0)34 12 34 56"
  );
  const [clinicEmail, setClinicEmail] = useState(() => 
    localStorage.getItem("unicare:clinic_email") || "contact@unicare.dz"
  );
  
  const [maxAppts, setMaxAppts] = useState("25");
  const [slotDuration, setSlotDuration] = useState("30");

  const handleSave = () => {
    localStorage.setItem("unicare:clinic_name", clinicName);
    localStorage.setItem("unicare:clinic_address", clinicAddress);
    localStorage.setItem("unicare:clinic_phone", clinicPhone);
    localStorage.setItem("unicare:clinic_email", clinicEmail);
    // Dispatch event so any open pages/tabs update their clinic info
    window.dispatchEvent(new Event("unicare:clinic_settings_changed"));
    toast.success("Paramètres système sauvegardés !");
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <PageHeader
        title="Paramètres Système"
        description="Configuration globale du UniCare Centre Médical Béjaïa."
        actions={
          <button
            onClick={handleSave}
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
