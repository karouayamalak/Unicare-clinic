import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-ext/primitives";
import { useAuth } from "@/lib/authStore";
import { fetchDoctors, type ApiDoctor } from "@/lib/api";
import { Heart, Stethoscope, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/patient/favorites")({
  component: PatientFavorites,
});

const FAVS_KEY = "medigen_patient_favorites";

function loadFavs(): string[] {
  try {
    return JSON.parse(localStorage.getItem(FAVS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveFavs(ids: string[]) {
  localStorage.setItem(FAVS_KEY, JSON.stringify(ids));
}

function PatientFavorites() {
  const [doctors, setDoctors] = useState<ApiDoctor[]>([]);
  const [favIds, setFavIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setFavIds(loadFavs());
    fetchDoctors()
      .then((res) => setDoctors(res.data.doctors))
      .catch(() => toast.error("Impossible de charger les médecins."))
      .finally(() => setLoading(false));
  }, []);

  const toggleFav = (id: string) => {
    const updated = favIds.includes(id) ? favIds.filter((f) => f !== id) : [...favIds, id];
    setFavIds(updated);
    saveFavs(updated);
  };

  const favDoctors = doctors.filter((d) => favIds.includes(d._id));

  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Médecins favoris"
        description="Vos praticiens enregistrés pour une prise de rendez-vous rapide."
        actions={
          <button
            onClick={() => fetchDoctors().then((r) => setDoctors(r.data.doctors))}
            className="cursor-pointer rounded-xl border border-border bg-white p-2.5 hover:bg-slate-50 transition shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 text-ink-soft ${loading ? "animate-spin" : ""}`} />
          </button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Chargement…
        </div>
      ) : favDoctors.length === 0 ? (
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <Heart className="h-12 w-12 opacity-20" />
            <p className="text-sm font-medium">Aucun médecin enregistré en favori.</p>
            <p className="text-xs text-center max-w-xs">
              Ajoutez des médecins à vos favoris depuis la liste des praticiens pour retrouver
              rapidement votre professionnel de santé.
            </p>
            <Link
              to="/doctors"
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#06122e] px-5 py-2.5 text-sm font-bold text-white shadow hover:opacity-90 transition"
            >
              <Stethoscope className="h-4 w-4" /> Parcourir les médecins
            </Link>
          </div>

          {doctors.length > 0 && (
            <>
              <p className="text-sm font-bold text-ink-soft text-center">
                Ajoutez des médecins depuis la liste ci-dessous :
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {doctors.slice(0, 6).map((d) => (
                  <div
                    key={d._id}
                    className="rounded-2xl border border-border bg-white/60 p-5 shadow-soft"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-14 w-14 shrink-0 rounded-full overflow-hidden border-2 border-slate-100 bg-slate-50">
                        {d.image ? (
                          <img src={d.image} alt={d.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Stethoscope className="h-5 w-5 text-slate-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#06122e] truncate">{d.name}</p>
                        <p className="text-xs text-teal font-semibold">{d.speciality}</p>
                      </div>
                      <button
                        onClick={() => toggleFav(d._id)}
                        className="cursor-pointer grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-white hover:bg-red-50 transition"
                      >
                        <Heart
                          className={`h-4 w-4 ${favIds.includes(d._id) ? "fill-red-500 text-red-500" : "text-slate-300"}`}
                        />
                      </button>
                    </div>
                    {user ? (
                      <Link
                        to="/doctors"
                        className="mt-4 block rounded-xl bg-[#06122e] py-2.5 text-center text-sm font-bold text-white hover:opacity-90 transition shadow-sm"
                      >
                        Prendre rendez-vous
                      </Link>
                    ) : (
                      <Link
                        to="/login"
                        search={{ redirect: "/doctors" }}
                        className="mt-4 block rounded-xl bg-[#06122e] py-2.5 text-center text-sm font-bold text-white hover:opacity-90 transition shadow-sm"
                      >
                        Prendre rendez-vous
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favDoctors.map((d) => (
            <div
              key={d._id}
              className="rounded-2xl border border-border bg-white/60 p-5 shadow-soft hover:shadow-md transition"
            >
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 shrink-0 rounded-full overflow-hidden border-2 border-slate-100 bg-slate-50">
                  {d.image ? (
                    <img src={d.image} alt={d.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Stethoscope className="h-5 w-5 text-slate-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#06122e] truncate">{d.name}</p>
                  <p className="text-xs text-teal font-semibold">{d.speciality}</p>
                </div>
                <button
                  onClick={() => toggleFav(d._id)}
                  className="cursor-pointer grid h-9 w-9 shrink-0 place-items-center rounded-full bg-red-50 border border-red-100 hover:bg-red-100 transition"
                  title="Retirer des favoris"
                >
                  <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                </button>
              </div>
              <p className="mt-3 text-xs text-ink-soft truncate">{d.location}</p>
              <p className="text-xs font-bold text-teal mt-0.5">Ouvert 24h/24 · 7j/7</p>
              {user ? (
                <Link
                  to="/doctors"
                  className="mt-4 block rounded-xl bg-[#06122e] py-2.5 text-center text-sm font-bold text-white hover:opacity-90 transition shadow-sm"
                >
                  Prendre rendez-vous
                </Link>
              ) : (
                <Link
                  to="/login"
                  search={{ redirect: "/doctors" }}
                  className="mt-4 block rounded-xl bg-[#06122e] py-2.5 text-center text-sm font-bold text-white hover:opacity-90 transition shadow-sm"
                >
                  Prendre rendez-vous
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
