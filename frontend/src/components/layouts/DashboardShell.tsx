import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, LogOut, Menu, Search, Settings, X, User, type LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import { authStore, useAuth } from "@/lib/authStore";

export interface DashNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

interface Props {
  role: "Patient" | "Doctor" | "Admin";
  items: DashNavItem[];
  children: ReactNode;
}

const roleConfig: Record<string, { badge: string; label: string; settingsTo: string }> = {
  Patient: {
    badge: "bg-primary text-white",
    label: "Espace Patient",
    settingsTo: "/patient/settings",
  },
  Doctor: {
    // use primary for consistent branding across dashboards
    badge: "bg-primary text-white",
    label: "Espace Médecin",
    settingsTo: "/doctor/settings",
  },
  Admin: {
    // admins use primary as well to keep a unified visual language
    badge: "bg-primary text-white",
    label: "Administration",
    settingsTo: "/admin/settings",
  },
};

export function DashboardShell({ role, items, children }: Props) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const nav = useNavigate();
  const { user } = useAuth();

  const handleLogout = () => {
    authStore.logout();
    nav({ to: "/login" });
  };

  const cfg = roleConfig[role];

  // Real user data — fallback to role-based defaults when not available
  const userName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Utilisateur"
    : role === "Doctor"
      ? "Dr. Médecin"
      : role === "Admin"
        ? "Administrateur"
        : "Patient";
  const userEmail = user?.email ?? `${role.toLowerCase()}@unicare.dz`;
  const initials = user
    ? [user.firstName?.[0], user.lastName?.[0]].filter(Boolean).join("").toUpperCase() || user.email[0].toUpperCase()
    : role[0].toUpperCase();

  return (
    <div className="relative flex min-h-dvh overflow-hidden bg-scene">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-primary/8 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-sky-400/10 blur-[120px]" />
      </div>

      {/* ── Glass Sidebar ── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 flex flex-col glass-strong transition-transform duration-300",
          "lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0",
          mobileOpen ? "translate-x-0 shadow-elevated" : "-translate-x-full",
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <Logo size="sm" />
        </div>

        {/* User card — shows real logged-in user */}
        <div className="px-4 py-4 border-b border-border">
          <div className="flex items-center gap-3 rounded-[18px] border border-border/60 bg-white/70 px-3 py-2.5 shadow-[0_12px_35px_-20px_rgba(7,17,30,0.2)]">
            {user?.image ? (
              <img
                src={user.image}
                alt={userName}
                className="h-9 w-9 shrink-0 rounded-lg object-cover border border-border/60"
              />
            ) : (
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500 border border-slate-200">
                <User className="h-4.5 w-4.5" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">{userName}</p>
              <p className="truncate text-[10px] text-ink-soft/70">{userEmail}</p>
            </div>
          </div>
        </div>

        {/* Role label */}
        <div className="px-5 pt-4 pb-1">
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-ink-soft/50">
            {cfg.label}
          </p>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <ul className="space-y-0.5">
            {items.map((item) => {
              const active =
                pathname === item.to || (item.to !== items[0].to && pathname.startsWith(item.to));
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-full px-3.5 py-2.5 text-sm font-semibold transition",
                      active
                        ? "bg-[#06122e] text-white shadow-[0_12px_35px_-18px_rgba(6,18,46,0.45)]"
                        : "text-ink-soft hover:bg-white/85 hover:text-ink",
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sign out */}
        <div className="border-t border-border p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded px-3.5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Main content ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Glass top bar */}
        <header className="sticky top-0 z-30 border-b border-border/70 bg-white/75 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            {/* Mobile menu toggle */}
            <button
              aria-label="Toggle sidebar"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="grid h-9 w-9 place-items-center rounded-full border border-border/70 bg-white/85 text-ink shadow-[0_10px_28px_-18px_rgba(7,17,30,0.2)] transition hover:bg-white lg:hidden cursor-pointer"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>

            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
              <input
                placeholder="Rechercher…"
                className="w-full rounded-full border border-border/70 bg-white/85 py-2 pl-9 pr-4 text-sm text-ink placeholder:text-ink-soft/50 shadow-[0_10px_28px_-18px_rgba(7,17,30,0.2)] transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10"
              />
            </div>

            <div className="ml-auto flex items-center gap-2">
              {/* Notifications */}
              <div className="relative">
                <button
                  aria-label="Notifications"
                  onClick={() => setShowNotif(!showNotif)}
                  className="relative grid h-9 w-9 place-items-center rounded-full border border-border/70 bg-white/85 text-ink hover:bg-white transition cursor-pointer shadow-[0_10px_28px_-18px_rgba(7,17,30,0.2)]"
                >
                  <Bell className="h-4 w-4 text-ink-soft" />
                  <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-sky-500" />
                </button>
                {showNotif && (
                  <div className="absolute right-0 top-11 w-72 rounded-2xl border border-border bg-white shadow-elevated z-50 overflow-hidden">
                    <div className="border-b border-border px-4 py-3 flex items-center justify-between">
                      <p className="text-sm font-bold text-ink">Notifications</p>
                      <button
                        onClick={() => setShowNotif(false)}
                        className="text-ink-soft hover:text-ink cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <ul className="divide-y divide-border">
                      {[
                        {
                          msg: "Nouveau rendez-vous confirmé",
                          time: "Il y a 5 min",
                          dot: "bg-teal",
                        },
                        {
                          msg: "Rappel : consultation à 14h30",
                          time: "Il y a 1h",
                          dot: "bg-amber-500",
                        },
                        {
                          msg: "Ordonnance disponible à télécharger",
                          time: "Il y a 3h",
                          dot: "bg-primary",
                        },
                      ].map((n, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition cursor-pointer"
                        >
                          <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.dot)} />
                          <div>
                            <p className="text-xs font-semibold text-ink">{n.msg}</p>
                            <p className="text-[10px] text-ink-soft mt-0.5">{n.time}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="border-t border-border px-4 py-2.5 text-center">
                      <button
                        onClick={() => setShowNotif(false)}
                        className="text-xs font-bold text-primary hover:underline cursor-pointer"
                      >
                        Marquer tout comme lu
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Settings — links to role settings */}
              <Link
                to={cfg.settingsTo as "/"}
                aria-label="Paramètres"
                className="grid h-9 w-9 place-items-center rounded-full border border-border/70 bg-white/85 text-ink hover:bg-white transition cursor-pointer shadow-[0_10px_28px_-18px_rgba(7,17,30,0.2)]"
              >
                <Settings className="h-4 w-4 text-ink-soft" />
              </Link>

              {/* Avatar with real picture or fallback */}
              {user?.image ? (
                <img
                  src={user.image}
                  alt={userName}
                  className="h-9 w-9 object-cover rounded-2xl border border-border/70 shadow-sm"
                />
              ) : (
                <div className="grid h-9 w-9 place-items-center rounded-2xl border border-border/70 bg-slate-100 text-slate-500 shadow-sm">
                  <User className="h-4.5 w-4.5" />
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
