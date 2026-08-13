"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";

type Mestiere = {
  id: string;
  slug: string;
  name_it: string;
  name_en: string;
  icon: string | null;
  richiede_abilitazione: boolean;
  richiede_fgas: boolean;
  richiede_libretto_famiglia: boolean;
  has_stage2_diagnosi: boolean;
  stagionale: boolean;
  is_active: boolean;
  sort_order: number;
};

const EMPTY_NEW = {
  slug: "", name_it: "", name_en: "", icon: "",
  richiede_abilitazione: false, richiede_fgas: false, richiede_libretto_famiglia: false,
  has_stage2_diagnosi: true, stagionale: false, sort_order: 0, is_active: true,
};

/** Gestione dei "mestieri" di Artigiani della casa (Idraulico, Elettricista,
 * Caldaista, Climatizzazione, Giardiniere, Tuttofare — public.artigiani_
 * mestieri) — GET/POST/PUT/toggle /admin/artigiani/mestieri
 * (routers/artigiani.py, Blocco 9). Prima non gestibili da nessun pannello:
 * la tabella era stata pensata per Retool (mai costruito, deprioritizzato a
 * favore di questo pannello custom). Aperto da CategoriesTable sulla riga
 * "Artigiani della casa" (unico consumer di questa tabella — nessun
 * parent_id in DB, il legame è implicito). */
