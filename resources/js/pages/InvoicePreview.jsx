import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { 
  Printer, 
  ArrowLeft, 
  Receipt, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  FileText,
  Search, 
  RefreshCw, 
  Eye,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  RotateCcw,
  ShoppingBag
} from 'lucide-react';
import BarcodeSvg from '../components/BarcodeSvg';
import { printThermalReceipt } from '../utils/printReceipt';
import { useAuth } from '../context/AuthContext';

export default function InvoicePreview({ invoiceId: propInvoiceId, onBack, onSelectInvoice }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const isAdmin = role === 'Admin' || user?.roles?.[0]?.name === 'Admin';
  const effectiveInvoiceId = propInvoiceId || id;

  // Single invoice view state
  const [invoice, setInvoice] = useState(null);
  const [company, setCompany] = useState({});

  // Invoices list & filtering state
  const [invoicesList, setInvoicesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [datePreset, setDatePreset] = useState('all'); // 'all' | 'today' | 'yesterday' | '7days' | 'month' | 'custom'
  const [perPage, setPerPage] = useState(10);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    from: 0,
    to: 0,
  });

  const currency = '৳';

  const handleBack = onBack || (() => navigate('/invoices'));
  const handleSelectInvoice = onSelectInvoice || ((invId) => navigate(`/invoices/${invId}`));

  // Fetch a single invoice
  const fetchInvoice = async (invId) => {
    setLoading(true);
    try {
      const res = await api.get(`/invoices/${invId}`);
      if (res.data.success) {
        setInvoice(res.data.invoice);
        setCompany(res.data.company || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch paginated invoices with filters
  const fetchInvoicesList = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        per_page: perPage,
      });

      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (paymentStatusFilter) params.append('payment_status', paymentStatusFilter);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const res = await api.get(`/invoices?${params.toString()}`);
      if (res.data.success) {
        const paginatedData = res.data.invoices;
        setInvoicesList(paginatedData.data || []);
        setPagination({
          current_page: paginatedData.current_page || 1,
          last_page: paginatedData.last_page || 1,
          total: paginatedData.total || 0,
          from: paginatedData.from || 0,
          to: paginatedData.to || 0,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (effectiveInvoiceId) {
      fetchInvoice(effectiveInvoiceId);
    } else {
      fetchInvoicesList(1);
    }
  }, [effectiveInvoiceId, paymentStatusFilter, startDate, endDate, perPage]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    fetchInvoicesList(1);
  };

  // Date Presets Handler
  const handleDatePreset = (preset) => {
    setDatePreset(preset);
    const today = new Date();
    const formatDate = (d) => d.toISOString().split('T')[0];

    if (preset === 'today') {
      const dateStr = formatDate(today);
      setStartDate(dateStr);
      setEndDate(dateStr);
    } else if (preset === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = formatDate(yesterday);
      setStartDate(dateStr);
      setEndDate(dateStr);
    } else if (preset === '7days') {
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 6);
      setStartDate(formatDate(lastWeek));
      setEndDate(formatDate(today));
    } else if (preset === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(formatDate(firstDay));
      setEndDate(formatDate(today));
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setPaymentStatusFilter('');
    setStartDate('');
    setEndDate('');
    setDatePreset('all');
    setPerPage(10);
  };

  const handlePrint = () => {
    printThermalReceipt('pos-thermal-receipt');
  };

  // If no single invoice is selected, show list of invoices with filters & pagination
  if (!effectiveInvoiceId) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
              <Receipt className="w-4 h-4" />
              <span>POS Invoices & Sales Receipts</span>
            </div>
            <h2 className="text-xl font-black text-slate-900">Invoices & Receipts Registry</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Browse, filter by date, and reprint 80mm thermal POS receipts generated from sales orders.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate('/pos')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>New POS Sale</span>
            </button>
          </div>
        </div>

        {/* Filter Control Box */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          {/* Top Row: Search and Status Tabs */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search invoice #, order #, customer, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    fetchInvoicesList(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Payment Status Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 self-start lg:self-auto overflow-x-auto max-w-full">
              {[
                { id: '', label: 'All Payments' },
                { id: 'paid', label: 'Paid' },
                { id: 'partially_paid', label: 'Partial' },
                { id: 'unpaid', label: 'Unpaid' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setPaymentStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    paymentStatusFilter === tab.id
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Row: Date Range Filters & Quick Presets */}
          <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Quick Date Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Date:</span>
              {[
                { id: 'all', label: 'All Time' },
                { id: 'today', label: 'Today' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: '7days', label: 'Last 7 Days' },
                { id: 'month', label: 'This Month' },
              ].map((btn) => (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => handleDatePreset(btn.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    datePreset === btn.id && !startDate && btn.id === 'all'
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : datePreset === btn.id && startDate
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Custom Date Pickers & Per-Page Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setDatePreset('custom');
                    }}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 focus:outline-none focus:border-indigo-600"
                    title="From Date"
                  />
                </div>
                <span className="text-xs text-slate-400 font-bold">to</span>
                <div className="relative">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setDatePreset('custom');
                    }}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 focus:outline-none focus:border-indigo-600"
                    title="To Date"
                  />
                </div>
              </div>

              {/* Per Page Selector */}
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 font-bold focus:outline-none focus:border-indigo-600"
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>

              {/* Reset Filters */}
              {(searchQuery || paymentStatusFilter || startDate || endDate || datePreset !== 'all') && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 text-xs font-bold transition-colors"
                  title="Reset all filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-6">Invoice #</th>
                  <th className="py-3.5 px-6">Order Ref</th>
                  <th className="py-3.5 px-6">Customer</th>
                  <th className="py-3.5 px-6">Billed By</th>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6 text-right">Grand Total</th>
                  <th className="py-3.5 px-6 text-right">Paid</th>
                  <th className="py-3.5 px-6 text-center">Payment</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="py-16 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                      Loading invoices registry...
                    </td>
                  </tr>
                ) : invoicesList.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-16 text-center text-slate-400 space-y-2">
                      <Receipt className="w-10 h-10 mx-auto text-slate-300" />
                      <p className="font-bold text-slate-600">No invoices matched your criteria.</p>
                      <p className="text-xs text-slate-400">Try clearing filters or completing sales orders from the POS Terminal.</p>
                      {(searchQuery || startDate || paymentStatusFilter) && (
                        <button
                          onClick={handleResetFilters}
                          className="mt-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                        >
                          Clear All Filters
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  invoicesList.map((inv) => {
                    const due = Math.max(0, parseFloat(inv.grand_total || 0) - parseFloat(inv.paid_amount || 0));
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6 font-bold font-mono text-indigo-600">
                          <button
                            onClick={() => handleSelectInvoice(inv.id)}
                            className="hover:underline font-bold"
                          >
                            {inv.invoice_number}
                          </button>
                        </td>
                        <td className="py-4 px-6 font-mono text-slate-600">
                          {inv.order ? (
                            <button
                              onClick={() => navigate(`/orders/${inv.order.id}`)}
                              className="text-slate-700 hover:text-indigo-600 hover:underline"
                            >
                              {inv.order.order_number}
                            </button>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900">{inv.customer_name || inv.customer?.name || 'Walk-in Customer'}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{inv.customer_phone || inv.customer?.phone || 'No phone'}</div>
                        </td>
                        <td className="py-4 px-6 text-slate-600">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700">
                            {inv.user?.name || 'Cashier'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-600 font-medium">
                          {String(inv.invoice_date || '').split('T')[0]}
                        </td>
                        <td className="py-4 px-6 text-right font-black text-slate-900">
                          {currency}{Number(inv.grand_total).toFixed(2)}
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-emerald-600">
                          {currency}{Number(inv.paid_amount).toFixed(2)}
                          {due > 0 && (
                            <div className="text-[10px] font-normal text-amber-600">Due: {currency}{due.toFixed(2)}</div>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              inv.payment_status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : inv.payment_status === 'partially_paid'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span className="capitalize">{inv.payment_status || 'Paid'}</span>
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            type="button"
                            onClick={() => handleSelectInvoice(inv.id)}
                            className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all font-bold text-[11px] inline-flex items-center gap-1.5 shadow-xs"
                          >
                            <Printer className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Preview & Print</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Full Pagination Controls */}
          {pagination.total > 0 && (
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                Showing <span className="font-bold text-slate-900">{pagination.from || 1}</span> to{' '}
                <span className="font-bold text-slate-900">{pagination.to || pagination.total}</span> of{' '}
                <span className="font-bold text-slate-900">{pagination.total}</span> total invoices
              </div>

              <div className="flex items-center gap-1">
                {/* Previous Page */}
                <button
                  disabled={pagination.current_page <= 1 || loading}
                  onClick={() => fetchInvoicesList(pagination.current_page - 1)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>

                {/* Page Numbers */}
                {Array.from({ length: pagination.last_page }, (_, i) => i + 1)
                  .filter((p) => {
                    const curr = pagination.current_page;
                    return p === 1 || p === pagination.last_page || (p >= curr - 2 && p <= curr + 2);
                  })
                  .map((p, idx, arr) => {
                    const prevP = arr[idx - 1];
                    const showEllipsis = prevP && p - prevP > 1;

                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && <span className="px-1 text-slate-400 text-xs">...</span>}
                        <button
                          onClick={() => fetchInvoicesList(p)}
                          className={`w-8 h-8 rounded-xl text-xs font-bold transition-colors ${
                            pagination.current_page === p
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}

                {/* Next Page */}
                <button
                  disabled={pagination.current_page >= pagination.last_page || loading}
                  onClick={() => fetchInvoicesList(pagination.current_page + 1)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Single Invoice Printable Preview
  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
        Generating printable tax invoice preview...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-16 text-center text-slate-500">
        <p>Invoice not found.</p>
        <button onClick={handleBack} className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Top action controls (Hidden during print) */}
      <div className="no-print flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Invoices Registry
        </button>

        <div className="flex items-center gap-2">
          {invoice.order?.id && (
            <button
              onClick={() => navigate(`/orders/${invoice.order.id}`)}
              className="flex items-center gap-1.5 text-xs text-slate-700 font-bold px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>Order #{invoice.order?.order_number}</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print POS Receipt</span>
          </button>
        </div>
      </div>

      {/* 80mm POS Thermal Receipt Display */}
      <div className="flex justify-center">
        <div
          id="pos-thermal-receipt"
          className="pos-receipt-print-area bg-white text-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xl w-full max-w-[320px] font-mono text-[11px] leading-tight space-y-2 print:border-none print:shadow-none print:p-0 print:m-0 print:w-[72mm] print:text-[10px]"
        >
          {/* Store Header */}
          <div className="text-center space-y-0.5 pb-1">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center mx-auto mb-1 no-print">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <h2 className="font-black text-xs uppercase tracking-wider text-slate-900 font-sans">
              {company.name || 'MINI POS & RETAIL HUB'}
            </h2>
            <p className="text-[9px] text-slate-600 font-sans">{company.address || 'Dhaka, Bangladesh'}</p>
            <p className="text-[9px] text-slate-600">Tel: {company.phone || '+880 1700-000000'}</p>
            {company.tax_bin && (
              <p className="text-[9px] text-slate-600 font-bold">VAT BIN: {company.tax_bin}</p>
            )}
          </div>

          <div className="border-t border-dashed border-slate-400 my-1" />

          {/* Receipt Metadata */}
          <div className="space-y-0.5 text-[10px] leading-tight">
            <div className="flex justify-between">
              <span className="text-slate-500">Invoice #:</span>
              <span className="font-bold text-slate-900">{invoice.invoice_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Order Ref:</span>
              <span className="font-bold text-slate-800">{invoice.order?.order_number || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date:</span>
              <span className="text-slate-800">{String(invoice.invoice_date || '').split('T')[0]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cashier:</span>
              <span className="font-bold text-slate-800">{invoice.user?.name || 'Cashier Counter'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Customer:</span>
              <span className="font-bold text-slate-900 truncate max-w-[180px] text-right">{invoice.customer?.name || invoice.customer_name || 'Walk-in Customer'}</span>
            </div>
            {(invoice.customer?.phone || invoice.customer_phone) && (
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="text-slate-700">{invoice.customer?.phone || invoice.customer_phone}</span>
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-slate-400 my-1" />

          {/* Line Items Table */}
          <div>
            <div className="flex justify-between font-bold text-[9px] pb-0.5 border-b border-dashed border-slate-300 text-slate-500 uppercase">
              <span>ITEM & SPECIFICATION</span>
              <span>TOTAL ({currency})</span>
            </div>

            <div className="divide-y divide-dotted divide-slate-200 py-0.5 space-y-1">
              {invoice.items?.map((item, idx) => {
                const name = item.product_name || item.item_name || item.product?.name || 'Product';
                const variant = item.variant_name || item.variant?.variant_name || '';
                const sku = item.sku || item.item_sku || item.product_sku || '';
                const qty = item.quantity || 1;
                const price = parseFloat(item.unit_price || 0);
                const total = parseFloat(item.line_total || (qty * price));

                return (
                  <div key={idx} className="pt-1 first:pt-0 space-y-0.5 text-[10px]">
                    <div className="flex justify-between items-start gap-1.5">
                      <div className="font-bold text-slate-900 leading-tight">
                        {name} {variant && !name.includes(variant) && <span className="font-semibold text-indigo-700">({variant})</span>}
                      </div>
                      <div className="font-black text-slate-900 text-right whitespace-nowrap">
                        {currency}{total.toFixed(2)}
                      </div>
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-500">
                      <span className="font-mono text-slate-400">{sku ? `SKU: ${sku}` : ''}</span>
                      <span className="font-medium text-slate-700">{qty} × {currency}{price.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-dashed border-slate-400 my-1" />

          {/* Totals Calculation */}
          <div className="space-y-0.5 text-[10px] leading-tight">
            <div className="flex justify-between text-slate-600">
              <span>SUBTOTAL:</span>
              <span className="font-bold text-slate-900">{currency}{Number(invoice.subtotal).toFixed(2)}</span>
            </div>

            {Number(invoice.discount_amount) > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>DISCOUNT:</span>
                <span className="font-bold">-{currency}{Number(invoice.discount_amount).toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-600">
              <span>{invoice.tax_rate_name || 'VAT'} ({invoice.tax_rate_percent}%):</span>
              <span className="font-bold text-slate-900">+{currency}{Number(invoice.tax_amount).toFixed(2)}</span>
            </div>

            <div className="border-t border-dashed border-slate-400 my-1" />

            <div className="flex justify-between items-center text-xs font-black py-0.5 text-slate-900">
              <span>TOTAL:</span>
              <span className="font-mono text-sm">{currency}{Number(invoice.grand_total).toFixed(2)}</span>
            </div>

            <div className="border-t border-dashed border-slate-400 my-1" />

            <div className="flex justify-between text-slate-600">
              <span>PAID ({invoice.payment_method?.toUpperCase()}):</span>
              <span className="font-bold text-emerald-700">{currency}{Number(invoice.paid_amount).toFixed(2)}</span>
            </div>

            {Number(invoice.due_amount) > 0 ? (
              <div className="flex justify-between text-amber-600 font-bold">
                <span>DUE:</span>
                <span>{currency}{Number(invoice.due_amount).toFixed(2)}</span>
              </div>
            ) : (
              <div className="flex justify-between text-slate-500">
                <span>CHANGE:</span>
                <span>{currency}0.00</span>
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-slate-400 my-1" />

          {/* Real Code128 Linear Barcode */}
          <div className="py-1 flex justify-center">
            <BarcodeSvg value={invoice.invoice_number} height={26} showText={true} />
          </div>

          {/* Footer Notes */}
          <div className="text-center text-[9px] text-slate-500 pt-0.5 space-y-0.5 font-sans leading-tight">
            <p className="font-bold text-slate-800">*** Thank You! Please Come Again ***</p>
            <p>Exchange within 7 days with this POS receipt.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
