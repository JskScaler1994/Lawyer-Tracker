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
  gating the whole app. The case/hearing/calendar logic lives in
  `server/src/services/`, shared by both the REST routes (`server/src/routes/`)
  and the MCP tools (`server/src/mcp/`) — see "Conversational access (MCP)"
  below.

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
- **Conversational access (MCP)** — the same case/hearing/calendar
  operations, exposed as tools any MCP client can call. See "Conversational
  access (MCP)" below.

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
- No build command needed — Vercel auto-detects the `api/index.js`
  function; `vercel.json` rewrites all `/api/*` requests to it.
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

## Conversational access (MCP)

Alongside the GUI, the API project exposes an [MCP](https://modelcontextprotocol.io)
server at `/api/mcp` — the same case/hearing/calendar operations as the REST
API, as tools any MCP client (Claude Code, Claude Desktop, etc.) can call.
Ask it things like "what hearings do I have this week?" or "add a hearing
for O.S. 412/2025 tomorrow" instead of clicking through the app. It's
additive — the GUI is untouched and keeps working exactly as it does today.

**Tools available:** `list_cases`, `get_case`, `create_case`, `update_case`,
`delete_case`, `add_hearing`, `update_hearing`, `delete_hearing`,
`get_calendar`, `get_upcoming_hearings`. `delete_case`/`delete_hearing` are
marked destructive — supporting clients (Claude Code, Claude Desktop) will
pause and ask you to approve the call before it runs.

**Auth:** the exact same bearer token the REST API uses. Mint one:

```sh
curl -s -X POST https://<your-api>.vercel.app/api/login \
  -H "Content-Type: application/json" \
  -d '{"password":"<your APP_PASSWORD>"}'
```

That returns `{"token":"..."}`, valid 30 days.

**Connect with the Claude Code CLI:**

```sh
claude mcp add --transport http prasanna https://<your-api>.vercel.app/api/mcp \
  --header "Authorization: Bearer <token>"
```

Then `claude mcp list` should show `prasanna ... Connected`, and any
`claude` session can use it.

**Connect with Claude Desktop:** Settings → Developer → Edit Config, add
`prasanna` under `mcpServers`:

```json
{
  "mcpServers": {
    "prasanna": {
      "url": "https://<your-api>.vercel.app/api/mcp",
      "headers": { "Authorization": "Bearer <token>" }
    }
  }
}
```

Restart the app afterward for it to pick up the change.

The MCP endpoint is stateless (no server-side session between requests) —
it's a good fit for Vercel's serverless functions, which don't share memory
across invocations anyway.