export default function MestieriManager({ onClose }: { onClose: () => void }) {
  const [rows, setRows] = useState<Mestiere[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Mestiere | null>(null);
  const [creating, setCreating] = useState<typeof EMPTY_NEW | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setError(null);
    try {
      const data = await apiFetch<{ mestieri: Mestiere[] }>("/api/admin/artigiani/mestieri");
      setRows(data.mestieri);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Errore di caricamento");
    }
  }

  async function handleToggle(row: Mestiere) {
    setBusyId(row.id);
    try {
      const res = await apiFetch<{ id: string; is_active: boolean }>(`/api/admin/artigiani/mestieri/${row.id}/toggle`, {
        method: "POST",
      });
      setRows((prev) => (prev ? prev.map((r) => (r.id === row.id ? { ...r, is_active: res.is_active } : r)) : prev));
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Errore durante l'operazione");
    } finally {
      setBusyId(null);
    }
  }

  async function handleSaveEdit() {
    if (!editing) return;
    setSaving(true);
    setFormError(null);
    try {
      const updated = await apiFetch<Mestiere>(`/api/admin/artigiani/mestieri/${editing.id}`, {
        method: "PUT",
        body: {
          name_it: editing.name_it, name_en: editing.name_en, icon: editing.icon,
          richiede_abilitazione: editing.richiede_abilitazione, richiede_fgas: editing.richiede_fgas,
          richiede_libretto_famiglia: editing.richiede_libretto_famiglia,
          has_stage2_diagnosi: editing.has_stage2_diagnosi, stagionale: editing.stagionale,
          sort_order: editing.sort_order,
        },
      });
      setRows((prev) => (prev ? prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)) : prev));
      setEditing(null);
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : "Errore durante il salvataggio");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreate() {
    if (!creating) return;
    setFormError(null);
    if (!creating.slug.trim() || !creating.name_it.trim() || !creating.name_en.trim()) {
      setFormError("Slug, nome IT e nome EN sono obbligatori");
      return;
    }
    setSaving(true);
    try {
      const created = await apiFetch<Mestiere>("/api/admin/artigiani/mestieri", {
        method: "POST",
        body: { ...creating, slug: creating.slug.trim() },
      });
      setRows((prev) => (prev ? [...prev, created] : [created]));
      setCreating(null);
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : "Errore durante la creazione");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
        <div className="card-title">Mestieri — Artigiani della casa</div>
        <div className="card-desc">
          Le sottocategorie mostrate nella app sotto "Artigiani della casa". Legate a questa categoria per costruzione
          (unico verticale che le usa), non serve alcun collegamento manuale.
        </div>

        <div className="row-actions" style={{ margin: "10px 0" }}>
          <button className="btn btn-accent btn-sm" onClick={() => { setFormError(null); setCreating({ ...EMPTY_NEW }); }}>
            + Nuovo mestiere
          </button>
        </div>

        {error && <div className="error-box">{error}</div>}
        {rows === null && !error && <div className="empty-state">Caricamento...</div>}

        {rows !== null && (
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Nome (IT)</th>
                <th>Nome (EN)</th>
                <th>Ordine</th>
                <th>Stato</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id}>
                  <td style={{ fontSize: 18 }}>{m.icon || "—"}</td>
                  <td>{m.name_it}</td>
                  <td>{m.name_en}</td>
                  <td>{m.sort_order}</td>
                  <td>
                    <span className={`badge ${m.is_active ? "badge-green" : "badge-gray"}`}>
                      {m.is_active ? "attivo" : "disattivo"}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-sm" onClick={() => { setFormError(null); setEditing(m); }}>
                        Modifica
                      </button>
                      <button
                        className={`btn btn-sm ${m.is_active ? "" : "btn-accent"}`}
                        disabled={busyId === m.id}
                        onClick={() => handleToggle(m)}
                      >
                        {m.is_active ? "Disattiva" : "Attiva"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="row-actions" style={{ marginTop: 16, justifyContent: "flex-end" }}>
          <button className="btn btn-sm" onClick={onClose}>
            Chiudi
          </button>
        </div>

        {editing && (
          <div className="modal-backdrop" onClick={() => !saving && setEditing(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="card-title">Modifica «{editing.slug}»</div>
              {formError && <div className="error-box">{formError}</div>}
              <label className="field-label">Nome (IT)</label>
              <input className="search-input" value={editing.name_it} onChange={(e) => setEditing({ ...editing, name_it: e.target.value })} />
              <label className="field-label">Nome (EN)</label>
              <input className="search-input" value={editing.name_en} onChange={(e) => setEditing({ ...editing, name_en: e.target.value })} />
              <label className="field-label">Icona (emoji)</label>
              <input className="search-input" value={editing.icon || ""} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} />
              <label className="field-label">Ordinamento</label>
              <input className="search-input" type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
              <label className="field-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={editing.richiede_abilitazione} onChange={(e) => setEditing({ ...editing, richiede_abilitazione: e.target.checked })} />
                Richiede abilitazione
              </label>
              <label className="field-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={editing.richiede_fgas} onChange={(e) => setEditing({ ...editing, richiede_fgas: e.target.checked })} />
                Richiede patentino F-GAS
              </label>
              <label className="field-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={editing.richiede_libretto_famiglia} onChange={(e) => setEditing({ ...editing, richiede_libretto_famiglia: e.target.checked })} />
                Ammette Libretto Famiglia
              </label>
              <label className="field-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={editing.has_stage2_diagnosi} onChange={(e) => setEditing({ ...editing, has_stage2_diagnosi: e.target.checked })} />
                Ha fase 2 (diagnosi/preventivo)
              </label>
              <label className="field-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={editing.stagionale} onChange={(e) => setEditing({ ...editing, stagionale: e.target.checked })} />
                Stagionale
              </label>
              <div className="row-actions" style={{ marginTop: 14, justifyContent: "flex-end" }}>
                <button className="btn btn-sm" disabled={saving} onClick={() => setEditing(null)}>Annulla</button>
                <button className="btn btn-accent btn-sm" disabled={saving} onClick={handleSaveEdit}>
                  {saving ? "Salvataggio..." : "Salva"}
                </button>
              </div>
            </div>
          </div>
        )}

        {creating && (
          <div className="modal-backdrop" onClick={() => !saving && setCreating(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="card-title">Nuovo mestiere</div>
              {formError && <div className="error-box">{formError}</div>}
              <label className="field-label">Slug (identificativo univoco, es. "muratore")</label>
              <input className="search-input" value={creating.slug} onChange={(e) => setCreating({ ...creating, slug: e.target.value })} />
              <label className="field-label">Nome (IT)</label>
              <input className="search-input" value={creating.name_it} onChange={(e) => setCreating({ ...creating, name_it: e.target.value })} />
              <label className="field-label">Nome (EN)</label>
              <input className="search-input" value={creating.name_en} onChange={(e) => setCreating({ ...creating, name_en: e.target.value })} />
              <label className="field-label">Icona (emoji)</label>
              <input className="search-input" value={creating.icon} onChange={(e) => setCreating({ ...creating, icon: e.target.value })} />
              <label className="field-label">Ordinamento</label>
              <input className="search-input" type="number" value={creating.sort_order} onChange={(e) => setCreating({ ...creating, sort_order: Number(e.target.value) })} />
              <label className="field-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={creating.richiede_abilitazione} onChange={(e) => setCreating({ ...creating, richiede_abilitazione: e.target.checked })} />
                Richiede abilitazione
              </label>
              <label className="field-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={creating.richiede_fgas} onChange={(e) => setCreating({ ...creating, richiede_fgas: e.target.checked })} />
                Richiede patentino F-GAS
              </label>
              <label className="field-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={creating.richiede_libretto_famiglia} onChange={(e) => setCreating({ ...creating, richiede_libretto_famiglia: e.target.checked })} />
                Ammette Libretto Famiglia
              </label>
              <label className="field-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={creating.stagionale} onChange={(e) => setCreating({ ...creating, stagionale: e.target.checked })} />
                Stagionale
              </label>
              <div className="row-actions" style={{ marginTop: 14, justifyContent: "flex-end" }}>
                <button className="btn btn-sm" disabled={saving} onClick={() => setCreating(null)}>Annulla</button>
                <button className="btn btn-accent btn-sm" disabled={saving} onClick={handleCreate}>
                  {saving ? "Creazione..." : "Crea"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
