import React, { useState, useEffect } from 'react';
import api from '../api/client';
import Swal from 'sweetalert2';
import {
  Truck,
  Plus,
  Search,
  RefreshCw,
  PackageCheck,
  Calendar,
  DollarSign,
  FileText,
  Building2,
  Trash2,
  Eye,
  CheckCircle2,
  X,
  PlusCircle,
  Clock
} from 'lucide-react';

export default function PurchaseManagement() {
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [variantsList, setVariantsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // New Purchase Form
  const [formData, setFormData] = useState({
    supplier_name: '',
    supplier_phone: '',
    supplier_invoice_no: '',
    purchase_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    notes: '',
    items: [
      {
        product_variant_id: '',
        quantity: 10,
        unit_cost: 0
      }
    ]
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resPurchases, resProducts] = await Promise.all([
        api.get('/purchases'),
        api.get('/products?per_page=100')
      ]);

      setPurchases(resPurchases.data.purchases?.data || resPurchases.data.purchases || []);

      const prods = resProducts.data.products?.data || resProducts.data.products || [];
      setProducts(prods);

      // Flatten all variants for dropdown
      const allVars = [];
      prods.forEach((p) => {
        if (p.variants && p.variants.length > 0) {
          p.variants.forEach((v) => {
            allVars.push({
              id: v.id,
              productName: p.name,
              variantName: v.variant_name,
              sku: v.sku,
              costPrice: parseFloat(v.cost_price || 0),
              sellingPrice: parseFloat(v.selling_price || 0),
              stock: v.stock_quantity
            });
          });
        }
      });
      setVariantsList(allVars);

      // Initialize default variant if empty
      if (allVars.length > 0 && formData.items[0].product_variant_id === '') {
        setFormData((prev) => ({
          ...prev,
          items: [
            {
              product_variant_id: allVars[0].id,
              quantity: 10,
              unit_cost: allVars[0].costPrice
            }
          ]
        }));
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load purchase records.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddItemLine = () => {
    const defaultVar = variantsList[0];
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          product_variant_id: defaultVar ? defaultVar.id : '',
          quantity: 5,
          unit_cost: defaultVar ? defaultVar.costPrice : 0
        }
      ]
    });
  };

  const handleRemoveItemLine = (index) => {
    if (formData.items.length <= 1) return;
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    if (field === 'product_variant_id') {
      const selected = variantsList.find((v) => v.id === parseInt(value));
      newItems[index].product_variant_id = parseInt(value);
      if (selected) {
        newItems[index].unit_cost = selected.costPrice;
      }
    } else {
      newItems[index][field] = field === 'quantity' ? parseInt(value) || 0 : parseFloat(value) || 0;
    }
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Empty Order', text: 'Please add at least one line item.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/purchases', formData);
      Swal.fire({
        icon: 'success',
        title: 'Purchase Recorded',
        text: res.data.message || 'Stock replenished successfully with Weighted Average Costing updated.',
        timer: 2000,
        showConfirmButton: false
      });
      setIsCreateOpen(false);
      // Reset form
      setFormData({
        supplier_name: '',
        supplier_phone: '',
        supplier_invoice_no: '',
        purchase_date: new Date().toISOString().split('T')[0],
        payment_method: 'bank_transfer',
        notes: '',
        items: [
          {
            product_variant_id: variantsList[0]?.id || '',
            quantity: 10,
            unit_cost: variantsList[0]?.costPrice || 0
          }
        ]
      });
      fetchData();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Could not record purchase.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPurchases = purchases.filter((p) =>
    p.purchase_number?.toLowerCase().includes(search.toLowerCase()) ||
    p.supplier_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.supplier_invoice_no?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Truck className="w-4 h-4" />
            <span>Procurement & Stock Inflow</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">Manage Purchases & Inventory Replenishment</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Record supplier purchase orders, restock product variants, and compute Weighted Average Costing (WAC).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Purchase Order</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search PO #, supplier, invoice..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-xs"
          />
        </div>

        <button
          type="button"
          onClick={fetchData}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 shadow-xs transition-colors self-end sm:self-auto"
          title="Refresh table"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Purchase #</th>
                <th className="py-3.5 px-6">Supplier & Ref</th>
                <th className="py-3.5 px-6">Date</th>
                <th className="py-3.5 px-6">Stock Status</th>
                <th className="py-3.5 px-6">Payment</th>
                <th className="py-3.5 px-6 text-right">Total (Tk)</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading purchase records...
                  </td>
                </tr>
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No purchase orders found. Click "New Purchase Order" to replenish stock.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6 font-bold font-mono text-indigo-600">
                      {p.purchase_number}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{p.supplier_name}</div>
                      <div className="text-[10px] text-slate-400">
                        {p.supplier_invoice_no ? `Inv: ${p.supplier_invoice_no}` : p.supplier_phone || 'No Phone'}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      {p.purchase_date}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Received & Stocked
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="capitalize px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-700 text-[11px]">
                        {p.payment_method?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-black text-slate-900">
                      ৳{parseFloat(p.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedPurchase(p)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-colors inline-flex items-center gap-1 text-[11px] font-bold"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Purchase Order Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Create Supplier Purchase Order</h3>
                  <p className="text-[10px] text-slate-400">Instantly restock items and update weighted cost</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Supplier & Header info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Supplier Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Fragrance Imports"
                    value={formData.supplier_name}
                    onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Supplier Phone</label>
                  <input
                    type="text"
                    placeholder="+880 1700-000000"
                    value={formData.supplier_phone}
                    onChange={(e) => setFormData({ ...formData, supplier_phone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Supplier Invoice Ref #</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-99482"
                    value={formData.supplier_invoice_no}
                    onChange={(e) => setFormData({ ...formData, supplier_invoice_no: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Purchase Date</label>
                  <input
                    type="date"
                    required
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash Counter</option>
                    <option value="card">Corporate Card</option>
                    <option value="credit">Supplier Credit / Accounts Payable</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Remarks</label>
                  <input
                    type="text"
                    placeholder="Batch info / notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Line Items Section */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Purchased Product Variants & Stock Quantity
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItemLine}
                    className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.items.map((item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-2 items-center p-3 rounded-xl bg-slate-50 border border-slate-200"
                    >
                      <div className="col-span-12 sm:col-span-6">
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Product & Variant</label>
                        <select
                          value={item.product_variant_id}
                          onChange={(e) => handleItemChange(index, 'product_variant_id', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white outline-none"
                        >
                          {variantsList.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.productName} - {v.variantName} (SKU: {v.sku} | Stock: {v.stock})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-4 sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Unit Cost (Tk)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unit_cost}
                          onChange={(e) => handleItemChange(index, 'unit_cost', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 outline-none"
                        />
                      </div>

                      <div className="col-span-4 sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 outline-none"
                        />
                      </div>

                      <div className="col-span-3 sm:col-span-1 text-right">
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Total</label>
                        <div className="text-xs font-bold text-slate-900 py-1.5">
                          ৳{(item.quantity * item.unit_cost).toFixed(0)}
                        </div>
                      </div>

                      <div className="col-span-1 sm:col-span-1 text-right pt-4 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => handleRemoveItemLine(index)}
                          disabled={formData.items.length <= 1}
                          className="p-1.5 text-rose-500 hover:text-rose-700 disabled:opacity-30"
                          title="Remove line"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total & Submit */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm font-bold text-slate-700">
                  Total Purchase Value:{' '}
                  <span className="text-xl font-black text-indigo-600">
                    ৳{calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 disabled:opacity-50"
                  >
                    {submitting ? 'Receiving & Restocking...' : 'Confirm & Replenish Stock'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Purchase Details Modal */}
      {selectedPurchase && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Purchase Order #{selectedPurchase.purchase_number}</h3>
                <p className="text-[10px] text-slate-400">Supplier: {selectedPurchase.supplier_name}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPurchase(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400">Date</div>
                  <div className="font-bold text-slate-800">{selectedPurchase.purchase_date}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Status</div>
                  <div className="font-bold text-emerald-600 capitalize">{selectedPurchase.status}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Payment</div>
                  <div className="font-bold text-slate-800 capitalize">{selectedPurchase.payment_method?.replace('_', ' ')}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Recorded By</div>
                  <div className="font-bold text-slate-800">{selectedPurchase.user?.name || 'Admin'}</div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Item & Variant</th>
                      <th className="py-2.5 px-4 text-center">Unit Cost</th>
                      <th className="py-2.5 px-4 text-center">Qty Received</th>
                      <th className="py-2.5 px-4 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedPurchase.items?.map((it) => (
                      <tr key={it.id}>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {it.variant?.product?.name || 'Product'} - {it.variant?.variant_name}
                          <div className="text-[10px] text-slate-400 font-mono">SKU: {it.variant?.sku}</div>
                        </td>
                        <td className="py-3 px-4 text-center font-medium text-slate-600">
                          ৳{parseFloat(it.unit_cost).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-800">
                          {it.quantity}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          ৳{parseFloat(it.line_total).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-200">
                    <tr>
                      <td colSpan="3" className="py-3 px-4 text-right font-bold text-slate-700">
                        Grand Total:
                      </td>
                      <td className="py-3 px-4 text-right font-black text-indigo-600 text-sm">
                        ৳{parseFloat(selectedPurchase.total_amount).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
