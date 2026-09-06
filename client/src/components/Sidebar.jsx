import { Link, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { label: "Cases", to: "/cases/new", match: (path) => path.startsWith("/cases") },
  { label: "Hearings", disabled: true },
  { label: "Calendar", to: "/calendar", match: (path) => path.startsWith("/calendar") },
  { label: "Clients", disabled: true },
];

export function Sidebar({ children }) {
  const location = useLocation();

  return (
    <div
      style={{
        width: 236,
        flex: "none",
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        padding: "28px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 28,
      }}
    >
      <Link to="/cases/new" style={{ display: "flex", flexDirection: "column", gap: 2, color: "inherit" }}>
        <div className="heading-font" style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-.02em", color: "var(--ink)" }}>
          Prasanna
        </div>
        <div className="label" style={{ fontWeight: 600 }}>Case tracker</div>
      </Link>

      <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {NAV_ITEMS.map((item) => {
          const active = item.to && item.match(location.pathname);
          const style = {
            padding: "12px 14px",
            borderRadius: 14,
            fontSize: 16,
            fontWeight: active ? 600 : 500,
            background: active ? "var(--ink)" : "transparent",
            color: active ? "var(--surface)" : item.disabled ? "var(--muted-3)" : "var(--ink-muted)",
          };
          if (item.disabled) {
            return (
              <span key={item.label} style={{ ...style, cursor: "default" }} title="Coming soon">
                {item.label}
              </span>
            );
          }
          return (
            <Link key={item.label} to={item.to} style={style}>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
