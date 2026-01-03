import { NavLink, useNavigate } from "react-router-dom"
import logo from "../assets/logo.png"
import "../components/nav.css"

export default function Sidebar() {
  const navigate = useNavigate()

  function handleLogout() {
    navigate("/")
  }

  return (
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

      <button className="logout" onClick={handleLogout}>
        Log Out
      </button>
    </aside>
  )
}