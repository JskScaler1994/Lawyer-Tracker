import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Sidebar } from "../components/Sidebar.jsx";
import { api } from "../lib/api";

// Landing page for the bare "Hearings" nav item: sends the user straight to
// the most recently added case's hearing history, since there's no
// case-picker screen of its own.
export function HearingsRedirect() {
  const [cases, setCases] = useState(null);

  useEffect(() => {
    api.listCases().then(setCases).catch(() => setCases([]));
  }, []);

  if (cases === null) {
    return (
      <div className="app-shell">
        <Sidebar />
        <div className="main-content" style={{ padding: 32, color: "var(--muted)" }}>Loading…</div>
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="app-shell">
        <Sidebar />
        <div className="main-content" style={{ padding: 32, display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="heading-font" style={{ fontSize: 22, fontWeight: 700 }}>No cases yet</div>
          <div style={{ color: "var(--muted-2)" }}>Add a case first, then its hearings will show up here.</div>
          <Link to="/cases/new" style={{ marginTop: 8 }}>Add a new case</Link>
        </div>
      </div>
    );
  }

  return <Navigate to={`/hearings/${cases[0].id}`} replace />;
}
