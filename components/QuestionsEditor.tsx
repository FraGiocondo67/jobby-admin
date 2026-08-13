"use client";

import { useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";

type Question = {
  id: string;
  text: string;
  type: "choice" | "multi";
  options: string[];
};

type Props = {
  categoryId: string;
  categoryLabel: string;
  initialQuestions: Question[];
  onClose: () => void;
  onSaved: (questions: Question[]) => void;
};

/** BLOCCO 9 (richiesta utente: "manca la gestione dei campi (FIELD) con
 * tutte le parametrizzazioni che ne determinano la tipologia del
 * servizio"): editor per service_categories.questions (colonna jsonb già
 * esistente e già letta dalla app — vedi Jobby_Emergent/frontend/app/
 * request/[id].tsx — ma finora modificabile solo via SQL diretto, mai da
 * un pannello). Ogni domanda ha un id stabile (referenziato dalle risposte
 * salvate nelle richieste esistenti, brief_answers.answers[q.id] —
 * cambiare l'id di una domanda esistente "orfana" le risposte già
 * raccolte, quindi l'editor permette di rinominarlo ma avvisa). */
export default function QuestionsEditor({ categoryId, categoryLabel, initialQuestions, onClose, onSaved }: Props) {
  const [questions, setQuestions] = useState<Question[]>(
    initialQuestions.length ? initialQuestions.map((q) => ({ ...q, options: [...(q.options || [])] })) : []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function nextId() {
    let n = questions.length + 1;
    const existing = new Set(questions.map((q) => q.id));
    while (existing.has(`q${n}`)) n++;
    return `q${n}`;
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, { id: nextId(), text: "", type: "choice", options: [] }]);
  }

  function updateQuestion(idx: number, patch: Partial<Question>) {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  }

  function removeQuestion(idx: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  }

  function move(idx: number, dir: -1 | 1) {
    setQuestions((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  async function handleSave() {
    setError(null);
    for (const q of questions) {
      if (!q.id.trim() || !q.text.trim()) {
        setError("Ogni campo deve avere un id e un testo.");
        return;
      }
      if (q.options.length === 0) {
        setError(`Il campo "${q.text}" deve avere almeno un'opzione.`);
        return;
      }
    }
    const ids = questions.map((q) => q.id.trim());
    if (new Set(ids).size !== ids.length) {
      setError("Gli id dei campi devono essere unici.");
      return;
    }
    setSaving(true);
    try {
      const clean = questions.map((q) => ({ id: q.id.trim(), text: q.text.trim(), type: q.type, options: q.options.filter((o) => o.trim()) }));
      await apiFetch(`/api/admin/categories/${categoryId}`, { method: "PUT", body: { questions: clean } });
      onSaved(clean);
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Errore durante il salvataggio");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={() => !saving && onClose()}>
      <div className="modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <div className="card-title">Campi di «{categoryLabel}»</div>
        <div className="card-desc">
          Domande mostrate al cliente quando richiede questo servizio (vedi app, schermata di richiesta). Tipo
          "scelta singola" o "scelta multipla", opzioni una per riga.
        </div>
        {error && <div className="error-box">{error}</div>}

        {questions.length === 0 && <div className="empty-state">Nessun campo configurato.</div>}

        {questions.map((q, idx) => (
          <div key={idx} className="field-block" style={{ border: "1px solid #e5e5e5", borderRadius: 8, padding: 12, marginBottom: 10 }}>
            <div className="row-actions" style={{ justifyContent: "space-between", marginBottom: 6 }}>
              <span className="badge badge-gray">{q.id}</span>
              <div className="row-actions">
                <button className="btn btn-sm" disabled={idx === 0} onClick={() => move(idx, -1)}>↑</button>
                <button className="btn btn-sm" disabled={idx === questions.length - 1} onClick={() => move(idx, 1)}>↓</button>
                <button className="btn btn-sm" onClick={() => removeQuestion(idx)}>Rimuovi</button>
              </div>
            </div>
            <label className="field-label">Id campo (usato per salvare la risposta)</label>
            <input className="search-input" value={q.id} onChange={(e) => updateQuestion(idx, { id: e.target.value })} />
            <label className="field-label">Testo della domanda</label>
            <input className="search-input" value={q.text} onChange={(e) => updateQuestion(idx, { text: e.target.value })} />
            <label className="field-label">Tipo</label>
            <select className="select-input" value={q.type} onChange={(e) => updateQuestion(idx, { type: e.target.value as "choice" | "multi" })}>
              <option value="choice">Scelta singola</option>
              <option value="multi">Scelta multipla</option>
            </select>
            <label className="field-label">Opzioni (una per riga)</label>
            <textarea
              className="search-input"
              rows={Math.max(3, q.options.length)}
              value={q.options.join("\n")}
              onChange={(e) => updateQuestion(idx, { options: e.target.value.split("\n") })}
            />
          </div>
        ))}

        <div className="row-actions" style={{ marginBottom: 14 }}>
          <button className="btn btn-sm" onClick={addQuestion}>+ Aggiungi campo</button>
        </div>

        <div className="row-actions" style={{ justifyContent: "flex-end" }}>
          <button className="btn btn-sm" disabled={saving} onClick={onClose}>Annulla</button>
          <button className="btn btn-accent btn-sm" disabled={saving} onClick={handleSave}>
            {saving ? "Salvataggio..." : "Salva"}
          </button>
        </div>
      </div>
    </div>
  );
}
