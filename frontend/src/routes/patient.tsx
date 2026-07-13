import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { DashboardShell } from "../components/layouts/DashboardShell";
import { patientNav } from "../lib/dashboard-nav";
import { authStore } from "../lib/authStore";

export const Route = createFileRoute("/patient")({
  beforeLoad: () => {
    const user = authStore.user;
    if (!user) throw redirect({ to: "/login" });
    if (user.role?.toLowerCase() !== "patient") throw redirect({ to: "/login" });
  },
  head: () => ({ meta: [{ title: "Espace Patient — UniCare" }] }),
  component: () => (
    <DashboardShell role="Patient" items={patientNav}>
      <Outlet />
    </DashboardShell>
  ),
});
