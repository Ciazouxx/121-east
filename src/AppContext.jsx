import React, { createContext, useState } from "react"

export const AppContext = createContext()

export function AppProvider({ children }) {
  const [pendingApprovals, setPendingApprovals] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [payees, setPayees] = useState([])
  const [attachedFiles, setAttachedFiles] = useState({})

  const [stats, setStats] = useState({
    totalDisbursedToday: 0,
    pendingDisbursements: 0,
    failedTransactions: 0
  })

  function addDisbursement(entry) {
    setPendingApprovals(prev => {
      const updated = [...prev, { ...entry, status: "Pending" }]
      setStats(s => ({
        ...s,
        pendingDisbursements: updated.filter(p => p.status !== "Failed").length
      }))
      return updated
    })
    const payeeExists = payees.find(p => p.name === entry.name)

    if (!payeeExists) {
      setPayees(prev => [
        ...prev,
        {
          name: entry.name,
          contact: entry.contact,
          method: entry.method,
          account: "",
          file: entry.file || null
        }
      ])
    } else {
      // Update existing payee with new file if provided
      setPayees(prev =>
        prev.map(p =>
          p.name === entry.name
            ? {
                ...p,
                contact: entry.contact,
                method: entry.method,
                file: entry.file || p.file
              }
            : p
        )
      )
    }

    // Store attached file for access from Payees
    if (entry.file) {
      setAttachedFiles(prev => ({
        ...prev,
        [entry.name]: entry.file
      }))
    }
  }

  function cancelDisbursement(index) {
    setPendingApprovals(prev => {
      const updated = prev.filter((_, i) => i !== index)
      setStats(s => ({
        ...s,
        pendingDisbursements: updated.filter(p => p.status !== "Failed").length
      }))
      return updated
    })
  }

  function markDisbursementFailed(index) {
    setPendingApprovals(prev => {
      const item = prev[index]
      if (!item || item.status === "Failed") return prev

      const updated = prev.map((p, i) => (i === index ? { ...p, status: "Failed" } : p))

      const message = `₱${item.amount} disbursement cancelled for ${item.name}`
      const entry = { message, date: new Date().toISOString() }

      // add recent activity but dedupe by message
      setRecentActivity(old => {
        const merged = [entry, ...old]
        return merged.filter((v, i, a) => a.findIndex(x => x.message === v.message) === i)
      })

      // compute stats from updated approvals to avoid double-counting
      setStats(s => ({
        ...s,
        failedTransactions: updated.filter(p => p.status === "Failed").length,
        pendingDisbursements: updated.filter(p => p.status !== "Failed").length
      }))

      return updated
    })
  }

  function deletePendingApproval(index) {
    setPendingApprovals(prev => {
      const updated = prev.filter((_, i) => i !== index)
      setStats(s => ({
        ...s,
        pendingDisbursements: updated.filter(p => p.status !== "Failed").length
      }))
      return updated
    })
  }

  // Update full payee details (not just account)
  function updatePayeeDetails(index, newDetails) {
    setPayees(prev =>
      prev.map((p, i) =>
        i === index
          ? {
              ...p,
              name: newDetails.name,
              contact: newDetails.contact,
              method: newDetails.method,
              account: newDetails.account
            }
          : p
      )
    )
  }

  const value = {
    stats,
    recentActivity,
    pendingApprovals,
    payees,
    attachedFiles,
    setPayees,
    setAttachedFiles,
    addDisbursement,
    cancelDisbursement,
    markDisbursementFailed,
    deletePendingApproval,
    updatePayeeDetails
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
