import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ClipboardList } from "lucide-react";
import { motion } from "framer-motion";
import {
  Clock,
  Zap,
  ShieldCheck,
  MessageSquare,
  CalendarCheck,
  Lock,
  Globe,
  Activity,
  LayoutDashboard,
} from "lucide-react";
export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — UniCare" },
      {
        name: "description",
        content: "Video visits, digital records, instant booking, secure messaging and more.",
      },
    ],
  }),
  component: ServicesRedirect,
});

function ServicesRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    void navigate({ to: "/" });
  }, [navigate]);

  return null;
}

const services = [
  // Video consultations removed per request
  {
    icon: ClipboardList,
    title: "Digital medical records",
    desc: "Every prescription, test result and visit note in one secure, searchable home.",
    badge: null,
  },
  {
    icon: Zap,
    title: "Instant booking",
    desc: "Real-time slots with confirmation in under 60 seconds. No phone calls.",
    badge: null,
  },
  {
    icon: ShieldCheck,
    title: "Verified specialists",
    desc: "License-verified, board-certified, peer-reviewed doctors. Only.",
    badge: null,
  },
  {
    icon: MessageSquare,
    title: "Secure messaging",
    desc: "Follow up with your care team without another visit or waiting room.",
    badge: null,
  },
  {
    icon: CalendarCheck,
    title: "Smart reminders",
    desc: "Never miss a medication, refill or check-up with intelligent nudges.",
    badge: null,
  },
];

const pillars = [
  {
    icon: Clock,
    label: "Same-day availability",
    desc: "97% of doctors have open slots within 24 hours.",
  },
  { icon: Globe, label: "14 countries", desc: "Care that travels with you, wherever you are." },
  {
    icon: Lock,
    label: "Zero data resale",
    desc: "Your health data is never sold or shared. Period.",
  },
  {
    icon: Activity,
    label: "99.9% uptime",
    desc: "Infrastructure built for the demands of modern care.",
  },
];

function ServicesPage() {
  return (
    <LayoutDashboard>
      {/* Hero */}
      <section className="px-6 pb-20 pt-24">
        <div className="hero-panel mx-auto max-w-5xl px-8 py-14 text-center sm:px-12 lg:px-16">
          <p className="landing-pill mx-auto">
            <span className="h-1.5 w-4 rounded-full bg-primary" />
            Services
          </p>
          <h1 className="mt-6 text-balance text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl lg:text-6xl">
            A complete care stack for modern clinics.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Everything a modern clinic and its patients need — designed with restraint and built to
            last.
          </p>
        </div>
      </section>

      {/* Services grid */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="landing-card group relative overflow-hidden p-8 transition duration-300 hover:-translate-y-1 hover:shadow-elevated"
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-teal/6 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
              {s.badge && (
                <span className="mb-5 inline-block rounded-full bg-teal/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-teal">
                  {s.badge}
                </span>
              )}
              <span className="inline-grid h-11 w-11 place-items-center rounded-xl bg-teal/10 text-teal">
                <s.icon className="h-5 w-5" />
              </span>
              <p className="mt-5 text-base font-semibold text-ink">{s.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pillars strip */}
      <section className="bg-secondary/40 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((p, i) => (
              <motion.div
                key={p.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="landing-card flex items-start gap-4 p-6"
              >
                <span className="mt-0.5 inline-grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/8 text-primary">
                  <p.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{p.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{p.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </LayoutDashboard>
  );
}
