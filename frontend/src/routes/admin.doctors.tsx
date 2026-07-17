import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-ext/primitives";
import { Plus, Search, Star, Users, Stethoscope, X, Trash2, RefreshCw, Edit, Coffee, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  fetchDoctors,
  createDoctorProfile,
  updateDoctorProfile,
  deleteDoctorProfile,
  type ApiDoctor,
} from "@/lib/api";
import { specialities } from "@/lib/data";

export const Route = createFileRoute("/admin/doctors")({
  component: AdminDoctors,
});

// ── Password strength checker ──────────────────────────────────────────────
function checkPasswordStrength(pwd: string) {
  return {
    minLength: pwd.length >= 12,
    hasUpper: /[A-Z]/.test(pwd),
    hasLower: /[a-z]/.test(pwd),
    hasDigit: /[0-9]/.test(pwd),
    hasSpecial: /[^A-Za-z0-9]/.test(pwd),
  };
}
function isPasswordStrong(pwd: string) {
  const r = checkPasswordStrength(pwd);
  return r.minLength && r.hasUpper && r.hasLower && r.hasDigit && r.hasSpecial;
}

function getCombinedSpecialities() {
  const defaults = [...specialities];
  try {
    const raw = localStorage.getItem("unicare_custom_specialities");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach(item => {
          if (item && item.slug && item.name && !defaults.some(d => d.slug === item.slug)) {
            defaults.push({
              slug: item.slug,
              name: item.name,
              tagline: "Spécialité personnalisée",
              description: "Ajoutée par l'administration",
              icon: Stethoscope as any,
              doctors: 0,
              color: "bg-slate-50",
            });
          }
        });
      }
    }
  } catch (e) {
    console.error(e);
  }
  return defaults;
}

