import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, UserCheck, ShieldCheck, Calculator } from 'lucide-react';

export default function Header({ onToggleMobileSidebar }) {
  const { user, role, demoUsers, quickLogin } = useAuth();
  const location = useLocation();

  const getPageTitle = (pathname) => {
    if (pathname.startsWith('/pos')) return 'Point of Sale (POS) Counter';
    if (pathname.startsWith('/orders/')) return 'Order Audit & Breakdown';
    if (pathname.startsWith('/orders')) return 'Sales Orders & Invoicing Workflow';
    if (pathname.startsWith('/invoices/')) return 'Official Tax Invoice Preview';
    if (pathname.startsWith('/invoices')) return 'Tax Invoices & Printable Receipts';
    if (pathname.startsWith('/accounting')) return 'Double-Entry Accounting & Ledger';
    if (pathname.startsWith('/products')) return 'Product Catalog & Variant Stock Management';
    if (pathname.startsWith('/purchases')) return 'Purchase Orders & Stock Replenishment';
    if (pathname.startsWith('/taxes')) return 'Dynamic Tax Rates (VAT) Settings';
    if (pathname.startsWith('/users')) return 'User & Employee Management';
    if (pathname.startsWith('/roles')) return 'Spatie Role & Permissions Matrix';
    if (pathname.startsWith('/audit')) return 'Queued Audit Activity Logs';
    return 'Dashboard';
  };

  const userRole = role || user?.roles?.[0]?.name || 'Admin';

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
            {getPageTitle(location.pathname)}
          </h1>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Mini POS • Enterprise Clean Architecture System
          </p>
        </div>
      </div>

      {/* Right: Quick Demo Switcher & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Role Switcher pills for testing */}
        <div className="hidden md:flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
          <span className="text-[10px] font-bold text-slate-400 px-2 uppercase tracking-wider">
            Switch:
          </span>
          {demoUsers.map((u) => {
            const uRole = u.roles?.[0]?.name || 'User';
            const isActive = user?.id === u.id;
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => quickLogin(u.id)}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all ${
                  isActive
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
                title={`Switch session to ${u.name} (${uRole})`}
              >
                {uRole}
              </button>
            );
          })}
        </div>

        {/* User Role Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs">
            {userRole === 'Admin' ? <ShieldCheck className="w-4 h-4 text-amber-600" /> :
             userRole === 'Accountant' ? <Calculator className="w-4 h-4 text-emerald-600" /> :
             <UserCheck className="w-4 h-4 text-indigo-600" />}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-slate-800 leading-none">{user?.name}</div>
            <div className="text-[10px] font-medium text-slate-400">{userRole}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
