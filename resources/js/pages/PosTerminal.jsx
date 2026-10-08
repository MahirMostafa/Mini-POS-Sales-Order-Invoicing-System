import React, { useState, useEffect, useMemo, useRef } from 'react';
import api from '../api/client';
import Swal from 'sweetalert2';
import { 
  Search, 
  Barcode, 
  UserPlus, 
  Trash2, 
  Plus, 
  Minus, 
  Percent, 
  ShoppingCart, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Sparkles, 
  Package, 
  Layers,
  ArrowRight,
  RotateCcw,
  Check,
  ChevronDown
} from 'lucide-react';
import VariantModal from '../components/VariantModal';
import QuickCustomerModal from '../components/QuickCustomerModal';

export default function PosTerminal({ onNavigateToInvoice, onNavigateToOrder }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [taxRates, setTaxRates] = useState([]);
  const [selectedTaxRate, setSelectedTaxRate] = useState(null);
  const [currency, setCurrency] = useState('৳');
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [barcodeInput, setBarcodeInput] = useState('');

  // Cart / Order State
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [discountType, setDiscountType] = useState('percent'); // 'percent' | 'fixed'
  const [discountValue, setDiscountValue] = useState(0);
  const [orderNotes, setOrderNotes] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);

  // Modals
  const [variantModalProduct, setVariantModalProduct] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const barcodeInputRef = useRef(null);

  // Load POS Data
  const loadPosData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/pos/init');
      if (res.data.success) {
        setProducts(res.data.products || []);
        setCategories(res.data.categories || []);
        setCustomers(res.data.customers || []);
        setTaxRates(res.data.tax_rates || []);
        setCurrency(res.data.currency || '৳');

        // Set Default Tax Rate (Standard 5% VAT)
        if (res.data.default_tax_rate) {
          setSelectedTaxRate(res.data.default_tax_rate);
        } else if (res.data.tax_rates?.length > 0) {
          setSelectedTaxRate(res.data.tax_rates[0]);
        }

        // Set Default Customer (Walk-in Customer)
        const walkIn = res.data.customers?.find(c => c.customer_code === 'CUST-0001') || res.data.customers?.[0];
        if (walkIn) {
          setSelectedCustomer(walkIn);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosData();
  }, []);

  // Filtered Products Catalog
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = selectedCategory === 'all' || String(product.category_id) === String(selectedCategory);
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        !searchQuery ||
        product.name.toLowerCase().includes(q) ||
        product.brand?.toLowerCase().includes(q) ||
        product.variants?.some(v => v.sku.toLowerCase().includes(q) || v.variant_name.toLowerCase().includes(q) || v.barcode?.includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Handle Product Click
  const handleProductClick = (product) => {
    if (product.has_variants && product.variants?.length > 1) {
      setVariantModalProduct(product);
    } else if (product.variants?.length > 0) {
      addVariantToCart(product.variants[0], product);
    }
  };

  // Add Variant to Cart
  const addVariantToCart = (variant, product) => {
    if (variant.stock_quantity <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Out of Stock',
        text: `'${variant.variant_name}' of ${product.name} is currently out of stock.`,
        background: '#0f172a',
        color: '#f8fafc',
      });
      return;
    }

    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.product_variant_id === variant.id);
      if (existingIndex > -1) {
        const existingItem = prev[existingIndex];
        const newQty = existingItem.quantity + 1;

        if (newQty > variant.stock_quantity) {
          Swal.fire({
            icon: 'warning',
            title: 'Stock Limit Reached',
            text: `Only ${variant.stock_quantity} units available in stock.`,
            background: '#0f172a',
            color: '#f8fafc',
          });
          return prev;
        }

        const updated = [...prev];
        updated[existingIndex] = {
          ...existingItem,
          quantity: newQty,
          line_total: (newQty * existingItem.unit_price) - existingItem.discount,
        };
        return updated;
      }

      // New Line Item
      const unitPrice = Number(variant.selling_price);
      return [
        ...prev,
        {
          product_id: product.id,
          product_variant_id: variant.id,
          product_name: product.name,
          variant_name: variant.variant_name,
          sku: variant.sku,
          unit_price: unitPrice,
          unit_cost: Number(variant.cost_price),
          quantity: 1,
          discount: 0,
          max_stock: variant.stock_quantity,
          line_total: unitPrice,
        },
      ];
    });
  };

  // Barcode Scanner Handler
  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    try {
      const res = await api.get(`/pos/search?barcode=${encodeURIComponent(barcodeInput.trim())}`);
      if (res.data.success && res.data.variant) {
        addVariantToCart(res.data.variant, res.data.variant.product);
        setBarcodeInput('');
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Barcode Not Found',
        text: `No product variant found for barcode '${barcodeInput}'.`,
        background: '#0f172a',
        color: '#f8fafc',
      });
    }
  };

  // Update Cart Item Quantity
  const updateQuantity = (variantId, delta) => {
    setCartItems((prev) => {
      return prev.map((item) => {
        if (item.product_variant_id === variantId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.max_stock) {
            Swal.fire({
              icon: 'warning',
              title: 'Stock Limit',
              text: `Max available stock for this item is ${item.max_stock} units.`,
              background: '#0f172a',
              color: '#f8fafc',
            });
            return item;
          }
          return {
            ...item,
            quantity: newQty,
            line_total: (newQty * item.unit_price) - item.discount,
          };
        }
        return item;
      }).filter(Boolean);
    });
  };

  // Update Line Item Discount
  const updateItemDiscount = (variantId, discount) => {
    const val = Math.max(0, Number(discount) || 0);
    setCartItems((prev) => {
      return prev.map((item) => {
        if (item.product_variant_id === variantId) {
          const lineGross = item.quantity * item.unit_price;
          const cappedDiscount = Math.min(lineGross, val);
          return {
            ...item,
            discount: cappedDiscount,
            line_total: lineGross - cappedDiscount,
          };
        }
        return item;
      });
    });
  };

  // Remove Item
  const removeItem = (variantId) => {
    setCartItems((prev) => prev.filter((item) => item.product_variant_id !== variantId));
  };

  // Clear Cart
  const clearCart = () => {
    if (cartItems.length === 0) return;
    Swal.fire({
      title: 'Clear order items?',
      text: 'This will reset all line items in the sales cart.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Clear',
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#334155',
      background: '#0f172a',
      color: '#f8fafc',
    }).then((result) => {
      if (result.isConfirmed) {
        setCartItems([]);
        setDiscountValue(0);
        setOrderNotes('');
      }
    });
  };

  // Calculations
  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + (item.line_total || 0), 0);
  }, [cartItems]);

  const discountAmount = useMemo(() => {
    if (discountType === 'percent') {
      const pct = Math.min(100, Math.max(0, Number(discountValue) || 0));
      return (subtotal * pct) / 100;
    }
    return Math.min(subtotal, Math.max(0, Number(discountValue) || 0));
  }, [subtotal, discountType, discountValue]);

  const taxableAmount = Math.max(0, subtotal - discountAmount);

  const taxRatePercent = Number(selectedTaxRate?.rate ?? 5.00);
  const taxAmount = (taxableAmount * taxRatePercent) / 100;
  const grandTotal = taxableAmount + taxAmount;

  // Checkout / Save Order Handler
  const handleCheckout = async (autoComplete = false) => {
    if (!selectedCustomer) {
      Swal.fire({
        icon: 'warning',
        title: 'Customer Required',
        text: 'Please select or add a customer before proceeding.',
        background: '#0f172a',
        color: '#f8fafc',
      });
      return;
    }

    if (cartItems.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Cart is Empty',
        text: 'Please add at least one product item to the order.',
        background: '#0f172a',
        color: '#f8fafc',
      });
      return;
    }

    // Verify Stock Before Submitting
    for (const item of cartItems) {
      if (item.quantity > item.max_stock) {
        Swal.fire({
          icon: 'error',
          title: 'Stock Availability Error',
          text: `Insufficient stock for '${item.product_name} (${item.variant_name})'. Available: ${item.max_stock}, Requested: ${item.quantity}.`,
          background: '#0f172a',
          color: '#f8fafc',
        });
        return;
      }
    }

    const payload = {
      customer_id: selectedCustomer.id,
      order_date: orderDate,
      tax_rate_id: selectedTaxRate?.id,
      discount_rate: discountType === 'percent' ? Number(discountValue) : 0,
      discount_amount: discountAmount,
      paid_amount: autoComplete ? grandTotal : 0,
      payment_method: 'cash',
      notes: orderNotes,
      auto_complete: autoComplete,
      items: cartItems.map((item) => ({
        product_variant_id: item.product_variant_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount,
      })),
    };

    setSubmitting(true);
    try {
      const res = await api.post('/orders', payload);
      if (res.data.success) {
        const order = res.data.order;
        Swal.fire({
          icon: 'success',
          title: autoComplete ? 'Sale Completed!' : 'Order Saved as Pending',
          html: `
            <div class="text-left text-sm space-y-2">
              <p><strong>Order #:</strong> ${order.order_number}</p>
              <p><strong>Customer:</strong> ${selectedCustomer.name}</p>
              <p><strong>Grand Total:</strong> ${currency}${grandTotal.toFixed(2)}</p>
              ${autoComplete ? `<p class="text-emerald-400 font-semibold">Stock deducted & Double-Entry Ledger posted automatically!</p>` : ''}
            </div>
          `,
          confirmButtonText: autoComplete ? 'View Invoice' : 'View Order',
          showCancelButton: true,
          cancelButtonText: 'New Sale',
          confirmButtonColor: '#6366f1',
          cancelButtonColor: '#334155',
          background: '#0f172a',
          color: '#f8fafc',
        }).then((result) => {
          if (result.isConfirmed) {
            if (autoComplete && order.invoice) {
              onNavigateToInvoice?.(order.invoice.id);
            } else {
              onNavigateToOrder?.(order.id);
            }
          }
        });

        // Reset Cart and Reload Catalog
        setCartItems([]);
        setDiscountValue(0);
        setOrderNotes('');
        loadPosData();
      }
    } catch (err) {
      // Handled by Axios interceptor
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Top Header & Barcode Quick Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-indigo-400" />
            POS Terminal & Sales Order
          </h1>
          <p className="text-xs text-slate-400">
            Real-time pricing, multi-variant selection, 5% dynamic tax, and atomic stock deduction.
          </p>
        </div>

        {/* Barcode scanner input */}
        <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="Scan Barcode / SKU..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-56 font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
          >
            Scan
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Product Catalog (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Category Chips & Search Bar */}
          <div className="glass-panel rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search products by name, perfume brand, variant, or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                All Categories ({products.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    String(selectedCategory) === String(cat.id)
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto pr-1">
            {filteredProducts.map((product) => {
              const primaryVariant = product.variants?.[0];
              const totalStock = product.variants?.reduce((sum, v) => sum + v.stock_quantity, 0) || 0;
              const hasMultipleVariants = product.has_variants && product.variants?.length > 1;

              return (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className={`glass-panel glass-panel-hover rounded-2xl p-3.5 flex flex-col justify-between cursor-pointer relative overflow-hidden group ${
                    totalStock <= 0 ? 'opacity-60 border-red-950/40' : ''
                  }`}
                >
                  <div>
                    {/* Top badging */}
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 truncate max-w-[100px]">
                        {product.category?.name || 'General'}
                      </span>
                      {hasMultipleVariants ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                          <Layers className="w-2.5 h-2.5" /> {product.variants.length} Variants
                        </span>
                      ) : (
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            totalStock <= 0
                              ? 'bg-rose-500/20 text-rose-300'
                              : totalStock <= 5
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {totalStock > 0 ? `${totalStock} in stock` : 'Out of stock'}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-100 text-xs leading-snug group-hover:text-indigo-300 transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                    {product.brand && (
                      <p className="text-[10px] text-slate-400 mt-0.5">{product.brand}</p>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400">Price</span>
                      <div className="text-sm font-black text-indigo-400">
                        {currency}
                        {hasMultipleVariants
                          ? `${Number(product.variants[0].selling_price).toFixed(2)}+`
                          : Number(primaryVariant?.selling_price || 0).toFixed(2)}
                      </div>
                    </div>

                    <div className="w-7 h-7 rounded-xl bg-indigo-600/20 group-hover:bg-indigo-600 border border-indigo-500/30 group-hover:border-transparent flex items-center justify-center text-indigo-400 group-hover:text-white transition-all shadow-sm">
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Sales Order Line Items & Summary (5 Cols) */}
        <div className="lg:col-span-5">
          <div className="glass-panel rounded-2xl p-4 lg:p-5 flex flex-col h-full border border-indigo-500/20 shadow-xl">
            {/* Customer Selector & Quick Add */}
            <div className="pb-3 border-b border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300">Customer</label>
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(true)}
                  className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" /> + New Customer
                </button>
              </div>

              <select
                value={selectedCustomer?.id || ''}
                onChange={(e) => {
                  const cust = customers.find(c => String(c.id) === e.target.value);
                  setSelectedCustomer(cust);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.customer_code}) {c.phone ? `• ${c.phone}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Cart Items Table */}
            <div className="flex-1 my-3 overflow-y-auto max-h-[300px] space-y-2 pr-1">
              {cartItems.length === 0 ? (
                <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center">
                  <ShoppingCart className="w-10 h-10 text-slate-700 mb-2" />
                  <p className="text-xs font-semibold text-slate-400">Order is Empty</p>
                  <p className="text-[11px] text-slate-500">Click products or scan barcode to add line items</p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.product_variant_id}
                    className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-200 truncate">
                        {item.product_name}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="text-indigo-300 font-medium">{item.variant_name}</span>
                        <span>•</span>
                        <span>{currency}{Number(item.unit_price).toFixed(2)}/unit</span>
                      </div>
                    </div>

                    {/* Qty Controls */}
                    <div className="flex items-center gap-1.5 bg-slate-800 px-1.5 py-0.5 rounded-lg border border-slate-700">
                      <button
                        onClick={() => updateQuantity(item.product_variant_id, -1)}
                        className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-slate-100 min-w-[20px] text-center font-mono">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product_variant_id, 1)}
                        className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Line Total */}
                    <div className="text-right min-w-[65px]">
                      <div className="text-xs font-bold text-slate-100">
                        {currency}{Number(item.line_total).toFixed(2)}
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => removeItem(item.product_variant_id)}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Real-time Order Calculations Breakdown */}
            <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
              {/* Subtotal */}
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-200">
                  {currency}{subtotal.toFixed(2)}
                </span>
              </div>

              {/* Discount Input & Amount */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Discount</span>
                  <div className="inline-flex rounded-lg bg-slate-900 border border-slate-700 p-0.5">
                    <button
                      onClick={() => setDiscountType('percent')}
                      className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                        discountType === 'percent' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      %
                    </button>
                    <button
                      onClick={() => setDiscountType('fixed')}
                      className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                        discountType === 'fixed' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      {currency}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max={discountType === 'percent' ? 100 : subtotal}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-16 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-right text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                  <span className="font-semibold text-rose-400 min-w-[60px] text-right">
                    -{currency}{discountAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Dynamic Tax Rate (Admin configurable - 5% default) */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Tax</span>
                  <select
                    value={selectedTaxRate?.id || ''}
                    onChange={(e) => {
                      const tr = taxRates.find(t => String(t.id) === e.target.value);
                      setSelectedTaxRate(tr);
                    }}
                    className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[11px] text-indigo-300 font-semibold focus:outline-none"
                  >
                    {taxRates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({Number(t.rate).toFixed(1)}%)
                      </option>
                    ))}
                  </select>
                </div>

                <span className="font-semibold text-slate-200">
                  +{currency}{taxAmount.toFixed(2)}
                </span>
              </div>

              {/* Grand Total Highlight */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-950/60 to-slate-900 border border-indigo-500/30 flex items-center justify-between mt-2">
                <div>
                  <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                    Grand Total
                  </span>
                  <div className="text-xl font-black text-white">
                    {currency}{grandTotal.toFixed(2)}
                  </div>
                </div>
                <div className="text-right text-[10px] text-slate-400">
                  <span>{cartItems.length} items</span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Pending vs Complete */}
            <div className="grid grid-cols-2 gap-2 mt-4 pt-2">
              <button
                type="button"
                disabled={submitting || cartItems.length === 0}
                onClick={() => handleCheckout(false)}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Save as Pending
              </button>

              <button
                type="button"
                disabled={submitting || cartItems.length === 0}
                onClick={() => handleCheckout(true)}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                Complete & Pay
              </button>
            </div>

            {/* Clear Cart link */}
            {cartItems.length > 0 && (
              <button
                onClick={clearCart}
                className="mt-2 text-[11px] text-slate-500 hover:text-rose-400 text-center transition-colors"
              >
                Reset Order Items
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Variant Selection Modal */}
      {variantModalProduct && (
        <VariantModal
          product={variantModalProduct}
          currency={currency}
          onClose={() => setVariantModalProduct(null)}
          onSelectVariant={(variant, product) => addVariantToCart(variant, product)}
        />
      )}

      {/* Quick Add Customer Modal */}
      {showCustomerModal && (
        <QuickCustomerModal
          onClose={() => setShowCustomerModal(false)}
          onCustomerCreated={(newCust) => {
            setCustomers(prev => [...prev, newCust]);
            setSelectedCustomer(newCust);
          }}
        />
      )}
    </div>
  );
}
