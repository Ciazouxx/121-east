import React, { useState, useContext, useEffect } from "react"
import "./dashboard.css"
import "./disbursement.css"
import logo from "../logo.png"
import { NavLink, useNavigate } from "react-router-dom"
import { AppContext } from "../AppContext"
import settingsicon from "./settingsicon.png"

export default function Disbursement() {
  const { addDisbursement, payees, getPayeeCOA, updatePayeeCOA, defaultCOA, refCounter } = useContext(AppContext)
  const navigate = useNavigate()
  const [manualAccountError, setManualAccountError] = useState(false)


  const accountMap = {
  Cash: { number: "1001", name: "Cash on Hand" },
  "Bank Transfer": { number: "1002", name: "Cash in Bank" },
  "Online Payment": { number: "1003", name: "Online Payment Account" },
  Check: { number: "1004", name: "Checks on Hand" }
}

  const [form, setForm] = useState({
    name: "",
    method: "",
    accountNumber: "",
    manualAccountNumber: "",
    contact: "",
    amount: "",
    date: "",
    reason: ""
  })

  const [nameError, setNameError] = useState(false)

  // Set default date to today
  useEffect(() => {
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    setForm(prev => ({ ...prev, date: `${yyyy}-${mm}-${dd}` }))
  }, [])

  function handleChange(e) {
    const { name, value } = e.target

    if (name === "name") {
      setForm(prev => ({ ...prev, name: value }))

      const q = value.trim()
      if (!q) {
        setNameError(false)
        return
      }

      const names = (payees || []).map(p => p.name || "")
      const exact = names.find(n => n.toLowerCase() === q.toLowerCase())
      setNameError(!exact)
      return
    }

  if (name === "method") {
  const account = accountMap[value]
  setForm(prev => ({
    ...prev,
    method: value,
    accountNumber: account?.number || ""
  }))
  return
  }

    setForm(prev => ({ ...prev, [name]: value }))
  }


  function handleSubmit(e) {
  e.preventDefault()

  if (!form.name || !form.amount || !form.method) {
    alert("Please fill in the required fields.")
    return
  }

  const names = (payees || []).map(p => p.name || "")
  const matched = names.find(n => n.toLowerCase() === form.name.toLowerCase())
  if (!matched) {
    setNameError(true)
    alert("The payee name is not in the payee's list.")
    return
  }

  const payeeName = form.name.trim()

  // Validate manual account number if provided
  const manualNum = Number(form.manualAccountNumber)
  if (manualNum) {
    const payeeChart = getPayeeCOA(payeeName)
    const baseCOA = payeeChart ? JSON.parse(JSON.stringify(payeeChart)) : JSON.parse(JSON.stringify(defaultCOA))
    
    let manualAccount = null
    Object.keys(baseCOA).forEach(sec => {
      const found = baseCOA[sec].find(acc => acc.number === manualNum)
      if (found) manualAccount = found
    })

    if (!manualAccount) {
      alert("Invalid manual account number.")
      return
    }
  }

  // Validate method maps to an account
  const account = accountMap[form.method]
  if (!account) {
    alert("No mapped account code for this payment method.")
    return
  }

  // Add to pending disbursements only
  addDisbursement({ ...form })

  alert("Disbursement submitted and pending approval.")

  setForm({
    name: "",
    method: "",
    accountNumber: "",
    contact: "",
    amount: "",
    manualAccountNumber: "",
    date: form.date,
    reason: ""
  })
  setNameError(false)
}

  function handleClear() {
    setForm({
      name: "",
      method: "",
      contact: "",
      amount: "",
      date: form.date,
      reason: ""
    })
    setNameError(false)
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
          <NavLink to="/summary" className="nav-item">Summary</NavLink>
          <NavLink to="/chartofaccounts" className="nav-item">Chart of Accounts</NavLink>
        </nav>
        <button className="logout" onClick={handleLogout}>Log Out</button>
      </aside>

      <main className="main">
        <header className="topbar">
          <h1 className="page-title">Disbursement</h1>
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
                className={nameError ? "input-error" : ""}
              />
              <div className="error-holder">
              {nameError && <span className="error-text">Payee not found in the list.</span>}
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
            <label>Account Number:</label>
            <input type="text" value={form.accountNumber} disabled />
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
              <label>Account Number:</label>
              <input
                name="manualAccountNumber"
                type="text"
                placeholder="Enter account number..."
                value={form.manualAccountNumber}
                onChange={handleChange}
              />
              <label>Date:</label>
              <input name="date" type="text" value={form.date} disabled />
              <div className="error-holder">
              {manualAccountError && <span className="error-text">Invalid account number</span>}
              </div>
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

            <div className="form-actions">
              <label>Reference Code:</label> <input type="text" disabled value={String(refCounter).padStart(5, "0")} />
              <button type="button" className="btn cancel" onClick={handleClear}>Clear All</button>
              <button type="submit" className="btn submit">Submit</button>
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}
