import React, { useState, useEffect, useRef } from 'react';
import { 
  Banknote, 
  CreditCard, 
  Building2, 
  Clock, 
  X, 
  Check, 
  ArrowRight,
  Calculator,
  RefreshCw
} from 'lucide-react';

export default function PosPaymentModal({
  isOpen,
  grandTotal,
  rawTotal,
  roundingAdjustment = 0,
  subtotal,
  taxAmount,
  discountAmount,
  customer,
  itemCount,
  currency = '৳',
  onClose,
  onConfirmPayment,
  submitting = false,
}) {
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'card' | 'bank_transfer' | 'credit'
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const inputRef = useRef(null);

  const isWalkIn = Boolean(
    !customer ||
    customer.customer_code === 'CUST-0001' ||
    customer.id === 1 ||
    customer.name?.toLowerCase().includes('walk-in') ||
    customer.name?.toLowerCase().includes('walk in') ||
    customer.name?.toLowerCase().includes('cash customer')
  );

  // When modal opens, initialize paidAmount with grandTotal
  useEffect(() => {
    if (isOpen) {
      setPaidAmount(grandTotal.toFixed(2));
      setPaymentMethod('cash');
      setPaymentNote('');
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 100);
    }
  }, [isOpen, grandTotal]);

  // Safety check: if walk-in, force payment method off credit
  useEffect(() => {
    if (isWalkIn && paymentMethod === 'credit') {
      setPaymentMethod('cash');
      setPaidAmount(grandTotal.toFixed(2));
    }
  }, [isWalkIn, paymentMethod, grandTotal]);

  if (!isOpen) return null;

  const numericPaid = parseFloat(paidAmount) || 0;
  const changeDue = numericPaid > grandTotal ? numericPaid - grandTotal : 0;
  const balanceDue = numericPaid < grandTotal ? grandTotal - numericPaid : 0;

  const handleQuickAdd = (amount) => {
    setPaidAmount((prev) => {
      const current = parseFloat(prev) || 0;
      return (current + amount).toFixed(2);
    });
  };

  const handleSetExact = () => {
    setPaidAmount(grandTotal.toFixed(2));
  };

  const handlePresetNote = (note) => {
    setPaymentNote(note);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (submitting) return;

    if (isWalkIn && (paymentMethod === 'credit' || numericPaid < grandTotal)) {
      alert(`Credit/Due sales are not allowed for Walk-in Customers. Please collect the full amount (${currency}${grandTotal.toFixed(2)}) or select a registered customer.`);
      return;
    }

    onConfirmPayment({
      paid_amount: numericPaid,
      payment_method: paymentMethod,
      payment_note: paymentNote,
      change_amount: changeDue,
    });
  };

  const paymentMethods = [
    { id: 'cash', label: 'Cash', icon: Banknote, color: 'emerald' },
    { id: 'card', label: 'Card / POS', icon: CreditCard, color: 'indigo' },
    { id: 'bank_transfer', label: 'Bank / Digital', icon: Building2, color: 'blue' },
    { 
      id: 'credit', 
      label: isWalkIn ? 'Credit (Disabled)' : 'Credit / Due', 
      icon: Clock, 
      color: 'amber',
      disabled: isWalkIn,
      tooltip: isWalkIn ? 'Credit sales are only permitted for registered customer accounts' : 'Sell on credit / due'
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden my-4 flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Collect POS Payment</h3>
              <p className="text-[10px] text-slate-500">
                Customer: <span className="font-bold text-slate-700">{customer?.name || 'Walk-in Customer'}</span> • {itemCount} item(s)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {/* Amount Due Big Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-slate-50 border border-indigo-100/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Payable Amount
              </span>
              <div className="text-2xl sm:text-3xl font-black text-indigo-600 tracking-tight">
                {currency}{grandTotal.toFixed(2)}
              </div>
            </div>
            <div className="text-right text-[11px] text-slate-500 space-y-0.5">
              <div>Subtotal: <span className="font-bold text-slate-700">{currency}{subtotal.toFixed(2)}</span></div>
              {discountAmount > 0 && (
                <div className="text-rose-600">Discount: -{currency}{discountAmount.toFixed(2)}</div>
              )}
              {taxAmount > 0 && (
                <div>VAT / Tax: +{currency}{taxAmount.toFixed(2)}</div>
              )}
              {roundingAdjustment !== 0 && (
                <div className="text-indigo-600 font-bold">Rounding (Ceil): {roundingAdjustment > 0 ? '+' : ''}{currency}{roundingAdjustment.toFixed(2)}</div>
              )}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              Select Payment Method
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {paymentMethods.map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                const isDisabled = m.disabled;
                return (
                  <button
                    key={m.id}
                    type="button"
                    disabled={isDisabled}
                    title={m.tooltip || m.label}
                    onClick={() => {
                      if (isDisabled) return;
                      const prevMethod = paymentMethod;
                      setPaymentMethod(m.id);
                      if (m.id === 'credit') {
                        // For credit sale, default down payment is 0.00 unless custom
                        if (numericPaid === grandTotal || prevMethod !== 'credit') {
                          setPaidAmount('0.00');
                        }
                      } else {
                        // For cash/card/bank, if it was 0 from credit, reset to exact grandTotal
                        if (numericPaid === 0 || prevMethod === 'credit') {
                          setPaidAmount(grandTotal.toFixed(2));
                        }
                      }
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all relative ${
                      isDisabled
                        ? 'opacity-40 bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                        : isSelected
                        ? m.id === 'credit'
                          ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-xs ring-2 ring-amber-500/20'
                          : 'border-indigo-600 bg-indigo-50/70 text-indigo-700 shadow-xs ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1.5 ${
                      isDisabled
                        ? 'text-slate-300'
                        : isSelected 
                        ? (m.id === 'credit' ? 'text-amber-600' : 'text-indigo-600') 
                        : 'text-slate-400'
                    }`} />
                    <span className="text-center leading-tight">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Tender / Down-Payment Input Box */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700">
                {paymentMethod === 'credit' ? 'Down Payment / Paid Now (৳)' : `Amount Received / Tendered (${currency})`}
              </label>
              {paymentMethod === 'credit' ? (
                <button
                  type="button"
                  onClick={() => setPaidAmount('0.00')}
                  className="text-[11px] font-bold text-amber-700 hover:text-amber-800 hover:underline"
                >
                  Full Credit (৳0.00 Paid)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSetExact}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                  Exact Amount ({currency}{grandTotal.toFixed(2)})
                </button>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-black text-slate-400">
                {currency}
              </span>
              <input
                ref={inputRef}
                type="number"
                step="0.01"
                min="0"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="0.00"
                className={`w-full pl-10 pr-4 py-3 rounded-2xl border-2 text-xl font-black text-slate-900 outline-none transition-all ${
                  paymentMethod === 'credit'
                    ? 'border-amber-300 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10'
                    : isWalkIn && balanceDue > 0
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                    : 'border-slate-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10'
                }`}
                required
              />
            </div>

            {/* Quick Presets */}
            {paymentMethod === 'credit' ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setPaidAmount('0.00')}
                  className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-bold transition-colors"
                >
                  Full Due (৳0.00 Paid)
                </button>
                <button
                  type="button"
                  onClick={() => setPaidAmount((grandTotal * 0.25).toFixed(2))}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  25% Down ({currency}{(grandTotal * 0.25).toFixed(0)})
                </button>
                <button
                  type="button"
                  onClick={() => setPaidAmount((grandTotal * 0.50).toFixed(2))}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  50% Down ({currency}{(grandTotal * 0.50).toFixed(0)})
                </button>
                <button
                  type="button"
                  onClick={handleSetExact}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  Full Paid ({currency}{grandTotal.toFixed(2)})
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={handleSetExact}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  Exact
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdd(50)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  +{currency}50
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdd(100)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  +{currency}100
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdd(500)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  +{currency}500
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdd(1000)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  +{currency}1,000
                </button>
                <button
                  type="button"
                  onClick={() => setPaidAmount('500')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  {currency}500
                </button>
                <button
                  type="button"
                  onClick={() => setPaidAmount('1000')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  {currency}1000
                </button>
              </div>
            )}
          </div>

          {/* Change or Due Indicator Box */}
          <div className="p-4 rounded-2xl border transition-all flex items-center justify-between">
            {paymentMethod === 'credit' ? (
              <div className="w-full flex items-center justify-between text-amber-900 bg-amber-50/90 -m-4 p-4 rounded-2xl border border-amber-300">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block">
                    Credit / Due Amount Tracked
                  </span>
                  <div className="text-2xl font-black text-amber-600">
                    {currency}{balanceDue.toFixed(2)}
                  </div>
                  <p className="text-[10px] text-amber-700 mt-0.5 font-medium">
                    {numericPaid > 0
                      ? `Paid Now: ${currency}${numericPaid.toFixed(2)} • Due added to customer: ${currency}${balanceDue.toFixed(2)}`
                      : `Total ${currency}${grandTotal.toFixed(2)} will be added to customer receivables ledger.`}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
            ) : changeDue > 0 ? (
              <div className="w-full flex items-center justify-between text-emerald-800 bg-emerald-50/80 -m-4 p-4 rounded-2xl border border-emerald-200">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider block">
                    Change to Return to Customer
                  </span>
                  <div className="text-2xl font-black text-emerald-600">
                    {currency}{changeDue.toFixed(2)}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black">
                  ✓
                </div>
              </div>
            ) : balanceDue > 0 ? (
              <div className={`w-full flex items-center justify-between -m-4 p-4 rounded-2xl border ${
                isWalkIn 
                  ? 'text-rose-800 bg-rose-50/90 border-rose-200' 
                  : 'text-amber-800 bg-amber-50/80 border-amber-200'
              }`}>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider block">
                    {isWalkIn ? 'Unpaid Balance (Not Allowed for Walk-in)' : 'Balance Due / Remaining'}
                  </span>
                  <div className={`text-2xl font-black ${isWalkIn ? 'text-rose-600' : 'text-amber-600'}`}>
                    {currency}{balanceDue.toFixed(2)}
                  </div>
                  {isWalkIn && (
                    <span className="text-[10px] font-bold text-rose-700 block mt-0.5">
                      Walk-in customer must tender at least {currency}{grandTotal.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className={`text-[11px] font-bold text-right ${isWalkIn ? 'text-rose-700' : 'text-amber-700'}`}>
                  {isWalkIn ? 'Short Payment' : 'Partial Payment'}
                </div>
              </div>
            ) : (
              <div className="w-full flex items-center justify-between text-slate-700 bg-slate-50 -m-4 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Payment Status
                  </span>
                  <div className="text-lg font-black text-slate-800">
                    Exact Amount Tendered
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  Change: {currency}0.00
                </span>
              </div>
            )}
          </div>

          {/* Optional Note */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Payment Note / Reference (Optional)
            </label>
            <input
              type="text"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              placeholder="e.g., Cash counter tender, TRX ID, etc."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
            />
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || (isWalkIn && balanceDue > 0)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all text-white ${
                isWalkIn && balanceDue > 0
                  ? 'bg-slate-400'
                  : paymentMethod === 'credit'
                  ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
              }`}
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Checkout...</span>
                </>
              ) : isWalkIn && balanceDue > 0 ? (
                <span>Full Payment Required ({currency}{grandTotal.toFixed(2)})</span>
              ) : paymentMethod === 'credit' ? (
                <>
                  <Clock className="w-4 h-4" />
                  <span>
                    {balanceDue > 0
                      ? `Confirm Credit Sale (${currency}${balanceDue.toFixed(2)} Due)`
                      : 'Confirm Sale & Print Receipt'}
                  </span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirm Payment & Print Receipt</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
