import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, DefaultAvatar } from "@/components/ui-ext/primitives";
import { useAuth, authStore } from "@/lib/authStore";
import {
  updateProfile,
  fetchDependents,
  createDependent,
  updateDependent,
  deleteDependent,
  ApiDependent,
} from "@/lib/api";
import { useState, useEffect } from "react";
import {
  Save,
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Plus,
  Trash2,
  Edit2,
  Users,
  Loader,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/patient/settings")({
  component: PatientSettings,
});

function PatientSettings() {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [email] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("+213 (0)550 12 34 56");
  const [address, setAddress] = useState("Béjaïa, Algérie");
  const [image, setImage] = useState(user?.image ?? "");


  // Dependents management
  const [dependents, setDependents] = useState<ApiDependent[]>([]);
  const [loadingDependents, setLoadingDependents] = useState(false);
  const [showDependentModal, setShowDependentModal] = useState(false);
  const [editingDependent, setEditingDependent] = useState<ApiDependent | null>(null);
  const [dependentForm, setDependentForm] = useState<Partial<ApiDependent>>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "M",
    relationship: "Enfant",
    bloodType: "",
    allergies: "",
    chronicConditions: "",
    weight: 0,
    height: 0,
  });

  // Fetch dependents on mount
  useEffect(() => {
    const loadDependents = async () => {
      try {
        setLoadingDependents(true);
        const res = await fetchDependents();
        const fetchedDependents =
          (res as any).data?.dependents ?? (res as any).data?.data?.dependents ?? [];
        setDependents(fetchedDependents);
      } catch (error) {
        toast.error("Erreur lors du chargement des dépendants.");
      } finally {
        setLoadingDependents(false);
      }
    };
    loadDependents();
  }, []);

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
      toast.success("Paramètres enregistrés avec succès !");
    } catch {
      toast.error("Erreur lors de l'enregistrement.");
    }
  };

  const handleOpenDependentModal = (dependent?: ApiDependent) => {
    if (dependent) {
      setEditingDependent(dependent);
      setDependentForm({
        firstName: dependent.firstName,
        lastName: dependent.lastName,
        dateOfBirth: dependent.dateOfBirth,
        gender: dependent.gender,
        relationship: dependent.relationship,
        bloodType: dependent.bloodType || "",
        allergies: dependent.allergies || "",
        chronicConditions: dependent.chronicConditions || "",
        weight: dependent.weight || 0,
        height: dependent.height || 0,
      });
    } else {
      setEditingDependent(null);
      setDependentForm({
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "M",
        relationship: "Enfant",
        bloodType: "",
        allergies: "",
        chronicConditions: "",
        weight: 0,
        height: 0,
      });
    }
    setShowDependentModal(true);
  };

  const handleSaveDependent = async () => {
    if (!dependentForm.firstName || !dependentForm.lastName) {
      toast.error("Veuillez remplir le prénom et le nom du dépendant.");
      return;
    }

    if (dependentForm.dateOfBirth) {
      const birthDate = new Date(dependentForm.dateOfBirth);
      const age = Math.floor(
        (new Date().getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
      );
      if (age >= 18) {
        toast.error("Les dépendants doivent être âgés de moins de 18 ans.");
        return;
      }
    }

    try {
      if (editingDependent) {
        await updateDependent(editingDependent._id, dependentForm);
        setDependents(
          dependents.map((d) => (d._id === editingDependent._id ? { ...d, ...dependentForm } : d)),
        );
        toast.success("Dépendant mis à jour avec succès !");
      } else {
        const res = await createDependent(dependentForm as any);
        const createdDependent = (res as any).data?.dependent ?? (res as any).data?.data?.dependent;
        if (createdDependent) {
          setDependents((prev) => [...prev, createdDependent]);
        } else {
          const refreshed = await fetchDependents();
          const fetchedDependents =
            (refreshed as any).data?.dependents ?? (refreshed as any).data?.data?.dependents ?? [];
          setDependents(fetchedDependents);
        }
        toast.success("Dépendant ajouté avec succès !");
      }
      setShowDependentModal(false);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Erreur lors de l'enregistrement du dépendant.";
      toast.error(message);
    }
  };

  const handleDeleteDependent = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce dépendant ?")) {
      try {
        await deleteDependent(id);
        setDependents(dependents.filter((d) => d._id !== id));
        toast.success("Dépendant supprimé avec succès !");
      } catch {
        toast.error("Erreur lors de la suppression du dépendant.");
      }
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const birthDate = new Date(dateOfBirth);
    const age = Math.floor(
      (new Date().getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
    );
    return age;
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <PageHeader
        title="Paramètres du compte"
        description="Gérez vos informations personnelles et vos préférences."
        actions={
          <button
            onClick={handleSave}
            className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-glow hover:opacity-90 transition"
          >
            <Save className="h-4 w-4" /> Enregistrer
          </button>
        }
      />

      {/* Personal info */}
      <div className="rounded-2xl border border-border bg-white/50 p-6 backdrop-blur-sm shadow-soft space-y-5">
        <h3 className="text-sm font-bold text-ink flex items-center gap-2">
          <User className="h-4 w-4 text-ink-soft" /> Informations personnelles
        </h3>

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
              Cliquez sur l'avatar pour téléverser votre photo. Formats acceptés: JPG, PNG. Max 2
              Mo.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { label: "Prénom", icon: User, value: firstName, onChange: setFirstName },
            { label: "Nom", icon: User, value: lastName, onChange: setLastName },
            { label: "Téléphone", icon: Phone, value: phone, onChange: setPhone },
            { label: "Adresse", icon: MapPin, value: address, onChange: setAddress },
          ].map((f) => (
            <div key={f.label}>
              <label className="block text-xs font-bold uppercase tracking-wide text-ink-soft mb-1.5">
                {f.label}
              </label>
              <div className="relative">
                <f.icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/60" />
                <input
                  value={f.value}
                  onChange={(e) => f.onChange(e.target.value)}
                  className="w-full rounded-xl border border-border bg-slate-50/50 pl-10 pr-3 py-2.5 text-sm text-ink focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 shadow-sm"
                />
              </div>
            </div>
          ))}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wide text-ink-soft mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/60" />
              <input
                value={email}
                disabled
                className="w-full rounded-xl border border-border bg-slate-100 pl-10 pr-3 py-2.5 text-sm text-ink opacity-60 cursor-not-allowed shadow-sm"
              />
            </div>
            <p className="mt-1 text-[10px] text-ink-soft/60">
              L'email ne peut pas être modifié. Contactez le support si nécessaire.
            </p>
          </div>
        </div>
      </div>


      {/* Dependents/Children Management */}
      <div className="rounded-2xl border border-border bg-white/50 p-6 backdrop-blur-sm shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              <Users className="h-4 w-4 text-ink-soft" />
              Enfants &amp; Dépendants
              {dependents.length > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  {dependents.length} enregistré{dependents.length > 1 ? "s" : ""}
                </span>
              )}
            </h3>
            <p className="text-xs text-ink-soft/60 mt-0.5">
              Enfants de moins de 18 ans pour lesquels vous pouvez prendre des rendez-vous.
            </p>
          </div>
          <button
            onClick={() => handleOpenDependentModal()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Ajouter un enfant
          </button>
        </div>

        {loadingDependents ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="h-5 w-5 text-primary animate-spin" />
          </div>
        ) : dependents.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-10 w-10 text-ink-soft/30 mx-auto mb-2" />
            <p className="text-sm text-ink-soft/70">Aucun dépendant enregistré.</p>
            <p className="text-xs text-ink-soft/50 mt-1">
              Vous pouvez ajouter des enfants ou d'autres dépendants pour gérer leurs rendez-vous.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {dependents.map((dep) => (
              <div
                key={dep._id}
                className="flex items-center justify-between rounded-lg border border-border/50 bg-white/40 px-4 py-3 shadow-sm hover:bg-white/60 transition"
              >
                <div className="flex-1">
                  <p className="font-semibold text-sm text-ink">
                    {dep.firstName} {dep.lastName}
                  </p>
                  <p className="text-xs text-ink-soft/70 mt-0.5">
                    {calculateAge(dep.dateOfBirth)} ans • {dep.relationship} •{" "}
                    {dep.gender === "M" ? "Garçon" : "Fille"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenDependentModal(dep)}
                    className="inline-flex items-center gap-1.5 rounded-lg text-primary hover:bg-primary/10 p-2 transition cursor-pointer"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteDependent(dep._id)}
                    className="inline-flex items-center gap-1.5 rounded-lg text-red-500 hover:bg-red-500/10 p-2 transition cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dependent Modal */}
      {showDependentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-ink">
                {editingDependent ? "Modifier le dépendant" : "Ajouter un dépendant"}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-ink-soft mb-1.5">
                    Prénom *
                  </label>
                  <input
                    value={dependentForm.firstName}
                    onChange={(e) =>
                      setDependentForm({ ...dependentForm, firstName: e.target.value })
                    }
                    className="w-full rounded-lg border border-border bg-slate-50 px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                    placeholder="ex: Ahmed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-ink-soft mb-1.5">
                    Nom *
                  </label>
                  <input
                    value={dependentForm.lastName}
                    onChange={(e) =>
                      setDependentForm({ ...dependentForm, lastName: e.target.value })
                    }
                    className="w-full rounded-lg border border-border bg-slate-50 px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                    placeholder="ex: Boucher"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-ink-soft mb-1.5">
                  Date de naissance
                </label>
                <input
                  type="date"
                  value={dependentForm.dateOfBirth}
                  onChange={(e) =>
                    setDependentForm({ ...dependentForm, dateOfBirth: e.target.value })
                  }
                  className="w-full rounded-lg border border-border bg-slate-50 px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-ink-soft mb-1.5">
                    Genre
                  </label>
                  <select
                    value={dependentForm.gender}
                    onChange={(e) => setDependentForm({ ...dependentForm, gender: e.target.value })}
                    className="w-full rounded-lg border border-border bg-slate-50 px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                  >
                    <option value="M">Garçon</option>
                    <option value="F">Fille</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-ink-soft mb-1.5">
                    Lien
                  </label>
                  <select
                    value={dependentForm.relationship}
                    onChange={(e) =>
                      setDependentForm({
                        ...dependentForm,
                        relationship: e.target.value as "Enfant" | "Autre dépendant",
                      })
                    }
                    className="w-full rounded-lg border border-border bg-slate-50 px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                  >
                    <option value="Enfant">Enfant</option>
                    <option value="Autre dépendant">Autre dépendant</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-ink-soft mb-1.5">
                  Groupe sanguin
                </label>
                <input
                  value={dependentForm.bloodType}
                  onChange={(e) =>
                    setDependentForm({ ...dependentForm, bloodType: e.target.value })
                  }
                  className="w-full rounded-lg border border-border bg-slate-50 px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                  placeholder="ex: O+"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-ink-soft mb-1.5">
                  Allergies
                </label>
                <textarea
                  value={dependentForm.allergies}
                  onChange={(e) =>
                    setDependentForm({ ...dependentForm, allergies: e.target.value })
                  }
                  className="w-full rounded-lg border border-border bg-slate-50 px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                  placeholder="ex: Arachide, Noix"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-ink-soft mb-1.5">
                  Maladies chroniques
                </label>
                <textarea
                  value={dependentForm.chronicConditions}
                  onChange={(e) =>
                    setDependentForm({ ...dependentForm, chronicConditions: e.target.value })
                  }
                  className="w-full rounded-lg border border-border bg-slate-50 px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                  placeholder="ex: Asthme, Diabète"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-ink-soft mb-1.5">
                    Poids (kg)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={dependentForm.weight || ""}
                    onChange={(e) =>
                      setDependentForm({ ...dependentForm, weight: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-border bg-slate-50 px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                    placeholder="ex: 32"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-ink-soft mb-1.5">
                    Taille (cm)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={dependentForm.height || ""}
                    onChange={(e) =>
                      setDependentForm({ ...dependentForm, height: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-border bg-slate-50 px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                    placeholder="ex: 128"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border flex gap-3 justify-end sticky bottom-0 bg-white">
              <button
                onClick={() => setShowDependentModal(false)}
                className="px-4 py-2 rounded-lg border border-border text-ink font-semibold hover:bg-slate-50 transition cursor-pointer text-sm"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveDependent}
                className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:opacity-90 transition cursor-pointer text-sm flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {editingDependent ? "Mettre à jour" : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
