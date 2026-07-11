import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { z } from "zod";
import { MarketingLayout } from "@/components/layouts/MarketingLayout";
import { specialities } from "@/lib/data";
import { fetchDoctors, type ApiDoctor } from "@/lib/api";
import { MapPin, Search, SlidersHorizontal, Stethoscope, RefreshCw, X } from "lucide-react";

const searchSchema = z.object({
  q: z.string().optional().default(""),
  spec: z.string().optional().default("all"),
});

export const Route = createFileRoute("/doctors/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Praticiens — Unicare" },
      {
        name: "description",
        content: "Recherchez nos médecins par spécialité, tarif et disponibilité à Béjaïa.",
      },
    ],
  }),
  component: DoctorsPage,
});

function DoctorsPage() {
  const { q: initialQ, spec: initialSpec } = Route.useSearch();
  const navigate = useNavigate({ from: "/doctors/" });

  const [q, setQ] = useState(initialQ);
  const [spec, setSpec] = useState(initialSpec);
  const [doctorsList, setDoctorsList] = useState<ApiDoctor[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync URL search params → local state when URL changes
  useEffect(() => { setQ(initialQ); }, [initialQ]);
  useEffect(() => { setSpec(initialSpec); }, [initialSpec]);

  useEffect(() => {
    fetchDoctors()
      .then((res) => { setDoctorsList(res.data.doctors); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Push filter changes to URL for shareability
  const updateSearch = (newQ: string, newSpec: string) => {
    void navigate({ search: { q: newQ || undefined, spec: newSpec === "all" ? undefined : newSpec } as never });
  };

  const handleQChange = (v: string) => {
    setQ(v);
    updateSearch(v, spec);
  };

  const handleSpecChange = (v: string) => {
    setSpec(v);
    updateSearch(q, v);
  };

  const handleReset = () => {
    setQ(""); setSpec("all");
    void navigate({ search: {} as never });
  };

  const filtered = useMemo(() => {
    return doctorsList.filter((d) => {
      if (d.status !== "Actif") return false;
      if (spec !== "all" && d.specialitySlug !== spec) return false;
      if (q && !`${d.name} ${d.speciality}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [doctorsList, q, spec]);

  const hasFilters = q || spec !== "all";

  return (
    <MarketingLayout>
      {/* Page header */}
      <div className="px-6 pb-12 pt-20">
        <div className="hero-panel mx-auto max-w-7xl px-8 py-12 sm:px-10">
          <p className="landing-pill">
            <span className="h-1.5 w-4 rounded-full bg-primary" />
            Annuaire Médical
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            Nos Praticiens
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-medium text-muted-foreground">
            {loading ? "Chargement…" : `${filtered.length} praticien${filtered.length !== 1 ? "s" : ""} disponible${filtered.length !== 1 ? "s" : ""} pour consultation au UniCare Centre Médical.`}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Sidebar filters */}
          <aside className="landing-card space-y-6 p-6 lg:sticky lg:top-24 lg:self-start">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-slate-400" />
                <p className="text-sm font-bold text-[#06122e]">Filtres de recherche</p>
              </div>
              {hasFilters && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1 text-xs font-semibold text-teal hover:underline cursor-pointer"
                >
                  <X className="h-3 w-3" /> Effacer
                </button>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Rechercher
              </label>
              <div className="relative mt-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => handleQChange(e.target.value)}
                  placeholder="Nom ou spécialité"
                  className="w-full rounded border border-slate-200 bg-slate-50/30 py-2 pl-9 pr-3 text-xs placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Spécialité
              </label>
              <select
                value={spec}
                onChange={(e) => handleSpecChange(e.target.value)}
                className="mt-2 w-full rounded border border-slate-200 bg-white px-3 py-2 text-xs focus:border-slate-300 focus:outline-none transition"
              >
                <option value="all">Toutes spécialités</option>
                {specialities.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleReset}
              className="w-full rounded border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Réinitialiser les filtres
            </button>
          </aside>

          {/* Doctor cards grid */}
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 content-start">
            {loading ? (
              <div className="col-span-full flex items-center justify-center py-24 text-slate-400 text-sm">
                <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Chargement des médecins…
              </div>
            ) : (
              filtered.map((d) => (
                <div key={d._id} className="relative">
                  <Link
                    to="/doctors/$id"
                    params={{ id: d._id }}
                    className="landing-card group block overflow-hidden transition hover:-translate-y-1 hover:shadow-elevated"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
                      {d.image ? (
                        <img
                          src={d.image}
                          alt={d.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-3 text-slate-300">
                          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-soft">
                            <Stethoscope className="h-10 w-10 text-slate-400" />
                          </div>
                          <span className="text-sm font-bold text-slate-400">
                            {d.firstName?.[0]}{d.lastName?.[0]}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-bold text-[#06122e]">{d.name}</p>
                          <p className="mt-0.5 text-xs font-semibold text-[#0284c7] uppercase tracking-wide">
                            {d.speciality}
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" /> {d.location}
                      </p>
                      <div className="mt-4 flex items-center justify-end border-t border-slate-100 pt-4">
                        <span className="rounded-full bg-[#06122e] px-4 py-1.5 text-xs font-bold text-white shadow group-hover:opacity-90 transition">
                          Prendre RDV
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              ))
            )}
            {!loading && filtered.length === 0 && (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white/50 p-16 text-center">
                <Stethoscope className="mx-auto h-10 w-10 text-slate-300 mb-4" />
                <p className="text-sm font-semibold text-slate-500">Aucun médecin trouvé</p>
                <p className="mt-1 text-xs text-slate-400">Essayez d'autres critères de recherche.</p>
                <button
                  onClick={handleReset}
                  className="mt-4 rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Effacer les filtres
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
