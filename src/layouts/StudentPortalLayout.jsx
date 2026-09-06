import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import PortalHeader from "../components/portal/PortalHeader";
import logo from "../assets/logo/as-online-logo.svg";

const links = [
  ["/portal/student", "Dashboard", true],
  ["/portal/student/sessions", "Sessions"],
  ["/portal/student/learning", "My Learning"],
  ["/portal/student/homework", "Homework"],
  ["/portal/student/pen-e", "Pen-E & Me"],
];

export default function StudentPortalLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="portal-shell">
      <aside
        className={`portal-sidebar ${
          menuOpen ? "mobile-open" : ""
        }`}
      >
        <div className="portal-sidebar-top">
          <div className="portal-brand-block">
            <img
              src={logo}
              alt="A's Online Tutoring Services"
              className="portal-brand-logo"
            />

            <p className="portal-sidebar-label">
              Student Portal
            </p>
          </div>

          <button
            type="button"
            className="portal-menu-button"
            onClick={() =>
              setMenuOpen((current) => !current)
            }
            aria-expanded={menuOpen}
            aria-label="Toggle student navigation"
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>

        <nav className="portal-sidebar-nav">
          {links.map(([to, label, end]) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `portal-nav-link ${
                  isActive ? "active" : ""
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="portal-main">
        <PortalHeader title="My Learning" />

        <div className="portal-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}


