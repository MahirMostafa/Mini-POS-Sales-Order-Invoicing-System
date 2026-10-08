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
  Layers,
  X,
  RefreshCw
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
    setAccountId(accounts.find(a => a.code === '2010')?.id || '');
    setIsDefault(false);
    setShowModal(true);
  };

  const openEditModal = (taxRate) => {
    setEditingRate(taxRate);
    setName(taxRate.name);
    setRate(taxRate.rate_percent || taxRate.rate);
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
          title: 'Tax Rate Saved',
          text: res.data.message,
          timer: 1500,
          showConfirmButton: false,
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Percent className="w-4 h-4" />
            <span>Taxation & VAT Policy</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">Dynamic Tax Rate Configurations</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage dynamic tax percentages (default 5% VAT) and linked liability accounts in the Chart of Accounts.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Tax Rate
        </button>
      </div>

      {/* Tax Rates Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
            Loading tax rates...
          </div>
        ) : taxRates.length === 0 ? (
          <div className="col-span-3 py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            No tax rates configured yet.
          </div>
        ) : (
          taxRates.map((tr) => (
            <div
              key={tr.id}
              className={`bg-white rounded-2xl p-5 border transition-all shadow-xs flex flex-col justify-between space-y-4 ${
                tr.is_default
                  ? 'border-indigo-500 ring-2 ring-indigo-500/10'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-black text-slate-900">{tr.name}</span>
                  {tr.is_default && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      <Star className="w-3 h-3 fill-indigo-600 text-indigo-600" /> POS Default
                    </span>
                  )}
                </div>

                <div className="text-3xl font-black text-indigo-600 my-2">
                  {Number(tr.rate_percent || tr.rate).toFixed(1)}%
                </div>

                <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span>Accounting Ledger:</span>
                    <span className="font-mono font-bold text-slate-800">
                      #{tr.account?.code || '2010'} ({tr.account?.name || 'Tax Payable'})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="text-emerald-600 font-bold">Active in POS</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                {!tr.is_default ? (
                  <button
                    onClick={() => handleSetDefault(tr)}
                    className="text-xs font-bold text-indigo-600 hover:underline"
                  >
                    Set as POS Default
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400 font-medium">Applied to new sales</span>
                )}

                <button
                  onClick={() => openEditModal(tr)}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  title="Edit rate"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Tax Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingRate ? 'Edit Tax Rate' : 'New Tax Rate'}
                  </h3>
                  <p className="text-xs text-slate-400">Configure percentage and GL mapping</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tax Name / Label <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard VAT (5%)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tax Percentage (%) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  placeholder="5.00"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Linked Liability Account in GL
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      #{acc.code} - {acc.name} ({acc.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_default_chk"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <label htmlFor="is_default_chk" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Set as system default tax rate on POS terminal
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
                >
                  {saving ? 'Saving...' : 'Save Tax Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
