import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sidebar } from "../components/Sidebar.jsx";
import { api } from "../lib/api";
import { formatDayMonth, MONTH_NAMES, todayISO } from "../lib/dates";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-12
  const [calendar, setCalendar] = useState(null);
  const [upcoming, setUpcoming] = useState({ upcoming: [], needsDates: [] });

  useEffect(() => {
    api.getCalendar(year, month).then(setCalendar).catch(() => {});
  }, [year, month]);

  useEffect(() => {
    api.getUpcoming(7).then(setUpcoming).catch(() => {});
  }, []);

  function shiftMonth(delta) {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setMonth(m);
    setYear(y);
  }

  const todayNum = (() => {
    const t = todayISO().split("-");
    return t[0] === String(year) && Number(t[1]) === month ? Number(t[2]) : null;
  })();

  return (
    <div className="app-shell">
      <Sidebar>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
          <div className="label" style={{ letterSpacing: ".12em" }}>Legend</div>
          <LegendRow color="var(--dot-red)" label="This week" />
          <LegendRow color="var(--dot-amber)" label="Upcoming" />
          <LegendRow color="var(--dot-green)" label="Concluded" />
        </div>
      </Sidebar>

      <div className="main-content" style={{ flexDirection: "row", display: "flex", minWidth: 0 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, padding: "28px 28px 28px 32px" }}>
          <div style={{ flex: "none", display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span className="heading-font" style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-.02em" }}>
                {MONTH_NAMES[month - 1]} {year}
              </span>
              <span style={{ fontSize: 15, color: "var(--muted)" }}>
                {calendar ? `${calendar.hearingCount} hearing${calendar.hearingCount === 1 ? "" : "s"}` : ""}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-secondary" style={{ width: 42, height: 42, borderRadius: 12, padding: 0 }} onClick={() => shiftMonth(-1)}>‹</button>
              <button className="btn btn-secondary" style={{ width: 42, height: 42, borderRadius: 12, padding: 0 }} onClick={() => shiftMonth(1)}>›</button>
            </div>
          </div>

          <div style={{ flex: "none", display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8, paddingBottom: 8 }}>
            {WEEKDAYS.map((w) => (
              <div key={w} className="label" style={{ textAlign: "center" }}>{w}</div>
            ))}
          </div>

          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(7,1fr)", gridAutoRows: "1fr", gap: 8, minHeight: 420 }}>
            {calendar?.days.map((d, i) => (
              <div
                key={i}
                className="card"
                style={{
                  padding: "8px 6px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  overflow: "hidden",
                  opacity: d.n ? 1 : 0.4,
                  outline: d.n === todayNum ? "1.5px solid var(--ink)" : "none",
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-muted)", paddingLeft: 4 }}>{d.n || ""}</div>
                {d.mark && (
                  <Link
                    to={`/hearings/${d.caseId}`}
                    style={{
                      padding: "5px 7px",
                      borderRadius: 8,
                      background: "var(--surface-alt)",
                      borderLeft: "3px solid var(--dot-amber)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                      color: "inherit",
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.2, wordBreak: "break-word" }}>{d.mark}</div>
                    <div style={{ fontSize: 11, lineHeight: 1.2, color: "var(--muted-2)" }}>{d.time}</div>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ width: 330, flex: "none", borderLeft: "1px solid var(--border)", background: "var(--surface)", padding: "28px 26px", display: "flex", flexDirection: "column", gap: 18, overflow: "auto" }}>
          <div className="label">Next seven days</div>
          {upcoming.upcoming.length === 0 && <div style={{ fontSize: 14, color: "var(--muted-2)" }}>Nothing scheduled this week.</div>}
          {upcoming.upcoming.map((u) => {
            const { dd, mon } = formatDayMonth(u.next_hearing_date);
            return (
              <Link
                key={u.id}
                to={`/hearings/${u.id}`}
                style={{ display: "flex", gap: 14, alignItems: "flex-start", paddingBottom: 16, borderBottom: "1px solid var(--surface-alt)", color: "inherit" }}
              >
                <div style={{ width: 52, flex: "none", textAlign: "center" }}>
                  <div className="heading-font" style={{ fontSize: 24, fontWeight: 700, lineHeight: 1 }}>{dd}</div>
                  <div style={{ fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 600 }}>{mon}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{u.case_number}</div>
                  <div style={{ fontSize: 14, color: "var(--muted-2)" }}>{u.next_hearing_note || "Hearing"}</div>
                  <div style={{ fontSize: 13, color: "var(--muted)" }}>{[u.court_establishment, u.coram].filter(Boolean).join(" · ")}</div>
                </div>
              </Link>
            );
          })}

          {upcoming.needsDates.length > 0 && (
            <div style={{ marginTop: "auto", padding: 18, borderRadius: 18, background: "var(--surface-alt)", display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>
                {upcoming.needsDates.length === 1 ? "One matter needs a date" : `${upcoming.needsDates.length} matters need dates`}
              </div>
              <div style={{ fontSize: 14, color: "var(--muted-2)" }}>
                Next hearing not recorded for {upcoming.needsDates.join(" and ")}.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LegendRow({ color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, color: "var(--ink-muted)" }}>
      <span className="dot" style={{ background: color }} />
      {label}
    </div>
  );
}
