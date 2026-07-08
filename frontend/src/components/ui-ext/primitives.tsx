import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className,
      )}
    >
      {eyebrow && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[oklch(0.18_0.06_250)]"
        >
          <span className="h-1.5 w-4 rounded-full bg-[oklch(0.18_0.06_250)]" />
          {eyebrow}
        </motion.p>
      )}
      <motion.h2
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-balance text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl"
      >
        {title}
      </motion.h2>
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-5 text-base leading-relaxed text-ink-soft"
        >
          {description}
        </motion.p>
      )}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-[24px] border border-border/70 bg-white/80 p-6 shadow-[0_18px_55px_-28px_rgba(7,17,30,0.18)] backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink-soft">{label}</p>
        {Icon && (
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[oklch(0.18_0.06_250/0.08)] text-[oklch(0.18_0.06_250)] border border-[oklch(0.18_0.06_250/0.15)]">
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-soft/70">{hint}</p>}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function GlassCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[24px] border border-border/70 bg-white/80 p-6 shadow-[0_18px_55px_-28px_rgba(7,17,30,0.18)] backdrop-blur-xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Placeholder({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-border/70 bg-white/70 p-10 text-center shadow-[0_18px_55px_-28px_rgba(7,17,30,0.18)] backdrop-blur-xl">
      <p className="text-2xl font-bold text-ink">{title}</p>
      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft/70">{description}</p>
      )}
      {children}
    </div>
  );
}

export function DefaultAvatar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-slate-100 flex items-end justify-center rounded-xl",
        className,
      )}
    >
      <svg
        className="w-4/5 h-4/5 text-slate-400 translate-y-1.5"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    </div>
  );
}
