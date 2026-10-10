import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Menu,
  UserCheck,
  ShieldCheck,
  Calculator,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  LogOut,
  User,
  Mail,
  Shield
} from 'lucide-react';

export default function Header({
  onToggleMobileSidebar,
  isSidebarCollapsed = false,
  onToggleCollapse
}) {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const getPageTitle = (pathname) => {
    // POS & Sales
    if (pathname.startsWith('/pos')) return 'Point of Sale (POS) Counter';
    if (pathname.startsWith('/orders/')) return 'Order Audit & Breakdown';
    if (pathname.startsWith('/orders')) return 'Sales Orders & Invoicing Workflow';
    if (pathname.startsWith('/invoices/')) return 'Official Tax Invoice Preview';
    if (pathname.startsWith('/invoices')) return 'Tax Invoices & Printable Receipts';
    if (pathname.startsWith('/customers')) return 'Customer Management & Directory';

    // Inventory & Purchasing
    if (pathname.startsWith('/categories')) return 'Product Categories & Tags';
    if (pathname.startsWith('/products')) return 'Product Catalog & Variant Stock Management';
    if (pathname.startsWith('/purchases')) return 'Purchase Orders & Stock Replenishment';

    // Accounts Reports & Ledgers
    if (pathname.includes('/chart-of-accounts')) return 'Chart of Accounts (COA)';
    if (pathname.includes('/cash-book')) return 'Cash Book Statement';
    if (pathname.includes('/bank-book')) return 'Bank Book Statement';
    if (pathname.includes('/day-book')) return 'Daily Transaction Journal (Day Book)';
    if (pathname.includes('/general-ledger') || pathname.includes('/ledger')) return 'General Ledger Audit';
    if (pathname.includes('/journal-entries')) return 'Double-Entry Journal Entries';
    if (pathname.includes('/trial-balance')) return 'Trial Balance Financial Report';
    if (pathname.includes('/profit-loss')) return 'Profit & Loss Statement (P&L)';
    if (pathname.includes('/balance-sheet')) return 'Balance Sheet (Financial Position)';
    if (pathname.startsWith('/accounts/cash') || pathname === '/cash') return 'Cash in Hand (Cash Book)';
    if (pathname.startsWith('/accounts/banks') || pathname === '/banks') return 'Bank Accounts & Balances';
    if (pathname.startsWith('/accounts') || pathname.startsWith('/accounting')) return 'Accounting Reports & Financial Hub';

    // Administration & Settings
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

      {/* Right: Authenticated User Profile Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          aria-expanded={dropdownOpen}
          title="Account Menu"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
            {userRole === 'Admin' ? <ShieldCheck className="w-4 h-4 text-amber-600" /> :
              userRole === 'Accountant' ? <Calculator className="w-4 h-4 text-emerald-600" /> :
                <UserCheck className="w-4 h-4 text-indigo-600" />}
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-bold text-slate-800 leading-tight">{user?.name || 'Staff User'}</div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{userRole}</div>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180 text-indigo-600' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-900/10 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {user?.name || 'Staff User'}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {user?.email || 'user@example.com'}
                  </div>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                      userRole === 'Admin'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                        : userRole === 'Accountant'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                    }`}>
                      {userRole}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-1.5">
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200/60 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4 shrink-0 text-rose-500" />
                <span>Sign Out Session</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
