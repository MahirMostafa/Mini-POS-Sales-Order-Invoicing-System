import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Barcode,
  ChevronLeft,
  ChevronRight,
  Printer,
  ShoppingBag,
  Hash,
  Sparkles,
  Package,
  Phone,
  CreditCard,
  Store,
  Clock,
  UserCheck,
  User,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { printDocument } from '../utils/printReceipt';

export default function PurchaseManagement() {
  const [purchases, setPurchases] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [summary, setSummary] = useState({
    total_purchases: 0,
    received_purchases: 0,
    pending_purchases: 0,
    total_spend: 0,
    total_items_restocked: 0
  });
  const [recentSuppliers, setRecentSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [variantsList, setVariantsList] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [company, setCompany] = useState({
    name: 'MINI POS & RETAIL HUB',
    address: 'Dhaka, Bangladesh',
    phone: '+880 1700-000000',
    email: 'billing@minipos.com',
    tax_bin: 'BIN-99201928'
  });
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'received'
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'yesterday', 'this_week', 'this_month', 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [receivingId, setReceivingId] = useState(null);

  // Barcode & Product Search inside New Purchase Modal
  const [barcodeInput, setBarcodeInput] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [supplierSuggestions, setSupplierSuggestions] = useState([]);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [lastScannedVariantId, setLastScannedVariantId] = useState(null);

  const barcodeInputRef = useRef(null);
  const productSearchInputRef = useRef(null);

  // New Purchase Form State
  const [formData, setFormData] = useState({
    supplier_name: '',
    supplier_phone: '',
    supplier_invoice_no: '',
    purchase_date: new Date().toISOString().split('T')[0],
    status: 'pending', // default to pending per user request
    payment_method: 'bank_transfer',
    notes: '',
    items: []
  });

  // Calculate Date Filters
  const computeDateRange = (type) => {
    const today = new Date();
    const formatDate = (d) => d.toISOString().split('T')[0];

    if (type === 'today') {
      const d = formatDate(today);
      return { start: d, end: d };
    } else if (type === 'yesterday') {
      const y = new Date();
      y.setDate(today.getDate() - 1);
      const d = formatDate(y);
      return { start: d, end: d };
    } else if (type === 'this_week') {
      const first = new Date(today.setDate(today.getDate() - today.getDay()));
      const last = new Date(today.setDate(today.getDate() - today.getDay() + 6));
      return { start: formatDate(first), end: formatDate(last) };
    } else if (type === 'this_month') {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { start: formatDate(first), end: formatDate(last) };
    }
    return { start: '', end: '' };
  };

  const handleDateFilterChange = (filter) => {
    setDateFilter(filter);
    setCurrentPage(1);
    if (filter !== 'custom') {
      const { start, end } = computeDateRange(filter);
      setStartDate(start);
      setEndDate(end);
    }
  };

  // Fetch Purchases list with filters
  const fetchPurchases = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (paymentMethodFilter !== 'all') params.append('payment_method', paymentMethodFilter);

      const res = await api.get(`/purchases?${params.toString()}`);
      if (res.data.success) {
        setPurchases(res.data.purchases?.data || []);
        setPagination({
          current_page: res.data.purchases?.current_page || 1,
          last_page: res.data.purchases?.last_page || 1,
          total: res.data.purchases?.total || 0,
        });
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
        if (res.data.suppliers) {
          setRecentSuppliers(res.data.suppliers);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Products & POS Info
  const fetchProductsCatalog = async () => {
    try {
      const [resProducts, resPosInit, resMe] = await Promise.allSettled([
        api.get('/products?per_page=150'),
        api.get('/pos/init'),
        api.get('/auth/me')
      ]);

      if (resProducts.status === 'fulfilled') {
        const prods = resProducts.value.data.products?.data || resProducts.value.data.products || [];
        setProducts(prods);

        const allVars = [];
        prods.forEach((p) => {
          if (p.variants && p.variants.length > 0) {
            p.variants.forEach((v) => {
              allVars.push({
                id: v.id,
                product_id: p.id,
                productName: p.name,
                categoryName: p.category?.name || 'Uncategorized',
                brand: p.brand || '',
                variantName: v.variant_name || 'Standard',
                sku: v.sku || '',
                barcode: v.barcode || '',
                costPrice: parseFloat(v.cost_price || 0),
                sellingPrice: parseFloat(v.selling_price || 0),
                stock: v.stock_quantity || 0,
                image: p.image_url || null,
              });
            });
          }
        });
        setVariantsList(allVars);
      }

      if (resPosInit.status === 'fulfilled' && resPosInit.value.data.company) {
        setCompany(resPosInit.value.data.company);
      }

      if (resMe.status === 'fulfilled' && resMe.value.data.user) {
        setCurrentUser(resMe.value.data.user);
      }
    } catch (err) {
      console.error('Failed to load products catalog', err);
    }
  };

  useEffect(() => {
    fetchPurchases(currentPage);
  }, [currentPage, search, statusFilter, startDate, endDate, paymentMethodFilter]);

  useEffect(() => {
    fetchProductsCatalog();
  }, []);

  // Filtered product suggestions for modal search
  const filteredProductOptions = useMemo(() => {
    if (!productSearchQuery.trim()) return variantsList.slice(0, 8);
    const q = productSearchQuery.toLowerCase();
    return variantsList.filter(
      (v) =>
        v.productName.toLowerCase().includes(q) ||
        v.variantName.toLowerCase().includes(q) ||
        v.sku.toLowerCase().includes(q) ||
        (v.barcode && v.barcode.toLowerCase().includes(q)) ||
        v.categoryName.toLowerCase().includes(q) ||
        v.brand.toLowerCase().includes(q)
    ).slice(0, 15);
  }, [productSearchQuery, variantsList]);

  // Open modal and reset form
  const handleOpenCreateModal = () => {
    setIsCreateOpen(true);
    setFormData({
      supplier_name: '',
      supplier_phone: '',
      supplier_invoice_no: '',
      purchase_date: new Date().toISOString().split('T')[0],
      status: 'pending',
      payment_method: 'bank_transfer',
      notes: '',
      items: []
    });
    setBarcodeInput('');
    setProductSearchQuery('');
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 200);
  };

  // Add a variant to purchase line items
  const addVariantToPurchase = (variant, qty = 1) => {
    setFormData((prev) => {
      const existingIndex = prev.items.findIndex((item) => item.product_variant_id === variant.id);

      if (existingIndex > -1) {
        const updated = [...prev.items];
        updated[existingIndex].quantity += qty;
        return { ...prev, items: updated };
      } else {
        const newLine = {
          product_variant_id: variant.id,
          variantDetails: variant,
          quantity: qty,
          unit_cost: variant.costPrice || 0,
          selling_price: variant.sellingPrice || 0,
        };
        return { ...prev, items: [newLine, ...prev.items] };
      }
    });

    setLastScannedVariantId(variant.id);
    setTimeout(() => setLastScannedVariantId(null), 1500);

    setProductSearchQuery('');
    setShowProductDropdown(false);
  };

  // Handle Barcode Scan / Enter
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    const raw = barcodeInput.trim();
    if (!raw) return;

    const match = variantsList.find(
      (v) =>
        (v.barcode && v.barcode.toLowerCase() === raw.toLowerCase()) ||
        (v.sku && v.sku.toLowerCase() === raw.toLowerCase())
    );

    if (match) {
      addVariantToPurchase(match, 1);
      setBarcodeInput('');
    } else {
      const partial = variantsList.find(
        (v) =>
          v.productName.toLowerCase().includes(raw.toLowerCase()) ||
          v.sku.toLowerCase().includes(raw.toLowerCase())
      );

      if (partial) {
        addVariantToPurchase(partial, 1);
        setBarcodeInput('');
      } else {
        Swal.fire({
          icon: 'info',
          title: 'Barcode Not Found',
          text: `No product found matching barcode/SKU: "${raw}". Use product search to find and add manually.`,
          timer: 2500,
          showConfirmButton: false,
        });
      }
    }
  };

  // Line item field change
  const handleItemFieldChange = (index, field, value) => {
    const updated = [...formData.items];
    if (field === 'quantity') {
      const val = parseInt(value, 10);
      updated[index].quantity = isNaN(val) || val < 1 ? 1 : val;
    } else if (field === 'unit_cost') {
      const val = parseFloat(value);
      updated[index].unit_cost = isNaN(val) || val < 0 ? 0 : val;
    }
    setFormData({ ...formData, items: updated });
  };

  const handleRemoveLineItem = (index) => {
    const updated = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: updated });
  };

  const handleClearAllItems = () => {
    setFormData({ ...formData, items: [] });
  };

  // Supplier Name typing & auto-suggestion
  const handleSupplierNameChange = (e) => {
    const val = e.target.value;
    setFormData({ ...formData, supplier_name: val });

    if (val.trim()) {
      const matches = recentSuppliers.filter((s) =>
        s.supplier_name.toLowerCase().includes(val.toLowerCase())
      );
      setSupplierSuggestions(matches);
      setShowSupplierDropdown(matches.length > 0);
    } else {
      setShowSupplierDropdown(false);
    }
  };

  const handleSelectSupplier = (s) => {
    setFormData({
      ...formData,
      supplier_name: s.supplier_name,
      supplier_phone: s.supplier_phone || formData.supplier_phone,
    });
    setShowSupplierDropdown(false);
  };

  // Calculate Order Grand Total & Total Units
  const orderSummary = useMemo(() => {
    const totalAmount = formData.items.reduce(
      (sum, item) => sum + item.quantity * item.unit_cost,
      0
    );
    const totalUnits = formData.items.reduce((sum, item) => sum + item.quantity, 0);
    return { totalAmount, totalUnits };
  }, [formData.items]);

  // Submit Purchase Order
  const handleSubmitPurchase = async (e) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Empty Purchase Order',
        text: 'Please add at least one product line item to restock.',
      });
      return;
    }

    if (!formData.supplier_name.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Supplier Required',
        text: 'Please enter the supplier name.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        supplier_name: formData.supplier_name.trim(),
        supplier_phone: formData.supplier_phone.trim() || null,
        supplier_invoice_no: formData.supplier_invoice_no.trim() || null,
        purchase_date: formData.purchase_date,
        status: formData.status || 'pending',
        payment_method: formData.payment_method,
        notes: formData.notes.trim() || null,
        items: formData.items.map((it) => ({
          product_variant_id: it.product_variant_id,
          quantity: it.quantity,
          unit_cost: it.unit_cost,
        })),
      };

      const res = await api.post('/purchases', payload);
      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: formData.status === 'received' ? 'Goods Received & Stocked!' : 'Purchase Order Created!',
          text: res.data.message || 'Purchase order recorded successfully.',
          timer: 2000,
          showConfirmButton: false,
        });

        setIsCreateOpen(false);
        fetchPurchases(1);
        fetchProductsCatalog();
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Purchase Failed',
        text: err.response?.data?.message || 'Failed to record purchase order.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Receive Goods Action (Two-stage procurement confirmation)
  const handleReceivePurchase = async (p) => {
    const totalItemsCount = p.items?.length || 0;
    const totalUnitsCount = p.items?.reduce((s, it) => s + parseInt(it.quantity || 0, 10), 0) || 0;

    const result = await Swal.fire({
      title: `Receive PO #${p.purchase_number}?`,
      html: `
        <div style="text-align: left; font-size: 13px; line-height: 1.5; color: #334155;">
          <p style="margin-bottom: 4px;"><strong>Supplier:</strong> ${p.supplier_name}</p>
          <p style="margin-bottom: 4px;"><strong>Items to Receive:</strong> ${totalItemsCount} products (${totalUnitsCount} total units)</p>
          <p style="margin-bottom: 8px;"><strong>Total Value:</strong> ৳${Number(p.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <div style="background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 10px; color: #92400e; font-size: 11px;">
            <strong>Inventory Audit & Tracking:</strong><br/>
            Confirming this will immediately add these units into live warehouse inventory, recalculate Weighted Average Costing (WAC), and record your user account as the official Goods Receiver.
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Confirm & Add to Stock',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#94a3b8',
    });

    if (result.isConfirmed) {
      setReceivingId(p.id);
      try {
        const res = await api.post(`/purchases/${p.id}/receive`);
        if (res.data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Stock Replenished!',
            text: res.data.message || 'Goods received into stock and audit trail logged.',
            timer: 2000,
            showConfirmButton: false,
          });

          await fetchPurchases(currentPage);
          await fetchProductsCatalog();

          if (selectedPurchase && selectedPurchase.id === p.id) {
            setSelectedPurchase(res.data.purchase);
          }
        }
      } catch (err) {
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'Receipt Failed',
          text: err.response?.data?.message || 'Failed to confirm goods receipt.',
        });
      } finally {
        setReceivingId(null);
      }
    }
  };

  // Print GRN / Goods Received Note
  const handlePrintGRN = () => {
    if (!selectedPurchase) return;
    printDocument('purchase-grn-document', `Goods Received Note - ${selectedPurchase.purchase_number}`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Truck className="w-4 h-4" />
            <span>Two-Stage Procurement & Goods Inflow</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">Manage Purchases & Inventory Replenishment</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Create Purchase Orders (Pending) & Confirm Goods Receipts with audit user tracking & Weighted Average Costing (WAC).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Purchase Order</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Spend</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              ৳{Number(summary.total_spend || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">Cumulative acquisition cost</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Received & Stocked</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              {summary.received_purchases || 0} Orders
            </div>
            <div className="text-[10px] text-slate-500 font-medium">Physically stocked into inventory</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Delivery</div>
            <div className="text-xl font-black text-amber-600 mt-0.5">
              {summary.pending_purchases || 0} Orders
            </div>
            <div className="text-[10px] text-slate-500 font-medium">Awaiting goods receipt verification</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <PackageCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stock Restocked</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              {summary.total_items_restocked || 0} Units
            </div>
            <div className="text-[10px] text-slate-500 font-medium">Net units added to inventory</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search PO #, supplier, phone, invoice..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all shadow-2xs"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full lg:w-auto">
            {/* Status Dropdown */}
            <div className="w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending Receipt</option>
                <option value="received">Received & Stocked</option>
              </select>
            </div>

            {/* Date Range Dropdown */}
            <div className="w-full sm:w-auto">
              <select
                value={dateFilter}
                onChange={(e) => handleDateFilterChange(e.target.value)}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>

            {/* Payment Method Dropdown */}
            <div className="w-full sm:w-auto">
              <select
                value={paymentMethodFilter}
                onChange={(e) => {
                  setPaymentMethodFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer"
              >
                <option value="all">All Payment Methods</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash Counter</option>
                <option value="card">Corporate Card</option>
                <option value="credit">Supplier Credit / A/P</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => fetchPurchases(currentPage)}
              className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 shadow-2xs transition-colors cursor-pointer shrink-0"
              title="Refresh list"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Custom Date Pickers */}
        {dateFilter === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        )}
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Purchase Order #</th>
                <th className="py-3.5 px-6">Supplier Details</th>
                <th className="py-3.5 px-6">Date</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">User Tracking</th>
                <th className="py-3.5 px-6 text-right">Total (Tk)</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading purchase records...
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-slate-400">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                      <Truck className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-slate-700">No purchase orders found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Click "New Purchase Order" to create a procurement order.
                    </p>
                  </td>
                </tr>
              ) : (
                purchases.map((p) => {
                  const isPending = p.status === 'pending';
                  const isReceiving = receivingId === p.id;
                  const receiver = p.received_by || p.receivedBy;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <span className="font-bold font-mono text-indigo-600 text-xs bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
                          {p.purchase_number}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900">{p.supplier_name}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          {p.supplier_invoice_no && (
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium">
                              Bill #{p.supplier_invoice_no}
                            </span>
                          )}
                          {p.supplier_phone && <span>{p.supplier_phone}</span>}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-600">
                        {p.purchase_date}
                      </td>
                      <td className="py-4 px-6">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Pending Receipt
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Received & Stocked
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-xs text-slate-800 flex items-center gap-1 font-medium">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Ordered by: <strong>{p.user?.name || 'Staff'}</strong></span>
                        </div>
                        {isPending ? (
                          <div className="text-[10px] text-amber-600 font-medium flex items-center gap-1 mt-0.5">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>Awaiting physical goods receipt</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
                            <UserCheck className="w-3 h-3 shrink-0 text-emerald-600" />
                            <span>Received by: <strong>{receiver?.name || p.user?.name || 'Storekeeper'}</strong></span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right font-black text-slate-900 text-sm">
                        ৳{Number(p.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isPending && (
                            <button
                              type="button"
                              onClick={() => handleReceivePurchase(p)}
                              disabled={isReceiving}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                              title="Confirm Goods Receipt and add to stock"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              <span>{isReceiving ? 'Receiving...' : 'Receive Goods'}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedPurchase(p)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-colors inline-flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                            title="View Goods Received Note"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{isPending ? 'View PO' : 'View / GRN'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {pagination.last_page > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div>
              Showing page <span className="font-bold text-slate-900">{pagination.current_page}</span> of{' '}
              <span className="font-bold text-slate-900">{pagination.last_page}</span> ({pagination.total} total)
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.current_page <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={pagination.current_page >= pagination.last_page}
                onClick={() => setCurrentPage((p) => Math.min(pagination.last_page, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* NEW PURCHASE ORDER MODAL (TWO-STAGE SELECTION) */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">New Supplier Purchase Order</h3>
                  <p className="text-xs text-slate-500">
                    Two-Stage Procurement: Record pending orders or receive shipments into stock with audit logging
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitPurchase} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* STAGE SELECTION: PENDING VS IMMEDIATE RECEIVE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div
                  onClick={() => setFormData({ ...formData, status: 'pending' })}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    formData.status === 'pending'
                      ? 'border-indigo-600 bg-indigo-50/60 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1.5 text-xs font-black text-indigo-950 uppercase tracking-wider">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      1. Pending Order (Awaiting Goods)
                    </span>
                    <input
                      type="radio"
                      name="procurement_mode"
                      checked={formData.status === 'pending'}
                      onChange={() => setFormData({ ...formData, status: 'pending' })}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    (Recommended) Saves purchase order without modifying stock. Stock and WAC will update only when goods are physically received and verified by an authorized receiver.
                  </p>
                </div>

                <div
                  onClick={() => setFormData({ ...formData, status: 'received' })}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    formData.status === 'received'
                      ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1.5 text-xs font-black text-emerald-950 uppercase tracking-wider">
                      <PackageCheck className="w-4 h-4 text-emerald-600" />
                      2. Immediate Goods Receipt (In-Hand)
                    </span>
                    <input
                      type="radio"
                      name="procurement_mode"
                      checked={formData.status === 'received'}
                      onChange={() => setFormData({ ...formData, status: 'received' })}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Shipment is physically in hand right now. Immediately increases stock inventory and recalculates Weighted Average Costing (WAC) with you as the receiver.
                  </p>
                </div>
              </div>

              {/* Supplier & Order Meta Header */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* Supplier Name with Autocomplete */}
                <div className="relative">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Supplier Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Imports Ltd."
                      value={formData.supplier_name}
                      onChange={handleSupplierNameChange}
                      onFocus={() => {
                        if (recentSuppliers.length > 0) setShowSupplierDropdown(true);
                      }}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                    />
                  </div>

                  {/* Supplier Suggestions Dropdown */}
                  {showSupplierDropdown && supplierSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 max-h-40 overflow-y-auto">
                      {supplierSuggestions.map((s, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSelectSupplier(s)}
                          className="px-3 py-2 text-xs hover:bg-indigo-50 cursor-pointer flex items-center justify-between border-b border-slate-50 last:border-0"
                        >
                          <span className="font-bold text-slate-800">{s.supplier_name}</span>
                          {s.supplier_phone && (
                            <span className="text-[10px] text-slate-400">{s.supplier_phone}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Supplier Phone */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Supplier Contact / Phone</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="+880 1700-000000"
                      value={formData.supplier_phone}
                      onChange={(e) => setFormData({ ...formData, supplier_phone: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                    />
                  </div>
                </div>

                {/* Supplier Invoice Reference */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Supplier Invoice / Bill #</label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. INV-2026-9021"
                      value={formData.supplier_invoice_no}
                      onChange={(e) => setFormData({ ...formData, supplier_invoice_no: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                    />
                  </div>
                </div>

                {/* Purchase Date */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Purchase Date</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      required
                      value={formData.purchase_date}
                      onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Payment Method</label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={formData.payment_method}
                      onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                    >
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash Counter</option>
                      <option value="card">Corporate Card</option>
                      <option value="credit">Supplier Credit (Accounts Payable)</option>
                    </select>
                  </div>
                </div>

                {/* Remarks & Notes */}
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Remarks / Batch Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Batch #402, inspected upon receipt, verified expiry 2028"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                  />
                </div>
              </div>

              {/* SEARCH & BARCODE SCANNER TOOLBAR */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    Quick Product Addition & Barcode Scanner
                  </span>
                  <span className="text-[11px] text-indigo-600 font-medium">
                    {variantsList.length} product variants in catalog
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  {/* Barcode Scanner Input */}
                  <div className="md:col-span-5">
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-indigo-600">
                        <Barcode className="w-4 h-4" />
                      </div>
                      <input
                        ref={barcodeInputRef}
                        type="text"
                        placeholder="Scan or type Barcode / SKU (Press Enter)..."
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleBarcodeSubmit(e);
                          }
                        }}
                        className="w-full pl-9 pr-14 py-2.5 rounded-xl border border-indigo-200 text-xs text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 font-mono font-bold shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={handleBarcodeSubmit}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] shadow-xs cursor-pointer"
                      >
                        Scan
                      </button>
                    </div>
                  </div>

                  {/* Product Name / Category Live Search */}
                  <div className="md:col-span-7 relative">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        ref={productSearchInputRef}
                        type="text"
                        placeholder="Search product by name, brand, SKU or category..."
                        value={productSearchQuery}
                        onChange={(e) => {
                          setProductSearchQuery(e.target.value);
                          setShowProductDropdown(true);
                        }}
                        onFocus={() => setShowProductDropdown(true)}
                        className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium shadow-xs"
                      />
                      {productSearchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setProductSearchQuery('');
                            setShowProductDropdown(false);
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Autocomplete Results Dropdown */}
                    {showProductDropdown && filteredProductOptions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-40 max-h-64 overflow-y-auto divide-y divide-slate-100">
                        {filteredProductOptions.map((v) => (
                          <div
                            key={v.id}
                            onClick={() => addVariantToPurchase(v, 1)}
                            className="p-3 hover:bg-indigo-50/80 cursor-pointer flex items-center justify-between transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                                <Package className="w-4 h-4 text-indigo-600" />
                              </div>
                              <div>
                                <div className="font-bold text-xs text-slate-900">
                                  {v.productName}{' '}
                                  <span className="text-indigo-600 font-medium">({v.variantName})</span>
                                </div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                                  <span className="font-mono bg-slate-100 px-1 py-0.2 rounded text-slate-600">
                                    SKU: {v.sku}
                                  </span>
                                  {v.barcode && <span>Barcode: {v.barcode}</span>}
                                  <span>{v.categoryName}</span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-xs font-bold text-slate-900">
                                Cost: ৳{v.costPrice.toFixed(2)}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                Stock: <span className="font-bold text-slate-800">{v.stock} pcs</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* PURCHASE ITEMS TABLE */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Purchased Items ({formData.items.length})
                    </h4>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Total Units: <span className="font-bold text-indigo-600">{orderSummary.totalUnits}</span>
                    </span>
                  </div>

                  {formData.items.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllItems}
                      className="text-[11px] font-bold text-rose-500 hover:text-rose-700 hover:underline cursor-pointer"
                    >
                      Clear All Items
                    </button>
                  )}
                </div>

                {formData.items.length === 0 ? (
                  <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center text-slate-400 space-y-2 bg-slate-50/50">
                    <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-600">No items added to this purchase order yet</p>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      Scan a product barcode or use the search box above to add items for replenishment.
                    </p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Item & Variant</th>
                          <th className="py-3 px-3 text-center">In Stock</th>
                          <th className="py-3 px-4 text-center w-36">Unit Cost (Tk)</th>
                          <th className="py-3 px-4 text-center w-36">Quantity</th>
                          <th className="py-3 px-3 text-center">Retail / Margin</th>
                          <th className="py-3 px-4 text-right">Line Subtotal</th>
                          <th className="py-3 px-3 text-center w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {formData.items.map((item, index) => {
                          const v = item.variantDetails || {};
                          const lineTotal = item.quantity * item.unit_cost;
                          const retailPrice = v.sellingPrice || item.selling_price || 0;
                          const marginPercent =
                            item.unit_cost > 0 && retailPrice > 0
                              ? (((retailPrice - item.unit_cost) / retailPrice) * 100).toFixed(0)
                              : 0;

                          const isHighlighted = lastScannedVariantId === item.product_variant_id;

                          return (
                            <tr
                              key={item.product_variant_id || index}
                              className={`transition-colors ${
                                isHighlighted ? 'bg-indigo-50/80 ring-2 ring-indigo-500/20' : 'hover:bg-slate-50/50'
                              }`}
                            >
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-slate-900">
                                  {v.productName || 'Product'} -{' '}
                                  <span className="text-indigo-600">{v.variantName || 'Standard'}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  SKU: {v.sku} {v.barcode && `| Barcode: ${v.barcode}`}
                                </div>
                              </td>

                              <td className="py-3.5 px-3 text-center font-bold text-slate-700">
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px]">
                                  {v.stock || 0} pcs
                                </span>
                              </td>

                              {/* Unit Cost */}
                              <td className="py-3.5 px-4">
                                <div className="relative">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    value={item.unit_cost}
                                    onChange={(e) => handleItemFieldChange(index, 'unit_cost', e.target.value)}
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-right"
                                  />
                                </div>
                                {v.costPrice > 0 && (
                                  <div className="text-[9px] text-slate-400 text-right mt-0.5">
                                    Current Avg: ৳{v.costPrice.toFixed(2)}
                                  </div>
                                )}
                              </td>

                              {/* Quantity Stepper */}
                              <td className="py-3.5 px-4">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleItemFieldChange(index, 'quantity', item.quantity - 1)}
                                    className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    required
                                    value={item.quantity}
                                    onChange={(e) => handleItemFieldChange(index, 'quantity', e.target.value)}
                                    className="w-14 text-center px-1 py-1 rounded-lg border border-slate-300 text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleItemFieldChange(index, 'quantity', item.quantity + 1)}
                                    className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              </td>

                              {/* Retail Price & Margin */}
                              <td className="py-3.5 px-3 text-center">
                                <div className="text-[11px] font-bold text-slate-800">
                                  ৳{retailPrice.toFixed(2)}
                                </div>
                                {marginPercent > 0 && (
                                  <span className="inline-block text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                    {marginPercent}% Margin
                                  </span>
                                )}
                              </td>

                              {/* Line Subtotal */}
                              <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm">
                                ৳{lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>

                              {/* Remove button */}
                              <td className="py-3.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLineItem(index)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Remove item"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Purchase Order Summary & Bottom Actions */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white sticky bottom-0 z-20 py-2">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Total Procurement Cost
                  </div>
                  <div className="text-2xl font-black text-indigo-600">
                    ৳{orderSummary.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || formData.items.length === 0}
                    className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      formData.status === 'received'
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                        : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                    }`}
                  >
                    {formData.status === 'received' ? <PackageCheck className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    <span>
                      {submitting
                        ? 'Processing...'
                        : formData.status === 'received'
                        ? 'Confirm & Stock Inflow Now'
                        : 'Save as Pending Purchase Order'}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW GOODS RECEIVED NOTE (GRN) / PURCHASE MODAL */}
      {selectedPurchase && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
            
            {/* Modal Top Header (Sticky, No-Print) */}
            <div className="no-print shrink-0 px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/95 backdrop-blur-xs">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
                  selectedPurchase.status === 'pending'
                    ? 'bg-amber-50 border border-amber-200 text-amber-600'
                    : 'bg-indigo-50 border border-indigo-100 text-indigo-600'
                }`}>
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {selectedPurchase.status === 'pending' ? 'Purchase Order (PO)' : 'Goods Received Note (GRN)'} #{selectedPurchase.purchase_number}
                  </h3>
                  <p className="text-[10px] text-slate-400">Supplier: {selectedPurchase.supplier_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedPurchase.status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => handleReceivePurchase(selectedPurchase)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <PackageCheck className="w-3.5 h-3.5" />
                    <span>Receive Goods</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handlePrintGRN}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Print Goods Received Note"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPurchase(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Printable Document Container */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50/30">
              <div id="purchase-grn-document" className="purchase-print-area space-y-6 bg-white text-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
                {/* Store & Document Header */}
                <div className="grn-header flex justify-between items-start border-b-2 border-indigo-600 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Store className="w-5 h-5 text-indigo-600 no-print" />
                      <h2 className="company-title text-xl font-black uppercase tracking-tight text-slate-900">
                        {company.name || 'MINI POS & RETAIL HUB'}
                      </h2>
                    </div>
                    <p className="company-sub text-xs text-slate-500">{company.address || 'Dhaka, Bangladesh'}</p>
                    <p className="company-sub text-xs text-slate-500">
                      Tel: {company.phone || '+880 1700-000000'} | Email: {company.email || 'billing@minipos.com'}
                    </p>
                    <p className="company-sub text-xs font-bold text-indigo-600">VAT Reg BIN: {company.tax_bin || 'BIN-99201928'}</p>
                  </div>

                  <div className="doc-badge text-right">
                    <h3 className="doc-title text-lg font-black text-indigo-600 uppercase">
                      {selectedPurchase.status === 'pending' ? 'Purchase Order (PO)' : 'Goods Received Note (GRN)'}
                    </h3>
                    <div className="doc-no font-mono font-bold text-sm text-slate-800 mt-1">
                      PO #: {selectedPurchase.purchase_number}
                    </div>
                    <div className="mt-1">
                      {selectedPurchase.status === 'pending' ? (
                        <span className="status-tag inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3 no-print" /> Pending Physical Receipt
                        </span>
                      ) : (
                        <span className="status-tag inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 no-print" /> Stock Inflow Verified & Added
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Notice Banner (when pending) */}
                {selectedPurchase.status === 'pending' && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between no-print">
                    <div className="flex items-center gap-2 text-xs text-amber-900">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>This shipment has not yet been received. Inventory stock levels are not updated yet.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleReceivePurchase(selectedPurchase)}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer"
                    >
                      Receive Goods Now
                    </button>
                  </div>
                )}

                {/* Meta Info Grid */}
                <div className="meta-grid grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <div className="meta-label text-[10px] font-bold text-slate-400 uppercase">Purchase Date</div>
                    <div className="meta-val font-bold text-slate-800 mt-0.5">{selectedPurchase.purchase_date}</div>
                  </div>
                  <div>
                    <div className="meta-label text-[10px] font-bold text-slate-400 uppercase">Payment Method</div>
                    <div className="meta-val font-bold text-slate-800 capitalize mt-0.5">
                      {selectedPurchase.payment_method?.replace('_', ' ')}
                    </div>
                  </div>
                  <div>
                    <div className="meta-label text-[10px] font-bold text-slate-400 uppercase">Supplier Bill / Inv #</div>
                    <div className="meta-val font-bold text-slate-800 mt-0.5">
                      {selectedPurchase.supplier_invoice_no || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="meta-label text-[10px] font-bold text-slate-400 uppercase">Ordered By</div>
                    <div className="meta-val font-bold text-slate-800 mt-0.5">
                      {selectedPurchase.user?.name || 'Store Staff'}
                    </div>
                  </div>
                </div>

                {/* Goods Receiver Tracking Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Supplier Details</div>
                    <div className="font-bold text-slate-900 mt-0.5">{selectedPurchase.supplier_name}</div>
                    {selectedPurchase.supplier_phone && (
                      <div className="text-slate-500 text-[11px] mt-0.5">Tel: {selectedPurchase.supplier_phone}</div>
                    )}
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Goods Receipt & Receiver Audit</div>
                    {selectedPurchase.status === 'received' ? (
                      <div className="mt-0.5">
                        <div className="font-bold text-emerald-800 flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Received by: {selectedPurchase.received_by?.name || selectedPurchase.receivedBy?.name || 'Authorized Receiving Officer'}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Received at: {selectedPurchase.received_at ? new Date(selectedPurchase.received_at).toLocaleString() : 'N/A'}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-0.5 text-amber-700 font-semibold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Awaiting physical inspection & receipt</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedPurchase.notes && (
                  <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 font-medium">
                    <span className="font-bold">Remarks / Batch Info: </span> {selectedPurchase.notes}
                  </div>
                )}

                {/* Items List Table */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Item & Variant Specification</th>
                        <th className="py-3 px-4 text-center">Unit Cost (Tk)</th>
                        <th className="py-3 px-4 text-center">Qty {selectedPurchase.status === 'received' ? 'Received' : 'Ordered'}</th>
                        <th className="py-3 px-4 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedPurchase.items?.map((it) => (
                        <tr key={it.id}>
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {it.variant?.product?.name || 'Product'} - {it.variant?.variant_name}
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              SKU: {it.variant?.sku} {it.variant?.barcode && `| Barcode: ${it.variant?.barcode}`}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center font-medium text-slate-600">
                            ৳{parseFloat(it.unit_cost).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-slate-800">
                            {it.quantity} pcs
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900">
                            ৳{parseFloat(it.line_total).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-slate-200">
                      <tr>
                        <td colSpan="3" className="py-3.5 px-4 text-right font-bold text-slate-700 text-xs uppercase">
                          Total Procurement Value:
                        </td>
                        <td className="total-amount py-3.5 px-4 text-right font-black text-indigo-600 text-base">
                          ৳{parseFloat(selectedPurchase.total_amount).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Signatures Block for GRN (Hidden on screen, shown in print) */}
                <div className="signatures hidden print:flex justify-between items-center pt-8 border-t border-slate-200 mt-8">
                  <div className="sig-box text-center">
                    <div className="w-44 border-t border-slate-400 mx-auto pt-1 text-[11px] font-bold text-slate-600">
                      Ordered By: {selectedPurchase.user?.name || 'Purchasing Officer'}
                    </div>
                  </div>
                  <div className="sig-box text-center">
                    <div className="w-44 border-t border-slate-400 mx-auto pt-1 text-[11px] font-bold text-slate-600">
                      Received By: {selectedPurchase.received_by?.name || selectedPurchase.receivedBy?.name || 'Store Keeper'}
                    </div>
                  </div>
                  <div className="sig-box text-center">
                    <div className="w-44 border-t border-slate-400 mx-auto pt-1 text-[11px] font-bold text-slate-600">
                      Authorized Signatory (Accounts)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Bottom Action Bar (No-Print) */}
            <div className="no-print shrink-0 p-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-600">
                <span>Total Items: <strong className="text-slate-900">{selectedPurchase.items?.length || 0}</strong></span>
                <span className="mx-2">•</span>
                <span>Total Value: <strong className="text-indigo-600 font-mono font-bold">৳{parseFloat(selectedPurchase.total_amount || 0).toFixed(2)}</strong></span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {selectedPurchase.status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => handleReceivePurchase(selectedPurchase)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <PackageCheck className="w-3.5 h-3.5" />
                    <span>Confirm & Receive Goods</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedPurchase(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handlePrintGRN}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
