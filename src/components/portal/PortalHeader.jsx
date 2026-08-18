import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function PortalHeader({ title }) {
  const { profile, studentProfile, tutorProfile, signOut } = useAuth();
  const displayName =
    studentProfile?.display_name || tutorProfile?.display_name ||
    studentProfile?.first_name || tutorProfile?.first_name ||
    profile?.email || "User";

  return (
    <header className="portal-header">
      <div>
        <p className="portal-eyebrow">A's Online</p>
        <h1>{title}</h1>
      </div>
      <div className="portal-user-menu">
        <span>{displayName}</span>
        <Link to="/">Public site</Link>
        <button type="button" onClick={signOut}>Log out</button>
      </div>
    </header>
  );
}
