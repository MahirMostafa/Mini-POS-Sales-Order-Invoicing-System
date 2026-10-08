import React from 'react';
import { X, Layers, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function VariantModal({ product, currency = '৳', onClose, onSelectVariant }) {
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">{product.name}</h3>
              <p className="text-xs text-slate-400">Select product variant and specification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Variant list */}
        <div className="py-4 space-y-2.5 max-h-96 overflow-y-auto pr-1">
          {product.variants?.map((variant) => {
            const isOutOfStock = variant.stock_quantity <= 0;
            const isLowStock = variant.stock_quantity > 0 && variant.stock_quantity <= (variant.alert_quantity || 5);

            return (
              <div
                key={variant.id}
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                  isOutOfStock
                    ? 'border-red-950/50 bg-red-950/10 opacity-75'
                    : 'border-slate-800 bg-slate-800/40 hover:border-indigo-500/60 hover:bg-slate-800/80 cursor-pointer'
                }`}
                onClick={() => {
                  if (!isOutOfStock) {
                    onSelectVariant(variant, product);
                    onClose();
                  }
                }}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-100 text-sm">
                      {variant.variant_name}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {variant.sku}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-1.5 text-xs">
                    <span className="text-slate-400">
                      Stock:{' '}
                      <span
                        className={`font-semibold ${
                          isOutOfStock
                            ? 'text-rose-400'
                            : isLowStock
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {variant.stock_quantity} units
                      </span>
                    </span>

                    {isLowStock && (
                      <span className="flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                        <AlertTriangle className="w-3 h-3" /> Low Stock
                      </span>
                    )}
                    {isOutOfStock && (
                      <span className="flex items-center gap-1 text-[11px] text-rose-400 font-medium">
                        <ShieldAlert className="w-3 h-3" /> Out of Stock
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-bold text-indigo-300">
                    {currency}{Number(variant.selling_price).toFixed(2)}
                  </div>
                  <button
                    disabled={isOutOfStock}
                    className={`mt-1 text-xs px-3 py-1 rounded-lg font-medium transition-all ${
                      isOutOfStock
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30'
                    }`}
                  >
                    {isOutOfStock ? 'Sold Out' : 'Select'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
