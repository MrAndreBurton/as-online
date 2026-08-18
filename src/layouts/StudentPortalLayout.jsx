import { NavLink, Outlet } from "react-router-dom";
import PortalHeader from "../components/portal/PortalHeader";

const links = [
  ["/portal/student","Dashboard",true],
  ["/portal/student/sessions","Sessions"],
  ["/portal/student/learning","My Learning"],
  ["/portal/student/homework","Homework"],
  ["/portal/student/pen-e","Pen-E & Me"],
];

export default function StudentPortalLayout() {
  return (
    <div className="portal-shell">
      <aside className="portal-sidebar">
        <div className="portal-brand">A's Online</div>
        <p className="portal-sidebar-label">Student Portal</p>
        <nav>{links.map(([to,label,end]) => (
          <NavLink key={to} to={to} end={end}
            className={({isActive}) => `portal-nav-link ${isActive ? "active" : ""}`}>
            {label}
          </NavLink>
        ))}</nav>
      </aside>
      <main className="portal-main">
        <PortalHeader title="My Learning" />
        <div className="portal-content"><Outlet /></div>
      </main>
    </div>
  );
}
