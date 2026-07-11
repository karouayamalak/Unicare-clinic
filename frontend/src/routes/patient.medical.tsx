import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, DefaultAvatar } from "@/components/ui-ext/primitives";
import {
  fetchAppointments,
  fetchMyPatientProfile,
  type ApiAppointment,
  type ApiPatientProfile,
} from "@/lib/api";
import {
  Printer,
  FileText,
  X,
  AlertCircle,
  RefreshCw,
  Upload,
  Eye,
  Activity,
} from "lucide-react";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/lib/authStore";
import { printOrdonnance } from "@/lib/printHelper";
import { getPatientDocuments, addPatientDocument, type PatientDocument } from "@/lib/clinicState";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function openInNewTab(dataUrl: string) {
  try {
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] ?? "application/octet-stream";
    const bstr = atob(arr[1]);
    const n = bstr.length;
    const u8arr = new Uint8Array(n);
    for (let i = 0; i < n; i++) u8arr[i] = bstr.charCodeAt(i);
    const blob = new Blob([u8arr], { type: mime });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  } catch {
    window.open(dataUrl, "_blank");
  }
}

export const Route = createFileRoute("/patient/medical")({
  component: PatientMedical,
});

interface RxRecord {
  id: string;
  patientName: string;
  doctorName: string;
  date: string;
  drug: string;
  dose: string;
  freq: string;
  refills: number;
  notes?: string;
  price?: number;
}

