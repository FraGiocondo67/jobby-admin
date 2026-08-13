"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";

type FeeConfig = {
  visit_fixed_total: number;
  provider_share: number;
  client_share: number;
  recurring_total: number;
  recurring_after_month: number;
};

type FeeSegments = { provider: FeeConfig; business: FeeConfig };

const SEGMENT_INFO: { key: keyof FeeSegments; title: string; desc: string }[] = [
  {
    key: "provider",
    title: "Provider individuali",
    desc: "Persona fisica, P.IVA o Libretto Famiglia — profilo non di prossimità.",
  },
  {
    key: "business",
    title: "Attività di prossimità",
    desc: "Provider registrati come attività/impresa di prossimità (is_proximity_business).",
  },
];

const FIELD_INFO: { key: keyof FeeConfig; label: string; step?: string }[] = [
  { key: "visit_fixed_total", label: "Totale fisso per visita (€)", step: "0.01" },
  { key: "provider_share", label: "Quota provider (€)", step: "0.01" },
  { key: "client_share", label: "Quota cliente (€)", step: "0.01" },
  { key: "recurring_total", label: "Totale per visite ricorrenti (€)", step: "0.01" },
  { key: "recurring_after_month", label: "Ricorrenza applicata dopo N mesi", step: "1" },
];

/** Configurazione di "La commissione JOBBY" (schermata di onboarding lato
 * app, i18n.feeTitle) — GET/POST /admin/onboarding/fee
 * (routers/provider_onboarding.py, Blocco 9). Prima era un'unica
 * configurazione globale, non modificabile da nessun pannello (solo via
 * script/SQL diretto); ora è articolata per tipo di attività e modificabile
 * qui, un segmento alla volta. */
export default function FeeSettings() {
  const [data, setData] = useState<FeeSegments | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Record<string, number>>({});

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setError(null);
    try {
      const cfg = await apiFetch<FeeSegments>("/api/admin/onboarding/fee");
      setData(cfg);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Errore di caricamento");
    }
  }

  function updateField(segment: keyof FeeSegments, field: keyof FeeConfig, value: number) {
    setData((prev) => (prev ? { ...prev, [segment]: { ...prev[segment], [field]: value } } : prev));
  }

  async function handleSave(segment: keyof FeeSegments) {
    if (!data) return;
    setSaving(segment);
    setError(null);
    try {
      const updated = await apiFetch<FeeSegments>("/api/admin/onboarding/fee", {
        method: "POST",
        body: { segment, ...data[segment] },
      });
      setData(updated);
      setSavedAt((prev) => ({ ...prev, [segment]: Date.now() }));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Errore durante il salvataggio");
    } finally {
      setSaving(null);
    }
  }

  if (error && !data) {
    return (
      <div className="card">
        <div className="error-box">{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card">
        <div className="empty-state">Caricamento...</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {error && (
        <div className="card">
          <div className="error-box">{error}</div>
        </div>
      )}
      {SEGMENT_INFO.map((seg) => (
        <div className="card" key={seg.key}>
          <div className="card-title">{seg.title}</div>
          <div className="card-desc">{seg.desc}</div>

          <div className="fee-grid">
            {FIELD_INFO.map((f) => (
              <div key={f.key}>
                <label className="field-label">{f.label}</label>
                <input
                  className="search-input"
                  type="number"
                  step={f.step}
                  value={data[seg.key][f.key]}
                  onChange={(e) => updateField(seg.key, f.key, Number(e.target.value))}
                />
              </div>
            ))}
          </div>

          <div className="row-actions" style={{ marginTop: 14 }}>
            <button className="btn btn-accent btn-sm" disabled={saving === seg.key} onClick={() => handleSave(seg.key)}>
              {saving === seg.key ? "Salvataggio..." : "Salva"}
            </button>
            {savedAt[seg.key] && !saving && <span className="badge badge-green">Salvato</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
