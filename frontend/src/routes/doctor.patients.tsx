import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, DefaultAvatar } from "@/components/ui-ext/primitives";
import {
  fetchPatients,
  fetchPatientProfile,
  updatePatientProfile,
  fetchDependentsByParent,
  updateDependent,
  fetchAppointments,
  type ApiPatient,
  type ApiDependent,
  type ApiAppointment,
} from "@/lib/api";
import ChildBadge from "@/components/ChildBadge";
import { getPatientDocuments, type PatientDocument, addPatientDocument } from "@/lib/clinicState";
import {
  Search,
  User,
  FileText,
  X,
  Eye,
  Download,
  Shield,
  Upload,
  Users,
  ChevronDown,
  ChevronUp,
  Save,
  Pill,
} from "lucide-react";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

export const Route = createFileRoute("/doctor/patients")({
  component: DoctorPatients,
});

function DoctorPatients() {
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState<ApiPatient[]>([]);
  const [loading, setLoading] = useState(true);

  const [activePatientName, setActivePatientName] = useState<string | null>(null);
  const [activePatientEmail, setActivePatientEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"docs" | "clinical" | "children" | "history">("docs");
  const [patientDocs, setPatientDocs] = useState<PatientDocument[]>([]);
  const [selectedPreviewDoc, setSelectedPreviewDoc] = useState<PatientDocument | null>(null);

  const [patientAppointments, setPatientAppointments] = useState<ApiAppointment[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [patientFullName, setPatientFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [weight, setWeight] = useState(0);
  const [height, setHeight] = useState(0);
  const [age, setAge] = useState(0);
  const [allergies, setAllergies] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [chronicConditions, setChronicConditions] = useState("");
  const [notes, setNotes] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [uploadCategory, setUploadCategory] = useState("Imaging");
  const [uploading, setUploading] = useState(false);

  // Dependents (children) state for doctor view
  const [patientDependents, setPatientDependents] = useState<ApiDependent[]>([]);
  const [loadingDependents, setLoadingDependents] = useState(false);
  const [editingChild, setEditingChild] = useState<ApiDependent | null>(null);
  const [childForm, setChildForm] = useState<Partial<ApiDependent>>({});
  const [savingChild, setSavingChild] = useState(false);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activePatientName) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        addPatientDocument(activePatientName, {
          name: file.name,
          category: uploadCategory,
          size: `${Math.round(file.size / 1024)} KB`,
          fileDataUrl: reader.result as string,
        });

        toast.success("Document téléversé et partagé avec le patient !");
        setPatientDocs(getPatientDocuments(activePatientName));
      } catch (err) {
        console.error(err);
        toast.error("Erreur lors de l'enregistrement du fichier.");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchPatients();
      setPatients(res.data.patients);
    } catch {
      toast.error("Impossible de charger les patients.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.speciality.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()),
  );

  const handleOpenPatientFiles = async (patientName: string, patientEmail: string) => {
    setActivePatientName(patientName);
    setActivePatientEmail(patientEmail);
    setPatientDocs(getPatientDocuments(patientName));
    setLoadingProfile(true);
    setLoadingDependents(true);
    setLoadingHistory(true);
    try {
      const [profileRes, depRes, apptsRes] = await Promise.all([
        fetchPatientProfile(patientEmail),
        fetchDependentsByParent(patientEmail).catch(() => ({ data: { data: { dependents: [] } } })),
        fetchAppointments().catch(() => ({ data: { appointments: [] } })),
      ]);
      const p = profileRes.data.profile;
      setPatientFullName(p.patientName || patientName);
      setPhone(p.phone || "");
      setAddress(p.address || "");
      setEmergencyContact(p.emergencyContact || "");
      setDateOfBirth(p.dateOfBirth || "");
      setGender(p.gender || "");
      setWeight(p.weight || 0);
      setHeight(p.height || 0);
      setAge(p.age || 0);
      setAllergies(p.allergies || "");
      setBloodType(p.bloodType || "");
      setChronicConditions(p.chronicConditions || "");
      setNotes(p.notes || "");
      setPatientDependents((depRes as any).data?.data?.dependents || []);

      const appointments = apptsRes.data?.appointments || [];
      const filteredAppts = appointments.filter(
        (a: ApiAppointment) => a.patientEmail?.toLowerCase() === patientEmail.toLowerCase()
      );
      setPatientAppointments(filteredAppts);
    } catch {
      toast.error("Impossible de charger le dossier médical de ce patient.");
    } finally {
      setLoadingProfile(false);
      setLoadingDependents(false);
      setLoadingHistory(false);
    }
  };

  const handleSavePatientProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!activePatientEmail) return;

    setSavingProfile(true);
    try {
      await updatePatientProfile(activePatientEmail, {
        patientName: patientFullName,
        phone,
        address,
        emergencyContact,
        dateOfBirth,
        gender,
        weight,
        height,
        age,
        allergies,
        bloodType,
        chronicConditions,
        notes,
      });
      toast.success("Dossier médical patient mis à jour avec succès !");
    } catch {
      toast.error("Impossible de sauvegarder le dossier médical.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCloseModal = () => {
    setActivePatientName(null);
    setActiveTab("docs");
    setEditingChild(null);
    setPatientDependents([]);
  };

  const handleEditChild = (child: ApiDependent) => {
    setEditingChild(child);
    setChildForm({ ...child });
  };

  const handleSaveChild = async () => {
    if (!editingChild) return;
    setSavingChild(true);
    try {
      await updateDependent(editingChild._id, childForm);
      setPatientDependents((prev) =>
        prev.map((d) =>
          d._id === editingChild._id ? ({ ...d, ...childForm } as ApiDependent) : d,
        ),
      );
      setEditingChild(null);
      toast.success("Dossier de l'enfant mis à jour avec succès !");
    } catch {
      toast.error("Impossible de sauvegarder le dossier de l'enfant.");
    } finally {
      setSavingChild(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mes Patients"
        description="Consultez la liste des patients et accédez à leurs dossiers et documents médicaux."
        actions={
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un patient…"
              className="w-64 rounded border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm focus:border-slate-300 focus:outline-none shadow-sm"
            />
          </div>
        }
      />

      {loading ? (
        <div className="rounded-md border border-dashed border-slate-200 bg-white/50 p-12 text-center">
          <User className="h-8 w-8 mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-semibold text-[#06122e]">Chargement des patients…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-200 bg-white/50 p-12 text-center">
          <User className="h-8 w-8 mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-semibold text-[#06122e]">Aucun patient trouvé</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <div
              key={p.name}
              className="rounded-md border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 hover:shadow transition"
            >
              <div className="flex items-center gap-3">
                <DefaultAvatar className="h-11 w-11 border border-slate-100 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {/* Child badge if this patient has dependents under 18 */}
                    {p.email && <ChildBadge parentEmail={p.email} />}
                    <button
                      type="button"
                      onClick={() => handleOpenPatientFiles(p.name, p.email)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <p className="font-bold text-[#06122e] truncate hover:text-sky-700 transition">
                        {p.name}
                      </p>
                      <span className="rounded bg-sky-50 px-2 py-0.5 text-[9px] font-bold text-[#0284c7] uppercase">
                        {p.speciality}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-t border-slate-50 pt-3 text-slate-500 font-medium">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Consultations</p>
                  <p className="text-sm font-bold text-[#06122e] mt-0.5">{p.visitCount}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Dernier statut</p>
                  <p className="text-sm font-semibold text-[#06122e] mt-0.5">{p.lastStatus}</p>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleOpenPatientFiles(p.name, p.email)}
                  className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 rounded border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  <FileText className="h-3.5 w-3.5 text-slate-400" /> Dossier Médical
                </button>
                <button
                  onClick={() => {
                    handleOpenPatientFiles(p.name, p.email);
                    setTimeout(() => setActiveTab("history"), 50);
                  }}
                  className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 rounded bg-[#06122e] py-2 text-xs font-bold text-white hover:opacity-90 transition shadow-sm"
                >
                  Ordonnances
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activePatientName && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-md border border-slate-200 bg-white p-6 shadow-elevated my-8">
            <button
              onClick={handleCloseModal}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3.5 mb-4 border-b border-slate-100 pb-3">
              <DefaultAvatar className="h-12 w-12 border border-slate-100" />
              <div>
                <h3 className="text-base font-extrabold text-[#06122e]">{activePatientName}</h3>
                <p className="text-xs text-slate-400 font-semibold uppercase">
                  Dossier Médical Patient
                </p>
              </div>
            </div>

            <div className="flex border-b border-slate-200 mb-4 text-sm font-semibold">
              <button
                onClick={() => setActiveTab("docs")}
                className={cn(
                  "pb-2.5 px-4 border-b-2 transition cursor-pointer",
                  activeTab === "docs"
                    ? "border-[#06122e] text-[#06122e]"
                    : "border-transparent text-slate-400 hover:text-slate-600",
                )}
              >
                Fichiers & Documents
              </button>
              <button
                onClick={() => setActiveTab("clinical")}
                className={cn(
                  "pb-2.5 px-4 border-b-2 transition cursor-pointer",
                  activeTab === "clinical"
                    ? "border-[#06122e] text-[#06122e]"
                    : "border-transparent text-slate-400 hover:text-slate-600",
                )}
              >
                Infos Cliniques (Paramètres)
              </button>
              <button
                onClick={() => setActiveTab("children")}
                className={cn(
                  "pb-2.5 px-4 border-b-2 transition cursor-pointer flex items-center gap-1.5",
                  activeTab === "children"
                    ? "border-[#06122e] text-[#06122e]"
                    : "border-transparent text-slate-400 hover:text-slate-600",
                )}
              >
                <Users className="h-3.5 w-3.5" />
                Enfants
                {patientDependents.length > 0 && (
                  <span className="ml-1 rounded-full bg-sky-100 px-1.5 py-0.5 text-[9px] font-bold text-sky-700">
                    {patientDependents.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={cn(
                  "pb-2.5 px-4 border-b-2 transition cursor-pointer flex items-center gap-1.5",
                  activeTab === "history"
                    ? "border-[#06122e] text-[#06122e]"
                    : "border-transparent text-slate-400 hover:text-slate-600",
                )}
              >
                <FileText className="h-3.5 w-3.5" />
                Historique & Ordonnances
                {patientAppointments.length > 0 && (
                  <span className="ml-1 rounded-full bg-sky-100 px-1.5 py-0.5 text-[9px] font-bold text-sky-700">
                    {patientAppointments.length}
                  </span>
                )}
              </button>
            </div>

            {activeTab === "history" && (
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                {loadingHistory ? (
                  <div className="p-8 text-center text-xs text-slate-400 font-medium">
                    Chargement de l'historique...
                  </div>
                ) : patientAppointments.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <FileText className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-semibold">Aucun rendez-vous ou ordonnance trouvé pour ce patient.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100 bg-white border border-slate-100 rounded-md overflow-hidden">
                    {patientAppointments.map((appt) => (
                      <li key={appt._id} className="p-4 hover:bg-slate-50 transition">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-bold text-[#06122e]">
                              {appt.reason}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                              Date : {appt.date} à {appt.time} · Mode : En clinique
                            </p>
                          </div>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase border",
                              appt.status === "Terminé"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : appt.status === "Annulé"
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-sky-50 text-sky-700 border-sky-200",
                            )}
                          >
                            {appt.status}
                          </span>
                        </div>
                        {appt.prescription && (
                          <div className="mt-2.5 bg-slate-50/50 p-2.5 rounded border border-slate-100 text-2xs">
                            <p className="font-bold text-[#06122e] mb-1 flex items-center gap-1.5">
                              <Pill className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                              <span>Prescription médicale :</span>
                            </p>
                            {appt.prescription.drugs && appt.prescription.drugs.length > 0 ? (
                              <ul className="list-disc pl-4 space-y-0.5 text-slate-600 font-medium">
                                {appt.prescription.drugs.map((d, idx) => (
                                  <li key={idx}>
                                    {d.drug} - {d.dose} ({d.freq})
                                    {d.notes ? ` • ${d.notes}` : ""}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-slate-600 font-medium">
                                {appt.prescription.drug} - {appt.prescription.dose} ({appt.prescription.freq})
                                {appt.prescription.notes ? ` • ${appt.prescription.notes}` : ""}
                              </p>
                            )}
                            {appt.notes && (
                              <p className="mt-1.5 text-slate-400 font-medium italic border-t border-slate-100 pt-1.5">
                                Notes : {appt.notes}
                              </p>
                            )}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {activeTab === "docs" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 rounded bg-sky-50 px-3.5 py-2.5 text-2xs font-semibold text-[#0284c7] border border-sky-100">
                  <Shield className="h-4 w-4 shrink-0 text-[#0284c7]" />
                  Accès autorisé sous protocole de confidentialité des données médicales d'Algérie.
                </div>

                <div className="rounded-md border border-slate-100 overflow-hidden bg-slate-50/50">
                  <div className="bg-slate-100 px-4 py-2 border-b border-slate-200">
                    <h4 className="text-xs font-bold text-[#06122e] uppercase tracking-wider">
                      Documents & Fichiers ({patientDocs.length})
                    </h4>
                  </div>

                  {patientDocs.length === 0 ? (
                    <p className="p-8 text-xs text-slate-400 text-center font-medium">
                      Aucun document téléversé par le patient.
                    </p>
                  ) : (
                    <ul className="divide-y divide-slate-100 max-h-[220px] overflow-y-auto bg-white">
                      {patientDocs.map((doc) => (
                        <li
                          key={doc.id}
                          className="flex items-center justify-between gap-3 p-3 hover:bg-slate-50/50 transition"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <FileText className="h-4 w-4 text-[#0284c7] shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-[#06122e] truncate">
                                {doc.name}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                                {doc.category} · {doc.date} · {doc.size}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            {doc.fileDataUrl && (
                              <button
                                onClick={() => setSelectedPreviewDoc(doc)}
                                className="cursor-pointer inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition shadow-sm"
                              >
                                <Eye className="h-3 w-3" /> Visualiser
                              </button>
                            )}
                            {doc.fileDataUrl && (
                              <button
                                onClick={() => openInNewTab(doc.fileDataUrl!)}
                                className="cursor-pointer inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition shadow-sm"
                              >
                                <Eye className="h-3 w-3" /> Ouvrir
                              </button>
                            )}
                            <a
                              href={doc.fileDataUrl || "#"}
                              download={doc.name}
                              className="cursor-pointer inline-flex items-center gap-1 rounded bg-[#06122e] px-2 py-1 text-[10px] font-bold text-white hover:opacity-90 transition"
                            >
                              <Download className="h-3 w-3" /> Télécharger
                            </a>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="rounded-md border border-slate-200 bg-slate-50/50 p-4 shadow-sm">
                  <h4 className="text-xs font-bold text-[#06122e] mb-3">
                    Téléverser & Partager un Document (Radio, Analyses, etc.)
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-[160px_1fr_auto] items-end">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Catégorie
                      </label>
                      <select
                        value={uploadCategory}
                        onChange={(e) => setUploadCategory(e.target.value)}
                        className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-xs focus:border-slate-300 focus:outline-none"
                      >
                        <option value="Imaging">Radiographie / Scanner</option>
                        <option value="Lab">Analyse Labo</option>
                        <option value="Records">Dossier / Historique</option>
                        <option value="Rx">Ordonnance</option>
                      </select>
                    </div>
                    <div className="relative">
                      <label className="flex h-9 cursor-pointer items-center justify-center gap-2 rounded border border-dashed border-slate-300 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-400 transition">
                        <Upload className="h-3.5 w-3.5 text-slate-400" />
                        {uploading ? "Lecture..." : "Sélectionner un fichier"}
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleFileUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "clinical" && (
              <form onSubmit={handleSavePatientProfile} className="space-y-4">
                {loadingProfile ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Chargement des données cliniques...
                  </div>
                ) : (
                  <>
                    <div className="rounded-md border border-slate-200 bg-slate-50/70 p-4">
                      <h4 className="mb-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        Informations personnelles
                      </h4>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Nom complet
                          </label>
                          <input
                            value={patientFullName}
                            onChange={(e) => setPatientFullName(e.target.value)}
                            className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-xs focus:border-slate-300 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Email
                          </label>
                          <input
                            value={activePatientEmail || ""}
                            readOnly
                            className="w-full rounded border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Téléphone
                          </label>
                          <input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="05XX XX XX XX"
                            className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-xs focus:border-slate-300 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Adresse
                          </label>
                          <input
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Adresse complète"
                            className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-xs focus:border-slate-300 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Contact d'urgence
                          </label>
                          <input
                            value={emergencyContact}
                            onChange={(e) => setEmergencyContact(e.target.value)}
                            placeholder="Nom / téléphone"
                            className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-xs focus:border-slate-300 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Date de naissance
                          </label>
                          <input
                            type="date"
                            value={dateOfBirth}
                            onChange={(e) => setDateOfBirth(e.target.value)}
                            className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-xs focus:border-slate-300 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Genre
                          </label>
                          <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-xs focus:border-slate-300 focus:outline-none"
                          >
                            <option value="">Non spécifié</option>
                            <option value="Homme">Homme</option>
                            <option value="Femme">Femme</option>
                            <option value="Autre">Autre</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Âge
                        </label>
                        <input
                          type="number"
                          value={age || ""}
                          onChange={(e) => setAge(Number(e.target.value))}
                          placeholder="ans"
                          className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-xs focus:border-slate-300 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Poids (kg)
                        </label>
                        <input
                          type="number"
                          value={weight || ""}
                          onChange={(e) => setWeight(Number(e.target.value))}
                          placeholder="kg"
                          className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-xs focus:border-slate-300 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Taille (cm)
                        </label>
                        <input
                          type="number"
                          value={height || ""}
                          onChange={(e) => setHeight(Number(e.target.value))}
                          placeholder="cm"
                          className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-xs focus:border-slate-300 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Groupe Sanguin
                        </label>
                        <select
                          value={bloodType}
                          onChange={(e) => setBloodType(e.target.value)}
                          className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-xs focus:border-slate-300 focus:outline-none"
                        >
                          <option value="">Non spécifié</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Allergies connues
                        </label>
                        <input
                          type="text"
                          value={allergies}
                          onChange={(e) => setAllergies(e.target.value)}
                          placeholder="ex: Pénicilline, Pollen"
                          className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-xs focus:border-slate-300 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Maladies chroniques & Antécédents
                      </label>
                      <textarea
                        value={chronicConditions}
                        onChange={(e) => setChronicConditions(e.target.value)}
                        placeholder="Antécédents notables du patient..."
                        rows={3}
                        className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-xs focus:border-slate-300 focus:outline-none resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Notes internes
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Observations complémentaires à conserver dans le dossier"
                        rows={3}
                        className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-xs focus:border-slate-300 focus:outline-none resize-none"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="rounded bg-[#06122e] px-4 py-2 text-xs font-bold text-white hover:opacity-90 transition disabled:opacity-50 cursor-pointer shadow-sm"
                      >
                        {savingProfile ? "Enregistrement..." : "Enregistrer les modifications"}
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}

            {activeTab === "children" && (
              <div className="space-y-3">
                {loadingDependents ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Chargement des enfants...
                  </div>
                ) : patientDependents.length === 0 ? (
                  <div className="rounded-md border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                    <Users className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-semibold text-slate-500">
                      Aucun enfant enregistré pour ce patient.
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Le patient peut ajouter des enfants depuis ses paramètres.
                    </p>
                  </div>
                ) : (
                  patientDependents.map((child) => {
                    const isEditing = editingChild?._id === child._id;
                    const childAge = Math.floor(
                      (Date.now() - new Date(child.dateOfBirth).getTime()) /
                        (365.25 * 24 * 60 * 60 * 1000),
                    );
                    return (
                      <div
                        key={child._id}
                        className="rounded-md border border-slate-200 bg-white shadow-sm overflow-hidden"
                      >
                        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-[#06122e] text-white text-xs font-bold flex items-center justify-center shrink-0">
                              {child.firstName[0]}
                              {child.lastName[0]}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[#06122e]">
                                {child.firstName} {child.lastName}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {childAge} ans • {child.gender === "M" ? "Garçon" : "Fille"} •{" "}
                                {child.relationship}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              isEditing ? setEditingChild(null) : handleEditChild(child)
                            }
                            className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                          >
                            {isEditing ? (
                              <>
                                <ChevronUp className="h-3 w-3" /> Fermer
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3" /> Modifier
                              </>
                            )}
                          </button>
                        </div>
                        {!isEditing && (
                          <div className="px-4 py-3 grid grid-cols-3 gap-3 text-[10px] text-slate-500">
                            <div>
                              <span className="font-bold text-slate-400 uppercase">
                                Groupe sanguin
                              </span>
                              <br />
                              {child.bloodType || "—"}
                            </div>
                            <div>
                              <span className="font-bold text-slate-400 uppercase">Poids</span>
                              <br />
                              {child.weight ? `${child.weight} kg` : "—"}
                            </div>
                            <div>
                              <span className="font-bold text-slate-400 uppercase">Taille</span>
                              <br />
                              {child.height ? `${child.height} cm` : "—"}
                            </div>
                            <div className="col-span-3">
                              <span className="font-bold text-slate-400 uppercase">Allergies</span>
                              <br />
                              {child.allergies || "Aucune"}
                            </div>
                            <div className="col-span-3">
                              <span className="font-bold text-slate-400 uppercase">
                                Maladies chroniques
                              </span>
                              <br />
                              {child.chronicConditions || "Aucune"}
                            </div>
                          </div>
                        )}
                        {isEditing && (
                          <div className="p-4 space-y-3">
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                  Poids (kg)
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  value={childForm.weight ?? ""}
                                  onChange={(e) =>
                                    setChildForm({ ...childForm, weight: Number(e.target.value) })
                                  }
                                  className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-xs focus:border-slate-300 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                  Taille (cm)
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  value={childForm.height ?? ""}
                                  onChange={(e) =>
                                    setChildForm({ ...childForm, height: Number(e.target.value) })
                                  }
                                  className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-xs focus:border-slate-300 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                  Groupe sanguin
                                </label>
                                <select
                                  value={childForm.bloodType ?? ""}
                                  onChange={(e) =>
                                    setChildForm({ ...childForm, bloodType: e.target.value })
                                  }
                                  className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-xs focus:border-slate-300 focus:outline-none"
                                >
                                  <option value="">—</option>
                                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => (
                                    <option key={g} value={g}>
                                      {g}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                Allergies connues
                              </label>
                              <input
                                value={childForm.allergies ?? ""}
                                onChange={(e) =>
                                  setChildForm({ ...childForm, allergies: e.target.value })
                                }
                                placeholder="ex: Pénicilline, Pollen"
                                className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-xs focus:border-slate-300 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                Maladies chroniques
                              </label>
                              <textarea
                                value={childForm.chronicConditions ?? ""}
                                onChange={(e) =>
                                  setChildForm({ ...childForm, chronicConditions: e.target.value })
                                }
                                rows={2}
                                placeholder="Antécédents de l'enfant..."
                                className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-xs focus:border-slate-300 focus:outline-none resize-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                Notes internes
                              </label>
                              <textarea
                                value={childForm.notes ?? ""}
                                onChange={(e) =>
                                  setChildForm({ ...childForm, notes: e.target.value })
                                }
                                rows={2}
                                placeholder="Observations..."
                                className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-xs focus:border-slate-300 focus:outline-none resize-none"
                              />
                            </div>
                            <div className="flex justify-end">
                              <button
                                onClick={handleSaveChild}
                                disabled={savingChild}
                                className="inline-flex items-center gap-1.5 rounded bg-[#06122e] px-4 py-2 text-xs font-bold text-white hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
                              >
                                <Save className="h-3.5 w-3.5" />
                                {savingChild ? "Enregistrement..." : "Enregistrer"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            <div className="flex justify-end gap-2.5 mt-6 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedPreviewDoc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl rounded-md border border-slate-200 bg-white p-5 shadow-elevated">
            <button
              onClick={() => setSelectedPreviewDoc(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition z-10 bg-white rounded-full p-1 border border-slate-100"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-sm font-bold text-[#06122e] mb-4 truncate pr-8">
              Aperçu : {selectedPreviewDoc.name} ({selectedPreviewDoc.category})
            </h3>

            <div className="mt-2 flex max-h-[60vh] items-center justify-center overflow-auto rounded bg-slate-50 p-4 border border-slate-100">
              {selectedPreviewDoc.fileDataUrl?.startsWith("data:image/") ? (
                <img
                  src={selectedPreviewDoc.fileDataUrl}
                  alt={selectedPreviewDoc.name}
                  className="max-h-[50vh] w-auto object-contain rounded shadow"
                />
              ) : selectedPreviewDoc.fileDataUrl?.startsWith("data:text/html") ? (
                <iframe
                  srcDoc={(() => {
                    try {
                      const base64Content = selectedPreviewDoc.fileDataUrl.split(",")[1];
                      return decodeURIComponent(escape(atob(base64Content)));
                    } catch (e) {
                      return "";
                    }
                  })()}
                  title={selectedPreviewDoc.name}
                  className="min-h-[60vh] w-full rounded border-0 bg-white"
                />
              ) : selectedPreviewDoc.fileDataUrl?.startsWith("data:application/pdf") ? (
                <iframe
                  src={selectedPreviewDoc.fileDataUrl}
                  title={selectedPreviewDoc.name}
                  className="min-h-[60vh] w-full rounded border-0"
                />
              ) : (
                <div className="text-center p-8">
                  <FileText className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                  <p className="text-xs text-slate-500 font-semibold">
                    Aperçu non pris en charge dans cette fenêtre.
                  </p>
                  {selectedPreviewDoc.fileDataUrl && (
                    <button
                      onClick={() => openInNewTab(selectedPreviewDoc.fileDataUrl!)}
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
