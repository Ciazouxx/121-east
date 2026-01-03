import React, { useContext, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AppContext } from "./AppContext";
import logo from "./logo.png";

export default function Sidebar() {
  const { setCurrentUser } = useContext(AppContext);
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function toggleMobileMenu() {
    setMobileMenuOpen(!mobileMenuOpen);
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  const handleLogout = () => {
    sessionStorage.removeItem("currentUser");
    if (setCurrentUser) {
      setCurrentUser(null);
    }
    navigate("/");
  };

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="mobile-header">
        <button
          className="hamburger-btn"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <h1 className="mobile-page-title">Chart of Accounts</h1>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-overlay" onClick={closeMobileMenu}></div>
      )}

      <aside className={`sidebar ${mobileMenuOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-header">
          <div className="logo-wrap">
            <img src={logo} alt="logo" className="logo" />
          </div>
          <button
            className="close-menu-btn"
            onClick={closeMobileMenu}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>
        <nav className="nav">
          <NavLink
            to="/dashboard"
            className="nav-item"
            onClick={closeMobileMenu}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/disbursement"
            className="nav-item"
            onClick={closeMobileMenu}
          >
            Disbursement
          </NavLink>
          <NavLink to="/payees" className="nav-item" onClick={closeMobileMenu}>
            Payees
          </NavLink>
          <NavLink to="/summary" className="nav-item" onClick={closeMobileMenu}>
            Summary
          </NavLink>
          <NavLink
            to="/chartofaccounts"
            className="nav-item"
            onClick={closeMobileMenu}
          >
            Chart of Accounts
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-button logout">
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
}
