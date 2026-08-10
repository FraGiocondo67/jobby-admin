"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./supabase";
import { apiFetch, ApiError } from "./api";

type AdminUser = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
};

type AuthState = {
  loading: boolean;
  user: AdminUser | null;
  error: string | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  loading: true,
  user: null,
  error: null,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

/** Guardia di accesso al pannello: verifica la sessione Supabase, poi
 * chiama il backend (GET /auth/me) per controllare che l'utente abbia
 * `role = 'admin'` — il backend resta l'unica fonte di verità sui ruoli,
 * qui non si fa nessun controllo "furbo" lato client che possa disallinearsi. */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        if (!cancelled) {
          setLoading(false);
          router.replace("/login");
        }
        return;
      }
      try {
        const me = await apiFetch<{ user: AdminUser }>("/api/auth/me");
        if (cancelled) return;
        if (me.user.role !== "admin") {
          setError("Il tuo account non ha i permessi di amministratore.");
          setLoading(false);
          return;
        }
        setUser(me.user);
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        const message = e instanceof ApiError ? e.message : "Errore di connessione al backend";
        setError(message);
        setLoading(false);
      }
    }

    check();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") router.replace("/login");
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <AuthContext.Provider value={{ loading, user, error, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
