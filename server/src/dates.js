// All dates are stored/passed as "YYYY-MM-DD" strings and treated as
// plain calendar dates (no time zone), to avoid off-by-one shifts.

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function parseISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function addDaysISO(iso, days) {
  const d = parseISO(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function diffDays(fromISO, toISO) {
  const ms = parseISO(toISO).getTime() - parseISO(fromISO).getTime();
  return Math.round(ms / 86400000);
}

export function dayName(iso) {
  return parseISO(iso).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
}

export function formatShort(iso) {
  // "14 Aug 2026"
  return parseISO(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}

export function formatLong(iso) {
  // "Friday, 14 August 2026"
  const day = dayName(iso);
  const rest = parseISO(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" });
  return `${day}, ${rest}`;
}

export function relativeLabel(iso) {
  const diff = diffDays(todayISO(), iso);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff > 1) return `In ${diff} days`;
  if (diff === -1) return "Yesterday";
  return `${Math.abs(diff)} days ago`;
}
