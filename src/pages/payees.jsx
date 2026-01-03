import React, { useContext, useState, useRef } from "react";
import "./dashboard.css";
import "./payees.css";
import logo from "../assets/logo.png";
import { NavLink, useNavigate } from "react-router-dom";
import { AppContext } from "../AppContext";
import settingsicon from "../assets/settingsicon.png";
import { supabase } from "../lib/supabase";

export default function Payees() {
  const navigate = useNavigate();
  const {
    payees,
    setPayees,
    totalRequested,
    updatePayeeDetails,
    loadAllData,
    pendingApprovals,
    userAccount,
    setUserAccount,
  } = useContext(AppContext);
  const [selectedPayee, setSelectedPayee] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDisbursementsModal, setShowDisbursementsModal] = useState(false);
  const [selectedPayeeDisbursements, setSelectedPayeeDisbursements] = useState(
    []
  );
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function toggleMobileMenu() {
    setMobileMenuOpen(!mobileMenuOpen);
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  // Check if current user is admin
  const isAdmin = userAccount?.role === "admin";

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
  const [editForm, setEditForm] = useState({
    name: "",
    contactNumber: "",
    tin: "",
    address: "",
    contactPerson: "",
    account: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const tableRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Add Payee modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    contactNumber: "",
    tin: "",
    address: "",
    contactPerson: "",
    account: "",
  });

  // Pagination logic with search
  const filteredPayees = payees.filter((p) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(searchLower) ||
      p.contact?.toLowerCase().includes(searchLower) ||
      p.tin?.toLowerCase().includes(searchLower) ||
      p.address?.toLowerCase().includes(searchLower) ||
      p.contact_person?.toLowerCase().includes(searchLower)
    );
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPayees = filteredPayees.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPayees.length / itemsPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      if (tableRef.current) {
        tableRef.current.scrollTop = 0;
      }
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      if (tableRef.current) {
        tableRef.current.scrollTop = 0;
      }
    }
  };

  function openModal(payee, index) {
    setSelectedPayee(payee);
    setSelectedIndex(index);
    setEditForm({
      name: payee.name,
      contactNumber: payee.contact || "",
      tin: payee.tin || "",
      address: payee.address || "",
      contactPerson: payee.contact_person || "",
      account: payee.account || "",
    });
  }

  function closeModal() {
    setSelectedPayee(null);
    setSelectedIndex(null);
  }

  function viewDisbursements(payeeName) {
    const disbursements = pendingApprovals.filter(
      (d) => d.name?.toLowerCase() === payeeName?.toLowerCase()
    );
    setSelectedPayeeDisbursements(disbursements);
    setShowDisbursementsModal(true);
  }

  function closeDisbursementsModal() {
    setShowDisbursementsModal(false);
    setSelectedPayeeDisbursements([]);
  }

  function handleEditChange(e) {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSave() {
    const idx =
      selectedIndex ?? payees.findIndex((p) => p.name === selectedPayee?.name);
    if (idx == null || idx === -1) {
      alert("Could not find payee to update.");
      return;
    }

    try {
      await updatePayeeDetails(idx, {
        name: editForm.name,
        contact: editForm.contactNumber,
        tin: editForm.tin,
        address: editForm.address,
        contactPerson: editForm.contactPerson,
        account: editForm.account,
      });
      alert("Payee information updated.");
      closeModal();
    } catch (error) {
      console.error("Error updating payee:", error);
      alert("Failed to update payee: " + error.message);
    }
  }

  async function handleDelete(payeeName) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this payee?"
    );
    if (!confirmed) return;

    try {
      const payee = payees.find((p) => p.name === payeeName);
      if (!payee) {
        alert("Payee not found.");
        return;
      }

      const { error } = await supabase
        .from("payees")
        .delete()
        .eq("id", payee.id);

      if (error) {
        console.error("Error deleting payee:", error);
        if (error.code === "42P01") {
          alert(
            "Database table 'payees' does not exist. Please check your database."
          );
        } else {
          throw error;
        }
        return;
      }

      // Reload all data from AppContext to ensure sync
      if (loadAllData) {
        await loadAllData();
      } else {
        // Fallback: update local state
        setPayees((prev) => prev.filter((p) => p.id !== payee.id));
      }

      setSelectedPayee(null);
      alert("Payee deleted.");
    } catch (error) {
      console.error("Error deleting payee:", error);
      alert("Failed to delete payee: " + error.message);
    }
  }

  function openAddModal() {
    setAddForm({
      name: "",
      contactNumber: "",
      tin: "",
      address: "",
      contactPerson: "",
      account: "",
    });
    setShowAddModal(true);
  }

  function closeAddModal() {
    setShowAddModal(false);
  }

  function handleAddChange(e) {
    const { name, value } = e.target;
    setAddForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleAddSave() {
    if (!addForm.name.trim()) {
      alert("Name is required.");
      return;
    }

    try {
      // Check if payee already exists (using payees table structure)
      const { data: existingPayee, error: checkError } = await supabase
        .from("payees")
        .select("*")
        .eq("name", addForm.name.trim())
        .maybeSingle();

      if (checkError && checkError.code !== "PGRST116") {
        console.error("Error checking for existing payee:", checkError);
        if (checkError.code === "42P01") {
          alert(
            "Database table 'payees' does not exist. Please check your database."
          );
          return;
        }
      }

      if (existingPayee) {
        alert("A payee with this name already exists.");
        return;
      }

      // Insert into payees table (old structure)
      const { data: newPayee, error } = await supabase
        .from("payees")
        .insert({
          name: addForm.name.trim(),
          contact: addForm.contactNumber || null,
          tin: addForm.tin || null,
          address: addForm.address || null,
          contact_person: addForm.contactPerson || null,
          account: addForm.account || null,
        })
        .select()
        .single();

      if (error) {
        console.error("Supabase error:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));

        if (error.code === "23505") {
          alert("A payee with this name already exists.");
        } else if (error.code === "42P01") {
          alert(
            "Database table 'payees' does not exist. Please check your database."
          );
        } else if (
          error.message?.includes("permission denied") ||
          error.message?.includes("RLS")
        ) {
          alert(
            "Permission denied. Please check Row Level Security policies in Supabase."
          );
        } else {
          alert(
            "Failed to add payee: " +
              (error.message || error.code || "Unknown error") +
              "\n\nCheck browser console for details."
          );
        }
        return;
      }

      if (!newPayee) {
        alert("Failed to add payee: No data returned");
        return;
      }

      // Reload all data from AppContext to ensure sync
      if (loadAllData) {
        await loadAllData();
      }

      // Also update local state immediately for better UX
      const mappedPayee = {
        ...newPayee,
        id: newPayee.id,
        name: newPayee.name,
        contact: newPayee.contact || "",
        tin: newPayee.tin || "",
        address: newPayee.address || "",
        contactPerson: newPayee.contact_person || "",
        account: newPayee.account || "",
      };
      setPayees((prev) => {
        // Check if already exists to avoid duplicates
        const exists = prev.find((p) => p.id === mappedPayee.id);
        if (exists) return prev;
        return [...prev, mappedPayee];
      });

      setShowAddModal(false);
      setAddForm({
        name: "",
        contactNumber: "",
        tin: "",
        address: "",
        contactPerson: "",
        account: "",
      });
      alert("Payee added successfully.");
    } catch (error) {
      console.error("Error adding payee:", error);
      alert("Failed to add payee: " + (error.message || "Unknown error"));
    }
  }

  function handleLogout() {
    navigate("/");
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
        <h1 className="mobile-page-title">Payees</h1>
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
          <h1 className="page-title">Payees</h1>
          <div className="top-controls">
            <input
              className="search"
              placeholder="Search payees..."
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

        <div className="add-payee-container">
          <button className="add-payee-btn" onClick={openAddModal}>
            Add Payee
          </button>
        </div>

        <div className="table-pagination-wrapper">
          <div className="content-table" ref={tableRef}>
            <table className="payees-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact Number</th>
                  <th>TIN Number</th>
                  <th>Address</th>
                  <th>Contact Person</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentPayees.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-text">
                      No payees yet. Click add payee to add one.
                    </td>
                  </tr>
                ) : (
                  currentPayees.map((p, i) => (
                    <tr key={i}>
                      <td>{p.name}</td>
                      <td>{p.contact || ""}</td>
                      <td>{p.tin || ""}</td>
                      <td>{p.address || ""}</td>
                      <td>{p.contact_person || ""}</td>
                      <td className="action-buttons">
                        <button onClick={() => openModal(p, i)}>View</button>
                        <button
                          onClick={() => viewDisbursements(p.name)}
                          style={{ marginLeft: "5px", background: "#667eea" }}
                        >
                          Disbursements
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination-controls">
            <button onClick={prevPage} disabled={currentPage === 1}>
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button onClick={nextPage} disabled={currentPage === totalPages}>
              Next
            </button>
          </div>
        </div>

        {selectedPayee && (
          <div className="modal-overlay">
            <div className="modal">
              <h2>Edit Payee Information</h2>
              <div className="form-row">
                <label>Name:</label>
                <input
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                />
              </div>
              <div className="form-row">
                <label>Contact Number:</label>
                <input
                  name="contactNumber"
                  value={editForm.contactNumber}
                  onChange={handleEditChange}
                />
              </div>
              <div className="form-row">
                <label>TIN Number:</label>
                <input
                  name="tin"
                  value={editForm.tin}
                  onChange={handleEditChange}
                />
              </div>
              <div className="form-row">
                <label>Address:</label>
                <input
                  name="address"
                  value={editForm.address}
                  onChange={handleEditChange}
                />
              </div>
              <div className="form-row">
                <label>Contact Person:</label>
                <input
                  name="contactPerson"
                  value={editForm.contactPerson}
                  onChange={handleEditChange}
                />
              </div>
              <div className="form-row">
                <label>Account Details:</label>
                <input
                  name="account"
                  value={editForm.account}
                  onChange={handleEditChange}
                />
              </div>
              <div className="modal-actions">
                <button onClick={handleSave}>Save</button>
                {isAdmin && (
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(selectedPayee.name)}
                  >
                    Delete Payee
                  </button>
                )}
                <button onClick={closeModal}>Close</button>
              </div>
            </div>
          </div>
        )}

        {showAddModal && (
          <div className="modal-overlay">
            <div className="modal" role="dialog" aria-modal="true">
              <h2>Add Payee</h2>
              <div className="form-row">
                <label>Name:</label>
                <input
                  name="name"
                  value={addForm.name}
                  onChange={handleAddChange}
                />
              </div>
              <div className="form-row">
                <label>Contact Number:</label>
                <input
                  name="contactNumber"
                  value={addForm.contactNumber}
                  onChange={handleAddChange}
                />
              </div>
              <div className="form-row">
                <label>TIN Number:</label>
                <input
                  name="tin"
                  value={addForm.tin}
                  onChange={handleAddChange}
                />
              </div>
              <div className="form-row">
                <label>Address:</label>
                <input
                  name="address"
                  value={addForm.address}
                  onChange={handleAddChange}
                />
              </div>
              <div className="form-row">
                <label>Contact Person:</label>
                <input
                  name="contactPerson"
                  value={addForm.contactPerson}
                  onChange={handleAddChange}
                />
              </div>
              <div className="modal-actions">
                <button onClick={handleAddSave}>Save</button>
                <button onClick={closeAddModal}>Cancel</button>
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
                      className="edit-input"
                      type="text"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
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
                      className="edit-input"
                      type="email"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
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
                      className="edit-input"
                      type="text"
                      maxLength="11"
                      value={tempValue}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        setTempValue(val);
                      }}
                      autoFocus
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
                      className="edit-input"
                      type="password"
                      placeholder="Enter new password (min 6 chars)"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      autoFocus
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
                  setTempValue("");
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

        {showDisbursementsModal && (
          <div className="modal-backdrop" onClick={closeDisbursementsModal}>
            <div
              className="account-modal"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: "800px" }}
            >
              <h2>Disbursements</h2>
              <p style={{ color: "#666", marginBottom: "20px" }}>
                {selectedPayeeDisbursements.length > 0
                  ? `Showing ${selectedPayeeDisbursements.length} disbursement(s)`
                  : "No disbursements found for this payee"}
              </p>

              {selectedPayeeDisbursements.length > 0 && (
                <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr
                        style={{
                          background: "#f5f5f5",
                          borderBottom: "2px solid #ddd",
                        }}
                      >
                        <th style={{ padding: "10px", textAlign: "left" }}>
                          Reference
                        </th>
                        <th style={{ padding: "10px", textAlign: "left" }}>
                          Amount
                        </th>
                        <th style={{ padding: "10px", textAlign: "left" }}>
                          Date
                        </th>
                        <th style={{ padding: "10px", textAlign: "left" }}>
                          Status
                        </th>
                        <th style={{ padding: "10px", textAlign: "left" }}>
                          Created By
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPayeeDisbursements.map((d, idx) => (
                        <tr
                          key={idx}
                          style={{ borderBottom: "1px solid #eee" }}
                        >
                          <td style={{ padding: "10px" }}>
                            {d.reference || "N/A"}
                          </td>
                          <td style={{ padding: "10px" }}>
                            ₱{Number(d.amount).toLocaleString()}
                          </td>
                          <td style={{ padding: "10px" }}>{d.date}</td>
                          <td style={{ padding: "10px" }}>
                            <span
                              style={{
                                padding: "4px 8px",
                                borderRadius: "4px",
                                background:
                                  d.status === "Approved"
                                    ? "#d4edda"
                                    : d.status === "Pending"
                                    ? "#fff3cd"
                                    : "#f8d7da",
                                color:
                                  d.status === "Approved"
                                    ? "#155724"
                                    : d.status === "Pending"
                                    ? "#856404"
                                    : "#721c24",
                                fontSize: "12px",
                              }}
                            >
                              {d.status}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "10px",
                              fontWeight: "600",
                              color: "#667eea",
                            }}
                          >
                            {d.created_by || "Unknown User"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <button
                className="close-modal"
                onClick={closeDisbursementsModal}
                style={{ marginTop: "20px" }}
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
