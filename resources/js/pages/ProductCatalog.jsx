import React, { useState, useEffect } from 'react';
import api from '../api/client';
import Swal from 'sweetalert2';
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  Layers, 
  DollarSign, 
  Barcode, 
  ArrowUpRight,
  Boxes
} from 'lucide-react';

export default function ProductCatalog() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVariantForStock, setSelectedVariantForStock] = useState(null);
  const [stockQty, setStockQty] = useState('');
  const [purchaseCost, setPurchaseCost] = useState('');
  const [stockNote, setStockNote] = useState('');
  const [replenishing, setReplenishing] = useState(false);
  const currency = '৳';

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/products?search=${encodeURIComponent(searchQuery)}`);
      if (res.data.success) {
        setProducts(res.data.products.data || []);
        setCategories(res.data.categories || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddStockSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVariantForStock) return;

    setReplenishing(true);
    try {
      const res = await api.post(`/products/variants/${selectedVariantForStock.id}/stock`, {
        quantity: Number(stockQty),
        purchase_cost: Number(purchaseCost),
        note: stockNote,
      });

      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Stock Replenished!',
          text: res.data.message,
          background: '#0f172a',
          color: '#f8fafc',
          confirmButtonColor: '#6366f1',
        });

        setSelectedVariantForStock(null);
        setStockQty('');
        setPurchaseCost('');
        setStockNote('');
        fetchProducts();
      }
    } catch (err) {
      // Handled by Axios
    } finally {
      setReplenishing(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-400" />
            Products & Multi-Variant Inventory
          </h1>
          <p className="text-xs text-slate-400">
            Catalog management, variant pricing (e.g. 80ml vs 120ml), live stock tracking, and Weighted Average Costing.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Product List Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-slate-500">Loading product inventory...</div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center text-slate-500">No products found.</div>
        ) : (
          products.map((product) => (
            <div key={product.id} className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-100">{product.name}</h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {product.category?.name || 'General'}
                    </span>
                    {product.brand && (
                      <span className="text-xs text-indigo-400 font-medium">({product.brand})</span>
                    )}
                  </div>
                  {product.description && (
                    <p className="text-xs text-slate-400 mt-1">{product.description}</p>
                  )}
                </div>
              </div>

              {/* Variants Table for this Product */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Variant / Specification</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Barcode</th>
                      <th className="py-2.5 px-3 text-right">Cost Price (WAC)</th>
                      <th className="py-2.5 px-3 text-right">Selling Price</th>
                      <th className="py-2.5 px-3 text-center">Stock Level</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {product.variants?.map((v) => {
                      const isLowStock = v.stock_quantity <= (v.alert_quantity || 5);
                      return (
                        <tr key={v.id} className="hover:bg-slate-800/30">
                          <td className="py-2.5 px-3 font-semibold text-slate-100">
                            {v.variant_name}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-indigo-400">{v.sku}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-400">{v.barcode || '-'}</td>
                          <td className="py-2.5 px-3 text-right text-slate-400">
                            {currency}{Number(v.cost_price).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                            {currency}{Number(v.selling_price).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-[10px] ${
                                v.stock_quantity <= 0
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : isLowStock
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}
                            >
                              {isLowStock && <AlertTriangle className="w-2.5 h-2.5" />}
                              {v.stock_quantity} units
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => {
                                setSelectedVariantForStock(v);
                                setPurchaseCost(v.cost_price);
                              }}
                              className="flex items-center gap-1 mx-auto px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 transition-colors"
                            >
                              <Plus className="w-3 h-3" /> Add Stock
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Stock Replenishment Modal */}
      {selectedVariantForStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 relative">
            <h3 className="text-base font-bold text-slate-100 mb-1">
              Add Stock to {selectedVariantForStock.variant_name}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Current stock: {selectedVariantForStock.stock_quantity} • SKU: {selectedVariantForStock.sku}
            </p>

            <form onSubmit={handleAddStockSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Quantity to Add</label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 50"
                  value={stockQty}
                  onChange={(e) => setStockQty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Purchase Unit Cost ({currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="e.g. 55.00"
                  value={purchaseCost}
                  onChange={(e) => setPurchaseCost(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-bold"
                />
                <p className="text-[10px] text-indigo-400 mt-1">
                  The system will automatically recalculate the Weighted Average Cost (WAC).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Stock Replenishment Note</label>
                <input
                  type="text"
                  placeholder="e.g. Supplier Batch #FEB-2026"
                  value={stockNote}
                  onChange={(e) => setStockNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedVariantForStock(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 bg-slate-800 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={replenishing}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
                >
                  {replenishing ? 'Saving...' : 'Confirm Stock Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
