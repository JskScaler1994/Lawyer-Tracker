import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sidebar } from "../components/Sidebar.jsx";
import { api } from "../lib/api";
import { formatLong, MONTH_NAMES, relativeLabel, todayISO } from "../lib/dates";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-12
  const [calendar, setCalendar] = useState(null);
  const [needsDates, setNeedsDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    api.getCalendar(year, month).then(setCalendar).catch(() => {});
  }, [year, month]);

  useEffect(() => {
    api.getUpcoming(7).then((r) => setNeedsDates(r.needsDates)).catch(() => {});
  }, []);

  function shiftMonth(delta) {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setMonth(m);
    setYear(y);
    setSelectedDate(null);
  }

  const todayNum = (() => {
    const t = todayISO().split("-");
    return t[0] === String(year) && Number(t[1]) === month ? Number(t[2]) : null;
  })();

  const selectedDay = selectedDate ? calendar?.days.find((d) => d.date === selectedDate) || null : null;

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
            {calendar?.days.map((d, i) => {
              const isSelected = Boolean(d.n && d.date && selectedDate && d.date === selectedDate);
              return (
                <div
                  key={i}
                  className="card"
                  role={d.n ? "button" : undefined}
                  tabIndex={d.n ? 0 : undefined}
                  onClick={() => d.n && setSelectedDate((cur) => (cur === d.date ? null : d.date))}
                  onKeyDown={(e) => {
                    if (d.n && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      setSelectedDate((cur) => (cur === d.date ? null : d.date));
                    }
                  }}
                  style={{
                    padding: "8px 6px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    overflow: "hidden",
                    opacity: d.n ? 1 : 0.4,
                    cursor: d.n ? "pointer" : "default",
                    background: isSelected ? "var(--ink)" : "var(--surface)",
                    outline: d.n === todayNum ? "1.5px solid var(--ink)" : "none",
                    outlineOffset: -1.5,
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, color: isSelected ? "var(--surface)" : "var(--ink-muted)", paddingLeft: 4 }}>
                    {d.n || ""}
                  </div>
                  {d.mark && (
                    <Link
                      to={`/hearings/${d.caseId}`}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        padding: "5px 7px",
                        borderRadius: 8,
                        background: isSelected ? "rgba(252,250,244,.14)" : "var(--surface-alt)",
                        borderLeft: "3px solid var(--dot-amber)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                        color: isSelected ? "var(--surface)" : "inherit",
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.2, wordBreak: "break-word" }}>{d.mark}</div>
                      <div style={{ fontSize: 11, lineHeight: 1.2, color: isSelected ? "#cfc7b6" : "var(--muted-2)" }}>{d.time}</div>
                    </Link>
                  )}
                  {d.moreCount > 0 && (
                    <div style={{ fontSize: 10, color: isSelected ? "#cfc7b6" : "var(--muted)", paddingLeft: 4 }}>
                      +{d.moreCount} more
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ width: 330, flex: "none", borderLeft: "1px solid var(--border)", background: "var(--surface)", padding: "28px 26px", display: "flex", flexDirection: "column", gap: 18, overflow: "auto" }}>
          {!selectedDay ? (
            <>
              <div className="label">Selected date</div>
              <div style={{ fontSize: 15, color: "var(--muted-2)" }}>Select a date to view the cases listed.</div>
            </>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div className="label">Selected date</div>
                <div className="heading-font" style={{ fontSize: 20, fontWeight: 700 }}>{formatLong(selectedDay.date)}</div>
              </div>
              {selectedDay.hearings.length === 0 && (
                <div style={{ fontSize: 15, color: "var(--muted-2)" }}>No cases listed for this date.</div>
              )}
              {selectedDay.hearings.map((h) => (
                <Link
                  key={h.id}
                  to={`/hearings/${h.id}`}
                  style={{ display: "flex", flexDirection: "column", gap: 3, paddingBottom: 16, borderBottom: "1px solid var(--surface-alt)", color: "inherit" }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{h.case_number}</div>
                    {h.next_hearing_time && <div style={{ fontSize: 13, color: "var(--muted)", flex: "none" }}>{h.next_hearing_time}</div>}
                  </div>
                  <div style={{ fontSize: 14, color: "var(--muted-2)" }}>{h.next_hearing_note || "Hearing"}</div>
                  <div style={{ fontSize: 13, color: "var(--muted)" }}>{[h.court_establishment, h.coram].filter(Boolean).join(" · ")}</div>
                </Link>
              ))}
              <div style={{ fontSize: 13, color: "var(--muted)" }}>{relativeLabel(selectedDay.date)}</div>
            </>
          )}

          {needsDates.length > 0 && (
            <div style={{ marginTop: "auto", padding: 18, borderRadius: 18, background: "var(--surface-alt)", display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>
                {needsDates.length === 1 ? "One matter needs a date" : `${needsDates.length} matters need dates`}
              </div>
              <div style={{ fontSize: 14, color: "var(--muted-2)" }}>
                Next hearing not recorded for {needsDates.join(" and ")}.
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
