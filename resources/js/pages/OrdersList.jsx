import React, { useState, useEffect } from 'react';
import api from '../api/client';
import Swal from 'sweetalert2';
import { 
  FileText, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Receipt, 
  Eye, 
  ArrowUpDown, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import CompleteOrderModal from '../components/CompleteOrderModal';

export default function OrdersList({ onNavigateToOrder, onNavigateToInvoice }) {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currency, setCurrency] = useState('৳');

  // Complete Order Modal state
  const [activeOrderToComplete, setActiveOrderToComplete] = useState(null);
  const [completing, setCompleting] = useState(false);

  const fetchOrders = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        status: statusFilter,
        search: searchQuery,
      });
      const res = await api.get(`/orders?${params.toString()}`);
      if (res.data.success) {
        setOrders(res.data.orders.data || []);
        setPagination({
          current_page: res.data.orders.current_page,
          last_page: res.data.orders.last_page,
          total: res.data.orders.total,
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
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders(1);
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
          background: '#0f172a',
          color: '#f8fafc',
          confirmButtonColor: '#6366f1',
        }).then((result) => {
          if (result.isConfirmed && res.data.invoice) {
            onNavigateToInvoice?.(res.data.invoice.id);
          }
        });

        setActiveOrderToComplete(null);
        fetchOrders(pagination.current_page || 1);
      }
    } catch (err) {
      // Axios interceptor will show the error details (e.g. insufficient stock error)
    } finally {
      setCompleting(false);
    }
  };

  // Cancel Order
  const handleCancelOrder = (order) => {
    Swal.fire({
      title: 'Cancel Order?',
      text: `Are you sure you want to cancel order #${order.order_number}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Cancel Order',
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#334155',
      background: '#0f172a',
      color: '#f8fafc',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await api.post(`/orders/${order.id}/cancel`, { reason: 'Cancelled by operator' });
          if (res.data.success) {
            Swal.fire({
              icon: 'success',
              title: 'Cancelled',
              text: res.data.message,
              background: '#0f172a',
              color: '#f8fafc',
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
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-400" />
            Sales Orders Management
          </h1>
          <p className="text-xs text-slate-400">
            Pending to Completed workflow with live stock verification & automatic accounting entries.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: '', label: 'All Statuses' },
            { id: 'pending', label: 'Pending Orders', icon: Clock, color: 'text-amber-400' },
            { id: 'completed', label: 'Completed', icon: CheckCircle, color: 'text-emerald-400' },
            { id: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'text-rose-400' },
          ].map((status) => {
            const isSelected = statusFilter === status.id;
            return (
              <button
                key={status.id}
                onClick={() => setStatusFilter(status.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                {status.icon && <status.icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : status.color}`} />}
                {status.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search order #, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Orders Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Order Number</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Items Summary</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4 text-right">Grand Total</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    Loading sales orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    No sales orders found matching your criteria.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const isPending = order.status === 'pending';
                  const isCompleted = order.status === 'completed';
                  const isCancelled = order.status === 'cancelled';

                  return (
                    <tr key={order.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Order Number */}
                      <td className="py-3 px-4 font-mono font-bold text-indigo-300">
                        {order.order_number}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-slate-400">
                        {order.order_date}
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-100">{order.customer?.name}</div>
                        <div className="text-[10px] text-slate-400">{order.customer?.customer_code}</div>
                      </td>

                      {/* Items Summary */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-slate-200 truncate">
                          {order.items?.map(i => `${i.quantity}x ${i.product_name}`).join(', ')}
                        </div>
                        <div className="text-[10px] text-slate-400">{order.items?.length || 0} line items</div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isCompleted
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : isPending
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {isCompleted && <CheckCircle className="w-3 h-3" />}
                          {isPending && <Clock className="w-3 h-3" />}
                          {isCancelled && <XCircle className="w-3 h-3" />}
                          {order.status.toUpperCase()}
                        </span>
                      </td>

                      {/* Payment Status */}
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          order.payment_status === 'paid' ? 'bg-emerald-950/60 text-emerald-300' :
                          order.payment_status === 'partially_paid' ? 'bg-amber-950/60 text-amber-300' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {order.payment_status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="py-3 px-4 text-right font-bold text-slate-100">
                        {currency}{Number(order.grand_total).toFixed(2)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View Details */}
                          <button
                            onClick={() => onNavigateToOrder?.(order.id)}
                            title="View Order Details"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Complete Order Button (if Pending) */}
                          {isPending && (
                            <button
                              onClick={() => setActiveOrderToComplete(order)}
                              title="Complete Order (Deduct Stock & Post Double Entry)"
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30 transition-all"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Complete
                            </button>
                          )}

                          {/* View Invoice Button (if Completed) */}
                          {isCompleted && order.invoice && (
                            <button
                              onClick={() => onNavigateToInvoice?.(order.invoice.id)}
                              title="View Invoice"
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30 transition-all"
                            >
                              <Receipt className="w-3 h-3" />
                              Invoice
                            </button>
                          )}

                          {/* Cancel button (if Pending) */}
                          {isPending && (
                            <button
                              onClick={() => handleCancelOrder(order)}
                              title="Cancel Order"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
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

        {/* Pagination Bar */}
        {pagination.last_page > 1 && (
          <div className="p-3 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing page {pagination.current_page} of {pagination.last_page} ({pagination.total} orders)
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={pagination.current_page === 1}
                onClick={() => fetchOrders(pagination.current_page - 1)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={pagination.current_page === pagination.last_page}
                onClick={() => fetchOrders(pagination.current_page + 1)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50"
              >
                Next
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
