import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import heroBg from "../assets/hero-bg.jpg";
import doctorPortrait from "../assets/doctor-portrait.jpg";
import { fetchDoctors, type ApiDoctor } from "@/lib/api";
import {
  Heart,
  Brain,
  Baby,
  Bone,
  Eye,
  Stethoscope,
  Search,
  ArrowRight,
  Calendar,
  ShieldCheck,
  Clock,
  Microscope,
  Wind,
  FlaskConical,
  X,
  User,
} from "lucide-react";
import { DefaultAvatar } from "@/components/ui-ext/primitives";

export const Route = createFileRoute("/")({
  component: Index,
});

// Icon map for specialities — fallback to Stethoscope
const SPEC_ICONS: Record<string, React.ElementType> = {
  cardiologie: Heart,
  neurologie: Brain,
  pédiatrie: Baby,
  pediatrie: Baby,
  orthopédie: Bone,
  orthopedie: Bone,
  ophtalmologie: Eye,
  "médecine générale": Stethoscope,
  "medecine generale": Stethoscope,
  pneumologie: Wind,
  biologie: FlaskConical,
  "analyses médicales": Microscope,
  dermatologie: Stethoscope,
  gynécologie: Stethoscope,
  gynecologie: Stethoscope,
  chirurgie: Stethoscope,
  gastro: FlaskConical,
};

function getSpecIcon(name: string): React.ElementType {
  const key = name.toLowerCase();
  for (const [k, Icon] of Object.entries(SPEC_ICONS)) {
    if (key.includes(k)) return Icon;
  }
  return Stethoscope;
}

