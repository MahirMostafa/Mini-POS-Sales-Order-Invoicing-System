import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Calculator,
  Calendar,
  Printer,
  RefreshCw,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ReportHeader({
  title,
  subtitle,
  icon: Icon = Calculator,
  requiredPermission,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onRefresh,
  loading = false,
  showDateFilter = true,
  children
}) {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const handlePrint = () => {
    window.print();
  };

  const setPresetDates = (type) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (type === 'today') {
      if (setStartDate) setStartDate(todayStr);
      if (setEndDate) setEndDate(todayStr);
    } else if (type === 'this_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      if (setStartDate) setStartDate(firstDay);
      if (setEndDate) setEndDate(todayStr);
    } else if (type === 'last_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0];
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];
      if (setStartDate) setStartDate(firstDay);
      if (setEndDate) setEndDate(lastDay);
    } else if (type === 'this_year') {
      const firstDay = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
      if (setStartDate) setStartDate(firstDay);
      if (setEndDate) setEndDate(todayStr);
    }
  };

  // Check permission
  const isAuthorized = !requiredPermission || hasPermission(requiredPermission);

  if (!isAuthorized) {
    return (
      <div className="bg-white rounded-3xl border border-rose-200 p-10 text-center space-y-4 max-w-xl mx-auto shadow-xs my-8">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-slate-900">Access Denied</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          You do not have the required permission (<code className="px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded font-mono font-bold text-[11px]">{Array.isArray(requiredPermission) ? requiredPermission.join(', ') : requiredPermission}</code>) to view this financial report. Please contact an administrator.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 print:border-none print:shadow-none print:p-0">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Title & Info */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 print:hidden">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-0.5 print:hidden">
              <Link to="/accounts/reports" className="hover:text-slate-600 transition-colors">Accounts</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link to="/accounts/reports" className="hover:text-slate-600 transition-colors">Reports</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-indigo-600">{title}</span>
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">{title}</h1>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 print:hidden">
          {showDateFilter && setStartDate && setEndDate && (
            <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200/80">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 px-2 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Period:</span>
              </div>
              <input
                type="date"
                value={startDate || ''}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-400 font-bold">to</span>
              <input
                type="date"
                value={endDate || ''}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />

              <div className="hidden sm:flex items-center gap-1 pl-1 border-l border-slate-200">
                <button
                  onClick={() => setPresetDates('today')}
                  className="px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-white hover:shadow-xs rounded-md transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={() => setPresetDates('this_month')}
                  className="px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-white hover:shadow-xs rounded-md transition-colors"
                >
                  This Month
                </button>
                <button
                  onClick={() => setPresetDates('this_year')}
                  className="px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-white hover:shadow-xs rounded-md transition-colors"
                >
                  This Year
                </button>
              </div>
            </div>
          )}

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
              title="Refresh Report Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          )}

          <button
            onClick={handlePrint}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>

          {children}
        </div>
      </div>
    </div>
  );
}
