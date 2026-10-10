import React, { useState, useEffect } from 'react';
import api from '../api/client';
import Swal from 'sweetalert2';
import {
  ShieldCheck,
  Key,
  Save,
  CheckCircle2,
  Lock,
  Plus,
  RefreshCw,
  Info,
  ShieldAlert,
  UserCheck,
  Calculator,
  Shield,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RolePermissionManagement() {
  const { refreshUser } = useAuth();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New Role Modal State
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [creatingRole, setCreatingRole] = useState(false);

  const fetchRolesAndPermissions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/roles');
      const fetchedRoles = res.data.roles || [];
      const fetchedPerms = res.data.permissions || [];
      setRoles(fetchedRoles);
      setPermissions(fetchedPerms);

      if (fetchedRoles.length > 0) {
        // Keep current selected or default to first
        const currentId = selectedRole ? selectedRole.id : fetchedRoles[0].id;
        const active = fetchedRoles.find((r) => r.id === currentId) || fetchedRoles[0];
        setSelectedRole(active);
        setSelectedPermissions(active.permissions?.map((p) => p.name) || []);
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load Spatie roles and permissions.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRolesAndPermissions();
  }, []);

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    setSelectedPermissions(role.permissions?.map((p) => p.name) || []);
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    setCreatingRole(true);
    try {
      const res = await api.post('/roles', {
        name: newRoleName.trim(),
        permissions: []
      });
      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Role Created!',
          text: `Role "${newRoleName.trim()}" created successfully. You can now configure its permissions below.`,
          timer: 1500,
          showConfirmButton: false
        });
        setNewRoleName('');
        setIsAddRoleModalOpen(false);
        await fetchRolesAndPermissions();
        // Select the newly created role
        if (res.data.role) {
          setSelectedRole(res.data.role);
          setSelectedPermissions([]);
        }
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Failed to create role.'
      });
    } finally {
      setCreatingRole(false);
    }
  };

  const handleTogglePermission = (permName) => {
    if (selectedPermissions.includes(permName)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== permName));
    } else {
      setSelectedPermissions([...selectedPermissions, permName]);
    }
  };

  const handleSelectAll = () => {
    setSelectedPermissions(permissions.map((p) => p.name));
  };

  const handleDeselectAll = () => {
    setSelectedPermissions([]);
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      await api.put(`/roles/${selectedRole.id}/permissions`, {
        permissions: selectedPermissions
      });
      Swal.fire({
        icon: 'success',
        title: 'Permissions Saved',
        text: `Permissions for ${selectedRole.name} have been updated in database.`,
        timer: 1500,
        showConfirmButton: false
      });
      await fetchRolesAndPermissions();
      if (refreshUser) {
        await refreshUser();
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: err.response?.data?.message || 'Could not update role permissions.'
      });
    } finally {
      setSaving(false);
    }
  };

  const permissionMeta = {
    'view-pos': { title: 'Access POS Terminal', desc: 'Can open the POS counter and search live product catalog' },
    'create-order': { title: 'Create Sales Orders', desc: 'Can create draft/pending sales orders and add cart items' },
    'complete-order': { title: 'Complete Sales Orders', desc: 'Can confirm checkout, trigger stock deduction & post double-entry' },
    'cancel-order': { title: 'Cancel Sales Orders', desc: 'Can cancel pending orders and release reserved stock' },
    'view-invoices': { title: 'View Invoices & Receipts', desc: 'Can access invoices list and view thermal receipt previews' },
    'print-invoices': { title: 'Print & Export Invoices', desc: 'Can print invoices and download billing receipts' },
    'view-customers': { title: 'View Customer Directory', desc: 'Can view customer profiles, contact info & order histories' },
    'create-customers': { title: 'Create New Customers', desc: 'Can register new customer profiles and credit limits' },
    'edit-customers': { title: 'Edit Customer Profiles', desc: 'Can update customer contact details, addresses and tax numbers' },
    'delete-customers': { title: 'Delete Customers', desc: 'Can delete customers that have no prior sales/invoice history' },
    'manage-customers': { title: 'Manage All Customer Data', desc: 'Super permission covering all customer operations' },
    'manage-products': { title: 'Manage Products & Variants', desc: 'Can create, edit, delete products, variants, SKUs and barcodes' },
    'view-categories': { title: 'View Product Categories', desc: 'Can view product category catalog and hierarchy' },
    'create-categories': { title: 'Create Product Categories', desc: 'Can add new product categories' },
    'edit-categories': { title: 'Edit Product Categories', desc: 'Can update category names, slugs, and active status' },
    'delete-categories': { title: 'Delete Product Categories', desc: 'Can remove categories with zero assigned products' },
    'manage-categories': { title: 'Manage All Categories', desc: 'Super permission covering all product category operations' },
    'manage-purchases': { title: 'Manage Supplier Purchases', desc: 'Can create and inspect supplier purchase orders and procurement logs' },
    'receive-purchases': { title: 'Receive & Stock Purchases', desc: 'Can confirm physical arrival of goods, update stock inventory and sign Goods Received Notes (GRN)' },
    'manage-tax-rates': { title: 'Manage VAT & Tax Rates', desc: 'Can create and configure dynamic tax rates and default tax rule' },
    
    // Granular Dashboard: Global Cards
    'view-dashboard': { title: 'Access Executive Dashboard', desc: 'Can access and open the primary Executive Analytics & Insights Landing Page' },
    'view-dashboard-gross-revenue': { title: 'Card: Gross Operating Revenue', desc: 'Can view Global Recognized Gross Operating Revenue (4010)' },
    'view-dashboard-total-orders': { title: 'Card: Completed Orders Volume', desc: 'Can view Global Completed Orders and Pending Count' },
    'view-dashboard-aov': { title: 'Card: Average Order Value (AOV)', desc: 'Can view Global Average Order Value metrics' },
    'view-dashboard-vat-collected': { title: 'Card: Output VAT Collected', desc: 'Can view Global Output VAT & Tax Collected' },
    'view-dashboard-cash-in-hand': { title: 'Card: Cash in Hand (1010)', desc: 'Can view Cash drawer and till closing balance' },
    'view-dashboard-bank-balance': { title: 'Card: Bank Accounts (1020)', desc: 'Can view Total Corporate Bank balances & breakdown' },
    'view-dashboard-liabilities': { title: 'Card: Current Liabilities', desc: 'Can view Tax Payable and Accounts Payable (AP) dues' },
    'view-dashboard-expenses': { title: 'Card: Operating Expenses & COGS', desc: 'Can view COGS (5010) and Operating Expenses (5020)' },
    'view-dashboard-net-profit': { title: 'Card: Net Operating Profit', desc: 'Can view Bottom-line Operating Profit & Margin %' },
    'view-dashboard-revenue-chart': { title: 'Widget: Daily Sales Trend Chart', desc: 'Can view 7-Day and 30-Day Revenue Trend Bar/Area chart' },
    'view-dashboard-tender-chart': { title: 'Widget: Tender & Payment Channels', desc: 'Can view Global Payment Tender breakdown (Cash, Card, Digital)' },
    'view-dashboard-customers': { title: 'Card: Customer Receivables & CRM', desc: 'Can view Total Customers, Active Dues (1050) & Top Customers' },
    'view-dashboard-products': { title: 'Card: Product Stock & Inventory Valuation', desc: 'Can view Products count, Units in stock & Inventory Valuation' },
    'view-dashboard-cashier-leaderboard': { title: 'Card: Cashier Sales Leaderboard', desc: 'Can view Staff & Cashier rankings and sales performance' },
    'view-dashboard-recent-orders': { title: 'Widget: Live Recent Orders Feed', desc: 'Can view Real-time Stream of Latest Orders' },

    // Granular Dashboard: User-Specific / My Shift Cards
    'view-dashboard-my-sales': { title: 'My Shift: My Gross Sales & Revenue', desc: 'Can view sales revenue generated specifically by logged-in cashier/user' },
    'view-dashboard-my-orders': { title: 'My Shift: My Orders (Completed/Pending)', desc: 'Can view order counts processed by logged-in user' },
    'view-dashboard-my-vat': { title: 'My Shift: My VAT Collected', desc: 'Can view Output VAT collected on logged-in user orders' },
    'view-dashboard-my-tender': { title: 'My Shift: My Tender & Payment Channels', desc: 'Can view cash/card/digital tenders collected by logged-in user' },
    'view-dashboard-my-aov': { title: 'My Shift: My Average Order Value', desc: 'Can view average order value for logged-in user orders' },

    // Cash in Hand Permissions
    'view-cash-book': { title: 'View Cash in Hand / Book', desc: 'Can inspect Cash in Hand debit/credit receipts, payments and closing cash balances' },
    'add-cash-money': { title: 'Add Money to Cash (Inflow)', desc: 'Can inject capital, bank cash-withdrawals, or income directly into Cash in Hand' },
    'withdraw-cash-money': { title: 'Withdraw Cash (Outflow)', desc: 'Can record cash payout vouchers, petty expenses, owner drawings, or bank deposits' },
    'manage-cash-book': { title: 'Manage All Cash Book Operations', desc: 'Super permission covering all Cash in Hand drawer and cash book operations' },

    // Bank Accounts Permissions
    'view-banks': { title: 'View Bank Accounts List', desc: 'Can view corporate bank accounts list, balances, and status summaries' },
    'create-banks': { title: 'Create / Register Bank Account', desc: 'Can register new corporate bank accounts, branch details, routing, and opening balances' },
    'edit-banks': { title: 'Edit Bank Account Details', desc: 'Can modify bank account numbers, branch names, routing codes, and active status' },
    'delete-banks': { title: 'Delete / Deactivate Bank Account', desc: 'Can remove or safely deactivate bank accounts' },
    'deposit-banks': { title: 'Deposit / Add Money to Bank', desc: 'Can deposit cash, inter-bank transfers, capital or income into bank accounts' },
    'withdraw-banks': { title: 'Withdraw / Transfer from Bank', desc: 'Can record bank withdrawals, inter-bank transfers, vendor payouts, and expenses' },
    'view-bank-statements': { title: 'View Bank Statements & Ledger', desc: 'Can view detailed chronological debit/credit statements and transaction history for banks' },
    'manage-banks': { title: 'Manage All Bank Operations', desc: 'Super permission covering all banking operations and accounts' },

    // Financial Statements & Books
    'view-bank-book': { title: 'View Bank Book', desc: 'Can inspect individual bank account statements, deposits, withdrawals and bank balances' },
    'view-day-book': { title: 'View Day Book', desc: 'Can inspect daily chronological journal vouchers and day-wise financial movements' },
    'view-trial-balance': { title: 'View Trial Balance', desc: 'Can inspect debit/credit equilibrium verification across all accounts' },
    'view-balance-sheet': { title: 'View Balance Sheet', desc: 'Can inspect Assets, Liabilities, and Equity financial position (Assets = Liabilities + Equity)' },
    'view-profit-loss': { title: 'View Profit & Loss Statement', desc: 'Can inspect Revenue vs COGS vs Operating Expenses and Net Income' },
    'view-ledger': { title: 'View General Ledger', desc: 'Can inspect individual account statement ledgers and running balances' },
    'view-journal-entries': { title: 'View Journal Entries', desc: 'Can view double-entry debit and credit accounting transaction logs' },
    'create-journal-entry': { title: 'Create Manual Vouchers', desc: 'Can post custom manual journal vouchers, contra transfers, and expense entries' },

    // Chart of Accounts (COA)
    'view-chart-of-accounts': { title: 'View Chart of Accounts', desc: 'Can inspect Chart of Accounts catalog and accounting head structures' },
    'create-chart-of-accounts': { title: 'Create Accounting Head', desc: 'Can create new accounting heads (Asset, Liability, Equity, Revenue, Expense)' },
    'edit-chart-of-accounts': { title: 'Edit Accounting Head', desc: 'Can update accounting head codes, names, and normal balance conventions' },
    'delete-chart-of-accounts': { title: 'Delete Accounting Head', desc: 'Can remove or deactivate unused accounting heads' },
    'manage-chart-of-accounts': { title: 'Manage All Chart of Accounts (COA)', desc: 'Super permission covering all Chart of Accounts operations' },

    // System Administration
    'manage-users': { title: 'Manage System Users', desc: 'Can create staff accounts, assign passwords and assign roles' },
    'manage-roles': { title: 'Manage Roles & Permissions', desc: 'Can configure Spatie permission matrices for roles' },
    'view-audit-logs': { title: 'View Audit Activity Logs', desc: 'Can inspect background queue audit logs and critical changes' },
    'manage-settings': { title: 'Manage Store Settings', desc: 'Can adjust store currency, receipt layout and business details' },
  };

  // Group permissions logically
  const getPermissionGroup = (name) => {
    if (name.startsWith('view-dashboard-my-')) {
      return 'Executive Dashboard: My Shift / Personal Telemetry';
    }
    if (name === 'view-dashboard' || name.startsWith('view-dashboard-')) {
      return 'Executive Dashboard: Global Business Cards';
    }
    if (name.includes('cash-book') || name.includes('cash-money')) {
      return 'Cash in Hand & Drawer Flow';
    }
    if (name.includes('bank') || name.includes('banks')) {
      if (name === 'view-bank-book') return 'Financial Statements & Books';
      return 'Bank Accounts & Banking';
    }
    if (name.includes('chart-of-accounts')) {
      return 'Chart of Accounts (COA)';
    }
    if (name.includes('day-book') || name.includes('trial-balance') || name.includes('balance-sheet') || name.includes('profit-loss') || name.includes('ledger') || name.includes('journal')) {
      return 'Financial Statements & Books';
    }
    if (name.includes('tax')) {
      return 'Accounting Configuration & Taxes';
    }
    if (name.includes('customer')) {
      return 'Customer Management & CRM';
    }
    if (name.includes('pos') || name.includes('order') || name.includes('invoice')) {
      return 'POS, Sales & Billing';
    }
    if (name.includes('product') || name.includes('category') || name.includes('purchase')) {
      return 'Inventory, Categories & Purchasing';
    }
    return 'Administration & Security';
  };

  const groupedPermissions = permissions.reduce((acc, perm) => {
    const group = getPermissionGroup(perm.name);
    if (!acc[group]) acc[group] = [];
    acc[group].push(perm);
    return acc;
  }, {});

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Spatie Laravel Permission Matrix</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">Role & Permission Access Control</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure atomic permissions for Customer Editing, Customer Deletion, POS Terminal, Inventory, and Accounting.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setIsAddRoleModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Role</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !selectedRole}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Permissions Matrix'}</span>
          </button>
        </div>
      </div>

      {/* Role Selection Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {roles.map((r) => {
          const isSelected = selectedRole?.id === r.id;
          const roleIcon =
            r.name === 'Admin' ? ShieldAlert :
            r.name === 'Accountant' ? Calculator : UserCheck;

          const Icon = roleIcon;

          return (
            <button
              key={r.id}
              type="button"
              onClick={() => handleSelectRole(r)}
              className={`p-5 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                isSelected
                  ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                    r.name === 'Admin'
                      ? 'bg-amber-100 text-amber-800'
                      : r.name === 'Accountant'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-indigo-100 text-indigo-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                  {r.permissions?.length || 0} permissions
                </span>
              </div>

              <div className="font-black text-slate-900 text-sm mb-0.5">{r.name}</div>
              <p className="text-[11px] text-slate-500 line-clamp-2">
                {r.name === 'Admin' && 'Unrestricted access to all terminal, inventory, user, customer, and accounting modules.'}
                {r.name === 'Cashier' && 'Access to POS checkout terminal, sales orders, customer creation & editing (delete restricted).'}
                {r.name === 'Accountant' && 'Access to Double-Entry General Ledger, Journal, Tax configuration, and Financials.'}
              </p>
            </button>
          );
        })}
      </div>

      {/* Permission Matrix Grid */}
      {selectedRole && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-600" />
                Configuring Permissions for: <span className="text-indigo-600 font-black">{selectedRole.name}</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Check or uncheck specific atomic permissions for this role.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Deselect All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(groupedPermissions).map(([groupName, perms]) => (
              <div key={groupName} className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  {groupName}
                </div>

                <div className="space-y-2">
                  {perms.map((p) => {
                    const isChecked = selectedPermissions.includes(p.name);
                    const meta = permissionMeta[p.name] || { title: p.name, desc: p.name };
                    return (
                      <label
                        key={p.id}
                        className={`flex items-start justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-white border-indigo-400 text-slate-900 shadow-xs'
                            : 'bg-white/60 border-slate-200 text-slate-500 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleTogglePermission(p.name)}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 mt-0.5 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{meta.title}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{meta.desc}</div>
                            <div className="text-[10px] font-mono text-indigo-600 mt-0.5">{p.name}</div>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                            isChecked
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {isChecked ? 'Allowed' : 'Denied'}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-indigo-500" />
              Changes are immediately enforced across all Spatie middleware endpoints & UI sidebars.
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Add Custom Role Modal */}
      {isAddRoleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Create New Spatie Role</h3>
                  <p className="text-[10px] text-slate-400">Define a new custom organizational role</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddRoleModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Role Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Branch Manager, Inventory Auditor, Sales Lead"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-semibold"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Once created, you can toggle its granular atomic permissions in the matrix and assign staff to it.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddRoleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingRole}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  {creatingRole ? 'Creating...' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
