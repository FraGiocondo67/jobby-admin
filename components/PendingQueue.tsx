"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";

type PendingProvider = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  contact_email: string;
  email_verified: boolean;
  provider_state: string;
  business_name: string | null;
  vat_number: string | null;
  codice_fiscale: string | null;
  provider_profile_type: string | null;
  address: string | null;
  casellario_verified: boolean | null;
  lf_delega_signed: boolean | null;
  lf_inps_registered: boolean | null;
};

type Action = "approve" | "suspend" | "reject" | "waitlist" | "convert_lf";

const ACTION_LABELS: Record<Action, string> = {
  approve: "Approva",
  suspend: "Sospendi",
  reject: "Rifiuta",
  waitlist: "Lista d'attesa",
  convert_lf: "Proponi Libretto Famiglia",
};

/** Coda di approvazione provider: GET /admin/onboarding/pending +
 * POST /admin/onboarding/{user_id}/decision (routers/provider_onboarding.py).
 * Mostra solo chi ha davvero completato il submit o è già in waitlist —
 * il filtro "in sospeso ma incompleto" lo fa già il backend. */
export default function PendingQueue() {
  const [rows, setRows] = useState<PendingProvider[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const data = await apiFetch<PendingProvider[]>("/api/admin/onboarding/pending");
      setRows(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Errore di caricamento");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDecision(userId: string, action: Action) {
    if (action === "reject" && !confirm("Confermi il rifiuto di questo provider?")) return;
    setBusyId(userId);
    try {
      await apiFetch(`/api/admin/onboarding/${userId}/decision`, { method: "POST", body: { action } });
      setRows((prev) => (prev ? prev.filter((r) => r.user_id !== userId) : prev));
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Errore durante l'operazione");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="card">
      <div className="card-title">Provider in approvazione</div>
      <div className="card-desc">Registrazioni completate in attesa di una decisione.</div>

      {error && <div className="error-box">{error}</div>}

      {rows === null && !error && <div className="empty-state">Caricamento...</div>}
      {rows !== null && rows.length === 0 && <div className="empty-state">Nessun provider in attesa al momento.</div>}

      {rows !== null && rows.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Attività</th>
              <th>P.IVA / CF</th>
              <th>Profilo</th>
              <th>Stato</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.user_id}>
                <td>{r.full_name || "—"}</td>
                <td>
                  {r.email}
                  {!r.email_verified && (
                    <div>
                      <span className="badge badge-amber">email non verificata</span>
                    </div>
                  )}
                </td>
                <td>{r.business_name || "—"}</td>
                <td>{r.vat_number || r.codice_fiscale || "—"}</td>
                <td>{r.provider_profile_type || "—"}</td>
                <td>
                  <span className="badge badge-amber">{r.provider_state || "pending"}</span>
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      className="btn btn-accent btn-sm"
                      disabled={busyId === r.user_id}
                      onClick={() => handleDecision(r.user_id, "approve")}
                    >
                      {ACTION_LABELS.approve}
                    </button>
                    <button
                      className="btn btn-sm"
                      disabled={busyId === r.user_id}
                      onClick={() => handleDecision(r.user_id, "waitlist")}
                    >
                      {ACTION_LABELS.waitlist}
                    </button>
                    <button
                      className="btn btn-sm"
                      disabled={busyId === r.user_id}
                      onClick={() => handleDecision(r.user_id, "suspend")}
                    >
                      {ACTION_LABELS.suspend}
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      disabled={busyId === r.user_id}
                      onClick={() => handleDecision(r.user_id, "reject")}
                    >
                      {ACTION_LABELS.reject}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
