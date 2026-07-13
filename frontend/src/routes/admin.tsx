import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { DashboardShell } from "../components/layouts/DashboardShell";
import { adminNav } from "../lib/dashboard-nav";
import { authStore } from "../lib/authStore";

export const Route = createFileRoute("/admin")({
  beforeLoad: () => {
    const user = authStore.user;
    if (!user) throw redirect({ to: "/login" });
    if (user.role?.toLowerCase() !== "admin") throw redirect({ to: "/login" });
  },
  head: () => ({ meta: [{ title: "Administration — UniCare" }] }),
  component: () => (
    <DashboardShell role="Admin" items={adminNav}>
      <Outlet />
    </DashboardShell>
  ),
});
