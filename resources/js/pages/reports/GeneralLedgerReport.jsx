import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  Layers,
  Search,
  ArrowRight,
  FileSpreadsheet,
  BookOpen,
  Filter
} from 'lucide-react';
import ReportHeader from '../../components/ReportHeader';

export default function GeneralLedgerReport() {
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const currency = '৳';

  // Fetch accounts list for dropdown
  useEffect(() => {
    const loadAccounts = async () => {
      setLoadingAccounts(true);
      try {
        const res = await api.get('/accounting/accounts');
        if (res.data.success) {
          const list = res.data.accounts || [];
          setAccounts(list);
          if (list.length > 0 && !selectedAccountId) {
            setSelectedAccountId(String(list[0].id));
          }
        }
      } catch (err) {
        console.error('Failed to load accounts list', err);
      } finally {
        setLoadingAccounts(false);
      }
    };
    loadAccounts();
  }, []);

  // Fetch specific ledger
  const fetchLedger = async () => {
    if (!selectedAccountId) return;
    setLoading(true);
    try {
      const res = await api.get(`/accounting/ledger/${selectedAccountId}`, {
        params: {
          start_date: startDate,
          end_date: endDate
        }
      });
      if (res.data.success) {
        setLedgerData(res.data);
      }
    } catch (err) {
      console.error('Failed to load ledger', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [selectedAccountId, startDate, endDate]);

  const activeAccount = ledgerData?.account;
  const entries = ledgerData?.entries || [];

  return (
    <div className="space-y-6">
      <ReportHeader
        title="General Ledger Report"
        subtitle="Detailed chronological account ledger statements with running balance calculations."
        icon={Layers}
        requiredPermission={['view-ledger', 'view-accounting-dashboard']}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        onRefresh={fetchLedger}
        loading={loading}
      />

      {/* Account Selector Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Select Chart of Account Head
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="mt-0.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-sm"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  [{acc.code}] {acc.name} ({acc.type} - {acc.normal_balance})
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeAccount && (
          <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200/80 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Classification: </span>
              <span className="font-bold text-slate-800">{activeAccount.type}</span>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div>
              <span className="text-slate-400 font-medium">Normal Balance: </span>
              <span className="font-bold text-indigo-600">{activeAccount.normal_balance}</span>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div>
              <span className="text-slate-400 font-medium">Closing Balance: </span>
              <span className="font-mono font-black text-slate-900">
                {currency}{Number(ledgerData?.closing_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Ledger Entries Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-800">
            Account Statement: <span className="text-indigo-600 font-black">[{activeAccount?.code}] {activeAccount?.name}</span>
          </div>
          <div className="text-xs text-slate-400 font-semibold">
            {entries.length} Ledger Line Items
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Voucher #</th>
                <th className="py-3 px-4">Narration / Particulars</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4 text-right">Debit</th>
                <th className="py-3 px-4 text-right">Credit</th>
                <th className="py-3 px-4 text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    Loading account ledger statement...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No transactions recorded for this account in the selected date range.
                  </td>
                </tr>
              ) : (
                entries.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {row.date}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                      {row.entry_number}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-medium max-w-sm">
                      {row.description}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {row.reference_type || 'Journal'} {row.reference_id ? `#${row.reference_id}` : ''}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {row.debit > 0 ? `${currency}${Number(row.debit).toFixed(2)}` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {row.credit > 0 ? `${currency}${Number(row.credit).toFixed(2)}` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-indigo-700">
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
