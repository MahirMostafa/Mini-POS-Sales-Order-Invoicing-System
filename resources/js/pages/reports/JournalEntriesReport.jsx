import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import Swal from 'sweetalert2';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ReportHeader from '../../components/ReportHeader';

export default function JournalEntriesReport() {
  const { hasPermission } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [entries, setEntries] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [refTypeFilter, setRefTypeFilter] = useState('');
  const currency = '৳';

  // Modal Voucher State
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [voucherForm, setVoucherForm] = useState({
    entry_date: today,
    description: '',
    items: [
      { account_id: '', debit: '', credit: '', narration: '' },
      { account_id: '', debit: '', credit: '', narration: '' }
    ]
  });
  const [savingVoucher, setSavingVoucher] = useState(false);

  const fetchJournalEntries = async () => {
    setLoading(true);
    try {
      const res = await api.get('/accounting/journal-entries', {
        params: {
          start_date: startDate,
          end_date: endDate,
          search: search || undefined,
          reference_type: refTypeFilter || undefined
        }
      });
      if (res.data.success) {
        setEntries(res.data.entries?.data || res.data.entries || []);
      }
    } catch (err) {
      console.error('Failed to load journal entries', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccountsList = async () => {
    try {
      const res = await api.get('/accounting/accounts');
      if (res.data.success) {
        setAccounts(res.data.accounts || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchJournalEntries();
    fetchAccountsList();
  }, [startDate, endDate, refTypeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchJournalEntries();
  };

  // Voucher Form Helpers
  const handleItemChange = (index, field, value) => {
    const updated = [...voucherForm.items];
    updated[index][field] = value;
    setVoucherForm({ ...voucherForm, items: updated });
  };

  const addVoucherRow = () => {
    setVoucherForm({
      ...voucherForm,
      items: [...voucherForm.items, { account_id: '', debit: '', credit: '', narration: '' }]
    });
  };

  const removeVoucherRow = (index) => {
    if (voucherForm.items.length <= 2) return;
    setVoucherForm({
      ...voucherForm,
      items: voucherForm.items.filter((_, i) => i !== index)
    });
  };

  const totalDebit = voucherForm.items.reduce((acc, i) => acc + (parseFloat(i.debit) || 0), 0);
  const totalCredit = voucherForm.items.reduce((acc, i) => acc + (parseFloat(i.credit) || 0), 0);
  const isBalanced = totalDebit > 0 && Math.abs(totalDebit - totalCredit) < 0.001;

  const handleSaveVoucher = async (e) => {
    e.preventDefault();
    if (!isBalanced) {
      Swal.fire({
        icon: 'warning',
        title: 'Unbalanced Voucher',
        text: `Total Debits (${currency}${totalDebit.toFixed(2)}) must exactly equal Total Credits (${currency}${totalCredit.toFixed(2)}).`
      });
      return;
    }

    setSavingVoucher(true);
    try {
      await api.post('/accounting/vouchers', voucherForm);
      Swal.fire({ icon: 'success', title: 'Journal Voucher Posted!', timer: 1500, showConfirmButton: false });
      setIsVoucherModalOpen(false);
      setVoucherForm({
        entry_date: today,
        description: '',
        items: [
          { account_id: '', debit: '', credit: '', narration: '' },
          { account_id: '', debit: '', credit: '', narration: '' }
        ]
      });
      fetchJournalEntries();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Post Failed',
        text: err.response?.data?.message || 'Failed to post manual voucher.'
      });
    } finally {
      setSavingVoucher(false);
    }
  };

  return (
    <div className="space-y-6">
      <ReportHeader
        title="Journal Entries & Vouchers"
        subtitle="Double-entry journal vouchers log covering sales, inventory additions, payments, and expenses."
        icon={FileSpreadsheet}
        requiredPermission={['view-journal-entries', 'view-accounting-dashboard']}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        onRefresh={fetchJournalEntries}
        loading={loading}
      >
        {hasPermission(['create-journal-entry']) && (
          <button
            onClick={() => setIsVoucherModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-700 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Voucher</span>
          </button>
        )}
      </ReportHeader>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search entry # or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </form>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400">Type:</span>
          <select
            value={refTypeFilter}
            onChange={(e) => setRefTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Voucher Types</option>
            <option value="Sale">Sales Invoices</option>
            <option value="Purchase">Purchase & Goods Inflow</option>
            <option value="CustomerDueSettlement">Customer Due Settlements</option>
            <option value="ManualVoucher">Manual Vouchers</option>
            <option value="OpeningStock">Opening Stock</option>
            <option value="BankDeposit">Bank Deposits</option>
            <option value="BankWithdrawal">Bank Withdrawals</option>
          </select>
        </div>
      </div>

      {/* Entries List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 text-xs">
            Loading journal entries...
          </div>
        ) : entries.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 text-xs">
            No journal entries found matching criteria.
          </div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-xs text-indigo-600 px-2.5 py-1 bg-indigo-50 rounded-lg">
                    {entry.entry_number}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-slate-800">{entry.description}</div>
                    <div className="text-[11px] text-slate-400">
                      Ref Type: <span className="font-bold text-slate-600">{entry.reference_type || 'Manual'}</span> {entry.reference_id ? `(#${entry.reference_id})` : ''}
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  {entry.entry_date?.split('T')[0] || entry.entry_date}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] text-slate-400 font-bold uppercase bg-slate-50/40 border-b border-slate-100">
                    <tr>
                      <th className="py-2 px-4">Account Code</th>
                      <th className="py-2 px-4">Account Name</th>
                      <th className="py-2 px-4">Line Narration</th>
                      <th className="py-2 px-4 text-right">Debit</th>
                      <th className="py-2 px-4 text-right">Credit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(entry.items || []).map((item, i) => (
                      <tr key={i} className="hover:bg-slate-50/40">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-600">
                          {item.account?.code || item.account_code || '—'}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">
                          {item.account?.name || item.account_name || '—'}
                        </td>
                        <td className="py-2.5 px-4 text-slate-500">
                          {item.narration || '—'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                          {Number(item.debit) > 0 ? `${currency}${Number(item.debit).toFixed(2)}` : '—'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                          {Number(item.credit) > 0 ? `${currency}${Number(item.credit).toFixed(2)}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Manual Voucher Modal */}
      {isVoucherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Post Manual Double-Entry Voucher</h3>
              <button
                onClick={() => setIsVoucherModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVoucher} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Voucher Date</label>
                  <input
                    type="date"
                    required
                    value={voucherForm.entry_date}
                    onChange={(e) => setVoucherForm({ ...voucherForm, entry_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Description / Memo</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Office rent payment, Capital infusion"
                    value={voucherForm.description}
                    onChange={(e) => setVoucherForm({ ...voucherForm, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Debit/Credit Rows */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Double Entry Line Items</span>
                  <button
                    type="button"
                    onClick={addVoucherRow}
                    className="text-indigo-600 font-bold hover:text-indigo-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Row</span>
                  </button>
                </div>

                {voucherForm.items.map((row, idx) => (
                  <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-2 bg-slate-50 rounded-xl">
                    <select
                      required
                      value={row.account_id}
                      onChange={(e) => handleItemChange(idx, 'account_id', e.target.value)}
                      className="flex-1 min-w-[140px] px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium"
                    >
                      <option value="">Select Account Head</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          [{a.code}] {a.name} ({a.type})
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      step="0.01"
                      placeholder="Debit"
                      value={row.debit}
                      onChange={(e) => handleItemChange(idx, 'debit', e.target.value)}
                      className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                    />

                    <input
                      type="number"
                      step="0.01"
                      placeholder="Credit"
                      value={row.credit}
                      onChange={(e) => handleItemChange(idx, 'credit', e.target.value)}
                      className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                    />

                    <input
                      type="text"
                      placeholder="Line Narration"
                      value={row.narration}
                      onChange={(e) => handleItemChange(idx, 'narration', e.target.value)}
                      className="w-32 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />

                    {voucherForm.items.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeVoucherRow(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Equilibrium Check Footer */}
              <div className="p-3 rounded-xl bg-slate-100 flex items-center justify-between font-mono font-bold">
                <div>
                  Debits: <span className="text-emerald-700">{currency}{totalDebit.toFixed(2)}</span>
                </div>
                <div>
                  Credits: <span className="text-indigo-700">{currency}{totalCredit.toFixed(2)}</span>
                </div>
                <div>
                  {isBalanced ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Balanced</span>
                    </span>
                  ) : (
                    <span className="text-rose-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>Diff: {currency}{Math.abs(totalDebit - totalCredit).toFixed(2)}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsVoucherModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isBalanced || savingVoucher}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {savingVoucher ? 'Posting...' : 'Post Journal Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
