import React, { useState, useContext, useEffect } from "react";
import "./dashboard.css";
import "./disbursement.css";
import logo from "../assets/logo.png";
import { NavLink, useNavigate } from "react-router-dom";
import { AppContext } from "../AppContext";
import settingsicon from "../assets/settingsicon.png";

export default function Disbursement() {
  const {
    addDisbursement,
    payees,
    getPayeeCOA,
    updatePayeeCOA,
    accounts,
    defaultCOA,
    refCounter,
    totalRequested,
    userAccount,
    setUserAccount,
  } = useContext(AppContext);
  const navigate = useNavigate();

  const [manualAccountError, setManualAccountError] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [validationErrors, setValidationErrors] = useState({
    name: "",
    contact: "",
    amount: "",
    manualAccountNumber: "",
  });

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

  const [form, setForm] = useState({
    name: "",
    method: "",
    accountNumber: "",
    manualAccountNumber: "",
    contact: "",
    amount: "",
    date: "",
    reason: "",
  });

  const [copiedRef, setCopiedRef] = useState(false);

  const nextRefCounter = (typeof refCounter === "number" ? refCounter : 0) + 1;
  const datePart = new Date().toISOString().split("T")[0].replace(/-/g, "");
  const displayReference = `DISB-${datePart}-${String(nextRefCounter).padStart(
    5,
    "0"
  )}`;

  const selectedAccount = accounts.find(
    (acc) => acc.accountNo === form.accountNumber
  );

  // Effect to handle date based on payment method
  useEffect(() => {
    if (form.method === "Cash" || form.method === "Bank Transfer") {
      const d = new Date();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const today = `${yyyy}-${mm}-${dd}`;
      setForm((prev) => ({ ...prev, date: today }));
    }
  }, [form.method]);

  function handleChange(e) {
    const { name, value } = e.target;

    // Clear validation error for this field
    setValidationErrors((prev) => ({ ...prev, [name]: "" }));

    if (name === "name") {
      const query = value.trim();
      setForm((prev) => ({ ...prev, name: value }));

      // Validate: Name should be text/letters
      if (value && /^\d+$/.test(value)) {
        setValidationErrors((prev) => ({
          ...prev,
          name: "Please enter text/letters for the payee name (e.g., John Doe, ABC Company)",
        }));
      }

      if (!query) {
        setNameError(false);
        setSuggestions([]);
        return;
      }

      const lowerCaseQuery = query.toLowerCase();
      const filteredSuggestions = (payees || [])
        .map((p) => p.name || "")
        .filter((pName) => pName.toLowerCase().includes(lowerCaseQuery));
      setSuggestions(filteredSuggestions);

      const exact = filteredSuggestions.find(
        (n) => n.toLowerCase() === lowerCaseQuery
      );
      setNameError(!exact);
      return;
    }

    // Validate Contact: Phone or Email
    if (name === "contact") {
      setForm((prev) => ({ ...prev, [name]: value }));
      if (value) {
        const isPhone = /^[0-9+\-\s()]*$/.test(value);
        const isEmail =
          /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(value);
        if (!isPhone && !isEmail) {
          setValidationErrors((prev) => ({
            ...prev,
            contact:
              "Please enter a valid phone number (e.g., 09123456789) or email (e.g., name@email.com)",
          }));
        }
      }
      return;
    }

    // Validate Amount: Numbers only
    if (name === "amount") {
      if (value && (isNaN(value) || Number(value) <= 0)) {
        setValidationErrors((prev) => ({
          ...prev,
          amount:
            "Please enter a valid amount (numbers only, e.g., 1000, 1500.50)",
        }));
      }
      setForm((prev) => ({ ...prev, [name]: value }));
      return;
    }

    // Validate Manual Account Number: Numbers only
    if (name === "manualAccountNumber") {
      if (value && !/^\d+$/.test(value)) {
        setValidationErrors((prev) => ({
          ...prev,
          manualAccountNumber: "Please enter numbers only (e.g., 12345678)",
        }));
      }
      setForm((prev) => ({ ...prev, [name]: value }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSuggestionClick(suggestion) {
    setForm((prev) => ({ ...prev, name: suggestion }));
    setSuggestions([]);
    setNameError(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Check for any validation errors
    const hasErrors = Object.values(validationErrors).some(
      (error) => error !== ""
    );
    if (hasErrors) {
      alert("Please fix all validation errors before submitting.");
      return;
    }

    if (
      !form.name ||
      !form.amount ||
      !form.method ||
      !form.accountNumber ||
      !form.contact ||
      !form.date ||
      !form.reason ||
      !form.manualAccountNumber
    ) {
      alert("Please fill in all fields before submitting.");
      return;
    }

    const names = (payees || []).map((p) => p.name || "");
    const matched = names.find(
      (n) => n.toLowerCase() === form.name.toLowerCase()
    );
    if (!matched) {
      setNameError(true);
      alert("The payee name is not in the payee's list.");
      return;
    }

    const payeeName = form.name.trim();

    // const manualNum = Number(form.manualAccountNumber);
    // if (manualNum) {
    //   const payeeChart = await getPayeeCOA(payeeName);
    //   const baseCOA = payeeChart
    //     ? JSON.parse(JSON.stringify(payeeChart))
    //     : JSON.parse(JSON.stringify(defaultCOA));
    // // const manualNum = Number(form.manualAccountNumber);
    // // if (manualNum) {
    // //   const payeeChart = await getPayeeCOA(payeeName);
    // //   const baseCOA = payeeChart
    // //     ? JSON.parse(JSON.stringify(payeeChart))
    // //     : JSON.parse(JSON.stringify(defaultCOA));

    //   let manualAccount = null;
    //   Object.keys(baseCOA).forEach((sec) => {
    //     const found = baseCOA[sec].find((acc) => acc.number === manualNum);
    //     if (found) manualAccount = found;
    //   });
    // //   let manualAccount = null;
    // //   Object.keys(baseCOA).forEach((sec) => {
    // //     const found = baseCOA[sec].find((acc) => acc.number === manualNum);
    // //     if (found) manualAccount = found;
    // //   });

    //   if (!manualAccount) {
    //     alert("Invalid manual account number.");
    //     return;
    //   }
    // }
    //   if (!manualAccount) {
    //     alert("Invalid manual account number.");
    //     return;
    //   }
    // }

    await addDisbursement({
      ...form,
      created_by: userAccount.username,
    });

    alert("Disbursement submitted and pending approval.");

    setForm({
      name: "",
      method: "",
      accountNumber: "",
      contact: "",
      amount: "",
      manualAccountNumber: "",
      date: "",
      reason: "",
    });
    setNameError(false);
  }

  function handleClear() {
    setForm({
      name: "",
      method: "",
      contact: "",
      amount: "",
      date: "",
      reason: "",
    });
    setNameError(false);
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
        <h1 className="mobile-page-title">Disbursement</h1>
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

          <h1 className="page-title">Disbursement</h1>
          <div className="top-controls">
            <input
              className="search"
              placeholder="Search form fields..."
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

        <section className="disb-form">
          <form className="form-card" onSubmit={handleSubmit}>
            <div className="form-row">
              <label>Name Of Payee:</label>
              <div className="autocomplete-wrapper">
                <input
                  name="name"
                  type="text"
                  placeholder="Enter the name of the payee..."
                  value={form.name}
                  onChange={handleChange}
                  className={`full-width-input ${
                    nameError || validationErrors.name ? "input-error" : ""
                  }`}
                  autoComplete="off"
                />
                {suggestions.length > 0 && (
                  <ul className="suggestions-list">
                    {suggestions.map((suggestion, index) => (
                      <li
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="error-holder">
                {validationErrors.name && (
                  <span className="error-text">{validationErrors.name}</span>
                )}
                {nameError && !validationErrors.name && (
                  <span className="error-text">
                    Payee not found. Please add them in the Payees page.
                  </span>
                )}
              </div>
            </div>

            <div className="form-row inline">
              <label>Payment Method:</label>
              <select name="method" value={form.method} onChange={handleChange}>
                <option value="">Choose method</option>
                <option>Bank Transfer</option>
                <option>Online Payment</option>
                <option>Cash</option>
                <option>Check</option>
              </select>

              <label>Account Code:</label>
              <select
                name="accountNumber"
                value={form.accountNumber}
                onChange={handleChange}
              >
                <option value="">Choose account</option>
                {Object.entries(
                  (accounts || []).reduce((acc, account) => {
                    const { accountType } = account;
                    if (!acc[accountType]) acc[accountType] = [];
                    acc[accountType].push(account);
                    return acc;
                  }, {})
                ).map(([type, accountList]) => (
                  <optgroup key={type} label={type}>
                    {accountList.map((account) => (
                      <option key={account.accountNo} value={account.accountNo}>
                        {account.accountNo}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <input
                type="text"
                disabled
                placeholder="Account Name"
                value={selectedAccount ? selectedAccount.accountName : ""}
              />
            </div>

            <div className="form-row">
              <label>Contact Details:</label>
              <input
                name="contact"
                type="text"
                placeholder="Phone number or email..."
                value={form.contact}
                onChange={handleChange}
                className={`full-width-input ${
                  validationErrors.contact ? "input-error" : ""
                }`}
              />
              {validationErrors.contact && (
                <div className="error-holder">
                  <span className="error-text">{validationErrors.contact}</span>
                </div>
              )}
            </div>

            <div className="form-row inline">
              <label>Amount:</label>
              <input
                name="amount"
                type="number"
                placeholder="₱..."
                value={form.amount}
                onChange={handleChange}
                min="0.01"
                step="0.01"
                required
                className={validationErrors.amount ? "input-error" : ""}
              />
              {validationErrors.amount && (
                <div className="error-holder">
                  <span className="error-text">{validationErrors.amount}</span>
                </div>
              )}

              <label>Account Number:</label>
              <input
                name="manualAccountNumber"
                type="text"
                placeholder="Enter account number..."
                value={form.manualAccountNumber}
                onChange={handleChange}
                className={
                  validationErrors.manualAccountNumber ? "input-error" : ""
                }
              />
              {validationErrors.manualAccountNumber && (
                <div className="error-holder">
                  <span className="error-text">
                    {validationErrors.manualAccountNumber}
                  </span>
                </div>
              )}

              <label>Date:</label>
              <input
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                disabled={
                  form.method === "Cash" || form.method === "Bank Transfer"
                }
              />
            </div>

            {manualAccountError && (
              <div className="error-holder">
                <span className="error-text">Invalid account number</span>
              </div>
            )}

            <div className="form-row">
              <label>Reason/Description:</label>
              <textarea
                name="reason"
                rows="4"
                placeholder="Type here..."
                value={form.reason}
                onChange={handleChange}
                className="full-width-input"
              />
            </div>

            <div className="form-actions">
              <label>Reference Code:</label>
              <div className="ref-actions">
                <input
                  type="text"
                  readOnly
                  value={displayReference}
                  aria-label="Reference Code"
                />
                <button
                  type="button"
                  className="copy-ref"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(displayReference);
                      setCopiedRef(true);
                      setTimeout(() => setCopiedRef(false), 1500);
                    } catch (err) {
                      alert("Unable to copy reference code");
                    }
                  }}
                >
                  Copy
                </button>
                {copiedRef && <span className="copied-msg">Copied!</span>}
              </div>

              <button
                type="button"
                className="btn cancel"
                onClick={handleClear}
              >
                Clear All
              </button>

              <button type="submit" className="btn submit">
                Submit
              </button>
            </div>
          </form>
        </section>

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
                <span>Total Requested Disbursements:</span>
                <span>{totalRequested}</span>
              </div>

              <div className="status-row">
                <span>Login History:</span>
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
