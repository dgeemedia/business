// frontend/src/App.jsx - COMPLETE WITH ALL ROUTES
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
import Users from './pages/Users';
import Staff from './pages/Staff';
import Reviews from './pages/Reviews';
import Settings from './pages/Settings';

// Super Admin Pages
import SuperAdminDashboard from './pages/super-admin/Dashboard';
import SuperAdminBusinesses from './pages/super-admin/Businesses';
import BusinessRequests from './pages/super-admin/Requests';
import SuperAdminSettings from './pages/super-admin/Settings';
import SuperAdminUsers from './pages/super-admin/Users';
import SuperAdminAnalytics from './pages/super-admin/Analytics';
import SuperAdminBusinessDetail from './pages/super-admin/BusinessDetail';
import SuperAdminBusinessSubscription from './pages/super-admin/BusinessSubscription';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role if specified (use lowercase 'super-admin')
  if (requiredRole && user?.role !== requiredRole) {
    // Redirect to appropriate dashboard based on role
    if (user?.role === 'super-admin') {
      return <Navigate to="/super-admin/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated) {
    // Redirect based on role (use lowercase 'super-admin')
    if (user?.role === 'super-admin') {
      return <Navigate to="/super-admin/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  const subdomain = getSubdomain();

  // If on a business subdomain, show storefront or dashboard
  if (subdomain && subdomain !== 'www') {
    return (
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#363636',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />

        <Routes>
          {/* Public Storefront */}
          <Route path="/" element={<BusinessStorefront />} />
          
          {/* Login for business owner/staff */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          {/* Dashboard routes for business owners/staff */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="orders" element={<Orders />} />
            <Route path="users" element={<Users />} />
            <Route path="staff" element={<Staff />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  // Main domain - show main landing and super-admin routes
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#363636',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<MainLanding />} />
        
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* Super Admin Routes */}
        <Route
          path="/super-admin"
          element={
            <ProtectedRoute requiredRole="super-admin">
              <SuperAdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<SuperAdminDashboard />} />
          <Route path="businesses" element={<SuperAdminBusinesses />} />
          <Route path="businesses/create" element={<SuperAdminBusinesses />} />
          
          <Route path="businesses/:id" element={<SuperAdminBusinessDetail />} />
          <Route path="businesses/:id/subscription" element={<SuperAdminBusinessSubscription />} />

          <Route path="requests" element={<BusinessRequests />} />
          <Route path="settings" element={<SuperAdminSettings />} />
          <Route path="users" element={<SuperAdminUsers />} />
          <Route path="admins" element={<SuperAdminUsers />} />
          <Route path="analytics" element={<SuperAdminAnalytics />} />
          <Route path="subscriptions" element={<SuperAdminBusinesses />} />
        </Route>

        {/* Regular Dashboard Routes (for admins/staff on main domain) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="orders" element={<Orders />} />
          <Route path="users" element={<Users />} />
          <Route path="staff" element={<Staff />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;