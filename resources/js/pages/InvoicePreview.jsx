import React, { useState, useEffect } from 'react';
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
        setInvoicesList(res.data.invoices?.data || res.data.invoices || []);
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
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
              <Receipt className="w-4 h-4" />
              <span>Commercial Tax Invoices</span>
            </div>
            <h2 className="text-xl font-black text-slate-900">Invoices & Receipts Registry</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Preview, download, and print official tax invoices generated from completed orders.
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
                          onClick={() => onSelectInvoice?.(inv.id)}
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
        <button onClick={onBack} className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Top action controls (Hidden during print) */}
      <div className="no-print flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Invoices
        </button>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all"
        >
          <Printer className="w-4 h-4" /> Print Tax Invoice
        </button>
      </div>

      {/* Printable Invoice Card */}
      <div
        id="invoice-card"
        className="bg-white text-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl space-y-8 font-sans print:p-0 print:border-none print:shadow-none"
      >
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start pb-6 border-b border-slate-200 gap-6">
          <div className="space-y-1">
            <div className="text-xl font-black tracking-tight text-indigo-600 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-indigo-600" />
              {company.name || 'Mini POS & ERP Enterprise'}
            </div>
            <p className="text-xs text-slate-500 font-medium">{company.address || 'Dhaka, Bangladesh'}</p>
            <p className="text-xs text-slate-500 font-medium">
              Phone: {company.phone || '+880 1700-000000'} • Email: {company.email || 'billing@minipos.com'}
            </p>
            {company.tax_bin && (
              <p className="text-xs font-bold text-slate-700 font-mono">
                VAT BIN Reg: {company.tax_bin}
              </p>
            )}
          </div>

          <div className="sm:text-right space-y-1">
            <span className="inline-block font-black text-xl text-slate-900 tracking-tight uppercase">
              TAX INVOICE
            </span>
            <div className="text-base font-black font-mono text-indigo-600">
              #{invoice.invoice_number}
            </div>
            <div className="text-xs text-slate-500">
              Date: <span className="font-bold text-slate-800">{invoice.invoice_date}</span>
            </div>
            <div className="text-xs text-slate-500">
              Order Ref: <span className="font-mono font-bold text-slate-800">{invoice.order?.order_number || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Bill To & Payment Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs bg-slate-50 p-5 rounded-2xl border border-slate-200">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Billed To Customer:
            </span>
            <div className="font-black text-sm text-slate-900">{invoice.customer_name}</div>
            <div className="text-slate-600 font-medium">{invoice.customer_phone || 'N/A'}</div>
            <div className="text-slate-500">{invoice.customer_email || ''}</div>
            <div className="text-slate-500">{invoice.customer_address || 'Standard retail counter'}</div>
            {invoice.customer_tax_number && (
              <div className="font-mono text-slate-700 mt-1 font-bold">BIN / TIN: {invoice.customer_tax_number}</div>
            )}
          </div>

          <div className="sm:text-right space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Payment & Settlement:
            </span>
            <div>
              <span className="text-slate-500">Payment Method: </span>
              <span className="font-bold uppercase text-slate-800">{invoice.payment_method?.replace('_', ' ')}</span>
            </div>
            <div>
              <span className="text-slate-500">Payment Status: </span>
              <span className="font-black text-emerald-600 uppercase">{invoice.payment_status}</span>
            </div>
            <div>
              <span className="text-slate-500">Issued By: </span>
              <span className="font-medium text-slate-800">{invoice.user?.name || 'Authorized Counter Cashier'}</span>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Item & Specification</th>
                <th className="py-3 px-4">SKU Code</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items?.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{item.product_name}</div>
                    <div className="text-indigo-600 font-semibold text-[11px]">{item.variant_name}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">{item.sku}</td>
                  <td className="py-3 px-4 text-right font-medium text-slate-700">
                    {currency}{Number(item.unit_price).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-slate-900">{item.quantity}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    {currency}{Number(item.line_total).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Breakdown */}
        <div className="flex flex-col sm:flex-row justify-between items-start pt-2 gap-6">
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 max-w-sm text-xs space-y-1">
            <div className="font-bold text-indigo-950">Double-Entry Accounting Verified</div>
            <p className="text-[11px] text-indigo-800">
              Automated journal entry posted: Debited Accounts Receivable / Cash, Credited Sales Revenue, and Credited Tax Payable (VAT).
            </p>
          </div>

          <div className="w-full sm:w-72 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-bold text-slate-900">{currency}{Number(invoice.subtotal).toFixed(2)}</span>
            </div>
            {Number(invoice.discount_amount) > 0 && (
              <div className="flex justify-between text-rose-600 font-medium">
                <span>Discount:</span>
                <span>-{currency}{Number(invoice.discount_amount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>{invoice.tax_rate_name || 'VAT'} ({invoice.tax_rate_percent}%):</span>
              <span className="font-bold text-slate-900">+{currency}{Number(invoice.tax_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm">
              <span className="font-black text-slate-900">Grand Total:</span>
              <span className="font-black text-xl text-indigo-600">
                {currency}{Number(invoice.grand_total).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-slate-600 pt-1">
              <span>Amount Paid:</span>
              <span className="font-bold text-emerald-600">{currency}{Number(invoice.paid_amount).toFixed(2)}</span>
            </div>
            {Number(invoice.due_amount) > 0 && (
              <div className="flex justify-between text-amber-600 font-bold">
                <span>Balance Due:</span>
                <span>{currency}{Number(invoice.due_amount).toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Signature & Notes */}
        <div className="pt-8 border-t border-slate-200 text-center text-xs text-slate-400 space-y-1">
          <p className="font-semibold text-slate-600">Thank you for your business!</p>
          <p className="text-[10px]">This is a computer-generated tax invoice and requires no physical seal.</p>
        </div>
      </div>
    </div>
  );
}
