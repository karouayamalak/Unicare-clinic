import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import React from "react";
import { Mail } from "lucide-react";
import { Phone, MapPin, Clock, ArrowRight, LayoutDashboard } from "lucide-react";
import { SectionHeading } from "@/components/ui-ext/primitives";
import { toast } from "sonner";
import { motion } from "framer-motion";
export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Medicare" },
      { name: "description", content: "Get in touch with the Medicare team." },
    ],
  }),
  component: ContactRedirect,
});

function ContactRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    void navigate({ to: "/" });
  }, [navigate]);

  return null;
}

const contacts = [
  {
    icon: Mail,
    title: "Email us",
    value: "contact@medicare-bejaia.dz",
    sub: "We respond within 24 hours",
  },
  {
    icon: Phone,
    title: "Call us",
    value: "+213 (0) 34 12 34 56",
    sub: "Sat – Thu, 8am – 5pm",
  },
  {
    icon: MapPin,
    title: "Visit us",
    value: "Boulevard de la Soummam",
    sub: "Béjaïa, Algeria 06000",
  },
  {
    icon: Clock,
    title: "Emergency line",
    value: "14 / 1548",
    sub: "Protection Civile & Police Assistance",
  },
];

function ContactPage() {
  return (
    <LayoutDashboard>
      {/* Hero */}
      <section className="bg-hero-gradient pb-16 pt-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <SectionHeading
            eyebrow="Contact"
            title={
              <>
                We'd love to <span className="font-display italic">hear from you.</span>
              </>
            }
            description="For sales, partnerships or clinical questions — our team responds within 24 hours."
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
          {/* Contact info */}
          <div className="space-y-4">
            {contacts.map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="flex items-start gap-4 rounded-2xl border border-border bg-white p-5 shadow-soft"
              >
                <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal/10 text-teal">
                  <c.icon className="h-4.5 w-4.5" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {c.title}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-ink">{c.value}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{c.sub}</p>
                </div>
              </motion.div>
            ))}

            {/* Map placeholder */}
            <div className="mt-2 overflow-hidden rounded-2xl border border-border bg-secondary/40 p-6 text-center shadow-soft">
              <div className="flex h-32 items-center justify-center">
                <div className="text-center">
                  <MapPin className="mx-auto h-8 w-8 text-teal/40" />
                  <p className="mt-2 text-sm font-medium text-muted-foreground">
                    Boulevard de la Soummam, Béjaïa
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, x: 12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("Message sent — we'll get back within 24 hours.");
            }}
            className="rounded-2xl border border-border bg-white p-8 shadow-soft"
          >
            <h2 className="text-lg font-semibold text-ink">Send a message</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Fill out the form and we'll be in touch soon.
            </p>

            <div className="mt-7 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="First name" placeholder="Sarah" />
                <Field label="Last name" placeholder="Chen" />
              </div>
              <Field label="Email" type="email" placeholder="you@clinic.com" />
              <Field label="Subject" placeholder="Partnership inquiry" />
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Message
                </label>
                <textarea
                  rows={4}
                  placeholder="Tell us about your clinic or question…"
                  className="mt-2 w-full rounded-xl border border-border bg-secondary/40 p-4 text-sm leading-relaxed placeholder:text-muted-foreground/60 focus:border-teal focus:bg-white focus:outline-none transition"
                />
              </div>
              <button className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-soft transition hover:opacity-90 active:scale-[0.99]">
                Send message
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </motion.form>
        </div>
      </section>
    </LayoutDashboard>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <input
        {...props}
        className="mt-2 w-full rounded-xl border border-border bg-secondary/40 p-3 text-sm placeholder:text-muted-foreground/60 focus:border-teal focus:bg-white focus:outline-none transition"
      />
    </div>
  );
}
