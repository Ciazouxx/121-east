import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import settingsicon from "./pages/settingsicon.png";
import { AppContext } from "./AppContext";

export default function Header({ title }) {
  const navigate = useNavigate();
  const { currentUser } = useContext(AppContext);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  const handleMyAccount = () => {
    setShowSettingsMenu(false);
    navigate("/my-account");
  };

  return (
    <header className="topbar">
      {showSettingsMenu && (
        <div className="settings-menu">
          <button className="settings-item" onClick={handleMyAccount}>
            My Account
          </button>
        </div>
      )}
      <h1 className="page-title">{title}</h1>
      <div className="top-controls">
        <input className="search" placeholder="Search..." />
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
      </div>
    </header>
  );
}
