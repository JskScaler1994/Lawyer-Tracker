import { useState } from "react";
import { Field, TextInput, DateInput } from "../components/Field.jsx";
import { formatLong, relativeLabel } from "../lib/dates";

const CHIPS = [
  { label: "+ 1 week", days: 7 },
  { label: "+ 2 weeks", days: 14 },
  { label: "+ 1 month", days: 30 },
];

export function NewCaseNarrow({ form: f, set, setNextHearingRelative, canSave, saving, error, save, cancel }) {
  const [pickingDate, setPickingDate] = useState(false);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          height: 64,
          flex: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
        }}
      >
        <button className="btn btn-secondary" style={{ border: "none", padding: "8px 4px" }} onClick={cancel}>Cancel</button>
        <span className="heading-font" style={{ fontSize: 18, fontWeight: 700 }}>New case</span>
        <button
          className="btn btn-secondary"
          style={{ border: "none", padding: "8px 4px", color: canSave ? "var(--ink)" : "var(--muted-3)" }}
          disabled={!canSave || saving}
          onClick={save}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      <div style={{ flex: 1, padding: "28px 20px", display: "flex", flexDirection: "column", gap: 22, maxWidth: 640, margin: "0 auto", width: "100%" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="heading-font" style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-.025em", lineHeight: 1.05 }}>
            Add a matter to your docket
          </div>
          <div style={{ fontSize: 16, color: "var(--muted-2)" }}>
            Case number, status, court, and hearing dates — parties and documents can follow later.
          </div>
        </div>

        <Field label="Case number" hint={f.cnr ? `CNR: ${f.cnr}` : undefined}>
          <TextInput emphasis value={f.caseNumber} onChange={(v) => set("caseNumber", v)} placeholder="O.S. 412 / 2025" />
        </Field>
        <TextInput value={f.cnr} onChange={(v) => set("cnr", v)} placeholder="CNR (optional)" style={{ height: 46, fontSize: 15 }} />

        <Field label="Case status">
          <TextInput value={f.status} onChange={(v) => set("status", v)} placeholder="Pending — adjourned for evidence" />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Court establishment">
            <TextInput value={f.courtEstablishment} onChange={(v) => set("courtEstablishment", v)} placeholder="Tis Hazari District Court" />
          </Field>
          <Field label="Place">
            <TextInput value={f.place} onChange={(v) => set("place", v)} placeholder="Delhi" />
          </Field>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Client name">
            <TextInput value={f.clientName} onChange={(v) => set("clientName", v)} placeholder="Rakesh Malhotra" />
          </Field>
          <Field label="Client phone">
            <TextInput value={f.clientPhone} onChange={(v) => set("clientPhone", v)} placeholder="+91 98110 22334" />
          </Field>
        </div>

        <Field label="Appearing for">
          <TextInput value={f.appearingFor} onChange={(v) => set("appearingFor", v)} placeholder="Plaintiff, Defendant, Petitioner…" />
        </Field>

        <Field label="Last hearing date" hint={f.lastHearingDate ? formatLong(f.lastHearingDate) : undefined}>
          <DateInput value={f.lastHearingDate} onChange={(v) => set("lastHearingDate", v)} />
        </Field>
        <TextInput
          value={f.lastHearingNote}
          onChange={(v) => set("lastHearingNote", v)}
          placeholder="What happened at the last hearing"
          style={{ height: 46, fontSize: 15 }}
        />

        <Field label="Next hearing date">
          <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14, border: "1.5px solid var(--ink)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              {pickingDate || f.nextHearingDate ? (
                <DateInput value={f.nextHearingDate} onChange={(v) => set("nextHearingDate", v)} style={{ flex: 1, minWidth: 180 }} />
              ) : (
                <span style={{ fontSize: 17, color: "var(--muted-2)" }}>Not set</span>
              )}
              {f.nextHearingDate && (
                <span className="pill" style={{ background: "var(--pill-amber-bg)", color: "var(--pill-amber-fg)" }}>
                  {relativeLabel(f.nextHearingDate)}
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  className="btn btn-secondary"
                  style={{ borderRadius: 999, padding: "10px 16px", fontWeight: 500, fontSize: 14 }}
                  onClick={() => {
                    setPickingDate(true);
                    setNextHearingRelative(chip.days);
                  }}
                >
                  {chip.label}
                </button>
              ))}
              <button
                type="button"
                className="btn btn-secondary"
                style={{ borderRadius: 999, padding: "10px 16px", fontWeight: 500, fontSize: 14 }}
                onClick={() => setPickingDate(true)}
              >
                Pick date
              </button>
            </div>
          </div>
        </Field>
        <TextInput
          value={f.nextHearingNote}
          onChange={(v) => set("nextHearingNote", v)}
          placeholder="What's expected next"
          style={{ height: 46, fontSize: 15 }}
        />

        {error && <div style={{ color: "var(--dot-red)", fontSize: 14 }}>{error}</div>}
      </div>

      <div
        style={{
          flex: "none",
          padding: "18px 20px 26px",
          borderTop: "1px solid var(--border)",
          background: "var(--surface)",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div style={{ flex: 1, fontSize: 14, color: "var(--muted)" }}>
          Saved to <span style={{ color: "var(--ink)", fontWeight: 600 }}>My docket</span>
        </div>
        <button className="btn btn-primary" style={{ padding: "14px 28px", borderRadius: 16, fontSize: 16 }} disabled={!canSave || saving} onClick={save}>
          {saving ? "Saving…" : "Save case"}
        </button>
      </div>
    </div>
  );
}
