import React, { useState, useEffect } from 'react';
import api from '../api/client';
import Swal from 'sweetalert2';
import { 
  Percent, 
  Plus, 
  Check, 
  Edit3, 
  CheckCircle2, 
  ShieldCheck, 
  Star,
  Layers
} from 'lucide-react';

export default function TaxManagement() {
  const [taxRates, setTaxRates] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editingRate, setEditingRate] = useState(null);
  const [name, setName] = useState('');
  const [rate, setRate] = useState('');
  const [accountId, setAccountId] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchTaxRates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tax-rates');
      if (res.data.success) {
        setTaxRates(res.data.tax_rates || []);
        setAccounts(res.data.accounts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxRates();
  }, []);

  const openCreateModal = () => {
    setEditingRate(null);
    setName('');
    setRate('5.00');
    setAccountId(accounts.find(a => a.account_code === '2010')?.id || '');
    setIsDefault(false);
    setShowModal(true);
  };

  const openEditModal = (taxRate) => {
    setEditingRate(taxRate);
    setName(taxRate.name);
    setRate(taxRate.rate);
    setAccountId(taxRate.account_id || '');
    setIsDefault(taxRate.is_default);
    setShowModal(true);
  };

  const handleSetDefault = async (taxRate) => {
    try {
      const res = await api.post(`/tax-rates/${taxRate.id}/set-default`);
      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Default Updated',
          text: res.data.message,
          timer: 1500,
          showConfirmButton: false,
          background: '#0f172a',
          color: '#f8fafc',
        });
        fetchTaxRates();
      }
    } catch (err) {
      // Handled
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name,
        rate: Number(rate),
        account_id: accountId ? Number(accountId) : null,
        is_default: isDefault,
        is_active: true,
      };

      let res;
      if (editingRate) {
        res = await api.put(`/tax-rates/${editingRate.id}`, payload);
      } else {
        res = await api.post('/tax-rates', payload);
      }

      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: editingRate ? 'Tax Rate Updated' : 'Tax Rate Created',
          text: res.data.message,
          timer: 1500,
          showConfirmButton: false,
          background: '#0f172a',
          color: '#f8fafc',
        });
        setShowModal(false);
        fetchTaxRates();
      }
    } catch (err) {
      // Handled
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <Percent className="w-6 h-6 text-indigo-400" />
            Dynamic Tax Configuration (CRUD)
          </h1>
          <p className="text-xs text-slate-400">
            Configure sales tax / VAT percentage rates (e.g. 5%, 0%, 10%) and link to liability ledger accounts.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all"
        >
          <Plus className="w-4 h-4" /> Add New Tax Rate
        </button>
      </div>

      {/* Tax Rates Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4">Tax Name</th>
                <th className="py-3 px-4 text-center">Tax Rate (%)</th>
                <th className="py-3 px-4">Ledger Liability Account</th>
                <th className="py-3 px-4 text-center">Default for POS</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-500">Loading tax rates...</td></tr>
              ) : (
                taxRates.map((tr) => (
                  <tr key={tr.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-bold text-slate-100">
                      {tr.name}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-black text-indigo-400 text-sm">
                      {Number(tr.rate).toFixed(2)}%
                    </td>
                    <td className="py-3 px-4">
                      {tr.account ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs text-indigo-400 font-semibold">[{tr.account.account_code}]</span>
                          <span className="text-slate-300">{tr.account.account_name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500">Account 2010 (Tax Payable)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {tr.is_default ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          <Star className="w-3 h-3 fill-indigo-400 text-indigo-400" /> Default POS Rate
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSetDefault(tr)}
                          className="text-[11px] font-semibold text-slate-400 hover:text-indigo-300 underline"
                        >
                          Make Default
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                        ACTIVE
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => openEditModal(tr)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 relative">
            <h3 className="text-base font-bold text-slate-100 mb-1">
              {editingRate ? 'Edit Tax Rate' : 'Add New Tax Rate'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Configure percentage and accounting ledger mapping.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tax Rate Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard VAT (5.00%)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tax Percentage (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  placeholder="e.g. 5.00"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Chart of Accounts Mapping</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none"
                >
                  <option value="">Default (2010 - Tax Payable)</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.account_code} - {a.account_name} ({a.account_type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isDefaultCheck"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700"
                />
                <label htmlFor="isDefaultCheck" className="text-xs text-slate-300 cursor-pointer">
                  Set as default active tax rate for POS checkout
                </label>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 bg-slate-800 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
                >
                  {saving ? 'Saving...' : 'Save Tax Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
