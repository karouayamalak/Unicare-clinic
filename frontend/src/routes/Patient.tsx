import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashboardShell } from "../components/layouts/DashboardShell";
import { patientNav } from "../lib/dashboard-nav";

export const Route = createFileRoute("/Patient")({
  head: () => ({ meta: [{ title: "Patient dashboard — UniCare" }] }),
  component: () => (
    <DashboardShell role="Patient" items={patientNav}>
      <Outlet />
    </DashboardShell>
  ),
});
