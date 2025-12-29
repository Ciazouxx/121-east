import React, { useState, useContext, useEffect } from "react";
import "./dashboard.css";
import "./disbursement.css";
import logo from "../logo.png";
import { NavLink, useNavigate } from "react-router-dom";
import { AppContext } from "../AppContext";
import settingsicon from "./settingsicon.png";

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
  } = useContext(AppContext);
  const navigate = useNavigate();

  const [manualAccountError, setManualAccountError] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

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

    if (name === "name") {
      const query = value.trim();
      setForm((prev) => ({ ...prev, name: value }));

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

    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSuggestionClick(suggestion) {
    setForm((prev) => ({ ...prev, name: suggestion }));
    setSuggestions([]);
    setNameError(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();

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

    await addDisbursement({ ...form });

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
            <input className="search" placeholder="Search..." />

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
                    nameError ? "input-error" : ""
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
                {nameError && (
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
                className="full-width-input"
              />
            </div>

            <div className="form-row inline">
              <label>Amount:</label>
              <input
                name="amount"
                type="number"
                placeholder="₱..."
                value={form.amount}
                onChange={handleChange}
              />

              <label>Account Number:</label>
              <input
                name="manualAccountNumber"
                type="text"
                placeholder="Enter account number..."
                value={form.manualAccountNumber}
                onChange={handleChange}
              />

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
                <div className="info-row">
                  <span>yourusername</span>
                  <button className="change-btn">Change Username</button>
                </div>
              </div>

              <div className="field-row">
                <label>Email:</label>
                <span>your@email.com</span>
              </div>

              <div className="field-row">
                <label>Contact Number:</label>
                <span>09123456789</span>
              </div>

              <div className="field-row">
                <label>Password:</label>
                <div className="info-row">
                  <span>*********</span>
                  <button className="change-btn">Change Password</button>
                </div>
              </div>

              <button
                className="close-modal"
                onClick={() => setShowAccountModal(false)}
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
