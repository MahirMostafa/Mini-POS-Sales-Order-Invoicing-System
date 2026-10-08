import React, { useState, useEffect } from 'react';
import api from '../api/client';
import Swal from 'sweetalert2';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Layers,
  Barcode,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  Trash2,
  X,
  Boxes,
  ArrowUpRight
} from 'lucide-react';

export default function ProductCatalog() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Stock Replenishment Modal
  const [selectedVariantForStock, setSelectedVariantForStock] = useState(null);
  const [stockQty, setStockQty] = useState('');
  const [purchaseCost, setPurchaseCost] = useState('');
  const [stockNote, setStockNote] = useState('');
  const [replenishing, setReplenishing] = useState(false);

  // Add Product Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    category_id: '',
    brand: '',
    description: '',
    variants: [
      {
        variant_name: 'Standard',
        sku: '',
        barcode: '',
        cost_price: 0,
        selling_price: 0,
        stock_quantity: 10,
        alert_quantity: 5
      }
    ]
  });

  const currency = '৳';

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = `/products?search=${encodeURIComponent(searchQuery)}`;
      if (selectedCategory) {
        url += `&category_id=${selectedCategory}`;
      }
      const res = await api.get(url);
      if (res.data.success) {
        setProducts(res.data.products?.data || res.data.products || []);
        setCategories(res.data.categories || []);
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load products.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const handleAddVariantRow = () => {
    setProductForm({
      ...productForm,
      variants: [
        ...productForm.variants,
        {
          variant_name: '',
          sku: '',
          barcode: '',
          cost_price: 0,
          selling_price: 0,
          stock_quantity: 10,
          alert_quantity: 5
        }
      ]
    });
  };

  const handleRemoveVariantRow = (index) => {
    if (productForm.variants.length <= 1) return;
    const newVariants = productForm.variants.filter((_, i) => i !== index);
    setProductForm({ ...productForm, variants: newVariants });
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...productForm.variants];
    newVariants[index][field] = value;
    setProductForm({ ...productForm, variants: newVariants });
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setCreatingProduct(true);
    try {
      const res = await api.post('/products', productForm);
      Swal.fire({
        icon: 'success',
        title: 'Product Created',
        text: `"${productForm.name}" with ${productForm.variants.length} variant(s) created.`,
        timer: 1500,
        showConfirmButton: false
      });
      setIsAddModalOpen(false);
      setProductForm({
        name: '',
        category_id: '',
        brand: '',
        description: '',
        variants: [
          {
            variant_name: 'Standard',
            sku: '',
            barcode: '',
            cost_price: 0,
            selling_price: 0,
            stock_quantity: 10,
            alert_quantity: 5
          }
        ]
      });
      fetchProducts();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Creation Failed',
        text: err.response?.data?.message || 'Could not save product.'
      });
    } finally {
      setCreatingProduct(false);
    }
  };

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
          timer: 1500,
          showConfirmButton: false
        });

        setSelectedVariantForStock(null);
        setStockQty('');
        setPurchaseCost('');
        setStockNote('');
        fetchProducts();
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Failed to replenish stock.'
      });
    } finally {
      setReplenishing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Package className="w-4 h-4" />
            <span>Product Catalog & Variant Stock</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">Manage Products & Variants</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure multi-variant products (e.g. Perfume ABC 80ml @ ৳100 vs 120ml @ ৳150), SKU pricing, and Weighted Average Costing (WAC).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product & Variants</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              selectedCategory === null
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedCategory === c.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products, SKU, barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-xs"
          />
        </div>
      </div>

      {/* Product List Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
            Loading product inventory...
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 shadow-xs">
            No products found matching the criteria. Click "Add New Product" to create one.
          </div>
        ) : (
          products.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-black text-base text-slate-900">{product.name}</h3>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {product.category?.name || 'General'}
                    </span>
                    {product.brand && (
                      <span className="text-xs text-indigo-600 font-bold">({product.brand})</span>
                    )}
                  </div>
                  {product.description && (
                    <p className="text-xs text-slate-500 mt-1">{product.description}</p>
                  )}
                </div>

                <div className="text-xs font-semibold text-slate-400">
                  {product.variants?.length || 0} Variant(s) Available
                </div>
              </div>

              {/* Variants Table for this Product */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Variant Name</th>
                      <th className="py-3 px-4">SKU Code</th>
                      <th className="py-3 px-4">Barcode</th>
                      <th className="py-3 px-4 text-right">Unit Cost (WAC)</th>
                      <th className="py-3 px-4 text-right">Selling Price</th>
                      <th className="py-3 px-4 text-center">Available Stock</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {product.variants?.map((v) => {
                      const isLowStock = v.stock_quantity <= (v.alert_quantity || 5);
                      return (
                        <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {v.variant_name}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-indigo-600">{v.sku}</td>
                          <td className="py-3 px-4 font-mono text-slate-400">{v.barcode || '-'}</td>
                          <td className="py-3 px-4 text-right text-slate-600 font-medium">
                            {currency}{Number(v.cost_price).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-slate-900">
                            {currency}{Number(v.selling_price).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-full text-[10px] ${
                                v.stock_quantity <= 0
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : isLowStock
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {isLowStock && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                              {v.stock_quantity} units
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedVariantForStock(v);
                                setPurchaseCost(v.cost_price);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Stock</span>
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

      {/* Add New Product & Variants Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Add New Product & Variants</h3>
                  <p className="text-[10px] text-slate-400">Specify multi-variant pricing, SKU, and initial stock</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateProduct} className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Perfume ABC"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={productForm.category_id}
                    onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Brand Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Chanel / Dior"
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Product Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Premium EDP spray for men & women"
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Dynamic Variants Section */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Product Variants & Pricing
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Add variants like "80ml" (৳100), "120ml" (৳150), etc.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddVariantRow}
                    className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Add Variant</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {productForm.variants.map((v, index) => (
                    <div
                      key={index}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-12 gap-2.5 items-center"
                    >
                      <div className="col-span-6 sm:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Variant Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 80ml"
                          value={v.variant_name}
                          onChange={(e) => handleVariantChange(index, 'variant_name', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 outline-none"
                        />
                      </div>

                      <div className="col-span-6 sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">SKU Code *</label>
                        <input
                          type="text"
                          required
                          placeholder="PERF-80"
                          value={v.sku}
                          onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 font-mono outline-none"
                        />
                      </div>

                      <div className="col-span-4 sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Cost Price (৳)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={v.cost_price}
                          onChange={(e) => handleVariantChange(index, 'cost_price', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 outline-none"
                        />
                      </div>

                      <div className="col-span-4 sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Selling Price (৳)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={v.selling_price}
                          onChange={(e) => handleVariantChange(index, 'selling_price', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-emerald-600 outline-none"
                        />
                      </div>

                      <div className="col-span-3 sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Stock Qty</label>
                        <input
                          type="number"
                          min="0"
                          value={v.stock_quantity}
                          onChange={(e) => handleVariantChange(index, 'stock_quantity', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 outline-none"
                        />
                      </div>

                      <div className="col-span-1 sm:col-span-1 text-right pt-4 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => handleRemoveVariantRow(index)}
                          disabled={productForm.variants.length <= 1}
                          className="p-1.5 text-rose-500 hover:text-rose-700 disabled:opacity-30"
                          title="Remove variant"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingProduct}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  {creatingProduct ? 'Saving Product...' : 'Create Product with Variants'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Stock Replenishment Modal */}
      {selectedVariantForStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Add Stock to {selectedVariantForStock.variant_name}
                </h3>
                <p className="text-xs text-slate-400">
                  Current stock: {selectedVariantForStock.stock_quantity} • SKU: {selectedVariantForStock.sku}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVariantForStock(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStockSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Quantity to Add</label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 50"
                  value={stockQty}
                  onChange={(e) => setStockQty(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
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
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-bold"
                />
                <p className="text-[10px] text-indigo-600 mt-1 font-medium">
                  The system will automatically recalculate the Weighted Average Cost (WAC).
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Stock Replenishment Note</label>
                <input
                  type="text"
                  placeholder="e.g. Direct supplier import"
                  value={stockNote}
                  onChange={(e) => setStockNote(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedVariantForStock(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={replenishing}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
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
