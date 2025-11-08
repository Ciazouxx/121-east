import React, { useContext, useState } from "react";
import "./dashboard.css";
import logo from "./logo.png";
import chevIcon from "./arrowright.png"; 
import warningIcon from "./warning.png";
import { NavLink, useNavigate } from "react-router-dom";
import { AppContext } from "../AppContext";

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    stats,
    recentActivity,
    pendingApprovals,
  } = useContext(AppContext);

  const [showActions, setShowActions] = useState(null);
  const [modalCoords, setModalCoords] = useState(null);

  function handleLogout() {
    navigate("/");
  }

  const handleToggleActions = (event, index) => {
    
    if (showActions === index) {
      setShowActions(null);
      setModalCoords(null);
      return;
    }
    
    const rect = event.currentTarget.getBoundingClientRect();
    setModalCoords({
      top: rect.top, 
      left: rect.left
    });
    setShowActions(index);
  };

  function closeActionModal() {
    setShowActions(null);
    setModalCoords(null);
  }

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
            <img src={warningIcon} alt="warning" className="warning-icon" />
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
                  if (a.status === "Failed") return null;
                  return (
                    <li key={i}>
                      <span className="app-text">
                        ₱{a.amount} disbursed to {a.name}
                      </span>
                      <button
                        className="chev-image"
                        onClick={(e) => handleToggleActions(e, i)}
                        aria-label="Open actions"
                      >
                        <img src={chevIcon} alt="actions" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
       {showActions !== null && modalCoords && (
         <div className="action-modal-backdrop" onClick={closeActionModal}>
           <div
             className="action-modal"
             style={{ top: modalCoords.top + "px", left: modalCoords.left + "px" }}
             onClick={(e) => e.stopPropagation()}
           >
             <div className="action-modal-row">
               <button
                 className="check-status"
                 onClick={() => {
                   navigate("/reports");
                   closeActionModal();
                 }}
               >
                 Open
               </button>
             </div>
             <div className="action-modal-row">
               <button
                 className="close-btn"
                 onClick={() => {
                   closeActionModal();
                 }}
               >
                 Close
               </button>
             </div>
           </div>
         </div>
        )}
       </main>
     </div>
   );
 }
