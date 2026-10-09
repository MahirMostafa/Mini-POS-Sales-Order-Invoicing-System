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
import CashManagement from './pages/CashManagement';
import BankManagement from './pages/BankManagement';
import ProductCatalog from './pages/ProductCatalog';
import CategoryManagement from './pages/CategoryManagement';
import PurchaseManagement from './pages/PurchaseManagement';
import TaxManagement from './pages/TaxManagement';
import UserManagement from './pages/UserManagement';
import CustomerManagement from './pages/CustomerManagement';
import RolePermissionManagement from './pages/RolePermissionManagement';
import AuditLogs from './pages/AuditLogs';

// Standalone Accounting Report Pages
import ReportsOverview from './pages/reports/ReportsOverview';
import ChartOfAccountsPage from './pages/reports/ChartOfAccountsPage';
import CashBookReport from './pages/reports/CashBookReport';
import BankBookReport from './pages/reports/BankBookReport';
import DayBookReport from './pages/reports/DayBookReport';
import GeneralLedgerReport from './pages/reports/GeneralLedgerReport';
import JournalEntriesReport from './pages/reports/JournalEntriesReport';
import TrialBalanceReport from './pages/reports/TrialBalanceReport';
import ProfitLossReport from './pages/reports/ProfitLossReport';
import BalanceSheetReport from './pages/reports/BalanceSheetReport';

import { Loader2, ShieldAlert } from 'lucide-react';

