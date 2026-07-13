import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { DashboardShell } from "../components/layouts/DashboardShell";
import { doctorNav } from "../lib/dashboard-nav";
import { authStore } from "../lib/authStore";

export const Route = createFileRoute("/doctor")({
  beforeLoad: () => {
    const user = authStore.user;
    if (!user) throw redirect({ to: "/login" });
    if (user.role?.toLowerCase() !== "doctor") throw redirect({ to: "/login" });
  },
  head: () => ({ meta: [{ title: "Espace Médecin — UniCare" }] }),
  component: () => (
    <DashboardShell role="Doctor" items={doctorNav}>
      <Outlet />
    </DashboardShell>
  ),
});
