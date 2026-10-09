import React, { useState, useEffect } from 'react';
import api from '../api/client';
import Swal from 'sweetalert2';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Minus,
  Calendar,
  Search,
  Filter,
  RefreshCw,
  Printer,
  Building2,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowRightLeft,
  X,
  CreditCard,
  UserCheck,
  ShoppingBag,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function CashManagement() {
  const { user, role, hasPermission } = useAuth();
  const currency = '৳';

  const canAddCash = hasPermission(['add-cash-money', 'manage-cash-book']);
  const canWithdrawCash = hasPermission(['withdraw-cash-money', 'manage-cash-book']);

  // Date Filters
  const todayStr = new Date().toISOString().split('T')[0];
  const firstDayOfMonthStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDayOfMonthStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [activePreset, setActivePreset] = useState('this_month'); // 'today' | 'yesterday' | 'this_week' | 'this_month' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [flowFilter, setFlowFilter] = useState('all'); // 'all' | 'inflow' | 'outflow'

  // Data States
  const [cashBookData, setCashBookData] = useState(null);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [chartOfAccounts, setChartOfAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddMoneyModalOpen, setIsAddMoneyModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [submittingModal, setSubmittingModal] = useState(false);

  // Add Money Form State
  const [addForm, setAddForm] = useState({
    amount: '',
    source_type: 'capital', // 'capital' | 'bank' | 'income' | 'custom'
    bank_account_id: '',
    account_id: '',
    entry_date: todayStr,
    note: '',
    reference: '',
  });

  // Withdraw Money Form State
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    destination_type: 'bank', // 'bank' | 'expense' | 'drawing' | 'custom'
    bank_account_id: '',
    account_id: '',
    entry_date: todayStr,
    note: '',
    reference: '',
  });

  // Fetch Cash Book data
  const fetchCashBook = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (searchQuery) params.append('search', searchQuery);

      const [cashRes, banksRes, coaRes] = await Promise.all([
        api.get(`/accounting/cash-book?${params.toString()}`),
        api.get('/bank-accounts?active_only=1'),
        api.get('/accounting/chart-of-accounts'),
      ]);

      if (cashRes.data.success) {
        setCashBookData(cashRes.data.cash_book);
      }
      if (banksRes.data.success) {
        const banks = banksRes.data.banks || banksRes.data.bank_accounts || [];
        setBankAccounts(banks);
        if (banks.length > 0) {
          setAddForm((prev) => ({ ...prev, bank_account_id: prev.bank_account_id || banks[0].id }));
          setWithdrawForm((prev) => ({ ...prev, bank_account_id: prev.bank_account_id || banks[0].id }));
        }
      }
      if (coaRes.data.success) {
        setChartOfAccounts(coaRes.data.accounts || coaRes.data.chart_of_accounts || []);
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load cash transactions.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashBook();
  }, [startDate, endDate]);

  // Handle Preset Date Filter clicks
  const applyPreset = (preset) => {
    setActivePreset(preset);
    const now = new Date();

    if (preset === 'today') {
      const today = now.toISOString().split('T')[0];
      setStartDate(today);
      setEndDate(today);
    } else if (preset === 'yesterday') {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      const yestStr = yest.toISOString().split('T')[0];
      setStartDate(yestStr);
      setEndDate(yestStr);
    } else if (preset === 'this_week') {
      const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
      const firstDayStr = firstDay.toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];
      setStartDate(firstDayStr);
      setEndDate(today);
    } else if (preset === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(today);
    } else if (preset === 'all') {
      setStartDate('2020-01-01');
      setEndDate(todayStr);
    }
  };

  // Submit Add Money to Cash
  const handleAddMoney = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(addForm.amount);
    if (!numAmount || numAmount <= 0) {
      Swal.fire({ icon: 'warning', title: 'Invalid Amount', text: 'Please enter a valid amount.' });
      return;
    }

    setSubmittingModal(true);
    try {
      const res = await api.post('/accounting/cash/add-money', addForm);
      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Money Added!',
          text: res.data.message,
          timer: 2000,
          showConfirmButton: false,
        });
        setIsAddMoneyModalOpen(false);
        setAddForm({
          amount: '',
          source_type: 'capital',
          bank_account_id: bankAccounts.length > 0 ? bankAccounts[0].id : '',
          account_id: '',
          entry_date: todayStr,
          note: '',
          reference: '',
        });
        fetchCashBook();
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Transaction Failed',
        text: err.response?.data?.message || 'Failed to deposit money to cash.',
      });
    } finally {
      setSubmittingModal(false);
    }
  };

  // Submit Withdraw / Pay Cash
  const handleWithdrawMoney = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(withdrawForm.amount);
    if (!numAmount || numAmount <= 0) {
      Swal.fire({ icon: 'warning', title: 'Invalid Amount', text: 'Please enter a valid amount.' });
      return;
    }

    const currentCash = parseFloat(cashBookData?.closing_balance || 0);
    if (numAmount > currentCash) {
      const confirm = await Swal.fire({
        title: 'Negative Cash Balance Warning',
        text: `The withdrawal amount (৳${numAmount.toFixed(2)}) exceeds current Cash in Hand balance (৳${currentCash.toFixed(2)}). Do you want to proceed?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, Proceed',
        confirmButtonColor: '#4f46e5',
      });
      if (!confirm.isConfirmed) return;
    }

    setSubmittingModal(true);
    try {
      const res = await api.post('/accounting/cash/withdraw-money', withdrawForm);
      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Cash Outflow Recorded!',
          text: res.data.message,
          timer: 2000,
          showConfirmButton: false,
        });
        setIsWithdrawModalOpen(false);
        setWithdrawForm({
          amount: '',
          destination_type: 'bank',
          bank_account_id: bankAccounts.length > 0 ? bankAccounts[0].id : '',
          account_id: '',
          entry_date: todayStr,
          note: '',
          reference: '',
        });
        fetchCashBook();
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Transaction Failed',
        text: err.response?.data?.message || 'Failed to record cash outflow.',
      });
    } finally {
      setSubmittingModal(false);
    }
  };

  // Filter entries based on search and flow
  const rawEntries = cashBookData?.entries || cashBookData?.transactions || [];
  const filteredEntries = rawEntries.filter((row) => {
    const debit = Number(row.debit ?? row.cash_in ?? 0);
    const credit = Number(row.credit ?? row.cash_out ?? 0);
    if (flowFilter === 'inflow' && debit <= 0) return false;
    if (flowFilter === 'outflow' && credit <= 0) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchVoucher = (row.voucher_no || row.entry_number || '').toLowerCase().includes(q);
      const matchPart = (row.particulars || '').toLowerCase().includes(q);
      const matchDesc = (row.description || '').toLowerCase().includes(q);
      if (!matchVoucher && !matchPart && !matchDesc) return false;
    }
    return true;
  });

  const totalInflow = parseFloat(cashBookData?.total_inflow ?? cashBookData?.total_cash_in ?? 0);
  const totalOutflow = parseFloat(cashBookData?.total_outflow ?? cashBookData?.total_cash_out ?? 0);
  const netMovement = totalInflow - totalOutflow;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Top Banner & Action Controls */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Wallet className="w-4 h-4" />
            <span>Account Head 1010 • Cash in Hand Master Book</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Cash Management & Drawer Flow</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Real-time cash in hand tracking, add cash float / capital injections, record petty cash payouts, and filter transactions by date range.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {canAddCash && (
            <button
              type="button"
              onClick={() => setIsAddMoneyModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all hover:scale-102"
            >
              <Plus className="w-4 h-4" />
              <span>Add Money to Cash</span>
            </button>
          )}

          {canWithdrawCash && (
            <button
              type="button"
              onClick={() => setIsWithdrawModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all hover:scale-102"
            >
              <Minus className="w-4 h-4" />
              <span>Pay / Withdraw Cash</span>
            </button>
          )}

          <button
            type="button"
            onClick={fetchCashBook}
            disabled={loading}
            className="p-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refresh Cash Book"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="no-print p-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Print Cash Sheet"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Cash in Hand */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-5 rounded-3xl text-white shadow-md shadow-emerald-600/10 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">
              Current Cash in Hand
            </span>
            <span className="p-1.5 rounded-xl bg-white/20 text-white">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-black font-mono">
              {currency}{Number(cashBookData?.closing_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-emerald-100 mt-0.5">Physical drawer available balance</div>
          </div>
          <div className="text-[10px] font-bold text-emerald-200 uppercase flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Strict Double-Entry Balanced</span>
          </div>
        </div>

        {/* Total Inflow */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Cash Inflow (Debits)
            </span>
            <span className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-emerald-600 font-mono">
              +{currency}{Number(cashBookData?.total_inflow || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">POS sales, due collections & deposits</div>
          </div>
          <div className="text-[10px] font-semibold text-slate-500">
            For selected date range
          </div>
        </div>

        {/* Total Outflow */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Cash Outflow (Credits)
            </span>
            <span className="p-1.5 rounded-xl bg-rose-50 text-rose-600">
              <ArrowDownRight className="w-4 h-4" />
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-rose-600 font-mono">
              -{currency}{Number(cashBookData?.total_outflow || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Purchases, expenses & bank deposits</div>
          </div>
          <div className="text-[10px] font-semibold text-slate-500">
            For selected date range
          </div>
        </div>

        {/* Net Period Movement / Opening Balance */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Period Opening Balance
            </span>
            <span className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-slate-800 font-mono">
              {currency}{Number(cashBookData?.opening_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Net movement: <strong className={netMovement >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                {netMovement >= 0 ? '+' : ''}{currency}{netMovement.toFixed(2)}
              </strong>
            </div>
          </div>
          <div className="text-[10px] font-semibold text-slate-500">
            {filteredEntries.length} transactions in view
          </div>
        </div>
      </div>

      {/* Filter Control Center */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Quick Date Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Range:</span>
            </span>
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'this_week', label: 'This Week' },
              { id: 'this_month', label: 'This Month' },
              { id: 'all', label: 'All Time' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                  activePreset === p.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Flow Filter (All / In / Out) */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setFlowFilter('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                flowFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All Flows
            </button>
            <button
              type="button"
              onClick={() => setFlowFilter('inflow')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                flowFilter === 'inflow' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Cash In (+Dr)
            </button>
            <button
              type="button"
              onClick={() => setFlowFilter('outflow')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                flowFilter === 'outflow' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Cash Out (-Cr)
            </button>
          </div>
        </div>

        {/* Date Pickers & Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-3 border-t border-slate-100">
          <div className="sm:col-span-3">
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setActivePreset('custom');
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50/50 outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setActivePreset('custom');
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50/50 outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="sm:col-span-6">
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Search Cash Ledger</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Voucher #, Sales Order, Customer name or Memo..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50/50 outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cash Transactions Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Cash Transactions Ledger ({filteredEntries.length})
            </h3>
            <p className="text-[11px] text-slate-400">
              Showing transactions between <strong className="text-slate-700">{startDate}</strong> and <strong className="text-slate-700">{endDate}</strong>
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
            Debit = Cash Inflow • Credit = Cash Outflow
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="py-3.5 px-6">Date & Time</th>
                <th className="py-3.5 px-4">Voucher / Ref #</th>
                <th className="py-3.5 px-6">Particulars / Source Head</th>
                <th className="py-3.5 px-6">Description / Memo</th>
                <th className="py-3.5 px-4 text-right">Cash In (Dr)</th>
                <th className="py-3.5 px-4 text-right">Cash Out (Cr)</th>
                <th className="py-3.5 px-6 text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-slate-400">
                    <Wallet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-xs text-slate-500">No cash transactions found for the selected period.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Click "Add Money to Cash" to record an opening cash deposit or injection.</p>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((row, idx) => {
                  const debit = Number(row.debit ?? row.cash_in ?? 0);
                  const credit = Number(row.credit ?? row.cash_out ?? 0);
                  const voucher = row.voucher_no || row.entry_number;
                  const particulars = row.particulars || row.description;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-6 text-slate-600 whitespace-nowrap font-medium">
                        {row.date}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-xs text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                          {voucher}
                        </span>
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="font-bold text-slate-900">{particulars}</div>
                      </td>
                      <td className="py-3.5 px-6 text-slate-600 max-w-xs truncate">
                        {row.description || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">
                        {debit > 0 ? `+${currency}${debit.toFixed(2)}` : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
                        {credit > 0 ? `-${currency}${credit.toFixed(2)}` : '-'}
                      </td>
                      <td className="py-3.5 px-6 text-right font-mono font-black text-slate-900 whitespace-nowrap">
                        {currency}{Number(row.running_balance || 0).toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredEntries.length > 0 && (
              <tfoot className="bg-slate-900 text-white font-bold text-xs">
                <tr>
                  <td colSpan="4" className="py-4 px-6 uppercase text-slate-300">
                    Period Totals & Closing Cash Balance
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-emerald-400">
                    +{currency}{totalInflow.toFixed(2)}
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-rose-300">
                    -{currency}{totalOutflow.toFixed(2)}
                  </td>
                  <td className="py-4 px-6 text-right font-mono text-emerald-400 text-sm">
                    {currency}{Number(cashBookData?.closing_balance || 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: ADD MONEY TO CASH (CASH INFLOW)                                    */}
      {/* ========================================================================= */}
      {isAddMoneyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Add Money to Cash in Hand</h3>
                  <p className="text-[10px] text-slate-500">Inject Capital, Withdraw from Bank, or Record Cash Receipt</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddMoneyModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMoney} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Money Source Type *</label>
                <select
                  value={addForm.source_type}
                  onChange={(e) => setAddForm({ ...addForm, source_type: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                >
                  <option value="capital">Owner Capital Injection / Opening Cash (Head 3010)</option>
                  <option value="bank">Withdrawal from Corporate Bank Account (Head 1020)</option>
                  <option value="income">Direct Cash Other Income (Head 4020)</option>
                  <option value="custom">Other Custom Chart of Accounts Head</option>
                </select>
              </div>

              {/* Bank Account Selection if Source is Bank */}
              {addForm.source_type === 'bank' && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-1.5 animate-in fade-in duration-150">
                  <label className="block text-xs font-bold text-indigo-950">Select Source Bank Account *</label>
                  <select
                    value={addForm.bank_account_id}
                    onChange={(e) => setAddForm({ ...addForm, bank_account_id: e.target.value })}
                    required={addForm.source_type === 'bank'}
                    className="w-full px-3 py-2 rounded-xl border border-indigo-300 text-xs text-slate-900 bg-white font-medium outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {bankAccounts.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bank_name} - {b.account_name} ({b.account_number}) • Bal: ৳{parseFloat(b.current_balance || 0).toFixed(2)}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-indigo-700 block">
                    Funds will be deducted from this bank statement and credited into Cash in Hand.
                  </span>
                </div>
              )}

              {/* Custom Head Selection if Source is Custom */}
              {addForm.source_type === 'custom' && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Select Counterpart Account Head *</label>
                  <select
                    value={addForm.account_id}
                    onChange={(e) => setAddForm({ ...addForm, account_id: e.target.value })}
                    required={addForm.source_type === 'custom'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white outline-none"
                  >
                    <option value="">-- Choose Account Head --</option>
                    {chartOfAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code} - {a.name} ({a.type})
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
                    value={addForm.amount}
                    onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={addForm.entry_date}
                    onChange={(e) => setAddForm({ ...addForm, entry_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description / Note *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Counter morning cash float injection"
                  value={addForm.note}
                  onChange={(e) => setAddForm({ ...addForm, note: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Receipt / Slip # (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Slip #10492"
                  value={addForm.reference}
                  onChange={(e) => setAddForm({ ...addForm, reference: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Double-Entry Preview Box */}
              <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-200/70 text-xs space-y-1">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">Automatic Double-Entry Posting</span>
                <div className="flex justify-between text-slate-700">
                  <span>Debit (Dr): <strong className="text-emerald-700">1010 - Cash in Hand</strong></span>
                  <span className="font-mono font-bold">+{currency}{parseFloat(addForm.amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Credit (Cr): <strong className="text-slate-800">
                    {addForm.source_type === 'capital' ? '3010 - Owner Capital' : addForm.source_type === 'bank' ? '1020 - Bank Account' : addForm.source_type === 'income' ? '4020 - Other Income' : 'Selected Account'}
                  </strong></span>
                  <span className="font-mono font-bold">+{currency}{parseFloat(addForm.amount || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMoneyModalOpen(false)}
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
                  {submittingModal ? 'Recording...' : 'Confirm & Add Money'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PAY / WITHDRAW CASH (CASH OUTFLOW)                                 */}
      {/* ========================================================================= */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-sm">
                  <Minus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Pay / Withdraw from Cash in Hand</h3>
                  <p className="text-[10px] text-slate-500">Deposit Cash to Bank, Pay Operating Expense, or Owner Drawing</p>
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

            <form onSubmit={handleWithdrawMoney} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Destination / Purpose *</label>
                <select
                  value={withdrawForm.destination_type}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, destination_type: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                >
                  <option value="bank">Deposit into Corporate Bank Account (Head 1020)</option>
                  <option value="expense">Direct Cash Operating Expense Payment (Head 5020)</option>
                  <option value="drawing">Owner Capital Drawing / Personal Payout (Head 3010)</option>
                  <option value="custom">Other Custom Chart of Accounts Head</option>
                </select>
              </div>

              {/* Target Bank Selection */}
              {withdrawForm.destination_type === 'bank' && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-1.5 animate-in fade-in duration-150">
                  <label className="block text-xs font-bold text-indigo-950">Select Destination Bank Account *</label>
                  <select
                    value={withdrawForm.bank_account_id}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, bank_account_id: e.target.value })}
                    required={withdrawForm.destination_type === 'bank'}
                    className="w-full px-3 py-2 rounded-xl border border-indigo-300 text-xs text-slate-900 bg-white font-medium outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {bankAccounts.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bank_name} - {b.account_name} ({b.account_number})
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
                      .filter((a) => a.type === 'expense' || withdrawForm.destination_type === 'custom')
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.code} - {a.name} ({a.type})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payout Amount (৳) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={withdrawForm.amount}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={withdrawForm.entry_date}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, entry_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description / Note *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deposited cash into DBBL corporate account / Office stationary"
                  value={withdrawForm.note}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, note: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Receipt / Voucher # (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Receipt #5821"
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
    </div>
  );
}
