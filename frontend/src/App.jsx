// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './stores/authStore';
import { getSubdomain } from './services/api';

// Layouts
import DashboardLayout from './components/layouts/DashboardLayout';

// Public Pages
import MainLanding from './pages/public/MainLanding';
import BusinessStorefront from './pages/public/BusinessStorefront';

// Auth Pages
import Login from './components/auth/Login';

// Dashboard Pages
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Staff from './pages/Staff';
import Reviews from './pages/Reviews';
import Settings from './pages/Settings';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

// Public Route Component
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  const subdomain = getSubdomain();

  // If on a business subdomain, show storefront
  if (subdomain && subdomain !== 'www' && !window.location.pathname.includes('/dashboard')) {
    return (
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<BusinessStorefront />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          
          {/* Dashboard routes for business owners/staff */}
          <Route path="/dashboard/*" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="orders" element={<Orders />} />
            <Route path="staff" element={<Staff />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    );
  }

  // Main domain - show main landing
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<MainLanding />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="orders" element={<Orders />} />
          <Route path="staff" element={<Staff />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;