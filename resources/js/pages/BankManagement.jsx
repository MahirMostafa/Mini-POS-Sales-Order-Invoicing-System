import React, { useState, useEffect } from 'react';
import api from '../api/client';
import Swal from 'sweetalert2';
import {
  Building2,
  Plus,
  Minus,
  Edit2,
  Trash2,
  RefreshCw,
  Wallet,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  Calendar,
  X,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Check,
  ChevronRight,
  Power
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BankManagement() {
  const { user, role, hasPermission } = useAuth();
  const currency = '৳';

  // Granular Permission Gates
  const canView = hasPermission(['view-banks', 'manage-banks', 'view-bank-book', 'view-accounting-dashboard']);
  const canCreate = hasPermission(['create-banks', 'manage-banks']);
  const canEdit = hasPermission(['edit-banks', 'manage-banks']);
  const canDelete = hasPermission(['delete-banks', 'manage-banks']);
  const canDeposit = hasPermission(['deposit-banks', 'manage-banks']);
  const canWithdraw = hasPermission(['withdraw-banks', 'manage-banks']);
  const canViewStatement = hasPermission(['view-bank-statements', 'view-bank-book', 'manage-banks']);

  // Bank Data States
  const [banks, setBanks] = useState([]);
  const [summary, setSummary] = useState({ total_bank_balance: 0, total_banks_count: 0, active_banks_count: 0 });
  const [chartOfAccounts, setChartOfAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddBankModalOpen, setIsAddBankModalOpen] = useState(false);
  const [isEditBankModalOpen, setIsEditBankModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);
  const [statementData, setStatementData] = useState(null);
  const [loadingStatement, setLoadingStatement] = useState(false);
  const [submittingModal, setSubmittingModal] = useState(false);

  // Bank Form State (Add / Edit)
  const [bankForm, setBankForm] = useState({
    id: null,
    bank_name: '',
    account_name: '',
    account_number: '',
    branch_name: '',
    routing_number: '',
    opening_balance: 0,
    is_active: true,
    notes: '',
  });

  // Deposit Form State (Add Money to Bank)
  const [depositForm, setDepositForm] = useState({
    bank_id: '',
    amount: '',
    source_type: 'cash', // 'cash' | 'capital' | 'income' | 'bank_transfer' | 'custom'
    from_bank_account_id: '',
    account_id: '',
    entry_date: new Date().toISOString().split('T')[0],
    note: '',
    reference: '',
  });

  // Withdraw / Transfer Form State
  const [withdrawForm, setWithdrawForm] = useState({
    bank_id: '',
    amount: '',
    destination_type: 'cash', // 'cash' | 'expense' | 'drawing' | 'bank_transfer' | 'custom'
    to_bank_account_id: '',
    account_id: '',
    entry_date: new Date().toISOString().split('T')[0],
    note: '',
    reference: '',
  });

  // Fetch all banks and summary
  const fetchBanks = async () => {
    setLoading(true);
    try {
      const [banksRes, coaRes] = await Promise.all([
        api.get('/bank-accounts'),
        api.get('/accounting/chart-of-accounts'),
      ]);

      if (banksRes.data.success) {
        setBanks(banksRes.data.banks || []);
        setSummary(banksRes.data.summary || { total_bank_balance: 0, total_banks_count: 0, active_banks_count: 0 });
      }
      if (coaRes.data.success) {
        setChartOfAccounts(coaRes.data.accounts || coaRes.data.chart_of_accounts || []);
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load bank accounts.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  // Open Add Bank Modal
  const handleOpenAddBank = () => {
    setBankForm({
      id: null,
      bank_name: '',
      account_name: '',
      account_number: '',
      branch_name: '',
      routing_number: '',
      opening_balance: 0,
      is_active: true,
      notes: '',
    });
    setIsAddBankModalOpen(true);
  };

  // Open Edit Bank Modal
  const handleOpenEditBank = (b) => {
    setBankForm({
      id: b.id,
      bank_name: b.bank_name,
      account_name: b.account_name,
      account_number: b.account_number,
      branch_name: b.branch_name || '',
      routing_number: b.routing_number || '',
      opening_balance: parseFloat(b.opening_balance || 0),
      is_active: Boolean(b.is_active),
      notes: b.notes || '',
    });
    setIsEditBankModalOpen(true);
  };

  // Save New or Updated Bank
  const handleSaveBank = async (e) => {
    e.preventDefault();
    setSubmittingModal(true);
    try {
      if (bankForm.id) {
        const res = await api.put(`/bank-accounts/${bankForm.id}`, bankForm);
        Swal.fire({
          icon: 'success',
          title: 'Bank Account Updated',
          text: res.data.message,
          timer: 1500,
          showConfirmButton: false,
        });
        setIsEditBankModalOpen(false);
      } else {
        const res = await api.post('/bank-accounts', bankForm);
        Swal.fire({
          icon: 'success',
          title: 'Bank Registered!',
          text: res.data.message,
          timer: 1500,
          showConfirmButton: false,
        });
        setIsAddBankModalOpen(false);
      }
      fetchBanks();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: err.response?.data?.message || 'Failed to save bank account.',
      });
    } finally {
      setSubmittingModal(false);
    }
  };

  // Toggle Bank Status (Active / Inactive)
  const handleToggleStatus = async (bank) => {
    try {
      const res = await api.post(`/bank-accounts/${bank.id}/toggle-status`);
      Swal.fire({
        icon: 'success',
        title: 'Status Changed',
        text: res.data.message,
        timer: 1200,
        showConfirmButton: false,
      });
      fetchBanks();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Could not change bank account status.' });
    }
  };

  // Delete / Deactivate Bank
  const handleDeleteBank = async (bank) => {
    const result = await Swal.fire({
      title: `Delete Bank "${bank.bank_name}"?`,
      text: 'If this bank has previous transactions, it will be safely deactivated to preserve accounting records.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete / Deactivate',
      confirmButtonColor: '#e11d48',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      try {
        const res = await api.delete(`/bank-accounts/${bank.id}`);
        Swal.fire({
          icon: 'success',
          title: 'Bank Account Removed',
          text: res.data.message,
          timer: 1500,
          showConfirmButton: false,
        });
        fetchBanks();
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Delete Failed',
          text: err.response?.data?.message || 'Could not delete bank account.',
        });
      }
    }
  };

  // Open Deposit (Add Money) Modal for specific or general bank
  const handleOpenDepositModal = (bank = null) => {
    const defaultBankId = bank ? bank.id : (banks.length > 0 ? banks[0].id : '');
    const otherBanks = banks.filter((b) => b.id !== defaultBankId);
    setDepositForm({
      bank_id: defaultBankId,
      amount: '',
      source_type: 'cash',
      from_bank_account_id: otherBanks.length > 0 ? otherBanks[0].id : '',
      account_id: '',
      entry_date: new Date().toISOString().split('T')[0],
      note: '',
      reference: '',
    });
    setIsDepositModalOpen(true);
  };

  // Submit Deposit (Add Money) to Bank
  const handleSubmitDeposit = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(depositForm.amount);
    if (!numAmount || numAmount <= 0) {
      Swal.fire({ icon: 'warning', title: 'Invalid Amount', text: 'Please enter a valid amount.' });
      return;
    }
    if (!depositForm.bank_id) {
      Swal.fire({ icon: 'warning', title: 'Bank Required', text: 'Please select a receiving bank account.' });
      return;
    }

    setSubmittingModal(true);
    try {
      const res = await api.post(`/bank-accounts/${depositForm.bank_id}/add-money`, depositForm);
      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Money Deposited!',
          text: res.data.message,
          timer: 2000,
          showConfirmButton: false,
        });
        setIsDepositModalOpen(false);
        fetchBanks();
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Deposit Failed',
        text: err.response?.data?.message || 'Failed to deposit money to bank.',
      });
    } finally {
      setSubmittingModal(false);
    }
  };

  // Open Withdraw / Transfer Modal
  const handleOpenWithdrawModal = (bank = null) => {
    const defaultBankId = bank ? bank.id : (banks.length > 0 ? banks[0].id : '');
    const otherBanks = banks.filter((b) => b.id !== defaultBankId);
    setWithdrawForm({
      bank_id: defaultBankId,
      amount: '',
      destination_type: 'cash',
      to_bank_account_id: otherBanks.length > 0 ? otherBanks[0].id : '',
      account_id: '',
      entry_date: new Date().toISOString().split('T')[0],
      note: '',
      reference: '',
    });
    setIsWithdrawModalOpen(true);
  };

  // Submit Withdraw / Transfer from Bank
  const handleSubmitWithdraw = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(withdrawForm.amount);
    if (!numAmount || numAmount <= 0) {
      Swal.fire({ icon: 'warning', title: 'Invalid Amount', text: 'Please enter a valid amount.' });
      return;
    }
    if (!withdrawForm.bank_id) {
      Swal.fire({ icon: 'warning', title: 'Bank Required', text: 'Please select a source bank account.' });
      return;
    }

    const currentBank = banks.find((b) => b.id === parseInt(withdrawForm.bank_id));
    const currentBalance = parseFloat(currentBank?.current_balance || 0);

    if (numAmount > currentBalance) {
      const confirm = await Swal.fire({
        title: 'Negative Bank Balance Warning',
        text: `Withdrawal amount (৳${numAmount.toFixed(2)}) exceeds current cleared balance (৳${currentBalance.toFixed(2)}). Do you want to proceed?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, Proceed',
        confirmButtonColor: '#4f46e5',
      });
      if (!confirm.isConfirmed) return;
    }

    setSubmittingModal(true);
    try {
      const res = await api.post(`/bank-accounts/${withdrawForm.bank_id}/withdraw-money`, withdrawForm);
      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Withdrawal / Transfer Completed!',
          text: res.data.message,
          timer: 2000,
          showConfirmButton: false,
        });
        setIsWithdrawModalOpen(false);
        fetchBanks();
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Withdrawal Failed',
        text: err.response?.data?.message || 'Failed to record bank outflow.',
      });
    } finally {
      setSubmittingModal(false);
    }
  };

  // Open Statement / Ledger Modal for a Bank
  const handleOpenStatement = async (bank) => {
    setSelectedBank(bank);
    setIsStatementModalOpen(true);
    setLoadingStatement(true);
    try {
      const res = await api.get(`/accounting/bank-book?bank_account_id=${bank.id}`);
      if (res.data.success) {
        setStatementData(res.data.bank_book);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStatement(false);
    }
  };

  const filteredBanks = banks.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.bank_name?.toLowerCase().includes(q) ||
      b.account_name?.toLowerCase().includes(q) ||
      b.account_number?.toLowerCase().includes(q) ||
      b.branch_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Top Banner & Control Center */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>Corporate Banking & Financial Accounts</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Bank Accounts Management</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Manage corporate bank accounts (DBBL, City Bank, bKash, etc.), add money / deposits, process transfers, and inspect statements with double-entry balance tracking.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {canCreate && (
            <button
              type="button"
              onClick={handleOpenAddBank}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all hover:scale-102"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Bank</span>
            </button>
          )}

          {canDeposit && (
            <button
              type="button"
              onClick={() => handleOpenDepositModal()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all hover:scale-102"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Add Money (Deposit)</span>
            </button>
          )}

          {canWithdraw && (
            <button
              type="button"
              onClick={() => handleOpenWithdrawModal()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all hover:scale-102"
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>Withdraw / Transfer</span>
            </button>
          )}

          <button
            type="button"
            onClick={fetchBanks}
            disabled={loading}
            className="p-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refresh Bank Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Bank Balance */}
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900 p-5 rounded-3xl text-white shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
              Total Cleared Bank Funds
            </span>
            <span className="p-1.5 rounded-xl bg-white/10 text-indigo-300">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
              {currency}{Number(summary.total_bank_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5">Sum of all active bank balances</div>
          </div>
          <div className="text-[10px] font-bold text-indigo-300 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Automatic Double-Entry COA Linked</span>
          </div>
        </div>

        {/* Active Accounts */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active Bank Accounts
            </span>
            <span className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {summary.active_banks_count || 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              of {summary.total_banks_count || 0} registered institutions
            </div>
          </div>
          <div className="text-[10px] font-semibold text-emerald-600">
            Available at POS & Checkout counters
          </div>
        </div>

        {/* Search & Filter Bank Directory */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Search Bank Registry
            </span>
            <span className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Search className="w-4 h-4" />
            </span>
          </div>
          <div className="my-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bank name, account #, branch..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50/50 outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
          <div className="text-[10px] text-slate-400">
            {filteredBanks.length} accounts matching criteria
          </div>
        </div>
      </div>

      {/* Bank Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBanks.map((b) => {
          const bal = parseFloat(b.current_balance || 0);
          return (
            <div
              key={b.id}
              className={`bg-white rounded-3xl border p-6 shadow-xs flex flex-col justify-between space-y-4 transition-all hover:shadow-md ${
                b.is_active ? 'border-slate-200' : 'border-slate-200/60 opacity-70 bg-slate-50/40'
              }`}
            >
              {/* Card Top */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-base text-slate-900 tracking-tight">{b.bank_name}</h4>
                      <p className="text-xs text-slate-500 font-medium">{b.account_name}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleStatus(b)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                      b.is_active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                    }`}
                    title="Toggle Active Status"
                  >
                    {b.is_active ? 'Active' : 'Inactive'}
                  </button>
                </div>

                {/* Account Details Box */}
                <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Account Number:</span>
                    <span className="font-mono font-bold text-slate-900">{b.account_number}</span>
                  </div>
                  {b.branch_name && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Branch:</span>
                      <span className="font-medium text-slate-700">{b.branch_name}</span>
                    </div>
                  )}
                  {b.chart_of_account && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Linked COA Head:</span>
                      <span className="font-mono text-indigo-600 font-bold">
                        {b.chart_of_account.account_code || b.chart_of_account.code} ({b.chart_of_account.account_name || b.chart_of_account.name})
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
                    <span>Opening Balance:</span>
                    <span className="font-mono font-medium text-slate-600">
                      {currency}{Number(b.opening_balance || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cleared Balance */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Current Cleared Balance</span>
                <div className="text-2xl font-black font-mono text-slate-900 mt-0.5">
                  <span className={bal >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                    {currency}{bal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                {canDeposit && (
                  <button
                    type="button"
                    onClick={() => handleOpenDepositModal(b)}
                    className="flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Money</span>
                  </button>
                )}

                {canWithdraw && (
                  <button
                    type="button"
                    onClick={() => handleOpenWithdrawModal(b)}
                    className={`flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors ${
                      !canDeposit ? 'col-span-2' : ''
                    }`}
                  >
                    <Minus className="w-3.5 h-3.5" />
                    <span>Withdraw</span>
                  </button>
                )}

                {canViewStatement && (
                  <button
                    type="button"
                    onClick={() => handleOpenStatement(b)}
                    className="col-span-2 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Full Statement & Ledger</span>
                  </button>
                )}

                {(canEdit || canDelete) && (
                  <div className="col-span-2 flex items-center justify-end gap-2 pt-1">
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditBank(b)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Edit Bank Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDeleteBank(b)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Bank Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredBanks.length === 0 && (
        <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center text-slate-400">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="font-bold text-slate-700 text-sm">No bank accounts found</p>
          <p className="text-xs text-slate-400 mt-1">Click "Add New Bank" to register a corporate bank account.</p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT BANK ACCOUNT                                            */}
      {/* ========================================================================= */}
      {(isAddBankModalOpen || isEditBankModalOpen) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-indigo-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {bankForm.id ? 'Edit Bank Account Details' : 'Register New Bank Account'}
                  </h3>
                  <p className="text-[10px] text-slate-500">Corporate Banking & Chart of Accounts Integration</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddBankModalOpen(false);
                  setIsEditBankModalOpen(false);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBank} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bank / Institution Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dutch-Bangla Bank Ltd."
                  value={bankForm.bank_name}
                  onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Holder / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Retail POS Operating Account"
                  value={bankForm.account_name}
                  onChange={(e) => setBankForm({ ...bankForm, account_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 115.120.98765"
                    value={bankForm.account_number}
                    onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Branch Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Banani Branch"
                    value={bankForm.branch_name}
                    onChange={(e) => setBankForm({ ...bankForm, branch_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Opening Balance (৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={bankForm.opening_balance}
                    onChange={(e) => setBankForm({ ...bankForm, opening_balance: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold font-mono text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Routing Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 09027163"
                    value={bankForm.routing_number}
                    onChange={(e) => setBankForm({ ...bankForm, routing_number: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Remarks</label>
                <textarea
                  rows="2"
                  placeholder="Additional branch notes or contacts"
                  value={bankForm.notes}
                  onChange={(e) => setBankForm({ ...bankForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddBankModalOpen(false);
                    setIsEditBankModalOpen(false);
                  }}
                  disabled={submittingModal}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingModal}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submittingModal ? 'Saving...' : bankForm.id ? 'Update Bank' : 'Create Bank'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD MONEY (DEPOSIT) TO BANK                                        */}
      {/* ========================================================================= */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Deposit / Add Money to Bank</h3>
                  <p className="text-[10px] text-slate-500">Record cash deposits, capital additions, or bank transfers</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDepositModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitDeposit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Receiving Bank Account *</label>
                <select
                  value={depositForm.bank_id}
                  onChange={(e) => setDepositForm({ ...depositForm, bank_id: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">-- Choose Target Bank --</option>
                  {banks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bank_name} - {b.account_name} ({b.account_number}) • Bal: {currency}{parseFloat(b.current_balance || 0).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Source of Funds *</label>
                <select
                  value={depositForm.source_type}
                  onChange={(e) => setDepositForm({ ...depositForm, source_type: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="cash">Cash in Hand / Drawer (Head 1010)</option>
                  <option value="capital">Owner Capital Injection (Head 3010)</option>
                  <option value="income">Direct Income / Digital Receipt (Head 4020)</option>
                  <option value="bank_transfer">Inter-Bank Transfer (From Another Bank)</option>
                  <option value="custom">Other Custom Chart of Accounts Head</option>
                </select>
              </div>

              {/* Inter-Bank Source */}
              {depositForm.source_type === 'bank_transfer' && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-1.5 animate-in fade-in duration-150">
                  <label className="block text-xs font-bold text-indigo-950">Select Source Bank Account *</label>
                  <select
                    value={depositForm.from_bank_account_id}
                    onChange={(e) => setDepositForm({ ...depositForm, from_bank_account_id: e.target.value })}
                    required={depositForm.source_type === 'bank_transfer'}
                    className="w-full px-3 py-2 rounded-xl border border-indigo-300 text-xs text-slate-900 bg-white font-medium outline-none"
                  >
                    <option value="">-- Select Source Bank --</option>
                    {banks
                      .filter((b) => b.id !== parseInt(depositForm.bank_id))
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bank_name} ({b.account_number}) • Bal: ৳{parseFloat(b.current_balance || 0).toFixed(2)}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Custom Head Selection */}
              {depositForm.source_type === 'custom' && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Select Counterpart Head *</label>
                  <select
                    value={depositForm.account_id}
                    onChange={(e) => setDepositForm({ ...depositForm, account_id: e.target.value })}
                    required={depositForm.source_type === 'custom'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white outline-none"
                  >
                    <option value="">-- Choose Account --</option>
                    {chartOfAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code || a.account_code} - {a.name || a.account_name} ({a.type || a.account_type})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Deposit Amount (৳) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={depositForm.amount}
                    onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={depositForm.entry_date}
                    onChange={(e) => setDepositForm({ ...depositForm, entry_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description / Memo *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deposited daily POS cash collection into DBBL"
                  value={depositForm.note}
                  onChange={(e) => setDepositForm({ ...depositForm, note: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deposit Slip / Check # (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Deposit Slip #59201"
                  value={depositForm.reference}
                  onChange={(e) => setDepositForm({ ...depositForm, reference: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDepositModalOpen(false)}
                  disabled={submittingModal}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingModal}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submittingModal ? 'Recording...' : 'Confirm & Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: WITHDRAW / TRANSFER FROM BANK                                      */}
      {/* ========================================================================= */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-sm">
                  <ArrowDownRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Withdraw / Transfer Bank Funds</h3>
                  <p className="text-[10px] text-slate-500">Withdraw to cash drawer, pay operating expense, or transfer</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWithdrawModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitWithdraw} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Source Bank Account *</label>
                <select
                  value={withdrawForm.bank_id}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, bank_id: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white outline-none focus:ring-2 focus:ring-rose-500/20"
                >
                  <option value="">-- Choose Source Bank --</option>
                  {banks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bank_name} - {b.account_name} ({b.account_number}) • Bal: {currency}{parseFloat(b.current_balance || 0).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payout Destination *</label>
                <select
                  value={withdrawForm.destination_type}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, destination_type: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-rose-500/20"
                >
                  <option value="cash">Withdraw to Cash in Hand / Drawer (Head 1010)</option>
                  <option value="expense">Direct Bank Operating Expense (Head 5020)</option>
                  <option value="drawing">Owner Capital Drawing (Head 3010)</option>
                  <option value="bank_transfer">Transfer to Another Bank Account</option>
                  <option value="custom">Other Custom Chart of Accounts Head</option>
                </select>
              </div>

              {/* Target Bank for transfer */}
              {withdrawForm.destination_type === 'bank_transfer' && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-1.5 animate-in fade-in duration-150">
                  <label className="block text-xs font-bold text-indigo-950">Select Destination Bank Account *</label>
                  <select
                    value={withdrawForm.to_bank_account_id}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, to_bank_account_id: e.target.value })}
                    required={withdrawForm.destination_type === 'bank_transfer'}
                    className="w-full px-3 py-2 rounded-xl border border-indigo-300 text-xs text-slate-900 bg-white font-medium outline-none"
                  >
                    <option value="">-- Select Target Bank --</option>
                    {banks
                      .filter((b) => b.id !== parseInt(withdrawForm.bank_id))
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bank_name} ({b.account_number}) • Bal: ৳{parseFloat(b.current_balance || 0).toFixed(2)}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Custom / Expense Head Selection */}
              {(withdrawForm.destination_type === 'custom' || withdrawForm.destination_type === 'expense') && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Select Expense / Payout Account Head *</label>
                  <select
                    value={withdrawForm.account_id}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, account_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white outline-none"
                  >
                    <option value="">-- Choose Account (Default: 5020 Operating Expense) --</option>
                    {chartOfAccounts
                      .filter((a) => (a.type || a.account_type || '').toLowerCase() === 'expense' || withdrawForm.destination_type === 'custom')
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.code || a.account_code} - {a.name || a.account_name} ({a.type || a.account_type})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amount (৳) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={withdrawForm.amount}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-rose-500/20 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={withdrawForm.entry_date}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, entry_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description / Memo *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Withdrawn cash for petty store float / Vendor bill payment"
                  value={withdrawForm.note}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, note: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Check / Ref # (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Check #94821"
                  value={withdrawForm.reference}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, reference: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  disabled={submittingModal}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingModal}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submittingModal ? 'Recording...' : 'Confirm & Withdraw'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BANK STATEMENT / LEDGER VIEWER                                      */}
      {/* ========================================================================= */}
      {isStatementModalOpen && selectedBank && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/30 flex items-center justify-center text-indigo-300">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base">{selectedBank.bank_name} • Statement</h3>
                  <p className="text-xs text-slate-400">
                    Account: <span className="font-mono font-bold text-slate-200">{selectedBank.account_number}</span> ({selectedBank.account_name})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsStatementModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Statement Summary Bar */}
            {statementData && (
              <div className="bg-slate-50 p-4 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Opening Balance</span>
                  <div className="font-bold text-slate-800 text-sm font-mono mt-0.5">
                    {currency}{Number(statementData.opening_balance || 0).toFixed(2)}
                  </div>
                </div>
                <div>
                  <span className="text-emerald-600 font-bold uppercase text-[10px]">Total Deposits (Dr)</span>
                  <div className="font-bold text-emerald-600 text-sm font-mono mt-0.5">
                    +{currency}{Number(statementData.total_deposits || 0).toFixed(2)}
                  </div>
                </div>
                <div>
                  <span className="text-rose-600 font-bold uppercase text-[10px]">Total Withdrawals (Cr)</span>
                  <div className="font-bold text-rose-600 text-sm font-mono mt-0.5">
                    -{currency}{Number(statementData.total_withdrawals || 0).toFixed(2)}
                  </div>
                </div>
                <div>
                  <span className="text-indigo-600 font-bold uppercase text-[10px]">Current Cleared Balance</span>
                  <div className="font-black text-indigo-600 text-base font-mono mt-0.5">
                    {currency}{Number(statementData.closing_balance || 0).toFixed(2)}
                  </div>
                </div>
              </div>
            )}

            {/* Statement Table */}
            <div className="p-6 overflow-y-auto flex-1">
              {loadingStatement ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
                  <span>Loading bank statement...</span>
                </div>
              ) : (!statementData?.entries || statementData.entries.length === 0) ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p>No transactions found for this bank account.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Voucher / Ref #</th>
                      <th className="py-3 px-4">Particulars / Source</th>
                      <th className="py-3 px-4">Description / Memo</th>
                      <th className="py-3 px-4 text-right">Deposit (Dr)</th>
                      <th className="py-3 px-4 text-right">Withdrawal (Cr)</th>
                      <th className="py-3 px-4 text-right">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {statementData.entries.map((row, idx) => {
                      const debit = Number(row.debit ?? row.deposit ?? 0);
                      const credit = Number(row.credit ?? row.withdrawal ?? 0);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{row.date}</td>
                          <td className="py-3 px-4 font-mono font-bold text-indigo-600 whitespace-nowrap">
                            {row.voucher_no || row.entry_number}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">{row.particulars || 'Bank Head'}</td>
                          <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{row.description}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">
                            {debit > 0 ? `+${currency}${debit.toFixed(2)}` : '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
                            {credit > 0 ? `-${currency}${credit.toFixed(2)}` : '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black text-slate-900 whitespace-nowrap">
                            {currency}{Number(row.running_balance).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => setIsStatementModalOpen(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-700"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
