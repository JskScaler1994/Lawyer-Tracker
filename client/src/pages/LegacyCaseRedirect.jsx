import { Navigate, useParams } from "react-router-dom";

// Old case-detail URL (/cases/:id) now lives under /hearings/:id.
export function LegacyCaseRedirect() {
  const { id } = useParams();
  return <Navigate to={`/hearings/${id}`} replace />;
}
