import React, { useContext, useState, useEffect, useRef } from "react";
import "./dashboard.css";
import "./summary.css";
import logo from "../assets/logo.png";
import { NavLink, useNavigate } from "react-router-dom";
import { AppContext } from "../AppContext";
import settingsicon from "../assets/settingsicon.png";

export default function Summary() {
  const navigate = useNavigate();

  const {
    pendingApprovals,
    markDisbursementFailed,
    deletePendingApproval,
    approveDisbursement,
    totalRequested,
    accounts,
    payees,
    userAccount,
    setUserAccount,
    currentUser,
  } = useContext(AppContext);

  const [selectedIndex, setSelectedIndex] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [payeeFilter, setPayeeFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState({ start: null, end: null });
  const [startMonth, setStartMonth] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [endYear, setEndYear] = useState("");
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPayeeDropdown, setShowPayeeDropdown] = useState(false);
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

  const selectedDisbursement =
    selectedIndex !== null ? pendingApprovals[selectedIndex] : null;
  const selectedAccount =
    selectedDisbursement && accounts
      ? accounts.find(
          (acc) => acc.accountNo === selectedDisbursement.accountNumber
        )
      : null;

  function handleLogout() {
    navigate("/");
  }

  const reports = pendingApprovals.map((item, idx) => {
    const raw = item.date || item.createdAt || item.submittedAt || null;
    const date = raw
      ? new Date(raw).toLocaleDateString()
      : new Date().toLocaleDateString();
    return {
      date,
      recipient: item.name,
      amount: `₱${item.amount}`,
      account: item.accountNumber,
      method: item.method,
      status: item.status || "Pending",
      reference: item.reference || "N/A",
      originalIndex: idx,
    };
  });

  // Get unique payees from payees context
  const availablePayees = React.useMemo(() => {
    return payees
      .map((p) => p.name)
      .filter(Boolean)
      .sort();
  }, [payees]);

  // Generate list of months for selection (2 years back, 1 year forward)
  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const years = React.useMemo(() => {
    const today = new Date();
    const yearsList = [];
    for (let i = today.getFullYear() + 1; i >= today.getFullYear() - 2; i--) {
      yearsList.push(i);
    }
    return yearsList;
  }, []);

  // Status options
  const statusOptions = ["All", "Pending", "Approved", "Failed"];

  const filteredReports = reports
    .filter((r) => statusFilter === "All" || r.status === statusFilter)
    .filter((r) => payeeFilter === "All" || r.recipient === payeeFilter)
    .filter((r) => {
      if (!dateFilter.start || !dateFilter.end) return true;
      const reportDate = new Date(r.date);
      const reportYearMonth = `${reportDate.getFullYear()}-${String(
        reportDate.getMonth() + 1
      ).padStart(2, "0")}`;
      return (
        reportYearMonth >= dateFilter.start && reportYearMonth <= dateFilter.end
      );
    })
    .filter((r) => {
      if (!searchQuery) return true;
      const searchLower = searchQuery.toLowerCase();
      return (
        r.recipient?.toLowerCase().includes(searchLower) ||
        r.amount?.toLowerCase().includes(searchLower) ||
        r.account?.toLowerCase().includes(searchLower) ||
        r.method?.toLowerCase().includes(searchLower) ||
        r.status?.toLowerCase().includes(searchLower)
      );
    });

  // Pagination for summary table
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const tableRef = useRef(null);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentReports = filteredReports.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredReports.length / itemsPerPage)
  );

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      if (tableRef.current) tableRef.current.scrollTop = 0;
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      if (tableRef.current) tableRef.current.scrollTop = 0;
    }
  };

  // Reset page when filters or data change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, payeeFilter, dateFilter, pendingApprovals]);

  // Clamp currentPage if totalPages decreased
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".filter-dropdown-wrapper")) {
        setShowDateDropdown(false);
        setShowStatusDropdown(false);
        setShowPayeeDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function openModal(index) {
    setSelectedIndex(index);
  }

  function closeModal() {
    setSelectedIndex(null);
  }

  function handleApprove() {
    if (selectedIndex === null) return;
    approveDisbursement(selectedIndex);
    closeModal();
  }

  function handleCancel() {
    if (selectedIndex === null) return;
    markDisbursementFailed(selectedIndex);
  }

  function handleDelete() {
    if (selectedIndex === null) return;
    deletePendingApproval(selectedIndex);
    closeModal();
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
        <h1 className="mobile-page-title">Summary</h1>
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
          <h1 className="page-title">Summary</h1>
          <div className="top-controls">
            <input
              className="search"
              placeholder="Search reports..."
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

        <section className="filter-bar">
          <span>Filter By:</span>

          <div className="filter-dropdown-wrapper">
            <button
              className="filter-btn"
              onClick={() => {
                setShowDateDropdown(!showDateDropdown);
                setShowStatusDropdown(false);
                setShowPayeeDropdown(false);
              }}
            >
              Date Range{" "}
              {dateFilter.start && dateFilter.end
                ? `(${new Date(dateFilter.start + "-01").toLocaleDateString(
                    "en-US",
                    { year: "numeric", month: "short" }
                  )} - ${new Date(dateFilter.end + "-01").toLocaleDateString(
                    "en-US",
                    { year: "numeric", month: "short" }
                  )})`
                : ""}{" "}
              ▼
            </button>
            {showDateDropdown && (
              <div className="dropdown-menu date-picker-menu">
                <div className="date-picker-container">
                  <div className="date-picker-field">
                    <label>Start Range:</label>
                    <div className="month-year-selects">
                      <select
                        className="month-select"
                        value={startMonth}
                        onChange={(e) => setStartMonth(e.target.value)}
                      >
                        <option value="">Month</option>
                        {months.map((month) => (
                          <option key={month.value} value={month.value}>
                            {month.label}
                          </option>
                        ))}
                      </select>
                      <select
                        className="year-select"
                        value={startYear}
                        onChange={(e) => setStartYear(e.target.value)}
                      >
                        <option value="">Year</option>
                        {years.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="date-picker-field">
                    <label>End Range:</label>
                    <div className="month-year-selects">
                      <select
                        className="month-select"
                        value={endMonth}
                        onChange={(e) => setEndMonth(e.target.value)}
                      >
                        <option value="">Month</option>
                        {months.map((month) => (
                          <option key={month.value} value={month.value}>
                            {month.label}
                          </option>
                        ))}
                      </select>
                      <select
                        className="year-select"
                        value={endYear}
                        onChange={(e) => setEndYear(e.target.value)}
                      >
                        <option value="">Year</option>
                        {years.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="date-picker-actions">
                  <button
                    className="apply-date-btn"
                    onClick={() => {
                      if (startMonth && startYear && endMonth && endYear) {
                        setDateFilter({
                          start: `${startYear}-${startMonth}`,
                          end: `${endYear}-${endMonth}`,
                        });
                      }
                      setShowDateDropdown(false);
                    }}
                  >
                    Apply
                  </button>
                  <button
                    className="clear-date-btn"
                    onClick={() => {
                      setDateFilter({ start: null, end: null });
                      setStartMonth("");
                      setStartYear("");
                      setEndMonth("");
                      setEndYear("");
                      setShowDateDropdown(false);
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="filter-dropdown-wrapper">
            <button
              className="filter-btn"
              onClick={() => {
                setShowStatusDropdown(!showStatusDropdown);
                setShowDateDropdown(false);
                setShowPayeeDropdown(false);
              }}
            >
              Status {statusFilter !== "All" ? `(${statusFilter})` : ""} ▼
            </button>
            {showStatusDropdown && (
              <div className="dropdown-menu">
                {statusOptions.map((status) => (
                  <div
                    key={status}
                    className="dropdown-item"
                    onClick={() => {
                      setStatusFilter(status);
                      setShowStatusDropdown(false);
                    }}
                  >
                    {status}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="filter-dropdown-wrapper">
            <button
              className="filter-btn"
              onClick={() => {
                setShowPayeeDropdown(!showPayeeDropdown);
                setShowDateDropdown(false);
                setShowStatusDropdown(false);
              }}
            >
              Payees {payeeFilter !== "All" ? `(${payeeFilter})` : ""} ▼
            </button>
            {showPayeeDropdown && (
              <div className="dropdown-menu">
                <div
                  className="dropdown-item"
                  onClick={() => {
                    setPayeeFilter("All");
                    setShowPayeeDropdown(false);
                  }}
                >
                  All Payees
                </div>
                {availablePayees.map((payee) => (
                  <div
                    key={payee}
                    className="dropdown-item"
                    onClick={() => {
                      setPayeeFilter(payee);
                      setShowPayeeDropdown(false);
                    }}
                  >
                    {payee}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="report-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Reference</th>
                <th>Payee</th>
                <th>Amount</th>
                <th>Account</th>
                <th>Method</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody ref={tableRef}>
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan="8" className="no-data">
                    No reports available. Submit a disbursement first.
                  </td>
                </tr>
              ) : currentReports.length === 0 ? (
                <tr>
                  <td colSpan="8" className="no-data">
                    No reports for this page.
                  </td>
                </tr>
              ) : (
                currentReports.map((r, i) => (
                  <tr key={r.originalIndex}>
                    <td>{r.date}</td>
                    <td
                      style={{
                        fontFamily: "monospace",
                        fontSize: "13px",
                        color: "#667eea",
                      }}
                    >
                      {r.reference}
                    </td>
                    <td>{r.recipient}</td>
                    <td>{r.amount}</td>
                    <td>{r.account}</td>
                    <td>{r.method}</td>
                    <td className={r.status.toLowerCase()}>{r.status}</td>
                    <td>
                      <button
                        className="view-btn"
                        onClick={() => openModal(r.originalIndex)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

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

        {selectedDisbursement && (
          <div className="modal-overlay">
            <div className="modal">
              <h2>Disbursement Details</h2>

              <p>
                <strong>Recipient:</strong> {selectedDisbursement.name}
              </p>
              <p>
                <strong>Amount:</strong> ₱{selectedDisbursement.amount}
              </p>
              <p>
                <strong>Method:</strong> {selectedDisbursement.method}
              </p>
              {selectedAccount && (
                <>
                  <p>
                    <strong>Account Code:</strong> {selectedAccount.accountNo}
                  </p>
                  <p>
                    <strong>Account Name:</strong> {selectedAccount.accountName}
                  </p>
                </>
              )}
              <p>
                <strong>Status:</strong>{" "}
                {selectedDisbursement.status || "Pending"}
              </p>

              <p>
                <strong>Reference:</strong> {selectedDisbursement.reference}
              </p>

              {(() => {
                const desc =
                  pendingApprovals[selectedIndex].description ||
                  pendingApprovals[selectedIndex].reason ||
                  "";
                if (!desc) return null;
                return (
                  <div className="modal-description-wrap">
                    <div className="modal-description-label">
                      Reason / Description:
                    </div>
                    <div className="modal-description">{desc}</div>
                  </div>
                );
              })()}

              <div className="modal-actions">
                {pendingApprovals[selectedIndex].status === "Pending" &&
                  currentUser?.role === "admin" && (
                    <>
                      <button
                        className="approve-transaction"
                        onClick={handleApprove}
                      >
                        Approve Transaction
                      </button>
                      <button
                        className="cancel-transaction"
                        onClick={handleCancel}
                      >
                        Cancel Transaction
                      </button>
                    </>
                  )}

                {pendingApprovals[selectedIndex].status === "Failed" && (
                  <button className="delete-transaction" onClick={handleDelete}>
                    Delete
                  </button>
                )}

                <button onClick={closeModal}>Close</button>
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
      </main>
    </div>
  );
}
