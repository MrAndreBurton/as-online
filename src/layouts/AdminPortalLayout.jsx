import { NavLink, Outlet } from "react-router-dom";
import PortalHeader from "../components/portal/PortalHeader";

const links = [
  ["/portal/admin","Dashboard",true],
  ["/portal/admin/students","Students"],
  ["/portal/admin/sessions","Sessions"],
  ["/portal/admin/transcripts","Transcripts"],
  ["/portal/admin/evidence","Evidence Review"],
  ["/portal/admin/curriculum","Curriculum"],
  ["/portal/admin/pen-e","Pen-E"],
];

export default function AdminPortalLayout() {
  return (
    <div className="portal-shell">
      <aside className="portal-sidebar">
        <div className="portal-brand">A's Online</div>
        <p className="portal-sidebar-label">Admin / Tutor</p>
        <nav>{links.map(([to,label,end]) => (
          <NavLink key={to} to={to} end={end}
            className={({isActive}) => `portal-nav-link ${isActive ? "active" : ""}`}>
            {label}
          </NavLink>
        ))}</nav>
      </aside>
      <main className="portal-main">
        <PortalHeader title="AEOS Tutor Workspace" />
        <div className="portal-content"><Outlet /></div>
      </main>
    </div>
  );
}
