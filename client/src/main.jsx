import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import "./index.css";
import { NewCasePage } from "./pages/NewCasePage.jsx";
import { CaseDetailPage } from "./pages/CaseDetailPage.jsx";
import { CalendarPage } from "./pages/CalendarPage.jsx";
import { HearingsCasePicker } from "./pages/HearingsCasePicker.jsx";
import { LegacyCaseRedirect } from "./pages/LegacyCaseRedirect.jsx";
import { ClientsPage } from "./pages/ClientsPage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { auth } from "./lib/api";

function RequireAuth() {
  const location = useLocation();
  if (!auth.getToken()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/" element={<Navigate to="/cases/new" replace />} />
          <Route path="/cases/new" element={<NewCasePage />} />
          <Route path="/cases/:id" element={<LegacyCaseRedirect />} />
          <Route path="/hearings" element={<HearingsCasePicker />} />
          <Route path="/hearings/:id" element={<CaseDetailPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="*" element={<Navigate to="/cases/new" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
