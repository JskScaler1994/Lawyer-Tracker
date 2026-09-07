import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { TextInput } from "../components/Field.jsx";
import { api, auth } from "../lib/api";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const from = location.state?.from || "/cases/new";

  async function submit(e) {
    e.preventDefault();
    if (!password) return;
    setBusy(true);
    setError(null);
    try {
      const { token } = await api.login(password);
      auth.setToken(token);
      navigate(from, { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 20 }}>
      <form
        onSubmit={submit}
        className="card"
        style={{ width: "100%", maxWidth: 380, padding: 32, display: "flex", flexDirection: "column", gap: 20 }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div className="heading-font" style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-.02em" }}>Prasanna</div>
          <div className="label" style={{ fontWeight: 600 }}>Case tracker</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="label">Password</div>
          <TextInput
            value={password}
            onChange={setPassword}
            placeholder="Enter password"
            type="password"
            autoFocus
          />
        </div>

        {error && <div style={{ color: "var(--dot-red)", fontSize: 14 }}>{error}</div>}

        <button className="btn btn-primary" type="submit" disabled={!password || busy} style={{ padding: "14px 0", borderRadius: 14, fontSize: 16 }}>
          {busy ? "Checking…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
