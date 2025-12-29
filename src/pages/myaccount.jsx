import React, { useState, useContext, useEffect } from "react";
import { AppContext } from "../AppContext";
import Header from "../Header";
import Sidebar from "../Sidebar";

export default function MyAccount() {
  const { currentUser, updateUserAccount } = useContext(AppContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (currentUser) {
      setEmail(currentUser.email);
    }
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    const updates = { email };
    if (password) {
      updates.password = password;
    }

    const success = await updateUserAccount(updates);
    if (success) {
      alert("Account updated successfully!");
      setPassword("");
      setConfirmPassword("");
    }
  };

  if (!currentUser) {
    return (
      <div className="dash-root">
        <Sidebar />
        <div className="content-container">
          <Header title="My Account" />
          <main className="main-content">Loading...</main>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Header />
      <div className="dash-root">
        <Sidebar />
        <main className="main">
          <Header title="My Account" />
          <div className="card" style={{ maxWidth: "500px", margin: "0 auto" }}>
            <form onSubmit={handleSubmit}>
              <label className="label">Email (Username)</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <label className="label" style={{ marginTop: "1rem" }}>
                New Password (leave blank to keep current password)
              </label>
              <input
                className="input"
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <label className="label" style={{ marginTop: "1rem" }}>
                Confirm New Password
              </label>
              <input
                className="input"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <button
                className="signin"
                type="submit"
                style={{ marginTop: "1.5rem" }}
              >
                Save Changes
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
