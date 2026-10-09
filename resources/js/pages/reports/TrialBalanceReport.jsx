import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  Scale,
  CheckCircle2,
  AlertCircle,
  Filter,
  Layers
} from 'lucide-react';
import ReportHeader from '../../components/ReportHeader';

export default function TrialBalanceReport() {
  const today = new Date().toISOString().split('T')[0];
  const [asOfDate, setAsOfDate] = useState(today);
  const [trialBalance, setTrialBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hideZeroBalances, setHideZeroBalances] = useState(true);
  const currency = '৳';

  const fetchTrialBalance = async () => {
    setLoading(true);
    try {
      const res = await api.get('/accounting/trial-balance', {
        params: {
          as_of_date: asOfDate
        }
      });
      if (res.data.success) {
        setTrialBalance(res.data.trial_balance);
      }
    } catch (err) {
      console.error('Failed to load trial balance', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrialBalance();
  }, [asOfDate]);

  const rows = (trialBalance?.rows || []).filter((r) => {
    if (!hideZeroBalances) return true;
    return Number(r.debit) > 0 || Number(r.credit) > 0;
  });

  const isBalanced = trialBalance?.is_balanced ?? false;

  return (
    <div className="space-y-6">
      <ReportHeader
        title="Trial Balance Report"
        subtitle="Verification statement proving equality of total debits and total credits across all active accounts."
        icon={Scale}
        requiredPermission={['view-trial-balance', 'view-accounting-dashboard']}
        showDateFilter={false}
        onRefresh={fetchTrialBalance}
        loading={loading}
      >
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
          <span className="text-xs font-bold text-slate-600 px-2">As of Date:</span>
          <input
            type="date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </ReportHeader>

      {/* Balance Verification Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {isBalanced ? (
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          )}
          <div>
            <div className="text-xs font-bold text-slate-900">
              {isBalanced ? 'Double-Entry Equilibrium Verified (Balanced)' : 'Out of Balance Warning'}
            </div>
            <div className="text-[11px] text-slate-500">
              {isBalanced
                ? 'Total Debit postings strictly equal Total Credit postings.'
                : `Variance detected: ${currency}${Math.abs(Number(trialBalance?.difference || 0)).toFixed(2)}`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <label className="flex items-center gap-1.5 font-bold text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={hideZeroBalances}
              onChange={(e) => setHideZeroBalances(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>Hide Zero Balances</span>
          </label>
        </div>
      </div>

      {/* Trial Balance Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Account Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Debit Balance</th>
                <th className="py-3 px-4 text-right">Credit Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    Computing trial balance...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    No active account balances found as of {asOfDate}.
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                      {row.code}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {row.name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                        {row.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {Number(row.debit) > 0 ? `${currency}${Number(row.debit).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {Number(row.credit) > 0 ? `${currency}${Number(row.credit).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-black text-xs text-slate-900">
              <tr>
                <td colSpan="3" className="py-3.5 px-4 font-bold uppercase tracking-wider">
                  Grand Total (Trial Balance)
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-emerald-700 text-sm">
                  {currency}{Number(trialBalance?.total_debit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-indigo-700 text-sm">
                  {currency}{Number(trialBalance?.total_credit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
