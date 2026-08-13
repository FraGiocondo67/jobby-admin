"use client";

export type DocumentsRecord = {
  id_document_front?: string | null;
  id_document_back?: string | null;
  selfie_document?: string | null;
  presentation_photo?: string | null;
  casellario_doc?: string | null;
  visura_camerale?: string | null;
  lf_delega_signature?: string | null;
};

export const DOC_FIELDS: { key: keyof DocumentsRecord; label: string; optional?: boolean }[] = [
  { key: "id_document_front", label: "Documento - fronte" },
  { key: "id_document_back", label: "Documento - retro" },
  { key: "selfie_document", label: "Selfie con documento" },
  { key: "presentation_photo", label: "Logo / Foto attività" },
  { key: "casellario_doc", label: "Casellario giudiziale" },
  { key: "visura_camerale", label: "Visura camerale" },
  // Solo Libretto Famiglia — non mostrare "mancante" per tutti gli altri.
  { key: "lf_delega_signature", label: "Firma delega intermediario", optional: true },
];

export function downloadDataUri(dataUri: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUri;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Griglia documenti (base64 data URI, profiles_provider.documents) con
 * anteprima + download — usata sia dalla coda approvazione (PendingQueue)
 * sia dal dettaglio utente (UserDetail), Blocco 9. `visura_camerale` è
 * mostrata solo per attività di prossimità. */
export default function DocumentGrid({
  documents,
  isProximityBusiness,
  filenamePrefix,
}: {
  documents: DocumentsRecord | null | undefined;
  isProximityBusiness?: boolean;
  filenamePrefix: string;
}) {
  const docs = DOC_FIELDS.filter((f) => f.key !== "visura_camerale" || isProximityBusiness)
    .map((f) => ({ ...f, value: (documents || {})[f.key] || null }))
    .filter((f) => !f.optional || f.value);
  const anyDoc = docs.some((d) => d.value);
  if (!anyDoc) return <span className="badge badge-amber">Nessun documento caricato</span>;
  return (
    <div className="doc-grid">
      {docs.map((d) =>
        d.value ? (
          <div key={d.key} className="doc-item">
            <a href={d.value} target="_blank" rel="noreferrer">
              <img src={d.value} alt={d.label} className="doc-thumb" />
            </a>
            <div className="doc-label">{d.label}</div>
            <button type="button" className="btn btn-sm" onClick={() => downloadDataUri(d.value as string, `${filenamePrefix}_${d.key}.jpg`)}>
              Scarica
            </button>
          </div>
        ) : (
          <div key={d.key} className="doc-item doc-missing">
            <div className="doc-thumb doc-thumb-empty" />
            <div className="doc-label">{d.label}</div>
            <span className="badge badge-amber">mancante</span>
          </div>
        )
      )}
    </div>
  );
}
