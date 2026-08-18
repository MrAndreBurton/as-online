import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="portal-loading">Loading your A's Online portal…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!profile) return <div className="portal-loading">Your AEOS profile is not ready.</div>;

  return children;
}