function ProtectedRoute({ children, requiredPermissions = [] }) {
  const { user, role, hasPermission } = useAuth();

  if (!user) {
    return <LoginPage />;
  }

  const hasAccess = hasPermission(requiredPermissions);

  if (!hasAccess) {
    const defaultFallback = hasPermission(['view-pos']) ? '/pos' : (hasPermission(['view-accounting-dashboard']) ? '/accounts/reports' : '/pos');
    return (
      <div className="p-8 max-w-xl mx-auto my-12 bg-white rounded-3xl border border-rose-200 shadow-xl text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-slate-900">Access Denied (RBAC Restricted)</h2>
        <p className="text-xs text-slate-500">
          Your current account does not have the required Spatie permission to view or perform operations in this module.
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  };

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
  const defaultPath = userRole === 'Accountant' ? '/accounts/reports' : '/pos';

  return (
    <div className="min-h-screen bg-slate-50 flex selection:bg-indigo-500 selection:text-white">
      {/* Left Modern Collapsible Sidebar */}
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={toggleSidebarCollapse}
      />

      {/* Main Content Layout */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
        }`}
      >
        {/* Top Header */}
        <Header
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
        />

        {/* Dynamic Page Views with Protected Spatie Routes */}
        <main className="flex-1 pb-12 px-4 sm:px-6 lg:px-8 pt-6 max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/" element={<Navigate to={defaultPath} replace />} />

            {/* POS & Sales Routes */}
            <Route
              path="/pos"
              element={
                <ProtectedRoute requiredPermissions={['view-pos']}>
                  <PosTerminal />
                </ProtectedRoute>
              }
            />

            <Route
              path="/orders"
              element={
                <ProtectedRoute requiredPermissions={['create-order', 'complete-order']}>
                  <OrdersList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/orders/:id"
              element={
                <ProtectedRoute requiredPermissions={['create-order', 'complete-order']}>
                  <OrderDetails />
                </ProtectedRoute>
              }
            />

            <Route
              path="/invoices"
              element={
                <ProtectedRoute requiredPermissions={['view-invoices', 'print-invoices']}>
                  <InvoicePreview />
                </ProtectedRoute>
              }
            />

            <Route
              path="/invoices/:id"
              element={
                <ProtectedRoute requiredPermissions={['view-invoices', 'print-invoices']}>
                  <InvoicePreview />
                </ProtectedRoute>
              }
            />

            <Route
              path="/customers"
              element={
                <ProtectedRoute requiredPermissions={['view-customers', 'manage-customers']}>
                  <CustomerManagement />
                </ProtectedRoute>
              }
            />

            {/* Inventory & Purchasing */}
            <Route
              path="/categories"
              element={
                <ProtectedRoute requiredPermissions={['manage-categories', 'view-categories']}>
                  <CategoryManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/products"
              element={
                <ProtectedRoute requiredPermissions={['manage-products']}>
                  <ProductCatalog />
                </ProtectedRoute>
              }
            />

            <Route
              path="/purchases"
              element={
                <ProtectedRoute requiredPermissions={['manage-purchases', 'receive-purchases']}>
                  <PurchaseManagement />
                </ProtectedRoute>
              }
            />

            {/* Accounts, Cash & Bank Routes */}
            <Route
              path="/accounts/cash"
              element={
                <ProtectedRoute requiredPermissions={['view-cash-book', 'manage-cash-book']}>
                  <CashManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/cash"
              element={<Navigate to="/accounts/cash" replace />}
            />

            <Route
              path="/accounts/banks"
              element={
                <ProtectedRoute requiredPermissions={['view-banks', 'view-bank-book', 'manage-banks']}>
                  <BankManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/banks"
              element={<Navigate to="/accounts/banks" replace />}
            />

            {/* Standalone Separate Accounting Report Pages */}
            <Route
              path="/accounts/reports"
              element={
                <ProtectedRoute requiredPermissions={['view-accounting-dashboard', 'view-chart-of-accounts', 'view-cash-book', 'view-bank-book', 'view-day-book', 'view-ledger', 'view-journal-entries', 'view-trial-balance', 'view-profit-loss', 'view-balance-sheet']}>
                  <ReportsOverview />
                </ProtectedRoute>
              }
            />

            <Route
              path="/accounts/reports/chart-of-accounts"
              element={
                <ProtectedRoute requiredPermissions={['view-chart-of-accounts', 'manage-chart-of-accounts', 'view-accounting-dashboard']}>
                  <ChartOfAccountsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/accounts/reports/cash-book"
              element={
                <ProtectedRoute requiredPermissions={['view-cash-book', 'manage-cash-book', 'view-accounting-dashboard']}>
                  <CashBookReport />
                </ProtectedRoute>
              }
            />

            <Route
              path="/accounts/reports/bank-book"
              element={
                <ProtectedRoute requiredPermissions={['view-bank-book', 'view-banks', 'manage-banks', 'view-accounting-dashboard']}>
                  <BankBookReport />
                </ProtectedRoute>
              }
            />

            <Route
              path="/accounts/reports/day-book"
              element={
                <ProtectedRoute requiredPermissions={['view-day-book', 'view-accounting-dashboard']}>
                  <DayBookReport />
                </ProtectedRoute>
              }
            />

            <Route
              path="/accounts/reports/general-ledger"
              element={
                <ProtectedRoute requiredPermissions={['view-ledger', 'view-accounting-dashboard']}>
                  <GeneralLedgerReport />
                </ProtectedRoute>
              }
            />

            <Route
              path="/accounts/reports/journal-entries"
              element={
                <ProtectedRoute requiredPermissions={['view-journal-entries', 'view-accounting-dashboard']}>
                  <JournalEntriesReport />
                </ProtectedRoute>
              }
            />

            <Route
              path="/accounts/reports/trial-balance"
              element={
                <ProtectedRoute requiredPermissions={['view-trial-balance', 'view-accounting-dashboard']}>
                  <TrialBalanceReport />
                </ProtectedRoute>
              }
            />

            <Route
              path="/accounts/reports/profit-loss"
              element={
                <ProtectedRoute requiredPermissions={['view-profit-loss', 'view-accounting-dashboard']}>
                  <ProfitLossReport />
                </ProtectedRoute>
              }
            />

            <Route
              path="/accounts/reports/balance-sheet"
              element={
                <ProtectedRoute requiredPermissions={['view-balance-sheet', 'view-accounting-dashboard']}>
                  <BalanceSheetReport />
                </ProtectedRoute>
              }
            />

            {/* Quick Redirects & Aliases */}
            <Route path="/accounting" element={<Navigate to="/accounts/reports" replace />} />
            <Route path="/accounts/chart-of-accounts" element={<Navigate to="/accounts/reports/chart-of-accounts" replace />} />
            <Route path="/accounts/cash-book" element={<Navigate to="/accounts/reports/cash-book" replace />} />
            <Route path="/accounts/bank-book" element={<Navigate to="/accounts/reports/bank-book" replace />} />
            <Route path="/accounts/day-book" element={<Navigate to="/accounts/reports/day-book" replace />} />
            <Route path="/accounts/general-ledger" element={<Navigate to="/accounts/reports/general-ledger" replace />} />
            <Route path="/accounts/ledger" element={<Navigate to="/accounts/reports/general-ledger" replace />} />
            <Route path="/accounts/journal-entries" element={<Navigate to="/accounts/reports/journal-entries" replace />} />
            <Route path="/accounts/trial-balance" element={<Navigate to="/accounts/reports/trial-balance" replace />} />
            <Route path="/accounts/profit-loss" element={<Navigate to="/accounts/reports/profit-loss" replace />} />
            <Route path="/accounts/balance-sheet" element={<Navigate to="/accounts/reports/balance-sheet" replace />} />

            <Route
              path="/taxes"
              element={
                <ProtectedRoute requiredPermissions={['manage-tax-rates']}>
                  <TaxManagement />
                </ProtectedRoute>
              }
            />

            {/* Administration Routes */}
            <Route
              path="/users"
              element={
                <ProtectedRoute requiredPermissions={['manage-users']}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/roles"
              element={
                <ProtectedRoute requiredPermissions={['manage-roles']}>
                  <RolePermissionManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/audit"
              element={
                <ProtectedRoute requiredPermissions={['view-audit-logs']}>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to={defaultPath} replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DashboardLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}

const rootElement = document.getElementById('root') || document.getElementById('app');
if (rootElement) {
  createRoot(rootElement).render(<App />);
}
