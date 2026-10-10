import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import Swal from 'sweetalert2';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  DollarSign,
  FileSpreadsheet,
  Plus,
  X,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ReportHeader from '../../components/ReportHeader';

export default function CashBookReport() {
  const { hasPermission } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [cashBook, setCashBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const currency = '৳';

  // Add Cash / Opening Balance Modal State
  const [isAddCashModalOpen, setIsAddCashModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [banks, setBanks] = useState([]);
  const [chartOfAccounts, setChartOfAccounts] = useState([]);
  const [addCashForm, setAddCashForm] = useState({
    amount: '',
    source_type: 'capital', // 'capital' | 'bank' | 'income'
    bank_account_id: '',
    entry_date: today,
    note: 'Cash in Hand Opening Balance / Drawer Float',
  });
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    destination_type: 'custom', // 'expense' | 'bank' | 'drawing' | 'custom'
    bank_account_id: '',
    account_id: '',
    entry_date: today,
    note: 'Payment of Tax / Output VAT Liability',
  });
  const [submittingCash, setSubmittingCash] = useState(false);
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  const fetchCashBook = async () => {
    setLoading(true);
    try {
      const res = await api.get('/accounting/cash-book', {
        params: {
          start_date: startDate,
          end_date: endDate,
          search: search || undefined
        }
      });
      if (res.data.success) {
        setCashBook(res.data.cash_book);
      }
    } catch (err) {
      console.error('Failed to load cash book', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBanks = async () => {
    try {
      const res = await api.get('/bank-accounts?active_only=1');
      if (res.data.success) {
        setBanks(res.data.banks || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/accounting/accounts');
      if (res.data.success) {
        const accs = res.data.accounts || [];
        setChartOfAccounts(accs);
        // Default to Tax Payable 2010 if present
        const taxAcc = accs.find(a => a.account_code === '2010');
        if (taxAcc) {
          setWithdrawForm(prev => ({ ...prev, account_id: taxAcc.id }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCashBook();
    fetchBanks();
    fetchAccounts();
  }, [startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCashBook();
  };

  const handleAddCashSubmit = async (e) => {
    e.preventDefault();
    setSubmittingCash(true);
    try {
      await api.post('/accounting/cash/add-money', addCashForm);
      Swal.fire({
        icon: 'success',
        title: 'Cash Inflow Recorded!',
        text: `Successfully added ${currency}${Number(addCashForm.amount).toFixed(2)} to Cash in Hand.`,
        timer: 1500,
        showConfirmButton: false
      });
      setIsAddCashModalOpen(false);
      setAddCashForm({
        amount: '',
        source_type: 'capital',
        bank_account_id: '',
        entry_date: today,
        note: 'Cash in Hand Opening Balance / Drawer Float',
      });
      fetchCashBook();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Transaction Failed',
        text: err.response?.data?.message || 'Could not record cash inflow.'
      });
    } finally {
      setSubmittingCash(false);
    }
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    setSubmittingWithdraw(true);
    try {
      const res = await api.post('/accounting/cash/withdraw-money', withdrawForm);
      Swal.fire({
        icon: 'success',
        title: 'Payout / Payment Recorded!',
        text: res.data.message || `Successfully disbursed ${currency}${Number(withdrawForm.amount).toFixed(2)} from Cash in Hand.`,
        timer: 2000,
        showConfirmButton: false
      });
      setIsWithdrawModalOpen(false);
      setWithdrawForm({
        amount: '',
        destination_type: 'custom',
        bank_account_id: '',
        account_id: chartOfAccounts.find(a => a.account_code === '2010')?.id || '',
        entry_date: today,
        note: '',
      });
      fetchCashBook();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Payout Failed',
        text: err.response?.data?.message || 'Could not record cash payment.'
      });
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  const entries = cashBook?.entries || [];

  return (
    <div className="space-y-6">
      <ReportHeader
        title="Cash Book Report"
        subtitle="Chronological cash receipts (debits), cash disbursements (credits), and cash in hand ledger balances."
        icon={Wallet}
        requiredPermission={['view-cash-book', 'manage-cash-book', 'view-accounting-dashboard']}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        onRefresh={fetchCashBook}
        loading={loading}
      >
        <div className="flex items-center gap-2">
          {hasPermission(['withdraw-cash-money', 'manage-cash-book']) && (
            <button
              onClick={() => setIsWithdrawModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <ArrowUpRight className="w-4 h-4 text-rose-400" />
              <span>Pay Tax / Cash Payout</span>
            </button>
          )}
          {hasPermission(['add-cash-money', 'manage-cash-book']) && (
            <button
              onClick={() => setIsAddCashModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-700 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Cash / Deposit</span>
            </button>
          )}
        </div>
      </ReportHeader>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Opening Balance</div>
          <div className="mt-2 text-xl font-black text-slate-900 font-mono">
            {currency}{Number(cashBook?.opening_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Cash balance prior to {startDate}</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Total Cash Receipts (Debit)</span>
            <ArrowDownRight className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-xl font-black text-emerald-700 font-mono">
            +{currency}{Number(cashBook?.total_cash_in ?? cashBook?.total_inflow ?? cashBook?.total_debit ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-emerald-600 mt-1">Cash sales, deposits & capital</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Total Cash Payments (Credit)</span>
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 text-xl font-black text-rose-700 font-mono">
            -{currency}{Number(cashBook?.total_cash_out ?? cashBook?.total_outflow ?? cashBook?.total_credit ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-rose-600 mt-1">Purchases, expenses & withdrawals</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs bg-gradient-to-br from-white to-emerald-50/30">
          <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Closing Cash Balance</div>
          <div className="mt-2 text-2xl font-black text-emerald-700 font-mono">
            {currency}{Number(cashBook?.closing_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-emerald-600 mt-1">Current net physical cash in hand</p>
        </div>
      </div>

      {/* Search and Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search narration, entry # or ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </form>
          <div className="text-xs text-slate-400 font-semibold">
            Showing <span className="font-bold text-slate-700">{entries.length}</span> Cash Transactions
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Voucher / Entry #</th>
                <th className="py-3 px-4">Particulars / Description</th>
                <th className="py-3 px-4">Ref Type</th>
                <th className="py-3 px-4 text-right">Cash In (Debit)</th>
                <th className="py-3 px-4 text-right">Cash Out (Credit)</th>
                <th className="py-3 px-4 text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    Loading cash book transactions...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No cash transactions found for the selected period.
                  </td>
                </tr>
              ) : (
                entries.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {row.date}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                      {row.entry_number || row.voucher_no}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-medium max-w-sm">
                      <div>{row.particulars || row.description}</div>
                      {row.account_name && (
                        <div className="text-[11px] text-slate-400 font-normal">Account: {row.account_name}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {row.reference_type || 'Cash Voucher'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                      {(row.debit > 0 || row.cash_in > 0) ? `+${currency}${Number(row.debit || row.cash_in).toFixed(2)}` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600">
                      {(row.credit > 0 || row.cash_out > 0) ? `-${currency}${Number(row.credit || row.cash_out).toFixed(2)}` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900">
                      {currency}{Number(row.running_balance).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Cash / Opening Float Modal */}
      {isAddCashModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-slate-900">Add Cash / Opening Balance</h3>
              </div>
              <button
                onClick={() => setIsAddCashModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCashSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Cash Amount ({currency})</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  placeholder="e.g. 50000.00"
                  value={addCashForm.amount}
                  onChange={(e) => setAddCashForm({ ...addCashForm, amount: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Funding Source</label>
                <select
                  value={addCashForm.source_type}
                  onChange={(e) => setAddCashForm({ ...addCashForm, source_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="capital">Owner's Capital / Initial Opening Balance (3010)</option>
                  <option value="bank">Bank Account Cash Withdrawal / Contra (1020)</option>
                  <option value="income">Direct Operating / Other Income (4020)</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  {addCashForm.source_type === 'capital' && 'Automatically credits 3010 Owner\'s Equity and debits 1010 Cash in Hand.'}
                  {addCashForm.source_type === 'bank' && 'Transfers liquid funds from your corporate bank into physical cash drawer.'}
                  {addCashForm.source_type === 'income' && 'Records miscellaneous non-sale direct cash receipt.'}
                </p>
              </div>

              {addCashForm.source_type === 'bank' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Bank Account</label>
                  <select
                    required
                    value={addCashForm.bank_account_id}
                    onChange={(e) => setAddCashForm({ ...addCashForm, bank_account_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="">-- Choose Bank Account --</option>
                    {banks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bank_name} - {b.account_name} ({currency}{Number(b.current_balance).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Voucher Date</label>
                  <input
                    type="date"
                    required
                    value={addCashForm.entry_date}
                    onChange={(e) => setAddCashForm({ ...addCashForm, entry_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Particulars / Note</label>
                  <input
                    type="text"
                    placeholder="Description..."
                    value={addCashForm.note}
                    onChange={(e) => setAddCashForm({ ...addCashForm, note: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddCashModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCash}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submittingCash ? 'Posting...' : 'Record Cash Inflow'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cash Payout / Tax Payment / Expense / Withdrawal Modal */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Record Cash Outflow / Payout</h3>
                  <p className="text-[10px] text-slate-400">Pay Tax Liability, Operating Expenses, or Deposit to Bank</p>
                </div>
              </div>
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Disbursement Amount ({currency}) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  placeholder="e.g. 1500.00"
                  value={withdrawForm.amount}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payout Category / Destination *</label>
                <select
                  value={withdrawForm.destination_type}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, destination_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                >
                  <option value="custom">Clear Liability / Tax Payable (2010)</option>
                  <option value="expense">Operating & Administrative Expense (5020)</option>
                  <option value="bank">Deposit Cash into Bank Account (1020)</option>
                  <option value="drawing">Owner Capital Drawing (3010)</option>
                </select>
              </div>

              {/* Bank Selection */}
              {withdrawForm.destination_type === 'bank' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Bank Account *</label>
                  <select
                    required
                    value={withdrawForm.bank_account_id}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, bank_account_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                  >
                    <option value="">-- Choose Target Bank --</option>
                    {banks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bank_name} - {b.account_name} ({currency}{Number(b.current_balance).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Chart of Accounts Head Selection for custom or specific expense */}
              {(withdrawForm.destination_type === 'custom' || withdrawForm.destination_type === 'expense') && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Ledger Account Head *</label>
                  <select
                    required
                    value={withdrawForm.account_id}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, account_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                  >
                    <option value="">-- Select Chart of Account Head --</option>
                    {chartOfAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.account_code} - {a.account_name} ({a.account_type})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Select <strong>2010 Tax Payable (Output VAT)</strong> to clear accrued tax liabilities, or any expense head.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={withdrawForm.entry_date}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, entry_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Particulars / Note</label>
                  <input
                    type="text"
                    placeholder="e.g. VAT Payment to NBR"
                    value={withdrawForm.note}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, note: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingWithdraw}
                  className="px-4 py-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 disabled:opacity-50"
                >
                  {submittingWithdraw ? 'Posting...' : 'Record Payment / Clear Liability'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
