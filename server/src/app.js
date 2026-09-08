import express from "express";
import cors from "cors";
import { execSync } from "node:child_process";
import { pool, ensureDbReady } from "./db.js";
import { casesRouter } from "./routes/cases.js";
import { calendarRouter } from "./routes/calendar.js";
import { addDaysISO, todayISO } from "./dates.js";
import { checkPassword, issueToken, requireAuth } from "./auth.js";

export const app = express();

// cors() must be the very first thing that touches a request: it answers
// OPTIONS preflight itself, synchronously, with no dependency on the
// database. Anything that gates on the DB (see requireDb below) has to sit
// behind this, or a slow/cold Postgres connection kills preflight entirely
// and every cross-origin request fails with a misleading CORS error.
app.use(cors());
app.use(express.json());

async function requireDb(req, res, next) {
  try {
    await ensureDbReady();
    next();
  } catch (e) {
    next(e);
  }
}

const startedAt = new Date().toISOString();
let commit = "unknown";
try {
  commit = execSync("git rev-parse --short HEAD", { cwd: import.meta.dirname }).toString().trim();
} catch {
  // Not a git checkout (or git unavailable) — leave as "unknown".
}

// Login and version deliberately don't touch the database, so they aren't
// gated behind requireDb — they stay fast and available even if Postgres
// is briefly unreachable.
app.post("/api/login", (req, res) => {
  if (!checkPassword(req.body?.password)) {
    return res.status(401).json({ error: "Incorrect password" });
  }
  res.json({ token: issueToken() });
});

app.get("/api/version", (req, res) => {
  res.json({ commit, startedAt });
});

app.use("/api/cases", requireDb, requireAuth, casesRouter);
app.use("/api/calendar", requireDb, requireAuth, calendarRouter);

app.get("/api/stats", requireDb, requireAuth, async (req, res) => {
  const tomorrow = addDaysISO(todayISO(), 1);
  const { rows } = await pool.query("SELECT COUNT(*)::int AS n FROM cases WHERE next_hearing_date = $1", [tomorrow]);
  res.json({ tomorrowHearings: rows[0].n });
});

// Express 5 forwards rejected async handler promises here automatically.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal server error" });
});
