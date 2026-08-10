"use client";

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client singleton lato browser — login/sessione admin via Supabase Auth,
// stesso progetto usato da jobby-web e dall'app mobile. Non c'è un sistema
// di login separato per il pannello: chiunque abbia un utente con
// `role = 'admin'` su `public.users` può entrare (verificato dal backend,
// vedi lib/api.ts + AuthGuard).
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
