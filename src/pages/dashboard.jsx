import React, { useContext, useState } from "react";
import "./dashboard.css";
import logo from "./logo.png";
import { NavLink, useNavigate } from "react-router-dom";
import { AppContext } from "../AppContext";

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    stats,
    recentActivity,
    pendingApprovals,
    cancelDisbursement,
    markDisbursementFailed
  } = useContext(AppContext);

  const [showActions, setShowActions] = useState(null);

  function handleLogout() {
    navigate("/");
  }

  const handleToggleActions = (index) => {
    setShowActions(showActions === index ? null : index);
  };

  return (
    <div className="dash-root">
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
          <NavLink to="/reports" className="nav-item">
            Reports
          </NavLink>
        </nav>
        <button className="logout" onClick={handleLogout}>
          Log Out
        </button>
      </aside>

      <main className="main">
        <header className="topbar">
          <h1 className="page-title">Dashboard</h1>
          <div className="top-controls">
            <input className="search" placeholder="Search..." />
            <button className="gear" aria-label="settings">
              ⚙️
            </button>
          </div>
        </header>

        <section className="cards-row">
          <div className="stat-card">
            <div className="stat-value">₱ {stats.totalDisbursedToday}</div>
            <div className="stat-title">Total Disbursed Today</div>
          </div>

          <div className="stat-card">
            <div className="stat-value">{stats.pendingDisbursements}</div>
            <div className="stat-title">Pending Disbursements</div>
          </div>

          <div className="stat-card warn">
            <div className="stat-value">{stats.failedTransactions}</div>
            <div className="stat-title">Failed Transactions</div>
          </div>
        </section>

        <section className="content-grid">
          <div className="recent-card">
            <div className="card-title">Recent Activity</div>
            {recentActivity.length === 0 ? (
              <p className="empty-text">No recent activity for today.</p>
            ) : (
              <ul className="activity-list">
                {recentActivity.map((r, i) => {
                  const message = typeof r === "string" ? r : r.message || "";
                  const dateStr = r && r.date ? new Date(r.date).toLocaleString() : null;
                  return (
                    <li key={i}>
                      <div className="activity-message">{message}</div>
                      {dateStr && <div className="activity-date">{dateStr}</div>}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="pending-card">
            <div className="card-title">Pending Approvals</div>
            {pendingApprovals.filter(a => a.status !== "Failed").length === 0 ? (
              <p className="empty-text">No pending disbursements.</p>
            ) : (
              <ul className="approvals-list">
                {pendingApprovals.map((a, i) => {
                  if (a.status === "Failed") return null
                  return (
                    <li key={i}>
                      <span className="bullet" />
                      <span className="app-text">
                        ₱{a.amount} disbursed to {a.name}
                      </span>
                      <button className="chev" onClick={() => handleToggleActions(i)}>
                        ›
                      </button>
                      {showActions === i && (
                        <div className="approval-actions">
                          <button
                            className="check-status"
                            onClick={() => navigate("/reports")}
                          >
                            Open
                          </button>
                          <button
                            className="cancel-btn"
                            onClick={() => {
                              markDisbursementFailed(i)
                              setShowActions(null)
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
