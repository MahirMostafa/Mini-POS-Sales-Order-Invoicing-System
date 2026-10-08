import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { 
  Printer, 
  ArrowLeft, 
  Receipt, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  FileText,
  Search,
  RefreshCw,
  Eye
} from 'lucide-react';
import BarcodeSvg from '../components/BarcodeSvg';
import { printThermalReceipt } from '../utils/printReceipt';

export default function InvoicePreview({ invoiceId: propInvoiceId, onBack, onSelectInvoice }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const effectiveInvoiceId = propInvoiceId || id;

  const [invoice, setInvoice] = useState(null);
  const [company, setCompany] = useState({});
  const [invoicesList, setInvoicesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('pos'); // 'pos' | 'a4'
  const currency = '৳';

  const handleBack = onBack || (() => navigate('/invoices'));
  const handleSelectInvoice = onSelectInvoice || ((invId) => navigate(`/invoices/${invId}`));

  const fetchInvoice = async (invId) => {
    setLoading(true);
    try {
      const res = await api.get(`/invoices/${invId}`);
      if (res.data.success) {
        setInvoice(res.data.invoice);
        setCompany(res.data.company || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoicesList = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/invoices?search=${encodeURIComponent(searchQuery)}`);
      if (res.data.success) {
        setInvoicesList(res.data.invoices?.data || res.data.invoices || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (effectiveInvoiceId) {
      fetchInvoice(effectiveInvoiceId);
    } else {
      fetchInvoicesList();
    }
  }, [effectiveInvoiceId]);

  const handlePrint = () => {
    printThermalReceipt('pos-thermal-receipt');
  };

  // If no single invoice is selected, show list of invoices
  if (!effectiveInvoiceId) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
              <Receipt className="w-4 h-4" />
              <span>POS Invoices & Sales Receipts</span>
            </div>
            <h2 className="text-xl font-black text-slate-900">Invoices & Receipts Registry</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Preview, download, and print 80mm thermal POS receipts generated from sales.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search invoice #, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchInvoicesList()}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-xs"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-6">Invoice #</th>
                  <th className="py-3.5 px-6">Order #</th>
                  <th className="py-3.5 px-6">Customer</th>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6 text-right">Grand Total</th>
                  <th className="py-3.5 px-6 text-right">Paid</th>
                  <th className="py-3.5 px-6 text-center">Status</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                      Loading invoices...
                    </td>
                  </tr>
                ) : invoicesList.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-400">
                      No invoices found. Complete sales orders to generate invoices.
                    </td>
                  </tr>
                ) : (
                  invoicesList.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-6 font-bold font-mono text-indigo-600">
                        {inv.invoice_number}
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-500">
                        {inv.order?.order_number || '-'}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900">{inv.customer_name}</div>
                        <div className="text-[10px] text-slate-400">{inv.customer_phone || 'No phone'}</div>
                      </td>
                      <td className="py-4 px-6 text-slate-600">
                        {inv.invoice_date}
                      </td>
                      <td className="py-4 px-6 text-right font-black text-slate-900">
                        {currency}{Number(inv.grand_total).toFixed(2)}
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-emerald-600">
                        {currency}{Number(inv.paid_amount).toFixed(2)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.payment_status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span className="capitalize">{inv.payment_status}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => handleSelectInvoice(inv.id)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 transition-colors font-bold text-[11px] inline-flex items-center gap-1.5 shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View & Print</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Single Invoice Printable Preview
  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
        Generating printable tax invoice preview...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-16 text-center text-slate-500">
        <p>Invoice not found.</p>
        <button onClick={handleBack} className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Top action controls (Hidden during print) */}
      <div className="no-print flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Receipts
        </button>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-medium px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
            <Receipt className="w-3.5 h-3.5 text-indigo-600" />
            <span>80mm POS Receipt</span>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print POS Receipt</span>
          </button>
        </div>
      </div>

      {/* 80mm POS Thermal Receipt Display */}
      <div className="flex justify-center">
        <div
          id="pos-thermal-receipt"
          className="pos-receipt-print-area bg-white text-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xl w-full max-w-[320px] font-mono text-[11px] leading-tight space-y-2 print:border-none print:shadow-none print:p-0 print:m-0 print:w-[72mm] print:text-[10px]"
        >
          {/* Store Header */}
          <div className="text-center space-y-0.5 pb-1">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center mx-auto mb-1 no-print">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <h2 className="font-black text-xs uppercase tracking-wider text-slate-900 font-sans">
              {company.name || 'MINI POS & RETAIL HUB'}
            </h2>
            <p className="text-[9px] text-slate-600 font-sans">{company.address || 'Dhaka, Bangladesh'}</p>
            <p className="text-[9px] text-slate-600">Tel: {company.phone || '+880 1700-000000'}</p>
            {company.tax_bin && (
              <p className="text-[9px] text-slate-600 font-bold">VAT BIN: {company.tax_bin}</p>
            )}
          </div>

          <div className="border-t border-dashed border-slate-400 my-1" />

          {/* Receipt Metadata */}
          <div className="space-y-0.5 text-[10px] leading-tight">
            <div className="flex justify-between">
              <span className="text-slate-500">Invoice #:</span>
              <span className="font-bold text-slate-900">{invoice.invoice_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Order Ref:</span>
              <span className="font-bold text-slate-800">{invoice.order?.order_number || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date:</span>
              <span className="text-slate-800">{String(invoice.invoice_date || '').split('T')[0]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cashier:</span>
              <span className="font-bold text-slate-800">{invoice.user?.name || 'Cashier Counter'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Customer:</span>
              <span className="font-bold text-slate-900 truncate max-w-[180px] text-right">{invoice.customer?.name || invoice.customer_name || 'Walk-in Customer'}</span>
            </div>
            {(invoice.customer?.phone || invoice.customer_phone) && (
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="text-slate-700">{invoice.customer?.phone || invoice.customer_phone}</span>
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-slate-400 my-1" />

          {/* Line Items Table */}
          <div>
            <div className="flex justify-between font-bold text-[9px] pb-0.5 border-b border-dashed border-slate-300 text-slate-500 uppercase">
              <span>ITEM & SPECIFICATION</span>
              <span>TOTAL ({currency})</span>
            </div>

            <div className="divide-y divide-dotted divide-slate-200 py-0.5 space-y-1">
              {invoice.items?.map((item, idx) => {
                const name = item.product_name || item.item_name || item.product?.name || 'Product';
                const variant = item.variant_name || item.variant?.variant_name || '';
                const sku = item.sku || item.item_sku || item.product_sku || '';
                const qty = item.quantity || 1;
                const price = parseFloat(item.unit_price || 0);
                const total = parseFloat(item.line_total || (qty * price));

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
          </div>

          <div className="border-t border-dashed border-slate-400 my-1" />

          {/* Totals Calculation */}
          <div className="space-y-0.5 text-[10px] leading-tight">
            <div className="flex justify-between text-slate-600">
              <span>SUBTOTAL:</span>
              <span className="font-bold text-slate-900">{currency}{Number(invoice.subtotal).toFixed(2)}</span>
            </div>

            {Number(invoice.discount_amount) > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>DISCOUNT:</span>
                <span className="font-bold">-{currency}{Number(invoice.discount_amount).toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-600">
              <span>{invoice.tax_rate_name || 'VAT'} ({invoice.tax_rate_percent}%):</span>
              <span className="font-bold text-slate-900">+{currency}{Number(invoice.tax_amount).toFixed(2)}</span>
            </div>

            <div className="border-t border-dashed border-slate-400 my-1" />

            <div className="flex justify-between items-center text-xs font-black py-0.5 text-slate-900">
              <span>TOTAL:</span>
              <span className="font-mono text-sm">{currency}{Number(invoice.grand_total).toFixed(2)}</span>
            </div>

            <div className="border-t border-dashed border-slate-400 my-1" />

            <div className="flex justify-between text-slate-600">
              <span>PAID ({invoice.payment_method?.toUpperCase()}):</span>
              <span className="font-bold text-emerald-700">{currency}{Number(invoice.paid_amount).toFixed(2)}</span>
            </div>

            {Number(invoice.due_amount) > 0 ? (
              <div className="flex justify-between text-amber-600 font-bold">
                <span>DUE:</span>
                <span>{currency}{Number(invoice.due_amount).toFixed(2)}</span>
              </div>
            ) : (
              <div className="flex justify-between text-slate-500">
                <span>CHANGE:</span>
                <span>{currency}0.00</span>
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-slate-400 my-1" />

          {/* Real Code128 Linear Barcode */}
          <div className="py-1 flex justify-center">
            <BarcodeSvg value={invoice.invoice_number} height={26} showText={true} />
          </div>

          {/* Footer Notes */}
          <div className="text-center text-[9px] text-slate-500 pt-0.5 space-y-0.5 font-sans leading-tight">
            <p className="font-bold text-slate-800">*** Thank You! Please Come Again ***</p>
            <p>Exchange within 7 days with this POS receipt.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
