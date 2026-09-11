import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sidebar } from "../components/Sidebar.jsx";
import { SearchIcon } from "../components/icons.jsx";
import { api } from "../lib/api";
import { formatShort, relativeLabel } from "../lib/dates";
import { statusPillColors, urgencyColor } from "../lib/status";

export function HearingsCasePicker() {
  const [cases, setCases] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.listCases().then(setCases).catch(() => setCases([]));
  }, []);

  const query = search.trim().toLowerCase();
  const filtered = cases && query ? cases.filter((c) => c.case_number.toLowerCase().includes(query)) : cases;

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content" style={{ padding: "32px 32px 40px", overflow: "auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, marginBottom: 24, flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div className="heading-font" style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-.02em" }}>Hearings</div>
            <div style={{ fontSize: 15, color: "var(--muted-2)" }}>Select a case to view its hearing history.</div>
          </div>

          {cases && cases.length > 0 && (
            <div style={{ position: "relative", width: 260 }}>
              <SearchIcon style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }} />
              <input
                className="field-input"
                style={{ height: 44, paddingLeft: 40, fontSize: 15 }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by case number"
              />
            </div>
          )}
        </div>

        {cases === null && <div style={{ color: "var(--muted)" }}>Loading…</div>}

        {cases?.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ color: "var(--muted-2)" }}>No cases yet. Add a case first, then its hearings will show up here.</div>
            <Link to="/cases/new">Add a new case</Link>
          </div>
        )}

        {cases && cases.length > 0 && filtered.length === 0 && (
          <div style={{ color: "var(--muted-2)" }}>No cases match "{search.trim()}".</div>
        )}

        {filtered && filtered.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 }}>
            {filtered.map((c) => {
              const pill = statusPillColors(c.status);
              return (
                <Link
                  key={c.id}
                  to={`/hearings/${c.id}`}
                  className="card"
                  style={{ padding: 22, display: "flex", flexDirection: "column", gap: 12, color: "inherit" }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                    <div className="heading-font" style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-.01em" }}>
                      {c.case_number}
                    </div>
                    <span className="dot" style={{ background: urgencyColor(c), marginTop: 6, flex: "none" }} />
                  </div>
                  <div className="pill" style={{ alignSelf: "flex-start", background: pill.bg, color: pill.fg }}>{c.status}</div>
                  <div style={{ fontSize: 14, color: "var(--muted-2)" }}>
                    {c.status === "Disposed"
                      ? `Disposed ${formatShort(c.last_hearing_date)}`
                      : c.next_hearing_date
                        ? `Next hearing ${formatShort(c.next_hearing_date)} · ${relativeLabel(c.next_hearing_date)}`
                        : "No next hearing set"}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--muted)" }}>
                    {[c.court_establishment, c.place].filter(Boolean).join(" · ") || "Court not set"}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
