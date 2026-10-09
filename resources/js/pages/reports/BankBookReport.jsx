import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  CreditCard,
  Building
} from 'lucide-react';
import ReportHeader from '../../components/ReportHeader';

export default function BankBookReport() {
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [bankBook, setBankBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const currency = '৳';

  const fetchBankBook = async () => {
    setLoading(true);
    try {
      const res = await api.get('/accounting/bank-book', {
        params: {
          bank_account_id: selectedBankId || undefined,
          start_date: startDate,
          end_date: endDate,
          search: search || undefined
        }
      });
      if (res.data.success) {
        setBankBook(res.data.bank_book);
      }
    } catch (err) {
      console.error('Failed to load bank book', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankBook();
  }, [startDate, endDate, selectedBankId]);

  const allBanks = bankBook?.all_banks || [];
  const entries = bankBook?.entries || [];

  return (
    <div className="space-y-6">
      <ReportHeader
        title="Bank Book & Statements Report"
        subtitle="Corporate bank ledger statements, deposits, withdrawals, cheques, and running balances."
        icon={Building2}
        requiredPermission={['view-bank-book', 'view-banks', 'manage-banks', 'view-accounting-dashboard']}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        onRefresh={fetchBankBook}
        loading={loading}
      />

      {/* Bank Account Selector Pills */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5" />
            <span>Select Bank:</span>
          </span>
          <button
            onClick={() => setSelectedBankId('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedBankId === ''
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Accounts Combined ({currency}{Number(bankBook?.total_bank_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })})
          </button>
          {allBanks.map((bank) => (
            <button
              key={bank.id}
              onClick={() => setSelectedBankId(String(bank.id))}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedBankId === String(bank.id)
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {bank.account_name} ({currency}{Number(bank.current_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })})
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Opening Bank Balance</div>
          <div className="mt-2 text-xl font-black text-slate-900 font-mono">
            {currency}{Number(bankBook?.opening_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Balance prior to {startDate}</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Total Deposits (Debit)</span>
            <ArrowDownRight className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-xl font-black text-emerald-700 font-mono">
            +{currency}{Number(bankBook?.total_deposits ?? bankBook?.total_debit ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-emerald-600 mt-1">Bank deposits & customer transfers</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Total Outflows (Credit)</span>
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 text-xl font-black text-rose-700 font-mono">
            -{currency}{Number(bankBook?.total_withdrawals ?? bankBook?.total_credit ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-rose-600 mt-1">Supplier payments & withdrawals</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs bg-gradient-to-br from-white to-blue-50/40">
          <div className="text-xs font-bold text-blue-700 uppercase tracking-wider">Closing Bank Balance</div>
          <div className="mt-2 text-2xl font-black text-blue-700 font-mono">
            {currency}{Number(bankBook?.closing_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-blue-600 mt-1">Net bank liquid funds</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search narration or entry #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div className="text-xs text-slate-400 font-semibold">
            Showing <span className="font-bold text-slate-700">{entries.length}</span> Bank Statement Records
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Voucher / Entry #</th>
                <th className="py-3 px-4">Bank Account</th>
                <th className="py-3 px-4">Particulars / Narration</th>
                <th className="py-3 px-4 text-right">Deposit (Debit)</th>
                <th className="py-3 px-4 text-right">Withdrawal (Credit)</th>
                <th className="py-3 px-4 text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    Loading bank statements...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No bank statement entries found for the selected account and date range.
                  </td>
                </tr>
              ) : (
                entries.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {row.date}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                      {row.entry_number}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {row.bank_name || 'Corporate Bank'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium max-w-sm">
                      <div>{row.description}</div>
                      {row.reference_type && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                          {row.reference_type}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                      {row.debit > 0 ? `+${currency}${Number(row.debit).toFixed(2)}` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600">
                      {row.credit > 0 ? `-${currency}${Number(row.credit).toFixed(2)}` : '—'}
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
    </div>
  );
}
