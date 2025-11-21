import React, { useContext, useState } from "react"
import "./dashboard.css"
import "./summary.css"
import logo from "./logo.png"
import { NavLink, useNavigate } from "react-router-dom"
import { AppContext } from "../AppContext"
import settingsicon from "./settingsicon.png"

export default function Sumarry() {
  const navigate = useNavigate()
  const { pendingApprovals, markDisbursementFailed, deletePendingApproval, approveDisbursement } = useContext(AppContext)
  const [selectedIndex, setSelectedIndex] = useState(null)
  
  const [statusFilter, setStatusFilter] = useState("All");
  const [payeeFilter, setPayeeFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState({ start: null, end: null });

  function handleLogout() {
    navigate("/")
  }

  // Generate report rows from pending disbursements
  const reports = pendingApprovals.map(d => {
    const raw = d.date || d.createdAt || d.submittedAt || null
    const date = raw ? new Date(raw).toLocaleDateString() : new Date().toLocaleDateString()
    return {
      date,
      recipient: d.name,
      amount: `₱${d.amount}`,
      method: d.method,
      status: d.status || "Pending"
    }
  })

  const filteredReports = reports
  .filter(r => statusFilter === "All" || r.status === statusFilter)
  .filter(r => payeeFilter === "All" || r.recipient.toLowerCase().includes(payeeFilter.toLowerCase()))
  .filter(r => {
    if (!dateFilter.start || !dateFilter.end) return true;
    const reportDate = new Date(r.date);
    const start = new Date(dateFilter.start);
    const end = new Date(dateFilter.end);
    return reportDate >= start && reportDate <= end;
  });

  function openModal(i) {
    setSelectedIndex(i)
  }

  function closeModal() {
    setSelectedIndex(null)
  }

  function handleApproveTransaction() {
  if (selectedIndex == null) return;
  approveDisbursement(selectedIndex);
  closeModal();
}

  function handleCancelTransaction() {
    if (selectedIndex == null) return
    markDisbursementFailed(selectedIndex)
  }

  function handleDeletePending() {
    if (selectedIndex == null) return
    deletePendingApproval(selectedIndex)
    closeModal()
  }

  return (
    <div className="dash-root">
      <aside className="sidebar">
        <div className="logo-wrap">
          <img src={logo} alt="logo" className="logo" />
        </div>
        <nav className="nav">
          <NavLink to="/dashboard" className="nav-item">Dashboard</NavLink>
          <NavLink to="/disbursement" className="nav-item">Disbursement</NavLink>
          <NavLink to="/payees" className="nav-item">Payees</NavLink>
          <NavLink to="/summary" className="nav-item">Summary</NavLink>
          <NavLink to="/chartofaccounts" className="nav-item">Chart of Accounts</NavLink>
        </nav>
        <button className="logout" onClick={handleLogout}>Log Out</button>
      </aside>

      <main className="main">
        <header className="topbar">
          <h1 className="page-title">Summary</h1>
          <div className="top-controls">
            <input className="search" placeholder="Search..." />
            <button className="gear" aria-label="settings">
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
          <button className="filter-btn" onClick={() => {
          const start = prompt("Enter start date (YYYY-MM-DD):");
          const end = prompt("Enter end date (YYYY-MM-DD):");
          if (start && end) setDateFilter({ start, end });
          }}>Date Range ▼</button>

        <button className="filter-btn" onClick={() => {
          const status = prompt("Enter status (Pending, Approved, Failed):") || "All";
          setStatusFilter(status);
          }}>Status ▼</button>

        <button className="filter-btn" onClick={() => {
          const payee = prompt("Enter payee name:") || "All";
          setPayeeFilter(payee);
          }}>Payees ▼</button>
        </section>

        <section className="report-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Payees</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-data">
                    No reports available. Submit a disbursement first.
                  </td>
                </tr>
              ) : (
                filteredReports.map((r, i) => (
                  <tr key={i}>
                    <td>{r.date}</td>
                    <td>{r.recipient}</td>
                    <td>{r.amount}</td>
                    <td>{r.method}</td>
                    <td className={r.status.toLowerCase()}>{r.status}</td>
                    <td>
                      <button className="view-btn" onClick={() => openModal(i)}>View</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        {selectedIndex !== null && pendingApprovals[selectedIndex] && (
          <div className="modal-overlay">
            <div className="modal">
              <h2>Disbursement Details</h2>
              <p><strong>Recipient:</strong> {pendingApprovals[selectedIndex].name}</p>
              <p><strong>Amount:</strong> ₱{pendingApprovals[selectedIndex].amount}</p>
              <p><strong>Method:</strong> {pendingApprovals[selectedIndex].method}</p>
              <p><strong>Status:</strong> {pendingApprovals[selectedIndex].status || "Pending"}</p>

              {/* show description/reason (supports both field names) */}
              {(() => {
                const desc =
                  pendingApprovals[selectedIndex].description ||
                  pendingApprovals[selectedIndex].reason ||
                  ""
                if (!desc) return null
                return (
                  <div className="modal-description-wrap">
                    <div className="modal-description-label">Reason / Description:</div>
                    <div className="modal-description">{desc}</div>
                  </div>
                )
              })()}

                <div className="modal-actions">
              {pendingApprovals[selectedIndex].status === "Pending" && (
              <>
          <button className="approve-transaction" onClick={handleApproveTransaction}>
            Approve Transaction
          </button>
          <button className="cancel-transaction" onClick={handleCancelTransaction}>
            Cancel Transaction
          </button>
              </>
            )}

          {pendingApprovals[selectedIndex].status === "Failed" && (
          <button className="delete-transaction" onClick={handleDeletePending}>
          Delete
        </button>
      )}

    <button onClick={closeModal}>Close</button>
  </div>
            </div>
          </div>
        )}
       </main>
     </div>
   )
 }
