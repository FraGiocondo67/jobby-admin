"use client";

import { AuthProvider, useAuth } from "@/lib/AuthProvider";
import Sidebar from "@/components/Sidebar";

function Shell({ children }: { children: React.ReactNode }) {
  const { loading, user, error } = useAuth();

  if (loading) {
    return <div className="full-screen-msg">Verifica accesso in corso...</div>;
  }

  if (error && !user) {
    return (
      <div className="full-screen-msg" style={{ flexDirection: "column", gap: 10 }}>
        <div>{error}</div>
        <div style={{ fontSize: 12.5 }}>
          Se pensi sia un errore, contatta un altro amministratore.
        </div>
      </div>
    );
  }

  if (!user) {
    // AuthProvider sta reindirizzando a /login.
    return <div className="full-screen-msg">Reindirizzamento al login...</div>;
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main">{children}</main>
    </div>
  );
}

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Shell>{children}</Shell>
    </AuthProvider>
  );
}
