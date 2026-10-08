import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, UserCheck, ShieldCheck, Calculator, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export default function Header({
  onToggleMobileSidebar,
  isSidebarCollapsed = false,
  onToggleCollapse
}) {
  const { user, role } = useAuth();
  const location = useLocation();

  const getPageTitle = (pathname) => {
    if (pathname.startsWith('/pos')) return 'Point of Sale (POS) Counter';
    if (pathname.startsWith('/orders/')) return 'Order Audit & Breakdown';
    if (pathname.startsWith('/orders')) return 'Sales Orders & Invoicing Workflow';
    if (pathname.startsWith('/invoices/')) return 'Official Tax Invoice Preview';
    if (pathname.startsWith('/invoices')) return 'Tax Invoices & Printable Receipts';
    if (pathname.startsWith('/customers')) return 'Customer Management & Directory';
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
      {/* Left: Mobile Toggle / Desktop Collapse Toggle & Page Title */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 lg:hidden"
          title="Open Mobile Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop sidebar toggle button */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden lg:flex p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="w-5 h-5" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
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

      {/* Right: Authenticated User Profile */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs">
            {userRole === 'Admin' ? <ShieldCheck className="w-4 h-4 text-amber-600" /> :
             userRole === 'Accountant' ? <Calculator className="w-4 h-4 text-emerald-600" /> :
             <UserCheck className="w-4 h-4 text-indigo-600" />}
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-slate-800 leading-tight">{user?.name || 'Staff User'}</div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{userRole}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
