import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import Swal from 'sweetalert2';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Layers,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ReportHeader from '../../components/ReportHeader';

export default function ChartOfAccountsPage() {
  const { hasPermission } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const currency = '৳';

  // Account Modal
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [accountForm, setAccountForm] = useState({
    code: '',
    name: '',
    type: 'Asset',
    normal_balance: 'Debit',
    description: '',
    is_active: true
  });
  const [savingAccount, setSavingAccount] = useState(false);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/accounting/accounts');
      if (res.data.success) {
        setAccounts(res.data.accounts || []);
      }
    } catch (err) {
      console.error('Failed to fetch chart of accounts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const openCreateAccountModal = () => {
    setEditingAccount(null);
    setAccountForm({
      code: '',
      name: '',
      type: 'Asset',
      normal_balance: 'Debit',
      description: '',
      is_active: true
    });
    setIsAccountModalOpen(true);
  };

  const openEditAccountModal = (account) => {
    setEditingAccount(account);
    setAccountForm({
      code: account.code,
      name: account.name,
      type: account.type,
      normal_balance: account.normal_balance,
      description: account.description || '',
      is_active: !!account.is_active
    });
    setIsAccountModalOpen(true);
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    setSavingAccount(true);
    try {
      if (editingAccount) {
        await api.put(`/accounting/accounts/${editingAccount.id}`, accountForm);
        Swal.fire({ icon: 'success', title: 'Account Updated', timer: 1500, showConfirmButton: false });
      } else {
        await api.post('/accounting/accounts', accountForm);
        Swal.fire({ icon: 'success', title: 'Account Created', timer: 1500, showConfirmButton: false });
      }
      setIsAccountModalOpen(false);
      fetchAccounts();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: err.response?.data?.message || 'Failed to save chart head.'
      });
    } finally {
      setSavingAccount(false);
    }
  };

  const handleDeleteAccount = async (account) => {
    const result = await Swal.fire({
      title: `Delete Account "${account.name}"?`,
      text: 'Only accounts with zero transactions can be deleted safely.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, Delete'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/accounting/accounts/${account.id}`);
        Swal.fire('Deleted!', 'Account head deleted.', 'success');
        fetchAccounts();
      } catch (err) {
        Swal.fire('Error', err.response?.data?.message || 'Cannot delete account with existing journal entries.', 'error');
      }
    }
  };

  const filteredAccounts = accounts.filter((acc) => {
    const accType = (acc.type || acc.account_type || '').toLowerCase();
    const accName = (acc.name || acc.account_name || '').toLowerCase();
    const accCode = (acc.code || acc.account_code || '').toLowerCase();
    const accDesc = (acc.description || '').toLowerCase();

    const matchesSearch =
      accName.includes(search.toLowerCase()) ||
      accCode.includes(search.toLowerCase()) ||
      accDesc.includes(search.toLowerCase());
    const matchesType = typeFilter === 'ALL' || accType === typeFilter.toLowerCase();
    return matchesSearch && matchesType;
  });

  const accountTypes = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];

  return (
    <div className="space-y-6">
      <ReportHeader
        title="Chart of Accounts (COA)"
        subtitle="Catalog of all active ledger accounts, classification heads, and normal balances."
        icon={BookOpen}
        requiredPermission={['view-chart-of-accounts', 'manage-chart-of-accounts', 'view-accounting-dashboard']}
        showDateFilter={false}
        onRefresh={fetchAccounts}
        loading={loading}
      >
        {hasPermission(['create-chart-of-accounts', 'manage-chart-of-accounts']) && (
          <button
            onClick={openCreateAccountModal}
            className="px-3.5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-700 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Account</span>
          </button>
        )}
      </ReportHeader>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 print:hidden">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search account code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              typeFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Classes ({accounts.length})
          </button>
          {accountTypes.map((type) => {
            const count = accounts.filter((a) => (a.type || a.account_type || '').toLowerCase() === type.toLowerCase()).length;
            const isSelected = typeFilter.toLowerCase() === type.toLowerCase();
            return (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {type} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Accounts List Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Account Name</th>
                <th className="py-3 px-4">Classification / Type</th>
                <th className="py-3 px-4">Normal Balance</th>
                <th className="py-3 px-4">Current Ledger Balance</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    Loading chart of accounts...
                  </td>
                </tr>
              ) : filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No accounts found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((account) => {
                  const typeColors = {
                    Asset: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    Liability: 'bg-rose-50 text-rose-700 border-rose-200',
                    Equity: 'bg-blue-50 text-blue-700 border-blue-200',
                    Revenue: 'bg-purple-50 text-purple-700 border-purple-200',
                    Expense: 'bg-amber-50 text-amber-700 border-amber-200',
                  };

                  return (
                    <tr key={account.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-black text-indigo-600">
                        {account.code}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{account.name}</div>
                        {account.description && (
                          <div className="text-[11px] text-slate-400">{account.description}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            typeColors[account.type] || 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          {account.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-600">
                        {account.normal_balance}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {currency}{Number(account.current_balance || account.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            account.is_active
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {account.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right print:hidden">
                        <div className="flex items-center justify-end gap-1.5">
                          {hasPermission(['edit-chart-of-accounts', 'manage-chart-of-accounts']) && (
                            <button
                              onClick={() => openEditAccountModal(account)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit Account Head"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {hasPermission(['delete-chart-of-accounts', 'manage-chart-of-accounts']) && (
                            <button
                              onClick={() => handleDeleteAccount(account)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Account Head"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Account Modal */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                {editingAccount ? 'Edit Account Head' : 'Create New Chart Account'}
              </h3>
              <button
                onClick={() => setIsAccountModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Account Code</label>
                <input
                  type="text"
                  required
                  value={accountForm.code}
                  onChange={(e) => setAccountForm({ ...accountForm, code: e.target.value })}
                  placeholder="e.g. 1010, 2010, 4010"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Account Name</label>
                <input
                  type="text"
                  required
                  value={accountForm.name}
                  onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                  placeholder="e.g. Petty Cash, Sales Revenue"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Type / Class</label>
                  <select
                    value={accountForm.type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      const normal = ['Asset', 'Expense'].includes(newType) ? 'Debit' : 'Credit';
                      setAccountForm({ ...accountForm, type: newType, normal_balance: normal });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {accountTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Normal Balance</label>
                  <select
                    value={accountForm.normal_balance}
                    onChange={(e) => setAccountForm({ ...accountForm, normal_balance: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  >
                    <option value="Debit">Debit</option>
                    <option value="Credit">Credit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows="2"
                  value={accountForm.description}
                  onChange={(e) => setAccountForm({ ...accountForm, description: e.target.value })}
                  placeholder="Purpose of this account head..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="accountActive"
                  checked={accountForm.is_active}
                  onChange={(e) => setAccountForm({ ...accountForm, is_active: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="accountActive" className="font-bold text-slate-700 cursor-pointer">
                  Active Account
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAccount}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {savingAccount ? 'Saving...' : editingAccount ? 'Update Account' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
