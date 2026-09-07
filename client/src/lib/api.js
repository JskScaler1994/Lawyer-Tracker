const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const TOKEN_KEY = "prasanna:auth_token";

export const auth = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
};

async function request(path, options) {
  const token = auth.getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (res.status === 401 && path !== "/api/login") {
    auth.clearToken();
    window.location.href = "/login";
    return new Promise(() => {}); // navigation is happening; stop this call from resolving
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  login: (password) => request("/api/login", { method: "POST", body: JSON.stringify({ password }) }),
  listCases: () => request("/api/cases"),
  getCase: (id) => request(`/api/cases/${id}`),
  createCase: (data) => request("/api/cases", { method: "POST", body: JSON.stringify(data) }),
  updateCase: (id, data) => request(`/api/cases/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteCase: (id) => request(`/api/cases/${id}`, { method: "DELETE" }),
  addHearing: (id, data) => request(`/api/cases/${id}/hearings`, { method: "POST", body: JSON.stringify(data) }),
  updateHearing: (id, hearingId, data) =>
    request(`/api/cases/${id}/hearings/${hearingId}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteHearing: (id, hearingId) => request(`/api/cases/${id}/hearings/${hearingId}`, { method: "DELETE" }),
  getCalendar: (year, month) => request(`/api/calendar?year=${year}&month=${month}`),
  getUpcoming: (days = 7) => request(`/api/calendar/upcoming?days=${days}`),
  getStats: () => request("/api/stats"),
};
