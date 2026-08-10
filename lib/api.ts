"use client";

import { supabase } from "./supabase";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

export class ApiError extends Error {
  constructor(public status: number, message: string, public detail?: unknown) {
    super(message);
  }
}

/** Chiamata autenticata al backend FastAPI (Blocco 7, Render) — recupera il
 * token Supabase della sessione corrente e lo inoltra come Bearer, stesso
 * pattern già usato da jobby-web/app mobile. Nessuna logica di business qui:
 * il backend fa da unica fonte di verità (vedi deps_pg.require_admin). */
export async function apiFetch<T = unknown>(
  path: string,
  opts: { method?: string; body?: unknown } = {}
): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new ApiError(401, "Sessione scaduta, effettua di nuovo il login");

  const res = await fetch(`${BACKEND_URL}${path}`, {
    method: opts.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message =
      (payload && (payload.detail || payload.message)) ||
      `Errore ${res.status} su ${path}`;
    throw new ApiError(res.status, typeof message === "string" ? message : JSON.stringify(message), payload);
  }
  return payload as T;
}
