import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
import PosThermalReceiptModal from '../components/PosThermalReceiptModal';
import PosPaymentModal from '../components/PosPaymentModal';
import CustomerSearchSelect from '../components/CustomerSearchSelect';

export default function PosTerminal({ onNavigateToInvoice, onNavigateToOrder }) {
  const navigate = useNavigate();
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

  // Modals & Receipts
  const [variantModalProduct, setVariantModalProduct] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [company, setCompany] = useState({});
  const [receiptData, setReceiptData] = useState({ isOpen: false, invoice: null, order: null });
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
        setCompany(res.data.company || {});

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
        product.variants?.some(v => v.variant_name.toLowerCase().includes(q) || v.sku.toLowerCase().includes(q) || (v.barcode && v.barcode.toLowerCase().includes(q)));
      
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Product Selection handler
  const handleProductClick = (product) => {
    if (product.has_variants && product.variants?.length > 1) {
      setVariantModalProduct(product);
    } else if (product.variants?.length === 1) {
      addItemToCart(product.variants[0], product);
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'No Variants',
        text: 'This product has no active variants configured.',
      });
    }
  };

  // Add Item to Cart
  const addItemToCart = (variant, product) => {
    if (variant.stock_quantity <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Out of Stock',
        text: `Cannot add ${product.name} (${variant.variant_name}) because it is out of stock!`,
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.product_variant_id === variant.id);
      if (existingIndex > -1) {
        const item = prev[existingIndex];
        const newQty = item.quantity + 1;
        if (newQty > variant.stock_quantity) {
          Swal.fire({
            icon: 'warning',
            title: 'Stock Limit Reached',
            text: `Available stock for ${variant.variant_name} is only ${variant.stock_quantity} units.`,
            timer: 2000,
            showConfirmButton: false,
          });
          return prev;
        }

        const updated = [...prev];
        const lineTotal = (newQty * item.unit_price) - item.discount_amount;
        updated[existingIndex] = {
          ...item,
          quantity: newQty,
          line_total: lineTotal,
        };
        return updated;
      } else {
        const unitPrice = parseFloat(variant.selling_price);
        const costPrice = parseFloat(variant.cost_price || 0);
        return [
          ...prev,
          {
            product_id: product.id,
            product_name: product.name,
            product_variant_id: variant.id,
            variant_name: variant.variant_name,
            sku: variant.sku,
            unit_price: unitPrice,
            unit_cost: costPrice,
            quantity: 1,
            discount_amount: 0,
            line_total: unitPrice,
            available_stock: variant.stock_quantity,
          },
        ];
      }
    });
  };

  // Barcode / SKU scanning handler
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const term = barcodeInput.trim().toLowerCase();
    let found = false;

    for (const product of products) {
      for (const variant of product.variants || []) {
        if (
          (variant.barcode && variant.barcode.toLowerCase() === term) ||
          variant.sku.toLowerCase() === term
        ) {
          addItemToCart(variant, product);
          found = true;
          setBarcodeInput('');
          break;
        }
      }
      if (found) break;
    }

    if (!found) {
      Swal.fire({
        icon: 'error',
        title: 'Item Not Found',
        text: `No product variant found matching barcode/SKU: "${barcodeInput}"`,
        timer: 1800,
        showConfirmButton: false,
      });
      setBarcodeInput('');
    }
  };

  // Quantity updates
  const updateQuantity = (variantId, delta) => {
    setCartItems((prev) => {
      return prev
        .map((item) => {
          if (item.product_variant_id === variantId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.available_stock) {
              Swal.fire({
                icon: 'warning',
                title: 'Insufficient Stock',
                text: `Maximum available quantity in stock is ${item.available_stock} units.`,
                timer: 1800,
                showConfirmButton: false,
              });
              return item;
            }
            const lineTotal = (newQty * item.unit_price) - item.discount_amount;
            return { ...item, quantity: newQty, line_total: lineTotal };
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  // Remove Item
  const removeItem = (variantId) => {
    setCartItems((prev) => prev.filter((i) => i.product_variant_id !== variantId));
  };

  // Calculations
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  }, [cartItems]);

  const discountAmount = useMemo(() => {
    if (!discountValue || discountValue <= 0) return 0;
    if (discountType === 'percent') {
      return (subtotal * parseFloat(discountValue)) / 100;
    }
    return Math.min(parseFloat(discountValue), subtotal);
  }, [subtotal, discountType, discountValue]);

  const netTaxableAmount = Math.max(0, subtotal - discountAmount);

  const taxRatePercent = selectedTaxRate
    ? parseFloat(selectedTaxRate.rate ?? selectedTaxRate.rate_percent ?? 0)
    : 0;
  const taxAmount = (netTaxableAmount * taxRatePercent) / 100;
  const rawTotal = netTaxableAmount + taxAmount;
  const grandTotal = Math.ceil(rawTotal);
  const roundingAdjustment = Math.round((grandTotal - rawTotal) * 100) / 100;

  // Clear Cart
  const handleResetCart = () => {
    setCartItems([]);
    setDiscountValue(0);
    setOrderNotes('');
  };

  // Step 1: Initiate Checkout (Opens Payment Modal to collect money first)
  const handleInitiateCheckout = () => {
    if (cartItems.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Empty Cart',
        text: 'Please select at least one item before proceeding to checkout.',
      });
      return;
    }

    if (!selectedCustomer) {
      Swal.fire({
        icon: 'warning',
        title: 'Customer Required',
        text: 'Please choose or create a customer for this sale.',
      });
      return;
    }

    setIsPaymentModalOpen(true);
  };

  // Step 2: Confirm Payment & Complete Sale (Takes money, posts double-entry journal, deducts stock, and opens 80mm receipt)
  const handleConfirmPaymentAndComplete = async (paymentData) => {
    setSubmitting(true);
    try {
      const calculatedDiscountAmount = discountType === 'percent'
        ? ((subtotal * (Number(discountValue) || 0)) / 100)
        : (Number(discountValue) || 0);

      const payload = {
        customer_id: selectedCustomer.id,
        tax_rate_id: selectedTaxRate?.id || null,
        discount_rate: discountType === 'percent' ? (Number(discountValue) || 0) : 0,
        discount_amount: calculatedDiscountAmount,
        discount_type: discountType,
        discount_value: Number(discountValue) || 0,
        paid_amount: paymentData.paid_amount,
        notes: orderNotes,
        order_date: orderDate,
        payment_method: paymentData.payment_method || 'cash',
        items: cartItems.map((item) => ({
          product_id: item.product_id,
          product_variant_id: item.product_variant_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount_amount || 0,
        })),
      };

      // 1. Create the order
      const orderRes = await api.post('/orders', payload);
      const createdOrder = orderRes.data.order;

      // 2. Complete order with collected payment
      const completeRes = await api.post(`/orders/${createdOrder.id}/complete`, {
        paid_amount: paymentData.paid_amount,
        payment_method: paymentData.payment_method,
        payment_note: paymentData.payment_note || 'POS Counter Payment',
      });

      const invoice = completeRes.data.invoice;
      const completedOrder = completeRes.data.order || createdOrder;

      // Close payment modal
      setIsPaymentModalOpen(false);

      // Reset cart and reload live inventory
      handleResetCart();
      loadPosData();

      // Launch Instant 80mm POS Thermal Receipt Modal
      setReceiptData({
        isOpen: true,
        invoice: invoice,
        order: completedOrder,
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Checkout Failed',
        text: err.response?.data?.message || 'Failed to complete transaction. Please check stock and details.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Save Order as Pending (without taking payment or deducting stock)
  const handleSavePendingOrder = async () => {
    if (cartItems.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Empty Cart',
        text: 'Please select at least one item before saving order.',
      });
      return;
    }

    if (!selectedCustomer) {
      Swal.fire({
        icon: 'warning',
        title: 'Customer Required',
        text: 'Please choose or create a customer for this order.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const calculatedDiscountAmount = discountType === 'percent'
        ? ((subtotal * (Number(discountValue) || 0)) / 100)
        : (Number(discountValue) || 0);

      const payload = {
        customer_id: selectedCustomer.id,
        tax_rate_id: selectedTaxRate?.id || null,
        discount_rate: discountType === 'percent' ? (Number(discountValue) || 0) : 0,
        discount_amount: calculatedDiscountAmount,
        discount_type: discountType,
        discount_value: Number(discountValue) || 0,
        notes: orderNotes,
        order_date: orderDate,
        items: cartItems.map((item) => ({
          product_id: item.product_id,
          product_variant_id: item.product_variant_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount_amount || 0,
        })),
      };

      const orderRes = await api.post('/orders', payload);
      const createdOrder = orderRes.data.order;

      Swal.fire({
        icon: 'success',
        title: 'Order Saved (Pending)',
        text: `Sales Order #${createdOrder.order_number} saved as PENDING. Stock is NOT yet deducted.`,
        showCancelButton: true,
        confirmButtonColor: '#4f46e5',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'View Order Details',
        cancelButtonText: 'New Sale',
      }).then((result) => {
        handleResetCart();
        loadPosData();
        if (result.isConfirmed) {
          if (onNavigateToOrder) {
            onNavigateToOrder(createdOrder.id);
          } else {
            navigate(`/orders/${createdOrder.id}`);
          }
        }
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Error Saving Order',
        text: err.response?.data?.message || 'Failed to save pending order.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Barcode Scanning */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <ShoppingCart className="w-4 h-4" />
            <span>Counter Checkout & Invoicing</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">Point of Sale (POS) Terminal</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time pricing, multi-variant selection, dynamic VAT tax rates, and atomic double-entry accounting.
          </p>
        </div>

        {/* Barcode scanner input */}
        <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Barcode className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="Scan Barcode / SKU..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="pl-10 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 w-56 font-mono font-bold"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-xs transition-colors"
          >
            Scan
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Product Catalog (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Category Chips & Search Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products by name, variant, or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Categories ({products.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    String(selectedCategory) === String(cat.id)
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                  className={`bg-white hover:border-indigo-400 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-all shadow-xs hover:shadow-md group ${
                    totalStock <= 0 ? 'opacity-60 bg-slate-50' : ''
                  }`}
                >
                  <div>
                    {/* Top badging */}
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 truncate max-w-[100px]">
                        {product.category?.name || 'General'}
                      </span>
                      {hasMultipleVariants ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                          <Layers className="w-2.5 h-2.5" /> {product.variants.length} Variants
                        </span>
                      ) : (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            totalStock <= 0
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {totalStock > 0 ? `${totalStock} in stock` : 'Out of stock'}
                        </span>
                      )}
                    </div>

                    <div className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {product.name}
                    </div>

                    {product.brand && (
                      <div className="text-[11px] text-slate-400 font-medium">{product.brand}</div>
                    )}
                  </div>

                  {/* Pricing & Click hint */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      {hasMultipleVariants ? (
                        <span className="text-[10px] text-slate-400">From</span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Price</span>
                      )}
                      <div className="text-sm font-black text-slate-900">
                        {currency}{primaryVariant ? Number(primaryVariant.selling_price).toFixed(0) : '0'}
                      </div>
                    </div>

                    <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-500 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-colors">
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Sales Order Cart & Real-Time Invoicing Breakdown (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col space-y-4">
            {/* Header / Customer Selector */}
            <div className="space-y-3 pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Sales Cart</h3>
                    <p className="text-[10px] text-slate-400">{cartItems.length} line item(s) selected</p>
                  </div>
                </div>

                {cartItems.length > 0 && (
                  <button
                    type="button"
                    onClick={handleResetCart}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Clear Cart
                  </button>
                )}
              </div>

              {/* Searchable Customer Selector + Quick Add */}
              <CustomerSearchSelect
                customers={customers}
                selectedCustomer={selectedCustomer}
                onSelectCustomer={(cust) => setSelectedCustomer(cust)}
                onOpenNewCustomerModal={() => setShowCustomerModal(true)}
              />
            </div>

            {/* Cart Line Items Table */}
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {cartItems.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
                  Cart is empty. Click products or scan barcodes to add items.
                </div>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.product_variant_id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-slate-900 truncate">
                        {item.product_name} - <span className="text-indigo-600">{item.variant_name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {item.sku} • {currency}{item.unit_price.toFixed(2)} each
                      </div>
                    </div>

                    {/* Quantity Modifier */}
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product_variant_id, -1)}
                        className="w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:bg-slate-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product_variant_id, 1)}
                        className="w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:bg-slate-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Line Total */}
                    <div className="text-right min-w-[65px]">
                      <div className="text-xs font-black text-slate-900">
                        {currency}{item.line_total.toFixed(2)}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.product_variant_id)}
                        className="text-[10px] text-rose-500 hover:text-rose-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Calculations & Discounts & Taxes */}
            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
              {/* Discount Input */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500 font-medium">Discount</span>
                <div className="flex items-center gap-1">
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 outline-none"
                  >
                    <option value="percent">% Off</option>
                    <option value="fixed">Fixed ({currency})</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={discountValue || ''}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-16 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 font-bold outline-none text-right"
                  />
                </div>
              </div>

              {/* Dynamic Tax Rate Selector */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500 font-medium">Tax Rate (VAT)</span>
                <select
                  value={selectedTaxRate?.id || ''}
                  onChange={(e) => {
                    const rate = taxRates.find((t) => t.id === Number(e.target.value));
                    setSelectedTaxRate(rate || null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-indigo-700 outline-none"
                >
                  {taxRates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({Number(t.rate ?? t.rate_percent ?? 0).toFixed(1)}%)
                    </option>
                  ))}
                </select>
              </div>

              {/* Subtotal, Tax and Grand Total Lines */}
              <div className="space-y-1 pt-2 border-t border-slate-100">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-bold text-slate-800">{currency}{subtotal.toFixed(2)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600 font-medium">
                    <span>Discount:</span>
                    <span>-{currency}{discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-500">
                  <span>{selectedTaxRate?.name || 'VAT'} ({taxRatePercent}%):</span>
                  <span className="font-bold text-slate-800">+{currency}{taxAmount.toFixed(2)}</span>
                </div>

                {roundingAdjustment !== 0 && (
                  <div className="flex justify-between text-indigo-600 font-medium">
                    <span>Rounding (Ceil):</span>
                    <span className="font-bold">{roundingAdjustment > 0 ? '+' : ''}{currency}{roundingAdjustment.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="font-black text-sm text-slate-900">Grand Total:</span>
                  <span className="font-black text-xl text-indigo-600">
                    {currency}{grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Pending Order vs Instant Invoice */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                disabled={submitting || cartItems.length === 0}
                onClick={handleSavePendingOrder}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs disabled:opacity-40 transition-all shadow-xs"
              >
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Save Pending</span>
              </button>

              <button
                type="button"
                disabled={submitting || cartItems.length === 0}
                onClick={handleInitiateCheckout}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-40 transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Pay & Print ({currency}{grandTotal.toFixed(2)})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Variant Selection Modal */}
      {variantModalProduct && (
        <VariantModal
          product={variantModalProduct}
          currency={currency}
          onClose={() => setVariantModalProduct(null)}
          onSelectVariant={(variant, product) => {
            addItemToCart(variant, product);
          }}
        />
      )}

      {/* Quick Customer Creation Modal */}
      {showCustomerModal && (
        <QuickCustomerModal
          onClose={() => setShowCustomerModal(false)}
          onCustomerCreated={(customer) => {
            setCustomers((prev) => [customer, ...prev]);
            setSelectedCustomer(customer);
          }}
        />
      )}

      {/* POS Tender / Payment Modal (Takes money & calculates change before invoice) */}
      <PosPaymentModal
        isOpen={isPaymentModalOpen}
        grandTotal={grandTotal}
        rawTotal={rawTotal}
        roundingAdjustment={roundingAdjustment}
        subtotal={subtotal}
        taxAmount={taxAmount}
        discountAmount={discountAmount}
        customer={selectedCustomer}
        itemCount={cartItems.reduce((s, i) => s + i.quantity, 0)}
        currency={currency}
        onClose={() => setIsPaymentModalOpen(false)}
        onConfirmPayment={handleConfirmPaymentAndComplete}
        submitting={submitting}
      />

      {/* POS 80mm Thermal Receipt Modal */}
      <PosThermalReceiptModal
        isOpen={receiptData.isOpen}
        invoice={receiptData.invoice}
        order={receiptData.order}
        company={company}
        onClose={() => setReceiptData({ isOpen: false, invoice: null, order: null })}
        onNewSale={() => setReceiptData({ isOpen: false, invoice: null, order: null })}
      />
    </div>
  );
}
