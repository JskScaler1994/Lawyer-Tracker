import express from "express";
import cors from "cors";
import { execSync } from "node:child_process";
import { pool } from "./db.js";
import { casesRouter } from "./routes/cases.js";
import { calendarRouter } from "./routes/calendar.js";
import { addDaysISO, todayISO } from "./dates.js";
import { checkPassword, issueToken, requireAuth } from "./auth.js";

export const app = express();
app.use(cors());
app.use(express.json());

const startedAt = new Date().toISOString();
let commit = "unknown";
try {
  commit = execSync("git rev-parse --short HEAD", { cwd: import.meta.dirname }).toString().trim();
} catch {
  // Not a git checkout (or git unavailable) — leave as "unknown".
}

app.post("/api/login", (req, res) => {
  if (!checkPassword(req.body?.password)) {
    return res.status(401).json({ error: "Incorrect password" });
  }
  res.json({ token: issueToken() });
});

app.use("/api/cases", requireAuth, casesRouter);
app.use("/api/calendar", requireAuth, calendarRouter);

app.get("/api/stats", requireAuth, async (req, res) => {
  const tomorrow = addDaysISO(todayISO(), 1);
  const { rows } = await pool.query("SELECT COUNT(*)::int AS n FROM cases WHERE next_hearing_date = $1", [tomorrow]);
  res.json({ tomorrowHearings: rows[0].n });
});

// Quick way to confirm the server actually running is the one you think it
// is — compare `commit` here against `git log -1 --oneline` in the server
// folder, and check `startedAt` against when you last restarted it. Left
// unauthenticated: no sensitive data, useful for checking a deploy without
// needing to log in first.
app.get("/api/version", (req, res) => {
  res.json({ commit, startedAt });
});

// Express 5 forwards rejected async handler promises here automatically.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal server error" });
});
