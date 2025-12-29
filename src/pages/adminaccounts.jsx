import React, { useContext, useState, useEffect } from "react";
import "./dashboard.css";
import logo from "../logo.png";
import { NavLink, useNavigate } from "react-router-dom";
import { AppContext } from "../AppContext";
import settingsicon from "./settingsicon.png";

export default function AdminAccounts() {
  const navigate = useNavigate();

  const {
    isAdminUser,
    logoutUser,
    getAllUsers,
    deleteAuthUser,
    grantAdminAccess,
    revokeAdminAccess,
    currentUser,
  } = useContext(AppContext);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);

  // Check if user is admin and load users
  useEffect(() => {
    if (!currentUser) {
      // User not loaded yet, wait
      return;
    }
    if (!isAdminUser()) {
      alert("Access denied. Admin only.");
      navigate("/dashboard");
      return;
    }
    loadUsers();
  }, [currentUser, navigate, isAdminUser]);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      const allUsers = await getAllUsers();
      if (allUsers && allUsers.length > 0) {
        setUsers(allUsers);
      } else {
        setUsers([]);
        setError(
          "No users found or users_list table not created yet. Please run the SQL migration in Supabase."
        );
      }
    } catch (error) {
      console.error("Error loading users:", error);
      setError("Failed to load users: " + (error.message || error));
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteUser(userId, email) {
    if (!window.confirm(`Are you sure you want to delete user ${email}?`)) {
      return;
    }
    try {
      await deleteAuthUser(userId);
      setUsers(users.filter((u) => u.id !== userId));
      alert("User deleted successfully");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user: " + (error.message || error));
    }
  }

  async function handleGrantAdmin(userId, email) {
    if (!window.confirm(`Grant admin access to ${email}?`)) {
      return;
    }
    try {
      await grantAdminAccess(email);
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, is_admin: true } : u))
      );
      alert("Admin access granted");
    } catch (error) {
      console.error("Error granting admin access:", error);
      alert("Failed to grant admin access: " + (error.message || error));
    }
  }

  async function handleRevokeAdmin(userId, email) {
    if (!window.confirm(`Revoke admin access from ${email}?`)) {
      return;
    }
    try {
      await revokeAdminAccess(email);
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, is_admin: false } : u))
      );
      alert("Admin access revoked");
    } catch (error) {
      console.error("Error revoking admin access:", error);
      alert("Failed to revoke admin access: " + (error.message || error));
    }
  }

  const handleMyAccount = () => {
    setShowSettingsMenu(false);
    navigate("/my-account");
  };

  async function handleLogout() {
    await logoutUser();
    navigate("/");
  }

  const filteredUsers = users.filter(
    (user) =>
      user.email !== "admin@gmail.com" &&
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dash-root">
      <aside className="sidebar">
        <div className="logo-wrap">
          <img src={logo} alt="logo" className="logo" />
          {isAdminUser() && (
            <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
              <i style={{ fontSize: "0.9rem", color: "#666" }}>admin</i>
            </div>
          )}
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
          {isAdminUser() && (
            <NavLink to="/admin-accounts" className="nav-item">
              Admin Accounts
            </NavLink>
          )}
        </nav>
        <button className="logout" onClick={handleLogout}>
          Log Out
        </button>
      </aside>

      <main className="main">
        <header className="topbar">
          {showSettingsMenu && (
            <div className="settings-menu">
              <button className="settings-item" onClick={handleMyAccount}>
                My Account
              </button>
              <button
                className="settings-item logout-item"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
          <h1 className="page-title">Admin Accounts Management</h1>
          <div className="top-controls">
            <input
              className="search"
              placeholder="Search by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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

        <div
          className="card"
          style={{
            padding: "24px",
            maxWidth: "1000px",
            margin: "0 auto",
            width: "100%",
          }}
        >
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ marginBottom: "16px", fontSize: "24px" }}>⏳</div>
              <p style={{ fontSize: "1rem", color: "#666", margin: "0" }}>
                Loading users...
              </p>
            </div>
          ) : error ? (
            <div
              style={{
                padding: "20px",
                backgroundColor: "#ffebee",
                borderRadius: "8px",
                border: "2px solid #ef5350",
                borderLeft: "5px solid #c62828",
              }}
            >
              <p
                style={{
                  color: "#c62828",
                  fontSize: "1.05rem",
                  margin: "0 0 16px 0",
                  fontWeight: "600",
                }}
              >
                ⚠️ {error}
              </p>
              <p
                style={{
                  fontSize: "0.95rem",
                  margin: "0 0 12px 0",
                  color: "#666",
                  fontWeight: "500",
                }}
              >
                To fix this, please:
              </p>
              <ul
                style={{
                  fontSize: "0.9rem",
                  margin: "8px 0 0 0",
                  paddingLeft: "24px",
                  color: "#666",
                }}
              >
                <li style={{ marginBottom: "6px" }}>
                  Open Supabase and run ADMIN_SQL_SETUP.sql in the SQL editor
                </li>
                <li style={{ marginBottom: "6px" }}>
                  Ensure the users_list table is created
                </li>
                <li>
                  Register users by triggering the auto-trigger or manually
                  inserting
                </li>
              </ul>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ marginBottom: "16px", fontSize: "24px" }}>👥</div>
              <p style={{ fontSize: "1rem", color: "#999", margin: "0" }}>
                No users found{searchTerm && ` matching "${searchTerm}"`}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  marginTop: "0",
                  fontSize: "0.95rem",
                }}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor: "#f8f9fa",
                      borderBottom: "2px solid #dee2e6",
                      fontWeight: "600",
                      color: "#333",
                    }}
                  >
                    <th style={{ textAlign: "left", padding: "16px" }}>
                      Email Address
                    </th>
                    <th style={{ textAlign: "center", padding: "16px" }}>
                      Status
                    </th>
                    <th style={{ textAlign: "center", padding: "16px" }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, idx) => {
                    const isCurrentUser = user.email === currentUser?.email;
                    return (
                      <tr
                        key={user.id}
                        style={{
                          borderBottom: "1px solid #dee2e6",
                          backgroundColor: isCurrentUser
                            ? "#e8f5e9"
                            : idx % 2 === 0
                            ? "#ffffff"
                            : "#f8f9fa",
                          transition: "background-color 0.2s ease",
                          fontWeight: isCurrentUser ? "600" : "400",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isCurrentUser
                            ? "#c8e6c9"
                            : "#f0f4f8";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isCurrentUser
                            ? "#e8f5e9"
                            : idx % 2 === 0
                            ? "#ffffff"
                            : "#f8f9fa";
                        }}
                      >
                        <td
                          style={{
                            padding: "16px",
                            color: "#333",
                            fontWeight: "500",
                          }}
                        >
                          {user.email}
                          {isCurrentUser && (
                            <span
                              style={{
                                marginLeft: "12px",
                                backgroundColor: "#2196F3",
                                color: "white",
                                padding: "3px 10px",
                                borderRadius: "12px",
                                fontSize: "0.75rem",
                                fontWeight: "700",
                                letterSpacing: "0.5px",
                              }}
                            >
                              YOU
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "16px", textAlign: "center" }}>
                          <span
                            style={{
                              backgroundColor: user.is_admin
                                ? "#d4edda"
                                : "#e2e3e5",
                              color: user.is_admin ? "#155724" : "#383d41",
                              padding: "6px 14px",
                              borderRadius: "20px",
                              fontSize: "0.85rem",
                              fontWeight: "600",
                              display: "inline-block",
                              border: user.is_admin
                                ? "1px solid #c3e6cb"
                                : "1px solid #d6d8db",
                            }}
                          >
                            {user.is_admin ? "🔑 Admin" : "👤 User"}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "16px",
                            textAlign: "center",
                            display: "flex",
                            gap: "10px",
                            justifyContent: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          {user.is_admin ? (
                            <button
                              onClick={() =>
                                handleRevokeAdmin(user.id, user.email)
                              }
                              style={{
                                padding: "8px 16px",
                                backgroundColor: "#FF9800",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "0.85rem",
                                fontWeight: "600",
                                transition:
                                  "all 0.2s ease, box-shadow 0.2s ease",
                                boxShadow: "0 2px 4px rgba(255, 152, 0, 0.2)",
                              }}
                              onMouseOver={(e) => {
                                e.target.style.backgroundColor = "#F57C00";
                                e.target.style.boxShadow =
                                  "0 6px 12px rgba(255, 152, 0, 0.3)";
                                e.target.style.transform = "translateY(-2px)";
                              }}
                              onMouseOut={(e) => {
                                e.target.style.backgroundColor = "#FF9800";
                                e.target.style.boxShadow =
                                  "0 2px 4px rgba(255, 152, 0, 0.2)";
                                e.target.style.transform = "translateY(0)";
                              }}
                            >
                              Revoke Admin
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                handleGrantAdmin(user.id, user.email)
                              }
                              style={{
                                padding: "8px 16px",
                                backgroundColor: "#4CAF50",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "0.85rem",
                                fontWeight: "600",
                                transition:
                                  "all 0.2s ease, box-shadow 0.2s ease",
                                boxShadow: "0 2px 4px rgba(76, 175, 80, 0.2)",
                              }}
                              onMouseOver={(e) => {
                                e.target.style.backgroundColor = "#45a049";
                                e.target.style.boxShadow =
                                  "0 6px 12px rgba(76, 175, 80, 0.3)";
                                e.target.style.transform = "translateY(-2px)";
                              }}
                              onMouseOut={(e) => {
                                e.target.style.backgroundColor = "#4CAF50";
                                e.target.style.boxShadow =
                                  "0 2px 4px rgba(76, 175, 80, 0.2)";
                                e.target.style.transform = "translateY(0)";
                              }}
                            >
                              Grant Admin
                            </button>
                          )}
                          <button
                            onClick={() =>
                              handleDeleteUser(user.id, user.email)
                            }
                            style={{
                              padding: "8px 16px",
                              backgroundColor: "#F44336",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "0.85rem",
                              fontWeight: "600",
                              transition: "all 0.2s ease, box-shadow 0.2s ease",
                              boxShadow: "0 2px 4px rgba(244, 67, 54, 0.2)",
                            }}
                            onMouseOver={(e) => {
                              e.target.style.backgroundColor = "#DA190B";
                              e.target.style.boxShadow =
                                "0 6px 12px rgba(244, 67, 54, 0.3)";
                              e.target.style.transform = "translateY(-2px)";
                            }}
                            onMouseOut={(e) => {
                              e.target.style.backgroundColor = "#F44336";
                              e.target.style.boxShadow =
                                "0 2px 4px rgba(244, 67, 54, 0.2)";
                              e.target.style.transform = "translateY(0)";
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
