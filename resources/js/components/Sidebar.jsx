import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Store,
  ShoppingCart,
  Receipt,
  FileText,
  Package,
  Truck,
  Calculator,
  Percent,
  Users,
  ShieldCheck,
  Activity,
  LogOut,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({ isMobileOpen, setIsMobileOpen }) {
  const { user, role, logout, canAccessRoute } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const userRole = role || user?.roles?.[0]?.name || 'Admin';

  const navGroups = [
    {
      title: 'POS & Sales',
      items: [
        {
          path: '/pos',
          label: 'POS Counter',
          icon: ShoppingCart,
          roles: ['Admin', 'Cashier'],
          permissions: ['view-pos'],
          badge: 'Live',
          badgeColor: 'bg-emerald-100 text-emerald-700'
        },
        {
          path: '/orders',
          label: 'Sales Orders',
          icon: Receipt,
          roles: ['Admin', 'Cashier', 'Accountant'],
          permissions: ['create-order', 'complete-order', 'view-pos']
        },
        {
          path: '/invoices',
          label: 'Invoices & Receipts',
          icon: FileText,
          roles: ['Admin', 'Cashier', 'Accountant'],
          permissions: ['view-invoices', 'print-invoices']
        },
        {
          path: '/customers',
          label: 'Manage Customers',
          icon: Users,
          roles: ['Admin', 'Cashier', 'Accountant'],
          permissions: ['view-customers', 'manage-customers']
        }
      ]
    },
    {
      title: 'Inventory & Procurement',
      items: [
        {
          path: '/products',
          label: 'Manage Products',
          icon: Package,
          roles: ['Admin'],
          permissions: ['manage-products']
        },
        {
          path: '/purchases',
          label: 'Manage Purchases',
          icon: Truck,
          roles: ['Admin', 'Accountant'],
          permissions: ['manage-purchases']
        }
      ]
    },
    {
      title: 'Finance & Accounting',
      items: [
        {
          path: '/accounting',
          label: 'Accounting Dashboard',
          icon: Calculator,
          roles: ['Admin', 'Accountant'],
          permissions: ['view-accounting-dashboard', 'view-ledger', 'view-journal-entries']
        },
        {
          path: '/taxes',
          label: 'Tax Rates (VAT)',
          icon: Percent,
          roles: ['Admin', 'Accountant'],
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
          roles: ['Admin'],
          permissions: ['manage-users']
        },
        {
          path: '/roles',
          label: 'Role & Permissions',
          icon: ShieldCheck,
          roles: ['Admin'],
          permissions: ['manage-roles']
        },
        {
          path: '/audit',
          label: 'Audit Activity Logs',
          icon: Activity,
          roles: ['Admin'],
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
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                MINI POS & ERP
              </div>
              <div className="text-[11px] font-medium text-slate-400">
                Sales & Accounting Hub
              </div>
            </div>
          </div>
        </div>

        {/* Current User Role Pill */}
        <div className="px-5 pt-4 pb-2">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 truncate">{user?.name || 'User'}</div>
                <div className="text-[10px] text-slate-400 truncate">{user?.email || 'user@example.com'}</div>
              </div>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                userRole === 'Admin'
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : userRole === 'Accountant'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
              }`}
            >
              {userRole}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-2 space-y-5 overflow-y-auto">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter((item) =>
              canAccessRoute(item.roles, item.permissions)
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.title}>
                <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  {group.title}
                </div>
                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      location.pathname === item.path ||
                      (item.path !== '/' && location.pathname.startsWith(item.path));

                    return (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => handleNavClick(item.path)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`w-4 h-4 transition-colors ${
                              isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'
                            }`}
                          />
                          <span>{item.label}</span>
                        </div>

                        {item.badge ? (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                              isActive ? 'bg-white/20 text-white' : item.badgeColor
                            }`}
                          >
                            {item.badge}
                          </span>
                        ) : (
                          <ChevronRight
                            className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                              isActive ? 'opacity-100 text-white/70' : 'text-slate-400'
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Bottom Logout Button */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>
    </>
  );
}
