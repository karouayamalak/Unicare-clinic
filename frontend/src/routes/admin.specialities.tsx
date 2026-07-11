import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-ext/primitives";
import { specialities } from "@/lib/data";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/admin/specialities")({
  component: AdminSpecialities,
});

function AdminSpecialities() {
  return (
    <div>
      <PageHeader
        title="Specialities"
        description="The clinical taxonomy patients see when booking."
        actions={
          <button className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">
            <Plus className="h-4 w-4" /> New speciality
          </button>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {specialities.map((s) => (
          <Link
            to="/specialities/$slug"
            params={{ slug: s.slug }}
            key={s.slug}
            className="rounded-3xl border border-border bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-glow"
          >
            <p className="font-semibold text-ink">{s.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {s.doctors ?? Math.floor(Math.random() * 14 + 6)} doctors
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
