import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X, Phone, ArrowRight } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import { useAuth, authStore } from "@/lib/authStore";

const nav = [
  { to: "/", label: "Accueil" },
  { to: "/specialities", label: "Spécialités" },
  { to: "/doctors", label: "Médecins" },
] as const;

export function MarketingLayout({ children }: { children: ReactNode }) {
  const { user, isLoggedIn } = useAuth();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="relative min-h-dvh bg-scene">
      {/* ── Emergency strip ── */}
      <div className="relative z-50 glass px-4 py-2 text-center text-xs text-ink-soft">
        <span className="inline-flex items-center gap-2">
          <Phone className="h-3 w-3 text-sky-600" />
          Urgence Médicale — Protection Civile&nbsp;
          <a href="tel:14" className="font-bold text-ink hover:text-sky-600 transition">
            14
          </a>
          &nbsp;·&nbsp;
          <a href="tel:+21334123456" className="font-bold text-ink hover:text-sky-600 transition">
            +213 (0)34 12 34 56
          </a>
        </span>
      </div>

      {/* ── Glass Navbar ── */}
      <header className="sticky top-0 z-50 glass">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Logo />

          {/* Desktop links */}
          <ul className="hidden items-center gap-1 lg:flex">
            {nav.map((n) => {
              const active = pathname === n.to || (n.to !== "/" && pathname.startsWith(n.to));
              return (
                <li key={n.to}>
                  <Link
                    to={n.to}
                    className={cn(
                      "rounded-full px-3.5 py-2 text-sm font-semibold transition",
                      active
                        ? "bg-primary text-white"
                        : "text-ink-soft hover:bg-white/80 hover:text-ink",
                    )}
                  >
                    {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Desktop CTA */}
          <div className="hidden items-center gap-2.5 lg:flex">
            {isLoggedIn && user ? (
              <Link
                to={authStore.dashboardFor(user) as "/"}
                className="group inline-flex items-center gap-1.5 rounded-full bg-[oklch(0.18_0.06_250)] px-4 py-2.5 text-sm font-bold text-white shadow-[0_16px_45px_-20px_rgba(7,17,30,0.35)] transition hover:-translate-y-0.5 hover:bg-[oklch(0.2_0.06_250)]"
              >
                Mon Espace ({user.firstName})
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-full px-4 py-2 text-sm font-semibold text-ink-soft hover:text-ink transition"
                >
                  Connexion
                </Link>
                <Link
                  to="/signup"
                  className="group inline-flex items-center gap-1.5 rounded-full bg-[oklch(0.18_0.06_250)] px-4 py-2 text-sm font-semibold text-white shadow-[0_16px_45px_-20px_rgba(7,17,30,0.35)] transition hover:-translate-y-0.5 hover:bg-[oklch(0.2_0.06_250)]"
                >
                  Commencer
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-white/70 text-ink shadow-[0_10px_28px_-18px_rgba(7,17,30,0.2)] lg:hidden cursor-pointer"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="border-t border-border bg-white/80 backdrop-blur-xl px-4 pb-4 lg:hidden">
            <ul className="mt-2 grid gap-0.5">
              {nav.map((n) => (
                <li key={n.to}>
                  <Link
                    to={n.to}
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-4 py-3 text-sm font-semibold text-ink-soft hover:bg-white/60 hover:text-ink transition"
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
              {isLoggedIn && user ? (
                <div className="mt-3 border-t border-border pt-3">
                  <Link
                    to={authStore.dashboardFor(user) as "/"}
                    onClick={() => setOpen(false)}
                    className="block rounded bg-[#06122e] py-2.5 text-center text-sm font-semibold text-white shadow-sm"
                  >
                    Mon Espace ({user.firstName})
                  </Link>
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3">
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="rounded-xl border border-border bg-white/50 py-2.5 text-center text-sm font-semibold text-ink-soft"
                  >
                    Connexion
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setOpen(false)}
                    className="rounded-xl bg-primary py-2.5 text-center text-sm font-semibold text-white"
                  >
                    Commencer
                  </Link>
                </div>
              )}
            </ul>
          </div>
        )}
      </header>

      <main>{children}</main>
      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-white/30">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-soft">
              La plateforme de santé de référence à Béjaïa — réservez vos médecins, gérez vos
              rendez-vous et accédez à votre dossier médical en toute sécurité.
            </p>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="mt-5 flex max-w-xs overflow-hidden rounded-xl border border-border bg-white/60 backdrop-blur-sm"
            >
              <input
                type="email"
                placeholder="votre@email.com"
                className="flex-1 bg-transparent px-4 py-2.5 text-sm text-ink placeholder:text-ink-soft/40 focus:outline-none"
              />
              <button className="shrink-0 border-l border-border bg-[oklch(0.18_0.06_250)] px-4 py-2.5 text-xs font-bold text-white hover:bg-[oklch(0.2_0.06_250)] transition cursor-pointer">
                S'abonner
              </button>
            </form>
          </div>

          <FooterCol
            title="Plateforme"
            links={[
              { to: "/doctors", label: "Trouver un médecin" },
              { to: "/specialities", label: "Spécialités" },
              { to: "/signup", label: "Rejoindre Unicare" },
            ]}
          />
          <FooterCol
            title="Prestataires"
            links={[
              { to: "/doctor", label: "Portail médecin" },
              { to: "/admin", label: "Portail admin" },
              { to: "/login", label: "Se connecter" },
            ]}
          />
          <FooterCol
            title="Compte"
            links={[
              { to: "/login", label: "Se connecter" },
              { to: "/signup", label: "Créer un compte" },
              { to: "/forgot-password", label: "Mot de passe oublié" },
              { to: "/patient", label: "Espace patient" },
            ]}
          />
        </div>
      </div>

      <div className="border-t border-border bg-white/50">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-5 text-xs text-ink-soft sm:flex-row">
          <p>© {new Date().getFullYear()} Unicare · Tous droits réservés</p>
          <div className="flex gap-5 font-semibold">
            {["Confidentialité", "CGU", "Sécurité", "RGPD"].map((t) => (
              <span key={t} className="cursor-pointer hover:text-ink transition">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-ink">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link to={l.to} className="text-sm text-ink-soft transition hover:text-ink">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
