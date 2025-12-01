import React, { createContext, useState, useEffect } from "react";
import { supabase } from "./lib/supabase";

export const AppContext = createContext();

export function AppProvider({ children }) {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [payees, setPayees] = useState([]);
  const [attachedFiles, setAttachedFiles] = useState({});
  const [selectedPayee, setSelectedPayee] = useState(null);
  const [currentCOA, setCurrentCOA] = useState({});
  const [currentPayee, setCurrentPayee] = useState(null);
  const [refCounter, setRefCounter] = useState(1);
  const [totalRequested, setTotalRequested] = useState(0);
  const [loading, setLoading] = useState(true);
  const [defaultCashierId, setDefaultCashierId] = useState(null);
  const [defaultAdminId, setDefaultAdminId] = useState(null);

  const [stats, setStats] = useState({
    totalDisbursedToday: 0,
    pendingDisbursements: 0,
    failedTransactions: 0
  });

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

  // Helper function to get vendor/payee name
  function getVendorName(vendor) {
    if (!vendor) return '';
    if (vendor.name) return vendor.name;
    return '';
  }

  // Load initial data from Supabase
  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    try {
      // Default IDs (not using admin/cashier tables in simple schema)
      setDefaultAdminId('default-admin');
      setDefaultCashierId('default-cashier');

      // Load payees (prioritize payees table - current structure)
      const { data: payeesData, error: payeesError } = await supabase
        .from('payees')
        .select('*')
        .order('created_at', { ascending: false });

      if (payeesError) {
        console.error('Error loading payees:', payeesError);
        setPayees([]);
      } else {
        const mappedPayees = (payeesData || []).map(p => ({
          ...p,
          id: p.id,
          name: p.name || '',
          contact: p.contact || '',
          tin: p.tin || '',
          address: p.address || '',
          contactPerson: p.contact_person || '',
          account: p.account || ''
        }));
        setPayees(mappedPayees);
      }

      // Load disbursements with relational join to payees
      const { data: disbursementsData, error: disbursementsError } = await supabase
        .from('disbursements')
        .select(`
          *,
          payee:payee_id (
            id,
            name,
            contact,
            tin,
            address,
            contact_person,
            account
          )
        `)
        .order('created_at', { ascending: false });

      if (disbursementsError) {
        console.error('Error loading disbursements:', disbursementsError);
        // Try without join if foreign key doesn't exist yet
        const { data: disbursementsDataSimple, error: disbursementsErrorSimple } = await supabase
          .from('disbursements')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (disbursementsErrorSimple) {
          console.error('Error loading disbursements (simple):', disbursementsErrorSimple);
          setPendingApprovals([]);
        } else {
          const mappedRequests = (disbursementsDataSimple || []).map(d => ({
            ...d,
            id: d.id,
            name: d.name || '',
            amount: d.amount,
            method: d.method,
            accountNumber: d.account_number,
            manualAccountNumber: d.manual_account_number,
            contact: d.contact || '',
            date: d.date,
            reason: d.reason,
            reference: d.reference,
            status: d.status || 'Pending'
          }));
          setPendingApprovals(mappedRequests);
        }
      } else {
        // Use relational data
        const mappedRequests = (disbursementsData || []).map(d => ({
          ...d,
          id: d.id,
          name: d.payee ? d.payee.name : (d.name || ''),
          amount: d.amount,
          method: d.method,
          accountNumber: d.account_number,
          manualAccountNumber: d.manual_account_number,
          contact: d.payee ? d.payee.contact : (d.contact || ''),
          date: d.date,
          reason: d.reason,
          reference: d.reference,
          status: d.status || 'Pending'
        }));
        setPendingApprovals(mappedRequests);
      }

      // Load recent activity
      const { data: activityData, error: activityError } = await supabase
        .from('recent_activity')
        .select('*')
        .order('date', { ascending: false })
        .limit(50);

      if (activityError) throw activityError;
      setRecentActivity(activityData || []);

      // Load stats for today
      const today = new Date().toISOString().split('T')[0];
      const { data: statsData, error: statsError } = await supabase
        .from('stats')
        .select('*')
        .eq('date', today)
        .single();

      if (statsError && statsError.code !== 'PGRST116') throw statsError;
      
      if (statsData) {
        setStats({
          totalDisbursedToday: Number(statsData.total_disbursed_today) || 0,
          pendingDisbursements: Number(statsData.pending_disbursements) || 0,
          failedTransactions: Number(statsData.failed_transactions) || 0
        });
        setRefCounter(statsData.ref_counter || 1);
        setTotalRequested(statsData.total_requested || 0);
      } else {
        // Initialize today's stats
        await supabase.from('stats').insert({
          date: today,
          total_disbursed_today: 0,
          pending_disbursements: 0,
          failed_transactions: 0,
          total_requested: 0,
          ref_counter: 1
        });
      }

      // Calculate pending disbursements from data
      const pendingCount = mappedRequests.filter(d => d.status === 'Pending').length;
      const failedCount = mappedRequests.filter(d => d.status === 'Failed').length;
      setStats(prev => ({
        ...prev,
        pendingDisbursements: pendingCount,
        failedTransactions: failedCount
      }));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addDisbursement(entry) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const currentTime = new Date().toTimeString().split(' ')[0];
      
      // Get or create today's stats
      let { data: statsData } = await supabase
        .from('stats')
        .select('ref_counter, total_requested')
        .eq('date', today)
        .single();

      if (!statsData) {
        const { data: newStats } = await supabase
          .from('stats')
          .insert({
            date: today,
            ref_counter: refCounter,
            total_requested: 0
          })
          .select()
          .single();
        statsData = newStats;
      }

      const newRefCounter = (statsData.ref_counter || refCounter) + 1;
      const reference = String(newRefCounter).padStart(5, "0");

      // Find or create payee (using payees table - old structure)
      let payeeData = null;
      const { data: existingPayee } = await supabase
        .from('payees')
        .select('*')
        .eq('name', entry.name.trim())
        .maybeSingle();

      if (!existingPayee) {
        // Create new payee
        const { data: newPayee, error: payeeError } = await supabase
          .from('payees')
          .insert({
            name: entry.name.trim(),
            contact: entry.contact || null,
            account: entry.account || null
          })
          .select()
          .single();
        
        if (payeeError) {
          throw new Error('Failed to create payee: ' + payeeError.message);
        }
        payeeData = newPayee;
      } else {
        payeeData = existingPayee;
        // Update contact if provided
        if (entry.contact && entry.contact !== existingPayee.contact) {
          await supabase
            .from('payees')
            .update({ contact: entry.contact })
            .eq('id', existingPayee.id);
        }
      }

      // Insert into disbursements table with payee_id foreign key
      const { data: newDisbursement, error: disbursementError } = await supabase
        .from('disbursements')
        .insert({
          name: entry.name,
          payee_id: payeeData.id, // Foreign key to payees
          method: entry.method,
          account_number: entry.accountNumber || null,
          manual_account_number: entry.manualAccountNumber || null,
          contact: entry.contact || null,
          amount: Number(entry.amount),
          date: entry.date || today,
          reason: entry.reason || null,
          reference: reference,
          status: 'Pending'
        })
        .select()
        .single();

      if (disbursementError) throw disbursementError;

      // Update stats
      await supabase
        .from('stats')
        .update({
          ref_counter: newRefCounter,
          total_requested: (statsData.total_requested || 0) + 1,
          pending_disbursements: pendingApprovals.filter(d => d.status === 'Pending').length + 1
        })
        .eq('date', today);

      setRefCounter(newRefCounter);
      setTotalRequested(prev => prev + 1);

      // Map to pendingApprovals format (old disbursements structure)
      const mappedRequest = {
        ...newDisbursement,
        id: newDisbursement.id,
        name: newDisbursement.name,
        amount: newDisbursement.amount,
        method: newDisbursement.method,
        accountNumber: newDisbursement.account_number,
        manualAccountNumber: newDisbursement.manual_account_number,
        contact: newDisbursement.contact || '',
        date: newDisbursement.date,
        reason: newDisbursement.reason,
        reference: newDisbursement.reference,
        status: newDisbursement.status
      };

      setPendingApprovals(prev => [...prev, mappedRequest]);
      setStats(prev => ({
        ...prev,
        pendingDisbursements: prev.pendingDisbursements + 1
      }));

      // Reload payees to include new payee
      await loadAllData();

      if (entry.file) {
        setAttachedFiles(prev => ({
          ...prev,
          [entry.name]: entry.file
        }));
      }
    } catch (error) {
      console.error('Error adding disbursement:', error);
      alert('Failed to add disbursement: ' + error.message);
    }
  }

  async function approveDisbursement(index) {
    try {
      const item = pendingApprovals[index];
      if (!item) return;

      const disbursementId = item.id;
      if (!disbursementId) {
        throw new Error('Disbursement ID is missing');
      }

      const amountNum = Number(item.amount);

      // Get charts of accounts
      const { data: coaData, error: coaError } = await supabase
        .from('charts_of_account')
        .select('*')
        .order('account_number');

      if (coaError) throw coaError;

      const creditNum = Number(item.accountNumber);
      const debitNum = Number(item.manualAccountNumber);

      // Update chart of accounts balances
      if (creditNum || debitNum) {
        for (const account of coaData || []) {
          if (account.account_number === creditNum) {
            await supabase
              .from('charts_of_account')
              .update({
                balance: (Number(account.balance) || 0) + amountNum
              })
              .eq('account_id', account.account_id);
          }
          if (account.account_number === debitNum) {
            await supabase
              .from('charts_of_account')
              .update({
                balance: (Number(account.balance) || 0) - amountNum
              })
              .eq('account_id', account.account_id);
          }
        }
      }

      // Update disbursement status to Approved
      const { error: updateError } = await supabase
        .from('disbursements')
        .update({ status: 'Approved' })
        .eq('id', disbursementId);

      if (updateError) throw updateError;

      // Update local state
      const updated = pendingApprovals.map((p, i) =>
        i === index ? { ...p, status: 'Approved' } : p
      );
      setPendingApprovals(updated);

      // Update stats
      const today = new Date().toISOString().split('T')[0];
      const pendingCount = updated.filter(p => p.status === 'Pending').length;
      
      await supabase
        .from('stats')
        .update({
          pending_disbursements: pendingCount,
          total_disbursed_today: (Number(stats.totalDisbursedToday) || 0) + amountNum
        })
        .eq('date', today);

      setStats(prev => ({
        ...prev,
        pendingDisbursements: pendingCount,
        totalDisbursedToday: (prev.totalDisbursedToday || 0) + amountNum
      }));

      // Add recent activity
      const message = `₱${item.amount} successfully disbursed to ${item.name}`;
      await supabase
        .from('recent_activity')
        .insert({
          message: message,
          date: new Date().toISOString()
        });

      await loadAllData();
    } catch (error) {
      console.error('Error approving disbursement:', error);
      alert('Failed to approve disbursement: ' + error.message);
    }
  }

  async function cancelDisbursement(index) {
    try {
      const item = pendingApprovals[index];
      if (!item) return;

      const disbursementId = item.id;
      if (!disbursementId) {
        throw new Error('Disbursement ID is missing');
      }

      const { error } = await supabase
        .from('disbursements')
        .delete()
        .eq('id', disbursementId);

      if (error) throw error;

      const updated = pendingApprovals.filter((_, i) => i !== index);
      setPendingApprovals(updated);

      const today = new Date().toISOString().split('T')[0];
      const pendingCount = updated.filter(p => p.status === 'Pending').length;
      
      await supabase
        .from('stats')
        .update({ pending_disbursements: pendingCount })
        .eq('date', today);

      setStats(prev => ({
        ...prev,
        pendingDisbursements: pendingCount
      }));
    } catch (error) {
      console.error('Error canceling disbursement:', error);
      alert('Failed to cancel disbursement: ' + error.message);
    }
  }

  async function updatePayeeCOA(payeeName, newCOA) {
    try {
      // In normalized schema, COA is global, not per vendor
      // But we'll maintain backward compatibility by storing vendor-specific COA data
      // This would require a vendor_coa junction table, but for now we'll use charts_of_account
      // and update balances based on vendor transactions
      
      // For now, just update the current COA state
      if (currentPayee?.name === payeeName) {
        setCurrentCOA(newCOA);
      }
    } catch (error) {
      console.error('Error updating COA:', error);
      alert('Failed to update chart of accounts: ' + error.message);
    }
  }

  async function getPayeeCOA(payeeName) {
    try {
      // Get global charts of accounts
      const { data, error } = await supabase
        .from('charts_of_account')
        .select('*')
        .order('account_number');

      if (error) throw error;

      if (!data || data.length === 0) return null;

      const formattedCOA = {
        Assets: [],
        Liabilities: [],
        Revenues: [],
        Expenses: []
      };

      data.forEach(acc => {
        if (!formattedCOA[acc.section]) formattedCOA[acc.section] = [];
        formattedCOA[acc.section].push({
          number: acc.account_number,
          name: acc.account_name,
          debit: 0, // In normalized schema, we track balance, not debit/credit per vendor
          credit: 0,
          balance: Number(acc.balance) || 0
        });
      });

      return formattedCOA;
    } catch (error) {
      console.error('Error getting COA:', error);
      return null;
    }
  }

  async function markDisbursementFailed(index) {
    try {
      const item = pendingApprovals[index];
      if (!item || item.status === 'Failed') return;

      const disbursementId = item.id;
      if (!disbursementId) {
        throw new Error('Disbursement ID is missing');
      }

      const { error } = await supabase
        .from('disbursements')
        .update({ status: 'Failed' })
        .eq('id', disbursementId);

      if (error) throw error;

      const updated = pendingApprovals.map((p, i) =>
        i === index ? { ...p, status: 'Failed' } : p
      );
      setPendingApprovals(updated);

      const message = `₱${item.amount} disbursement marked as failed for ${item.name}`;
      await supabase
        .from('recent_activity')
        .insert({
          message: message,
          date: new Date().toISOString()
        });

      const today = new Date().toISOString().split('T')[0];
      const pendingCount = updated.filter(p => p.status === 'Pending').length;
      const failedCount = updated.filter(p => p.status === 'Failed').length;

      await supabase
        .from('stats')
        .update({
          pending_disbursements: pendingCount,
          failed_transactions: failedCount
        })
        .eq('date', today);

      setStats(prev => ({
        ...prev,
        pendingDisbursements: pendingCount,
        failedTransactions: failedCount
      }));
    } catch (error) {
      console.error('Error marking disbursement failed:', error);
      alert('Failed to mark disbursement as failed: ' + error.message);
    }
  }

  async function deletePendingApproval(index) {
    try {
      const item = pendingApprovals[index];
      if (!item) return;

      const disbursementId = item.id;
      if (!disbursementId) {
        throw new Error('Disbursement ID is missing');
      }

      const { error } = await supabase
        .from('disbursements')
        .delete()
        .eq('id', disbursementId);

      if (error) throw error;

      const updated = pendingApprovals.filter((_, i) => i !== index);
      setPendingApprovals(updated);

      const today = new Date().toISOString().split('T')[0];
      const pendingCount = updated.filter(p => p.status === 'Pending').length;

      await supabase
        .from('stats')
        .update({ pending_disbursements: pendingCount })
        .eq('date', today);

      setStats(prev => ({
        ...prev,
        pendingDisbursements: pendingCount
      }));
    } catch (error) {
      console.error('Error deleting disbursement:', error);
      alert('Failed to delete disbursement: ' + error.message);
    }
  }

  async function updatePayeeDetails(index, newDetails) {
    try {
      const payee = payees[index];
      if (!payee) return;

      const payeeId = payee.id;

      // Update payees table
      const { data: updatedPayee, error } = await supabase
        .from('payees')
        .update({
          name: newDetails.name,
          contact: newDetails.contact,
          account: newDetails.account,
          tin: newDetails.tin,
          address: newDetails.address,
          contact_person: newDetails.contactPerson
        })
        .eq('id', payeeId)
        .select()
        .single();

      if (error) throw error;

      // Map to consistent format
      const mappedPayee = {
        ...updatedPayee,
        id: updatedPayee.id,
        name: updatedPayee.name || '',
        contact: updatedPayee.contact || '',
        tin: updatedPayee.tin || '',
        address: updatedPayee.address || '',
        contactPerson: updatedPayee.contact_person || '',
        account: updatedPayee.account || ''
      };

      setPayees(prev => prev.map((p, i) => i === index ? mappedPayee : p));
    } catch (error) {
      console.error('Error updating payee:', error);
      alert('Failed to update payee: ' + error.message);
    }
  }

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
    loading,
    loadAllData
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
