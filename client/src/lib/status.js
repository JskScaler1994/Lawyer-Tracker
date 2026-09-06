import { diffDays, todayISO } from "./dates";

// Matches the calendar legend: this week (red), upcoming (amber), concluded (green).
export function urgencyColor(caseRow) {
  if (caseRow.status === "Disposed") return "var(--dot-green)";
  if (!caseRow.next_hearing_date) return "var(--dot-neutral)";
  const d = diffDays(todayISO(), caseRow.next_hearing_date);
  if (d <= 7) return "var(--dot-red)";
  return "var(--dot-amber)";
}

export function statusPillColors(status) {
  if (status === "Disposed") {
    return { bg: "var(--pill-green-bg)", fg: "var(--pill-green-fg)" };
  }
  return { bg: "var(--pill-amber-bg)", fg: "var(--pill-amber-fg)" };
}
