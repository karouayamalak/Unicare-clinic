import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui-ext/primitives";
import { fetchActionLogs, type ApiActionLog } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Users, Stethoscope, Baby, RefreshCw, ClipboardList } from "lucide-react";

export const Route = createFileRoute("/admin/logs")({
  component: AdminLogs,
});

// ── Tab definition ────────────────────────────────────────────────────────────
const TABS = [
  {
    id: "patients",
    label: "Patients",
    icon: Users,
    params: { actorRole: "Patient", limit: 200 },
    badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
  },
  {
    id: "doctors",
    label: "Médecins",
    icon: Stethoscope,
    params: { actorRole: "Doctor", limit: 200 },
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    id: "dependents",
    label: "Dépendants",
    icon: Baby,
    params: { objectType: "Dependent", limit: 200 },
    badgeColor: "bg-violet-50 text-violet-700 border-violet-200",
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

function AdminLogs() {
  const [activeTab, setActiveTab] = useState<TabId>("patients");
  const [logs, setLogs] = useState<ApiActionLog[]>([]);
  const [loading, setLoading] = useState(true);

  const currentTab = TABS.find((t) => t.id === activeTab)!;

  const loadLogs = async () => {
    setLoading(true);
    setLogs([]);
    try {
      const res = await fetchActionLogs(currentTab.params);
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
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journal d'activité"
        description="Visualisez les actions récentes par type d'utilisateur."
        actions={
          <button
            onClick={loadLogs}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Actualiser
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition border cursor-pointer",
                isActive
                  ? "bg-[#06122e] text-white border-[#06122e] shadow"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
        <span className="ml-auto text-xs text-slate-400 self-center">
          {loading ? "Chargement…" : `${logs.length} entrée${logs.length > 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Utilisateur</th>
              <th className="px-5 py-3">Rôle</th>
              <th className="px-5 py-3">Action</th>
              <th className="px-5 py-3">Objet</th>
              <th className="px-5 py-3">Détails</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                    <span className="text-sm">Chargement des logs…</span>
                  </div>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center gap-3 text-slate-300">
                    <ClipboardList className="h-10 w-10" />
                    <span className="text-sm font-medium text-slate-400">
                      Aucune entrée trouvée pour cet onglet.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("fr-FR")}
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-slate-800 whitespace-nowrap">
                    {log.actorName}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide border",
                        currentTab.badgeColor,
                      )}
                    >
                      {log.actorRole}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-700">{log.action}</td>
                  <td className="px-5 py-3.5 text-slate-500">{log.objectType}</td>
                  <td className="px-5 py-3.5 text-slate-400 max-w-xs truncate" title={log.details || ""}>
                    {log.details || "—"}
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
