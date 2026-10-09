import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  DollarSign,
  Building2,
  Wallet,
  CheckCircle2,
  Package,
  Users,
  ShieldCheck,
  Scale
} from 'lucide-react';
import ReportHeader from '../../components/ReportHeader';

export default function BalanceSheetReport() {
  const today = new Date().toISOString().split('T')[0];
  const [asOfDate, setAsOfDate] = useState(today);
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const currency = '৳';

  const fetchBalanceSheet = async () => {
    setLoading(true);
    try {
      const res = await api.get('/accounting/balance-sheet', {
        params: {
          as_of_date: asOfDate
        }
      });
      if (res.data.success) {
        setBalanceSheet(res.data.balance_sheet);
      }
    } catch (err) {
      console.error('Failed to load balance sheet', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalanceSheet();
  }, [asOfDate]);

  const totalAssets = Number(balanceSheet?.assets?.total_assets || 0);
  const totalLiabilities = Number(balanceSheet?.liabilities?.total_liabilities || 0);
  const totalEquity = Number(balanceSheet?.equity?.total_equity || 0);
  const totalLiabEquity = Number(balanceSheet?.total_liabilities_and_equity || (totalLiabilities + totalEquity));
  const isBalanced = Math.abs(totalAssets - totalLiabEquity) < 0.01;

  return (
    <div className="space-y-6">
      <ReportHeader
        title="Balance Sheet Report"
        subtitle="Statement of Financial Position: Current Assets = Current Liabilities + Owner Equity."
        icon={DollarSign}
        requiredPermission={['view-balance-sheet', 'view-accounting-dashboard']}
        showDateFilter={false}
        onRefresh={fetchBalanceSheet}
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

      {/* Accounting Equation Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">Accounting Equation:</span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 font-mono flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              Assets ({currency}{totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}) = Liabilities & Equity ({currency}{totalLiabEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })})
            </span>
          </span>
        </div>
        <div className="text-xs font-bold text-slate-500">
          Statement As of: <span className="font-black text-slate-900">{asOfDate}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Assets Column */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900">1. Current Assets</h3>
              <p className="text-[11px] text-slate-400">Cash, liquid bank accounts, inventory, and receivables</p>
            </div>
            <span className="font-mono font-black text-emerald-700 text-lg">
              {currency}{totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <div className="font-bold text-slate-800 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-600" />
                <span>Cash in Hand (1010)</span>
              </div>
              <span className="font-mono font-bold text-slate-900">
                {currency}{Number(balanceSheet?.assets?.cash_in_hand || 0).toFixed(2)}
              </span>
            </div>

            <div className="py-2 border-b border-slate-100 space-y-1">
              <div className="flex justify-between">
                <div className="font-bold text-slate-800 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>Bank Accounts Balance (1020)</span>
                </div>
                <span className="font-mono font-bold text-slate-900">
                  {currency}{Number(balanceSheet?.assets?.bank_accounts || 0).toFixed(2)}
                </span>
              </div>
              {balanceSheet?.assets?.bank_accounts_detail?.map((b, idx) => (
                <div key={idx} className="flex justify-between pl-6 text-[11px] text-slate-500">
                  <span>• {b.name}</span>
                  <span className="font-mono">{currency}{Number(b.balance).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between py-2 border-b border-slate-100">
              <div className="font-bold text-slate-800 flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-600" />
                <span>Merchandise Inventory Stock Assets (1060)</span>
              </div>
              <span className="font-mono font-bold text-slate-900">
                {currency}{Number(balanceSheet?.assets?.merchandise_inventory || 0).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-100">
              <div className="font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" />
                <span>Accounts Receivable / Customer Dues (1050)</span>
              </div>
              <span className="font-mono font-bold text-slate-900">
                {currency}{Number(balanceSheet?.assets?.accounts_receivable || 0).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between py-3 bg-emerald-50/70 p-3 rounded-xl font-black text-emerald-950 text-sm">
              <span>TOTAL ASSETS</span>
              <span className="font-mono">
                {currency}{totalAssets.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Liabilities & Equity Column */}
        <div className="space-y-6">
          {/* Liabilities */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">2. Current Liabilities</h3>
                <p className="text-[11px] text-slate-400">Supplier payables and tax obligations</p>
              </div>
              <span className="font-mono font-black text-rose-600 text-lg">
                {currency}{totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-700 font-bold">Accounts Payable / Supplier Dues (2020)</span>
                <span className="font-mono font-bold text-slate-900">
                  {currency}{Number(balanceSheet?.liabilities?.accounts_payable || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-700 font-bold">Sales Tax / VAT Payable (2010)</span>
                <span className="font-mono font-bold text-slate-900">
                  {currency}{Number(balanceSheet?.liabilities?.tax_payable || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-2.5 bg-rose-50/60 p-3 rounded-xl font-bold text-rose-950">
                <span>Total Liabilities</span>
                <span className="font-mono">
                  {currency}{totalLiabilities.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Equity */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">3. Owner's Equity</h3>
                <p className="text-[11px] text-slate-400">Capital contributions & retained earnings</p>
              </div>
              <span className="font-mono font-black text-blue-700 text-lg">
                {currency}{totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-700 font-bold">Owner's Capital (3010)</span>
                <span className="font-mono font-bold text-slate-900">
                  {currency}{Number(balanceSheet?.equity?.owner_capital || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-700 font-bold">Retained Earnings (3020)</span>
                <span className="font-mono font-bold text-slate-900">
                  {currency}{Number(balanceSheet?.equity?.retained_earnings || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-indigo-700 font-bold">Current Period Net Earnings</span>
                <span className="font-mono font-bold text-indigo-700">
                  {currency}{Number(balanceSheet?.equity?.current_period_earnings || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-3 bg-blue-50/70 p-3 rounded-xl font-black text-blue-950 text-sm">
                <span>TOTAL LIABILITIES & OWNER EQUITY</span>
                <span className="font-mono">
                  {currency}{totalLiabEquity.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
