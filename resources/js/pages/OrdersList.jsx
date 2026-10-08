import React, { useState, useEffect } from 'react';
import api from '../api/client';
import Swal from 'sweetalert2';
import { 
  FileText, 
  Search, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Receipt, 
  Eye, 
  Calendar,
  AlertCircle,
  RefreshCw, 
  ShoppingBag, 
  UserCheck,
  ChevronLeft,
  ChevronRight,
  X,
  RotateCcw,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CompleteOrderModal from '../components/CompleteOrderModal';

export default function OrdersList({ onNavigateToOrder, onNavigateToInvoice }) {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const isAdmin = role === 'Admin' || user?.roles?.[0]?.name === 'Admin';

  const handleNavigateOrder = (orderId) => {
    if (onNavigateToOrder) {
      onNavigateToOrder(orderId);
    } else {
      navigate(`/orders/${orderId}`);
    }
  };

  const handleNavigateInvoice = (invId) => {
    if (onNavigateToInvoice) {
      onNavigateToInvoice(invId);
    } else {
      navigate(`/invoices/${invId}`);
    }
  };

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
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
  const [currency, setCurrency] = useState('৳');

  // Complete Order Modal state
  const [activeOrderToComplete, setActiveOrderToComplete] = useState(null);
  const [completing, setCompleting] = useState(false);

  const fetchOrders = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        per_page: perPage,
      });

      if (statusFilter) params.append('status', statusFilter);
      if (paymentStatusFilter) params.append('payment_status', paymentStatusFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const res = await api.get(`/orders?${params.toString()}`);
      if (res.data.success) {
        const paginatedData = res.data.orders;
        setOrders(paginatedData.data || []);
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
    fetchOrders(1);
  }, [statusFilter, paymentStatusFilter, startDate, endDate, perPage]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    fetchOrders(1);
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
    setStatusFilter('');
    setPaymentStatusFilter('');
    setStartDate('');
    setEndDate('');
    setDatePreset('all');
    setPerPage(10);
  };

  // Trigger Complete Order Workflow
  const handleCompleteOrderConfirm = async (paymentData) => {
    if (!activeOrderToComplete) return;

    setCompleting(true);
    try {
      const res = await api.post(`/orders/${activeOrderToComplete.id}/complete`, paymentData);
      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Order Completed!',
          text: res.data.message,
          confirmButtonText: 'View Invoice',
          showCancelButton: true,
          cancelButtonText: 'Close',
          confirmButtonColor: '#4f46e5',
        }).then((result) => {
          if (result.isConfirmed && res.data.invoice) {
            handleNavigateInvoice(res.data.invoice.id);
          }
        });

        setActiveOrderToComplete(null);
        fetchOrders(pagination.current_page || 1);
      }
    } catch (err) {
      // Axios interceptor will show error details
    } finally {
      setCompleting(false);
    }
  };

  // Cancel Order
  const handleCancelOrder = (order) => {
    Swal.fire({
      title: 'Cancel Order?',
      text: `Are you sure you want to cancel Order #${order.order_number}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, cancel it!',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await api.post(`/orders/${order.id}/cancel`);
          if (res.data.success) {
            Swal.fire({
              icon: 'success',
              title: 'Cancelled',
              text: res.data.message,
              timer: 1500,
              showConfirmButton: false,
            });
            fetchOrders(pagination.current_page || 1);
          }
        } catch (err) {
          // Handled
        }
      }
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Receipt className="w-4 h-4" />
            <span>{isAdmin ? 'Company Sales Orders Registry' : 'My Personal Sales Orders'}</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">
            {isAdmin ? 'All Sales Orders' : `Sales Orders for ${user?.name || 'Current User'}`}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAdmin ? (
              <span>Administrator View: Displaying all sales orders processed across all staff & terminals.</span>
            ) : (
              <span>Staff View: Displaying only the sales orders created by you (<span className="font-bold text-slate-700">{user?.name}</span>).</span>
            )}
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
              placeholder="Search order #, customer name, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  fetchOrders(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Order Lifecycle Status Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 self-start lg:self-auto overflow-x-auto max-w-full">
            {[
              { id: '', label: 'All Orders' },
              { id: 'pending', label: 'Pending' },
              { id: 'completed', label: 'Completed' },
              { id: 'cancelled', label: 'Cancelled' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  statusFilter === tab.id
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Row: Date Range Filters, Quick Presets & Page Controls */}
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
            {(searchQuery || statusFilter || paymentStatusFilter || startDate || endDate || datePreset !== 'all') && (
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

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Order #</th>
                <th className="py-3.5 px-6">Customer</th>
                {isAdmin && <th className="py-3.5 px-6">Cashier / Staff</th>}
                <th className="py-3.5 px-6">Date</th>
                <th className="py-3.5 px-6">Items</th>
                <th className="py-3.5 px-6 text-right">Grand Total</th>
                <th className="py-3.5 px-6 text-center">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? '8' : '7'} className="py-16 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading sales orders registry...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? '8' : '7'} className="py-16 text-center text-slate-400 space-y-2">
                    <Receipt className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="font-bold text-slate-600">No sales orders found matching criteria.</p>
                    <p className="text-xs text-slate-400">Try clearing date or status filters.</p>
                    {(searchQuery || statusFilter || startDate || endDate) && (
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
                orders.map((order) => {
                  const isPending = order.status === 'pending';
                  const isCompleted = order.status === 'completed';
                  const isCancelled = order.status === 'cancelled';

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-6 font-bold font-mono text-indigo-600">
                        <button
                          type="button"
                          onClick={() => handleNavigateOrder(order.id)}
                          className="hover:underline text-left cursor-pointer font-bold font-mono text-indigo-600"
                        >
                          {order.order_number}
                        </button>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900">{order.customer?.name || 'Walk-in Customer'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{order.customer?.phone || 'No phone'}</div>
                      </td>
                      {isAdmin && (
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                            <UserCheck className="w-3 h-3 text-indigo-600" />
                            <span>{order.user?.name || 'Staff'}</span>
                          </span>
                        </td>
                      )}
                      <td className="py-4 px-6 text-slate-600 font-medium">
                        {String(order.order_date || '').split('T')[0]}
                      </td>
                      <td className="py-4 px-6 text-slate-700 font-medium">
                        {order.items?.length || 0} line item(s)
                      </td>
                      <td className="py-4 px-6 text-right font-black text-slate-900">
                        {currency}{Number(order.grand_total).toFixed(2)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-full text-[10px] ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : isPending
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {isCompleted && <CheckCircle className="w-3 h-3" />}
                          {isPending && <Clock className="w-3 h-3" />}
                          {isCancelled && <XCircle className="w-3 h-3" />}
                          <span className="capitalize">{order.status}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleNavigateOrder(order.id)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors inline-flex items-center gap-1 font-bold text-[11px] cursor-pointer"
                            title="View order audit details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>

                          {isPending && (
                            <button
                              type="button"
                              onClick={() => setActiveOrderToComplete(order)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle className="w-3 h-3" />
                              <span>Complete</span>
                            </button>
                          )}

                          {isCompleted && (
                            <button
                              type="button"
                              onClick={() => handleNavigateInvoice(order.invoice?.id || order.id)}
                              className="p-1.5 rounded-lg border border-indigo-200 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                              title="Print / View Invoice"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Invoice</span>
                            </button>
                          )}

                          {isPending && (
                            <button
                              type="button"
                              onClick={() => handleCancelOrder(order)}
                              className="p-1.5 rounded-lg border border-slate-200 text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors text-[11px] font-bold"
                              title="Cancel Order"
                            >
                              Cancel
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

        {/* Full Pagination Controls */}
        {pagination.total > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Showing <span className="font-bold text-slate-900">{pagination.from || 1}</span> to{' '}
              <span className="font-bold text-slate-900">{pagination.to || pagination.total}</span> of{' '}
              <span className="font-bold text-slate-900">{pagination.total}</span> total orders
            </div>

            <div className="flex items-center gap-1">
              {/* Previous Page */}
              <button
                disabled={pagination.current_page <= 1 || loading}
                onClick={() => fetchOrders(pagination.current_page - 1)}
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
                        onClick={() => fetchOrders(p)}
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
                onClick={() => fetchOrders(pagination.current_page + 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Complete Order Modal */}
      {activeOrderToComplete && (
        <CompleteOrderModal
          order={activeOrderToComplete}
          currency={currency}
          loading={completing}
          onClose={() => setActiveOrderToComplete(null)}
          onConfirm={handleCompleteOrderConfirm}
        />
      )}
    </div>
  );
}
