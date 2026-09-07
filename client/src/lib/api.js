const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function request(path, options) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
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
