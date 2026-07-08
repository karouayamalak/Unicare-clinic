import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import heroBg from "../assets/hero-bg.jpg";
import doctorPortrait from "../assets/doctor-portrait.jpg";
import { getJson } from "../lib/api";
import {
  Heart,
  Brain,
  Baby,
  Bone,
  Eye,
  Stethoscope,
  Search,
  MapPin,
  ArrowRight,
  Calendar,
  ShieldCheck,
  Clock,
} from "lucide-react";

export const Route = createFileRoute("/Index")({
  component: Index,
});

const specialities = [
  { icon: Heart, name: "Cardiologie" },
  { icon: Brain, name: "Neurologie" },
  { icon: Baby, name: "Pédiatrie" },
  { icon: Bone, name: "Orthopédie" },
  { icon: Eye, name: "Ophtalmologie" },
  { icon: Stethoscope, name: "Médecine générale" },
];

interface DoctorCard {
  _id?: string;
  name: string;
  specialty: string;
  experienceYears: number;
  location: string;
  bio?: string;
}

function Index() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [doctors, setDoctors] = useState<DoctorCard[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

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

  useEffect(() => {
    let ignore = false;
    const loadDoctors = async () => {
      try {
        const data = await getJson("/doctors");
        if (!ignore) {
          setDoctors(data.doctors ?? []);
        }
      } catch {
        if (!ignore) {
          setDoctors([]);
        }
      } finally {
        if (!ignore) {
          setLoadingDoctors(false);
        }
      }
    };

    loadDoctors();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-transparent">
      <section
        ref={heroRef}
        className="hero-panel relative mx-3 mt-3 overflow-hidden"
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
          <div className="absolute inset-0 bg-linear-to-b from-[oklch(0.15_0.05_250/0.55)] via-[oklch(0.15_0.05_250/0.3)] to-[oklch(0.1_0.04_250/0.85)]" />
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
            className="px-6 md:px-12 pt-16 pb-32 md:pt-28 md:pb-44 text-center transition-transform duration-300"
            style={{
              transform: `translate3d(${tilt.x * 15}px, ${tilt.y * 15}px, 0)`,
            }}
          >
            <p className="text-white/70 text-sm uppercase tracking-[0.3em] mb-6">
              Clinique · Béjaïa, Algérie
            </p>
            <h1 className="text-white font-light text-4xl md:text-6xl lg:text-7xl leading-[1.05] max-w-4xl mx-auto tracking-tight">
              Prenez rendez-vous avec des médecins de confiance à Béjaïa
            </h1>
            <p className="mt-6 text-white/75 max-w-xl mx-auto">
              Multiples spécialités. Vrais spécialistes. Une réservation simple.
            </p>

            <form
              id="book"
              onSubmit={(e) => e.preventDefault()}
              className="mx-auto mt-10 flex max-w-3xl flex-col gap-2 rounded-[24px] border border-white/20 bg-white/15 p-2 backdrop-blur-lg md:flex-row"
            >
              <div className="flex items-center gap-2 flex-1 px-4 py-3 rounded-xl bg-white/5">
                <Search className="h-4 w-4 text-white/60" />
                <input
                  placeholder="Spécialité ou médecin"
                  className="bg-transparent w-full text-white placeholder:text-white/50 outline-none text-sm"
                />
              </div>
              <div className="flex items-center gap-2 flex-1 px-4 py-3 rounded-xl bg-white/5">
                <MapPin className="h-4 w-4 text-white/60" />
                <input
                  placeholder="Quartier à Béjaïa"
                  className="bg-transparent w-full text-white placeholder:text-white/50 outline-none text-sm"
                />
              </div>
              <button className="px-8 py-3 rounded-xl bg-white text-[oklch(0.18_0.06_250)] font-medium text-sm hover:bg-white/90 transition">
                Trouver un médecin
              </button>
            </form>
          </div>
        </div>
      </section>

      <section id="specialities" className="mx-auto max-w-6xl px-6 py-24 md:px-12 md:py-32">
        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">
            Nos spécialités
          </p>
          <h2 className="text-3xl md:text-5xl font-light tracking-tight text-foreground max-w-2xl mx-auto">
            Des soins dans chaque discipline
          </h2>
        </div>
        <div className="landing-card grid grid-cols-2 gap-px overflow-hidden rounded-[24px] bg-border md:grid-cols-3">
          {specialities.map((s) => (
            <div
              key={s.name}
              className="group bg-background hover:bg-secondary transition p-8 md:p-10 flex flex-col gap-4 cursor-pointer"
            >
              <s.icon className="h-6 w-6 text-[oklch(0.55_0.16_240)]" strokeWidth={1.5} />
              <div className="text-lg font-medium text-foreground">{s.name}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition">
                Voir les médecins <ArrowRight className="h-3 w-3" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        id="doctors"
        className="mx-3 rounded-[28px] border border-slate-200/70 bg-white/70 px-3 py-6 shadow-[0_20px_60px_-30px_rgba(7,17,30,0.25)] backdrop-blur-xl md:px-6 md:py-8"
      >
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-3 py-16 md:grid-cols-2 md:gap-20 md:px-6 md:py-24">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">
              Nos médecins
            </p>
            <h2 className="text-3xl md:text-5xl font-light tracking-tight text-foreground">
              Rencontrez les spécialistes derrière UniCare.
            </h2>
            <p className="mt-6 text-muted-foreground max-w-md">
              Plus de 40 médecins certifiés à Béjaïa, tous au même endroit.
            </p>
            <a
              href="#"
              className="mt-8 inline-flex items-center gap-2 text-sm text-foreground border-b border-foreground pb-1 hover:gap-3 transition-all"
            >
              Voir tous les médecins <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="relative aspect-4/5 rounded-2xl overflow-hidden bg-[oklch(0.15_0.05_250)]">
            <img
              src={doctorPortrait}
              alt="Spécialiste UniCare"
              className="h-full w-full object-cover"
              loading="lazy"
              width={1024}
              height={1024}
            />
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-linear-to-t from-black/70 to-transparent">
              <div className="text-white font-medium">Dr. Karim Belkacem</div>
              <div className="text-white/70 text-sm">Cardiologue · 15+ ans</div>
            </div>
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl gap-6 px-3 pb-16 md:grid-cols-3 md:px-6 md:pb-24">
          {loadingDoctors ? (
            <div className="col-span-full text-center text-sm text-muted-foreground">Chargement des médecins…</div>
          ) : doctors.length === 0 ? (
            <div className="col-span-full text-center text-sm text-muted-foreground">Aucun médecin disponible pour le moment.</div>
          ) : (
            doctors.map((d) => (
              <div
                key={d._id ?? d.name}
                className="rounded-[22px] border border-slate-200/80 bg-white/85 p-6 shadow-[0_18px_45px_-24px_rgba(7,17,30,0.25)] transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="h-12 w-12 rounded-full bg-[oklch(0.55_0.16_240/0.1)] flex items-center justify-center text-[oklch(0.55_0.16_240)] font-medium">
                  {d.name.split(" ").slice(-1)[0][0]}
                </div>
                <div className="mt-6 font-medium text-foreground">{d.name}</div>
                <div className="text-sm text-muted-foreground">{d.specialty}</div>
                <div className="mt-4 text-xs text-muted-foreground">{d.experienceYears} ans d&apos;expérience · {d.location}</div>
                {d.bio ? <div className="mt-3 text-sm text-muted-foreground">{d.bio}</div> : null}
              </div>
            ))
          )}
        </div>
      </section>

      <section id="about" className="mx-auto max-w-6xl px-6 py-24 md:px-12 md:py-32">
        <div className="grid md:grid-cols-3 gap-12">
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
        <h2 className="text-3xl md:text-5xl font-light text-white tracking-tight max-w-2xl mx-auto">
          Votre prochain rendez-vous est à un clic.
        </h2>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            to="/login"
            search={{ redirect: "/doctors" }}
            className="px-8 py-3 rounded-full bg-white text-[oklch(0.18_0.06_250)] font-medium text-sm hover:bg-white/90 transition"
          >
            Prendre rendez-vous
          </Link>
          <Link
            to="/doctors"
            className="px-8 py-3 rounded-full border border-white/30 text-white text-sm hover:bg-white/10 transition"
          >
            Parcourir les médecins
          </Link>
        </div>
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between gap-4 text-sm text-white/60">
          <div>UniCare Clinique · Béjaïa, Algérie</div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" /> Ouvert dim–ven · 8h00–20h00
          </div>
        </div>
      </section>
    </div>
  );
}
