import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import PosTerminal from './pages/PosTerminal';
import OrdersList from './pages/OrdersList';
import OrderDetails from './pages/OrderDetails';
import InvoicePreview from './pages/InvoicePreview';
import AccountingDashboard from './pages/AccountingDashboard';
import ProductCatalog from './pages/ProductCatalog';
import PurchaseManagement from './pages/PurchaseManagement';
import TaxManagement from './pages/TaxManagement';
import UserManagement from './pages/UserManagement';
import RolePermissionManagement from './pages/RolePermissionManagement';
import AuditLogs from './pages/AuditLogs';
import { Loader2 } from 'lucide-react';

function MainApp() {
  const { user, role, loading } = useAuth();
  const [activePage, setActivePage] = useState('pos');
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [activeInvoiceId, setActiveInvoiceId] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Set default active page based on role upon login
  useEffect(() => {
    if (user) {
      const userRole = role || user?.roles?.[0]?.name || 'Admin';
      if (userRole === 'Accountant') {
        setActivePage('accounting');
      } else {
        setActivePage('pos');
      }
    }
  }, [user?.id, role]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="text-xs font-bold text-slate-500">Loading Mini POS & ERP...</span>
        </div>
      </div>
    );
  }

  // If unauthenticated, show clean Login Screen at root
  if (!user) {
    return <LoginPage />;
  }

  const handleNavigateToOrder = (orderId) => {
    setActiveOrderId(orderId);
    setActivePage('order-details');
  };

  const handleNavigateToInvoice = (invoiceId) => {
    setActiveInvoiceId(invoiceId);
    setActivePage('invoice-preview');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex selection:bg-indigo-500 selection:text-white">
      {/* Left Modern Sidebar */}
      <Sidebar
        activePage={activePage}
        setActivePage={(page) => {
          setActivePage(page);
          setActiveOrderId(null);
          setActiveInvoiceId(null);
        }}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* Main Content Layout */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Top Header */}
        <Header
          activePage={activePage}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 pb-12">
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

          {activePage === 'products' && <ProductCatalog />}

          {activePage === 'purchases' && <PurchaseManagement />}

          {activePage === 'accounting' && <AccountingDashboard />}

          {activePage === 'taxes' && <TaxManagement />}

          {activePage === 'users' && <UserManagement />}

          {activePage === 'roles' && <RolePermissionManagement />}

          {activePage === 'audit' && <AuditLogs />}
        </main>

        {/* System Footer */}
        <footer className="no-print py-4 px-6 border-t border-slate-200 bg-white text-center sm:text-left text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Mini POS & Sales Order Invoicing System • Repository Pattern & Spatie RBAC</span>
          <span className="font-semibold text-slate-500">Status: Active Database & Queue Worker</span>
        </footer>
      </div>
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
