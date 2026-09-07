export function ConfirmDialog({ title, message, confirmLabel = "Delete", danger = true, confirming, error, onConfirm, onCancel }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(27,25,21,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 20 }}
      onClick={onCancel}
    >
      <div className="card" style={{ background: "var(--surface)", padding: 26, width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 16 }} onClick={(e) => e.stopPropagation()}>
        <div className="heading-font" style={{ fontSize: 20, fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: 15, color: "var(--muted-2)", lineHeight: 1.5 }}>{message}</div>
        {error && <div style={{ color: "var(--dot-red)", fontSize: 14 }}>{error}</div>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button
            className="btn btn-primary"
            style={danger ? { background: "var(--dot-red)" } : undefined}
            disabled={confirming}
            onClick={onConfirm}
          >
            {confirming ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
