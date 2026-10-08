import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShoppingCart, 
  FileText, 
  Receipt, 
  BarChart3, 
  Package, 
  Percent, 
  History, 
  UserCheck, 
  LogOut, 
  ShieldCheck, 
  Store
} from 'lucide-react';

export default function Navbar({ activePage, setActivePage }) {
  const { user, role, demoUsers, quickLogin, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navItems = [
    { id: 'pos', label: 'POS Terminal', icon: ShoppingCart },
    { id: 'orders', label: 'Sales Orders', icon: FileText },
    { id: 'invoices', label: 'Invoices', icon: Receipt },
    { id: 'accounting', label: 'Accounting', icon: BarChart3 },
    { id: 'products', label: 'Products & Stock', icon: Package },
    { id: 'taxes', label: 'Tax Rates', icon: Percent },
    { id: 'audit', label: 'Audit Logs', icon: History },
  ];

  return (
    <nav className="glass-panel sticky top-0 z-40 border-b border-slate-800/80 px-4 lg:px-6 py-2.5 backdrop-blur-md">
      <div className="flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
                Mini POS
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                v2.3
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Sales Order & Invoicing System</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* User Badge & Quick Role Switcher */}
        <div className="flex items-center gap-3">
          {/* Quick Role Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/60 hover:border-indigo-500/50 transition-all text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 text-xs font-bold">
                {user?.name ? user.name.charAt(0) : 'U'}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-semibold text-slate-200 leading-tight flex items-center gap-1.5">
                  {user?.name || 'Cashier Desk'}
                  <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                    role === 'Admin' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    role === 'Accountant' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                  }`}>
                    {role || 'Admin'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">Click to switch role</div>
              </div>
            </button>

            {/* Role Switcher Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-700/80 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                  <p className="text-[11px] font-medium text-slate-400">Switch Demo Role (1-Click)</p>
                </div>
                <div className="space-y-1">
                  {demoUsers.map((u) => {
                    const uRole = u.roles?.[0]?.name || 'User';
                    const isCurrent = user?.id === u.id;
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          quickLogin(u.id);
                          setShowUserMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${
                          isCurrent 
                            ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-200' 
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <UserCheck className={`w-4 h-4 ${isCurrent ? 'text-indigo-400' : 'text-slate-500'}`} />
                          <div className="text-left">
                            <p className="font-medium leading-tight">{u.name}</p>
                            <p className="text-[10px] text-slate-400">{u.email}</p>
                          </div>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {uRole}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile navigation row */}
      <div className="flex md:hidden items-center gap-1 overflow-x-auto pt-2.5 pb-1 border-t border-slate-800/60 mt-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
