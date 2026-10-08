import React, { useState, useEffect } from 'react';
import api from '../api/client';
import Swal from 'sweetalert2';
import { 
  FileText, 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Receipt, 
  AlertTriangle, 
  Building, 
  User, 
  Calendar, 
  DollarSign, 
  BookOpen, 
  Layers 
} from 'lucide-react';
import CompleteOrderModal from '../components/CompleteOrderModal';

export default function OrderDetails({ orderId, onBack, onNavigateToInvoice }) {
  const [order, setOrder] = useState(null);
  const [stockCheck, setStockCheck] = useState({ is_available: true, items: [] });
  const [loading, setLoading] = useState(true);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completing, setCompleting] = useState(false);
  const currency = '৳';

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/orders/${orderId}`);
      if (res.data.success) {
        setOrder(res.data.order);
        setStockCheck(res.data.stock_check || { is_available: true, items: [] });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const handleCompleteConfirm = async (paymentData) => {
    setCompleting(true);
    try {
      const res = await api.post(`/orders/${orderId}/complete`, paymentData);
      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Order Completed!',
          text: res.data.message,
          confirmButtonText: 'View Invoice',
          showCancelButton: true,
          cancelButtonText: 'Stay Here',
          background: '#0f172a',
          color: '#f8fafc',
          confirmButtonColor: '#6366f1',
        }).then((result) => {
          if (result.isConfirmed && res.data.invoice) {
            onNavigateToInvoice?.(res.data.invoice.id);
          }
        });

        setShowCompleteModal(false);
        fetchOrderDetails();
      }
    } catch (err) {
      // Handled
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500">
        Loading sales order details...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-12 text-center text-slate-400">
        <p>Order not found.</p>
        <button onClick={onBack} className="mt-3 px-4 py-1.5 rounded-lg bg-slate-800 text-xs text-white">
          Go Back
        </button>
      </div>
    );
  }

  const isPending = order.status === 'pending';
  const isCompleted = order.status === 'completed';
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-100 font-mono">
                {order.order_number}
              </h1>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                  isCompleted
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : isPending
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}
              >
                {order.status.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-400">Placed on {order.order_date}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {isPending && (
            <button
              onClick={() => setShowCompleteModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              Complete Order & Issue Invoice
            </button>
          )}

          {isCompleted && order.invoice && (
            <button
              onClick={() => onNavigateToInvoice?.(order.invoice.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Receipt className="w-4 h-4" />
              View Printable Invoice
            </button>
          )}
        </div>
      </div>

      {/* Stock availability warning (if pending & insufficient) */}
      {isPending && !stockCheck.is_available && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-rose-300">Stock Shortage Detected</h4>
            <p className="text-slate-300">
              One or more line items do not have sufficient stock to complete this order:
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-rose-300 font-semibold">
              {stockCheck.items?.map((it, idx) => (
                <li key={idx}>{it.message}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Customer Info */}
        <div className="glass-panel rounded-2xl p-4 space-y-1.5">
          <div className="text-[11px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-indigo-400" /> Customer Information
          </div>
          <div className="text-sm font-bold text-slate-100">{order.customer?.name}</div>
          <div className="text-xs text-slate-400">{order.customer?.customer_code}</div>
          <div className="text-xs text-slate-400">{order.customer?.phone || 'No phone'}</div>
          {order.customer?.address && (
            <div className="text-xs text-slate-400">{order.customer?.address}</div>
          )}
        </div>

        {/* Order Details */}
        <div className="glass-panel rounded-2xl p-4 space-y-1.5">
          <div className="text-[11px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Order Details
          </div>
          <div className="text-xs text-slate-300">
            <strong>Payment Method:</strong> {order.payment_method?.toUpperCase()}
          </div>
          <div className="text-xs text-slate-300">
            <strong>Payment Status:</strong> {order.payment_status?.toUpperCase()}
          </div>
          <div className="text-xs text-slate-300">
            <strong>Handled By:</strong> {order.user?.name || 'Cashier'}
          </div>
          {order.completed_at && (
            <div className="text-xs text-emerald-400 font-medium">
              Completed on {new Date(order.completed_at).toLocaleString()}
            </div>
          )}
        </div>

        {/* Financial Summary */}
        <div className="glass-panel rounded-2xl p-4 space-y-1.5 bg-gradient-to-br from-indigo-950/40 to-slate-900">
          <div className="text-[11px] font-bold uppercase text-indigo-300 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-indigo-400" /> Financial Summary
          </div>
          <div className="text-xs flex justify-between text-slate-300">
            <span>Subtotal:</span>
            <span>{currency}{Number(order.subtotal).toFixed(2)}</span>
          </div>
          <div className="text-xs flex justify-between text-rose-300">
            <span>Discount:</span>
            <span>-{currency}{Number(order.discount_amount).toFixed(2)}</span>
          </div>
          <div className="text-xs flex justify-between text-slate-300">
            <span>Tax ({Number(order.tax_rate).toFixed(1)}%):</span>
            <span>+{currency}{Number(order.tax_amount).toFixed(2)}</span>
          </div>
          <div className="pt-1.5 border-t border-slate-700 flex justify-between font-black text-sm text-white">
            <span>Grand Total:</span>
            <span className="text-indigo-300">{currency}{Number(order.grand_total).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 font-bold text-xs text-slate-200">
          Order Line Items
        </div>
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px]">
            <tr>
              <th className="py-2.5 px-4">Item & Variant</th>
              <th className="py-2.5 px-4">SKU</th>
              <th className="py-2.5 px-4 text-center">Qty</th>
              <th className="py-2.5 px-4 text-right">Unit Price</th>
              <th className="py-2.5 px-4 text-right">Discount</th>
              <th className="py-2.5 px-4 text-right">Line Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {order.items?.map((item) => (
              <tr key={item.id}>
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-100">{item.product_name}</div>
                  {item.variant_name && (
                    <div className="text-[10px] text-indigo-400">{item.variant_name}</div>
                  )}
                </td>
                <td className="py-3 px-4 font-mono text-slate-400">{item.product_sku || '-'}</td>
                <td className="py-3 px-4 text-center font-bold">{item.quantity}</td>
                <td className="py-3 px-4 text-right">{currency}{Number(item.unit_price).toFixed(2)}</td>
                <td className="py-3 px-4 text-right text-rose-400">-{currency}{Number(item.discount).toFixed(2)}</td>
                <td className="py-3 px-4 text-right font-bold text-slate-100">
                  {currency}{Number(item.line_total).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Double-Entry Accounting Preview (if completed) */}
      {order.journal_entry && (
        <div className="glass-panel rounded-2xl p-4 space-y-3 border border-indigo-500/20">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-400" /> Automatic Double-Entry Journal Entry ({order.journal_entry.entry_number})
            </h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Balanced (Total: {currency}{Number(order.journal_entry.total_debit).toFixed(2)})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase">
                <tr>
                  <th className="py-2 px-3">Account Code & Name</th>
                  <th className="py-2 px-3">Narration</th>
                  <th className="py-2 px-3 text-right">Debit ({currency})</th>
                  <th className="py-2 px-3 text-right">Credit ({currency})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono text-xs">
                {order.journal_entry.items?.map((ji) => (
                  <tr key={ji.id}>
                    <td className="py-2 px-3 font-semibold text-slate-200 font-sans">
                      <span className="font-mono text-indigo-400 mr-2">{ji.account?.account_code}</span>
                      {ji.account?.account_name}
                    </td>
                    <td className="py-2 px-3 text-slate-400 font-sans text-[11px]">{ji.narration}</td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-400">
                      {Number(ji.debit) > 0 ? Number(ji.debit).toFixed(2) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-indigo-300">
                      {Number(ji.credit) > 0 ? Number(ji.credit).toFixed(2) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Complete Order Modal */}
      {showCompleteModal && (
        <CompleteOrderModal
          order={order}
          currency={currency}
          loading={completing}
          onClose={() => setShowCompleteModal(false)}
          onConfirm={handleCompleteConfirm}
        />
      )}
    </div>
  );
}
