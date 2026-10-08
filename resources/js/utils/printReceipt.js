/**
 * Utility to print POS Thermal Receipts & Business Documents (GRN, Invoices)
 * using browser's native print preview with fallback isolation popup.
 */
export function printThermalReceipt(elementId = 'pos-thermal-receipt') {
  setTimeout(() => {
    window.print();
  }, 50);
}

export function printDocument(elementId, title = 'Goods Received Note (GRN)') {
  const elem = document.getElementById(elementId);
  if (!elem) {
    window.print();
    return;
  }

  // Create an isolated printable window to prevent modal/overflow clipping
  const printWindow = window.open('', '_blank', 'width=900,height=950');
  if (!printWindow) {
    // Fallback if browser blocks popups
    window.print();
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm 15mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 10px;
            font-size: 12px;
            line-height: 1.5;
          }
          .no-print {
            display: none !important;
          }
          .grn-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #4f46e5;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .company-title {
            font-size: 20px;
            font-weight: 900;
            color: #1e1b4b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0 0 4px 0;
          }
          .company-sub {
            font-size: 11px;
            color: #64748b;
            margin: 2px 0;
          }
          .doc-badge {
            text-align: right;
          }
          .doc-title {
            font-size: 18px;
            font-weight: 900;
            color: #4f46e5;
            margin: 0;
            text-transform: uppercase;
          }
          .doc-no {
            font-size: 14px;
            font-weight: 700;
            font-family: monospace;
            color: #334155;
            margin-top: 4px;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 12px 16px;
            margin-bottom: 20px;
          }
          .meta-label {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748b;
          }
          .meta-val {
            font-size: 12px;
            font-weight: 700;
            color: #1e293b;
            margin-top: 2px;
          }
          .supplier-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 12px 16px;
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            margin-bottom: 20px;
          }
          th {
            background-color: #f1f5f9;
            color: #475569;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 10px 12px;
            border: 1px solid #cbd5e1;
            text-align: left;
          }
          td {
            padding: 10px 12px;
            border: 1px solid #e2e8f0;
            font-size: 12px;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .text-right {
            text-align: right;
          }
          .text-center {
            text-align: center;
          }
          .font-bold {
            font-weight: bold;
          }
          .font-mono {
            font-family: monospace;
          }
          tfoot td {
            background-color: #f8fafc;
            font-weight: 800;
            border-top: 2px solid #cbd5e1;
          }
          .total-amount {
            font-size: 15px;
            color: #4f46e5;
            font-weight: 900;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 60px;
            padding-top: 20px;
          }
          .sig-box {
            border-top: 1px solid #94a3b8;
            width: 220px;
            text-align: center;
            font-size: 11px;
            color: #475569;
            font-weight: 600;
            padding-top: 6px;
          }
          .status-tag {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 9999px;
            font-size: 10px;
            font-weight: 700;
            background: #dcfce7;
            color: #166534;
            border: 1px solid #bbf7d0;
          }
        </style>
      </head>
      <body>
        ${elem.innerHTML}
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }, 250);
}
