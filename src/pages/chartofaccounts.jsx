import React, { useContext, useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../AppContext";
import "./dashboard.css";
import "./chartofaccounts.css";
import Sidebar from "../Sidebar";
import settingsicon from "../assets/settingsicon.png";

export default function ChartOfAccounts() {
  const {
    accounts = [],
    deleteAccount,
    updateAccount,
    addAccount,
    totalRequested,
    userAccount,
    setUserAccount,
  } = useContext(AppContext);

  const navigate = useNavigate();

  // State for Edit Modal
  const [editingAccount, setEditingAccount] = useState(null);
  const [editFormData, setEditFormData] = useState({
    accountName: "",
    accountType: "",
  });

  // State for Add Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAccountData, setNewAccountData] = useState({
    accountNo: "",
    accountName: "",
    accountType: "Asset",
  });
  const [validationErrors, setValidationErrors] = useState({
    accountNo: "",
    accountName: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState("");

  // Check if current user is admin based on role
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

  // Sync edit form data when editingAccount changes
  useEffect(() => {
    if (editingAccount) {
      setEditFormData({
        accountName: editingAccount.accountName,
        accountType: editingAccount.accountType,
      });
    }
  }, [editingAccount]);

  // --- Handlers ---

  const handleEdit = (account) => {
    setEditingAccount(account);
  };

  const handleDelete = async (accountNo) => {
    if (!window.confirm("Are you sure you want to delete this account?"))
      return;
    await deleteAccount(accountNo);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const success = await updateAccount(editingAccount.accountNo, editFormData);
    if (success) {
      setEditingAccount(null);
    }
  };

  const handleAddFormChange = (e) => {
    const { name, value } = e.target;
    setNewAccountData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    setValidationErrors((prev) => ({ ...prev, [name]: "" }));

    // Validate Account No. - should be numbers only
    if (name === "accountNo") {
      if (value && !/^\d+$/.test(value)) {
        setValidationErrors((prev) => ({
          ...prev,
          accountNo: "Please enter numbers only (e.g., 101, 102)",
        }));
      }
    }

    // Validate Account Name - should be text (letters, spaces, special chars)
    if (name === "accountName") {
      if (value && /^\d+$/.test(value)) {
        setValidationErrors((prev) => ({
          ...prev,
          accountName:
            "Please enter text/letters (e.g., Cash, Accounts Receivable)",
        }));
      }
    }
  };

  const handleAddNewAccount = async (e) => {
    e.preventDefault();

    // Final validation before submit
    const errors = {};

    if (!/^\d+$/.test(newAccountData.accountNo)) {
      errors.accountNo = "Please enter numbers only (e.g., 101, 102)";
    }

    if (/^\d+$/.test(newAccountData.accountName)) {
      errors.accountName =
        "Please enter text/letters (e.g., Cash, Accounts Receivable)";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // addAccount returns true on success
    const success = await addAccount(newAccountData);
    if (success) {
      setIsAddModalOpen(false);
      setNewAccountData({
        accountNo: "",
        accountName: "",
        accountType: "Asset",
      });
      setValidationErrors({
        accountNo: "",
        accountName: "",
      });
    } else {
      alert("Failed to add account. Account No. might already exist.");
    }
  };

  const openAddModal = () => {
    setIsAddModalOpen(true);
  };

  // --- Filtering & Sorting ---

  const filteredAccounts = useMemo(() => {
    return accounts
      .filter((account) => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        if (!lowerCaseSearchTerm) return true;

        return (
          String(account.accountNo)
            .toLowerCase()
            .includes(lowerCaseSearchTerm) ||
          account.accountName.toLowerCase().includes(lowerCaseSearchTerm) ||
          account.accountType.toLowerCase().includes(lowerCaseSearchTerm)
        );
      })
      .sort((a, b) => Number(a.accountNo) - Number(b.accountNo)); // Sort by Account No.
  }, [accounts, searchTerm]);

  return (
    <div className="dash-root">
      <Sidebar />

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
          <h1 className="page-title">Chart of Accounts</h1>
          <div className="top-controls">
            <input
              className="search"
              placeholder="Search by No., Name, or Type..."
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
            {isAdmin && (
              <button className="btn-add-account" onClick={openAddModal}>
                + Add Account
              </button>
            )}
          </div>
        </header>

        <section className="coa-table-container">
          <div className="coa-table-wrapper">
            <table className="coa-table">
              <thead>
                <tr>
                  <th>Account Code</th>
                  <th>Account Name</th>
                  <th>Account Type</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.length > 0 ? (
                  filteredAccounts.map((account) => (
                    <tr key={account.accountNo}>
                      <td>{account.accountNo}</td>
                      <td>{account.accountName}</td>
                      <td>{account.accountType}</td>
                      {isAdmin && (
                        <td>
                          <button
                            className="btn-edit"
                            onClick={() => handleEdit(account)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDelete(account.accountNo)}
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={isAdmin ? "4" : "3"}
                      style={{ textAlign: "center" }}
                    >
                      No accounts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* --- Edit Modal --- */}
      {editingAccount && (
        <div className="modal-overlay">
          <div className="edit-modal">
            <h2>Edit Account</h2>
            <form onSubmit={handleSaveEdit}>
              <div className="form-group">
                <label>Account No.</label>
                <input type="text" value={editingAccount.accountNo} disabled />
              </div>
              <div className="form-group">
                <label htmlFor="accountName">Account Name</label>
                <input
                  id="accountName"
                  name="accountName"
                  type="text"
                  value={editFormData.accountName}
                  onChange={handleEditFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="accountType">Account Type</label>
                <select
                  id="accountType"
                  name="accountType"
                  value={editFormData.accountType}
                  onChange={handleEditFormChange}
                  required
                >
                  <option value="Asset">Asset</option>
                  <option value="Liability">Liability</option>
                  <option value="Equity">Equity</option>
                  <option value="Revenue">Revenue</option>
                  <option value="Expense">Expense</option>
                </select>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setEditingAccount(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Add Modal --- */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="edit-modal">
            <h2>Add New Account</h2>
            <form onSubmit={handleAddNewAccount}>
              <div className="form-group">
                <label htmlFor="accountNo">Account No.</label>
                <input
                  id="accountNo"
                  name="accountNo"
                  type="text"
                  value={newAccountData.accountNo}
                  onChange={handleAddFormChange}
                  required
                  placeholder="e.g., 101"
                  className={validationErrors.accountNo ? "input-error" : ""}
                />
                {validationErrors.accountNo && (
                  <span className="error-message">
                    {validationErrors.accountNo}
                  </span>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="newAccountName">Account Name</label>
                <input
                  id="newAccountName"
                  name="accountName"
                  type="text"
                  value={newAccountData.accountName}
                  onChange={handleAddFormChange}
                  required
                  placeholder="e.g., Cash"
                  className={validationErrors.accountName ? "input-error" : ""}
                />
                {validationErrors.accountName && (
                  <span className="error-message">
                    {validationErrors.accountName}
                  </span>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="newAccountType">Account Type</label>
                <select
                  id="newAccountType"
                  name="accountType"
                  value={newAccountData.accountType}
                  onChange={handleAddFormChange}
                  required
                >
                  <option value="Asset">Asset</option>
                  <option value="Liability">Liability</option>
                  <option value="Equity">Equity</option>
                  <option value="Revenue">Revenue</option>
                  <option value="Expense">Expense</option>
                </select>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  Add Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modals */}
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
    </div>
  );
}