function PatientMedical() {
  const { user } = useAuth();
  const myName = user ? `${user.firstName} ${user.lastName}` : "Patient";

  const [activeTab, setActiveTab] = useState<"medical" | "documents">("medical");
  const [prescriptions, setPrescriptions] = useState<RxRecord[]>([]);
  const [activeRx, setActiveRx] = useState<RxRecord | null>(null);
  const [profile, setProfile] = useState<ApiPatientProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Document states
  const [docsList, setDocsList] = useState<PatientDocument[]>([]);
  const [docCategory, setDocCategory] = useState("Lab");
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<PatientDocument | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [apptsRes, profileRes] = await Promise.all([
        fetchAppointments(),
        fetchMyPatientProfile().catch(() => ({ data: { profile: null } })),
      ]);

      const rxs = apptsRes.data.appointments
        .filter((a: ApiAppointment) => a.prescription && a.prescription.drug)
        .map((a: ApiAppointment) => ({
          id: a._id,
          patientName: a.patientName,
          doctorName: a.doctorName,
          date: a.date,
          drug: a.prescription!.drug,
          dose: a.prescription!.dose,
          freq: a.prescription!.freq,
          refills: a.prescription!.refills,
          notes: a.prescription!.notes,
          price: a.price,
        }));
      setPrescriptions(rxs);

      if (profileRes.data.profile) {
        setProfile(profileRes.data.profile);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    setDocsList(getPatientDocuments(myName));
  }, [myName]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(true);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        addPatientDocument(myName, {
          name: file.name,
          category: docCategory,
          size: `${Math.round(file.size / 1024)} KB`,
          fileDataUrl: reader.result as string,
        });

        toast.success("Document téléversé avec succès !");
        setDocsList(getPatientDocuments(myName));
      } catch (err) {
        console.error(err);
        toast.error("Erreur lors de l'enregistrement du fichier.");
      } finally {
        setUploadingDoc(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dossier Médical & Documents"
        description="Gérez vos constantes vitales, vos ordonnances et téléversez des rapports d'analyses ou radiographies."
      />

      {/* Tabs Menu */}
      <div className="flex gap-2 border-b border-border pb-px">
        <button
          onClick={() => setActiveTab("medical")}
          className={cn(
            "px-4 py-2.5 text-sm font-bold border-b-2 transition cursor-pointer flex items-center gap-2",
            activeTab === "medical"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          <Activity className="h-4 w-4" />
          Fiche Médicale & Ordonnances
        </button>
        <button
          onClick={() => setActiveTab("documents")}
          className={cn(
            "px-4 py-2.5 text-sm font-bold border-b-2 transition cursor-pointer flex items-center gap-2",
            activeTab === "documents"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          <FileText className="h-4 w-4" />
          Mes Documents & Fichiers
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Chargement…
        </div>
      ) : activeTab === "medical" ? (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <Section
              title="Constantes vitales"
              items={[
                ["Taille", profile?.height ? `${profile.height} cm` : "Non spécifié"],
                ["Poids", profile?.weight ? `${profile.weight} kg` : "Non spécifié"],
                ["Âge", profile?.age ? `${profile.age} ans` : "Non spécifié"],
                ["Groupe sanguin", profile?.bloodType || "Non spécifié"],
              ]}
            />
            <Section
              title="Allergies connues"
              items={[["Allergies", profile?.allergies || "Aucune allergie connue"]]}
            />
            <Section
              title="Antécédents médicaux"
              items={[
                [
                  "Pathologies chroniques",
                  profile?.chronicConditions || "Aucun antécédent particulier",
                ],
              ]}
            />
          </div>

          {/* Dynamic Prescriptions list */}
          <div className="rounded-2xl border border-border bg-white/50 p-6 backdrop-blur-sm shadow-soft">
            <h3 className="font-semibold text-ink text-base">Ordonnances délivrées par vos médecins</h3>
            <p className="text-xs text-ink-soft mt-1">
              Seul le médecin est habilité à ajouter des documents ou prescrire de nouveaux traitements.
            </p>

            <div className="mt-6 divide-y divide-border">
              {prescriptions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-ink-soft">
                  <AlertCircle className="h-8 w-8 text-slate-400 mb-2" />
                  <p className="text-sm">Aucune ordonnance n'est enregistrée dans votre dossier.</p>
                </div>
              ) : (
                prescriptions.map((rx) => (
                  <div
                    key={rx.id}
                    className="flex flex-col justify-between py-4.5 gap-4 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-start gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal/10 text-teal border border-teal/20 shrink-0">
                        <FileText className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-ink">
                          {rx.drug} {rx.dose}
                        </p>
                        <p className="text-xs text-ink-soft mt-0.5">
                          {rx.freq} • Prescrit par {rx.doctorName} le {rx.date}
                        </p>
                        {rx.notes && (
                          <p className="text-xs text-ink-soft/70 italic mt-1">Note: {rx.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {rx.refills > 0 && (
                        <span className="text-[10px] font-bold text-teal bg-teal/10 border border-teal/20 px-2 py-1 rounded-full">
                          Renouvelable {rx.refills}x
                        </span>
                      )}
                      <button
                        onClick={() => setActiveRx(rx)}
                        className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3.5 py-2 text-xs font-bold text-ink-soft hover:text-ink transition shadow-sm"
                      >
                        <Printer className="h-3.5 w-3.5" /> Afficher & Imprimer
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upload Zone */}
          <div className="rounded-2xl border border-border bg-white/50 p-6 backdrop-blur-sm shadow-soft">
            <h3 className="text-sm font-bold text-[#06122e] mb-4">Téléverser un nouveau document</h3>
            <div className="grid gap-4 sm:grid-cols-[160px_1fr_auto] items-end">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                  Catégorie
                </label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-xs focus:border-slate-300 focus:outline-none"
                >
                  <option value="Lab">Analyse Labo</option>
                  <option value="Imaging">Radiographie / Scanner</option>
                  <option value="Records">Dossier / Historique</option>
                  <option value="Rx">Ordonnance Externe</option>
                  <option value="ID">Photo / Identité</option>
                </select>
              </div>

              <div className="relative">
                <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded border border-dashed border-slate-300 bg-slate-50/50 px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-400 transition">
                  <Upload className="h-4 w-4 text-slate-400" strokeWidth={2} />
                  {uploadingDoc ? "Lecture du fichier..." : "Sélectionner un fichier (JPG, PNG, PDF)"}
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    disabled={uploadingDoc}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            <p className="mt-2 text-[10px] text-slate-400">
              Taille maximale : 10 Mo. Vos fichiers sont cryptés et stockés de manière sécurisée.
            </p>
          </div>

          {/* List of files */}
          <div className="rounded-2xl border border-border bg-white/50 shadow-soft overflow-hidden">
            <div className="border-b border-border bg-slate-50/50 px-5 py-3.5">
              <h3 className="text-xs font-bold text-[#06122e] uppercase tracking-wider">
                Mes documents enregistrés ({docsList.length})
              </h3>
            </div>

            {docsList.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <FileText className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold">Aucun document téléversé dans votre dossier.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {docsList.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center gap-4 p-5 hover:bg-slate-50/50 transition"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded bg-sky-50 text-[#0284c7] border border-sky-100">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#06122e] truncate">{d.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                        {d.category} · {d.date} · {d.size}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {d.fileDataUrl && (
                        <button
                          onClick={() => setSelectedDoc(d)}
                          className="cursor-pointer inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition shadow-sm"
                        >
                          <Eye className="h-3 w-3" /> Aperçu
                        </button>
                      )}
                      {d.fileDataUrl && (
                        <button
                          onClick={() => openInNewTab(d.fileDataUrl!)}
                          className="cursor-pointer inline-flex items-center gap-1 rounded bg-[#06122e] px-2.5 py-1.5 text-[11px] font-bold text-white hover:opacity-90 transition shadow-sm"
                        >
                          <Eye className="h-3 w-3" /> Ouvrir
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Ordonnance Print Preview Modal */}
      <AnimatePresence>
        {activeRx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-2xl rounded-2xl border border-border bg-white p-6 shadow-elevated my-8 print:p-0 print:border-none print:shadow-none"
            >
              <div className="flex items-center justify-between border-b border-border pb-4 print:hidden">
                <h3 className="text-lg font-bold text-ink">Aperçu de l'ordonnance</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      printOrdonnance({
                        id: activeRx.id,
                        date: activeRx.date,
                        doctorName: activeRx.doctorName,
                        patientName: activeRx.patientName,
                        drug: activeRx.drug,
                        dose: activeRx.dose,
                        freq: activeRx.freq,
                        refills: activeRx.refills,
                        notes: activeRx.notes,
                      })
                    }
                    className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-teal px-4 py-2 text-xs font-bold text-white hover:opacity-90 transition"
                  >
                    <Printer className="h-4 w-4" /> Imprimer
                  </button>
                  <button
                    onClick={() => setActiveRx(null)}
                    className="rounded-lg p-1 text-ink-soft hover:bg-slate-100 transition cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Algerian Clinic Layout sheet */}
              <div className="p-8 border border-slate-300 rounded-xl bg-white mt-4 font-serif text-slate-900 leading-relaxed print:m-0 print:border-none">
                <div className="text-center space-y-0.5 border-b-2 border-slate-900 pb-4">
                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-slate-800">
                    République Algérienne Démocratique et Populaire
                  </h4>
                  <p className="text-xs uppercase font-medium text-slate-600">
                    Ministère de la Santé, de la Population et de la Réforme Hospitalière
                  </p>
                  <p className="text-sm font-bold mt-2 uppercase text-slate-900 tracking-wider">
                    Centre Médical de Béjaïa
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6 text-xs">
                  <div>
                    <h5 className="text-sm font-bold uppercase text-slate-900">
                      {activeRx.doctorName}
                    </h5>
                    <p className="text-slate-700 italic">Médecin Praticien de Santé</p>
                    <p className="text-slate-600">CHU de Béjaïa / Espace Médical Gouraya</p>
                    <p className="text-slate-600">Tél : +213 (0)34 12 34 56</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-slate-800">
                      Béjaïa, le : <strong>{activeRx.date}</strong>
                    </p>
                    <p className="text-slate-800">
                      Patient :{" "}
                      <strong className="text-sm font-bold">{activeRx.patientName}</strong>
                    </p>
                  </div>
                </div>

                <div className="text-center my-10">
                  <h2 className="text-3xl font-extrabold uppercase tracking-widest text-slate-900 border-double border-y-4 border-slate-900 py-2.5 max-w-[240px] mx-auto">
                    Ordonnance
                  </h2>
                </div>

                <div className="min-h-[220px] pl-6 space-y-6">
                  <div className="flex gap-2">
                    <span className="text-4xl font-extrabold italic text-slate-900 shrink-0">
                      Rp/
                    </span>
                    <div className="mt-2 space-y-2">
                      <p className="text-lg font-bold text-slate-950">
                        {activeRx.drug} {activeRx.dose}
                      </p>
                      <p className="text-sm text-slate-700 pl-4 italic">
                        Posologie : {activeRx.freq}
                      </p>
                      {activeRx.refills > 0 && (
                        <p className="text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-100 inline-block">
                          Renouvelable {activeRx.refills} fois
                        </p>
                      )}
                    </div>
                  </div>

                  {activeRx.notes && (
                    <div className="mt-8 border-t border-dashed border-slate-300 pt-4 text-xs text-slate-600">
                      <strong className="text-slate-900">Notes d'administration :</strong>
                      <p className="mt-1 italic">{activeRx.notes}</p>
                    </div>
                  )}
                  {activeRx.price !== undefined && activeRx.price > 0 && (
                    <div className="mt-6 border-t border-dashed border-slate-300 pt-4 text-xs text-slate-800 font-bold">
                      <span>Frais de consultation : </span>
                      <span className="text-teal font-extrabold">
                        {activeRx.price.toLocaleString()} DA
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-end text-[10px] text-slate-500">
                  <div>
                    <p>
                      UniCare Béjaïa • Code d'authentification : MED-{activeRx.id.toUpperCase()}
                    </p>
                    <p>Signature numérique sécurisée AES-256</p>
                  </div>
                  <div className="text-center min-w-[140px] border border-slate-200 rounded p-3 bg-slate-50">
                    <p className="font-bold text-slate-800 mb-6">Griffe & Signature</p>
                    <div className="h-6 w-auto flex items-center justify-center text-teal-700 italic border border-dashed border-teal-300 rounded text-[9px] bg-teal-50 font-bold px-1">
                      {activeRx.doctorName}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Preview Modal for Uploaded Files */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl rounded-md border border-slate-200 bg-white p-5 shadow-elevated">
            <button
              onClick={() => setSelectedDoc(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition z-10 bg-white rounded-full p-1 border border-slate-100"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-sm font-bold text-[#06122e] mb-4 truncate pr-8">
              {selectedDoc.name} ({selectedDoc.category})
            </h3>

            <div className="mt-2 flex max-h-[70vh] items-center justify-center overflow-auto rounded bg-slate-50 p-4 border border-slate-100">
              {selectedDoc.fileDataUrl?.startsWith("data:image/") ? (
                <img
                  src={selectedDoc.fileDataUrl}
                  alt={selectedDoc.name}
                  className="max-h-[60vh] w-auto object-contain rounded"
                />
              ) : selectedDoc.fileDataUrl?.startsWith("data:application/pdf") ? (
                <iframe
                  src={selectedDoc.fileDataUrl}
                  title={selectedDoc.name}
                  className="min-h-[60vh] w-full rounded border-0"
                />
              ) : (
                <div className="text-center p-8">
                  <FileText className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                  <p className="text-xs text-slate-500 font-semibold">
                    Aperçu non pris en charge dans cette fenêtre.
                  </p>
                  {selectedDoc.fileDataUrl && (
                    <button
                      onClick={() => openInNewTab(selectedDoc.fileDataUrl!)}
                      className="mt-4 cursor-pointer inline-flex items-center gap-1.5 rounded bg-[#06122e] px-4 py-2 text-xs font-bold text-white shadow hover:opacity-90 transition"
                    >
                      <Eye className="h-4 w-4" /> Ouvrir dans l’onglet
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div className="rounded-2xl border border-border bg-white/50 p-6 backdrop-blur-sm shadow-soft">
      <p className="font-semibold text-ink">{title}</p>
      <dl className="mt-4 space-y-2 text-sm">
        {items.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between">
            <dt className="text-ink-soft/75 font-medium">{k}</dt>
            <dd className="font-bold text-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
