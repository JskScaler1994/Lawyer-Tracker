import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sidebar } from "../components/Sidebar.jsx";
import { Field, TextInput, DateInput } from "../components/Field.jsx";
import { Toggle } from "../components/Toggle.jsx";
import { api } from "../lib/api";
import { dayName, formatShort, relativeLabel } from "../lib/dates";
import { urgencyColor } from "../lib/status";
import { useRelativeTimeLabel } from "../hooks/useRelativeTime.js";

export function NewCaseWide({ form: f, set, canSave, saving, error, savedAt, save, cancel }) {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const savedLabel = useRelativeTimeLabel(savedAt);

  useEffect(() => {
    api.getStats().then(setStats).catch(() => {});
    api.listCases().then((rows) => setRecent(rows.slice(0, 3))).catch(() => {});
  }, []);

  return (
    <div className="app-shell">
      <Sidebar>
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: 16,
            borderRadius: 18,
            background: "var(--surface-alt)",
          }}
        >
          <div className="label" style={{ letterSpacing: ".12em" }}>Tomorrow</div>
          <div className="heading-font" style={{ fontSize: 32, fontWeight: 700, lineHeight: 1 }}>
            {stats ? stats.tomorrowHearings : "—"}
          </div>
          <div style={{ fontSize: 14, color: "var(--muted-2)" }}>hearings listed</div>
        </div>
      </Sidebar>

      <div className="main-content">
        <div
          style={{
            height: 78,
            flex: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 32px",
            borderBottom: "1px solid var(--border)",
            background: "var(--bg)",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
            <span className="heading-font" style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-.02em" }}>New case</span>
            <span style={{ fontSize: 15, color: "var(--muted)" }}>
              {savedLabel ? `Draft saved ${savedLabel}` : "Not saved yet"}
            </span>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-secondary" onClick={cancel}>Cancel</button>
            <button className="btn btn-primary" disabled={!canSave || saving} onClick={save}>
              {saving ? "Saving…" : "Save case"}
            </button>
          </div>
        </div>

        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 340px", gap: 28, padding: "28px 32px", overflow: "auto" }}>
          <div className="card" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
            <Field label="Case number" hint={f.cnr ? `CNR: ${f.cnr}` : "Add a CNR to reference the eCourts record"}>
              <TextInput emphasis value={f.caseNumber} onChange={(v) => set("caseNumber", v)} placeholder="O.S. 412 / 2025" />
            </Field>

            <Field label="Case status">
              <TextInput value={f.status} onChange={(v) => set("status", v)} placeholder="Pending — adjourned for evidence" />
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <Field label="Court establishment">
                <TextInput value={f.courtEstablishment} onChange={(v) => set("courtEstablishment", v)} placeholder="Tis Hazari District Court" />
              </Field>
              <Field label="Place">
                <TextInput value={f.place} onChange={(v) => set("place", v)} placeholder="Delhi" />
              </Field>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <Field label="Last hearing date" hint={f.lastHearingNote}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <DateInput value={f.lastHearingDate} onChange={(v) => set("lastHearingDate", v)} style={{ flex: 1 }} />
                  {f.lastHearingDate && (
                    <span style={{ fontSize: 14, color: "var(--muted)", flex: "none" }}>{dayName(f.lastHearingDate).slice(0, 3)}</span>
                  )}
                </div>
                <TextInput
                  value={f.lastHearingNote}
                  onChange={(v) => set("lastHearingNote", v)}
                  placeholder="What happened (e.g. adjourned for evidence)"
                  style={{ height: 44, fontSize: 14 }}
                />
              </Field>
              <Field
                label="Next hearing date"
                hint={f.nextHearingDate && <span style={{ color: "#a86c16", fontWeight: 600 }}>{relativeLabel(f.nextHearingDate)}</span>}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <DateInput emphasis value={f.nextHearingDate} onChange={(v) => set("nextHearingDate", v)} style={{ flex: 1 }} />
                  {f.nextHearingDate && (
                    <span style={{ fontSize: 14, color: "var(--muted)", flex: "none" }}>{dayName(f.nextHearingDate).slice(0, 3)}</span>
                  )}
                </div>
                <TextInput
                  value={f.nextHearingNote}
                  onChange={(v) => set("nextHearingNote", v)}
                  placeholder="What's expected (e.g. cross-examination of PW-2)"
                  style={{ height: 44, fontSize: 14 }}
                />
              </Field>
            </div>

            <div style={{ marginTop: "auto", paddingTop: 22, borderTop: "1px solid var(--surface-alt)" }}>
              <Toggle
                checked={f.reminderEnabled}
                onChange={(v) => set("reminderEnabled", v)}
                label="Remind me two days before the next hearing"
              />
            </div>
            {error && <div style={{ color: "var(--dot-red)", fontSize: 14 }}>{error}</div>}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
            <div style={{ background: "var(--ink)", borderRadius: 24, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="label" style={{ color: "var(--muted-3)" }}>Record preview</div>
              <div className="heading-font" style={{ fontSize: 30, fontWeight: 700, color: "var(--surface)", letterSpacing: "-.02em", lineHeight: 1.1 }}>
                {f.caseNumber || "New matter"}
              </div>
              <div className="pill" style={{ alignSelf: "flex-start", background: "var(--pill-amber-bg)", color: "var(--pill-amber-fg)" }}>
                {f.status || "No status yet"}
              </div>
              <div style={{ height: 1, background: "var(--ink-muted)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, color: "#cfc7b6" }}>
                <span>Last hearing</span>
                <span style={{ color: "var(--surface)", fontWeight: 600 }}>{f.lastHearingDate ? formatShort(f.lastHearingDate) : "—"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, color: "#cfc7b6" }}>
                <span>Next hearing</span>
                <span style={{ color: "var(--surface)", fontWeight: 600 }}>{f.nextHearingDate ? formatShort(f.nextHearingDate) : "—"}</span>
              </div>
            </div>

            <div className="card" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="label">Recently added</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {recent.length === 0 && <div style={{ fontSize: 14, color: "var(--muted-2)" }}>No cases yet.</div>}
                {recent.map((c, i) => (
                  <div key={c.id}>
                    {i > 0 && <div style={{ height: 1, background: "var(--surface-alt)", margin: "14px 0" }} />}
                    <Link to={`/cases/${c.id}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, color: "inherit" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>{c.case_number}</div>
                        <div style={{ fontSize: 14, color: "var(--muted)" }}>
                          {c.status === "Disposed"
                            ? `Disposed ${formatShort(c.last_hearing_date)}`
                            : c.next_hearing_date
                              ? `Next ${formatShort(c.next_hearing_date)}`
                              : "No date set"}
                        </div>
                      </div>
                      <span className="dot" style={{ background: urgencyColor(c) }} />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
