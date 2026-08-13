"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";

type AdminCategoryRow = {
  id: string;
  slug: string;
  name_it: string;
  name_en: string;
  icon: string | null;
  category_type: "standard" | "proximity" | "payment_service";
  requires_kyc: boolean;
  is_active: boolean;
  sort_order: number;
};

const TYPE_TABS: { value: string; label: string }[] = [
  { value: "", label: "Tutte" },
  { value: "standard", label: "Standard" },
  { value: "proximity", label: "Prossimità" },
  { value: "payment_service", label: "Servizi di pagamento" },
];

const TYPE_LABEL: Record<string, string> = {
  standard: "Standard",
  proximity: "Prossimità",
  payment_service: "Pagamento",
};

/** Gestione categorie: GET/PUT /admin/categories (routers/categories.py,
 * Blocco 9 — prima non esisteva alcuna gestione admin su Postgres, solo una
 * versione Mongo ritirata nel Blocco 7, vedi commento nel router). Azioni
 * disponibili: attiva/disattiva e modifica nome/icona/ordinamento. Niente
 * commissione: in questo schema non è un campo della categoria (gestita
 * per-verticale altrove), a differenza del vecchio modello Mongo. */
export default function CategoriesTable() {
  const [rows, setRows] = useState<AdminCategoryRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminCategoryRow | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setError(null);
    try {
      const data = await apiFetch<{ categories: AdminCategoryRow[] }>(`/api/admin/categories`);
      setRows(data.categories);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Errore di caricamento");
    }
  }

  async function handleToggle(row: AdminCategoryRow) {
    setBusyId(row.id);
    try {
      const res = await apiFetch<{ id: string; is_active: boolean }>(`/api/admin/categories/${row.id}/toggle`, {
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
    try {
      const updated = await apiFetch<AdminCategoryRow>(`/api/admin/categories/${editing.id}`, {
        method: "PUT",
        body: {
          name_it: editing.name_it,
          name_en: editing.name_en,
          icon: editing.icon,
          sort_order: editing.sort_order,
          requires_kyc: editing.requires_kyc,
        },
      });
      setRows((prev) => (prev ? prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)) : prev));
      setEditing(null);
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Errore durante il salvataggio");
    } finally {
      setSaving(false);
    }
  }

  const filtered = rows?.filter((r) => !type || r.category_type === type) ?? null;

  return (
    <div className="card">
      <div className="card-title">Categorie di servizio</div>
      <div className="card-desc">
        Standard (verticali con configuratore dedicato), Prossimità (attività fisiche vicine) e Servizi di pagamento.
        Le categorie disattivate non compaiono nella app né su jobby-web.
      </div>

      <div className="tabs">
        {TYPE_TABS.map((t) => (
          <button key={t.value} className={`tab${type === t.value ? " active" : ""}`} onClick={() => setType(t.value)}>
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className="error-box">{error}</div>}
      {filtered === null && !error && <div className="empty-state">Caricamento...</div>}
      {filtered !== null && filtered.length === 0 && <div className="empty-state">Nessuna categoria con questo filtro.</div>}

      {filtered !== null && filtered.length > 0 && (
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Nome (IT)</th>
              <th>Nome (EN)</th>
              <th>Slug</th>
              <th>Tipo</th>
              <th>KYC</th>
              <th>Ordine</th>
              <th>Stato</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td style={{ fontSize: 20 }}>{c.icon || "—"}</td>
                <td>{c.name_it}</td>
                <td>{c.name_en}</td>
                <td>
                  <span className="badge badge-gray">{c.slug}</span>
                </td>
                <td>{TYPE_LABEL[c.category_type] || c.category_type}</td>
                <td>{c.requires_kyc ? "Sì" : "No"}</td>
                <td>{c.sort_order}</td>
                <td>
                  <span className={`badge ${c.is_active ? "badge-green" : "badge-gray"}`}>
                    {c.is_active ? "attiva" : "disattiva"}
                  </span>
                </td>
                <td>
                  <div className="row-actions">
                    <button className="btn btn-sm" onClick={() => setEditing(c)}>
                      Modifica
                    </button>
                    <button
                      className={`btn btn-sm ${c.is_active ? "" : "btn-accent"}`}
                      disabled={busyId === c.id}
                      onClick={() => handleToggle(c)}
                    >
                      {c.is_active ? "Disattiva" : "Attiva"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing && (
        <div className="modal-backdrop" onClick={() => !saving && setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="card-title">Modifica «{editing.slug}»</div>
            <label className="field-label">Nome (IT)</label>
            <input
              className="search-input"
              value={editing.name_it}
              onChange={(e) => setEditing({ ...editing, name_it: e.target.value })}
            />
            <label className="field-label">Nome (EN)</label>
            <input
              className="search-input"
              value={editing.name_en}
              onChange={(e) => setEditing({ ...editing, name_en: e.target.value })}
            />
            <label className="field-label">Icona (emoji)</label>
            <input
              className="search-input"
              value={editing.icon || ""}
              onChange={(e) => setEditing({ ...editing, icon: e.target.value })}
            />
            <label className="field-label">Ordinamento</label>
            <input
              className="search-input"
              type="number"
              value={editing.sort_order}
              onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })}
            />
            <label className="field-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={editing.requires_kyc}
                onChange={(e) => setEditing({ ...editing, requires_kyc: e.target.checked })}
              />
              Richiede KYC
            </label>
            <div className="row-actions" style={{ marginTop: 14, justifyContent: "flex-end" }}>
              <button className="btn btn-sm" disabled={saving} onClick={() => setEditing(null)}>
                Annulla
              </button>
              <button className="btn btn-accent btn-sm" disabled={saving} onClick={handleSaveEdit}>
                {saving ? "Salvataggio..." : "Salva"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
