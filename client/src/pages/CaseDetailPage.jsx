import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Sidebar } from "../components/Sidebar.jsx";
import { Field, TextInput, DateInput } from "../components/Field.jsx";
import { Toggle } from "../components/Toggle.jsx";
import { ConfirmDialog } from "../components/ConfirmDialog.jsx";
import { EditIcon, TrashIcon } from "../components/icons.jsx";
import { api } from "../lib/api";
import { dayName, formatShort, relativeLabel } from "../lib/dates";
import { statusPillColors } from "../lib/status";

export function CaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [error, setError] = useState(null);
  const [showAddHearing, setShowAddHearing] = useState(false);
  const [showEditCase, setShowEditCase] = useState(false);
  const [showDeleteCase, setShowDeleteCase] = useState(false);
  const [deleteCaseError, setDeleteCaseError] = useState(null);
  const [deletingCase, setDeletingCase] = useState(false);
  const [editingHearing, setEditingHearing] = useState(null);
  const [deletingHearing, setDeletingHearing] = useState(null);
  const [hearingActionError, setHearingActionError] = useState(null);
  const [hearingActionBusy, setHearingActionBusy] = useState(false);

  const latestRequestId = useRef(0);

  const load = useCallback(() => {
    const requestId = ++latestRequestId.current;
    api.getCase(id)
      .then((data) => {
        if (latestRequestId.current === requestId) setCaseData(data);
      })
      .catch((e) => {
        if (latestRequestId.current === requestId) setError(e.message);
      });
  }, [id]);

  useEffect(() => {
    // A previous case's data must never linger while the next one loads —
    // that's what let an old page's hearing IDs be edited against a new
    // case's ID if an earlier fetch resolved after a later one.
    setCaseData(null);
    setError(null);
    load();
  }, [load]);

  async function confirmDeleteCase() {
    setDeletingCase(true);
    setDeleteCaseError(null);
    try {
      await api.deleteCase(id);
      navigate("/hearings");
    } catch (e) {
      setDeleteCaseError(e.message);
    } finally {
      setDeletingCase(false);
    }
  }

  async function confirmDeleteHearing() {
    setHearingActionBusy(true);
    setHearingActionError(null);
    try {
      await api.deleteHearing(id, deletingHearing.id);
      setDeletingHearing(null);
      load();
    } catch (e) {
      setHearingActionError(e.message);
    } finally {
      setHearingActionBusy(false);
    }
  }

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
      <Sidebar />

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
            {(caseData.client_name || caseData.client_phone) && (
              <div style={{ fontSize: 15, color: "var(--muted-2)" }}>
                {[
                  caseData.client_name,
                  caseData.client_phone,
                  caseData.appearing_for && `Appearing for ${caseData.appearing_for}`,
                ].filter(Boolean).join(" · ")}
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "none" }}>
            <div className="pill" style={{ background: pill.bg, color: pill.fg }}>{caseData.status}</div>
            <button className="btn btn-secondary" onClick={() => setShowEditCase(true)}>Edit</button>
            <button
              className="btn btn-secondary"
              style={{ color: "var(--dot-red)", borderColor: "var(--dot-red)" }}
              onClick={() => setShowDeleteCase(true)}
            >
              Delete
            </button>
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
                <div style={{ display: "flex", gap: 6, flex: "none" }}>
                  <button
                    aria-label="Edit hearing"
                    onClick={() => setEditingHearing(h)}
                    style={{ background: "none", border: "none", padding: 6, borderRadius: 8, color: "var(--muted)", cursor: "pointer", display: "flex" }}
                  >
                    <EditIcon />
                  </button>
                  <button
                    aria-label="Delete hearing"
                    onClick={() => setDeletingHearing(h)}
                    style={{ background: "none", border: "none", padding: 6, borderRadius: 8, color: "var(--muted)", cursor: "pointer", display: "flex" }}
                  >
                    <TrashIcon />
                  </button>
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

      {showEditCase && (
        <EditCaseModal
          caseData={caseData}
          onClose={() => setShowEditCase(false)}
          onSaved={() => {
            setShowEditCase(false);
            load();
          }}
        />
      )}

      {showDeleteCase && (
        <ConfirmDialog
          title="Delete this case?"
          message={`Delete ${caseData.case_number} and its ${caseData.hearing_count} hearing${caseData.hearing_count === 1 ? "" : "s"}? This can't be undone.`}
          confirmLabel="Delete case"
          confirming={deletingCase}
          error={deleteCaseError}
          onCancel={() => {
            setShowDeleteCase(false);
            setDeleteCaseError(null);
          }}
          onConfirm={confirmDeleteCase}
        />
      )}

      {editingHearing && (
        <EditHearingModal
          caseId={id}
          hearing={editingHearing}
          onClose={() => setEditingHearing(null)}
          onSaved={() => {
            setEditingHearing(null);
            load();
          }}
        />
      )}

      {deletingHearing && (
        <ConfirmDialog
          title="Delete this hearing?"
          message={`Delete the ${formatShort(deletingHearing.hearing_date)} entry "${deletingHearing.title}"? This can't be undone.`}
          confirmLabel="Delete hearing"
          confirming={hearingActionBusy}
          error={hearingActionError}
          onCancel={() => {
            setDeletingHearing(null);
            setHearingActionError(null);
          }}
          onConfirm={confirmDeleteHearing}
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

function EditHearingModal({ caseId, hearing, onClose, onSaved }) {
  const [hearingDate, setHearingDate] = useState(hearing.hearing_date);
  const [title, setTitle] = useState(hearing.title);
  const [note, setNote] = useState(hearing.note || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function submit() {
    if (!hearingDate || !title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await api.updateHearing(caseId, hearing.id, {
        hearing_date: hearingDate,
        title: title.trim(),
        note: note.trim() || null,
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
        <div className="heading-font" style={{ fontSize: 22, fontWeight: 700 }}>Edit hearing</div>

        <Field label="Hearing date">
          <DateInput value={hearingDate} onChange={setHearingDate} />
        </Field>
        <Field label="What happened">
          <TextInput value={title} onChange={setTitle} placeholder="e.g. Adjourned for evidence" />
        </Field>
        <Field label="Note (optional)">
          <TextInput value={note} onChange={setNote} placeholder="Additional detail" />
        </Field>

        {error && <div style={{ color: "var(--dot-red)", fontSize: 14 }}>{error}</div>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!hearingDate || !title.trim() || saving} onClick={submit}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditCaseModal({ caseData, onClose, onSaved }) {
  const [form, setForm] = useState({
    case_number: caseData.case_number || "",
    cnr: caseData.cnr || "",
    status: caseData.status || "",
    court_establishment: caseData.court_establishment || "",
    place: caseData.place || "",
    coram: caseData.coram || "",
    filed_date: caseData.filed_date || "",
    client_name: caseData.client_name || "",
    client_phone: caseData.client_phone || "",
    appearing_for: caseData.appearing_for || "",
    next_hearing_date: caseData.next_hearing_date || "",
    next_hearing_time: caseData.next_hearing_time || "",
    next_hearing_note: caseData.next_hearing_note || "",
    reminder_enabled: !!caseData.reminder_enabled,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const canSave = form.case_number.trim() && form.status.trim();

  async function submit() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await api.updateCase(caseData.id, {
        case_number: form.case_number.trim(),
        cnr: form.cnr.trim() || null,
        status: form.status.trim(),
        court_establishment: form.court_establishment.trim() || null,
        place: form.place.trim() || null,
        coram: form.coram.trim() || null,
        filed_date: form.filed_date || null,
        client_name: form.client_name.trim() || null,
        client_phone: form.client_phone.trim() || null,
        appearing_for: form.appearing_for.trim() || null,
        next_hearing_date: form.next_hearing_date || null,
        next_hearing_time: form.next_hearing_time || null,
        next_hearing_note: form.next_hearing_note || null,
        reminder_enabled: form.reminder_enabled,
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
      <div className="card" style={{ background: "var(--surface)", padding: 28, width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", gap: 18, maxHeight: "90vh", overflow: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div className="heading-font" style={{ fontSize: 22, fontWeight: 700 }}>Edit case</div>

        <Field label="Case number">
          <TextInput value={form.case_number} onChange={(v) => set("case_number", v)} />
        </Field>
        <Field label="CNR">
          <TextInput value={form.cnr} onChange={(v) => set("cnr", v)} placeholder="Optional" />
        </Field>
        <Field label="Case status">
          <TextInput value={form.status} onChange={(v) => set("status", v)} />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Court establishment">
            <TextInput value={form.court_establishment} onChange={(v) => set("court_establishment", v)} />
          </Field>
          <Field label="Place">
            <TextInput value={form.place} onChange={(v) => set("place", v)} />
          </Field>
        </div>
        <Field label="Coram / bench">
          <TextInput value={form.coram} onChange={(v) => set("coram", v)} placeholder="Optional" />
        </Field>
        <Field label="Filed date">
          <DateInput value={form.filed_date} onChange={(v) => set("filed_date", v)} />
        </Field>

        <div style={{ height: 1, background: "var(--border)" }} />
        <div className="label">Client</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Client name">
            <TextInput value={form.client_name} onChange={(v) => set("client_name", v)} placeholder="Optional" />
          </Field>
          <Field label="Client phone">
            <TextInput value={form.client_phone} onChange={(v) => set("client_phone", v)} placeholder="Optional" />
          </Field>
        </div>
        <Field label="Appearing for">
          <TextInput value={form.appearing_for} onChange={(v) => set("appearing_for", v)} placeholder="Plaintiff, Defendant, Petitioner…" />
        </Field>

        <div style={{ height: 1, background: "var(--border)" }} />
        <div className="label">Next hearing</div>
        <Field label="Next hearing date">
          <DateInput value={form.next_hearing_date} onChange={(v) => set("next_hearing_date", v)} />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <TextInput value={form.next_hearing_time} onChange={(v) => set("next_hearing_time", v)} placeholder="10:00 am" />
          <TextInput value={form.next_hearing_note} onChange={(v) => set("next_hearing_note", v)} placeholder="What's expected" />
        </div>

        <Toggle checked={form.reminder_enabled} onChange={(v) => set("reminder_enabled", v)} label="Remind me two days before the next hearing" />

        {error && <div style={{ color: "var(--dot-red)", fontSize: 14 }}>{error}</div>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!canSave || saving} onClick={submit}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
