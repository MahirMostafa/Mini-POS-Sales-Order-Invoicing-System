import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Store,
  ShoppingCart,
  Receipt,
  FileText,
  Package,
  Tags,
  Truck,
  Calculator,
  Percent,
  Users,
  ShieldCheck,
  Activity,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Wallet,
  Building2,
  BookOpen,
  Scale,
  Calendar,
  Layers,
  FileSpreadsheet,
  TrendingUp
} from 'lucide-react';

export default function Sidebar({
  isMobileOpen,
  setIsMobileOpen,
  isCollapsed = false,
  toggleCollapse
}) {
  const { user, role, hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [reportsOpen, setReportsOpen] = useState(true);

  const navGroups = [
    {
      title: 'Overview',
      items: [
        {
          path: '/dashboard',
          label: 'Executive Dashboard',
          icon: LayoutDashboard,
          permissions: ['view-dashboard'],
          badge: 'Live',
          badgeColor: 'bg-indigo-100 text-indigo-700'
        }
      ]
    },
    {
      title: 'POS & Sales',
      items: [
        {
          path: '/pos',
          label: 'POS Counter',
          icon: ShoppingCart,
          permissions: ['view-pos'],
          badge: 'POS',
          badgeColor: 'bg-emerald-100 text-emerald-700'
        },
        {
          path: '/orders',
          label: 'Sales Orders',
          icon: Receipt,
          permissions: ['create-order', 'complete-order']
        },
        {
          path: '/invoices',
          label: 'Invoices & Receipts',
          icon: FileText,
          permissions: ['view-invoices', 'print-invoices']
        },
        {
          path: '/customers',
          label: 'Manage Customers',
          icon: Users,
          permissions: ['view-customers', 'manage-customers']
        }
      ]
    },
    {
      title: 'Inventory & Procurement',
      items: [
        {
          path: '/categories',
          label: 'Manage Categories',
          icon: Tags,
          permissions: ['manage-categories', 'view-categories']
        },
        {
          path: '/products',
          label: 'Manage Products',
          icon: Package,
          permissions: ['manage-products']
        },
        {
          path: '/purchases',
          label: 'Manage Purchases',
          icon: Truck,
          permissions: ['manage-purchases', 'receive-purchases']
        }
      ]
    },
    {
      title: 'Accounts',
      items: [
        {
          path: '/accounts/cash',
          label: 'Cash in Hand (Cash)',
          icon: Wallet,
          permissions: ['view-cash-book', 'manage-cash-book'],
        },
        {
          path: '/accounts/banks',
          label: 'Bank Accounts (Banks)',
          icon: Building2,
          permissions: ['view-banks', 'view-bank-book', 'manage-banks'],
        },
        {
          path: '/accounts/reports',
          label: 'Accounting Reports',
          icon: Calculator,
          permissions: [
            'view-accounting-dashboard',
            'view-chart-of-accounts',
            'manage-chart-of-accounts',
            'view-cash-book',
            'manage-cash-book',
            'view-bank-book',
            'view-day-book',
            'view-ledger',
            'view-journal-entries',
            'view-trial-balance',
            'view-profit-loss',
            'view-balance-sheet'
          ],
          hasSubItems: true,
          subItems: [
            { path: '/accounts/reports/chart-of-accounts', label: 'Chart of Accounts', permissions: ['view-chart-of-accounts', 'manage-chart-of-accounts', 'view-accounting-dashboard'] },
            { path: '/accounts/reports/cash-book', label: 'Cash Book', permissions: ['view-cash-book', 'manage-cash-book', 'view-accounting-dashboard'] },
            { path: '/accounts/reports/bank-book', label: 'Bank Book', permissions: ['view-bank-book', 'view-banks', 'manage-banks', 'view-accounting-dashboard'] },
            { path: '/accounts/reports/day-book', label: 'Day Book', permissions: ['view-day-book', 'view-accounting-dashboard'] },
            { path: '/accounts/reports/general-ledger', label: 'General Ledger', permissions: ['view-ledger', 'view-accounting-dashboard'] },
            { path: '/accounts/reports/journal-entries', label: 'Journal Entries', permissions: ['view-journal-entries', 'view-accounting-dashboard'] },
            { path: '/accounts/reports/trial-balance', label: 'Trial Balance', permissions: ['view-trial-balance', 'view-accounting-dashboard'] },
            { path: '/accounts/reports/profit-loss', label: 'Profit & Loss (P&L)', permissions: ['view-profit-loss', 'view-accounting-dashboard'] },
            { path: '/accounts/reports/balance-sheet', label: 'Balance Sheet', permissions: ['view-balance-sheet', 'view-accounting-dashboard'] },
          ]
        },
        {
          path: '/taxes',
          label: 'Tax Rates (VAT)',
          icon: Percent,
          permissions: ['manage-tax-rates']
        }
      ]
    },
    {
      title: 'Administration',
      items: [
        {
          path: '/users',
          label: 'Manage Users',
          icon: Users,
          permissions: ['manage-users']
        },
        {
          path: '/roles',
          label: 'Role & Permissions',
          icon: ShieldCheck,
          permissions: ['manage-roles']
        },
        {
          path: '/audit',
          label: 'Audit Activity Logs',
          icon: Activity,
          permissions: ['view-audit-logs']
        }
      ]
    }
  ];

  const handleNavClick = (path) => {
    navigate(path);
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-72'
          } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className={`h-16 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 ${isCollapsed ? 'px-3 justify-center' : 'px-5'
          }`}>
          <Link
            to="/dashboard"
            onClick={() => {
              if (setIsMobileOpen) setIsMobileOpen(false);
            }}
            className={`flex items-center gap-3 min-w-0 group hover:opacity-90 transition-opacity ${isCollapsed ? 'justify-center' : ''}`}
            title="MINI POS & ERP"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
              <Store className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5 truncate group-hover:text-indigo-600 transition-colors">
                  MINI POS & ERP
                </div>
                <div className="text-[11px] font-medium text-slate-400 truncate">
                  Sales & Accounting Hub
                </div>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className={`flex-1 overflow-y-auto ${isCollapsed ? 'px-2 py-2 space-y-3' : 'px-4 py-2 space-y-5'}`}>
          {navGroups.map((group) => {
            const visibleItems = group.items.filter((item) =>
              hasPermission(item.permissions)
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.title}>
                {isCollapsed ? (
                  <div className="border-t border-slate-100 my-2" />
                ) : (
                  <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    {group.title}
                  </div>
                )}
                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isReportsGroup = !!item.hasSubItems;
                    const isParentActive =
                      location.pathname === item.path ||
                      (item.path !== '/' && location.pathname.startsWith(item.path));

                    if (isReportsGroup && !isCollapsed) {
                      const visibleSubItems = (item.subItems || []).filter((sub) =>
                        hasPermission(sub.permissions)
                      );

                      return (
                        <div key={item.path} className="space-y-1">
                          <div
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                              isParentActive
                                ? 'bg-indigo-50 text-indigo-700 font-bold'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                          >
                            <Link
                              to={item.path}
                              onClick={() => {
                                if (setIsMobileOpen) setIsMobileOpen(false);
                              }}
                              className="flex items-center gap-3 flex-1 min-w-0"
                            >
                              <Icon
                                className={`w-4 h-4 transition-colors shrink-0 ${
                                  isParentActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-700'
                                }`}
                              />
                              <span className="truncate">{item.label}</span>
                            </Link>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReportsOpen(!reportsOpen);
                              }}
                              className="p-1 -mr-1 rounded-lg hover:bg-slate-200/60 transition-colors text-slate-400 hover:text-slate-600"
                              title={reportsOpen ? 'Collapse sub-menu' : 'Expand sub-menu'}
                            >
                              <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                  reportsOpen ? 'rotate-180' : ''
                                }`}
                              />
                            </button>
                          </div>

                          {/* Submenu of Reports */}
                          {reportsOpen && (
                            <div className="pl-7 pr-1 space-y-0.5 border-l-2 border-indigo-100 ml-5 my-1">
                              {visibleSubItems.map((sub) => {
                                const isSubActive = location.pathname === sub.path;
                                return (
                                  <Link
                                    key={sub.path}
                                    to={sub.path}
                                    onClick={() => {
                                      if (setIsMobileOpen) setIsMobileOpen(false);
                                    }}
                                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors flex items-center justify-between ${
                                      isSubActive
                                        ? 'bg-indigo-600 text-white font-bold shadow-xs'
                                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/80'
                                    }`}
                                  >
                                    <span className="truncate">{sub.label}</span>
                                    {isSubActive && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => {
                          if (setIsMobileOpen) setIsMobileOpen(false);
                        }}
                        title={isCollapsed ? item.label : undefined}
                        className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all group ${isCollapsed
                            ? 'justify-center p-3'
                            : 'justify-between px-3 py-2.5'
                          } ${isParentActive
                            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                      >
                        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                          <Icon
                            className={`w-4 h-4 transition-colors shrink-0 ${isParentActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'
                              }`}
                          />
                          {!isCollapsed && <span className="truncate">{item.label}</span>}
                        </div>

                        {!isCollapsed && (
                          item.badge ? (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isParentActive ? 'bg-white/20 text-white' : item.badgeColor
                                }`}
                            >
                              {item.badge}
                            </span>
                          ) : (
                            <ChevronRight
                              className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ${isParentActive ? 'opacity-100 text-white/70' : 'text-slate-400'
                                }`}
                            />
                          )
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
