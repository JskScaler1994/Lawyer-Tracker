export function Toggle({ checked, onChange, label }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}>
      <span
        onClick={() => onChange(!checked)}
        style={{
          width: 46,
          height: 28,
          borderRadius: 999,
          background: checked ? "var(--accent-green)" : "var(--border-strong)",
          position: "relative",
          flex: "none",
          transition: "background .15s",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 3,
            left: checked ? 21 : 3,
            width: 22,
            height: 22,
            borderRadius: 999,
            background: "var(--surface)",
            transition: "left .15s",
          }}
        />
      </span>
      <span style={{ fontSize: 15, color: "var(--ink-muted)" }}>{label}</span>
    </label>
  );
}
