import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-ext/primitives";
import { fetchDoctors, fetchAppointments, type ApiDoctor } from "@/lib/api";
import { Building2, Stethoscope, Users, CalendarCheck, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/departments")({
  component: AdminDepartments,
});

interface DepartmentStats {
  speciality: string;
  slug: string;
  doctors: ApiDoctor[];
  appointmentCount: number;
}

function AdminDepartments() {
  const [departments, setDepartments] = useState<DepartmentStats[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [docRes, apptRes] = await Promise.all([fetchDoctors(), fetchAppointments()]);

      const specMap = new Map<string, ApiDoctor[]>();
      docRes.data.doctors.forEach((d) => {
        const key = d.speciality;
        if (!specMap.has(key)) specMap.set(key, []);
        specMap.get(key)!.push(d);
      });

      const depts: DepartmentStats[] = Array.from(specMap.entries())
        .map(([speciality, docs]) => {
          const docIds = new Set(docs.map((d) => d._id));
          const aptCount = apptRes.data.appointments.filter((a) => docIds.has(a.doctorId)).length;
          return {
            speciality,
            slug: docs[0].specialitySlug,
            doctors: docs,
            appointmentCount: aptCount,
          };
        })
        .sort((a, b) => b.doctors.length - a.doctors.length);

      setDepartments(depts);
    } catch {
      toast.error("Impossible de charger les départements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Départements"
        description="Vue d'ensemble structurelle des spécialités de UniCare."
        actions={
          <button
            onClick={load}
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-border bg-white p-2.5 hover:bg-slate-50 transition shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 text-ink-soft ${loading ? "animate-spin" : ""}`} />
          </button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Chargement…
        </div>
      ) : departments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <Building2 className="h-12 w-12 opacity-20" />
          <p className="text-sm font-medium">Aucun département enregistré.</p>
          <p className="text-xs">
            Les départements sont créés automatiquement lors de l'ajout de médecins.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((d) => {
            const activeDoctors = d.doctors.filter((doc) => doc.status === "Actif").length;
            const headDoctor = d.doctors.find((doc) => doc.status === "Actif") ?? d.doctors[0];
            return (
              <div
                key={d.speciality}
                className="rounded-2xl border border-border bg-white/60 p-6 shadow-soft hover:shadow-md transition"
              >
                <div className="flex items-start gap-3 mb-5">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-slate-100 text-[#06122e]">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-[#06122e] truncate">{d.speciality}</p>
                    {headDoctor && (
                      <p className="text-xs text-ink-soft mt-0.5 truncate">
                        Responsable : {headDoctor.name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                    <p className="text-lg font-bold text-[#06122e]">{d.doctors.length}</p>
                    <p className="text-[10px] text-ink-soft font-semibold mt-0.5 flex items-center justify-center gap-1">
                      <Stethoscope className="h-2.5 w-2.5" /> Médecins
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                    <p className="text-lg font-bold text-emerald-600">{activeDoctors}</p>
                    <p className="text-[10px] text-ink-soft font-semibold mt-0.5 flex items-center justify-center gap-1">
                      <Users className="h-2.5 w-2.5" /> Actifs
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                    <p className="text-lg font-bold text-[#0284c7]">{d.appointmentCount}</p>
                    <p className="text-[10px] text-ink-soft font-semibold mt-0.5 flex items-center justify-center gap-1">
                      <CalendarCheck className="h-2.5 w-2.5" /> RDV
                    </p>
                  </div>
                </div>

                {d.doctors.length > 0 && (
                  <div className="mt-4 flex gap-1 flex-wrap">
                    {d.doctors.slice(0, 3).map((doc) => (
                      <div
                        key={doc._id}
                        title={doc.name}
                        className="h-8 w-8 rounded-full overflow-hidden border-2 border-white shadow-sm bg-slate-100"
                      >
                        {doc.image ? (
                          <img
                            src={doc.image}
                            alt={doc.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Stethoscope className="h-3 w-3 text-slate-400" />
                          </div>
                        )}
                      </div>
                    ))}
                    {d.doctors.length > 3 && (
                      <div className="h-8 w-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 shadow-sm">
                        +{d.doctors.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
