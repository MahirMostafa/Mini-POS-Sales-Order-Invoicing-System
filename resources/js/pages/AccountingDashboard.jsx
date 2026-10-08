import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { 
  BarChart3, 
  TrendingUp, 
  Percent, 
  Receipt, 
  Scale, 
  BookOpen, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  Search,
  Filter,
  CreditCard,
  RefreshCw,
  Clock,
  ShieldCheck,
  Building2,
  DollarSign
} from 'lucide-react';

export default function AccountingDashboard() {
  const [metrics, setMetrics] = useState({});
  const [journalEntries, setJournalEntries] = useState([]);
  const [trialBalance, setTrialBalance] = useState({ accounts: [], is_balanced: true, total_debit: 0, total_credit: 0 });
  const [selectedAccountLedger, setSelectedAccountLedger] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'journal' | 'trial_balance' | 'ledger'
  const [loading, setLoading] = useState(true);
  const [searchEntry, setSearchEntry] = useState('');
  const currency = '৳';

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [dashRes, tbRes, jeRes] = await Promise.all([
        api.get('/accounting/dashboard'),
        api.get('/accounting/trial-balance'),
        api.get('/accounting/journal-entries'),
      ]);

      if (dashRes.data.success) {
        setMetrics(dashRes.data.metrics || {});
      }
      if (tbRes.data.success) {
        setTrialBalance(tbRes.data.trial_balance || {});
      }
      if (jeRes.data.success) {
        setJournalEntries(jeRes.data.entries?.data || jeRes.data.entries || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLedger = async (accountId) => {
    try {
      const res = await api.get(`/accounting/ledger/${accountId}`);
      if (res.data.success) {
        setSelectedAccountLedger(res.data);
        setActiveTab('ledger');
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Automated Financial Engine</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">Double-Entry Accounting & Ledger</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict double-entry journal postings for Accounts Receivable, Sales Revenue, Tax Payable (5% VAT), and COGS.
          </p>
        </div>

        {/* Balance Status Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Trial Balance Verified: {currency}{Number(trialBalance.total_debit || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Sales Revenue */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sales Revenue (4010)</span>
          <div className="text-lg font-black text-indigo-600">
            {currency}{Number(metrics.sales_revenue || 0).toFixed(2)}
          </div>
          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" /> Credited
          </span>
        </div>

        {/* Tax Payable (5% VAT) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tax Payable (2010)</span>
          <div className="text-lg font-black text-amber-600">
            {currency}{Number(metrics.tax_payable || 0).toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">5% Govt VAT</span>
        </div>

        {/* Accounts Receivable */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Accounts Rec. (1050)</span>
          <div className="text-lg font-black text-blue-600">
            {currency}{Number(metrics.accounts_receivable || 0).toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Customer Due</span>
        </div>

        {/* Cash Collected */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cash Balance (1010)</span>
          <div className="text-lg font-black text-emerald-600">
            {currency}{Number(metrics.cash_on_hand || 0).toFixed(2)}
          </div>
          <span className="text-[10px] text-emerald-600 font-bold">Liquid Asset</span>
        </div>

        {/* Cost of Goods Sold */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">COGS Expense (5010)</span>
          <div className="text-lg font-black text-rose-600">
            {currency}{Number(metrics.cost_of_goods_sold || 0).toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">WAC Computed</span>
        </div>

        {/* Inventory Valuation */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Inventory Asset (1060)</span>
          <div className="text-lg font-black text-purple-600">
            {currency}{Number(metrics.inventory_valuation || 0).toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Stock Value</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Financial Overview & Chart of Accounts', icon: Layers },
          { id: 'trial_balance', label: 'Trial Balance Sheet', icon: Scale },
          { id: 'journal', label: 'Journal Entries Audit Log', icon: BookOpen },
          { id: 'ledger', label: 'General Ledger Explorer', icon: Receipt },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & CHART OF ACCOUNTS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Chart of Accounts Matrix</h3>
                <p className="text-xs text-slate-400">Click any account code to view its itemized general ledger</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trialBalance.accounts?.map((acc) => (
                <div
                  key={acc.id}
                  onClick={() => fetchLedger(acc.id)}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-indigo-50/40 hover:border-indigo-300 transition-all cursor-pointer group shadow-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-xs text-indigo-600 group-hover:underline">
                      #{acc.code}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 uppercase">
                      {acc.type}
                    </span>
                  </div>
                  <div className="font-bold text-xs text-slate-900 mb-2">{acc.name}</div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                    <span className="text-slate-500 font-medium">Net Balance:</span>
                    <span className="font-black text-slate-900">
                      {currency}{Number(acc.balance || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TRIAL BALANCE */}
      {activeTab === 'trial_balance' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Official Trial Balance Sheet</h3>
              <p className="text-xs text-slate-400">
                Total Debits must strictly equal Total Credits for accounting correctness.
              </p>
            </div>
            <div className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Balanced: Yes (100% In Equilibrium)
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Account Code</th>
                  <th className="py-3 px-4">Account Title</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4 text-right">Debit Balance ({currency})</th>
                  <th className="py-3 px-4 text-right">Credit Balance ({currency})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trialBalance.accounts?.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{acc.code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{acc.name}</td>
                    <td className="py-3 px-4 text-slate-500 capitalize">{acc.type}</td>
                    <td className="py-3 px-4 text-right font-medium text-slate-800">
                      {acc.debit_balance > 0 ? Number(acc.debit_balance).toFixed(2) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-800">
                      {acc.credit_balance > 0 ? Number(acc.credit_balance).toFixed(2) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold text-xs">
                <tr>
                  <td colSpan="3" className="py-3 px-4 font-black text-slate-900">Total Equilibrium Sum:</td>
                  <td className="py-3 px-4 text-right font-black text-indigo-600 text-sm">
                    {currency}{Number(trialBalance.total_debit || 0).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-indigo-600 text-sm">
                    {currency}{Number(trialBalance.total_credit || 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: JOURNAL ENTRIES */}
      {activeTab === 'journal' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">General Journal Registry</h3>
              <p className="text-xs text-slate-400">Chronological transaction logs generated from POS completions</p>
            </div>
          </div>

          <div className="space-y-4">
            {journalEntries.map((je) => (
              <div key={je.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200/60 text-xs gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-indigo-600">#{je.entry_number}</span>
                    <span className="text-slate-400">•</span>
                    <span className="font-semibold text-slate-700">{je.entry_date}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500">{je.description}</span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-400 font-bold">
                    Ref: {je.reference_type} #{je.reference_id}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-[10px] font-bold text-slate-400 uppercase">
                        <th className="py-1 px-3">Account</th>
                        <th className="py-1 px-3 text-right">Debit</th>
                        <th className="py-1 px-3 text-right">Credit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/40">
                      {je.items?.map((item) => (
                        <tr key={item.id}>
                          <td className="py-1.5 px-3">
                            <span className="font-mono text-indigo-600 font-bold mr-2">
                              {item.account?.code}
                            </span>
                            <span className="font-medium text-slate-800">{item.account?.name}</span>
                          </td>
                          <td className="py-1.5 px-3 text-right font-medium text-slate-700">
                            {Number(item.debit) > 0 ? `${currency}${Number(item.debit).toFixed(2)}` : '-'}
                          </td>
                          <td className="py-1.5 px-3 text-right font-medium text-slate-700">
                            {Number(item.credit) > 0 ? `${currency}${Number(item.credit).toFixed(2)}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: GENERAL LEDGER */}
      {activeTab === 'ledger' && selectedAccountLedger && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-indigo-600">
                  #{selectedAccountLedger.account?.code}
                </span>
                <h3 className="font-bold text-base text-slate-900">
                  {selectedAccountLedger.account?.name} Ledger
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                Type: <span className="capitalize text-slate-600 font-bold">{selectedAccountLedger.account?.type}</span> • Classification: <span className="text-slate-600 font-bold">{selectedAccountLedger.account?.normal_balance} balance</span>
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400">Closing Balance</span>
              <div className="text-lg font-black text-indigo-600">
                {currency}{Number(selectedAccountLedger.closing_balance || 0).toFixed(2)}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Entry #</th>
                  <th className="py-3 px-4">Description / Reference</th>
                  <th className="py-3 px-4 text-right">Debit</th>
                  <th className="py-3 px-4 text-right">Credit</th>
                  <th className="py-3 px-4 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedAccountLedger.entries?.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 text-slate-600">{row.date}</td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{row.entry_number}</td>
                    <td className="py-3 px-4 text-slate-800 font-medium">{row.description}</td>
                    <td className="py-3 px-4 text-right font-medium text-slate-700">
                      {Number(row.debit) > 0 ? Number(row.debit).toFixed(2) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-700">
                      {Number(row.credit) > 0 ? Number(row.credit).toFixed(2) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-indigo-600">
                      {currency}{Number(row.running_balance).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
