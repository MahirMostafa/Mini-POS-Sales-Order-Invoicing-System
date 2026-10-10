import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Calendar
} from 'lucide-react';
import ReportHeader from '../../components/ReportHeader';

export default function ProfitLossReport() {
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [profitLoss, setProfitLoss] = useState(null);
  const [loading, setLoading] = useState(true);
  const currency = '৳';

  const fetchProfitLoss = async () => {
    setLoading(true);
    try {
      const res = await api.get('/accounting/profit-loss', {
        params: {
          start_date: startDate,
          end_date: endDate
        }
      });
      if (res.data.success) {
        setProfitLoss(res.data.profit_and_loss);
      }
    } catch (err) {
      console.error('Failed to load P&L', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfitLoss();
  }, [startDate, endDate]);

  const netSales = Number(profitLoss?.net_sales ?? profitLoss?.sales_revenue ?? 0);
  const cogs = Number(profitLoss?.cost_of_goods_sold ?? profitLoss?.cogs ?? 0);
  const grossProfit = Number(profitLoss?.gross_profit ?? (netSales - cogs));
  const expenses = Number(profitLoss?.total_expenses ?? 0);
  const netProfit = Number(profitLoss?.net_profit ?? (grossProfit - expenses));
  const marginPct = netSales > 0 ? ((netProfit / netSales) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      <ReportHeader
        title="Profit & Loss Statement (P&L)"
        subtitle="Income statement measuring revenue, cost of goods sold, operating expenses, and net profit."
        icon={TrendingUp}
        requiredPermission={['view-profit-loss', 'view-accounting-dashboard']}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        onRefresh={fetchProfitLoss}
        loading={loading}
      />

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Operating Revenue</span>
          <div className="mt-2 text-2xl font-black text-purple-700 font-mono">
            {currency}{netSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total recognized sales</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cost of Goods Sold (COGS)</span>
          <div className="mt-2 text-2xl font-black text-rose-600 font-mono">
            {currency}{cogs.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Direct inventory costs</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Profit</span>
          <div className="mt-2 text-2xl font-black text-blue-700 font-mono">
            {currency}{grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-blue-600 mt-1">Revenue minus direct COGS</p>
        </div>

        <div className={`p-5 rounded-3xl border shadow-xs ${
          netProfit >= 0 ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${
              netProfit >= 0 ? 'text-emerald-800' : 'text-rose-800'
            }`}>
              Net Operating Profit
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              netProfit >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {marginPct}% Margin
            </span>
          </div>
          <div className={`mt-2 text-2xl font-black font-mono ${
            netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
          }`}>
            {currency}{netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Bottom-line operating performance</p>
        </div>
      </div>

      {/* Income Statement Structured View */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
        <h3 className="font-black text-base text-slate-900 border-b border-slate-100 pb-3">
          Income Statement Breakdown ({startDate} to {endDate})
        </h3>

        <div className="space-y-4 text-xs font-medium">
          {/* Revenue */}
          <div className="p-4 rounded-2xl bg-slate-50 space-y-2">
            <div className="flex justify-between font-bold text-slate-900 text-sm">
              <span>1. Operating Revenue (Sales)</span>
              <span className="font-mono text-purple-700">
                {currency}{netSales.toFixed(2)}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">Total credited to 4010 Sales Revenue</div>
          </div>

          {/* COGS */}
          <div className="p-4 rounded-2xl bg-slate-50 space-y-2">
            <div className="flex justify-between font-bold text-slate-900 text-sm">
              <span>2. Cost of Goods Sold (COGS)</span>
              <span className="font-mono text-rose-600">
                ({currency}{cogs.toFixed(2)})
              </span>
            </div>
            <div className="text-[11px] text-slate-400">Inventory cost recognized upon sales completion (5010)</div>
          </div>

          {/* Gross Profit */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex justify-between font-black text-blue-950 text-sm">
            <span>GROSS OPERATING PROFIT</span>
            <span className="font-mono">
              {currency}{grossProfit.toFixed(2)}
            </span>
          </div>

          {/* Expenses */}
          <div className="p-4 rounded-2xl bg-slate-50 space-y-2">
            <div className="flex justify-between font-bold text-slate-900 text-sm">
              <span>3. Operating & Administrative Expenses</span>
              <span className="font-mono text-rose-600">
                ({currency}{expenses.toFixed(2)})
              </span>
            </div>
            <div className="text-[11px] text-slate-400">General operating, utility, rent & petty expenses (6010)</div>
          </div>

          {/* Net Profit */}
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex justify-between font-black text-emerald-950 text-base">
            <span>NET OPERATING PROFIT / (LOSS)</span>
            <span className="font-mono">
              {currency}{netProfit.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
