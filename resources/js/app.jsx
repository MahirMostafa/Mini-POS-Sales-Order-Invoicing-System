import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import PosTerminal from './pages/PosTerminal';
import OrdersList from './pages/OrdersList';
import OrderDetails from './pages/OrderDetails';
import InvoicePreview from './pages/InvoicePreview';
import AccountingDashboard from './pages/AccountingDashboard';
import ProductCatalog from './pages/ProductCatalog';
import TaxManagement from './pages/TaxManagement';
import AuditLogs from './pages/AuditLogs';

function MainApp() {
  const [activePage, setActivePage] = useState('pos');
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [activeInvoiceId, setActiveInvoiceId] = useState(null);

  const handleNavigateToOrder = (orderId) => {
    setActiveOrderId(orderId);
    setActivePage('order-details');
  };

  const handleNavigateToInvoice = (invoiceId) => {
    setActiveInvoiceId(invoiceId);
    setActivePage('invoice-preview');
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activePage={activePage}
        setActivePage={(page) => {
          setActivePage(page);
          setActiveOrderId(null);
          setActiveInvoiceId(null);
        }}
      />

      {/* Main Page Area */}
      <main className="flex-1">
        {activePage === 'pos' && (
          <PosTerminal
            onNavigateToInvoice={handleNavigateToInvoice}
            onNavigateToOrder={handleNavigateToOrder}
          />
        )}

        {activePage === 'orders' && (
          <OrdersList
            onNavigateToOrder={handleNavigateToOrder}
            onNavigateToInvoice={handleNavigateToInvoice}
          />
        )}

        {activePage === 'order-details' && (
          <OrderDetails
            orderId={activeOrderId}
            onBack={() => setActivePage('orders')}
            onNavigateToInvoice={handleNavigateToInvoice}
          />
        )}

        {activePage === 'invoices' && (
          <InvoicePreview
            invoiceId={null}
            onSelectInvoice={(id) => handleNavigateToInvoice(id)}
          />
        )}

        {activePage === 'invoice-preview' && (
          <InvoicePreview
            invoiceId={activeInvoiceId}
            onBack={() => setActivePage('invoices')}
            onSelectInvoice={(id) => handleNavigateToInvoice(id)}
          />
        )}

        {activePage === 'accounting' && <AccountingDashboard />}

        {activePage === 'products' && <ProductCatalog />}

        {activePage === 'taxes' && <TaxManagement />}

        {activePage === 'audit' && <AuditLogs />}
      </main>

      {/* Footer */}
      <footer className="no-print py-4 border-t border-slate-900 text-center text-xs text-slate-500">
        Mini POS & Sales Order Invoicing System • Clean Architecture with Repository Pattern & Double-Entry Accounting
      </footer>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </React.StrictMode>
  );
}
