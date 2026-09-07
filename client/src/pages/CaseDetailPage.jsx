import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Sidebar } from "../components/Sidebar.jsx";
import { Field, TextInput, DateInput } from "../components/Field.jsx";
import { api } from "../lib/api";
import { dayName, formatShort, relativeLabel } from "../lib/dates";
import { statusPillColors } from "../lib/status";

export function CaseDetailPage() {
  const { id } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [openMatters, setOpenMatters] = useState([]);
  const [error, setError] = useState(null);
  const [showAddHearing, setShowAddHearing] = useState(false);

  const load = useCallback(() => {
    api.getCase(id).then(setCaseData).catch((e) => setError(e.message));
    api.listCases().then((rows) => setOpenMatters(rows.filter((c) => c.status !== "Disposed").slice(0, 6))).catch(() => {});
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <div className="app-shell">
        <Sidebar />
        <div className="main-content" style={{ padding: 32 }}>
          <p>{error}</p>
          <Link to="/cases/new">Add a new case</Link>
        </div>
      </div>
    );
  }
  if (!caseData) {
    return (
      <div className="app-shell">
        <Sidebar />
        <div className="main-content" style={{ padding: 32, color: "var(--muted)" }}>Loading…</div>
      </div>
    );
  }

  const pill = statusPillColors(caseData.status);

  return (
    <div className="app-shell">
      <Sidebar>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
          <div className="label" style={{ letterSpacing: ".12em" }}>Open matters</div>
          {openMatters.map((c) => (
            <Link
              key={c.id}
              to={`/hearings/${c.id}`}
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                fontSize: 15,
                fontWeight: String(c.id) === id ? 600 : 400,
                background: String(c.id) === id ? "var(--surface-alt)" : "transparent",
                color: String(c.id) === id ? "var(--ink)" : "var(--ink-muted)",
              }}
            >
              {c.case_number}
            </Link>
          ))}
        </div>
      </Sidebar>

      <div className="main-content">
        <div style={{ flex: "none", padding: "28px 32px 22px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
            <div className="label">
              {[caseData.court_establishment, caseData.place].filter(Boolean).join(" · ") || "Court not set"}
            </div>
            <div className="heading-font" style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-.025em", lineHeight: 1 }}>
              {caseData.case_number}
            </div>
            <div style={{ fontSize: 15, color: "var(--muted-2)" }}>
              {[caseData.cnr && `CNR ${caseData.cnr}`, caseData.coram && `Before ${caseData.coram}`].filter(Boolean).join(" · ")}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "none" }}>
            <div className="pill" style={{ background: pill.bg, color: pill.fg }}>{caseData.status}</div>
            <button className="btn btn-primary" onClick={() => setShowAddHearing(true)}>Add hearing</button>
          </div>
        </div>

        <div style={{ flex: "none", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, padding: "24px 32px" }}>
          <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 6 }}>
            <div className="label">Last hearing</div>
            <div className="heading-font" style={{ fontSize: 24, fontWeight: 700 }}>{formatShort(caseData.last_hearing_date)}</div>
            <div style={{ fontSize: 14, color: "var(--muted-2)" }}>{caseData.last_hearing_title || "—"}</div>
          </div>
          <div style={{ background: "var(--ink)", borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", gap: 6 }}>
            <div className="label" style={{ color: "var(--muted-3)" }}>Next hearing</div>
            <div className="heading-font" style={{ fontSize: 24, fontWeight: 700, color: "var(--surface)" }}>
              {caseData.next_hearing_date ? formatShort(caseData.next_hearing_date) : "Not set"}
            </div>
            <div style={{ fontSize: 14, color: "#e2c98f" }}>
              {caseData.next_hearing_date
                ? [relativeLabel(caseData.next_hearing_date), caseData.next_hearing_time, caseData.next_hearing_note].filter(Boolean).join(" · ")
                : "Add a hearing to schedule the next date"}
            </div>
          </div>
          <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 6 }}>
            <div className="label">Filed</div>
            <div className="heading-font" style={{ fontSize: 24, fontWeight: 700 }}>{formatShort(caseData.filed_date)}</div>
            <div style={{ fontSize: 14, color: "var(--muted-2)" }}>{caseData.hearing_count} hearing{caseData.hearing_count === 1 ? "" : "s"} so far</div>
          </div>
        </div>

        <div style={{ flex: 1, padding: "4px 32px 28px", display: "flex", flexDirection: "column", gap: 16, minHeight: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div className="label">Hearing history</div>
          </div>
          <div className="card" style={{ flex: 1, padding: "24px 26px", display: "flex", flexDirection: "column", gap: 18, overflow: "auto" }}>
            {caseData.hearings.length === 0 && <div style={{ color: "var(--muted-2)" }}>No hearings recorded yet.</div>}
            {caseData.hearings.map((h, i) => (
              <div key={h.id} style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                <div style={{ width: 104, flex: "none", display: "flex", flexDirection: "column", gap: 2 }}>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{formatShort(h.hearing_date)}</div>
                  <div style={{ fontSize: 13, color: "var(--muted)" }}>{dayName(h.hearing_date)}</div>
                </div>
                <div style={{ width: 12, flex: "none", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 999, background: "var(--ink)" }} />
                  {i < caseData.hearings.length - 1 && <div style={{ width: 1, flex: 1, background: "var(--border)", marginTop: 4, minHeight: 22 }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4, paddingBottom: 6 }}>
                  <div style={{ fontSize: 17, fontWeight: 600 }}>{h.title}</div>
                  {h.note && <div style={{ fontSize: 15, color: "var(--muted-2)" }}>{h.note}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showAddHearing && (
        <AddHearingModal
          caseData={caseData}
          onClose={() => setShowAddHearing(false)}
          onSaved={() => {
            setShowAddHearing(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function AddHearingModal({ caseData, onClose, onSaved }) {
  const [hearingDate, setHearingDate] = useState(caseData.next_hearing_date || "");
  const [title, setTitle] = useState(caseData.next_hearing_note || "");
  const [note, setNote] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [nextTime, setNextTime] = useState("");
  const [nextNote, setNextNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function submit() {
    if (!hearingDate || !title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await api.addHearing(caseData.id, {
        hearing_date: hearingDate,
        title: title.trim(),
        note: note.trim() || null,
        next_hearing_date: nextDate || null,
        next_hearing_time: nextTime || null,
        next_hearing_note: nextNote.trim() || null,
      });
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(27,25,21,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 10 }}
      onClick={onClose}
    >
      <div className="card" style={{ background: "var(--surface)", padding: 28, width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: 18, maxHeight: "90vh", overflow: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div className="heading-font" style={{ fontSize: 22, fontWeight: 700 }}>Add hearing — {caseData.case_number}</div>

        <Field label="Hearing date">
          <DateInput value={hearingDate} onChange={setHearingDate} />
        </Field>
        <Field label="What happened">
          <TextInput value={title} onChange={setTitle} placeholder="e.g. Adjourned for evidence" />
        </Field>
        <Field label="Note (optional)">
          <TextInput value={note} onChange={setNote} placeholder="Additional detail" />
        </Field>

        <div style={{ height: 1, background: "var(--border)" }} />
        <div className="label">Next hearing (optional)</div>
        <Field label="Next hearing date">
          <DateInput value={nextDate} onChange={setNextDate} />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <TextInput value={nextTime} onChange={setNextTime} placeholder="10:00 am" />
          <TextInput value={nextNote} onChange={setNextNote} placeholder="What's expected" />
        </div>

        {error && <div style={{ color: "var(--dot-red)", fontSize: 14 }}>{error}</div>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!hearingDate || !title.trim() || saving} onClick={submit}>
            {saving ? "Saving…" : "Save hearing"}
          </button>
        </div>
      </div>
    </div>
  );
}
