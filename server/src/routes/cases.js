import { Router } from "express";
import { pool } from "../db.js";

export const casesRouter = Router();

const LIST_SELECT = `
  SELECT c.*,
    (SELECT hearing_date FROM hearings h WHERE h.case_id = c.id ORDER BY h.hearing_date DESC LIMIT 1) AS last_hearing_date,
    (SELECT title FROM hearings h WHERE h.case_id = c.id ORDER BY h.hearing_date DESC LIMIT 1) AS last_hearing_title,
    (SELECT COUNT(*)::int FROM hearings h WHERE h.case_id = c.id) AS hearing_count
  FROM cases c
`;

async function getCaseRow(id) {
  const { rows } = await pool.query(`${LIST_SELECT} WHERE c.id = $1`, [id]);
  return rows[0] || null;
}

async function getHearingsForCase(caseId) {
  const { rows } = await pool.query(
    "SELECT * FROM hearings WHERE case_id = $1 ORDER BY hearing_date DESC, id DESC",
    [caseId]
  );
  return rows;
}

async function getHearingRow(hearingId, caseId) {
  const { rows } = await pool.query(
    "SELECT * FROM hearings WHERE id = $1 AND case_id = $2",
    [hearingId, caseId]
  );
  return rows[0] || null;
}

function normalizeCaseInput(body) {
  return {
    case_number: String(body.case_number || "").trim(),
    cnr: body.cnr ? String(body.cnr).trim() : null,
    status: String(body.status || "").trim(),
    court_establishment: body.court_establishment ? String(body.court_establishment).trim() : null,
    place: body.place ? String(body.place).trim() : null,
    coram: body.coram ? String(body.coram).trim() : null,
    filed_date: body.filed_date || null,
    next_hearing_date: body.next_hearing_date || null,
    next_hearing_time: body.next_hearing_time || null,
    next_hearing_note: body.next_hearing_note || null,
    reminder_enabled: body.reminder_enabled ? 1 : 0,
    client_name: body.client_name ? String(body.client_name).trim() : null,
    client_phone: body.client_phone ? String(body.client_phone).trim() : null,
    appearing_for: body.appearing_for ? String(body.appearing_for).trim() : null,
  };
}

casesRouter.get("/", async (req, res) => {
  const { rows } = await pool.query(`${LIST_SELECT} ORDER BY c.created_at DESC`);
  res.json(rows);
});

casesRouter.get("/:id", async (req, res) => {
  const c = await getCaseRow(req.params.id);
  if (!c) return res.status(404).json({ error: "Case not found" });
  res.json({ ...c, hearings: await getHearingsForCase(req.params.id) });
});

casesRouter.post("/", async (req, res) => {
  const data = normalizeCaseInput(req.body);
  if (!data.case_number || !data.status) {
    return res.status(400).json({ error: "case_number and status are required" });
  }

  const client = await pool.connect();
  let newId;
  try {
    await client.query("BEGIN");
    const insertResult = await client.query(
      `INSERT INTO cases (case_number, cnr, status, court_establishment, place, coram, filed_date,
        next_hearing_date, next_hearing_time, next_hearing_note, reminder_enabled,
        client_name, client_phone, appearing_for)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id`,
      [
        data.case_number, data.cnr, data.status, data.court_establishment, data.place, data.coram,
        data.filed_date, data.next_hearing_date, data.next_hearing_time, data.next_hearing_note,
        data.reminder_enabled, data.client_name, data.client_phone, data.appearing_for,
      ]
    );
    newId = insertResult.rows[0].id;

    if (req.body.last_hearing_date) {
      await client.query(
        "INSERT INTO hearings (case_id, hearing_date, title, note) VALUES ($1, $2, $3, $4)",
        [newId, req.body.last_hearing_date, req.body.last_hearing_title || "Hearing recorded", req.body.last_hearing_note || null]
      );
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }

  res.status(201).json(await getCaseRow(newId));
});

casesRouter.patch("/:id", async (req, res) => {
  const existing = await getCaseRow(req.params.id);
  if (!existing) return res.status(404).json({ error: "Case not found" });

  const fields = [
    "case_number", "cnr", "status", "court_establishment", "place", "coram",
    "filed_date", "next_hearing_date", "next_hearing_time", "next_hearing_note",
    "client_name", "client_phone", "appearing_for",
  ];
  const updates = {};
  for (const f of fields) {
    if (f in req.body) updates[f] = req.body[f];
  }
  if ("reminder_enabled" in req.body) {
    updates.reminder_enabled = req.body.reminder_enabled ? 1 : 0;
  }
  const keys = Object.keys(updates);
  if (keys.length === 0) {
    return res.json(existing);
  }
  const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
  const values = keys.map((k) => updates[k]);
  await pool.query(`UPDATE cases SET ${setClause} WHERE id = $${keys.length + 1}`, [...values, req.params.id]);
  res.json(await getCaseRow(req.params.id));
});

casesRouter.delete("/:id", async (req, res) => {
  const existing = await getCaseRow(req.params.id);
  if (!existing) return res.status(404).json({ error: "Case not found" });
  await pool.query("DELETE FROM cases WHERE id = $1", [req.params.id]);
  res.status(204).end();
});

casesRouter.patch("/:id/hearings/:hearingId", async (req, res) => {
  const existing = await getHearingRow(req.params.hearingId, req.params.id);
  if (!existing) return res.status(404).json({ error: "Hearing not found" });

  const fields = ["hearing_date", "title", "note"];
  const updates = {};
  for (const f of fields) {
    if (f in req.body) updates[f] = req.body[f];
  }
  if (updates.title !== undefined && !String(updates.title).trim()) {
    return res.status(400).json({ error: "title is required" });
  }
  const keys = Object.keys(updates);
  if (keys.length === 0) {
    return res.json(existing);
  }
  const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
  const values = keys.map((k) => updates[k]);
  await pool.query(`UPDATE hearings SET ${setClause} WHERE id = $${keys.length + 1}`, [...values, req.params.hearingId]);
  res.json(await getHearingRow(req.params.hearingId, req.params.id));
});

casesRouter.delete("/:id/hearings/:hearingId", async (req, res) => {
  const existing = await getHearingRow(req.params.hearingId, req.params.id);
  if (!existing) return res.status(404).json({ error: "Hearing not found" });
  await pool.query("DELETE FROM hearings WHERE id = $1 AND case_id = $2", [req.params.hearingId, req.params.id]);
  res.status(204).end();
});

casesRouter.post("/:id/hearings", async (req, res) => {
  const existing = await getCaseRow(req.params.id);
  if (!existing) return res.status(404).json({ error: "Case not found" });

  const { hearing_date, title, note, next_hearing_date, next_hearing_time, next_hearing_note } = req.body;
  if (!hearing_date || !title) {
    return res.status(400).json({ error: "hearing_date and title are required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "INSERT INTO hearings (case_id, hearing_date, title, note) VALUES ($1, $2, $3, $4)",
      [req.params.id, hearing_date, title, note || null]
    );
    await client.query(
      "UPDATE cases SET next_hearing_date = $1, next_hearing_time = $2, next_hearing_note = $3 WHERE id = $4",
      [next_hearing_date || null, next_hearing_time || null, next_hearing_note || null, req.params.id]
    );
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }

  res.status(201).json({ ...(await getCaseRow(req.params.id)), hearings: await getHearingsForCase(req.params.id) });
});
