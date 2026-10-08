import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
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
  CreditCard
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
        setJournalEntries(jeRes.data.entries.data || []);
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
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            Double-Entry Accounting & Financial Ledger
          </h1>
          <p className="text-xs text-slate-400">
            Real-time Accounts Receivable, Sales Revenue, 5% Tax Payable, Trial Balance, and General Ledger.
          </p>
        </div>

        {/* Balance Status Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" />
            Double-Entry Balanced: {currency}{Number(trialBalance.total_debit || 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Sales Revenue */}
        <div className="glass-panel rounded-2xl p-3.5 space-y-1 bg-gradient-to-br from-indigo-950/30 to-slate-900 border border-indigo-500/20">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sales Revenue (4010)</span>
          <div className="text-lg font-black text-indigo-300">
            {currency}{Number(metrics.sales_revenue || 0).toFixed(2)}
          </div>
          <span className="text-[10px] text-emerald-400 flex items-center font-medium">
            <ArrowUpRight className="w-3 h-3" /> Net Sales Income
          </span>
        </div>

        {/* Tax Payable (5% VAT) */}
        <div className="glass-panel rounded-2xl p-3.5 space-y-1 bg-gradient-to-br from-amber-950/30 to-slate-900 border border-amber-500/20">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tax Payable (2010)</span>
          <div className="text-lg font-black text-amber-300">
            {currency}{Number(metrics.tax_payable || 0).toFixed(2)}
          </div>
          <span className="text-[10px] text-amber-400 font-medium">
            5.0% Sales Tax Liability
          </span>
        </div>

        {/* Accounts Receivable */}
        <div className="glass-panel rounded-2xl p-3.5 space-y-1 bg-gradient-to-br from-sky-950/30 to-slate-900 border border-sky-500/20">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Accounts Receivable (1050)</span>
          <div className="text-lg font-black text-sky-300">
            {currency}{Number(metrics.accounts_receivable || 0).toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            Customer Invoices Due
          </span>
        </div>

        {/* Cash in Hand */}
        <div className="glass-panel rounded-2xl p-3.5 space-y-1 bg-gradient-to-br from-emerald-950/30 to-slate-900 border border-emerald-500/20">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cash in Hand (1010)</span>
          <div className="text-lg font-black text-emerald-300">
            {currency}{Number(metrics.cash_balance || 0).toFixed(2)}
          </div>
          <span className="text-[10px] text-emerald-400 font-medium">
            POS Register Balance
          </span>
        </div>

        {/* Cost of Goods Sold */}
        <div className="glass-panel rounded-2xl p-3.5 space-y-1 bg-gradient-to-br from-purple-950/30 to-slate-900 border border-purple-500/20">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">COGS (5010)</span>
          <div className="text-lg font-black text-purple-300">
            {currency}{Number(metrics.cogs || 0).toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            Inventory Cost Sold
          </span>
        </div>

        {/* Gross Profit */}
        <div className="glass-panel rounded-2xl p-3.5 space-y-1 bg-gradient-to-br from-teal-950/30 to-slate-900 border border-teal-500/20">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gross Profit</span>
          <div className="text-lg font-black text-teal-300">
            {currency}{Number(metrics.gross_profit || 0).toFixed(2)}
          </div>
          <span className="text-[10px] text-teal-400 font-medium">
            Sales minus COGS
          </span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        {[
          { id: 'overview', label: 'Overview & Trial Balance', icon: Scale },
          { id: 'journal', label: 'General Journal Entries', icon: BookOpen },
          { id: 'ledger', label: 'General Ledger View', icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: TRIAL BALANCE STATEMENT */}
      {activeTab === 'overview' && (
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 shadow-xl space-y-4 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Scale className="w-4 h-4 text-indigo-400" /> Trial Balance Statement
              </h3>
              <p className="text-xs text-slate-400">
                Sum of Debits and Credits must balance to verify mathematical accuracy of the general ledger.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Balanced: SUM(Debits) == SUM(Credits)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Account Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Normal Balance</th>
                  <th className="py-3 px-4 text-right">Debit Balance ({currency})</th>
                  <th className="py-3 px-4 text-right">Credit Balance ({currency})</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {trialBalance.accounts?.map((acc) => (
                  <tr key={acc.account_id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-400">{acc.account_code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-100">{acc.account_name}</td>
                    <td className="py-3 px-4 text-slate-400">{acc.account_type}</td>
                    <td className="py-3 px-4 text-slate-400">{acc.normal_balance}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400">
                      {acc.net_debit > 0 ? Number(acc.net_debit).toFixed(2) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-indigo-300">
                      {acc.net_credit > 0 ? Number(acc.net_credit).toFixed(2) : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => fetchLedger(acc.account_id)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 transition-colors"
                      >
                        View Ledger
                      </button>
                    </td>
                  </tr>
                ))}
                {/* Total Row */}
                <tr className="bg-slate-900/90 font-black text-sm border-t-2 border-indigo-500">
                  <td colSpan={4} className="py-3 px-4 text-right uppercase tracking-wider text-slate-200">
                    Total Balanced Sum:
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-400 font-mono">
                    {currency}{Number(trialBalance.total_debit || 0).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right text-indigo-300 font-mono">
                    {currency}{Number(trialBalance.total_credit || 0).toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: JOURNAL ENTRIES */}
      {activeTab === 'journal' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" /> General Journal Entries
            </h3>
            <span className="text-xs text-slate-400">Total {journalEntries.length} posted entries</span>
          </div>

          <div className="space-y-3">
            {journalEntries.map((je) => (
              <div key={je.id} className="glass-panel rounded-2xl p-4 space-y-3 border border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-indigo-400 text-xs px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                      {je.entry_number}
                    </span>
                    <span className="text-xs text-slate-400">{je.entry_date}</span>
                    <span className="text-xs text-slate-300 font-medium">• {je.description}</span>
                  </div>
                  <div className="text-xs font-bold text-emerald-400">
                    Balanced: {currency}{Number(je.total_debit).toFixed(2)}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-[10px] uppercase text-slate-500">
                      <tr>
                        <th className="py-1.5 px-2">Account Code & Name</th>
                        <th className="py-1.5 px-2">Narration</th>
                        <th className="py-1.5 px-2 text-right">Debit ({currency})</th>
                        <th className="py-1.5 px-2 text-right">Credit ({currency})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {je.items?.map((item) => (
                        <tr key={item.id}>
                          <td className="py-1.5 px-2 text-slate-200 font-sans">
                            <span className="text-indigo-400 font-mono mr-2">{item.account?.account_code}</span>
                            {item.account?.account_name}
                          </td>
                          <td className="py-1.5 px-2 text-slate-400 font-sans text-[11px]">{item.narration}</td>
                          <td className="py-1.5 px-2 text-right text-emerald-400 font-bold">
                            {Number(item.debit) > 0 ? Number(item.debit).toFixed(2) : '-'}
                          </td>
                          <td className="py-1.5 px-2 text-right text-indigo-300 font-bold">
                            {Number(item.credit) > 0 ? Number(item.credit).toFixed(2) : '-'}
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

      {/* TAB 3: LEDGER STATEMENT VIEW */}
      {activeTab === 'ledger' && (
        <div className="glass-panel rounded-2xl p-5 space-y-4 border border-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                {selectedAccountLedger?.account ? (
                  <>
                    Ledger for <span className="font-mono text-indigo-400">[{selectedAccountLedger.account.account_code}]</span> {selectedAccountLedger.account.account_name}
                  </>
                ) : (
                  'Select an Account to View Ledger'
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Type: {selectedAccountLedger?.account?.account_type} • Normal Balance: {selectedAccountLedger?.account?.normal_balance}
              </p>
            </div>

            {/* Account Selector dropdown */}
            <select
              value={selectedAccountLedger?.account?.id || ''}
              onChange={(e) => fetchLedger(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none"
            >
              <option value="">Choose Account...</option>
              {trialBalance.accounts?.map((acc) => (
                <option key={acc.account_id} value={acc.account_id}>
                  {acc.account_code} - {acc.account_name}
                </option>
              ))}
            </select>
          </div>

          {selectedAccountLedger?.ledger_items ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Entry #</th>
                    <th className="py-2.5 px-3">Narration / Description</th>
                    <th className="py-2.5 px-3 text-right">Debit ({currency})</th>
                    <th className="py-2.5 px-3 text-right">Credit ({currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono text-xs">
                  {selectedAccountLedger.ledger_items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 text-slate-400 font-sans">{item.entry?.entry_date}</td>
                      <td className="py-2.5 px-3 text-indigo-400 font-bold">{item.entry?.entry_number}</td>
                      <td className="py-2.5 px-3 text-slate-200 font-sans">{item.narration || item.entry?.description}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                        {Number(item.debit) > 0 ? Number(item.debit).toFixed(2) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-indigo-300">
                        {Number(item.credit) > 0 ? Number(item.credit).toFixed(2) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              Select an account from the dropdown above to view its detailed general ledger postings.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
