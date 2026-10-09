import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import {
  Calculator,
  BookOpen,
  Calendar,
  DollarSign,
  TrendingUp,
  Scale,
  FileSpreadsheet,
  Layers,
  Wallet,
  Building2,
  ArrowRight,
  TrendingDown,
  Clock,
  ShieldCheck,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ReportHeader from '../../components/ReportHeader';

export default function ReportsOverview() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [stockMetrics, setStockMetrics] = useState(null);
  const [recentJournals, setRecentJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const currency = '৳';

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/accounting/dashboard');
      if (res.data.success) {
        setMetrics(res.data.metrics);
        setStockMetrics(res.data.stock_metrics);
        setRecentJournals(res.data.recent_journal_entries || []);
      }
    } catch (err) {
      console.error('Failed to load accounting overview metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const reportCards = [
    {
      title: 'Chart of Accounts',
      desc: 'Browse hierarchical account ledger codes across Assets, Liabilities, Equity, Revenue, and Expense classes.',
      icon: BookOpen,
      path: '/accounts/reports/chart-of-accounts',
      perms: ['view-chart-of-accounts', 'manage-chart-of-accounts', 'view-accounting-dashboard'],
      badge: 'Master Catalog',
      color: 'indigo'
    },
    {
      title: 'Cash Book',
      desc: 'Track daily cash drawer receipts, operational outflows, cash sales inflows, and current in-hand balance.',
      icon: Wallet,
      path: '/accounts/reports/cash-book',
      perms: ['view-cash-book', 'manage-cash-book', 'view-accounting-dashboard'],
      badge: 'Liquid Cash',
      color: 'emerald'
    },
    {
      title: 'Bank Book',
      desc: 'Inspect corporate bank accounts, statement logs, inter-bank transfers, vendor checks, and bank deposits.',
      icon: Building2,
      path: '/accounts/reports/bank-book',
      perms: ['view-bank-book', 'view-banks', 'manage-banks', 'view-accounting-dashboard'],
      badge: 'Banking & Statements',
      color: 'blue'
    },
    {
      title: 'Day Book',
      desc: 'Review daily chronological transaction journals and total debit/credit flows for any selected calendar date.',
      icon: Calendar,
      path: '/accounts/reports/day-book',
      perms: ['view-day-book', 'view-accounting-dashboard'],
      badge: 'Daily Audit',
      color: 'purple'
    },
    {
      title: 'General Ledger',
      desc: 'View comprehensive statement of accounts with running debit/credit balances for individual chart heads.',
      icon: Layers,
      path: '/accounts/reports/general-ledger',
      perms: ['view-ledger', 'view-accounting-dashboard'],
      badge: 'Account Ledgers',
      color: 'cyan'
    },
    {
      title: 'Journal Entries & Vouchers',
      desc: 'View complete double-entry transaction journals (Sales, Purchases, Settlements, Opening Stocks) and post manual vouchers.',
      icon: FileSpreadsheet,
      path: '/accounts/reports/journal-entries',
      perms: ['view-journal-entries', 'view-accounting-dashboard'],
      badge: 'Double Entry Logs',
      color: 'amber'
    },
    {
      title: 'Trial Balance',
      desc: 'Verify that total debits equal total credits across all active accounts to ensure double-entry accounting integrity.',
      icon: Scale,
      path: '/accounts/reports/trial-balance',
      perms: ['view-trial-balance', 'view-accounting-dashboard'],
      badge: 'Accounting Check',
      color: 'slate'
    },
    {
      title: 'Profit & Loss Statement',
      desc: 'Measure financial performance: Operating Revenue minus COGS minus Operational Expenses equals Net Profit.',
      icon: TrendingUp,
      path: '/accounts/reports/profit-loss',
      perms: ['view-profit-loss', 'view-accounting-dashboard'],
      badge: 'Income Statement',
      color: 'rose'
    },
    {
      title: 'Balance Sheet',
      desc: 'Verify financial position at any date: Current Assets = Current Liabilities + Owner Equity.',
      icon: DollarSign,
      path: '/accounts/reports/balance-sheet',
      perms: ['view-balance-sheet', 'view-accounting-dashboard'],
      badge: 'Financial Position',
      color: 'emerald'
    },
  ];

  return (
    <div className="space-y-8">
      <ReportHeader
        title="Accounting & Financial Reports"
        subtitle="Centralized reporting suite with deep-linked financial books, balance sheets, and audit logs."
        icon={Calculator}
        showDateFilter={false}
        onRefresh={fetchOverviewData}
        loading={loading}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Sales Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 font-mono">
            {currency}{Number(metrics?.total_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-1">Recognized operating income</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cash in Hand</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 font-mono">
            {currency}{Number(metrics?.cash_in_hand || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Physical drawer cash balance</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bank Balance</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 font-mono">
            {currency}{Number(metrics?.total_bank_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-blue-600 font-medium mt-1">Liquid corporate bank funds</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inventory Stock Assets</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 font-mono">
            {currency}{Number(stockMetrics?.total_stock_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-amber-600 font-medium mt-1">Valuation at purchase cost</p>
        </div>
      </div>

      {/* Reports Directory Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-black text-slate-900">Financial Reports & Ledgers</h2>
            <p className="text-xs text-slate-500">Select any report below to inspect statements, apply date filters, and print vouchers.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reportCards.filter((c) => hasPermission(c.perms)).map((card) => {
            const CardIcon = card.icon;
            return (
              <div
                key={card.path}
                onClick={() => navigate(card.path)}
                className="bg-white rounded-3xl border border-slate-200 p-6 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <CardIcon className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wider">
                      {card.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
                  <span>Open Report</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Journal Activity */}
      {recentJournals.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <h3 className="font-black text-sm text-slate-900">Recent Double-Entry Journal Postings</h3>
            </div>
            <button
              onClick={() => navigate('/accounts/reports/journal-entries')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>View All Entries</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Entry Number</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4">Reference</th>
                  <th className="py-2.5 px-4 text-right">Debit</th>
                  <th className="py-2.5 px-4 text-right">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentJournals.slice(0, 5).map((entry) => {
                  const debitTotal = (entry.items || []).reduce((acc, i) => acc + Number(i.debit || 0), 0);
                  const creditTotal = (entry.items || []).reduce((acc, i) => acc + Number(i.credit || 0), 0);
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {entry.entry_date?.split('T')[0] || entry.entry_date}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                        {entry.entry_number}
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium max-w-xs truncate">
                        {entry.description}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {entry.reference_type || 'Manual Voucher'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {currency}{debitTotal.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {currency}{creditTotal.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
