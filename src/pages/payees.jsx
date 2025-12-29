import React, { useContext, useState, useRef } from "react"
import "./dashboard.css"
import "./payees.css"
import logo from "./logo.png"
import { NavLink, useNavigate } from "react-router-dom"
import { AppContext } from "../AppContext"
import settingsicon from "./settingsicon.png"
import { supabase } from "../lib/supabase"

export default function Payees() {
  const navigate = useNavigate()
  const { payees, setPayees, totalRequested, updatePayeeDetails, loadAllData } = useContext(AppContext)
  const [selectedPayee, setSelectedPayee] = useState(null)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);  
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    contactNumber: "",
    tin: "",
    address: "",
    contactPerson: "",
    account: ""
  })
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const tableRef = useRef(null);

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

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPayees = payees.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(payees.length / itemsPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      if (tableRef.current) {
        tableRef.current.scrollTop = 0;
      }
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      if (tableRef.current) {
        tableRef.current.scrollTop = 0;
      }
    }
  };

  function openModal(payee, index) {
    setSelectedPayee(payee)
    setSelectedIndex(index)
    setEditForm({
      name: payee.name,
      contactNumber: payee.contact || "",
      tin: payee.tin || "",
      address: payee.address || "",
      contactPerson: payee.contact_person || "",
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

  async function handleSave() {
    const idx = selectedIndex ?? payees.findIndex(p => p.name === selectedPayee?.name)
    if (idx == null || idx === -1) {
      alert("Could not find payee to update.")
      return
    }

    try {
      await updatePayeeDetails(idx, {
        name: editForm.name,
        contact: editForm.contactNumber,
        tin: editForm.tin,
        address: editForm.address,
        contactPerson: editForm.contactPerson,
        account: editForm.account
      })
      alert("Payee information updated.")
      closeModal()
    } catch (error) {
      console.error('Error updating payee:', error)
      alert("Failed to update payee: " + error.message)
    }
  }

  async function handleDelete(payeeName) {
    const confirmed = window.confirm("Are you sure you want to delete this payee?")
    if (!confirmed) return

    try {
      const payee = payees.find(p => p.name === payeeName)
      if (!payee) {
        alert("Payee not found.")
        return
      }

      const { error } = await supabase
        .from('payees')
        .delete()
        .eq('id', payee.id)

      if (error) {
        console.error('Error deleting payee:', error)
        if (error.code === '42P01') {
          alert("Database table 'payees' does not exist. Please check your database.")
        } else {
          throw error
        }
        return
      }

      // Reload all data from AppContext to ensure sync
      if (loadAllData) {
        await loadAllData()
      } else {
        // Fallback: update local state
        setPayees(prev => prev.filter(p => p.id !== payee.id))
      }
      
      setSelectedPayee(null)
      alert("Payee deleted.")
    } catch (error) {
      console.error('Error deleting payee:', error)
      alert("Failed to delete payee: " + error.message)
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

  async function handleAddSave() {
    if (!addForm.name.trim()) {
      alert("Name is required.")
      return
    }

    try {
      // Check if payee already exists (using payees table structure)
      const { data: existingPayee, error: checkError } = await supabase
        .from('payees')
        .select('*')
        .eq('name', addForm.name.trim())
        .maybeSingle()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking for existing payee:', checkError)
        if (checkError.code === '42P01') {
          alert("Database table 'payees' does not exist. Please check your database.")
          return
        }
      }

      if (existingPayee) {
        alert("A payee with this name already exists.")
        return
      }

      // Insert into payees table (old structure)
      const { data: newPayee, error } = await supabase
        .from('payees')
        .insert({
          name: addForm.name.trim(),
          contact: addForm.contactNumber || null,
          tin: addForm.tin || null,
          address: addForm.address || null,
          contact_person: addForm.contactPerson || null,
          account: addForm.account || null
        })
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        
        if (error.code === '23505') {
          alert("A payee with this name already exists.")
        } else if (error.code === '42P01') {
          alert("Database table 'payees' does not exist. Please check your database.")
        } else if (error.message?.includes('permission denied') || error.message?.includes('RLS')) {
          alert("Permission denied. Please check Row Level Security policies in Supabase.")
        } else {
          alert("Failed to add payee: " + (error.message || error.code || 'Unknown error') + "\n\nCheck browser console for details.")
        }
        return
      }

      if (!newPayee) {
        alert("Failed to add payee: No data returned")
        return
      }

      // Reload all data from AppContext to ensure sync
      if (loadAllData) {
        await loadAllData()
      }
      
      // Also update local state immediately for better UX
      const mappedPayee = {
        ...newPayee,
        id: newPayee.id,
        name: newPayee.name,
        contact: newPayee.contact || '',
        tin: newPayee.tin || '',
        address: newPayee.address || '',
        contactPerson: newPayee.contact_person || '',
        account: newPayee.account || ''
      }
      setPayees(prev => {
        // Check if already exists to avoid duplicates
        const exists = prev.find(p => p.id === mappedPayee.id)
        if (exists) return prev
        return [...prev, mappedPayee]
      })

      setShowAddModal(false)
      setAddForm({
        name: "",
        contactNumber: "",
        tin: "",
        address: "",
        contactPerson: "",
        account: ""
      })
      alert("Payee added successfully.")
    } catch (error) {
      console.error('Error adding payee:', error)
      alert("Failed to add payee: " + (error.message || 'Unknown error'))
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
          <NavLink to="/summary" className="nav-item">Summary</NavLink>
          <NavLink to="/chartofaccounts" className="nav-item">Chart of Accounts</NavLink>
        </nav>
        <button className="logout" onClick={handleLogout}>Log Out</button>
      </aside>

      <main className="main">
        <header className="topbar">
          {showSettingsMenu && (
            <div className="settings-menu">
              <button className="settings-item" onClick={() => {
                setShowAccountModal(true);
                setShowSettingsMenu(false);
              }}>
                My Account
              </button>
              <button className="settings-item" onClick={() => {
                setShowStatusModal(true);
                setShowSettingsMenu(false);
              }}>
                Account Status
              </button>
            </div>
          )}
          <h1 className="page-title">Payees</h1>
          <div className="top-controls">
            <input className="search" placeholder="Search..." />
            <button className="gear" aria-label="settings" onClick={() => setShowSettingsMenu(!showSettingsMenu)}>
              <img 
                src={settingsicon}
                alt="settings" 
                style={{ width: "30px", height: "30px" }} 
              />
            </button>
          </div>
        </header>

        <div className="add-payee-container">
          <button className="add-payee-btn" onClick={openAddModal}>Add Payee</button>
        </div>

        <div className="content-table" ref={tableRef}>
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
              {currentPayees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-text">
                    No payees yet. Click add payee to add one.
                  </td>
                </tr>
              ) : (
                currentPayees.map((p, i) => (
                  <tr key={i}>
                    <td>{p.name}</td>
                    <td>{p.contact || ""}</td>
                    <td>{p.tin || ""}</td>
                    <td>{p.address || ""}</td>
                    <td>{p.contact_person || ""}</td>
                    <td className="action-buttons">
                      <button onClick={() => openModal(p, i)}>View</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination-controls">
          <button onClick={prevPage} disabled={currentPage === 1}>
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button onClick={nextPage} disabled={currentPage === totalPages}>
            Next
          </button>
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
        {showAccountModal && (
          <div className="modal-backdrop" onClick={() => setShowAccountModal(false)}>
            <div className="account-modal" onClick={(e) => e.stopPropagation()}>
              <h2>My Account</h2>
              <div className="field-row">
                <label>Username:</label>
                <div className="info-row">
                  <span>yourusername</span>
                  <button className="change-btn">Change Username</button>
                </div>
              </div>
              <div className="field-row">
                <label>Email:</label>
                <span>your@email.com</span>
              </div>
              <div className="field-row">
                <label>Contact Number:</label>
                <span>09123456789</span>
              </div>
              <div className="field-row">
                <label>Password:</label>
                <div className="info-row">
                  <span>*********</span>
                  <button className="change-btn">Change Password</button>
                </div>
              </div>
              <button className="close-modal" onClick={() => setShowAccountModal(false)}>Close</button>
            </div>
          </div>
        )}
        {showStatusModal && (
          <div className="modal-backdrop" onClick={() => setShowStatusModal(false)}>
            <div className="status-modal" onClick={(e) => e.stopPropagation()}>
              <h2>Account Status</h2>
              <div className="status-row">
                <span>Total Requested Disbursements: </span>
                <span>{totalRequested}</span>
              </div>
              <div className="status-row">
                <span>Login History: </span>
                <span>0</span>
              </div>
              <button className="close-modal" onClick={() => setShowStatusModal(false)}>Close</button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}