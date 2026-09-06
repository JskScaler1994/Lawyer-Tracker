// Dates are "YYYY-MM-DD" strings, treated as plain calendar dates (UTC) so
// they don't shift with the viewer's local time zone.

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function parseISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function diffDays(fromISO, toISO) {
  return Math.round((parseISO(toISO).getTime() - parseISO(fromISO).getTime()) / 86400000);
}

export function addDaysISO(iso, days) {
  const d = parseISO(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function dayName(iso) {
  return parseISO(iso).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
}

export function formatShort(iso) {
  if (!iso) return "—";
  return parseISO(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}

export function formatLong(iso) {
  if (!iso) return "—";
  return `${dayName(iso)}, ${parseISO(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" })}`;
}

export function formatDayMonth(iso) {
  const d = parseISO(iso);
  return {
    dd: String(d.getUTCDate()).padStart(2, "0"),
    mon: d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
  };
}

export function relativeLabel(iso) {
  if (!iso) return null;
  const diff = diffDays(todayISO(), iso);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff > 1) return `In ${diff} days`;
  if (diff === -1) return "Yesterday";
  return `${Math.abs(diff)} days ago`;
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
