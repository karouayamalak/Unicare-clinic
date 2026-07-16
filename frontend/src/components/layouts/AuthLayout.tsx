import { Link } from "@tanstack/react-router";
import { CheckCircle2, Lock } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "../brand/Logo";
import clinicHero from "../../assets/clinic-hero.png";
import { cn } from "@/lib/utils";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.12),_transparent_18%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.12),_transparent_24%),#f8fafc] px-0 py-0 lg:p-4">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-8 lg:grid-cols-[1fr_1.1fr] lg:rounded-[36px] lg:border lg:border-border/70 lg:bg-white/70 lg:shadow-[0_24px_80px_-30px_rgba(6,18,46,0.28)] lg:backdrop-blur-xl">
        <div className="relative flex flex-col justify-between overflow-hidden rounded-[32px] bg-white/80 border border-white/60 backdrop-blur-xl p-8 sm:p-10 lg:rounded-l-[36px]">
          <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/8 blur-[90px]" />
          <div className="pointer-events-none absolute -bottom-16 right-0 h-56 w-56 rounded-full bg-sky-600/10 blur-[70px]" />

          <div className="relative">
            <Logo size="sm" />
          </div>

          <div className="relative mx-auto w-full max-w-sm rounded-[28px] border border-border bg-white/70 p-6 shadow-[0_18px_55px_-28px_rgba(7,17,30,0.18)] backdrop-blur-xl sm:p-7">
            <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">{title}</h1>
            {subtitle && <p className="mt-2 text-sm leading-relaxed text-ink-soft">{subtitle}</p>}
            <div className="mt-7">{children}</div>
            {footer && <p className="mt-7 text-center text-sm text-ink-soft">{footer}</p>}
          </div>

          <div className="relative flex items-center gap-2 text-xs text-ink-soft/75">
            <Lock className="h-3 w-3" />
            <p>© {new Date().getFullYear()} UniCare · Données chiffrées AES-256</p>
          </div>
        </div>

        <div className="relative hidden overflow-hidden rounded-[32px] bg-white/10 border border-white/10 backdrop-blur-xl lg:flex lg:flex-col lg:justify-between lg:p-16 lg:rounded-r-[36px]">
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[#06122e]/5 blur-[120px]" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-sky-700/5 blur-[100px]" />

          <div className="relative flex justify-end">
            <Link
              to="/"
              className="rounded-full border border-border bg-white/70 px-4 py-2 text-xs font-semibold text-ink backdrop-blur-sm hover:bg-white transition shadow-[0_12px_40px_-24px_rgba(6,18,46,0.2)]"
            >
              ← Retour à l'accueil
            </Link>
          </div>

          <div className="relative flex justify-center">
            <img
              src={clinicHero}
              alt="Illustration médicale"
              className="h-72 w-auto rounded-[32px] object-contain opacity-95"
            />
          </div>

          <div className="relative">
            <blockquote className="text-3xl font-bold leading-snug text-ink xl:text-4xl">
              "Prendre soin de votre santé n'a jamais été aussi simple."
            </blockquote>
            <p className="mt-5 text-sm text-ink-soft">— Amina B., patiente · Béjaïa</p>

            <div className="mt-8 flex flex-col gap-3">
              {[
                "Données médicales chiffrées et sécurisées",
                "480+ spécialistes vérifiés à Béjaïa",
                "Support d'urgence 24h/24 — Protection Civile 14",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5 text-sm text-ink-soft font-medium">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-teal" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthField({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">{label}</span>
      <input
        {...props}
        className="mt-2 w-full rounded-full border border-border bg-white/85 p-3.5 text-sm text-ink placeholder:text-ink-soft/40 outline-none transition focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/15 shadow-[0_10px_28px_-18px_rgba(7,17,30,0.2)]"
      />
    </label>
  );
}

export function AuthButton({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base =
    "w-full cursor-pointer rounded-full bg-black py-3.5 text-sm font-bold text-white shadow-[0_16px_45px_-20px_rgba(0,0,0,0.35)] transition hover:-translate-y-0.5 hover:bg-slate-900 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <button {...props} className={cn(base, className)}>
      {children}
    </button>
  );
}
