import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/common/protected/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

// Pages
import Login from './pages/login/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Customers from './pages/customers/Customers';
import Products from './pages/products/Products';
import Purchases from './pages/purchases/Purchases';
import Quotations from './pages/quotations/Quotations';
import Invoices from './pages/invoices/Invoices';
import Receipts from './pages/receipts/Receipts';
import VatReports from './pages/vat/VatReports';
import UserManagement from './pages/users/UserManagement';
import Profile from './pages/profile/Profile';
import TermsConditions from './pages/legal/TermsConditions';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import DeleteAccount from './pages/legal/DeleteAccount';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Auth Route */}
            <Route path="/login" element={<Login />} />
            <Route path="/legal/terms" element={<TermsConditions />} />
            <Route path="/legal/privacy" element={<PrivacyPolicy />} />
            <Route path="/legal/delete-account" element={<DeleteAccount />} />

            {/* Protected Application Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />

              <Route
                path="customers"
                element={
                  <ProtectedRoute requiredModule="customers" requiredAction="view">
                    <Customers />
                  </ProtectedRoute>
                }
              />

              <Route
                path="products"
                element={
                  <ProtectedRoute requiredModule="products" requiredAction="view">
                    <Products />
                  </ProtectedRoute>
                }
              />

              <Route
                path="purchases"
                element={
                  <ProtectedRoute requiredModule="purchase" requiredAction="view">
                    <Purchases />
                  </ProtectedRoute>
                }
              />

              <Route
                path="quotations"
                element={
                  <ProtectedRoute requiredModule="quotations" requiredAction="view">
                    <Quotations />
                  </ProtectedRoute>
                }
              />

              <Route
                path="invoices"
                element={
                  <ProtectedRoute requiredModule="sales" requiredAction="view">
                    <Invoices />
                  </ProtectedRoute>
                }
              />

              <Route
                path="receipts"
                element={
                  <ProtectedRoute requiredModule="receipts" requiredAction="view">
                    <Receipts />
                  </ProtectedRoute>
                }
              />

              <Route
                path="vat"
                element={
                  <ProtectedRoute requiredModule="vat" requiredAction="report">
                    <VatReports />
                  </ProtectedRoute>
                }
              />

              <Route
                path="users"
                element={
                  <ProtectedRoute adminOnly>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />

              <Route path="profile" element={<Profile />} />
              <Route path="terms" element={<TermsConditions />} />
              <Route path="privacy" element={<PrivacyPolicy />} />
              <Route path="delete-account" element={<DeleteAccount />} />
            </Route>

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
