import React, { useContext, useState } from "react"
import "./dashboard.css"
import "./reports.css"
import logo from "./logo.png"
import { NavLink, useNavigate } from "react-router-dom"
import { AppContext } from "../AppContext"

export default function Reports() {
  const navigate = useNavigate()
  const { pendingApprovals, markDisbursementFailed, deletePendingApproval } = useContext(AppContext)
  const [selectedIndex, setSelectedIndex] = useState(null)

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

  function openModal(i) {
    setSelectedIndex(i)
  }

  function closeModal() {
    setSelectedIndex(null)
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
          <NavLink to="/reports" className="nav-item">Reports</NavLink>
        </nav>
        <button className="logout" onClick={handleLogout}>Log Out</button>
      </aside>

      <main className="main">
        <header className="topbar">
          <h1 className="page-title">Reports</h1>
          <div className="top-controls">
            <input className="search" placeholder="Search..." />
            <button className="gear" aria-label="settings">⚙️</button>
          </div>
        </header>

        <section className="filter-bar">
          <span>Filter By:</span>
          <button className="filter-btn">Date Range ▼</button>
          <button className="filter-btn">Status ▼</button>
          <button className="filter-btn">Payees ▼</button>
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
              {reports.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-data">
                    No reports available. Submit a disbursement first.
                  </td>
                </tr>
              ) : (
                reports.map((r, i) => (
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
                {pendingApprovals[selectedIndex].status !== "Failed" ? (
                  <button className="cancel-transaction" onClick={handleCancelTransaction}>
                    Cancel Transaction
                  </button>
                ) : (
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
