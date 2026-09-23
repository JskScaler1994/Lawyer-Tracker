// Exposes the same operations the REST API (routes/cases.js,
// routes/calendar.js) offers, as MCP tools calling the exact same service
// functions (services/cases.js, services/calendar.js) - no duplicated SQL,
// no duplicated business rules. This module only builds the server and
// registers tools; step 3 wires it to an actual transport (Streamable HTTP)
// and mounts it as a Vercel route.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as casesService from "../services/cases.js";
import * as calendarService from "../services/calendar.js";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");
const caseId = z.coerce.number().int().describe("The case's numeric id (from list_cases or get_case)");

// Service functions throw HttpError for expected failures (not found, bad
// input, per errors.js). A thrown exception is a protocol-level error the
// caller can't recover from conversationally, so every tool converts that
// into a normal isError result instead - the model sees the message and can
// decide what to do next (e.g. re-check the case id) rather than the whole
// call failing opaquely.
async function toolResult(fn) {
  try {
    const data = await fn();
    return { content: [{ type: "text", text: JSON.stringify(data ?? { ok: true }, null, 2) }] };
  } catch (e) {
    return { content: [{ type: "text", text: e.message || "Something went wrong" }], isError: true };
  }
}

export function createMcpServer() {
  const server = new McpServer({ name: "prasanna", version: "1.0.0" });

  server.registerTool(
    "list_cases",
    {
      title: "List cases",
      description: "List every case on file, newest first. Each case includes its last and next hearing summary and total hearing count.",
    },
    async () => toolResult(() => casesService.listCases())
  );

  server.registerTool(
    "get_case",
    {
      title: "Get case",
      description: "Get one case's full details plus its complete hearing history. Look the id up via list_cases first if you only have a case number (e.g. \"O.S. 412/2025\").",
      inputSchema: { id: caseId },
    },
    async ({ id }) => toolResult(() => casesService.getCaseWithHearings(id))
  );

  server.registerTool(
    "create_case",
    {
      title: "Create case",
      description: "File a new case. case_number and status are required; everything else is optional. Pass last_hearing_date (+ optional last_hearing_title/last_hearing_note) only if a hearing has already happened and should be recorded immediately.",
      inputSchema: {
        case_number: z.string().min(1).describe('e.g. "O.S. 412/2025"'),
        status: z.string().min(1).describe('e.g. "Pending" or "Disposed"'),
        cnr: z.string().optional(),
        court_establishment: z.string().optional(),
        place: z.string().optional().describe("City/town the court sits in"),
        coram: z.string().optional().describe("The presiding judge/bench"),
        filed_date: isoDate.optional(),
        next_hearing_date: isoDate.optional(),
        next_hearing_time: z.string().optional(),
        next_hearing_note: z.string().optional(),
        reminder_enabled: z.boolean().optional(),
        client_name: z.string().optional(),
        client_phone: z.string().optional(),
        appearing_for: z.string().optional().describe('e.g. "Plaintiff", "Defendant", "Petitioner"'),
        last_hearing_date: isoDate.optional(),
        last_hearing_title: z.string().optional(),
        last_hearing_note: z.string().optional(),
      },
    },
    async (input) => toolResult(() => casesService.createCase(input))
  );

  server.registerTool(
    "update_case",
    {
      title: "Update case",
      description: "Update one or more fields on an existing case. Only pass the fields that changed.",
      inputSchema: {
        id: caseId,
        case_number: z.string().min(1).optional(),
        status: z.string().min(1).optional(),
        cnr: z.string().optional(),
        court_establishment: z.string().optional(),
        place: z.string().optional(),
        coram: z.string().optional(),
        filed_date: isoDate.optional(),
        next_hearing_date: isoDate.optional(),
        next_hearing_time: z.string().optional(),
        next_hearing_note: z.string().optional(),
        reminder_enabled: z.boolean().optional(),
        client_name: z.string().optional(),
        client_phone: z.string().optional(),
        appearing_for: z.string().optional(),
      },
    },
    async ({ id, ...patch }) => toolResult(() => casesService.updateCase(id, patch))
  );

  server.registerTool(
    "delete_case",
    {
      title: "Delete case",
      description: "Permanently delete a case and every hearing recorded under it. This cannot be undone - confirm the exact case (number and id) with the user before calling this.",
      inputSchema: { id: caseId },
      annotations: { destructiveHint: true },
    },
    async ({ id }) => toolResult(async () => {
      await casesService.deleteCase(id);
      return { deleted: true, id };
    })
  );

  server.registerTool(
    "add_hearing",
    {
      title: "Add hearing",
      description: "Record a hearing that took place on an existing case, and optionally set what's next. Passing next_hearing_date replaces the case's current next-hearing date/time/note.",
      inputSchema: {
        case_id: caseId,
        hearing_date: isoDate.describe("The date this hearing took place"),
        title: z.string().min(1).describe('What happened, e.g. "Adjourned for evidence"'),
        note: z.string().optional(),
        next_hearing_date: isoDate.optional(),
        next_hearing_time: z.string().optional(),
        next_hearing_note: z.string().optional(),
      },
    },
    async ({ case_id, ...body }) => toolResult(() => casesService.addHearing(case_id, body))
  );

  server.registerTool(
    "update_hearing",
    {
      title: "Update hearing",
      description: "Correct a previously recorded hearing entry. Only pass the fields that changed.",
      inputSchema: {
        case_id: caseId,
        hearing_id: z.coerce.number().int(),
        hearing_date: isoDate.optional(),
        title: z.string().min(1).optional(),
        note: z.string().optional(),
      },
    },
    async ({ case_id, hearing_id, ...patch }) => toolResult(() => casesService.updateHearing(case_id, hearing_id, patch))
  );

  server.registerTool(
    "delete_hearing",
    {
      title: "Delete hearing",
      description: "Permanently delete one hearing entry from a case's history. This cannot be undone - confirm with the user before calling this.",
      inputSchema: { case_id: caseId, hearing_id: z.coerce.number().int() },
      annotations: { destructiveHint: true },
    },
    async ({ case_id, hearing_id }) => toolResult(async () => {
      await casesService.deleteHearing(case_id, hearing_id);
      return { deleted: true, case_id, hearing_id };
    })
  );

  server.registerTool(
    "get_calendar",
    {
      title: "Get calendar month",
      description: "Get every hearing scheduled in a given month, laid out by day. Defaults to the current month if year/month are omitted.",
      inputSchema: {
        year: z.coerce.number().int().optional(),
        month: z.coerce.number().int().min(1).max(12).optional(),
      },
    },
    async ({ year, month }) => toolResult(() => {
      const now = new Date();
      return calendarService.getCalendarMonth(year || now.getFullYear(), month || now.getMonth() + 1);
    })
  );

  server.registerTool(
    "get_upcoming_hearings",
    {
      title: "Get upcoming hearings",
      description: "List hearings scheduled within the next N days (default 7), plus any pending cases with no next hearing date set yet.",
      inputSchema: { days: z.coerce.number().int().positive().optional() },
    },
    async ({ days }) => toolResult(() => calendarService.getUpcoming(days || 7))
  );

  return server;
}
