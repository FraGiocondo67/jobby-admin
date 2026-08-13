"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthProvider";

const NAV_ITEMS = [
  { href: "/users", label: "Utenti", disabled: false },
  { href: "/categories", label: "Categorie", disabled: false },
  { href: "/disputes", label: "Dispute", disabled: true },
  { href: "/reviews", label: "Recensioni", disabled: true },
];

/** Voci disabilitate = schermate non ancora costruite (verranno aggiunte
 * una alla volta, come deciso: "lo scriverai tu su mie indicazioni"). */
export default function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="dot" />
        JOBBY Admin
      </div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          if (item.disabled) {
            return (
              <span key={item.href} className="sidebar-link disabled" title="In arrivo">
                {item.label}
              </span>
            );
          }
          return (
            <Link key={item.href} href={item.href} className={`sidebar-link${active ? " active" : ""}`}>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        {user && (
          <div className="sidebar-user">
            <strong>{user.full_name || user.email}</strong>
            <div>{user.email}</div>
          </div>
        )}
        <button className="signout-btn" onClick={signOut}>
          Esci
        </button>
      </div>
    </aside>
  );
}
