"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/** Login: stessa auth Supabase usata da jobby-web/app mobile, nessun
 * sistema separato. Dopo il login, AuthProvider (nel layout del gruppo
 * "(app)") verifica lato backend che l'utente abbia role="admin" prima
 * di dare accesso: qui non facciamo nessun controllo sui ruoli. */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);
    if (signInError) {
      setError("Email o password non corrette.");
      return;
    }
    router.replace("/users");
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-logo">
          <span className="dot" />
          JOBBY Admin
        </div>
        <div className="login-sub">Accedi con il tuo account amministratore.</div>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-accent" style={{ width: "100%" }} disabled={submitting}>
            {submitting ? "Accesso in corso..." : "Accedi"}
          </button>
        </form>
      </div>
    </div>
  );
}
