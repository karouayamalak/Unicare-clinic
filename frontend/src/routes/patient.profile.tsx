import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-ext/primitives";
import { useAuth } from "@/lib/authStore";
import { useState } from "react";
import { Save, Edit3, Calendar, Droplets, Ruler, Weight, Camera } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/patient/profile")({
  component: PatientProfile,
});

function PatientProfile() {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [dob, setDob] = useState("1992-06-15");
  const [blood, setBlood] = useState("A+");
  const [height, setHeight] = useState("168");
  const [weight, setWeight] = useState("62");
  const [gender, setGender] = useState("Féminin");

  const fullName = user ? `${user.firstName} ${user.lastName}` : "Amina Bouzid";
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : "AB";

  const [profilePic, setProfilePic] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`medigen_profile_pic_${fullName}`) || null;
    }
    return null;
  });

  const handlePicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      localStorage.setItem(`medigen_profile_pic_${fullName}`, dataUrl);
      setProfilePic(dataUrl);
      toast.success("Photo de profil mise à jour !");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    setEditing(false);
    toast.success("Profil mis à jour !");
  };

  const age = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Mon Profil"
        description="Informations médicales de base liées à votre dossier de santé."
        actions={
          editing ? (
            <button
              onClick={handleSave}
              className="cursor-pointer inline-flex items-center gap-1.5 rounded bg-[#06122e] px-4 py-2 text-xs font-bold text-white shadow hover:opacity-90 transition"
            >
              <Save className="h-4 w-4" /> Enregistrer
            </button>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="cursor-pointer inline-flex items-center gap-1.5 rounded border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
            >
              <Edit3 className="h-4 w-4" /> Modifier
            </button>
          )
        }
      />

      {/* Avatar + Name with Photo Upload */}
      <div className="flex items-center gap-5 rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <div className="relative group shrink-0">
          {profilePic ? (
            <img
              src={profilePic}
              alt="Photo de profil"
              className="h-20 w-20 rounded object-cover border border-slate-200 shadow-sm"
            />
          ) : (
            <div className="grid h-20 w-20 place-items-center rounded bg-[#06122e] text-white text-2xl font-bold shadow-sm">
              {initials}
            </div>
          )}
          <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition cursor-pointer">
            <Camera className="h-4 w-4 mb-0.5" />
            Modifier
            <input type="file" accept="image/*" onChange={handlePicUpload} className="hidden" />
          </label>
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#06122e]">{fullName}</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">{user?.email}</p>
          <span className="mt-2 inline-block rounded bg-sky-50 border border-sky-100 px-2.5 py-0.5 text-2xs font-bold text-[#0284c7] uppercase">
            Patient enregistré
          </span>
        </div>
      </div>

      {/* Medical info */}
      <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-[#06122e] uppercase tracking-wider">
          Informations médicales
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              label: "Date de naissance",
              icon: Calendar,
              value: dob,
              onChange: setDob,
              type: "date",
            },
            {
              label: "Groupe sanguin",
              icon: Droplets,
              value: blood,
              onChange: setBlood,
              type: "select",
              opts: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
            },
            { label: "Taille (cm)", icon: Ruler, value: height, onChange: setHeight },
            { label: "Poids (kg)", icon: Weight, value: weight, onChange: setWeight },
          ].map((f) => (
            <div key={f.label}>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                {f.label}
              </label>
              <div className="relative">
                {f.type === "select" ? (
                  <select
                    value={f.value}
                    onChange={(e) => f.onChange(e.target.value)}
                    disabled={!editing}
                    className={cn(
                      "w-full rounded border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 focus:border-slate-300 focus:outline-none shadow-2xs",
                      !editing && "opacity-70 cursor-not-allowed bg-slate-100",
                    )}
                  >
                    {f.opts?.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={f.type ?? "text"}
                    value={f.value}
                    onChange={(e) => f.onChange(e.target.value)}
                    disabled={!editing}
                    className={cn(
                      "w-full rounded border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 focus:border-slate-300 focus:outline-none shadow-2xs",
                      !editing && "opacity-70 cursor-not-allowed bg-slate-100",
                    )}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Computed vitals */}
        <div className="mt-2 grid grid-cols-3 gap-3 border-t border-slate-100 pt-5">
          {[
            { label: "Âge", value: `${age} ans` },
            { label: "Sexe", value: gender },
            {
              label: "IMC (Corpulence)",
              value:
                height && weight ? (Number(weight) / (Number(height) / 100) ** 2).toFixed(1) : "—",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded border border-slate-100 bg-slate-50/30 p-3 text-center"
            >
              <p className="text-sm font-bold text-[#06122e]">{item.value}</p>
              <p className="text-[9px] text-slate-400 mt-0.5 font-bold uppercase">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
