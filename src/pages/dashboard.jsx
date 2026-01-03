import React, { useContext, useState } from "react";
import "./dashboard.css";
import logo from "../assets/logo.png";
import chevIcon from "./arrowright.png";
import warningIcon from "./warning.png";
import settingsicon from "../assets/settingsicon.png";
import { NavLink, useNavigate } from "react-router-dom";
import { AppContext } from "../AppContext";

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    stats,
    recentActivity,
    pendingApprovals,
    totalRequested,
    userAccount,
    setUserAccount,
  } = useContext(AppContext);

  const [showActions, setShowActions] = useState(null);
  const [modalCoords, setModalCoords] = useState(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function toggleMobileMenu() {
    setMobileMenuOpen(!mobileMenuOpen);
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  function handleLogout() {
    navigate("/");
  }

  function handleEditField(field) {
    setEditingField(field);
    setTempValue(userAccount[field]);
  }

  function handleSaveField(field) {
    if (field === "password" && tempValue.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }
    setUserAccount((prev) => ({ ...prev, [field]: tempValue }));
    setEditingField(null);
    setTempValue("");
  }

  function handleCancelEdit() {
    setEditingField(null);
    setTempValue("");
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
      left: rect.left,
    });
    setShowActions(index);
  };

  function closeActionModal() {
    setShowActions(null);
    setModalCoords(null);
  }

  return (
    <div className="dash-root">
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
        <h1 className="mobile-page-title">Dashboard</h1>
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
        <button className="logout" onClick={handleLogout}>
          Log Out
        </button>
      </aside>

      <main className="main">
        <header className="topbar">
          {showSettingsMenu && (
            <div className="settings-menu">
              <button
                className="settings-item"
                onClick={() => {
                  setShowAccountModal(true);
                  setShowSettingsMenu(false);
                }}
              >
                My Account
              </button>

              <button
                className="settings-item"
                onClick={() => {
                  setShowStatusModal(true);
                  setShowSettingsMenu(false);
                }}
              >
                Account Status
              </button>
            </div>
          )}
          <h1 className="page-title">Dashboard</h1>
          <div className="top-controls">
            <input
              className="search"
              placeholder="Search activities and approvals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              className="gear"
              aria-label="settings"
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            >
              <img
                src={settingsicon}
                alt="settings"
                style={{ width: "30px", height: "30px" }}
              />
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
                {recentActivity
                  .filter((r) => {
                    if (!searchQuery) return true;
                    const message = typeof r === "string" ? r : r.message || "";
                    return message
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase());
                  })
                  .map((r, i) => {
                    const message = typeof r === "string" ? r : r.message || "";
                    const dateStr =
                      r && r.date ? new Date(r.date).toLocaleString() : null;
                    return (
                      <li key={i}>
                        <div className="activity-message">{message}</div>
                        {dateStr && (
                          <div className="activity-date">{dateStr}</div>
                        )}
                      </li>
                    );
                  })}
              </ul>
            )}
          </div>

          <div className="pending-card">
            <div className="card-title">Pending Approvals</div>
            {pendingApprovals.filter((a) => a.status === "Pending").length ===
            0 ? (
              <p className="empty-text">No pending disbursements.</p>
            ) : (
              <ul className="approvals-list">
                {pendingApprovals
                  .filter((a) => {
                    if (a.status !== "Pending") return false;
                    if (!searchQuery) return true;
                    const searchLower = searchQuery.toLowerCase();
                    return (
                      a.name?.toLowerCase().includes(searchLower) ||
                      a.amount?.toString().includes(searchLower)
                    );
                  })
                  .map((a, i) => {
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
              style={{
                top: modalCoords.top + "px",
                left: modalCoords.left + "px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="action-modal-row">
                <button
                  className="check-status"
                  onClick={() => {
                    navigate("/summary");
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
        {showAccountModal && (
          <div
            className="modal-backdrop"
            onClick={() => setShowAccountModal(false)}
          >
            <div className="account-modal" onClick={(e) => e.stopPropagation()}>
              <h2>My Account</h2>

              <div className="field-row">
                <label>Username:</label>
                {editingField === "username" ? (
                  <div className="edit-row">
                    <input
                      type="text"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      className="edit-input"
                      autoFocus
                    />
                    <button
                      className="save-btn"
                      onClick={() => handleSaveField("username")}
                    >
                      Save
                    </button>
                    <button className="cancel-btn" onClick={handleCancelEdit}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="info-row">
                    <span>{userAccount.username}</span>
                    <button
                      className="change-btn"
                      onClick={() => handleEditField("username")}
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              <div className="field-row">
                <label>Email:</label>
                {editingField === "email" ? (
                  <div className="edit-row">
                    <input
                      type="email"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      className="edit-input"
                      autoFocus
                    />
                    <button
                      className="save-btn"
                      onClick={() => handleSaveField("email")}
                    >
                      Save
                    </button>
                    <button className="cancel-btn" onClick={handleCancelEdit}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="info-row">
                    <span>{userAccount.email}</span>
                    <button
                      className="change-btn"
                      onClick={() => handleEditField("email")}
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              <div className="field-row">
                <label>Contact Number:</label>
                {editingField === "contactNumber" ? (
                  <div className="edit-row">
                    <input
                      type="tel"
                      value={tempValue}
                      onChange={(e) =>
                        setTempValue(e.target.value.replace(/[^0-9]/g, ""))
                      }
                      className="edit-input"
                      autoFocus
                      maxLength="11"
                    />
                    <button
                      className="save-btn"
                      onClick={() => handleSaveField("contactNumber")}
                    >
                      Save
                    </button>
                    <button className="cancel-btn" onClick={handleCancelEdit}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="info-row">
                    <span>{userAccount.contactNumber}</span>
                    <button
                      className="change-btn"
                      onClick={() => handleEditField("contactNumber")}
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              <div className="field-row">
                <label>Password:</label>
                {editingField === "password" ? (
                  <div className="edit-row">
                    <input
                      type="password"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      className="edit-input"
                      autoFocus
                      placeholder="Enter new password (min 6 chars)"
                    />
                    <button
                      className="save-btn"
                      onClick={() => handleSaveField("password")}
                    >
                      Save
                    </button>
                    <button className="cancel-btn" onClick={handleCancelEdit}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="info-row">
                    <span>*********</span>
                    <button
                      className="change-btn"
                      onClick={() => handleEditField("password")}
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              <button
                className="close-modal"
                onClick={() => {
                  setShowAccountModal(false);
                  setEditingField(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
        {showStatusModal && (
          <div
            className="modal-backdrop"
            onClick={() => setShowStatusModal(false)}
          >
            <div className="status-modal" onClick={(e) => e.stopPropagation()}>
              <h2>Account Status</h2>

              <div className="status-row">
                <span>Total Requested Disbursements: </span>
                <span>{totalRequested}</span>
              </div>

              <div className="status-row">
                <span>Login History: </span>
                <span>0</span>
              </div>

              <button
                className="close-modal"
                onClick={() => setShowStatusModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
