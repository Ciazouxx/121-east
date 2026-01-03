import { useState } from "react"
import settingsicon from "../assets/settingsicon.png"
import "../components/topbar.css"

export default function Topbar({ title, onOpenAccount, onOpenStatus, onLogout }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="topbar">
      <h1 className="page-title">{title}</h1>

      <div className="top-controls">
        <input className="search" placeholder="Search" />

        <button className="gear" onClick={() => setOpen(!open)}>
          <img src={settingsicon} alt="settings"/>
        </button>

        {open && (
          <div className="settings-menu">
            <button className="settings-item" onClick={onOpenAccount}>My Account</button>
            <button className="settings-item" onClick={onOpenStatus}>Account Status</button>
          </div>
        )}
      </div>
    </div>
  )
}