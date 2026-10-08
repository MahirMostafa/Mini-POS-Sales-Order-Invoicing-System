import React, { useRef } from 'react';
import { 
  Printer, 
  X, 
  CheckCircle2, 
  ShoppingBag, 
  Store, 
  ArrowRight,
  Receipt,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BarcodeSvg from './BarcodeSvg';
import { printThermalReceipt } from '../utils/printReceipt';

export default function PosThermalReceiptModal({ 
  invoice, 
  order, 
  company = {}, 
  isOpen, 
  onClose, 
  onNewSale 
}) {
  const navigate = useNavigate();
  const receiptRef = useRef(null);
  const currency = '৳';

  if (!isOpen || (!invoice && !order)) return null;

  const invoiceNumber = invoice?.invoice_number || (order?.invoice ? order.invoice.invoice_number : `INV-${order?.order_number || 'POS'}`);
  const orderNumber = order?.order_number || invoice?.order?.order_number || '-';
  const customerName = invoice?.customer?.name || order?.customer?.name || invoice?.customer_name || 'Walk-in Customer';
  const customerPhone = invoice?.customer?.phone || order?.customer?.phone || invoice?.customer_phone || '';
  const customerAddress = invoice?.customer?.address || order?.customer?.address || invoice?.customer_address || '';
  const cashierName = invoice?.user?.name || order?.user?.name || 'Cashier Counter';
  const rawDate = invoice?.invoice_date || order?.order_date;
  const dateStr = rawDate ? String(rawDate).split('T')[0] : new Date().toISOString().split('T')[0];
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const items = invoice?.items || order?.items || [];
  const subtotal = parseFloat(invoice?.subtotal ?? order?.subtotal ?? 0);
  const discountAmount = parseFloat(invoice?.discount_amount ?? order?.discount_amount ?? 0);
  const taxRateName = invoice?.tax_rate_name || order?.taxRate?.name || 'VAT';
  const taxRatePercent = parseFloat(invoice?.tax_rate_percent ?? order?.taxRate?.rate ?? order?.tax_amount ? ((order.tax_amount / (subtotal - discountAmount || 1)) * 100) : 0);
  const taxAmount = parseFloat(invoice?.tax_amount ?? order?.tax_amount ?? 0);
  const rawTotal = subtotal - discountAmount + taxAmount;
  const roundingAdjustment = invoice?.rounding_amount !== undefined && invoice?.rounding_amount !== null
    ? parseFloat(invoice.rounding_amount)
    : (order?.rounding_amount !== undefined && order?.rounding_amount !== null
        ? parseFloat(order.rounding_amount)
        : (Math.ceil(rawTotal) - rawTotal));
  const grandTotal = parseFloat(invoice?.grand_total ?? order?.grand_total ?? Math.ceil(rawTotal));
  const paidAmount = parseFloat(invoice?.paid_amount ?? order?.paid_amount ?? grandTotal);
  const paymentMethod = (invoice?.payment_method || order?.payment_method || 'CASH').toUpperCase();
  const dueAmount = Math.max(0, grandTotal - paidAmount);
  const changeAmount = order?.change_amount !== undefined && order?.change_amount !== null
    ? parseFloat(order.change_amount)
    : (paidAmount > grandTotal ? paidAmount - grandTotal : 0);

  const handlePrint = () => {
    printThermalReceipt('pos-thermal-receipt');
  };

  const handleGoToFullInvoice = () => {
    if (invoice?.id) {
      navigate(`/invoices/${invoice.id}`);
    } else if (order?.invoice?.id) {
      navigate(`/invoices/${order.invoice.id}`);
    } else if (order?.id) {
      navigate(`/orders/${order.id}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden my-4 flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Top Control Bar (No-Print) */}
        <div className="no-print px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Sale Completed & Receipt Ready</h3>
              <p className="text-[10px] text-slate-400">80mm POS Thermal Receipt Format</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Preview Container */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100/60 flex justify-center">
          
          {/* Authentic 80mm POS Receipt Card */}
          <div 
            ref={receiptRef}
            id="pos-thermal-receipt"
            className="pos-receipt-print-area bg-white text-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-md w-full max-w-[320px] font-mono text-[11px] leading-tight space-y-2 print:border-none print:shadow-none print:p-0 print:m-0 print:w-[72mm] print:text-[10px]"
          >
            {/* Store Header */}
            <div className="text-center space-y-0.5 pb-1">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center mx-auto mb-1 no-print">
                <Store className="w-3.5 h-3.5" />
              </div>
              <h2 className="font-black text-xs uppercase tracking-wider text-slate-900 font-sans">
                {company.name || 'MINI POS & RETAIL HUB'}
              </h2>
              <p className="text-[9px] text-slate-600 font-sans">{company.address || 'Dhaka, Bangladesh'}</p>
              <p className="text-[9px] text-slate-600">Tel: {company.phone || '+880 1700-000000'}</p>
              <p className="text-[9px] text-slate-600 font-bold">VAT Reg BIN: {company.tax_bin || 'BIN-99201928'}</p>
            </div>

            <div className="border-t border-dashed border-slate-400 my-1" />

            {/* Receipt Metadata */}
            <div className="space-y-0.5 text-[10px] leading-tight">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice #:</span>
                <span className="font-bold text-slate-900">{invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Order Ref:</span>
                <span className="font-bold text-slate-800">{orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date/Time:</span>
                <span className="text-slate-800">{dateStr} {timeStr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cashier:</span>
                <span className="font-bold text-slate-800">{cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-900 truncate max-w-[180px] text-right">{customerName}</span>
              </div>
              {customerPhone && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone:</span>
                  <span className="text-slate-700">{customerPhone}</span>
                </div>
              )}
            </div>

            <div className="border-t border-dashed border-slate-400 my-1" />

            {/* Items Header */}
            <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase pb-0.5 border-b border-dashed border-slate-300">
              <span>Item & Specification</span>
              <span>Total ({currency})</span>
            </div>

            {/* Items List */}
            <div className="divide-y divide-dotted divide-slate-200 py-0.5 space-y-1">
              {items.map((it, idx) => {
                const name = it.product_name || it.item_name || it.product?.name || it.variant?.product?.name || 'Product';
                const variant = it.variant_name || it.variant?.variant_name || '';
                const sku = it.sku || it.item_sku || it.product_sku || it.variant?.sku || '';
                const qty = it.quantity || 1;
                const price = parseFloat(it.unit_price || 0);
                const total = parseFloat(it.line_total || (qty * price));

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

            <div className="border-t border-dashed border-slate-400 my-1" />

            {/* Summary Calculations */}
            <div className="space-y-0.5 text-[10px] leading-tight">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal:</span>
                <span className="font-bold text-slate-900">{currency}{subtotal.toFixed(2)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>Discount:</span>
                  <span>-{currency}{discountAmount.toFixed(2)}</span>
                </div>
              )}

              {taxAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>{taxRateName} ({taxRatePercent.toFixed(1)}%):</span>
                  <span>+{currency}{taxAmount.toFixed(2)}</span>
                </div>
              )}

              {roundingAdjustment !== 0 && (
                <div className="flex justify-between text-slate-700 font-medium">
                  <span>Rounding (Ceil):</span>
                  <span>{roundingAdjustment > 0 ? '+' : ''}{currency}{roundingAdjustment.toFixed(2)}</span>
                </div>
              )}

              <div className="border-t border-dashed border-slate-400 my-1" />

              <div className="flex justify-between items-center text-xs font-black py-0.5">
                <span className="text-slate-900 uppercase">Grand Total:</span>
                <span className="text-slate-900 font-mono text-sm">{currency}{grandTotal.toFixed(2)}</span>
              </div>

              <div className="border-t border-dashed border-slate-400 my-1" />

              <div className="flex justify-between">
                <span className="text-slate-600">Payment ({paymentMethod}):</span>
                <span className="font-bold text-emerald-700">{currency}{paidAmount.toFixed(2)}</span>
              </div>

              {changeAmount > 0 && (
                <div className="flex justify-between font-bold">
                  <span className="text-slate-600">Change Given:</span>
                  <span className="text-slate-900">{currency}{changeAmount.toFixed(2)}</span>
                </div>
              )}

              {dueAmount > 0 && (
                <div className="flex justify-between text-amber-700 font-bold">
                  <span>Balance Due:</span>
                  <span>{currency}{dueAmount.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="border-t border-dashed border-slate-400 my-1" />

            {/* Real Code128 Linear Barcode */}
            <div className="py-1 flex justify-center">
              <BarcodeSvg value={invoiceNumber} height={26} showText={true} />
            </div>

            {/* Footer Notes */}
            <div className="text-center text-[9px] text-slate-500 pt-0.5 space-y-0.5 font-sans leading-tight">
              <p className="font-bold text-slate-800">*** Thank You! Please Come Again ***</p>
              <p>Exchange within 7 days with this POS receipt.</p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions (No-Print) */}
        <div className="no-print p-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleGoToFullInvoice}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>View Receipt in Registry</span>
          </button>

          <div className="w-full sm:w-auto flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onNewSale || onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Start New Sale
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print POS Receipt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
