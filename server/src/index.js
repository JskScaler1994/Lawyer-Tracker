import express from "express";
import cors from "cors";
import { db } from "./db.js";
import { casesRouter } from "./routes/cases.js";
import { calendarRouter } from "./routes/calendar.js";
import { addDaysISO, todayISO } from "./dates.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/cases", casesRouter);
app.use("/api/calendar", calendarRouter);

app.get("/api/stats", (req, res) => {
  const tomorrow = addDaysISO(todayISO(), 1);
  const { n } = db.prepare("SELECT COUNT(*) AS n FROM cases WHERE next_hearing_date = ?").get(tomorrow);
  res.json({ tomorrowHearings: n });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Prasanna API listening on http://localhost:${PORT}`);
});
