import { Router } from "express";
import { db } from "../db.js";

export const casesRouter = Router();

const listStmt = db.prepare(`
  SELECT c.*,
    (SELECT hearing_date FROM hearings h WHERE h.case_id = c.id ORDER BY h.hearing_date DESC LIMIT 1) AS last_hearing_date,
    (SELECT title FROM hearings h WHERE h.case_id = c.id ORDER BY h.hearing_date DESC LIMIT 1) AS last_hearing_title,
    (SELECT COUNT(*) FROM hearings h WHERE h.case_id = c.id) AS hearing_count
  FROM cases c
  ORDER BY c.created_at DESC
`);

const getStmt = db.prepare(`
  SELECT c.*,
    (SELECT hearing_date FROM hearings h WHERE h.case_id = c.id ORDER BY h.hearing_date DESC LIMIT 1) AS last_hearing_date,
    (SELECT title FROM hearings h WHERE h.case_id = c.id ORDER BY h.hearing_date DESC LIMIT 1) AS last_hearing_title,
    (SELECT COUNT(*) FROM hearings h WHERE h.case_id = c.id) AS hearing_count
  FROM cases c WHERE c.id = ?
`);

const hearingsStmt = db.prepare(`
  SELECT * FROM hearings WHERE case_id = ? ORDER BY hearing_date DESC, id DESC
`);

const insertCaseStmt = db.prepare(`
  INSERT INTO cases (case_number, cnr, status, court_establishment, place, coram, filed_date,
    next_hearing_date, next_hearing_time, next_hearing_note, reminder_enabled,
    client_name, client_phone, appearing_for)
  VALUES (@case_number, @cnr, @status, @court_establishment, @place, @coram, @filed_date,
    @next_hearing_date, @next_hearing_time, @next_hearing_note, @reminder_enabled,
    @client_name, @client_phone, @appearing_for)
`);

const insertHearingStmt = db.prepare(`
  INSERT INTO hearings (case_id, hearing_date, title, note) VALUES (?, ?, ?, ?)
`);

const getHearingStmt = db.prepare(`
  SELECT * FROM hearings WHERE id = ? AND case_id = ?
`);

const deleteCaseStmt = db.prepare(`DELETE FROM cases WHERE id = ?`);
const deleteHearingStmt = db.prepare(`DELETE FROM hearings WHERE id = ? AND case_id = ?`);

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

casesRouter.get("/", (req, res) => {
  res.json(listStmt.all());
});

casesRouter.get("/:id", (req, res) => {
  const c = getStmt.get(req.params.id);
  if (!c) return res.status(404).json({ error: "Case not found" });
  res.json({ ...c, hearings: hearingsStmt.all(req.params.id) });
});

casesRouter.post("/", (req, res) => {
  const data = normalizeCaseInput(req.body);
  if (!data.case_number || !data.status) {
    return res.status(400).json({ error: "case_number and status are required" });
  }

  const result = db.transaction(() => {
    const { lastInsertRowid } = insertCaseStmt.run(data);
    if (req.body.last_hearing_date) {
      insertHearingStmt.run(
        lastInsertRowid,
        req.body.last_hearing_date,
        req.body.last_hearing_title || "Hearing recorded",
        req.body.last_hearing_note || null
      );
    }
    return lastInsertRowid;
  })();

  res.status(201).json(getStmt.get(result));
});

casesRouter.patch("/:id", (req, res) => {
  const existing = getStmt.get(req.params.id);
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
  if (Object.keys(updates).length === 0) {
    return res.json(existing);
  }
  const setClause = Object.keys(updates).map((k) => `${k} = @${k}`).join(", ");
  db.prepare(`UPDATE cases SET ${setClause} WHERE id = @id`).run({ ...updates, id: req.params.id });
  res.json(getStmt.get(req.params.id));
});

casesRouter.delete("/:id", (req, res) => {
  const existing = getStmt.get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Case not found" });
  deleteCaseStmt.run(req.params.id);
  res.status(204).end();
});

casesRouter.patch("/:id/hearings/:hearingId", (req, res) => {
  const existing = getHearingStmt.get(req.params.hearingId, req.params.id);
  if (!existing) return res.status(404).json({ error: "Hearing not found" });

  const fields = ["hearing_date", "title", "note"];
  const updates = {};
  for (const f of fields) {
    if (f in req.body) updates[f] = req.body[f];
  }
  if (updates.title !== undefined && !String(updates.title).trim()) {
    return res.status(400).json({ error: "title is required" });
  }
  if (Object.keys(updates).length === 0) {
    return res.json(existing);
  }
  const setClause = Object.keys(updates).map((k) => `${k} = @${k}`).join(", ");
  db.prepare(`UPDATE hearings SET ${setClause} WHERE id = @id`).run({ ...updates, id: req.params.hearingId });
  res.json(getHearingStmt.get(req.params.hearingId, req.params.id));
});

casesRouter.delete("/:id/hearings/:hearingId", (req, res) => {
  const existing = getHearingStmt.get(req.params.hearingId, req.params.id);
  if (!existing) return res.status(404).json({ error: "Hearing not found" });
  deleteHearingStmt.run(req.params.hearingId, req.params.id);
  res.status(204).end();
});

casesRouter.post("/:id/hearings", (req, res) => {
  const existing = getStmt.get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Case not found" });

  const { hearing_date, title, note, next_hearing_date, next_hearing_time, next_hearing_note } = req.body;
  if (!hearing_date || !title) {
    return res.status(400).json({ error: "hearing_date and title are required" });
  }

  db.transaction(() => {
    insertHearingStmt.run(req.params.id, hearing_date, title, note || null);
    db.prepare(`
      UPDATE cases SET next_hearing_date = @next_hearing_date,
        next_hearing_time = @next_hearing_time, next_hearing_note = @next_hearing_note
      WHERE id = @id
    `).run({
      id: req.params.id,
      next_hearing_date: next_hearing_date || null,
      next_hearing_time: next_hearing_time || null,
      next_hearing_note: next_hearing_note || null,
    });
  })();

  res.status(201).json({ ...getStmt.get(req.params.id), hearings: hearingsStmt.all(req.params.id) });
});
