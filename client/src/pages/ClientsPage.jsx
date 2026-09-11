import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sidebar } from "../components/Sidebar.jsx";
import { SearchIcon } from "../components/icons.jsx";
import { api } from "../lib/api";

export function ClientsPage() {
  const [cases, setCases] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.listCases().then(setCases).catch(() => setCases([]));
  }, []);

  const withClientInfo = (cases || []).filter((c) => c.client_name || c.client_phone);
  const query = search.trim().toLowerCase();
  const rows = query ? withClientInfo.filter((c) => c.case_number.toLowerCase().includes(query)) : withClientInfo;

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content" style={{ padding: "32px 32px 40px", overflow: "auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, marginBottom: 24, flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div className="heading-font" style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-.02em" }}>Clients</div>
            <div style={{ fontSize: 15, color: "var(--muted-2)" }}>Case numbers with their associated client and phone number.</div>
          </div>

          {cases && withClientInfo.length > 0 && (
            <div style={{ position: "relative", width: 260 }}>
              <SearchIcon style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }} />
              <input
                className="field-input"
                style={{ height: 44, paddingLeft: 40, fontSize: 15 }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by case number"
              />
            </div>
          )}
        </div>

        {cases === null && <div style={{ color: "var(--muted)" }}>Loading…</div>}

        {cases && withClientInfo.length === 0 && (
          <div style={{ color: "var(--muted-2)" }}>
            No client details recorded yet. Add a client name and phone number from a case's Edit form to see them here.
          </div>
        )}

        {cases && withClientInfo.length > 0 && rows.length === 0 && (
          <div style={{ color: "var(--muted-2)" }}>No clients match "{search.trim()}".</div>
        )}

        {rows.length > 0 && (
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <Th>Client name</Th>
                    <Th>Phone</Th>
                    <Th>Case number</Th>
                    <Th>Court establishment</Th>
                    <Th>Appearing for</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c, i) => (
                    <tr key={c.id} style={{ borderBottom: i < rows.length - 1 ? "1px solid var(--surface-alt)" : "none" }}>
                      <Td>{c.client_name || "—"}</Td>
                      <Td>{c.client_phone || "—"}</Td>
                      <Td>
                        <Link to={`/hearings/${c.id}`} style={{ fontWeight: 600, color: "inherit" }}>{c.case_number}</Link>
                      </Td>
                      <Td>{c.court_establishment || "—"}</Td>
                      <Td>{c.appearing_for || "—"}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Th({ children }) {
  return (
    <th style={{ textAlign: "left", padding: "16px 20px", fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 700 }}>
      {children}
    </th>
  );
}

function Td({ children }) {
  return (
    <td style={{ padding: "16px 20px", fontSize: 15, color: "var(--ink)" }}>
      {children}
    </td>
  );
}
