export function Field({ label, hint, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div className="label">{label}</div>
      {children}
      {hint && <div style={{ fontSize: 14, color: "var(--muted-2)" }}>{hint}</div>}
    </div>
  );
}

export function TextInput({ value, onChange, placeholder, emphasis, style, ...rest }) {
  return (
    <input
      className={`field-input${emphasis ? " emphasis" : ""}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={style}
      {...rest}
    />
  );
}

export function DateInput({ value, onChange, emphasis, style }) {
  return (
    <input
      type="date"
      className={`field-input${emphasis ? " emphasis" : ""}`}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      style={style}
    />
  );
}
