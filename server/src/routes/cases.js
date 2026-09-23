import { Router } from "express";
import * as casesService from "../services/cases.js";

export const casesRouter = Router();

// Thin HTTP adapter: every route just translates req -> a service call -> a
// response shape. The actual logic lives in services/cases.js so it can be
// reused by non-HTTP callers (e.g. MCP tools) without duplicating it here.
// Express 5 forwards a rejected handler promise (including a thrown
// HttpError) to app.js's error middleware automatically.

casesRouter.get("/", async (req, res) => {
  res.json(await casesService.listCases());
});

casesRouter.get("/:id", async (req, res) => {
  res.json(await casesService.getCaseWithHearings(req.params.id));
});

casesRouter.post("/", async (req, res) => {
  res.status(201).json(await casesService.createCase(req.body));
});

casesRouter.patch("/:id", async (req, res) => {
  res.json(await casesService.updateCase(req.params.id, req.body));
});

casesRouter.delete("/:id", async (req, res) => {
  await casesService.deleteCase(req.params.id);
  res.status(204).end();
});

casesRouter.post("/:id/hearings", async (req, res) => {
  res.status(201).json(await casesService.addHearing(req.params.id, req.body));
});

casesRouter.patch("/:id/hearings/:hearingId", async (req, res) => {
  res.json(await casesService.updateHearing(req.params.id, req.params.hearingId, req.body));
});

casesRouter.delete("/:id/hearings/:hearingId", async (req, res) => {
  await casesService.deleteHearing(req.params.id, req.params.hearingId);
  res.status(204).end();
});
