import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Heart, Users, Award, Target } from "lucide-react";
import { Star, Clock } from "lucide-react";
import { Shield, Lightbulb, ArrowRight, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";
import { SectionHeading } from "../components/ui-ext/primitives";
import { stats } from "../lib/data";
export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Medicare" },
      {
        name: "description",
        content:
          "Our mission is to make healthcare calm, transparent, and effortlessly accessible.",
      },
    ],
  }),
  component: AboutRedirect,
});

function AboutRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    void navigate({ to: "/" });
  }, [navigate]);

  return null;
}

const values = [
  {
    icon: Heart,
    title: "Patient first",
    desc: "Every design decision starts with the person receiving care.",
  },
  {
    icon: Shield,
    title: "Uncompromising privacy",
    desc: "HIPAA-grade encryption, always. Your data belongs to you.",
  },
  {
    icon: Lightbulb,
    title: "Craft over shortcuts",
    desc: "We sweat the details clinicians and patients feel every day.",
  },
  {
    icon: Award,
    title: "Verified excellence",
    desc: "Only license-verified, continuously reviewed doctors on the platform.",
  },
];

const timeline = [
  {
    year: "2019",
    title: "Founded",
    desc: "Started by a team of physicians tired of broken scheduling software.",
  },
  {
    year: "2020",
    title: "First clinic onboarded",
    desc: "Nordic Clinic in Oslo became our first enterprise partner.",
  },
  {
    year: "2022",
    title: "Video visits launch",
    desc: "Encrypted HD consultations — 2M sessions in year one.",
  },
  {
    year: "2024",
    title: "120k+ patients",
    desc: "Expanded to 20 specialities across 14 countries.",
  },
];

function AboutPage() {
  return (
    <LayoutDashboard>
      {/* Hero */}
      <section className="bg-hero-gradient pb-20 pt-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-teal">
            <span className="h-1.5 w-4 rounded-full bg-teal" />
            About Medicare
          </p>
          <h1 className="mt-5 text-balance text-5xl font-semibold leading-tight tracking-tight text-ink sm:text-6xl">
            Building the calmer future{" "}
            <span className="font-display italic text-brand-gradient">of healthcare.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
            Medicare exists because booking a doctor should feel as effortless as calling a friend,
            and running a clinic should feel like flying a well-designed aircraft.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s: { value: string; label: string }, i: number) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="relative overflow-hidden rounded-2xl border border-border bg-white p-8 shadow-soft"
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-teal/5" />
              <p className="font-display text-5xl leading-none text-brand-gradient">{s.value}</p>
              <p className="mt-3 text-sm font-medium text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="bg-secondary/40 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading eyebrow="Our values" title="How we think about care." />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl border border-border bg-white p-7 shadow-soft"
              >
                <span className="inline-grid h-11 w-11 place-items-center rounded-xl bg-teal/10 text-teal">
                  <v.icon className="h-5 w-5" />
                </span>
                <p className="mt-5 text-base font-semibold text-ink">{v.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <SectionHeading eyebrow="Our story" title="Built over years, one patient at a time." />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {timeline.map((t, i) => (
            <motion.div
              key={t.year}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl border border-border bg-white p-7 shadow-soft"
            >
              <p className="font-display text-3xl text-brand-gradient">{t.year}</p>
              <p className="mt-4 text-base font-semibold text-ink">{t.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </LayoutDashboard>
  );
}
