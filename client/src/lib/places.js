// A separate hue family from the urgency dots (red/amber/green in status.js)
// so "which place" never reads as "how urgent" on the calendar's day panel.
const PALETTE = [
  { accent: "#3d6f9e", tint: "#e2ebf3" }, // blue
  { accent: "#9c3f6b", tint: "#f5e6ee" }, // rose
  { accent: "#6e3fa8", tint: "#ede4f7" }, // purple
  { accent: "#2f7a82", tint: "#e0eef0" }, // teal
  { accent: "#7a5230", tint: "#f0e6da" }, // brown
];

export function placeColor(place) {
  const key = place || "Other";
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

// Groups hearings by their case's `place`, sorted alphabetically (cases
// without a place fall into a shared "Other" group at the end) and each
// group's hearings kept in their incoming (time-sorted) order.
export function groupByPlace(hearings) {
  const groups = new Map();
  for (const h of hearings) {
    const key = h.place || "Other";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(h);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a === "Other" ? 1 : b === "Other" ? -1 : a.localeCompare(b)))
    .map(([place, items]) => ({ place, items, color: placeColor(place) }));
}
