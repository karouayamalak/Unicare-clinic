import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashboardShell } from "../components/layouts/DashboardShell";
import { adminNav } from "../lib/dashboard-nav";

export const Route = createFileRoute("/Admin")({
  head: () => ({ meta: [{ title: "Admin console — Medicare" }] }),
  component: () => (
    <DashboardShell role="Admin" items={adminNav}>
      <Outlet />
    </DashboardShell>
  ),
});