function Index() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [query, setQuery] = useState("");
  const [doctors, setDoctors] = useState<ApiDoctor[]>([]);
  const [specialities, setSpecialities] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [focused, setFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Load doctors from API on mount
  useEffect(() => {
    fetchDoctors()
      .then((res) => {
        const docs = res.data.doctors;
        setDoctors(docs);
        // Extract unique specialities
        const specs = Array.from(new Set(docs.map((d) => d.speciality).filter(Boolean)));
        setSpecialities(specs);
      })
      .catch(() => {
        // fallback — keep empty, UI handles gracefully
      });
  }, []);

  // Tilt effect
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const handle = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      setTilt({ x, y });
    };
    el.addEventListener("mousemove", handle);
    return () => el.removeEventListener("mousemove", handle);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Filtered search results
  const searchResults = query.trim().length >= 2
    ? doctors.filter((d) => {
        const q = query.toLowerCase();
        const fullName = `${d.firstName} ${d.lastName}`.toLowerCase();
        return (
          fullName.includes(q) ||
          (d.name || "").toLowerCase().includes(q) ||
          d.speciality.toLowerCase().includes(q)
        );
      }).slice(0, 6)
    : [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      void navigate({ to: "/doctors", search: { q: query } as any });
    } else {
      void navigate({ to: "/doctors" });
    }
  };

  const handleSpecialityClick = (spec: string) => {
    void navigate({ to: "/doctors", search: { speciality: spec } as any });
  };

  return (
    <div className="min-h-screen bg-transparent">
      <section
        ref={heroRef}
        className="hero-panel relative mx-3 mt-3 overflow-hidden rounded-[2.5rem]"
        style={{ perspective: "1200px" }}
      >
        <div
          className="absolute inset-0 rounded-[2.5rem] transition-transform duration-300 ease-out"
          style={{
            transform: `translate3d(${tilt.x * -30}px, ${tilt.y * -30}px, 0) scale(1.1)`,
          }}
        >
          <img
            src={heroBg}
            alt="Fond médical"
            className="h-full w-full rounded-[2.5rem] object-cover"
            width={1920}
            height={1280}
          />
          <div className="absolute inset-0 rounded-[2.5rem] bg-linear-to-b from-[oklch(0.15_0.05_250/0.55)] via-[oklch(0.15_0.05_250/0.3)] to-[oklch(0.1_0.04_250/0.85)]" />
        </div>

        <div className="relative z-10">
          <nav className="flex items-center justify-between px-6 py-6 md:px-12">
            <div className="text-2xl font-semibold tracking-tight text-white">
              Uni<span className="font-light">care</span>
            </div>
            <div className="hidden items-center gap-8 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur-xl md:flex">
              <a href="#home" className="transition hover:text-white">
                Accueil
              </a>
              <a href="#specialities" className="transition hover:text-white">
                Spécialités
              </a>
              <a href="#doctors" className="transition hover:text-white">
                Médecins
              </a>
              <a href="#about" className="transition hover:text-white">
                À propos
              </a>
              <a href="#contact" className="transition hover:text-white">
                Contact
              </a>
            </div>
            <Link
              to="/login"
              search={{ redirect: "/doctors" }}
              className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm text-white transition hover:-translate-y-0.5 hover:bg-white hover:text-[oklch(0.18_0.06_250)]"
            >
              Réserver
            </Link>
          </nav>

          <div
            className="px-6 pt-16 pb-32 text-center transition-transform duration-300 md:px-12 md:pt-28 md:pb-44"
            style={{
              transform: `translate3d(${tilt.x * 15}px, ${tilt.y * 15}px, 0)`,
            }}
          >
            <p className="mb-6 text-sm uppercase tracking-[0.3em] text-white/70">
              Clinique · Béjaïa, Algérie
            </p>
            <h1 className="mx-auto max-w-4xl text-4xl font-light leading-[1.05] tracking-tight text-white md:text-6xl lg:text-7xl">
              Prenez rendez-vous avec des médecins de confiance à Béjaïa
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-white/75">
              Multiples spécialités. Vrais spécialistes. Une réservation simple.
            </p>

            {/* Dynamic Search Bar */}
            <div ref={searchRef} className="relative mx-auto mt-10 max-w-2xl">
              <form
                id="book"
                onSubmit={handleSearch}
                className="flex items-center gap-2 rounded-[24px] border border-white/20 bg-white/15 p-2 backdrop-blur-lg"
              >
                <div className="flex flex-1 items-center gap-2 rounded-xl bg-white/5 px-4 py-3">
                  <Search className="h-4 w-4 shrink-0 text-white/60" />
                  <input
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setShowResults(true);
                    }}
                    onFocus={() => { setFocused(true); setShowResults(true); }}
                    placeholder="Spécialité ou nom du médecin…"
                    className="w-full bg-transparent text-sm text-white placeholder:text-white/50 outline-none"
                    autoComplete="off"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => { setQuery(""); setShowResults(false); }}
                      className="text-white/50 hover:text-white transition"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="shrink-0 rounded-xl bg-white px-6 py-3 text-sm font-medium text-[oklch(0.18_0.06_250)] transition hover:bg-white/90"
                >
                  Rechercher
                </button>
              </form>

              {/* Search Results Dropdown */}
              {showResults && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-white/20 bg-[oklch(0.15_0.05_250/0.92)] backdrop-blur-xl shadow-2xl overflow-hidden">
                  <div className="p-2">
                    <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                      Résultats ({searchResults.length})
                    </p>
                    {searchResults.map((doc) => (
                      <Link
                        key={doc._id}
                        to="/book/$doctorId"
                        params={{ doctorId: doc._id }}
                        onClick={() => setShowResults(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-white/10 cursor-pointer"
                      >
                        <DefaultAvatar className="h-9 w-9 shrink-0 border border-white/20" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">
                            {doc.firstName} {doc.lastName}
                          </p>
                          <p className="text-xs text-white/60">{doc.speciality}</p>
                        </div>
                      </Link>
                    ))}
                    <Link
                      to="/doctors"
                      onClick={() => setShowResults(false)}
                      className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 mt-1 border border-white/10 text-xs font-bold text-white/60 hover:text-white hover:bg-white/10 transition"
                    >
                      Voir tous les médecins <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              )}

              {/* No results hint */}
              {showResults && focused && query.trim().length >= 2 && searchResults.length === 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-white/20 bg-[oklch(0.15_0.05_250/0.92)] backdrop-blur-xl shadow-2xl p-6 text-center">
                  <User className="h-8 w-8 mx-auto text-white/20 mb-2" />
                  <p className="text-sm text-white/50">Aucun médecin trouvé pour « {query} »</p>
                  <Link
                    to="/doctors"
                    onClick={() => setShowResults(false)}
                    className="mt-3 inline-block text-xs font-bold text-white/70 hover:text-white underline transition"
                  >
                    Parcourir tous les médecins
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Specialities Section */}
      <section id="specialities" className="mx-auto max-w-6xl px-6 py-24 md:px-12 md:py-32">
        <div className="mb-16 text-center">
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Nos spécialités
          </p>
          <h2 className="mx-auto max-w-2xl text-3xl font-light tracking-tight text-foreground md:text-5xl">
            Des soins dans chaque discipline
          </h2>
          {specialities.length > 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              {specialities.length} spécialité{specialities.length > 1 ? "s" : ""} disponible{specialities.length > 1 ? "s" : ""} à UniCare
            </p>
          )}
        </div>
        <div className="landing-card grid grid-cols-2 gap-px overflow-hidden rounded-[24px] bg-border md:grid-cols-3">
          {(specialities.length > 0 ? specialities : [
            "Cardiologie", "Neurologie", "Pédiatrie", "Orthopédie", "Ophtalmologie", "Médecine générale"
          ]).map((spec) => {
            const Icon = getSpecIcon(spec);
            return (
              <button
                key={spec}
                onClick={() => handleSpecialityClick(spec)}
                className="group flex cursor-pointer flex-col gap-4 bg-background p-8 transition hover:bg-secondary text-left md:p-10"
              >
                <Icon className="h-6 w-6 text-[oklch(0.55_0.16_240)]" strokeWidth={1.5} />
                <div className="text-lg font-medium text-foreground">{spec}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground opacity-0 transition group-hover:opacity-100">
                  Voir les médecins <ArrowRight className="h-3 w-3" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section
        id="doctors"
        className="mx-3 rounded-[28px] border border-slate-200/70 bg-white/70 px-3 py-6 shadow-[0_20px_60px_-30px_rgba(7,17,30,0.25)] backdrop-blur-xl md:px-6 md:py-8"
      >
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-3 py-16 md:grid-cols-2 md:gap-20 md:px-6 md:py-24">
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Nos médecins
            </p>
            <h2 className="text-3xl font-light tracking-tight text-foreground md:text-5xl">
              Rencontrez les spécialistes derrière UniCare.
            </h2>
            <p className="mt-6 max-w-md text-muted-foreground">
              {doctors.length > 0
                ? `${doctors.length} médecins certifiés à Béjaïa, tous au même endroit.`
                : "Plus de 40 médecins certifiés à Béjaïa, tous au même endroit."}
            </p>

            {/* Quick doctor previews */}
            {doctors.length > 0 && (
              <div className="mt-6 space-y-3">
                {doctors.slice(0, 3).map((doc) => (
                  <Link
                    key={doc._id}
                    to="/book/$doctorId"
                    params={{ doctorId: doc._id }}
                    className="flex items-center gap-3 rounded-xl border border-border bg-white/60 p-3 hover:bg-white transition shadow-sm group"
                  >
                    <DefaultAvatar className="h-9 w-9 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-ink truncate">
                        {doc.firstName} {doc.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{doc.speciality}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </Link>
                ))}
              </div>
            )}

            <Link
              to="/doctors"
              className="mt-8 inline-flex items-center gap-2 border-b border-foreground pb-1 text-sm text-foreground transition-all hover:gap-3"
            >
              Voir tous les médecins <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="relative aspect-4/5 overflow-hidden rounded-2xl bg-[oklch(0.15_0.05_250)]">
            <img
              src={doctorPortrait}
              alt="Spécialiste UniCare"
              className="h-full w-full object-cover"
              loading="lazy"
              width={1024}
              height={1024}
            />
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-6xl px-6 py-24 md:px-12 md:py-32">
        <div className="grid gap-12 md:grid-cols-3">
          {[
            {
              icon: Search,
              title: "Choisissez une spécialité",
              text: "Parcourez les médecins par domaine.",
            },
            {
              icon: Calendar,
              title: "Choisissez un horaire",
              text: "Disponibilité en temps réel.",
            },
            {
              icon: ShieldCheck,
              title: "Confirmez votre visite",
              text: "Confirmation instantanée.",
            },
          ].map((step) => (
            <div key={step.title} className="flex flex-col gap-4">
              <div className="text-xs text-muted-foreground">
                0
                {step.title === "Choisissez une spécialité"
                  ? 1
                  : step.title === "Choisissez un horaire"
                    ? 2
                    : 3}
              </div>
              <step.icon className="h-6 w-6 text-[oklch(0.55_0.16_240)]" strokeWidth={1.5} />
              <div className="text-xl font-medium text-foreground">{step.title}</div>
              <div className="text-sm text-muted-foreground">{step.text}</div>
            </div>
          ))}
        </div>
      </section>

      <section
        id="contact"
        className="mx-3 mb-3 rounded-4xl bg-[oklch(0.18_0.06_250)] px-6 py-20 text-center shadow-[0_30px_80px_-35px_rgba(7,17,30,0.45)] md:px-12 md:py-28"
      >
        <h2 className="mx-auto max-w-2xl text-3xl font-light tracking-tight text-white md:text-5xl">
          Votre prochain rendez-vous est à un clic.
        </h2>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            to="/login"
            search={{ redirect: "/doctors" }}
            className="rounded-full bg-white px-8 py-3 text-sm font-medium text-[oklch(0.18_0.06_250)] transition hover:bg-white/90"
          >
            Prendre rendez-vous
          </Link>
          <Link
            to="/doctors"
            className="rounded-full border border-white/30 px-8 py-3 text-sm text-white transition hover:bg-white/10"
          >
            Parcourir les médecins
          </Link>
        </div>
        <div className="mt-16 flex flex-col justify-between gap-4 border-t border-white/10 pt-8 text-sm text-white/60 md:flex-row">
          <div>UniCare Clinique · Béjaïa, Algérie</div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" /> Ouvert dim–ven · 8h00–20h00
          </div>
        </div>
      </section>
    </div>
  );
}
