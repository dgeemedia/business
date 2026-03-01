// frontend/src/services/api.js
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_API_URL || '');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          toast.error('Session expired. Please login again.');
          break;

        case 403:
          // ✅ Subscription/trial expiry — redirect to subscription page
          if (
            data?.code === 'TRIAL_EXPIRED' ||
            data?.code === 'SUBSCRIPTION_EXPIRED' ||
            data?.code === 'SUSPENDED'
          ) {
            toast.error(data.error || 'Your subscription has expired.');
            if (window.location.pathname !== '/subscription') {
              window.location.href = '/subscription';
            }
          } else {
            toast.error('You do not have permission to perform this action.');
          }
          break;

        case 404:
          // Don't toast on 404 — BusinessStorefront handles this with a redirect
          break;

        case 422:
          if (data.errors) {
            Object.values(data.errors).forEach((err) => toast.error(err));
          } else {
            toast.error(data.error || 'Validation error.');
          }
          break;

        case 500:
          toast.error('Server error. Please try again later.');
          break;

        case 503:
          // Business suspended — handled by the page, not a toast
          break;

        default:
          toast.error(data.error || 'An error occurred.');
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// SUBDOMAIN DETECTION
// ✅ Kept for any legacy use but no longer called by the storefront or App.jsx
// ============================================================================
export const getSubdomain = () => {
  const hostname = window.location.hostname;
  if (!hostname) return null;

  if (hostname.includes('localhost')) {
    const parts = hostname.split('.');
    if (parts.length === 1) return null;
    if (parts.length === 2 && parts[1] === 'localhost') {
      const sub = parts[0].toLowerCase();
      return ['www', 'admin', 'app', 'api'].includes(sub) ? null : sub;
    }
    return null;
  }

  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return null;
  if (hostname.endsWith('vercel.app')) return null;

  const ROOT_DOMAIN = import.meta.env.VITE_ROOT_DOMAIN || 'mypadifood.com';
  if (hostname.endsWith(ROOT_DOMAIN)) {
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      const sub = parts[0].toLowerCase();
      return ['www', 'admin', 'app', 'api'].includes(sub) ? null : sub;
    }
    return null;
  }

  return null;
};

// ============================================================================
// BUILD STORE URL
// ✅ NOW PATH-BASED: mypadifood.com/store/gee-store (works on free tier)
// Previously: gee-store.mypadifood.com (required wildcard DNS / paid tier)
// ============================================================================
export const buildSubdomainUrl = (slug) => {
  if (import.meta.env.DEV) {
    return `http://localhost:${window.location.port || 3000}/store/${slug}`;
  }
  const ROOT_DOMAIN = import.meta.env.VITE_ROOT_DOMAIN || 'mypadifood.com';
  return `https://www.${ROOT_DOMAIN}/store/${slug}`;
};

export default api;