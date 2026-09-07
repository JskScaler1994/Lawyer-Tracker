import { app } from "../src/app.js";
import { initDb } from "../src/db.js";

// initDb() is idempotent (CREATE TABLE IF NOT EXISTS / ADD COLUMN IF NOT
// EXISTS) but there's no reason to re-run it on every invocation — memoize
// the promise so a warm serverless instance only pays for it once.
let ready;
function ensureReady() {
  if (!ready) ready = initDb();
  return ready;
}

export default async function handler(req, res) {
  await ensureReady();
  app(req, res);
}
