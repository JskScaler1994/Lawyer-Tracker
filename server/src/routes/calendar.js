import { Router } from "express";
import { db } from "../db.js";
import { todayISO, diffDays, parseISO } from "../dates.js";

export const calendarRouter = Router();

const casesWithNextHearing = db.prepare(`
  SELECT id, case_number, status, court_establishment, coram, next_hearing_date, next_hearing_time, next_hearing_note
  FROM cases WHERE next_hearing_date IS NOT NULL
`);

const openCasesWithoutNextHearing = db.prepare(`
  SELECT case_number FROM cases WHERE next_hearing_date IS NULL AND status != 'Disposed' ORDER BY created_at DESC
`);

calendarRouter.get("/", (req, res) => {
  const now = new Date();
  const year = Number(req.query.year) || now.getFullYear();
  const month = Number(req.query.month) || now.getMonth() + 1; // 1-12

  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  // Monday-start offset: getUTCDay() 0=Sun..6=Sat -> distance back to Monday
  const leading = (firstOfMonth.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const totalCells = Math.ceil((leading + daysInMonth) / 7) * 7;

  const hearings = casesWithNextHearing.all();
  const marksByDay = new Map();
  for (const h of hearings) {
    const d = parseISO(h.next_hearing_date);
    if (d.getUTCFullYear() === year && d.getUTCMonth() === month - 1) {
      const dayNum = d.getUTCDate();
      if (!marksByDay.has(dayNum)) marksByDay.set(dayNum, []);
      marksByDay.get(dayNum).push(h);
    }
  }
  for (const list of marksByDay.values()) {
    list.sort((a, b) => (a.next_hearing_time || "").localeCompare(b.next_hearing_time || ""));
  }

  const days = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - leading + 1;
    const inMonth = dayNum >= 1 && dayNum <= daysInMonth;
    const dayHearings = inMonth ? marksByDay.get(dayNum) || [] : [];
    const first = dayHearings[0];
    days.push({
      n: inMonth ? dayNum : null,
      date: inMonth ? `${year}-${String(month).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}` : null,
      mark: first ? first.case_number.split(" / ")[0] : null,
      time: first ? first.next_hearing_time : null,
      caseId: first ? first.id : null,
      moreCount: Math.max(0, dayHearings.length - 1),
      hearings: dayHearings,
    });
  }

  res.json({
    year,
    month,
    hearingCount: hearings.length,
    days,
  });
});

calendarRouter.get("/upcoming", (req, res) => {
  const windowDays = Number(req.query.days) || 7;
  const today = todayISO();
  const upcoming = casesWithNextHearing.all()
    .filter((h) => {
      const d = diffDays(today, h.next_hearing_date);
      return d >= 0 && d <= windowDays;
    })
    .sort((a, b) => a.next_hearing_date.localeCompare(b.next_hearing_date));

  const needsDates = openCasesWithoutNextHearing.all().map((c) => c.case_number);

  res.json({ upcoming, needsDates });
});
