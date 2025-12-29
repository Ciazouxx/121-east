import React, { useContext, useState, useEffect, useMemo } from "react";
// Removed useNavigate as it was unused in the provided snippet
import { AppContext } from "../AppContext";
import "./dashboard.css";
import "./chartofaccounts.css";
import Sidebar from "../Sidebar";

export default function ChartOfAccounts() {
  const {
    accounts = [],
    deleteAccount,
    updateAccount,
    addAccount,
  } = useContext(AppContext);

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

  const [searchTerm, setSearchTerm] = useState("");

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
  };

  const handleAddNewAccount = async (e) => {
    e.preventDefault();
    // addAccount returns true on success
    const success = await addAccount(newAccountData);
    if (success) {
      setIsAddModalOpen(false);
      setNewAccountData({
        accountNo: "",
        accountName: "",
        accountType: "Asset",
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
          <h1 className="page-title">Chart of Accounts</h1>
          <div className="top-controls">
            <input
              className="search"
              placeholder="Search by No., Name, or Type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="btn-add-account" onClick={openAddModal}>
              + Add Account
            </button>
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.length > 0 ? (
                  filteredAccounts.map((account) => (
                    <tr key={account.accountNo}>
                      <td>{account.accountNo}</td>
                      <td>{account.accountName}</td>
                      <td>{account.accountType}</td>
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
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center" }}>
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
                />
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
                />
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
    </div>
  );
}
