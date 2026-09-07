# Prasanna — court case tracker

A case tracker for advocates managing their own matters (Indian district/high
court conventions: CNR numbers, O.S./Crl.M.C./W.P.(C) case types). Built from
a Claude Design mockup — see `chats/chat1.md` for the original design
conversation and `project/` for the exported prototype it was built from.

## Stack

- `client/` — React (Vite) frontend, iPad-first but responsive down to phone
  widths. The "New case" screen renders a wide two-column layout (with a live
  record preview) above ~900px, and a single-column mobile layout below it.
- `server/` — Express API backed by Postgres (via `pg`).

## Running it

You need a Postgres database. Easiest option, using the included Docker
Compose file:

```sh
docker compose up -d
```

That starts Postgres on `localhost:5432` with a database matching the
example env file below. If you'd rather use a hosted Postgres (Neon,
Supabase, Railway, etc.), just point `DATABASE_URL` at that instead.

Then, in two terminals:

```sh
# API — http://localhost:4000
cd server
cp .env.example .env   # first time only — edit DATABASE_URL if not using Docker Compose
npm install
npm run seed   # first time only, seeds a few sample cases
npm start

# Frontend — http://localhost:5173
cd client
npm install
npm run dev
```

The client talks to `http://localhost:4000` by default; override with
`VITE_API_URL` in `client/.env` if the API runs elsewhere.

## What's implemented

- **New case** — add a case (number, CNR, status, court, place, last/next
  hearing). Renders as a two-column form with a live preview and recent cases
  (wide viewports) or a single-column flow with quick-set date chips
  (narrow/portrait viewports).
- **Case detail** — header, status, last/next hearing and filed-date stats,
  and a hearing history timeline. "Add hearing" records an outcome and
  optionally schedules the next hearing.
- **Calendar** — month grid of upcoming hearings with a "next seven days"
  rail, linking back to each case.

"Hearings" and "Clients" are shown in the sidebar nav but are out of scope
for this pass (not part of the original mockup) and are disabled.
