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
  UserCheck
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
      // Axios interceptor will show the error details
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
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

        {/* Quick status tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200">
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
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === tab.id
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search order # or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-xs"
          />
        </form>

        <button
          type="button"
          onClick={() => fetchOrders(1)}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 shadow-xs transition-colors self-end sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
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
                  <td colSpan={isAdmin ? '8' : '7'} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? '8' : '7'} className="py-12 text-center text-slate-400">
                    No sales orders found matching criteria.
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
                        <div className="font-bold text-slate-900">{order.customer?.name || 'Walk-in'}</div>
                        <div className="text-[10px] text-slate-400">{order.customer?.phone || 'No phone'}</div>
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
                        {order.order_date}
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

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {pagination.current_page} of {pagination.last_page} ({pagination.total} total orders)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.current_page <= 1}
                onClick={() => fetchOrders(pagination.current_page - 1)}
                className="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={pagination.current_page >= pagination.last_page}
                onClick={() => fetchOrders(pagination.current_page + 1)}
                className="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
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
