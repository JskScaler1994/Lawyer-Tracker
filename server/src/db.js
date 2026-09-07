import pg from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Copy server/.env.example to server/.env and point it at your Postgres instance."
  );
}

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cases (
      id SERIAL PRIMARY KEY,
      case_number TEXT NOT NULL,
      cnr TEXT,
      status TEXT NOT NULL,
      court_establishment TEXT,
      place TEXT,
      coram TEXT,
      filed_date TEXT,
      next_hearing_date TEXT,
      next_hearing_time TEXT,
      next_hearing_note TEXT,
      reminder_enabled INTEGER NOT NULL DEFAULT 1,
      client_name TEXT,
      client_phone TEXT,
      appearing_for TEXT,
      created_at TEXT NOT NULL DEFAULT now()::text
    );

    CREATE TABLE IF NOT EXISTS hearings (
      id SERIAL PRIMARY KEY,
      case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
      hearing_date TEXT NOT NULL,
      title TEXT NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT now()::text
    );

    CREATE INDEX IF NOT EXISTS idx_hearings_case_id ON hearings(case_id);
    CREATE INDEX IF NOT EXISTS idx_cases_next_hearing ON cases(next_hearing_date);
  `);

  // Defensive for anyone who already migrated to Postgres before these
  // columns existed — Postgres (unlike SQLite) supports this directly.
  await pool.query(`
    ALTER TABLE cases ADD COLUMN IF NOT EXISTS client_name TEXT;
    ALTER TABLE cases ADD COLUMN IF NOT EXISTS client_phone TEXT;
    ALTER TABLE cases ADD COLUMN IF NOT EXISTS appearing_for TEXT;
  `);
}
