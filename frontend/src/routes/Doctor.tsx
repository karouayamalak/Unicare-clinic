import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashboardShell } from "../components/layouts/DashboardShell";
import { doctorNav } from "../lib/dashboard-nav";

export const Route = createFileRoute("/Doctor")({
  head: () => ({ meta: [{ title: "Doctor portal — UniCare" }] }),
  component: () => (
    <DashboardShell role="Doctor" items={doctorNav}>
      <Outlet />
    </DashboardShell>
  ),
});
