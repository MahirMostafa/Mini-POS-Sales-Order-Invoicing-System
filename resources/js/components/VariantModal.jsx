import React from 'react';
import { X, Layers, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function VariantModal({ product, currency = '৳', onClose, onSelectVariant }) {
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 relative overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">{product.name}</h3>
              <p className="text-xs text-slate-400">Select product variant to add to sales cart</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
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
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                  isOutOfStock
                    ? 'border-rose-200 bg-rose-50/40 opacity-75'
                    : 'border-slate-200 bg-slate-50/50 hover:border-indigo-400 hover:bg-indigo-50/30 cursor-pointer shadow-xs'
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
                    <span className="font-bold text-slate-900 text-sm">
                      {variant.variant_name}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 font-mono">
                      {variant.sku}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-1.5 text-xs">
                    <span className="text-slate-500 font-medium">
                      Stock:{' '}
                      <span
                        className={`font-bold ${
                          isOutOfStock
                            ? 'text-rose-600'
                            : isLowStock
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {variant.stock_quantity} units
                      </span>
                    </span>

                    {isLowStock && (
                      <span className="flex items-center gap-1 text-[11px] text-amber-700 font-semibold">
                        <AlertTriangle className="w-3 h-3 text-amber-600" /> Low Stock
                      </span>
                    )}
                    {isOutOfStock && (
                      <span className="flex items-center gap-1 text-[11px] text-rose-700 font-semibold">
                        <ShieldAlert className="w-3 h-3 text-rose-600" /> Out of Stock
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-black text-indigo-600">
                    {currency}{Number(variant.selling_price).toFixed(2)}
                  </div>
                  <button
                    disabled={isOutOfStock}
                    className={`mt-1 text-xs px-3 py-1 rounded-xl font-bold transition-all ${
                      isOutOfStock
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
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
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
