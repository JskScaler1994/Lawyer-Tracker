// The actual case/hearing business logic, independent of Express - so both
// routes/cases.js and (later) the MCP tools call the exact same functions
// instead of two copies of the same SQL drifting apart.
import { pool } from "../db.js";
import { HttpError } from "../errors.js";

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

async function requireCaseRow(id) {
  const row = await getCaseRow(id);
  if (!row) throw new HttpError(404, "Case not found");
  return row;
}

async function getHearingsForCase(caseId) {
  const { rows } = await pool.query(
    "SELECT * FROM hearings WHERE case_id = $1 ORDER BY hearing_date DESC, id DESC",
    [caseId]
  );
  return rows;
}

async function requireHearingRow(hearingId, caseId) {
  const { rows } = await pool.query(
    "SELECT * FROM hearings WHERE id = $1 AND case_id = $2",
    [hearingId, caseId]
  );
  if (!rows[0]) throw new HttpError(404, "Hearing not found");
  return rows[0];
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

export async function listCases() {
  const { rows } = await pool.query(`${LIST_SELECT} ORDER BY c.created_at DESC`);
  return rows;
}

export async function getCaseWithHearings(id) {
  const c = await requireCaseRow(id);
  return { ...c, hearings: await getHearingsForCase(id) };
}

export async function createCase(body) {
  const data = normalizeCaseInput(body);
  if (!data.case_number || !data.status) {
    throw new HttpError(400, "case_number and status are required");
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

    if (body.last_hearing_date) {
      await client.query(
        "INSERT INTO hearings (case_id, hearing_date, title, note) VALUES ($1, $2, $3, $4)",
        [newId, body.last_hearing_date, body.last_hearing_title || "Hearing recorded", body.last_hearing_note || null]
      );
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }

  return getCaseRow(newId);
}

const UPDATABLE_CASE_FIELDS = [
  "case_number", "cnr", "status", "court_establishment", "place", "coram",
  "filed_date", "next_hearing_date", "next_hearing_time", "next_hearing_note",
  "client_name", "client_phone", "appearing_for",
];

export async function updateCase(id, body) {
  const existing = await requireCaseRow(id);

  const updates = {};
  for (const f of UPDATABLE_CASE_FIELDS) {
    if (f in body) updates[f] = body[f];
  }
  if ("reminder_enabled" in body) {
    updates.reminder_enabled = body.reminder_enabled ? 1 : 0;
  }
  const keys = Object.keys(updates);
  if (keys.length === 0) return existing;

  const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
  const values = keys.map((k) => updates[k]);
  await pool.query(`UPDATE cases SET ${setClause} WHERE id = $${keys.length + 1}`, [...values, id]);
  return getCaseRow(id);
}

export async function deleteCase(id) {
  await requireCaseRow(id);
  await pool.query("DELETE FROM cases WHERE id = $1", [id]);
}

export async function addHearing(caseId, body) {
  await requireCaseRow(caseId);

  const { hearing_date, title, note, next_hearing_date, next_hearing_time, next_hearing_note } = body;
  if (!hearing_date || !title) {
    throw new HttpError(400, "hearing_date and title are required");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "INSERT INTO hearings (case_id, hearing_date, title, note) VALUES ($1, $2, $3, $4)",
      [caseId, hearing_date, title, note || null]
    );
    await client.query(
      "UPDATE cases SET next_hearing_date = $1, next_hearing_time = $2, next_hearing_note = $3 WHERE id = $4",
      [next_hearing_date || null, next_hearing_time || null, next_hearing_note || null, caseId]
    );
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }

  return { ...(await getCaseRow(caseId)), hearings: await getHearingsForCase(caseId) };
}

export async function updateHearing(caseId, hearingId, body) {
  await requireHearingRow(hearingId, caseId);

  const fields = ["hearing_date", "title", "note"];
  const updates = {};
  for (const f of fields) {
    if (f in body) updates[f] = body[f];
  }
  if (updates.title !== undefined && !String(updates.title).trim()) {
    throw new HttpError(400, "title is required");
  }
  const keys = Object.keys(updates);
  if (keys.length === 0) return requireHearingRow(hearingId, caseId);

  const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
  const values = keys.map((k) => updates[k]);
  await pool.query(`UPDATE hearings SET ${setClause} WHERE id = $${keys.length + 1}`, [...values, hearingId]);
  return requireHearingRow(hearingId, caseId);
}

export async function deleteHearing(caseId, hearingId) {
  await requireHearingRow(hearingId, caseId);
  await pool.query("DELETE FROM hearings WHERE id = $1 AND case_id = $2", [hearingId, caseId]);
}
