import React, { useContext, useState } from "react"
import "./dashboard.css"
import "./payees.css"
import logo from "./logo.png"
import { NavLink, useNavigate } from "react-router-dom"
import { AppContext } from "../AppContext"
import settingsicon from "./settingsicon.png"

export default function Payees() {
  const navigate = useNavigate()
  const { payees, setPayees } = useContext(AppContext)
  const [selectedPayee, setSelectedPayee] = useState(null)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [editForm, setEditForm] = useState({
    name: "",
    contactNumber: "",
    tin: "",
    address: "",
    contactPerson: "",
    account: ""
  })

  // Add Payee modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({
    name: "",
    contactNumber: "",
    tin: "",
    address: "",
    contactPerson: "",
    account: ""
  })

  function openModal(payee, index) {
    setSelectedPayee(payee)
    setSelectedIndex(index)
    setEditForm({
      name: payee.name,
      contactNumber: payee.contact || "",
      tin: payee.tin || "",
      address: payee.address || "",
      contactPerson: payee.contactPerson || "",
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

  function handleDelete(payeeName) {
    const confirmed = window.confirm("Are you sure you want to delete this payee?")
    if (confirmed) {
      setPayees(prev => prev.filter(p => p.name !== payeeName))
      setSelectedPayee(null)
      alert("Payee deleted.")
    }
  }

  function openAddModal() {
    setAddForm({
      name: "",
      contactNumber: "",
      tin: "",
      address: "",
      contactPerson: "",
      account: ""
    })
    setShowAddModal(true)
  }

  function closeAddModal() {
    setShowAddModal(false)
  }

  function handleAddChange(e) {
    const { name, value } = e.target
    setAddForm(prev => ({ ...prev, [name]: value }))
  }

  function handleAddSave() {
    if (!addForm.name.trim()) {
      alert("Name is required.")
      return
    }
    setPayees(prev => [
      ...prev,
      {
        name: addForm.name,
        contact: addForm.contactNumber,
        tin: addForm.tin,
        address: addForm.address,
        contactPerson: addForm.contactPerson,
        account: addForm.account || ""
      }
    ])
    setShowAddModal(false)
    alert("Payee added.")
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
          <h1 className="page-title">Payees</h1>
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

        {/* table plus right-side action column */}
        <div className="table-wrapper">
          <section className="content-table">
            <table className="payees-table">
             <thead>
               <tr>
                 <th>Name</th>
                 <th>Contact Number</th>
                 <th>TIN Number</th>
                 <th>Address</th>
                 <th>Contact Person</th>
                 <th>Actions</th>
               </tr>
             </thead>
             <tbody>
              {payees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-text">
                    No payees yet. Click add payee to add one.
                  </td>
                </tr>
              ) : (
                payees.map((p, i) => (
                  <tr key={i}>
                    <td>{p.name}</td>
                    <td>{p.contact || ""}</td>
                    <td>{p.tin || ""}</td>
                    <td>{p.address || ""}</td>
                    <td>{p.contactPerson || ""}</td>
                    <td>
                      <button onClick={() => openModal(p, i)}>View</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        <aside className="table-side" aria-hidden={showAddModal ? "false" : "true"}>
            <button className="add-payee" onClick={openAddModal}>Add Payee</button>
          </aside>
        </div>

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
                <label>Contact Number:</label>
                <input
                  name="contactNumber"
                  value={editForm.contactNumber}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-row">
                <label>TIN Number:</label>
                <input
                  name="tin"
                  value={editForm.tin}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-row">
                <label>Address:</label>
                <input
                  name="address"
                  value={editForm.address}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-row">
                <label>Contact Person:</label>
                <input
                  name="contactPerson"
                  value={editForm.contactPerson}
                  onChange={handleEditChange}
                />
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

        {showAddModal && (
          <div className="modal-overlay">
            <div className="modal" role="dialog" aria-modal="true">
              <h2>Add Payee</h2>

              <div className="form-row">
                <label>Name:</label>
                <input name="name" value={addForm.name} onChange={handleAddChange} />
              </div>

              <div className="form-row">
                <label>Contact Number:</label>
                <input name="contactNumber" value={addForm.contactNumber} onChange={handleAddChange} />
              </div>

              <div className="form-row">
                <label>TIN Number:</label>
                <input name="tin" value={addForm.tin} onChange={handleAddChange} />
              </div>

              <div className="form-row">
                <label>Address:</label>
                <input name="address" value={addForm.address} onChange={handleAddChange} />
              </div>

              <div className="form-row">
                <label>Contact Person:</label>
                <input name="contactPerson" value={addForm.contactPerson} onChange={handleAddChange} />
              </div>

              <div className="modal-actions">
                <button onClick={handleAddSave}>Save</button>
                <button onClick={closeAddModal}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}