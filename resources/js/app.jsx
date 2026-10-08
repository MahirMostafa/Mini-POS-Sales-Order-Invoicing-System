import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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

function DashboardLayout() {
  const { user, role, loading } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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

  const userRole = role || user?.roles?.[0]?.name || 'Admin';
  const defaultPath = userRole === 'Accountant' ? '/accounting' : '/pos';

  return (
    <div className="min-h-screen bg-slate-50 flex selection:bg-indigo-500 selection:text-white">
      {/* Left Modern Sidebar */}
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* Main Content Layout */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Top Header */}
        <Header
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        {/* Dynamic Page Views with URL Routes */}
        <main className="flex-1 pb-12">
          <Routes>
            <Route path="/" element={<Navigate to={defaultPath} replace />} />
            <Route path="/pos" element={<PosTerminal />} />
            <Route path="/orders" element={<OrdersList />} />
            <Route path="/orders/:id" element={<OrderDetails />} />
            <Route path="/invoices" element={<InvoicePreview />} />
            <Route path="/invoices/:id" element={<InvoicePreview />} />
            <Route path="/products" element={<ProductCatalog />} />
            <Route path="/purchases" element={<PurchaseManagement />} />
            <Route path="/accounting" element={<AccountingDashboard />} />
            <Route path="/taxes" element={<TaxManagement />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/roles" element={<RolePermissionManagement />} />
            <Route path="/audit" element={<AuditLogs />} />
            <Route path="*" element={<Navigate to={defaultPath} replace />} />
          </Routes>
        </main>

        {/* System Footer */}
        <footer className="no-print py-4 px-6 border-t border-slate-200 bg-white text-center sm:text-left text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Mini POS & Sales Order Invoicing System • Clean Architecture & Spatie RBAC</span>
          <span className="font-semibold text-slate-500">Status: Active Database & Queue Worker</span>
        </footer>
      </div>
    </div>
  );
}

function MainApp() {
  return (
    <BrowserRouter>
      <DashboardLayout />
    </BrowserRouter>
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
