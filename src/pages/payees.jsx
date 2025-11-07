import React, { useContext, useState } from "react"
import "./dashboard.css"
import "./payees.css"
import logo from "./logo.png"
import { NavLink, useNavigate } from "react-router-dom"
import { AppContext } from "../AppContext"

export default function Payees() {
  const navigate = useNavigate()
  const { payees, setPayees } = useContext(AppContext)
  const [selectedPayee, setSelectedPayee] = useState(null)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [editForm, setEditForm] = useState({
    name: "",
    contact: "",
    method: "",
    account: ""
  })

  function handleLogout() {
    navigate("/")
  }

  function openModal(payee, index) {
    setSelectedPayee(payee)
    setSelectedIndex(index)
    setEditForm({
      name: payee.name,
      contact: payee.contact,
      method: payee.method,
      account: payee.account || ""
    })
  }

  function closeModal() {
    setSelectedPayee(null)
    setSelectedIndex(null)
  }

  function handleEditChange(e) {
    const { name, value } = e.target
    setEditForm(prev => ({ ...prev, [name]: value }))
  }

  function handleSave() {
    const idx = selectedIndex ?? payees.findIndex(p => p.name === selectedPayee?.name)
    if (idx == null || idx === -1) {
      alert("Could not find payee to update.")
      return
    }

    setPayees(prev => {
      const updated = [...prev]
      updated[idx] = {
        ...updated[idx],
        ...editForm
      }
      return updated
    })
    alert("Payee information updated.")
    closeModal()
  }

  function handleDownload(file) {
    if (!file) {
      alert("No files attached.")
      return
    }
    const url = URL.createObjectURL(file)
    const a = document.createElement("a")
    a.href = url
    a.download = file.name
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleDelete(payeeName) {
    const confirmed = window.confirm("Are you sure you want to delete this payee?")
    if (confirmed) {
      setPayees(prev => prev.filter(p => p.name !== payeeName))
      setSelectedPayee(null)
      alert("Payee deleted.")
    }
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
          <h1 className="page-title">Payees</h1>
          <div className="top-controls">
            <input className="search" placeholder="Search..." />
            <button className="gear" aria-label="settings">⚙️</button>
          </div>
        </header>

        <section className="content-table">
          <table className="payees-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact Info</th>
                <th>Method</th>
                <th>Account Details</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payees.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-text">
                    No payees yet. Submit a disbursement first.
                  </td>
                </tr>
              ) : (
                payees.map((p, i) => (
                  <tr key={i}>
                    <td>{p.name}</td>
                    <td>{p.contact}</td>
                    <td>{p.method}</td>
                    <td>{p.account || <span className="empty">Empty</span>}</td>
                    <td>
                      <button onClick={() => openModal(p, i)}>View</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

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
                <label>Contact Info:</label>
                <input
                  name="contact"
                  value={editForm.contact}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-row">
                <label>Method:</label>
                <select
                  name="method"
                  value={editForm.method}
                  onChange={handleEditChange}
                >
                  <option>Bank Transfer</option>
                  <option>Online Payment</option>
                  <option>Cash</option>
                  <option>Check</option>
                </select>
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

                <button
                  onClick={() => handleDownload(selectedPayee.file)}
                >
                  {selectedPayee.file ? "Download Attached File" : "No Files Attached"}
                </button>

                <button
                  className="delete-btn"
                  onClick={() => handleDelete(selectedPayee.name)}
                >
                  Delete Payee
                </button>

                <button onClick={closeModal}>Close</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}