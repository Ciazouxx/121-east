import React, { createContext, useState } from "react";

export const AppContext = createContext();

export function AppProvider({ children }) {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [payees, setPayees] = useState([]);
  const [attachedFiles, setAttachedFiles] = useState({});
  const [selectedPayee, setSelectedPayee] = useState(null);
  const [payeeCOA, setPayeeCOA] = useState({});
  const [currentCOA, setCurrentCOA] = useState({});
  const [currentPayee, setCurrentPayee] = useState(null);
  const [refCounter, setRefCounter] = useState(1)
  const [totalRequested, setTotalRequested] = useState(0);

  const [stats, setStats] = useState({
    totalDisbursedToday: 0,
    pendingDisbursements: 0,
    failedTransactions: 0
  });

  function addDisbursement(entry) {
    const withRef = { ...entry, reference: String(refCounter).padStart(5, "0") }
    setRefCounter(prev => prev + 1);

    setTotalRequested(prev => prev + 1);

    setPendingApprovals(prev => {
      const updated = [...prev, { ...withRef, status: "Pending" }];
      setStats(s => ({
        ...s,
        pendingDisbursements: updated.filter(p => p.status === "Pending").length
      }));
      return updated;
    });

    const payeeExists = payees.find(p => p.name === entry.name);

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
      ]);
    } else {
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
      );
    }

    if (entry.file) {
      setAttachedFiles(prev => ({
        ...prev,
        [entry.name]: entry.file
      }));
    }
  }

  function approveDisbursement(index) {
    const item = pendingApprovals[index];
    if (!item) return;

    const amountNum = Number(item.amount);
    const payeeName = item.name;
    const payeeChart = getPayeeCOA(payeeName);
    const baseCOA = payeeChart
      ? JSON.parse(JSON.stringify(payeeChart))
      : JSON.parse(JSON.stringify(defaultCOA));

    const creditNum = Number(item.accountNumber);
    const debitNum = Number(item.manualAccountNumber);

    // Apply credit and debit
    Object.keys(baseCOA).forEach(section => {
      baseCOA[section] = baseCOA[section].map(acc => {
        if (acc.number === creditNum) return { ...acc, credit: (Number(acc.credit) || 0) + amountNum };
        if (acc.number === debitNum) return { ...acc, debit: (Number(acc.debit) || 0) + amountNum };
        return acc;
      });
    });

    updatePayeeCOA(payeeName, baseCOA);

    // Update pending approvals
    const updated = pendingApprovals.map((p, i) =>
      i === index ? { ...p, status: "Approved" } : p
    );
    setPendingApprovals(updated);

    // Update stats once
    setStats(s => ({
      ...s,
      pendingDisbursements: updated.filter(p => p.status === "Pending").length,
      totalDisbursedToday: s.totalDisbursedToday + amountNum
    }));

    // Update recent activity
    const message = `₱${item.amount} successfully disbursed to ${item.name}`;
    setRecentActivity(old => [{ message, date: new Date().toISOString() }, ...old]);
  }

  function cancelDisbursement(index) {
    setPendingApprovals(prev => {
      const updated = prev.filter((_, i) => i !== index);
      setStats(s => ({
        ...s,
        pendingDisbursements: updated.filter(p => p.status === "Pending").length
      }));
      return updated;
    });
  }

  function updatePayeeCOA(payeeName, newCOA) {
    setPayeeCOA(prev => ({
      ...prev,
      [payeeName]: newCOA
    }));
    if (currentPayee?.name === payeeName) setCurrentCOA(newCOA);
  }

  function getPayeeCOA(payeeName) {
    return payeeCOA[payeeName] || null;
  }

  function markDisbursementFailed(index) {
    setPendingApprovals(prev => {
      const item = prev[index];
      if (!item || item.status === "Failed") return prev;

      const updated = prev.map((p, i) => (i === index ? { ...p, status: "Failed" } : p));

      const message = `₱${item.amount} disbursement cancelled for ${item.name}`;
      const entry = { message, date: new Date().toISOString() };

      setRecentActivity(old => {
        const merged = [entry, ...old];
        return merged.filter((v, i, a) => a.findIndex(x => x.message === v.message) === i);
      });

      setStats(s => ({
        ...s,
        failedTransactions: updated.filter(p => p.status === "Failed").length,
        pendingDisbursements: updated.filter(p => p.status === "Pending").length
      }));

      return updated;
    });
  }

  function deletePendingApproval(index) {
    setPendingApprovals(prev => {
      const updated = prev.filter((_, i) => i !== index);
      setStats(s => ({
        ...s,
        pendingDisbursements: updated.filter(p => p.status === "Pending").length
      }));
      return updated;
    });
  }

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
    );
  }

  const defaultCOA = {
    Assets: [
      { number: 1001, name: "Cash on Hand", debit: 0, credit: 0 },
      { number: 1002, name: "Cash In Bank", debit: 0, credit: 0 },
      { number: 1003, name: "Online Payment Account", debit: 0, credit: 0 },
      { number: 1004, name: "Checks on Hand", debit: 0, credit: 0 }
    ],
    Liabilities: [
      { number: 2001, name: "Accounts Payable", debit: 0, credit: 0 }
    ],
    Revenues: [
      { number: 3001, name: "Services", debit: 0, credit: 0 }
    ],
    Expenses: [
      { number: 4001, name: "Materials", debit: 0, credit: 0 },
      { number: 4002, name: "Labor", debit: 0, credit: 0 },
      { number: 4003, name: "Rent", debit: 0, credit: 0 },
      { number: 4004, name: "Miscellaneous", debit: 0, credit: 0 }
    ]
  };

  const value = {
    stats,
    recentActivity,
    pendingApprovals,
    payees,
    attachedFiles,
    selectedPayee,
    setSelectedPayee,
    setPayees,
    setAttachedFiles,
    payeeCOA,
    updatePayeeCOA,
    getPayeeCOA,
    addDisbursement,
    cancelDisbursement,
    markDisbursementFailed,
    deletePendingApproval,
    updatePayeeDetails,
    currentPayee,
    setCurrentPayee,
    currentCOA,
    setCurrentCOA,
    defaultCOA,
    setRecentActivity,
    setPendingApprovals,
    approveDisbursement,
    refCounter,
    setRefCounter,
    setTotalRequested,
    totalRequested,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
