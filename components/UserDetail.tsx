"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import DocumentGrid from "@/components/DocumentGrid";

type UserDetailData = {
  user: Record<string, any>;
  client_profile?: Record<string, any>;
  provider_profile?: Record<string, any>;
};

function Field({ label, value }: { label: string; value: any }) {
  if (value === null || value === undefined || value === "") return null;
  const display = typeof value === "boolean" ? (value ? "Sì" : "No") : typeof value === "object" ? JSON.stringify(value) : String(value);
  return (
    <div className="detail-field">
      <div className="detail-field-label">{label}</div>
      <div className="detail-field-value">{display}</div>
    </div>
  );
}

/** Dettaglio utente completo: GET /admin/users/{id} (routers/admin_users.py
 * — endpoint già esistente ma mai collegato a nessuna UI finora, segnalato
 * dall'utente: "ogni user deve essere cliccabile e accedere a tutti i dati
 * registrati"). Mostra anagrafica + dati fiscali/indirizzo di entrambi i
 * profili (client e/o provider, indipendentemente da quale sia "attivo" lato
 * app) e tutti i documenti caricati in onboarding. */
export default function UserDetail({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [data, setData] = useState<UserDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function load() {
    setError(null);
    setData(null);
    try {
      const d = await apiFetch<UserDetailData>(`/api/admin/users/${userId}`);
      setData(d);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Errore di caricamento");
    }
  }

  const u = data?.user;
  const cp = data?.client_profile;
  const pp = data?.provider_profile;
  const fiscal = pp?.fiscal_data || {};
  const business = pp?.business_data || {};

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 820 }} onClick={(e) => e.stopPropagation()}>
        <div className="card-title">Dettaglio utente</div>

        {error && <div className="error-box">{error}</div>}
        {!data && !error && <div className="empty-state">Caricamento...</div>}

        {u && (
          <>
            <div className="detail-section">
              <div className="detail-section-title">Dati account</div>
              <div className="detail-grid">
                <Field label="Nome" value={u.full_name} />
                <Field label="Email" value={u.email} />
                <Field label="Email verificata" value={u.is_email_verified} />
                <Field label="Telefono" value={u.phone} />
                <Field label="Telefono verificato" value={u.is_phone_verified} />
                <Field label="Ruolo" value={u.role} />
                <Field label="Stato" value={u.status} />
                <Field label="Codice fiscale (account)" value={u.codice_fiscale} />
                <Field label="Lingua" value={u.preferred_lang} />
                <Field label="Registrato il" value={u.created_at && new Date(u.created_at).toLocaleString("it-IT")} />
                <Field label="Ultimo login" value={u.last_login_at && new Date(u.last_login_at).toLocaleString("it-IT")} />
              </div>
            </div>

            {cp && (
              <div className="detail-section">
                <div className="detail-section-title">Profilo cliente</div>
                <div className="detail-grid">
                  <Field label="Indirizzo" value={cp.address} />
                  <Field label="Raggio di ricerca (km)" value={cp.search_radius_km} />
                  <Field label="Categorie preferite" value={(cp.preferred_categories || []).join(", ")} />
                  <Field label="Trust score" value={cp.trust_score} />
                  <Field label="Missioni totali" value={cp.total_missions} />
                  <Field label="Missioni annullate" value={cp.cancelled_missions} />
                  <Field label="Speso totale (€)" value={cp.total_spent} />
                  <Field label="Valutazione media" value={cp.avg_rating} />
                </div>
              </div>
            )}

            {pp && (
              <>
                <div className="detail-section">
                  <div className="detail-section-title">
                    Profilo provider {pp.is_proximity_business ? "— attività di prossimità" : ""}
                  </div>
                  <div className="detail-grid">
                    <Field label="Bio" value={pp.bio} />
                    <Field label="Tariffa oraria (€)" value={pp.hourly_rate} />
                    <Field label="Competenze" value={(pp.skills || []).join(", ")} />
                    <Field label="Raggio operativo (km)" value={pp.operational_radius_km} />
                    <Field label="Stato disponibilità" value={pp.availability_status} />
                    <Field label="Stato KYC" value={pp.kyc_status} />
                    <Field label="Trust score" value={pp.trust_score} />
                    <Field label="Missioni totali" value={pp.total_missions} />
                    <Field label="Missioni completate" value={pp.completed_missions} />
                    <Field label="Valutazione media" value={pp.avg_rating} />
                    <Field label="Guadagnato totale (€)" value={pp.total_earned} />
                  </div>
                </div>

                <div className="detail-section">
                  <div className="detail-section-title">Dati fiscali</div>
                  <div className="detail-grid">
                    <Field label="Tipo profilo" value={fiscal.profile_type} />
                    <Field label="Data di nascita" value={fiscal.dob} />
                    <Field label="Codice fiscale" value={fiscal.codice_fiscale} />
                    <Field label="IBAN" value={fiscal.iban} />
                    <Field label="Condizione soggettiva" value={fiscal.condizione_soggettiva} />
                    <Field label="Ragione sociale" value={business.business_name} />
                    <Field label="P.IVA" value={business.vat_number} />
                    <Field label="Indirizzo attività" value={business.address} />
                  </div>
                </div>

                <div className="detail-section">
                  <div className="detail-section-title">Documenti caricati</div>
                  <DocumentGrid documents={pp.documents} isProximityBusiness={!!pp.is_proximity_business} filenamePrefix={userId} />
                </div>
              </>
            )}
          </>
        )}

        <div className="row-actions" style={{ marginTop: 16, justifyContent: "flex-end" }}>
          <button className="btn btn-sm" onClick={onClose}>
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
