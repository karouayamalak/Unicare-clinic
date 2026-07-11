import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, DefaultAvatar } from "@/components/ui-ext/primitives";
import { useAuth, authStore } from "@/lib/authStore";
import { updateProfile } from "@/lib/api";
import { useState } from "react";
import { Save, User, Mail, Phone, MapPin, Calendar, Droplets, Camera } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/doctor/settings")({
  component: DoctorSettings,
});

function DoctorSettings() {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [email] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("+213 (0)34 12 34 56");
  const [bio, setBio] = useState(
    "Médecin spécialiste au Centre Hospitalier Universitaire de Béjaïa depuis 2019. Spécialisé en cardiologie interventionnelle et maladies vasculaires.",
  );
  const [clinicName, setClinicName] = useState("CHU de Béjaïa — Espace Médical Gouraya");
  const [image, setImage] = useState(user?.image ?? "");
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSms, setNotifSms] = useState(true);
  const [notifAppt, setNotifAppt] = useState(true);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("L'image est trop volumineuse (max 2 Mo)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      const res = await updateProfile({ firstName, lastName, image });
      authStore.login(res.data.user);
      toast.success("Profil mis à jour avec succès !");
    } catch {
      toast.error("Erreur lors de la mise à jour.");
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <PageHeader
        title="Paramètres"
        description="Gérez votre profil professionnel et vos préférences de notification."
        actions={
          <button
            onClick={handleSave}
            className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-glow hover:opacity-90 transition"
          >
            <Save className="h-4 w-4" /> Enregistrer
          </button>
        }
      />

      {/* Profile */}
      <div className="rounded-2xl border border-border bg-white/50 p-6 backdrop-blur-sm shadow-soft space-y-5">
        <h3 className="text-sm font-bold text-ink">Informations professionnelles</h3>

        {/* Profile Picture Uploader */}
        <div className="flex items-center gap-5 border-b border-border/50 pb-5">
          <div className="relative group">
            {image ? (
              <img
                src={image}
                alt="Profile"
                className="h-20 w-20 rounded-full object-cover border border-border"
              />
            ) : (
              <DefaultAvatar className="h-20 w-20 border border-border" />
            )}
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer">
              <Camera className="h-5 w-5" />
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </div>
          <div>
            <h4 className="text-sm font-bold text-ink">Photo de profil</h4>
            <p className="text-xs text-ink-soft mt-1">
              Cliquez sur l'avatar pour téléverser votre photo de profil. Elle s'affichera également
              sur l'annuaire des médecins de la clinique.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prénom" icon={User} value={firstName} onChange={setFirstName} />
          <Field label="Nom de famille" icon={User} value={lastName} onChange={setLastName} />
          <Field
            label="Email professionnel"
            icon={Mail}
            value={email}
            onChange={() => {}}
            disabled
          />
          <Field label="Téléphone du cabinet" icon={Phone} value={phone} onChange={setPhone} />
          <div className="sm:col-span-2">
            <Field
              label="Cabinet / Établissement"
              icon={MapPin}
              value={clinicName}
              onChange={setClinicName}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-ink-soft mb-1.5">
            Biographie professionnelle
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-border bg-slate-50/50 p-3 text-sm text-ink focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 shadow-sm resize-none"
          />
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-2xl border border-border bg-white/50 p-6 backdrop-blur-sm shadow-soft space-y-4">
        <h3 className="text-sm font-bold text-ink">Préférences de notification</h3>
        {[
          {
            label: "Notifications par e-mail",
            desc: "Recevoir les confirmations de RDV par e-mail",
            val: notifEmail,
            set: setNotifEmail,
          },
          {
            label: "Notifications SMS",
            desc: "Recevoir des rappels de RDV par SMS",
            val: notifSms,
            set: setNotifSms,
          },
          {
            label: "Alertes de nouveaux rendez-vous",
            desc: "Être alerté lorsqu'un patient réserve une consultation",
            val: notifAppt,
            set: setNotifAppt,
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
                "relative h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none cursor-pointer",
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
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6 space-y-3">
        <h3 className="text-sm font-bold text-red-700">Zone sensible</h3>
        <p className="text-xs text-red-600/80">
          Ces actions sont irréversibles. Procédez avec précaution.
        </p>
        <button className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition cursor-pointer">
          Désactiver temporairement mon compte
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wide text-ink-soft mb-1.5">
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/60" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={cn(
            "w-full rounded-xl border border-border bg-slate-50/50 pl-10 pr-3 py-2.5 text-sm text-ink focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 shadow-sm",
            disabled && "opacity-60 cursor-not-allowed bg-slate-100",
          )}
        />
      </div>
    </div>
  );
}
