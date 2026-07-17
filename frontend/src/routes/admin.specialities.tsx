import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-ext/primitives";
import { specialities as defaultSpecialities } from "@/lib/data";
import { Plus, X, Stethoscope } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { fetchDoctors, type ApiDoctor } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/specialities")({
  component: AdminSpecialities,
});

function AdminSpecialities() {
  const [doctorsList, setDoctorsList] = useState<ApiDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSpecName, setNewSpecName] = useState("");
  const [customSpecs, setCustomSpecs] = useState<Array<{ slug: string; name: string }>>([]);

  const loadCustomSpecs = () => {
    try {
      const raw = localStorage.getItem("unicare_custom_specialities");
      if (raw) {
        setCustomSpecs(JSON.parse(raw));
      }
    } catch {
      setCustomSpecs([]);
    }
  };

  useEffect(() => {
    loadCustomSpecs();
    fetchDoctors()
      .then((res) => {
        setDoctorsList(res.data.doctors);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const combinedSpecialities = useMemo(() => {
    const list = defaultSpecialities.map(s => ({
      slug: s.slug,
      name: s.name,
      doctorsCount: doctorsList.filter(d => d.specialitySlug === s.slug).length
    }));

    customSpecs.forEach(item => {
      if (!list.some(l => l.slug === item.slug)) {
        list.push({
          slug: item.slug,
          name: item.name,
          doctorsCount: doctorsList.filter(d => d.specialitySlug === item.slug || d.speciality.toLowerCase().trim() === item.name.toLowerCase().trim()).length
        });
      }
    });

    return list;
  }, [doctorsList, customSpecs]);

  const handleAddSpeciality = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpecName.trim()) return;

    const slug = newSpecName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
    if (combinedSpecialities.some(s => s.slug === slug)) {
      toast.error("Cette spécialité existe déjà.");
      return;
    }

    const updated = [...customSpecs, { slug, name: newSpecName.trim() }];
    localStorage.setItem("unicare_custom_specialities", JSON.stringify(updated));
    setCustomSpecs(updated);
    setNewSpecName("");
    setShowAddModal(false);
    toast.success("Nouvelle spécialité ajoutée avec succès !");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Spécialités"
        description="La taxonomie clinique visible par les patients lors de la réservation."
        actions={
          <button 
            onClick={() => setShowAddModal(true)}
            className="cursor-pointer inline-flex items-center gap-2 rounded-full bg-[#06122e] px-4 py-2.5 text-xs font-bold text-white hover:opacity-90 transition shadow"
          >
            <Plus className="h-4 w-4" /> Nouvelle spécialité
          </button>
        }
      />

      {loading ? (
        <div className="py-12 text-center text-xs font-bold text-slate-400">Chargement des spécialités...</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {combinedSpecialities.map((s) => (
            <div
              key={s.slug}
              className="rounded-2xl border border-border bg-white/50 p-5 shadow-soft transition hover:bg-white/80"
            >
              <p className="font-bold text-ink">{s.name}</p>
              <p className="mt-1 text-xs font-semibold text-[#0284c7]">
                {s.doctorsCount} médecin{s.doctorsCount !== 1 ? "s" : ""} actif{s.doctorsCount !== 1 ? "s" : ""}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Add Speciality Modal Overlay */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white border border-border shadow-elevated p-6 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-ink-soft hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-bold text-ink mb-4">Nouvelle spécialité</h3>

            <form onSubmit={handleAddSpeciality} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-ink-soft mb-1.5">
                  Nom de la spécialité *
                </label>
                <input
                  type="text"
                  required
                  value={newSpecName}
                  onChange={(e) => setNewSpecName(e.target.value)}
                  placeholder="Ex: Dermatologie, Pédiatrie..."
                  className="w-full rounded-xl border border-border bg-slate-50/50 px-3 py-2.5 text-sm focus:border-teal focus:outline-none font-medium"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-teal px-5 py-2 text-xs font-bold text-white hover:opacity-90 transition cursor-pointer shadow"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
