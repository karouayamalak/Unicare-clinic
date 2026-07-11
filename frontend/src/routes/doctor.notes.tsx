import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-ext/primitives";
import { fetchAppointments, type ApiAppointment } from "@/lib/api";
import { FileText, Plus, X, Save, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/authStore";

export const Route = createFileRoute("/doctor/notes")({
  component: DoctorNotes,
});

interface Note {
  id: string;
  patientName: string;
  date: string;
  content: string;
  appointmentId: string;
}

const NOTES_STORAGE_KEY = "medigen_doctor_notes";

function loadNotes(): Note[] {
  try {
    return JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveNotes(notes: Note[]) {
  localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
}

function DoctorNotes() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [selectedApptId, setSelectedApptId] = useState("");
  const [noteContent, setNoteContent] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchAppointments();
      setAppointments(
        res.data.appointments.filter(
          (a) => a.status === "Terminé" || a.status === "En consultation",
        ),
      );
    } catch {
      toast.error("Impossible de charger les rendez-vous.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    setNotes(loadNotes());
  }, []);

  const handleSaveNote = () => {
    if (!selectedApptId || !noteContent.trim()) {
      toast.error("Veuillez sélectionner un rendez-vous et saisir une note.");
      return;
    }
    const appt = appointments.find((a) => a._id === selectedApptId);
    if (!appt) return;

    const newNote: Note = {
      id: `note-${Date.now()}`,
      patientName: appt.patientName,
      date: new Date().toLocaleDateString("fr-DZ"),
      content: noteContent.trim(),
      appointmentId: appt._id,
    };
    const updated = [newNote, ...notes];
    setNotes(updated);
    saveNotes(updated);
    toast.success("Note clinique enregistrée.");
    setShowNew(false);
    setSelectedApptId("");
    setNoteContent("");
  };

  const handleDelete = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    saveNotes(updated);
    toast.success("Note supprimée.");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notes cliniques"
        description="Annotations structurées par patient et rendez-vous."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="cursor-pointer rounded-xl border border-border bg-white p-2.5 hover:bg-slate-50 transition shadow-sm"
            >
              <RefreshCw className={`h-4 w-4 text-ink-soft ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => setShowNew(true)}
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-[#06122e] px-4 py-2.5 text-sm font-bold text-white shadow hover:opacity-90 transition"
            >
              <Plus className="h-4 w-4" /> Nouvelle note
            </button>
          </div>
        }
      />

      {showNew && (
        <div className="rounded-2xl border border-border bg-white/60 p-6 shadow-soft space-y-4">
          <h3 className="font-bold text-ink text-sm">Nouvelle note clinique</h3>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-ink-soft mb-1.5">
              Rendez-vous
            </label>
            <select
              value={selectedApptId}
              onChange={(e) => setSelectedApptId(e.target.value)}
              className="w-full rounded-xl border border-border bg-slate-50 px-3.5 py-2.5 text-sm text-ink focus:border-teal focus:outline-none shadow-sm"
            >
              <option value="">Sélectionner un patient…</option>
              {appointments.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.patientName} — {a.date} à {a.time}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-ink-soft mb-1.5">
              Contenu de la note
            </label>
            <textarea
              rows={5}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Observations, plan de traitement, remarques cliniques…"
              className="w-full rounded-xl border border-border bg-slate-50 px-3.5 py-2.5 text-sm text-ink focus:border-teal focus:outline-none shadow-sm resize-none"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                setShowNew(false);
                setSelectedApptId("");
                setNoteContent("");
              }}
              className="cursor-pointer rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-ink-soft hover:bg-slate-50 transition"
            >
              Annuler
            </button>
            <button
              onClick={handleSaveNote}
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-[#06122e] px-4 py-2 text-sm font-bold text-white hover:opacity-90 transition"
            >
              <Save className="h-4 w-4" /> Enregistrer
            </button>
          </div>
        </div>
      )}

      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <FileText className="h-12 w-12 opacity-20" />
          <p className="text-sm font-medium">Aucune note clinique enregistrée.</p>
          <p className="text-xs">Créez votre première note après une consultation.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((n) => (
            <article
              key={n.id}
              className="relative rounded-2xl border border-border bg-white/60 p-6 shadow-soft hover:shadow-md transition"
            >
              <button
                onClick={() => handleDelete(n.id)}
                className="absolute right-4 top-4 rounded-lg p-1 text-slate-300 hover:text-red-400 hover:bg-red-50 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-3 mb-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-400">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#06122e]">{n.patientName}</p>
                  <p className="text-xs text-ink-soft">{n.date}</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-ink-soft">{n.content}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
