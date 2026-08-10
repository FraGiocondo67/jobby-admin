# jobby-admin

Pannello di amministrazione custom per JOBBY (Blocco 8), deployato come
servizio Render separato dal backend. Sostituisce/anticipa il vecchio
`admin_web.py` (ritirato nel Blocco 7) e affianca l'ipotesi Retool
(Blocco 6, secondaria).

## Stack

- Next.js 14 (App Router) + React 18 + TypeScript
- Supabase Auth (stesso progetto usato da app mobile e jobby-web) — nessun
  sistema di login separato: l'accesso è concesso a chi ha `role = 'admin'`
  su `public.users`, verificato lato backend via `GET /api/auth/me`
- Backend: FastAPI su Render (`https://jobby-backend-a2s1.onrender.com`),
  chiamato con il token della sessione Supabase come Bearer

## Setup locale

```bash
npm install
cp .env.local.example .env.local   # poi compila NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

## Struttura

- `app/login/` — login (email/password Supabase)
- `app/(app)/` — area autenticata (layout con `AuthProvider` + sidebar)
- `app/(app)/users/` — prima schermata: coda approvazione provider
  (`GET/POST /api/admin/onboarding/...`) + elenco generale utenti
  (`GET/POST /api/admin/users...`, router `admin_users.py` del backend)
- `lib/supabase.ts` — client Supabase singleton
- `lib/api.ts` — helper `apiFetch` per chiamare il backend con Bearer token
- `lib/AuthProvider.tsx` — guardia di accesso (sessione + ruolo admin)
- `components/Sidebar.tsx` — navigazione laterale (le voci diverse da
  "Utenti" sono disabilitate finché non vengono costruite le relative
  schermate)

## Prossime schermate

Da costruire una alla volta, su indicazione: Categorie, Dispute,
Recensioni (moderazione). Endpoint di reset password e cancellazione
utente lato backend non ancora esposti (vedi nota in `admin_users.py`).

## Deploy

Servizio Render separato dal backend (repo dedicato), variabili
d'ambiente equivalenti a `.env.local.example` (`NEXT_PUBLIC_*`, build-time
per Next.js).
