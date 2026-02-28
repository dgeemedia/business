// frontend/src/App.jsx

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './stores/authStore';
import { getSubdomain } from './services/api';

// Layouts
import DashboardLayout from './components/layouts/DashboardLayout';
import SuperAdminLayout from './components/layouts/SuperAdminLayout';

// Public Pages
import MainLanding from './pages/public/MainLanding';
import BusinessStorefront from './pages/public/BusinessStorefront';

// Auth Pages
import Login from './components/auth/Login';

// Business Dashboard Pages
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Users from './pages/Users';           // ✅ Now covers Users + Staff
import Reviews from './pages/Reviews';
import Settings from './pages/Settings';
import Subscription from './pages/Subscription'; // ✅ NEW

// Super Admin Pages
import SuperAdminDashboard from './pages/super-admin/Dashboard';
import SuperAdminBusinesses from './pages/super-admin/Businesses';
import BusinessRequests from './pages/super-admin/Requests';
import SuperAdminSettings from './pages/super-admin/Settings';
import SuperAdminUsers from './pages/super-admin/Users';
import SuperAdminAnalytics from './pages/super-admin/Analytics';
import SuperAdminBusinessDetail from './pages/super-admin/BusinessDetail';
import SuperAdminBusinessSubscription from './pages/super-admin/BusinessSubscription';

const toastConfig = {
  duration: 4000,
  style: {
    background: '#fff',
    color: '#363636',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
  error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
};

// ── Protected Route ───────────────────────────────────────────────────────────
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (requiredRole && user?.role !== requiredRole) {
    if (user?.role === 'super-admin') return <Navigate to="/super-admin/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// ── Public Route ─────────────────────────────────────────────────────────────
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated) {
    if (user?.role === 'super-admin') return <Navigate to="/super-admin/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// ── Dashboard Routes (reused for both subdomain and main domain) ──────────────
const DashboardRoutes = () => (
  <Route
    path="/dashboard"
    element={
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    }
  >
    <Route index              element={<Dashboard />}    />
    <Route path="products"    element={<Products />}     />
    <Route path="orders"      element={<Orders />}       />
    <Route path="users"       element={<Users />}        />
    {/* staff route kept as redirect to users for backwards compatibility */}
    <Route path="staff"       element={<Navigate to="/dashboard/users" replace />} />
    <Route path="reviews"     element={<Reviews />}      />
    <Route path="settings"    element={<Settings />}     />
    <Route path="subscription" element={<Subscription />} /> {/* ✅ NEW */}
  </Route>
);

function App() {
  const subdomain = getSubdomain();

  // ── Subdomain (business storefront) ────────────────────────────────────────
  if (subdomain && subdomain !== 'www') {
    return (
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={toastConfig} />
        <Routes>
          <Route path="/" element={<BusinessStorefront />} />
          <Route
            path="/login"
            element={<PublicRoute><Login /></PublicRoute>}
          />
          <Route
            path="/dashboard"
            element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}
          >
            <Route index              element={<Dashboard />}    />
            <Route path="products"    element={<Products />}     />
            <Route path="orders"      element={<Orders />}       />
            <Route path="users"       element={<Users />}        />
            <Route path="staff"       element={<Navigate to="/dashboard/users" replace />} />
            <Route path="reviews"     element={<Reviews />}      />
            <Route path="settings"    element={<Settings />}     />
            <Route path="subscription" element={<Subscription />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  // ── Main domain ─────────────────────────────────────────────────────────────
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={toastConfig} />
      <Routes>
        {/* Public */}
        <Route path="/" element={<MainLanding />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

        {/* Super Admin */}
        <Route
          path="/super-admin"
          element={<ProtectedRoute requiredRole="super-admin"><SuperAdminLayout /></ProtectedRoute>}
        >
          <Route path="dashboard"                      element={<SuperAdminDashboard />}         />
          <Route path="businesses"                     element={<SuperAdminBusinesses />}        />
          <Route path="businesses/create"              element={<SuperAdminBusinesses />}        />
          <Route path="businesses/:id"                 element={<SuperAdminBusinessDetail />}    />
          <Route path="businesses/:id/subscription"    element={<SuperAdminBusinessSubscription />} />
          <Route path="requests"                       element={<BusinessRequests />}            />
          <Route path="settings"                       element={<SuperAdminSettings />}          />
          <Route path="users"                          element={<SuperAdminUsers />}             />
          <Route path="admins"                         element={<SuperAdminUsers />}             />
          <Route path="analytics"                      element={<SuperAdminAnalytics />}         />
          <Route path="subscriptions"                  element={<SuperAdminBusinesses />}        />
        </Route>

        {/* Business Dashboard (main domain) */}
        <Route
          path="/dashboard"
          element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}
        >
          <Route index              element={<Dashboard />}    />
          <Route path="products"    element={<Products />}     />
          <Route path="orders"      element={<Orders />}       />
          <Route path="users"       element={<Users />}        />
          <Route path="staff"       element={<Navigate to="/dashboard/users" replace />} />
          <Route path="reviews"     element={<Reviews />}      />
          <Route path="settings"    element={<Settings />}     />
          <Route path="subscription" element={<Subscription />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;