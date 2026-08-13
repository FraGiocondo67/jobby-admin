"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";

const VERTICALS: { key: string; label: string; desc: string }[] = [
  { key: "pulizie", label: "Pulizie", desc: "Commissione JOBBY su ogni lavoro di pulizia (routers/richieste.py)." },
  { key: "babysitting", label: "Babysitting", desc: "Commissione JOBBY su ogni servizio di babysitting." },
  { key: "driver", label: "Driver", desc: "Commissione JOBBY su ogni corsa/servizio driver." },
  { key: "artigiani", label: "Artigiani della casa", desc: "Commissione JOBBY su ogni intervento artigiani (tutti i mestieri)." },
];

/** Markup/commissione JOBBY per verticale — profitto trattenuto sulla
 * prestazione erogata dal provider. Il meccanismo (app_settings, chiave
 * "<verticale>_fee_pct", usato realmente in ogni calcolo prezzo di ciascun
 * router) esisteva già da tempo — GET/POST /admin/<verticale>/fee
 * (routers/richieste.py|babysitting.py|driver.py|artigiani.py, Blocco 9)
 * mancava solo l'esposizione in un pannello (era nel vecchio Emergent,
 * "markup per attività", segnalato dall'utente confrontando gli
 * screenshot). Nota: distinto dalla sezione "Commissione JOBBY" sopra, che
 * è solo il contenuto informativo mostrato in onboarding — questo invece
 * incide realmente su ogni transazione. */
export default function VerticalFees() {
  const [values, setValues] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Record<string, number>>({});

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setError(null);
    try {
      const results = await Promise.all(
        VERTICALS.map((v) => apiFetch<{ fee_pct: number }>(`/api/admin/${v.key}/fee`).then((r) => [v.key, r.fee_pct] as const))
      );
      setValues(Object.fromEntries(results));
      setLoaded(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Errore di caricamento");
    }
  }

  async function handleSave(key: string) {
    setSaving(key);
    setError(null);
    try {
      const res = await apiFetch<{ fee_pct: number }>(`/api/admin/${key}/fee`, {
        method: "POST",
        body: { fee_pct: values[key] },
      });
      setValues((prev) => ({ ...prev, [key]: res.fee_pct }));
      setSavedAt((prev) => ({ ...prev, [key]: Date.now() }));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Errore durante il salvataggio");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="card">
      <div className="card-title">Markup per attività (per verticale)</div>
      <div className="card-desc">
        Percentuale trattenuta da JOBBY su ogni prestazione erogata, addebitata al fornitore del servizio e trattenuta
        dall&apos;importo liquidato.
      </div>

      {error && <div className="error-box">{error}</div>}
      {!loaded && !error && <div className="empty-state">Caricamento...</div>}

      {loaded && (
        <div className="fee-grid" style={{ marginTop: 10 }}>
          {VERTICALS.map((v) => (
            <div key={v.key} className="detail-section" style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}>
              <label className="field-label">{v.label}</label>
              <div className="detail-field-label" style={{ marginBottom: 6 }}>
                {v.desc}
              </div>
              <div className="row-actions">
                <input
                  className="search-input"
                  type="number"
                  step="0.5"
                  style={{ maxWidth: 100 }}
                  value={values[v.key] ?? 0}
                  onChange={(e) => setValues((prev) => ({ ...prev, [v.key]: Number(e.target.value) }))}
                />
                <span>%</span>
                <button className="btn btn-accent btn-sm" disabled={saving === v.key} onClick={() => handleSave(v.key)}>
                  {saving === v.key ? "Salvataggio..." : "Salva"}
                </button>
                {savedAt[v.key] && saving !== v.key && <span className="badge badge-green">Salvato</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
