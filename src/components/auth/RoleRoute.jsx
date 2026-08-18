import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function RoleRoute({ role, children }) {
  const { profile, loading } = useAuth();
  if (loading) return <div className="portal-loading">Loading…</div>;
  if (profile?.app_role !== role) return <Navigate to="/portal" replace />;
  return children;
}
