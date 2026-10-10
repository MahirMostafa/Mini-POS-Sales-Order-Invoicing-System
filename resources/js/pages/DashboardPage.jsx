import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Users,
  Package,
  Wallet,
  Building2,
  Calendar,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Receipt,
  FileText,
  CreditCard,
  Percent,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Truck,
  Activity,
  Award,
  Layers,
  Sparkles,
  PieChart,
  BarChart3
} from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, role, hasPermission } = useAuth();
  const currency = '৳';

  // State
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [timeFilter, setTimeFilter] = useState('all'); // 'today' | '7days' | 'this_month' | 'all'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [chartDays, setChartDays] = useState(7);
  const [hoveredBar, setHoveredBar] = useState(null);

  const formatLocalDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Compute dates based on timeFilter
  const getDateRange = (filter) => {
    const today = new Date();
    const todayStr = formatLocalDate(today);

    if (filter === 'today') {
      return { start_date: todayStr, end_date: todayStr };
    }
    if (filter === '7days') {
      const past7 = new Date();
      past7.setDate(today.getDate() - 6);
      return { start_date: formatLocalDate(past7), end_date: todayStr };
    }
    if (filter === 'this_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start_date: formatLocalDate(firstDay), end_date: todayStr };
    }
    if (filter === 'custom' && customStartDate && customEndDate) {
      return { start_date: customStartDate, end_date: customEndDate };
    }
    return { start_date: undefined, end_date: undefined };
  };

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const { start_date, end_date } = getDateRange(timeFilter);
      const res = await api.get('/dashboard/stats', {
        params: { start_date, end_date }
      });
      if (res.data.success) {
        setDashboardData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard statistics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, [timeFilter, customStartDate, customEndDate]);

  const sales = dashboardData?.sales || {};
  const financials = dashboardData?.financials || {};
  const customers = dashboardData?.customers || {};
  const products = dashboardData?.products || {};
  const purchases = dashboardData?.purchases || {};
  const salesByUser = dashboardData?.sales_by_user || [];
  const myMetrics = dashboardData?.my_metrics || {};
  const charts = dashboardData?.charts || {};
  const recentOrders = dashboardData?.recent_orders || [];
  const recentJournals = dashboardData?.recent_journals || [];

  const trendData = chartDays === 30 ? (charts.sales_trend_30 || []) : (charts.sales_trend || []);
  const maxTrendRevenue = Math.max(...trendData.map((d) => d.revenue || 0), 1);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Welcome Banner & Control Toolbar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-600" />
              Executive Control Center
            </span>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              • Real-time Enterprise POS & Accounting Telemetry
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Welcome back, {user?.name || 'Administrator'}!</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
              {role || 'Admin'}
            </span>
          </h1>
          <p className="text-xs text-slate-500">
            Here is your live financial performance, sales volume, customer receivables, and inventory position.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
            <button
              onClick={() => setTimeFilter('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${timeFilter === 'today' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeFilter('7days')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${timeFilter === '7days' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeFilter('this_month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${timeFilter === 'this_month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              This Month
            </button>
            <button
              onClick={() => setTimeFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${timeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              All Time
            </button>
          </div>

          <button
            onClick={fetchDashboardStats}
            disabled={loading}
            className="p-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shadow-xs"
            title="Refresh Live Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {loading && !dashboardData && (
        <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto animate-pulse">
            <Activity className="w-6 h-6 animate-spin" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Compiling Real-Time Dashboard Intelligence...</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Aggregating point-of-sale orders, double-entry ledger vouchers, live stock valuation, and receivables.
          </p>
        </div>
      )}

      {dashboardData && (
        <>
          {/* ========================================================================= */}
          {/* 0. USER-SPECIFIC / MY SHIFT TELEMETRY (Permission Gated Per Card)          */}
          {/* ========================================================================= */}
          {hasPermission([
            'view-dashboard-my-sales',
            'view-dashboard-my-orders',
            'view-dashboard-my-vat',
            'view-dashboard-my-tender',
            'view-dashboard-my-aov'
          ]) && (
            <div className="space-y-4">
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <span>Personal Counter Telemetry</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                        {user?.name}
                      </span>
                    </h2>
                    <p className="text-[11px] text-slate-400">Personal sales volume, processed orders, collected tax, and shift tender mix</p>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-slate-500 font-semibold">
                  {myMetrics.completed_orders || 0} personal orders processed
                </span>
              </div>

              {/* Personal KPI Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. My Shift Gross Sales */}
                {hasPermission(['view-dashboard-my-sales']) && (
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">My Shift Sales (Gross)</span>
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <DollarSign className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2 text-2xl font-black text-indigo-700 font-mono tracking-tight">
                      {currency}{Number(myMetrics.gross_sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-400">Net Revenue:</span>
                      <span className="font-mono font-bold text-slate-700">{currency}{Number(myMetrics.operating_revenue || 0).toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* 2. My Completed Orders */}
                {hasPermission(['view-dashboard-my-orders']) && (
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">My Completed Orders</span>
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <ShoppingCart className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2 text-2xl font-black text-slate-900 font-mono tracking-tight">
                      {myMetrics.completed_orders || 0}
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-400">Pending Orders:</span>
                      <span className="font-bold text-amber-600">{myMetrics.pending_orders || 0} pending</span>
                    </div>
                  </div>
                )}

                {/* 3. My AOV */}
                {hasPermission(['view-dashboard-my-aov']) && (
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">My Avg Order Value</span>
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Receipt className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2 text-2xl font-black text-emerald-700 font-mono tracking-tight">
                      {currency}{Number(myMetrics.average_order_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-400">Total Collected:</span>
                      <span className="font-mono font-bold text-emerald-700">{currency}{Number(myMetrics.total_collected || 0).toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* 4. My Output VAT */}
                {hasPermission(['view-dashboard-my-vat']) && (
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">My VAT Collected</span>
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Percent className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2 text-2xl font-black text-amber-700 font-mono tracking-tight">
                      {currency}{Number(myMetrics.vat_collected || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-400">Discounts Given:</span>
                      <span className="font-mono font-bold text-slate-700">{currency}{Number(myMetrics.discounts_given || 0).toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* My Payment Tenders Breakdown */}
              {hasPermission(['view-dashboard-my-tender']) && (myMetrics.payment_methods || []).length > 0 && (
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                  <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-indigo-600" />
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                        My Tender & Payment Channels Collected
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-400">Shift payment methods breakdown</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    {(myMetrics.payment_methods || []).map((pm, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-emerald-500' : idx === 1 ? 'bg-indigo-500' : 'bg-purple-500'}`} />
                          <span className="text-slate-700 font-bold">{pm.label} ({pm.count} txns)</span>
                        </div>
                        <span className="font-mono font-black text-slate-900">{currency}{Number(pm.amount).toFixed(2)} ({pm.percentage}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 1. SALES & REVENUE KPI CARDS (Granular Card Gated)                        */}
          {/* ========================================================================= */}
          {hasPermission([
            'view-dashboard-gross-revenue',
            'view-dashboard-total-orders',
            'view-dashboard-aov',
            'view-dashboard-vat-collected'
          ]) && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                    <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Sales & Revenue Performance
                    </h2>
                  </div>
                  <span className="text-[11px] text-slate-400 font-semibold">
                    {sales.completed_orders || 0} Completed Orders
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Gross Operating Revenue */}
                  {hasPermission('view-dashboard-gross-revenue') && (
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-purple-300 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gross Operating Revenue</span>
                        <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                          <DollarSign className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="mt-2 text-2xl font-black text-purple-700 font-mono tracking-tight">
                        {currency}{Number(sales.operating_revenue ?? (sales.gross_operating_revenue ?? (financials.sales_revenue ?? 0))).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
                        <span className="text-slate-400">Invoiced: {currency}{Number(sales.gross_invoiced ?? (sales.gross_sales ?? 0)).toFixed(2)} (incl. VAT)</span>
                        {Number(sales.growth_percent || 0) !== 0 && (
                          <span className={`font-bold flex items-center gap-0.5 ${Number(sales.growth_percent) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {Number(sales.growth_percent) >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {sales.growth_percent}%
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Orders Volume */}
                  {hasPermission('view-dashboard-total-orders') && (
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-blue-300 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Completed Orders</span>
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                          <ShoppingCart className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="mt-2 text-2xl font-black text-slate-900 font-mono tracking-tight">
                        {sales.completed_orders || 0}
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
                        <span className="text-slate-400">Total Placed: {sales.total_orders || 0}</span>
                        <span className="font-bold text-amber-600">{sales.pending_orders || 0} Pending</span>
                      </div>
                    </div>
                  )}

                  {/* Average Order Value */}
                  {hasPermission('view-dashboard-aov') && (
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-emerald-300 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg Order Value (AOV)</span>
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <Receipt className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="mt-2 text-2xl font-black text-emerald-700 font-mono tracking-tight">
                        {currency}{Number(sales.average_order_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
                        <span className="text-slate-400">Today: {currency}{Number(sales.today_sales || 0).toFixed(2)}</span>
                        <span className="font-bold text-slate-700">({sales.today_orders_count || 0} orders)</span>
                      </div>
                    </div>
                  )}

                  {/* Output VAT Collected */}
                  {hasPermission('view-dashboard-vat-collected') && (
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-amber-300 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Output VAT Collected</span>
                        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                          <Percent className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="mt-2 text-2xl font-black text-amber-700 font-mono tracking-tight">
                        {currency}{Number(sales.vat_collected || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
                        <span className="text-slate-400">Discounts: {currency}{Number(sales.discounts_given || 0).toFixed(2)}</span>
                        <span className="font-bold text-emerald-700">Paid: {currency}{Number(sales.total_cash_collected || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* ========================================================================= */}
          {/* 2. FINANCIALS & TREASURY CARDS (Granular Card Gated)                      */}
          {/* ========================================================================= */}
          {hasPermission([
            'view-dashboard-cash-in-hand',
            'view-dashboard-bank-balance',
            'view-dashboard-liabilities',
            'view-dashboard-expenses',
            'view-dashboard-net-profit'
          ]) && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Treasury, Liabilities & Operating Profits
                    </h2>
                  </div>
                  <Link
                    to="/accounts/reports/profit-loss"
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <span>View Income Statement</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Cash in Hand */}
                  {hasPermission('view-dashboard-cash-in-hand') && (
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cash in Hand</span>
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <Wallet className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="mt-2 text-xl font-black text-emerald-700 font-mono">
                        {currency}{Number(financials.cash_in_hand || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Drawer & Till balance (1010)</p>
                    </div>
                  )}

                  {/* Bank Balances */}
                  {hasPermission('view-dashboard-bank-balance') && (
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bank Accounts</span>
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                          <Building2 className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="mt-2 text-xl font-black text-blue-700 font-mono">
                        {currency}{Number(financials.total_bank_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">{financials.banks_breakdown?.length || 0} active corporate banks</p>
                    </div>
                  )}

                  {/* Current Liabilities */}
                  {hasPermission('view-dashboard-liabilities') && (
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:border-rose-300 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Current Liabilities</span>
                        <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="mt-2 text-xl font-black text-rose-700 font-mono">
                        {currency}{Number(financials.total_liabilities || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Tax: {currency}{Number(financials.tax_payable || 0).toFixed(2)} | AP: {currency}{Number(financials.accounts_payable || 0).toFixed(2)}</p>
                    </div>
                  )}

                  {/* Operating Expenses */}
                  {hasPermission('view-dashboard-expenses') && (
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Expenses</span>
                        <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                          <Layers className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="mt-2 text-xl font-black text-slate-800 font-mono">
                        {currency}{Number(financials.operating_expenses || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">COGS: {currency}{Number(financials.cost_of_goods_sold || 0).toFixed(2)}</p>
                    </div>
                  )}

                  {/* Net Operating Profit */}
                  {hasPermission('view-dashboard-net-profit') && (
                    <div className={`p-5 rounded-3xl border shadow-xs ${Number(financials.net_profit || 0) >= 0 ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200'
                      }`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${Number(financials.net_profit || 0) >= 0 ? 'text-emerald-800' : 'text-rose-800'
                          }`}>
                          Net Profit
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${Number(financials.net_profit || 0) >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                          {financials.net_profit_margin || 0}%
                        </span>
                      </div>
                      <div className={`mt-2 text-xl font-black font-mono ${Number(financials.net_profit || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                        {currency}{Number(financials.net_profit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Gross: {currency}{Number(financials.gross_profit || 0).toFixed(2)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* ========================================================================= */}
          {/* 3. INTERACTIVE CHARTS & VISUALIZATIONS (Granular Card Gated)              */}
          {/* ========================================================================= */}
          {hasPermission([
            'view-dashboard-revenue-chart',
            'view-dashboard-tender-chart'
          ]) && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Daily Sales Trend Chart */}
                {hasPermission('view-dashboard-revenue-chart') && (
                  <div className={`${hasPermission('view-dashboard-tender-chart') ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-indigo-600" />
                          <span>Revenue & Sales Daily Trend</span>
                        </h3>
                        <p className="text-[11px] text-slate-400">Day-wise sales volume tracking</p>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
                        <button
                          onClick={() => setChartDays(7)}
                          className={`px-2.5 py-1 rounded-lg font-bold transition-all ${chartDays === 7 ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                          7 Days
                        </button>
                        <button
                          onClick={() => setChartDays(30)}
                          className={`px-2.5 py-1 rounded-lg font-bold transition-all ${chartDays === 30 ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                          30 Days
                        </button>
                      </div>
                    </div>

                    {/* Trend Bars Visualization */}
                    <div className="space-y-2">
                      {/* Active hover telemetry info bar */}
                      <div className="h-5 flex items-center justify-between text-xs px-1">
                        {hoveredBar ? (
                          <div className="flex items-center gap-2 font-mono">
                            <span className="font-bold text-slate-800 text-[11px]">{hoveredBar.label || hoveredBar.date}:</span>
                            <span className="font-black text-indigo-600 text-[11px]">{currency}{Number(hoveredBar.revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            <span className="text-[10px] text-slate-400">({hoveredBar.orders_count || 0} orders)</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            {chartDays === 30 ? '30-day continuous revenue stream' : 'Last 7 days daily performance'}
                          </span>
                        )}
                        <span className="font-mono text-[10px] text-slate-400">
                          Peak: {currency}{Number(maxTrendRevenue).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                        </span>
                      </div>

                      {/* Chart track with zero horizontal overflow */}
                      <div className="w-full overflow-hidden">
                        <div className={`h-40 w-full flex items-end ${chartDays === 30 ? 'gap-0.5 sm:gap-1' : 'gap-2 sm:gap-3'} pt-2 pb-6 relative`}>
                          {trendData.map((d, idx) => {
                            const heightPct = Math.max(6, Math.round((d.revenue / maxTrendRevenue) * 100));
                            const isSelected = hoveredBar?.date === d.date;
                            const showLabel = chartDays === 7 || idx % 5 === 0 || idx === trendData.length - 1;

                            return (
                              <div
                                key={idx}
                                onMouseEnter={() => setHoveredBar(d)}
                                onMouseLeave={() => setHoveredBar(null)}
                                className="min-w-0 flex-1 flex flex-col items-center h-full justify-end relative cursor-pointer group"
                              >
                                {/* Bar Column */}
                                <div
                                  style={{ height: `${heightPct}%` }}
                                  className={`w-full ${chartDays === 30 ? 'max-w-[14px] rounded-t-sm' : 'max-w-[36px] rounded-t-xl'} transition-all duration-150 ${isSelected
                                      ? 'bg-gradient-to-t from-indigo-700 to-purple-600 shadow-md ring-2 ring-indigo-300'
                                      : (d.revenue > 0 ? 'bg-gradient-to-t from-indigo-500 to-purple-400 group-hover:from-indigo-600 group-hover:to-purple-500 shadow-xs' : 'bg-slate-100 group-hover:bg-slate-200')
                                    }`}
                                />
                                {/* X-Axis Label */}
                                <span className={`absolute -bottom-5 text-[9px] font-bold text-center truncate w-full pointer-events-none ${isSelected ? 'text-indigo-700 font-black' : 'text-slate-400'
                                  } ${showLabel ? 'block' : 'hidden'}`}>
                                  {chartDays === 7 ? d.short_day : (d.date ? d.date.slice(5) : d.short_day)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Methods Distribution */}
                {hasPermission('view-dashboard-tender-chart') && (
                  <div className={`${hasPermission('view-dashboard-revenue-chart') ? 'lg:col-span-1' : 'lg:col-span-3'} bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4`}>
                    <div className="border-b border-slate-100 pb-3">
                      <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                        <PieChart className="w-4 h-4 text-purple-600" />
                        <span>Tender & Payment Channels</span>
                      </h3>
                      <p className="text-[11px] text-slate-400">Breakdown of tender methods collected</p>
                    </div>

                    <div className="space-y-3">
                      {(charts.payment_methods || []).map((pm, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-700 flex items-center gap-1.5">
                              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                              {pm.label} ({pm.count} txns)
                            </span>
                            <span className="font-mono text-slate-900">
                              {currency}{Number(pm.amount).toFixed(2)} ({pm.percentage}%)
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              style={{ width: `${pm.percentage}%` }}
                              className={`h-full rounded-full ${idx === 0 ? 'bg-emerald-500' : idx === 1 ? 'bg-indigo-500' : idx === 2 ? 'bg-purple-500' : 'bg-amber-500'
                                }`}
                            />
                          </div>
                        </div>
                      ))}
                      {(charts.payment_methods || []).length === 0 && (
                        <div className="py-8 text-center text-xs text-slate-400">No payment data in this period.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* ========================================================================= */}
          {/* 4. CUSTOMERS, PRODUCTS & INVENTORY (Permissions: customers & products)     */}
          {/* ========================================================================= */}
          {(hasPermission('view-dashboard-customers') || hasPermission('view-dashboard-products')) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customers & Receivables */}
              {hasPermission('view-dashboard-customers') && (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-black text-sm text-slate-900">Customers & Receivables</h3>
                        <p className="text-[11px] text-slate-400">{customers.total_customers || 0} registered customer profiles</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Dues (AR)</span>
                      <span className="font-mono font-black text-rose-600 text-base">
                        {currency}{Number(customers.total_receivables || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Top Customers Leaderboard */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Top Customers by Lifetime Spend
                    </span>
                    {(customers.top_customers || []).map((c, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 transition-colors text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </div>
                          <div className="truncate">
                            <div className="font-bold text-slate-900 truncate">{c.name}</div>
                            <div className="text-[10px] text-slate-400">{c.phone || 'No Phone'} • {c.orders_count} orders</div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-mono font-bold text-purple-700">{currency}{Number(c.total_spent).toFixed(2)}</div>
                          {Number(c.current_due) > 0 && (
                            <div className="text-[10px] font-bold text-rose-600 font-mono">Due: {currency}{Number(c.current_due).toFixed(2)}</div>
                          )}
                        </div>
                      </div>
                    ))}
                    {(customers.top_customers || []).length === 0 && (
                      <div className="py-6 text-center text-xs text-slate-400">No customer spend records found.</div>
                    )}
                  </div>
                </div>
              )}

              {/* Products, Stock Valuation & Low Stock Alerts */}
              {hasPermission('view-dashboard-products') && (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-black text-sm text-slate-900">Inventory Valuation & Low Stock</h3>
                        <p className="text-[11px] text-slate-400">{products.total_products || 0} Products ({products.total_units_in_stock || 0} Units)</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Stock Valuation</span>
                      <span className="font-mono font-black text-indigo-700 text-base">
                        {currency}{Number(products.total_stock_cost_value || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Stock KPI Badges */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Expected Retail Sales</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {currency}{Number(products.total_expected_sales_value || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                      <span className="text-[10px] text-emerald-800 font-bold uppercase block">Potential Gross Margin</span>
                      <span className="font-mono font-black text-emerald-700 text-sm">
                        {products.potential_gross_margin || 0}%
                      </span>
                    </div>
                  </div>

                  {/* Low Stock Items List */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Low Stock Alerts ({products.low_stock_count || 0})
                      </span>
                      <Link
                        to="/products"
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800"
                      >
                        Manage Catalog
                      </Link>
                    </div>
                    {(products.low_stock_items || []).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-2xl bg-rose-50/50 border border-rose-100 text-xs">
                        <div>
                          <div className="font-bold text-slate-900">{item.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</div>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-black text-[10px]">
                            {item.stock_quantity} left (Min: {item.alert_quantity})
                          </span>
                        </div>
                      </div>
                    ))}
                    {(products.low_stock_items || []).length === 0 && (
                      <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>All product variants are healthy with sufficient stock!</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. SALES BY USER / CASHIER (Permission: view-dashboard-cashier-leaderboard)*/}
          {/* ========================================================================= */}
          {hasPermission('view-dashboard-cashier-leaderboard') && salesByUser.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    <span>Sales Performance by Staff / Cashier Leaderboard</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Employee sales volume & order attribution</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {salesByUser.map((u, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-900 text-xs truncate">{u.name}</div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                        {u.role}
                      </span>
                    </div>
                    <div className="text-xl font-black font-mono text-purple-700">
                      {currency}{Number(u.total_sales).toFixed(2)}
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                      <span>{u.orders_count} orders completed</span>
                      <span>AOV: {currency}{Number(u.average_order_value).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 6. RECENT SALES ORDERS TABLE (Permission: view-dashboard-recent-orders)   */}
          {/* ========================================================================= */}
          {hasPermission('view-dashboard-recent-orders') && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm text-slate-900">Live Recent Sales Orders</h3>
                  <p className="text-[11px] text-slate-400">Real-time point-of-sale customer transactions</p>
                </div>
                <Link
                  to="/orders"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <span>View All Orders</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Order #</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Cashier</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4 text-right">Grand Total</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentOrders.map((o, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                          <Link to={`/orders/${o.id || o.order_number}`} className="hover:underline">
                            {o.order_number}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {o.order_date}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {o.customer_name}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {o.cashier_name}
                        </td>
                        <td className="py-3 px-4 capitalize text-slate-700">
                          {o.payment_method?.replace('_', ' ')}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {currency}{Number(o.grand_total).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${o.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : o.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {recentOrders.length === 0 && (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-slate-400">
                          No recent sales orders recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 7. EMPTY STATE (When user has view-dashboard but no cards assigned)        */}
          {/* ========================================================================= */}
          {!hasPermission([
            'view-dashboard-my-sales',
            'view-dashboard-my-orders',
            'view-dashboard-my-vat',
            'view-dashboard-my-tender',
            'view-dashboard-my-aov',
            'view-dashboard-gross-revenue',
            'view-dashboard-total-orders',
            'view-dashboard-aov',
            'view-dashboard-vat-collected',
            'view-dashboard-cash-in-hand',
            'view-dashboard-bank-balance',
            'view-dashboard-liabilities',
            'view-dashboard-expenses',
            'view-dashboard-net-profit',
            'view-dashboard-revenue-chart',
            'view-dashboard-tender-chart',
            'view-dashboard-customers',
            'view-dashboard-products',
            'view-dashboard-cashier-leaderboard',
            'view-dashboard-recent-orders'
          ]) && (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">No Analytics Cards Enabled</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Your user role has access to open the dashboard workspace, but no specific KPI telemetry cards or charts have been granted yet. Contact your administrator to enable specific cards under Role & Permissions.
                </p>
              </div>
            )}
        </>
      )}
    </div>
  );
}
