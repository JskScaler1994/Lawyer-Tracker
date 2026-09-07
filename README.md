# Prasanna — court case tracker

A case tracker for advocates managing their own matters (Indian district/high
court conventions: CNR numbers, O.S./Crl.M.C./W.P.(C) case types). Built from
a Claude Design mockup — see `chats/chat1.md` for the original design
conversation and `project/` for the exported prototype it was built from.

## Stack

- `client/` — React (Vite) frontend, iPad-first but responsive down to phone
  widths. The "New case" screen renders a wide two-column layout (with a live
  record preview) above ~900px, and a single-column mobile layout below it.
- `server/` — Express API backed by Postgres (via `pg`). Every route except
  login requires a bearer token, issued by `POST /api/login` against a single
  shared `APP_PASSWORD` — there's no per-user accounts, just one password
  gating the whole app.

## Running it locally

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
cp .env.example .env   # first time only — fill in DATABASE_URL/APP_PASSWORD/AUTH_SECRET
npm install
npm run seed   # first time only, seeds a few sample cases
npm start

# Frontend — http://localhost:5173
cd client
npm install
npm run dev
```

The client talks to `http://localhost:4000` by default; override with
`VITE_API_URL` in `client/.env` if the API runs elsewhere. Sign in with
whatever you set `APP_PASSWORD` to.

## What's implemented

- **New case** — add a case (number, CNR, status, court, place, client name/
  phone, who you're appearing for, last/next hearing). Renders as a
  two-column form with a live preview and recent cases (wide viewports) or a
  single-column flow with quick-set date chips (narrow/portrait viewports).
- **Hearings** — a tile picker listing every case; selecting one opens its
  detail (header, status, last/next hearing and filed-date stats, and a
  hearing history timeline). "Add hearing" records an outcome and optionally
  schedules the next hearing; both cases and individual hearing entries can
  be edited or deleted.
- **Calendar** — month grid of hearings; clicking a date lists the cases
  scheduled that day in the side panel.
- **Clients** — every case with client details, as a table of client name,
  phone, case number, and who you're appearing for.

## Deploying (Vercel + Supabase)

**1. Database — Supabase**

- Create a project at supabase.com.
- In Project Settings → Database, copy the **connection pooling** string
  (transaction mode, port `6543`) rather than the direct connection — this
  is the one meant for serverless (lots of short-lived connections instead
  of one long-lived server). It looks like:
  `postgres://postgres.xxxx:[password]@aws-0-xxxx.pooler.supabase.com:6543/postgres`

**2. API — Vercel project #1, rooted at `server/`**

- Import the repo into Vercel, set its **Root Directory** to `server`.
- No build command needed — Vercel auto-detects the `api/[...path].js`
  function.
- Add environment variables: `DATABASE_URL` (the Supabase string above),
  `APP_PASSWORD`, `AUTH_SECRET` (generate with
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
- Deploy. Run the seed script once, pointed at Supabase, from your machine:
  `DATABASE_URL=<supabase-url> node server/src/seed.js` (only if you want
  the sample cases — skip this for a real, empty deployment).
- Verify it's up: `https://<your-api>.vercel.app/api/version`.

**3. Frontend — Vercel project #2, rooted at `client/`**

- Import the same repo again as a second project, **Root Directory**
  `client`. Vercel auto-detects Vite.
- Add environment variable `VITE_API_URL` set to your API project's URL
  from step 2 (no trailing slash).
- Deploy, then open it and sign in with `APP_PASSWORD`.

Both projects redeploy automatically on every push to `main`.
