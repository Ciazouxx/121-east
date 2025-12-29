import React, { useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AppContext } from "./AppContext";
import logo from "./logo.png";

export default function Sidebar() {
  const { setCurrentUser } = useContext(AppContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem("currentUser");
    if (setCurrentUser) {
      setCurrentUser(null);
    }
    navigate("/");
  };

  return (
    <aside className="sidebar">
      <div className="logo-wrap">
        <img src={logo} alt="logo" className="logo" />
      </div>
      <nav className="nav">
        <NavLink to="/dashboard" className="nav-item">
          Dashboard
        </NavLink>
        <NavLink to="/disbursement" className="nav-item">
          Disbursement
        </NavLink>
        <NavLink to="/payees" className="nav-item">
          Payees
        </NavLink>
        <NavLink to="/summary" className="nav-item">
          Summary
        </NavLink>
        <NavLink to="/chartofaccounts" className="nav-item">
          Chart of Accounts
        </NavLink>
      </nav>
      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-button logout">
          Log Out
        </button>
      </div>
    </aside>
  );
}
