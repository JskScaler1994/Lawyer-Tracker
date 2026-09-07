import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import { NewCasePage } from "./pages/NewCasePage.jsx";
import { CaseDetailPage } from "./pages/CaseDetailPage.jsx";
import { CalendarPage } from "./pages/CalendarPage.jsx";
import { HearingsCasePicker } from "./pages/HearingsCasePicker.jsx";
import { LegacyCaseRedirect } from "./pages/LegacyCaseRedirect.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/cases/new" replace />} />
        <Route path="/cases/new" element={<NewCasePage />} />
        <Route path="/cases/:id" element={<LegacyCaseRedirect />} />
        <Route path="/hearings" element={<HearingsCasePicker />} />
        <Route path="/hearings/:id" element={<CaseDetailPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="*" element={<Navigate to="/cases/new" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