function AdminDoctors() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [doctors, setDoctors] = useState<ApiDoctor[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [specialitySlug, setSpecialitySlug] = useState("general-medicine");
  const [location, setLocation] = useState("Cabinet 101, Béjaïa");
  const [startHour, setStartHour] = useState("08:30");
  const [endHour, setEndHour] = useState("16:30");
  const [bio, setBio] = useState("");
  const [doctorPhoto, setDoctorPhoto] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Edit Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<ApiDoctor | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editSpecialitySlug, setEditSpecialitySlug] = useState("general-medicine");
  const [editLocation, setEditLocation] = useState("");
  const [editStartHour, setEditStartHour] = useState("08:30");
  const [editEndHour, setEditEndHour] = useState("16:30");
  const [editBio, setEditBio] = useState("");
  const [editStatus, setEditStatus] = useState<"Actif" | "Inactif" | "Congé">("Actif");
  const [editPhoto, setEditPhoto] = useState("");

  const handleOpenEditModal = (doc: ApiDoctor) => {
    setEditingDoctor(doc);
    setEditSpecialitySlug(doc.specialitySlug);
    setEditLocation(doc.location);
    setEditStatus(doc.status);
    setShowEditModal(true);
  };

  const handleUpdateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;
    setSubmitting(true);
    try {
      const combined = getCombinedSpecialities();
      const selectedSpec =
        combined.find((s) => s.slug === editSpecialitySlug) || combined[0];
      // Admin can only update administrative fields (not personal info)
      await updateDoctorProfile(editingDoctor._id, {
        speciality: selectedSpec.name,
        specialitySlug: selectedSpec.slug,
        location: editLocation,
        fee: 2000,
        status: editStatus,
      });
      toast.success("Profil médecin mis à jour avec succès !");
      setShowEditModal(false);
      setEditingDoctor(null);
      await load();
    } catch (error: any) {
      toast.error(error?.message ?? "Erreur lors de la mise à jour.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setEditPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchDoctors();
      setDoctors(res.data.doctors);
    } catch {
      toast.error("Impossible de charger les médecins.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setDoctorPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const filtered = doctors.filter((d) => {
    const matchSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.speciality.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    if (!isPasswordStrong(password)) {
      toast.error("Le mot de passe ne respecte pas les critères de sécurité requis.");
      return;
    }
    setSubmitting(true);
    try {
      const combined = getCombinedSpecialities();
      const selectedSpec = combined.find((s) => s.slug === specialitySlug) || combined[0];
      await createDoctorProfile({
        firstName,
        lastName,
        email,
        password,
        speciality: selectedSpec.name,
        specialitySlug: selectedSpec.slug,
        bio: bio || `Spécialiste qualifié dévoué au service des patients de UniCare.`,
        image: doctorPhoto,
        location,
        fee: 2000,
        availableDays: ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi"],
        availableHours: { start: startHour, end: endHour },
      });
      toast.success(
        "Compte médecin créé avec succès ! Le médecin peut se connecter immédiatement.",
      );
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setBio("");
      setDoctorPhoto("");
      setShowAddModal(false);
      await load();
    } catch (error: any) {
      toast.error(error?.message ?? "Erreur de création de compte.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Supprimer ${name} ? Cette action est irréversible.`)) return;
    try {
      await deleteDoctorProfile(id);
      toast.success(`${name} supprimé.`);
      setDoctors((prev) => prev.filter((d) => d._id !== id));
    } catch (error: any) {
      toast.error(error?.message ?? "Erreur lors de la suppression.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Praticiens"
        description="Gérez le personnel médical de UniCare."
        actions={
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un médecin…"
                className="w-56 rounded border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm focus:border-slate-300 focus:outline-none shadow-sm"
              />
            </div>
            <button
              onClick={load}
              className="cursor-pointer inline-flex items-center gap-2 rounded border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition shadow-sm"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="cursor-pointer inline-flex items-center gap-2 rounded bg-[#06122e] px-4 py-2 text-sm font-bold text-white shadow hover:opacity-90 transition"
            >
              <Plus className="h-4 w-4" /> Ajouter médecin
            </button>
          </div>
        }
      />

      <div className="flex gap-2 flex-wrap">
        {["all", "Actif", "Congé"].map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={cn(
              "rounded px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer border",
              statusFilter === f
                ? "bg-[#06122e] text-white border-[#06122e]"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
            )}
          >
            {f === "all" ? "Tous les médecins" : f}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400 self-center">
          {filtered.length} médecin{filtered.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Chargement…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <Stethoscope className="h-12 w-12 opacity-20" />
          <p className="text-sm font-medium">Aucun médecin trouvé.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="cursor-pointer rounded bg-[#06122e] px-4 py-2 text-sm font-bold text-white shadow hover:opacity-90 transition"
          >
            Ajouter le premier médecin
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((doc) => (
            <div
              key={doc._id}
              className="group relative flex gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition"
            >
              {/* Photo */}
              <div className="h-16 w-16 shrink-0 rounded-full overflow-hidden border-2 border-slate-100 bg-slate-50">
                {doc.image ? (
                  <img src={doc.image} alt={doc.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xl font-bold text-slate-300">
                    {doc.firstName[0]}
                    {doc.lastName[0]}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#06122e] truncate">{doc.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{doc.speciality}</p>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{doc.location}</p>

                <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {doc.patients} patients
                  </span>
                  <span
                    className={cn(
                      "ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                      doc.status === "Actif"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : doc.status === "Congé"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-slate-100 text-slate-500 border border-slate-200",
                    )}
                  >
                    {doc.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{doc.email}</p>
              </div>

              {/* Action buttons (edit / vacation / delete) */}
              <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={() => handleOpenEditModal(doc)}
                  className="cursor-pointer rounded-full p-1 text-slate-400 hover:text-teal hover:bg-teal/10 transition"
                  title="Modifier le médecin"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={async () => {
                    const newStatus = doc.status === "Congé" ? "Actif" : "Congé";
                    try {
                      await updateDoctorProfile(doc._id, { status: newStatus });
                      toast.success(
                        newStatus === "Congé"
                          ? `${doc.name} mis en congé.`
                          : `${doc.name} remis actif.`,
                      );
                      await load();
                    } catch (err: any) {
                      toast.error(err?.message ?? "Erreur lors du changement de statut.");
                    }
                  }}
                  className={cn(
                    "cursor-pointer rounded-full p-1 transition",
                    doc.status === "Congé"
                      ? "text-amber-500 hover:bg-amber-50"
                      : "text-slate-400 hover:text-amber-500 hover:bg-amber-50",
                  )}
                  title={doc.status === "Congé" ? "Remettre actif" : "Mettre en congé"}
                >
                  <Coffee className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(doc._id, doc.name)}
                  className="cursor-pointer rounded-full p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition"
                  title="Supprimer le médecin"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Doctor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-bold text-[#06122e]">Ajouter un médecin</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="cursor-pointer rounded-full p-1.5 hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleAddDoctor} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Photo */}
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
                  {doctorPhoto ? (
                    <img src={doctorPhoto} alt="preview" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs text-slate-400 text-center px-1">Photo</span>
                  )}
                </div>
                <div>
                  <label className="cursor-pointer rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
                    Choisir une photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-slate-400 mt-1">JPG, PNG — max 5MB</p>
                </div>
              </div>

              {/* Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Prénom *
                  </label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-[#06122e] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nom *</label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-[#06122e] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-[#06122e] focus:outline-none"
                />
              </div>

              {/* Password field with strength indicator */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Mot de passe * (min 12 caractères, MAJ, chiffre, symbole)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Ex: Medecin@Clinic2024!"
                  className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-[#06122e] focus:outline-none"
                />
                {password.length > 0 && (() => {
                  const s = checkPasswordStrength(password);
                  const rules = [
                    { ok: s.minLength, label: "12 caractères minimum" },
                    { ok: s.hasUpper, label: "Majuscule" },
                    { ok: s.hasLower, label: "Minuscule" },
                    { ok: s.hasDigit, label: "Chiffre" },
                    { ok: s.hasSpecial, label: "Caractère spécial" },
                  ];
                  return (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {rules.map((r) => (
                        <span
                          key={r.label}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border",
                            r.ok
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-red-50 text-red-600 border-red-200",
                          )}
                        >
                          {r.ok ? (
                            <Check className="h-2.5 w-2.5 shrink-0" />
                          ) : (
                            <X className="h-2.5 w-2.5 shrink-0" />
                          )}
                          <span>{r.label}</span>
                        </span>
                      ))}
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Spécialité *
                </label>
                <select
                  value={specialitySlug}
                  onChange={(e) => setSpecialitySlug(e.target.value)}
                  className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-[#06122e] focus:outline-none bg-white"
                >
                  {getCombinedSpecialities().map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Lieu</label>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-[#06122e] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Heure de début *
                  </label>
                  <input
                    type="time"
                    required
                    value={startHour}
                    onChange={(e) => setStartHour(e.target.value)}
                    className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-[#06122e] focus:outline-none bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Heure de fin *
                  </label>
                  <input
                    type="time"
                    required
                    value={endHour}
                    onChange={(e) => setEndHour(e.target.value)}
                    className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-[#06122e] focus:outline-none bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Bio / Description
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-[#06122e] focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 cursor-pointer rounded border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 cursor-pointer rounded bg-[#06122e] py-2.5 text-sm font-bold text-white hover:opacity-90 transition disabled:opacity-50"
                >
                  {submitting ? "Création…" : "Créer le compte"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Doctor Modal */}
      {showEditModal && editingDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-bold text-[#06122e]">Modifier le profil du médecin</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingDoctor(null);
                }}
                className="cursor-pointer rounded-full p-1.5 hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <form
              onSubmit={handleUpdateDoctor}
              className="p-6 space-y-4 max-h-[75vh] overflow-y-auto"
            >
              {/* Photo */}
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
                  {editPhoto ? (
                    <img src={editPhoto} alt="preview" className="h-full w-full object-cover" />
                  ) : (
                    <Stethoscope className="h-6 w-6 text-slate-300" />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-ink-soft mb-1">
                    Photo du médecin
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditPhotoChange}
                    className="text-xs text-slate-500 file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Prénom *
                  </label>
                  <input
                    required
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-[#06122e] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Nom de famille *
                  </label>
                  <input
                    required
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-[#06122e] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Adresse e-mail *
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-[#06122e] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Spécialité *
                  </label>
                  <select
                    value={editSpecialitySlug}
                    onChange={(e) => setEditSpecialitySlug(e.target.value)}
                    className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-[#06122e] focus:outline-none select-none"
                  >
                    {getCombinedSpecialities().map((s) => (
                      <option key={s.slug} value={s.slug}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Statut *
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-[#06122e] focus:outline-none select-none"
                  >
                    <option value="Actif">Actif (En service)</option>
                    <option value="Congé">Congé</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Lieu</label>
                  <input
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-[#06122e] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Heure de début *
                  </label>
                  <input
                    type="time"
                    required
                    value={editStartHour}
                    onChange={(e) => setEditStartHour(e.target.value)}
                    className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-[#06122e] focus:outline-none bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Heure de fin *
                  </label>
                  <input
                    type="time"
                    required
                    value={editEndHour}
                    onChange={(e) => setEditEndHour(e.target.value)}
                    className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-[#06122e] focus:outline-none bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Bio / Description
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-[#06122e] focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingDoctor(null);
                  }}
                  className="flex-1 cursor-pointer rounded border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 cursor-pointer rounded bg-teal py-2.5 text-sm font-bold text-white hover:opacity-90 transition disabled:opacity-50"
                >
                  {submitting ? "Mise à jour…" : "Enregistrer les modifications"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
