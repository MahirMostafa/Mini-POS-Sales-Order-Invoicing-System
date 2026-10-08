import React, { useState } from 'react';
import { X, CheckCircle, CreditCard, Banknote, Building, Clock, Loader2, AlertCircle } from 'lucide-react';

export default function CompleteOrderModal({ order, currency = '৳', onClose, onConfirm, loading = false }) {
  if (!order) return null;

  const grandTotal = Number(order.grand_total || 0);
  const [paymentMethod, setPaymentMethod] = useState(order.payment_method || 'cash');
  const [paidAmount, setPaidAmount] = useState(grandTotal);

  const changeAmount = Math.max(0, Number(paidAmount || 0) - grandTotal);
  const dueAmount = Math.max(0, grandTotal - Number(paidAmount || 0));

  const handleQuickExact = () => {
    setPaidAmount(grandTotal);
  };

  const handleQuickCash = (amount) => {
    setPaidAmount(amount);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({
      paid_amount: Number(paidAmount),
      payment_method: paymentMethod,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 relative overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Complete Order & Issue Invoice
              </h3>
              <p className="text-xs text-slate-400">
                Order #{order.order_number} • {order.customer?.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          {/* Total Due Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500">Order Grand Total</span>
              <div className="text-2xl font-black text-slate-900">
                {currency}{grandTotal.toFixed(2)}
              </div>
            </div>
            <div className="text-right text-xs text-slate-500 font-medium">
              <div>Subtotal: {currency}{Number(order.subtotal).toFixed(2)}</div>
              <div>Tax: {currency}{Number(order.tax_amount).toFixed(2)}</div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Payment Method</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'cash', label: 'Cash', icon: Banknote },
                { id: 'card', label: 'POS Card', icon: CreditCard },
                { id: 'bank_transfer', label: 'Bank', icon: Building },
                { id: 'credit', label: 'Credit', icon: Clock },
              ].map((method) => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.id;
                return (
                  <button
                    type="button"
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[11px] font-semibold">{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Paid Amount */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">Amount Received</label>
              <button
                type="button"
                onClick={handleQuickExact}
                className="text-[11px] font-bold text-indigo-600 hover:underline"
              >
                Exact Amount ({currency}{grandTotal.toFixed(2)})
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">
                {currency}
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            {/* Quick cash denomination chips */}
            <div className="flex items-center gap-1.5 mt-2">
              {[100, 500, 1000, 2000].map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => handleQuickCash(amt)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-200"
                >
                  +{currency}{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Change or Due Amount Indicator */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[11px] font-medium text-slate-500">Change Return</div>
              <div className="text-base font-black text-emerald-600">
                {currency}{changeAmount.toFixed(2)}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[11px] font-medium text-slate-500">Accounts Receivable (Due)</div>
              <div className={`text-base font-black ${dueAmount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                {currency}{dueAmount.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Stock & Double Entry Note */}
          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-[11px] text-indigo-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              Completing this order will atomically deduct product inventory, generate an official invoice, and post balanced double-entry accounting ledger entries.
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md shadow-emerald-600/20"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Confirm & Complete Sale
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
