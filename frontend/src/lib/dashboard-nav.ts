import {
  Activity,
  BadgeCheck,
  Bell,
  Building2,
  Calendar,
  CalendarDays,
  ClipboardList,
  FileText,
  Heart,
  LayoutDashboard,
  MessageSquare,
  Pill,
  Settings,
  Star,
  Stethoscope,
  User,
  Users,
} from "lucide-react";
import type { DashNavItem } from "../components/layouts/DashboardShell";

export const patientNav: DashNavItem[] = [
  { to: "/patient", label: "Aperçu", icon: LayoutDashboard },
  { to: "/patient/appointments", label: "Rendez-vous", icon: CalendarDays },
  { to: "/patient/favorites", label: "Médecins favoris", icon: Heart },
  { to: "/patient/medical", label: "Dossier médical", icon: Activity },
  { to: "/patient/documents", label: "Documents", icon: FileText },
  { to: "/patient/notifications", label: "Notifications", icon: Bell },
  { to: "/patient/profile", label: "Mon Profil", icon: User },
  { to: "/patient/settings", label: "Paramètres", icon: Settings },
];

export const doctorNav: DashNavItem[] = [
  { to: "/doctor", label: "Aperçu", icon: LayoutDashboard },
  { to: "/doctor/schedule", label: "Mon Calendrier", icon: Calendar },
  { to: "/doctor/appointments", label: "Consultations", icon: CalendarDays },
  { to: "/doctor/patients", label: "Mes Patients", icon: Users },
  { to: "/doctor/notes", label: "Notes Médicales", icon: ClipboardList },
  { to: "/doctor/prescriptions", label: "Prescriptions", icon: Pill },
  { to: "/doctor/analytics", label: "Analyses", icon: Activity },
  { to: "/doctor/settings", label: "Paramètres", icon: Settings },
];

export const adminNav: DashNavItem[] = [
  { to: "/admin", label: "Aperçu", icon: LayoutDashboard },
  { to: "/admin/doctors", label: "Médecins", icon: Stethoscope },
  { to: "/admin/patients", label: "Patients", icon: Users },
  { to: "/admin/appointments", label: "Rendez-vous", icon: CalendarDays },
  { to: "/admin/logs", label: "Logs", icon: Activity },
  { to: "/admin/departments", label: "Départements", icon: Building2 },
  { to: "/admin/specialities", label: "Spécialités", icon: BadgeCheck },
  { to: "/admin/reviews", label: "Avis & Notes", icon: Star },
  { to: "/admin/settings", label: "Paramètres", icon: Settings },
];
