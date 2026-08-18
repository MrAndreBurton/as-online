import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function PortalEntry() {
  const { profile, loading } = useAuth();
  if (loading) return <div className="portal-loading">Loading…</div>;
  if (profile?.app_role === "student") return <Navigate to="/portal/student" replace />;
  if (profile?.app_role === "admin_tutor") return <Navigate to="/portal/admin" replace />;
  return <div className="portal-loading">No recognised AEOS role.</div>;
}
