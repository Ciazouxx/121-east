import React, { useState, useContext, useRef } from "react"
import "./dashboard.css"
import "./disbursement.css"
import logo from "../logo.png"
import { NavLink, useNavigate } from "react-router-dom"
import { AppContext } from "../AppContext"

export default function Disbursement() {
  const { addDisbursement } = useContext(AppContext)
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    name: "",
    method: "",
    contact: "",
    amount: "",
    date: "",
    reason: "",
    file: null
  })

  function handleChange(e) {
    const { name, value, files } = e.target
    setForm(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }))
  }

  function handleSubmit(e) {
    e.preventDefault()

    if (!form.name || !form.amount || !form.method) {
      alert("Please fill in the required fields.")
      return
    }

    addDisbursement({
      name: form.name,
      method: form.method,
      contact: form.contact,
      amount: form.amount,
      date: form.date,
      reason: form.reason,
      file: form.file || null
    })

    alert("Disbursement submitted.")

    // Reset all fields including file input
    setForm({
      name: "",
      method: "",
      contact: "",
      amount: "",
      date: "",
      reason: "",
      file: null
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  function handleClear() {
    setForm({
      name: "",
      method: "",
      contact: "",
      amount: "",
      date: "",
      reason: "",
      file: null
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  function handleLogout() {
    navigate("/")
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
          <h1 className="page-title">Disbursement</h1>
          <div className="top-controls">
            <input className="search" placeholder="Search..." />
            <button className="gear" aria-label="settings">⚙️</button>
          </div>
        </header>

        <section className="disb-form">
          <form className="form-card" onSubmit={handleSubmit}>
            <div className="form-row">
              <label>Name Of Payee:</label>
              <input
                name="name"
                type="text"
                placeholder="Enter the name of the payee..."
                value={form.name}
                onChange={handleChange}
              />
            </div>

            <div className="form-row">
              <label>Payment Method:</label>
              <select name="method" value={form.method} onChange={handleChange}>
                <option value="">Choose method</option>
                <option>Bank Transfer</option>
                <option>Online Payment</option>
                <option>Cash</option>
                <option>Check</option>
              </select>
            </div>

            <div className="form-row">
              <label>Contact Details:</label>
              <input
                name="contact"
                type="text"
                placeholder="Phone number or email..."
                value={form.contact}
                onChange={handleChange}
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
              <label>Date:</label>
              <input
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
              />
            </div>

            <div className="form-row">
              <label>Reason/Description:</label>
              <textarea
                name="reason"
                placeholder="Type here..."
                rows="4"
                value={form.reason}
                onChange={handleChange}
              />
            </div>

            <div className="form-row">
              <label>Attachment:</label>
              <input
                name="file"
                type="file"
                className="filebtn"
                ref={fileInputRef}
                onChange={handleChange}
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn cancel" onClick={handleClear}>
                Clear All
              </button>
              <button type="submit" className="btn submit">Submit</button>
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}
