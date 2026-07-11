import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui-ext/primitives";
import { fetchActionLogs, type ApiActionLog } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/logs")({
  component: AdminLogs,
});

function AdminLogs() {
  const [logs, setLogs] = useState<ApiActionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Doctor,Patient");

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await fetchActionLogs({ actorRole: filter, limit: 100 });
      setLogs(res.data.logs);
    } catch (error) {
      console.error(error);
      toast.error("Impossible de charger les logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [filter]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Journal d'activité"
        description="Visualisez les actions récentes des médecins et des patients."
        actions={
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Médecins + Patients", value: "Doctor,Patient" },
              { label: "Médecins uniquement", value: "Doctor" },
              { label: "Patients uniquement", value: "Patient" },
              { label: "Tous les rôles", value: "Doctor,Patient,Admin" },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setFilter(item.value)}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                  filter === item.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-white text-ink hover:bg-slate-50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="overflow-x-auto rounded-3xl border border-border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Utilisateur</th>
              <th className="px-4 py-3">Rôle</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Objet</th>
              <th className="px-4 py-3">Détails</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Chargement des logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Aucun log trouvé.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id} className="hover:bg-slate-50">
                  <td className="px-4 py-4 text-xs text-slate-600">
                    {new Date(log.createdAt).toLocaleString("fr-FR")}
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-900">{log.actorName}</td>
                  <td className="px-4 py-4 text-slate-600">{log.actorRole}</td>
                  <td className="px-4 py-4 text-slate-700">{log.action}</td>
                  <td className="px-4 py-4 text-slate-700">{log.objectType}</td>
                  <td className="px-4 py-4 text-slate-600 whitespace-pre-wrap">
                    {log.details || "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
