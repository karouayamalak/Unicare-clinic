import { createFileRoute, Link } from "@tanstack/react-router";
import { authStore, useAuth } from "@/lib/authStore";
import { useEffect, useMemo, useRef, useState } from "react";
import heroBg from "@/assets/hero-bg.jpg";
import doctorPortrait from "@/assets/doctor-portrait.jpg";
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
} from "lucide-react";
import { fetchDoctors, type ApiDoctor } from "@/lib/api";

export const Route = createFileRoute("/")({
  component: Index,
});

const specialityIcons = [Heart, Brain, Baby, Bone, Eye, Stethoscope];

function Index() {
  const { user, isLoggedIn } = useAuth();
  const heroRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [search, setSearch] = useState("");

  const [clinicName, setClinicName] = useState(() => 
    localStorage.getItem("unicare:clinic_name") || "UniCare Centre Médical Béjaïa"
  );
  const [clinicAddress, setClinicAddress] = useState(() => 
    localStorage.getItem("unicare:clinic_address") || "Centre Médical Thazmarth, Béjaïa"
  );
  const [clinicPhone, setClinicPhone] = useState(() => 
    localStorage.getItem("unicare:clinic_phone") || "+213 (0)34 12 34 56"
  );
  const [clinicEmail, setClinicEmail] = useState(() => 
    localStorage.getItem("unicare:clinic_email") || "contact@unicare.dz"
  );

  useEffect(() => {
    const handleChanged = () => {
      setClinicName(localStorage.getItem("unicare:clinic_name") || "UniCare Centre Médical Béjaïa");
      setClinicAddress(localStorage.getItem("unicare:clinic_address") || "Centre Médical Thazmarth, Béjaïa");
      setClinicPhone(localStorage.getItem("unicare:clinic_phone") || "+213 (0)34 12 34 56");
      setClinicEmail(localStorage.getItem("unicare:clinic_email") || "contact@unicare.dz");
    };
    window.addEventListener("unicare:clinic_settings_changed", handleChanged);
    return () => window.removeEventListener("unicare:clinic_settings_changed", handleChanged);
  }, []);
  const [doctors, setDoctors] = useState<ApiDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDoctors()
      .then((res) => {
        setDoctors(res.data.doctors || []);
        setError(null);
      })
      .catch((err: any) => {
        setDoctors([]);
        setError(err?.message ?? "Impossible de joindre le serveur.");
      })
      .finally(() => setLoading(false));
  }, []);

  const generatedSpecialities = useMemo(() => {
    const counts = new Map<string, number>();
    doctors.forEach((doctor) => {
      if (doctor.status !== "Actif") return;
      counts.set(doctor.speciality, (counts.get(doctor.speciality) ?? 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    const query = search.trim().toLowerCase();
    return doctors.filter((doctor) => {
      if (doctor.status !== "Actif") return false;
      if (!query) return true;
      return `${doctor.name} ${doctor.speciality}`.toLowerCase().includes(query);
    });
  }, [doctors, search]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    fetchDoctors(search ? { q: search } : undefined)
      .then((res) => {
        setDoctors(res.data.doctors || []);
        setError(null);
      })
      .catch((err: any) => {
        setDoctors([]);
        setError(err?.message ?? "Impossible de joindre le serveur.");
      })
      .finally(() => setLoading(false));
  };

  const handleSpecialityClick = (name: string) => {
    setSearch(name);
    setLoading(true);
    setError(null);
    fetchDoctors({ q: name })
      .then((res) => {
        setDoctors(res.data.doctors || []);
        setError(null);
      })
      .catch((err: any) => {
        setDoctors([]);
        setError(err?.message ?? "Impossible de joindre le serveur.");
      })
      .finally(() => setLoading(false));
  };

  // Debounced live search: query backend as the user types
  useEffect(() => {
    const q = search.trim();
    if (!q) return; // don't auto-fetch empty query
    const id = setTimeout(() => {
      setLoading(true);
      setError(null);
      fetchDoctors({ q })
        .then((res) => {
          setDoctors(res.data.doctors || []);
          setError(null);
        })
        .catch((err: any) => {
          setDoctors([]);
          setError(err?.message ?? "Impossible de joindre le serveur.");
        })
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(id);
  }, [search]);

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

  return (
    <div className="min-h-screen bg-background">
      <section
        ref={heroRef}
        className="relative overflow-hidden mx-3 mt-3 rounded-3xl"
        style={{ perspective: "1200px" }}
      >
        <div
          className="absolute inset-0 transition-transform duration-300 ease-out"
          style={{
            transform: `translate3d(${tilt.x * -30}px, ${tilt.y * -30}px, 0) scale(1.1)`,
          }}
        >
          <img
            src={heroBg}
          alt="Fond médical"
            className="h-full w-full object-cover"
            width={1920}
            height={1280}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/30 to-transparent" />
        </div>

        <div className="relative z-10">
          <nav className="flex items-center justify-between px-6 md:px-12 py-6">
            <div className="text-2xl font-semibold text-black tracking-tight">
              Uni<span className="font-light">care</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm text-black/70">
              <a href="#home" className="hover:text-black">Accueil</a>
              <a href="#specialities" className="hover:text-black">Spécialités</a>
              <Link to="/doctors" className="hover:text-black">Médecins</Link>
              <a href="#about" className="hover:text-black">À propos</a>
              <a href="#contact" className="hover:text-black">Contact</a>
            </div>
            <div className="flex items-center gap-2">
              {isLoggedIn && user ? (
                <Link
                  to={authStore.dashboardFor(user) as "/"}
                  className="text-sm px-4 py-2 rounded-full border border-black bg-black text-white hover:bg-slate-900 transition font-medium"
                >
                  Mon Espace
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm px-4 py-2 rounded-full border border-black/20 text-black hover:bg-black hover:text-white transition"
                  >
                    Connexion
                  </Link>
                  <a
                    href="#book"
                    className="text-sm px-4 py-2 rounded-full border border-black/20 text-black hover:bg-black hover:text-white transition"
                  >
                    Réserver
                  </a>
                </>
              )}
            </div>
          </nav>

          <div
            className="px-6 md:px-12 pt-16 pb-32 md:pt-28 md:pb-44 text-center transition-transform duration-300"
            style={{
              transform: `translate3d(${tilt.x * 15}px, ${tilt.y * 15}px, 0)`,
            }}
          >
            <p className="text-black/60 text-sm uppercase tracking-[0.3em] mb-6">
              Clinique · Béjaïa, Algérie
            </p>
            <h1 className="text-black font-light text-4xl md:text-6xl lg:text-7xl leading-[1.05] max-w-4xl mx-auto tracking-tight">
              Prenez rendez-vous avec des médecins de confiance à Béjaïa
            </h1>
            <p className="mt-6 text-black/70 max-w-xl mx-auto">
              Multiples spécialités. Vrais spécialistes. Une réservation simple.
            </p>

            <form
              id="book"
              onSubmit={handleSubmit}
              className="mt-10 max-w-3xl mx-auto flex flex-col md:flex-row gap-2 p-2 rounded-2xl bg-white/70 backdrop-blur-md border border-black/10 shadow-xl"
            >
              <div className="flex items-center gap-2 flex-1 px-4 py-3 rounded-xl bg-white/60">
                <Search className="h-4 w-4 text-black/50" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Spécialité ou médecin"
                  className="bg-transparent w-full text-black placeholder:text-black/50 outline-none text-sm"
                />
              </div>
              <button
                type="submit"
                style={{ backgroundColor: "#000", color: "#fff" }}
                id="landing-search-btn"
                className="px-8 py-3 rounded-xl bg-black text-white font-medium text-sm hover:bg-slate-900 transition"
              >
                Trouver un médecin
              </button>
            </form>
            {/* Suggestions dropdown (live results) */}
            {search.trim() && doctors.length > 0 && (
              <div className="mt-2 max-w-3xl mx-auto relative">
                <ul className="absolute left-0 right-0 z-50 rounded-xl border border-black/10 bg-white shadow-lg overflow-hidden">
                  {doctors.slice(0, 6).map((d) => (
                    <li key={d._id} className="px-4 py-3 hover:bg-slate-50 transition">
                      <Link to={`/doctors/${d._id}`} className="flex items-center justify-between">
                        <div className="text-sm text-black font-medium">{d.name}</div>
                        <div className="text-xs text-black/60">{d.speciality}</div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {error && (
              <div className="mt-3 max-w-3xl mx-auto text-sm text-red-600">{error}</div>
            )}
          </div>
        </div>
      </section>

      <section id="specialities" className="px-6 md:px-12 py-24 md:py-32 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">
            Nos spécialités
          </p>
          <h2 className="text-3xl md:text-5xl font-light tracking-tight text-foreground max-w-2xl mx-auto">
            Des soins dans chaque discipline
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-border rounded-2xl overflow-hidden">
          {generatedSpecialities.map((speciality, index) => {
            const Icon = specialityIcons[index % specialityIcons.length];
            return (
              <button
                type="button"
                key={speciality.name}
                onClick={() => handleSpecialityClick(speciality.name)}
                className="group bg-background hover:bg-secondary transition p-8 md:p-10 flex flex-col gap-4 text-left"
              >
                <Icon className="h-6 w-6 text-black/60" strokeWidth={1.5} />
                <div className="text-lg font-medium text-foreground">{speciality.name}</div>
                <div className="text-xs text-muted-foreground">
                  {speciality.count} médecin{speciality.count !== 1 ? "s" : ""}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section id="doctors" className="relative bg-[oklch(0.98_0.005_250)] overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(40px) saturate(1.1)",
          }}
        />
        <div className="relative">
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-24 md:py-32 grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-black/50 mb-4">
              Nos médecins
            </p>
            <h2 className="text-3xl md:text-5xl font-light tracking-tight text-black">
              Rencontrez les spécialistes derrière UniCare.
            </h2>
            <p className="mt-6 text-black/50 max-w-md">
              Plus de 40 médecins certifiés à Béjaïa, tous au même endroit.
            </p>
            <Link
              to="/doctors"
              className="mt-8 inline-flex items-center gap-2 text-sm text-black border-b border-black pb-1 hover:gap-3 transition-all"
            >
              Voir tous les médecins <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-[oklch(0.15_0.05_250)]">
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

        {/* Doctor cards removed from landing page — results live-fetched but rendered on the /doctors page */}
        </div>
      </section>

      <section id="about" className="px-6 md:px-12 py-24 md:py-32 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-12">
          {[
            { icon: Search, title: "Choisissez une spécialité", text: "Parcourez les médecins par domaine." },
            { icon: Calendar, title: "Choisissez un horaire", text: "Disponibilité en temps réel." },
            { icon: ShieldCheck, title: "Confirmez votre visite", text: "Confirmation instantanée." },
          ].map((step, i) => (
            <div key={step.title} className="flex flex-col gap-4">
              <div className="text-xs text-black/50">0{i + 1}</div>
              <step.icon className="h-6 w-6 text-[oklch(0.55_0.16_240)]" strokeWidth={1.5} />
              <div className="text-xl font-medium text-black">{step.title}</div>
              <div className="text-sm text-black/50">{step.text}</div>
            </div>
          ))}
        </div>
      </section>

      <section
        id="contact"
        className="relative mx-3 mb-3 rounded-3xl overflow-hidden px-6 md:px-12 py-20 md:py-28 text-center"
      >
        <div className="absolute inset-0 -z-10">
          <img src={heroBg} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/50 to-white/80" />
        </div>
        <h2 className="text-3xl md:text-5xl font-light text-black tracking-tight max-w-2xl mx-auto">
          Votre prochain rendez-vous est à un clic.
        </h2>
        <div className="mt-10 flex flex-col items-center justify-center gap-6">
          {(() => {
            const { user } = useAuth();
            return user ? (
              <Link
                to="/doctors"
                id="book-cta-btn"
                className="px-8 py-3 rounded-full bg-black text-white font-medium text-sm hover:bg-slate-900 transition"
              >
                Prendre rendez-vous
              </Link>
            ) : (
              <Link
                to="/login"
                search={{ redirect: "/doctors" }}
                id="book-cta-btn"
                className="px-8 py-3 rounded-full bg-black text-white font-medium text-sm hover:bg-slate-900 transition"
              >
                Prendre rendez-vous
              </Link>
            );
          })()}

          <div className="w-full max-w-xl rounded-2xl bg-white/60 p-6 shadow-soft flex flex-col items-center gap-1.5">
            <div className="text-lg font-bold text-black">{clinicName}</div>
            <div className="text-sm font-semibold text-black/70">{clinicPhone}</div>
            <div className="text-sm text-black/60">{clinicAddress}</div>
            <div className="text-xs text-black/50">{clinicEmail}</div>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-black/10 flex flex-col md:flex-row justify-between gap-4 text-sm text-black/60">
          <div>{clinicName} · Béjaïa, Algérie</div>
          <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> Ouvert dim–ven · 8h00–20h00</div>
        </div>
      </section>

      {/* Footer removed per design — contact info added in pre-footer section */}
    </div>
  );
}