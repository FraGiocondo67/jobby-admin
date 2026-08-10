"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";

type AdminUserRow = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  status: string;
  preferred_lang: string | null;
  is_email_verified: boolean;
  created_at: string;
};

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "", label: "Tutti" },
  { value: "active", label: "Attivi" },
  { value: "pending", label: "In attesa" },
  { value: "suspended", label: "Sospesi" },
  { value: "rejected", label: "Rifiutati" },
  { value: "deleted", label: "Eliminati" },
];

const STATUS_BADGE: Record<string, string> = {
  active: "badge-green",
  pending: "badge-amber",
  suspended: "badge-red",
  rejected: "badge-red",
  deleted: "badge-gray",
};

const PAGE_SIZE = 50;

/** Elenco generale utenti: GET /admin/users (routers/admin_users.py, Blocco 8).
 * La ricerca testuale (q) è fatta lato Python nel backend su un batch più
 * ampio (fino a 1000 righe) — non è un vero full-text su tutta la tabella,
 * coerente con quanto documentato nel router. Le azioni di stato sono
 * limitate a active/suspended/rejected, come impone il backend. */
export default function UsersTable() {
  const [rows, setRows] = useState<AdminUserRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [role, setRole] = useState("");
  const [q, setQ] = useState("");
  const [qInput, setQInput] = useState("");
  const [offset, setOffset] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setQ(qInput.trim()), 350);
    return () => clearTimeout(t);
  }, [qInput]);

  useEffect(() => {
    setOffset(0);
  }, [status, role, q]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, role, q, offset]);

  async function load() {
    setError(null);
    try {
      const params = new URLSearchParams();
      if (role) params.set("role", role);
      if (status) params.set("status", status);
      if (q) params.set("q", q);
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String(offset));
      const data = await apiFetch<{ users: AdminUserRow[]; count: number }>(`/api/admin/users?${params.toString()}`);
      setRows(data.users);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Errore di caricamento");
    }
  }

  async function handleStatusChange(userId: string, newStatus: "active" | "suspended" | "rejected") {
    setBusyId(userId);
    try {
      await apiFetch(`/api/admin/users/${userId}/status`, { method: "POST", body: { status: newStatus } });
      setRows((prev) => (prev ? prev.map((r) => (r.id === userId ? { ...r, status: newStatus } : r)) : prev));
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Errore durante l'operazione");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="card">
      <div className="card-title">Tutti gli utenti</div>
      <div className="card-desc">Elenco completo, filtrabile per ruolo e stato.</div>

      <div className="tabs">
        {STATUS_TABS.map((t) => (
          <button key={t.value} className={`tab${status === t.value ? " active" : ""}`} onClick={() => setStatus(t.value)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="filters-bar">
        <input
          className="search-input"
          placeholder="Cerca per nome, email o telefono..."
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
        />
        <select className="select-input" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">Tutti i ruoli</option>
          <option value="client">Client</option>
          <option value="provider">Provider</option>
          <option value="both">Entrambi</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {error && <div className="error-box">{error}</div>}
      {rows === null && !error && <div className="empty-state">Caricamento...</div>}
      {rows !== null && rows.length === 0 && <div className="empty-state">Nessun utente trovato con questi filtri.</div>}

      {rows !== null && rows.length > 0 && (
        <>
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Telefono</th>
                <th>Ruolo</th>
                <th>Stato</th>
                <th>Registrato il</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id}>
                  <td>{u.full_name || "—"}</td>
                  <td>
                    {u.email}
                    {!u.is_email_verified && (
                      <div>
                        <span className="badge badge-amber">non verificata</span>
                      </div>
                    )}
                  </td>
                  <td>{u.phone || "—"}</td>
                  <td>
                    <span className="badge badge-gray">{u.role}</span>
                  </td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[u.status] || "badge-gray"}`}>{u.status}</span>
                  </td>
                  <td>{new Date(u.created_at).toLocaleDateString("it-IT")}</td>
                  <td>
                    <div className="row-actions">
                      {u.status !== "active" && (
                        <button
                          className="btn btn-accent btn-sm"
                          disabled={busyId === u.id}
                          onClick={() => handleStatusChange(u.id, "active")}
                        >
                          Attiva
                        </button>
                      )}
                      {u.status !== "suspended" && (
                        <button
                          className="btn btn-sm"
                          disabled={busyId === u.id}
                          onClick={() => handleStatusChange(u.id, "suspended")}
                        >
                          Sospendi
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
            <button className="btn btn-sm" disabled={offset === 0} onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}>
              Precedenti
            </button>
            <button className="btn btn-sm" disabled={rows.length < PAGE_SIZE} onClick={() => setOffset((o) => o + PAGE_SIZE)}>
              Successivi
            </button>
          </div>
        </>
      )}
    </div>
  );
}
