// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './stores/authStore';

// Layouts
import DashboardLayout  from './components/layouts/DashboardLayout';
import SuperAdminLayout from './components/layouts/SuperAdminLayout';

// Public Pages
import MainLanding       from './pages/public/MainLanding';
import BusinessStorefront from './pages/public/BusinessStorefront';

// Auth Pages
import Login from './components/auth/Login';

// Business Dashboard Pages
import Dashboard    from './pages/Dashboard';
import Products     from './pages/Products';
import Orders       from './pages/Orders';
import Users        from './pages/Users';
import Reviews      from './pages/Reviews';
import Ratings      from './pages/Ratings';
import Settings     from './pages/Settings';
import Subscription from './pages/Subscription';

// Super Admin Pages
import SuperAdminDashboard            from './pages/super-admin/Dashboard';
import SuperAdminBusinesses           from './pages/super-admin/Businesses';
import BusinessRequests               from './pages/super-admin/Requests';
import SuperAdminSettings             from './pages/super-admin/Settings';
import SuperAdminUsers                from './pages/super-admin/Users';
import SuperAdminAnalytics            from './pages/super-admin/Analytics';
import SuperAdminBusinessDetail       from './pages/super-admin/BusinessDetail';
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
// ✅ Passes location.state.from so Login.jsx can redirect the user back
// to the page they were trying to visit before being sent to /login.
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    if (user?.role === 'super-admin') return <Navigate to="/super-admin/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// ── Public Route ──────────────────────────────────────────────────────────────
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated) {
    if (user?.role === 'super-admin') return <Navigate to="/super-admin/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// ✅ SIMPLIFIED: Single flat router — no more subdomain branch splitting.
// Storefront is now at /store/:slug instead of a separate subdomain.
// This works on Vercel free tier + Render free tier with zero DNS tricks.
function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={toastConfig} />
      <Routes>

        {/* ── Public ───────────────────────────────────────────────────── */}
        <Route path="/" element={<MainLanding />} />

        {/* ✅ NEW: Path-based storefront — was gee-store.mypadifood.com,
            now mypadifood.com/store/gee-store */}
        <Route path="/store/:slug" element={<BusinessStorefront />} />

        <Route
          path="/login"
          element={<PublicRoute><Login /></PublicRoute>}
        />

        {/* ── Super Admin ───────────────────────────────────────────────── */}
        <Route
          path="/super-admin"
          element={
            <ProtectedRoute requiredRole="super-admin">
              <SuperAdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard"                   element={<SuperAdminDashboard />}            />
          <Route path="businesses"                  element={<SuperAdminBusinesses />}           />
          <Route path="businesses/create"           element={<SuperAdminBusinesses />}           />
          <Route path="businesses/:id"              element={<SuperAdminBusinessDetail />}       />
          <Route path="businesses/:id/subscription" element={<SuperAdminBusinessSubscription />} />
          <Route path="requests"                    element={<BusinessRequests />}               />
          <Route path="settings"                    element={<SuperAdminSettings />}             />
          <Route path="users"                       element={<SuperAdminUsers />}                />
          <Route path="admins"                      element={<SuperAdminUsers />}                />
          <Route path="analytics"                   element={<SuperAdminAnalytics />}            />
          <Route path="subscriptions"               element={<SuperAdminBusinesses />}           />
        </Route>

        {/* ── Business Dashboard ────────────────────────────────────────── */}
        <Route
          path="/dashboard"
          element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}
        >
          <Route index               element={<Dashboard />}    />
          <Route path="products"     element={<Products />}     />
          <Route path="orders"       element={<Orders />}       />
          <Route path="users"        element={<Users />}        />
          <Route path="staff"        element={<Navigate to="/dashboard/users" replace />} />
          <Route path="reviews"      element={<Reviews />}      />
          <Route path="ratings"      element={<Ratings />}      />
          <Route path="settings"     element={<Settings />}     />
          <Route path="subscription" element={<Subscription />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;