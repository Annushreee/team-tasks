import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { IconClose, IconDashboard, IconFolder, IconMenu } from "./icons";
import { initials } from "../lib/format";

export function Layout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="shell">
      <header className="topbar">
        <NavLink to="/" className="brand" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark" aria-hidden>
            TT
          </span>
          <span className="brand-text">Team Tasks</span>
        </NavLink>

        <button
          type="button"
          className="nav-toggle btn icon-btn"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? <IconClose /> : <IconMenu />}
        </button>

        <nav className={`nav ${menuOpen ? "nav-open" : ""}`}>
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            <IconDashboard className="nav-icon" />
            Dashboard
          </NavLink>
          <NavLink
            to="/projects"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            <IconFolder className="nav-icon" />
            Projects
          </NavLink>
        </nav>

        <div className="userbar">
          <div className="user-chip" title={user?.email}>
            <span className="user-avatar" aria-hidden>
              {user ? initials(user.name) : "—"}
            </span>
            <span className="user-name">{user?.name}</span>
          </div>
          <button type="button" className="btn ghost btn-sm" onClick={() => void logout()}>
            Log out
          </button>
        </div>
      </header>

      {menuOpen && (
        <button
          type="button"
          className="nav-backdrop"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <main className="main">
        <Outlet />
      </main>

      <footer className="app-footer muted small">
        Signed in as <strong className="footer-strong">{user?.email}</strong> · Tasks sync per project
      </footer>
    </div>
  );
}
