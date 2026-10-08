import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Layers,
  RefreshCw
} from 'lucide-react';
import CompleteOrderModal from '../components/CompleteOrderModal';

export default function OrderDetails({ orderId: propOrderId, onBack, onNavigateToInvoice }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const effectiveOrderId = propOrderId || id;

  const [order, setOrder] = useState(null);
  const [stockCheck, setStockCheck] = useState({ is_available: true, items: [] });
  const [loading, setLoading] = useState(true);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completing, setCompleting] = useState(false);
  const currency = '৳';

  const handleBack = onBack || (() => navigate('/orders'));
  const handleNavigateInvoice = onNavigateToInvoice || ((invId) => navigate(`/invoices/${invId}`));

  const fetchOrderDetails = async () => {
    if (!effectiveOrderId) return;
    setLoading(true);
    try {
      const res = await api.get(`/orders/${effectiveOrderId}`);
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
    if (effectiveOrderId) {
      fetchOrderDetails();
    }
  }, [effectiveOrderId]);

  const handleCompleteConfirm = async (paymentData) => {
    setCompleting(true);
    try {
      const res = await api.post(`/orders/${effectiveOrderId}/complete`, paymentData);
      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Order Completed!',
          text: res.data.message,
          confirmButtonText: 'View Invoice',
          showCancelButton: true,
          cancelButtonText: 'Stay Here',
          confirmButtonColor: '#4f46e5',
        }).then((result) => {
          if (result.isConfirmed && res.data.invoice) {
            handleNavigateInvoice(res.data.invoice.id);
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
      <div className="p-16 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
        Loading sales order details...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-16 text-center text-slate-500">
        <p>Order not found.</p>
        <button onClick={handleBack} className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 text-xs font-bold text-white">
          Go Back
        </button>
      </div>
    );
  }

  const isPending = order.status === 'pending';
  const isCompleted = order.status === 'completed';
  const isCancelled = order.status === 'cancelled';

  const subtotal = parseFloat(order.subtotal || 0);
  const discountAmount = parseFloat(order.discount_amount || 0);
  const discountRate = parseFloat(order.discount_rate || 0);
  const taxAmount = parseFloat(order.tax_amount || 0);
  const taxRateName = order.taxRate?.name || order.tax_rate_name || 'VAT';
  const taxableBase = Math.max(0, subtotal - discountAmount);

  // Derive tax percentage accurately
  let taxRatePercent = 0;
  if (Number(order.tax_rate) > 0) {
    taxRatePercent = Number(order.tax_rate);
  } else if (order.taxRate?.rate && Number(order.taxRate.rate) > 0) {
    taxRatePercent = Number(order.taxRate.rate);
  } else if (taxAmount > 0 && taxableBase > 0) {
    taxRatePercent = (taxAmount / taxableBase) * 100;
  }

  const taxPercentFormatted = taxRatePercent > 0
    ? `${taxRatePercent % 1 === 0 ? taxRatePercent.toFixed(0) : taxRatePercent.toFixed(1)}%`
    : (taxAmount > 0 ? '5%' : '0%');

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Top Bar with Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </button>

        <div className="flex items-center gap-2">
          {isCompleted && order.invoice && (
            <button
              onClick={() => handleNavigateInvoice(order.invoice.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
            >
              <FileText className="w-4 h-4" /> View Invoice #{order.invoice.invoice_number}
            </button>
          )}

          {isPending && (
            <button
              disabled={!stockCheck.is_available}
              onClick={() => setShowCompleteModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
            >
              <CheckCircle className="w-4 h-4" /> Complete & Deduct Stock
            </button>
          )}
        </div>
      </div>

      {/* Main Order Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        {/* Order Header info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-black font-mono text-slate-900">
                Order #{order.order_number}
              </h2>
              <span
                className={`inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-full text-xs ${
                  isCompleted
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : isPending
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                }`}
              >
                {isCompleted && <CheckCircle className="w-3.5 h-3.5" />}
                {isPending && <Clock className="w-3.5 h-3.5" />}
                {isCancelled && <XCircle className="w-3.5 h-3.5" />}
                <span className="capitalize">{order.status}</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Created on {new Date(order.created_at).toLocaleString()} • Logged by {order.user?.name || 'System'}
            </p>
          </div>

          <div className="sm:text-right">
            <span className="text-xs text-slate-400">Grand Total</span>
            <div className="text-2xl font-black text-indigo-600">
              {currency}{Number(order.grand_total).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Stock Availability Pre-check Alert (For Pending Orders) */}
        {isPending && (
          <div
            className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
              stockCheck.is_available
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {stockCheck.is_available ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold">
                {stockCheck.is_available
                  ? 'All items in stock and ready for completion.'
                  : 'Stock Shortage Detected! Order cannot be completed.'}
              </div>
              <p className="text-[11px] mt-0.5 opacity-80">
                {stockCheck.is_available
                  ? 'Completing this order will deduct stock from product variants and record double-entry accounting journal entries.'
                  : 'One or more items in this order do not have enough stock available in inventory.'}
              </p>
            </div>
          </div>
        )}

        {/* Customer & Order Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5 font-bold uppercase text-[10px]">Customer Details</span>
            <div className="font-bold text-slate-900">{order.customer?.name}</div>
            <div className="text-slate-500">{order.customer?.phone || 'No phone'}</div>
            <div className="text-slate-400 text-[11px]">{order.customer?.email || 'No email'}</div>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5 font-bold uppercase text-[10px]">Billing Info</span>
            <div className="font-medium text-slate-700">Tax Reg: {order.customer?.tax_number || 'N/A'}</div>
            <div className="text-slate-500 line-clamp-2">{order.customer?.address || 'Standard retail counter'}</div>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5 font-bold uppercase text-[10px]">VAT & Discounts</span>
            <div className="font-bold text-slate-900">
              {taxRateName} ({taxPercentFormatted}): +{currency}{taxAmount.toFixed(2)}
            </div>
            <div className="text-slate-500 mt-0.5 font-medium">
              Discount: {discountAmount > 0 ? (discountRate > 0 ? `${discountRate}% (-${currency}${discountAmount.toFixed(2)})` : `-${currency}${discountAmount.toFixed(2)}`) : 'None (৳0.00)'}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div>
          <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-3">
            Sales Order Items Breakdown
          </h4>
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Item & Variant</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-center">Ordered Qty</th>
                  <th className="py-3 px-4 text-center">Current Stock</th>
                  <th className="py-3 px-4 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items?.map((item) => {
                  const check = stockCheck.items?.find((s) => s.order_item_id === item.id);
                  const isStockSufficient = check ? check.has_sufficient_stock : true;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{item.product_name}</div>
                        <div className="text-indigo-600 font-semibold text-[11px]">{item.variant_name}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{item.sku}</td>
                      <td className="py-3 px-4 text-right text-slate-700 font-medium">
                        {currency}{Number(item.unit_price).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isStockSufficient
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.variant?.stock_quantity ?? 'N/A'} available
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">
                        {currency}{Number(item.line_total).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Summary Card */}
        <div className="flex justify-end pt-2">
          <div className="w-full sm:w-72 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span className="font-bold text-slate-800">{currency}{subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-rose-600 font-medium">
                <span>Discount {discountRate > 0 ? `(${discountRate}%)` : ''}:</span>
                <span className="font-bold">-{currency}{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500">
              <span>{taxRateName} ({taxPercentFormatted}):</span>
              <span className="font-bold text-slate-800">+{currency}{taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm">
              <span className="font-black text-slate-900">Grand Total:</span>
              <span className="font-black text-xl text-indigo-600">
                {currency}{Number(order.grand_total).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

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
