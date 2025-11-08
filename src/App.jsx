import React, { useState } from "react"
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom"
import "./app.css"
import logo from "./logo.png"
import eyeOpen from "./vieweye.png"
import eyeClosed from "./crossedeye.png"
import Dashboard from "./pages/dashboard"
import Disbursement from "./pages/disbursement"
import Payees from "./pages/payees"
import Reports from "./pages/reports"
import { AppProvider } from "./AppContext";

function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const navigate = useNavigate()

  function handleSignIn(e) {
    e.preventDefault()
    navigate("/dashboard")
  }

  return (
    <div className="page">
      <form className="card" onSubmit={handleSignIn}>
        <img src={logo} alt="logo" className="logo" />
        <label className="label">Email</label>
        <input
          className="input"
          type="email"
          placeholder="Enter Email..."
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <label className="label">Password</label>
        <div className="input-row">
          <input
            className="input input-password"
            type={show ? "text" : "password"}
            placeholder="Email Password..."
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="eye-btn"
            onClick={() => setShow(s => !s)}
            aria-label="toggle password"
          >
            <img
              src={show ? eyeOpen : eyeClosed}
              alt={show ? "Show password" : "Hide password"}
              style={{ width: 28, height: 28, display: "block" }}
            />
          </button>
        </div>
        <button className="signin" type="submit">Sign In</button>
        <a href="#" className="small-link">Dont have account?</a>
      </form>
    </div>
  )
}

export default function AppRouter() {
  return (
    <BrowserRouter>
    <AppProvider>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/disbursement" element={<Disbursement />} />
        <Route path="/payees" element={<Payees />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
      </AppProvider>
    </BrowserRouter>
  )
}