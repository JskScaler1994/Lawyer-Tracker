import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { addDaysISO, todayISO } from "../lib/dates";

const DRAFT_KEY = "prasanna:new-case-draft";

const emptyForm = {
  caseNumber: "",
  cnr: "",
  status: "",
  courtEstablishment: "",
  place: "",
  lastHearingDate: "",
  lastHearingNote: "",
  nextHearingDate: "",
  nextHearingTime: "",
  nextHearingNote: "",
  reminderEnabled: true,
};

export function useNewCaseForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      return saved ? { ...emptyForm, ...JSON.parse(saved) } : emptyForm;
    } catch {
      return emptyForm;
    }
  });
  const [savedAt, setSavedAt] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  useEffect(() => {
    if (form === emptyForm) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
      setSavedAt(Date.now());
    }, 600);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  function setNextHearingRelative(days) {
    const base = form.lastHearingDate || todayISO();
    set("nextHearingDate", addDaysISO(base, days));
  }

  const canSave = form.caseNumber.trim() && form.status.trim();

  async function save() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const created = await api.createCase({
        case_number: form.caseNumber.trim(),
        cnr: form.cnr.trim() || null,
        status: form.status.trim(),
        court_establishment: form.courtEstablishment.trim() || null,
        place: form.place.trim() || null,
        filed_date: null,
        last_hearing_date: form.lastHearingDate || null,
        last_hearing_note: form.lastHearingNote || null,
        next_hearing_date: form.nextHearingDate || null,
        next_hearing_time: form.nextHearingTime || null,
        next_hearing_note: form.nextHearingNote || null,
        reminder_enabled: form.reminderEnabled,
      });
      localStorage.removeItem(DRAFT_KEY);
      navigate(`/cases/${created.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    localStorage.removeItem(DRAFT_KEY);
    setForm(emptyForm);
    navigate("/calendar");
  }

  return { form, set, setNextHearingRelative, canSave, saving, error, savedAt, save, cancel };
}
