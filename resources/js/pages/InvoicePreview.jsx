import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { 
  Printer, 
  ArrowLeft, 
  Receipt, 
  Download, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  FileText,
  Search
} from 'lucide-react';

export default function InvoicePreview({ invoiceId, onBack, onSelectInvoice }) {
  const [invoice, setInvoice] = useState(null);
  const [company, setCompany] = useState({});
  const [invoicesList, setInvoicesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const currency = '৳';

  const fetchInvoice = async (id) => {
    setLoading(true);
    try {
      const res = await api.get(`/invoices/${id}`);
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
        setInvoicesList(res.data.invoices.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice(invoiceId);
    } else {
      fetchInvoicesList();
    }
  }, [invoiceId]);

  const handlePrint = () => {
    window.print();
  };

  // If no single invoice is selected, show list of invoices
  if (!invoiceId) {
    return (
      <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
              <Receipt className="w-6 h-6 text-indigo-400" />
              Invoices Management
            </h1>
            <p className="text-xs text-slate-400">
              Preview, download, and print official invoices generated from sales orders.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search invoice #, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchInvoicesList()}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Invoice Number</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 text-right">Tax ({invoice?.tax_rate || 5}%)</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-12 text-slate-500">Loading invoices...</td></tr>
                ) : invoicesList.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-slate-500">No invoices generated yet.</td></tr>
                ) : (
                  invoicesList.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-300">{inv.invoice_number}</td>
                      <td className="py-3 px-4 text-slate-400">{inv.invoice_date}</td>
                      <td className="py-3 px-4 font-semibold text-slate-200">{inv.customer?.name}</td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {inv.status?.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">{currency}{Number(inv.subtotal).toFixed(2)}</td>
                      <td className="py-3 px-4 text-right">{currency}{Number(inv.tax_amount).toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-100">{currency}{Number(inv.grand_total).toFixed(2)}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onSelectInvoice?.(inv.id)}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all"
                        >
                          Print / View
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

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Loading invoice preview...</div>;
  }

  if (!invoice) {
    return (
      <div className="p-12 text-center text-slate-400">
        <p>Invoice not found.</p>
        <button onClick={onBack} className="mt-3 px-4 py-1.5 rounded-lg bg-slate-800 text-xs text-white">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      {/* Top action toolbar (Hidden in print) */}
      <div className="no-print flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to List
        </button>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all"
        >
          <Printer className="w-4 h-4" /> Print / Save PDF
        </button>
      </div>

      {/* Printable Invoice Sheet */}
      <div className="bg-white text-slate-900 rounded-3xl p-8 sm:p-12 shadow-2xl border border-slate-200">
        {/* Company & Invoice Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-8 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg">
                P
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {company.name || 'Mini POS Solutions'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
              {company.address}
            </p>
            <div className="mt-2 text-xs text-slate-600 space-y-0.5">
              <div>Phone: <span className="font-semibold text-slate-800">{company.phone}</span></div>
              <div>Tax / BIN: <span className="font-mono font-semibold text-slate-800">{company.tax_number}</span></div>
            </div>
          </div>

          <div className="sm:text-right">
            <span className="text-3xl font-black text-indigo-600 tracking-tight block">INVOICE</span>
            <div className="text-sm font-mono font-bold text-slate-800 mt-1">
              #{invoice.invoice_number}
            </div>
            <div className="mt-3 text-xs text-slate-600 space-y-1">
              <div>Invoice Date: <span className="font-semibold text-slate-900">{invoice.invoice_date}</span></div>
              <div>Due Date: <span className="font-semibold text-slate-900">{invoice.due_date || invoice.invoice_date}</span></div>
              <div>
                Status:{' '}
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                  {invoice.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bill To Customer Section */}
        <div className="grid grid-cols-2 gap-6 py-6 border-b border-slate-200">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Billed To:
            </span>
            <h3 className="text-sm font-bold text-slate-900">{invoice.customer?.name}</h3>
            <div className="text-xs text-slate-600 mt-0.5">
              <div>Customer Code: <span className="font-mono">{invoice.customer?.customer_code}</span></div>
              {invoice.customer?.phone && <div>Phone: {invoice.customer.phone}</div>}
              {invoice.customer?.tax_number && <div>BIN/VAT: {invoice.customer.tax_number}</div>}
              {invoice.customer?.address && <div className="mt-1 text-slate-500">{invoice.customer.address}</div>}
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Sales Order Ref:
            </span>
            <div className="text-xs font-mono font-bold text-slate-800">
              {invoice.order?.order_number || '-'}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Payment Method: <span className="font-semibold uppercase text-slate-800">{invoice.order?.payment_method || 'Cash'}</span>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="py-6">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b-2 border-slate-900 text-[10px] uppercase font-bold text-slate-700">
                <th className="py-3 px-2">#</th>
                <th className="py-3 px-2">Description & Variant</th>
                <th className="py-3 px-2 text-center">Qty</th>
                <th className="py-3 px-2 text-right">Unit Price</th>
                <th className="py-3 px-2 text-right">Discount</th>
                <th className="py-3 px-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {invoice.items?.map((item, idx) => (
                <tr key={item.id}>
                  <td className="py-3 px-2 text-slate-400 font-mono">{idx + 1}</td>
                  <td className="py-3 px-2 font-semibold text-slate-900">
                    {item.item_name}
                    {item.item_sku && (
                      <span className="block font-mono text-[10px] text-slate-400">{item.item_sku}</span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-center font-bold text-slate-800">{item.quantity}</td>
                  <td className="py-3 px-2 text-right text-slate-700">{currency}{Number(item.unit_price).toFixed(2)}</td>
                  <td className="py-3 px-2 text-right text-rose-600">-{currency}{Number(item.discount).toFixed(2)}</td>
                  <td className="py-3 px-2 text-right font-bold text-slate-900">
                    {currency}{Number(item.line_total).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Breakdown */}
        <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row justify-between gap-6">
          {/* Terms */}
          <div className="sm:max-w-xs text-[11px] text-slate-500 space-y-1">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Terms & Conditions</span>
            <p className="whitespace-pre-line">{invoice.terms_and_conditions}</p>
          </div>

          {/* Sums */}
          <div className="w-full sm:w-64 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-900">{currency}{Number(invoice.subtotal).toFixed(2)}</span>
            </div>
            {Number(invoice.discount_amount) > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Discount:</span>
                <span>-{currency}{Number(invoice.discount_amount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Sales Tax ({Number(invoice.tax_rate).toFixed(1)}%):</span>
              <span className="font-semibold text-slate-900">+{currency}{Number(invoice.tax_amount).toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t-2 border-slate-900 flex justify-between text-base font-black text-slate-900">
              <span>Grand Total:</span>
              <span className="text-indigo-600">{currency}{Number(invoice.grand_total).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600 text-[11px] pt-1">
              <span>Amount Paid:</span>
              <span>{currency}{Number(invoice.paid_amount).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Double-Entry Ledger Summary Note */}
        {invoice.order?.journal_entry && (
          <div className="mt-8 pt-4 border-t border-dashed border-slate-300 text-[10px] text-slate-400 flex items-center justify-between">
            <div>
              <strong>Accounting Reference:</strong> Journal Entry #{invoice.order.journal_entry.entry_number}
              {' '}(Debit AR: {currency}{Number(invoice.grand_total).toFixed(2)}, Credit Sales: {currency}{Number(invoice.subtotal - invoice.discount_amount).toFixed(2)}, Credit Tax Payable: {currency}{Number(invoice.tax_amount).toFixed(2)})
            </div>
            <div>Generated by Mini POS System</div>
          </div>
        )}
      </div>
    </div>
  );
}
