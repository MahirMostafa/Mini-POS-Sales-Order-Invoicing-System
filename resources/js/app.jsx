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
import CustomerManagement from './pages/CustomerManagement';
import RolePermissionManagement from './pages/RolePermissionManagement';
import AuditLogs from './pages/AuditLogs';
import { Loader2, ShieldAlert } from 'lucide-react';

function ProtectedRoute({ children, allowedRoles = [], requiredPermissions = [] }) {
  const { user, role, canAccessRoute } = useAuth();

  if (!user) {
    return <LoginPage />;
  }

  const hasAccess = canAccessRoute(allowedRoles, requiredPermissions);

  if (!hasAccess) {
    const defaultFallback = role === 'Accountant' ? '/accounting' : '/pos';
    return (
      <div className="p-8 max-w-xl mx-auto my-12 bg-white rounded-3xl border border-rose-200 shadow-xl text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-slate-900">Access Denied (RBAC Restricted)</h2>
        <p className="text-xs text-slate-500">
          Your current role (<span className="font-bold text-slate-800">{role || 'User'}</span>) does not have the required Spatie permissions to view or perform operations in this module.
        </p>
        <div className="pt-2">
          <Navigate to={defaultFallback} replace />
        </div>
      </div>
    );
  }

  return children;
}

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

        {/* Dynamic Page Views with Protected Spatie Routes */}
        <main className="flex-1 pb-12">
          <Routes>
            <Route path="/" element={<Navigate to={defaultPath} replace />} />

            {/* POS & Sales Routes */}
            <Route
              path="/pos"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Cashier']} requiredPermissions={['view-pos']}>
                  <PosTerminal />
                </ProtectedRoute>
              }
            />

            <Route
              path="/orders"
              element={
                <ProtectedRoute
                  allowedRoles={['Admin', 'Cashier', 'Accountant']}
                  requiredPermissions={['create-order', 'complete-order', 'view-pos']}
                >
                  <OrdersList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/orders/:id"
              element={
                <ProtectedRoute
                  allowedRoles={['Admin', 'Cashier', 'Accountant']}
                  requiredPermissions={['create-order', 'complete-order', 'view-pos']}
                >
                  <OrderDetails />
                </ProtectedRoute>
              }
            />

            <Route
              path="/invoices"
              element={
                <ProtectedRoute
                  allowedRoles={['Admin', 'Cashier', 'Accountant']}
                  requiredPermissions={['view-invoices', 'print-invoices']}
                >
                  <InvoicePreview />
                </ProtectedRoute>
              }
            />

            <Route
              path="/invoices/:id"
              element={
                <ProtectedRoute
                  allowedRoles={['Admin', 'Cashier', 'Accountant']}
                  requiredPermissions={['view-invoices', 'print-invoices']}
                >
                  <InvoicePreview />
                </ProtectedRoute>
              }
            />

            <Route
              path="/customers"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Cashier']} requiredPermissions={['manage-customers']}>
                  <CustomerManagement />
                </ProtectedRoute>
              }
            />

            {/* Inventory & Purchasing */}
            <Route
              path="/products"
              element={
                <ProtectedRoute allowedRoles={['Admin']} requiredPermissions={['manage-products']}>
                  <ProductCatalog />
                </ProtectedRoute>
              }
            />

            <Route
              path="/purchases"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Accountant']} requiredPermissions={['manage-purchases']}>
                  <PurchaseManagement />
                </ProtectedRoute>
              }
            />

            {/* Finance & Accounting */}
            <Route
              path="/accounting"
              element={
                <ProtectedRoute
                  allowedRoles={['Admin', 'Accountant']}
                  requiredPermissions={['view-accounting-dashboard', 'view-ledger', 'view-journal-entries']}
                >
                  <AccountingDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/taxes"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Accountant']} requiredPermissions={['manage-tax-rates']}>
                  <TaxManagement />
                </ProtectedRoute>
              }
            />

            {/* Admin Only Routes */}
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={['Admin']} requiredPermissions={['manage-users']}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/roles"
              element={
                <ProtectedRoute allowedRoles={['Admin']} requiredPermissions={['manage-roles']}>
                  <RolePermissionManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/audit"
              element={
                <ProtectedRoute allowedRoles={['Admin']} requiredPermissions={['view-audit-logs']}>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />

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
