// frontend/src/services/api.js
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add subdomain to headers if available
    const subdomain = getSubdomain();
    if (subdomain && subdomain !== 'www') {
      config.headers['X-Business-Subdomain'] = subdomain;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          toast.error('Session expired. Please login again.');
          break;

        case 403:
          toast.error('You do not have permission to perform this action.');
          break;

        case 404:
          toast.error('Resource not found.');
          break;

        case 422:
          // Validation errors
          if (data.errors) {
            Object.values(data.errors).forEach((error) => {
              toast.error(error);
            });
          } else {
            toast.error(data.error || 'Validation error.');
          }
          break;

        case 500:
          toast.error('Server error. Please try again later.');
          break;

        default:
          toast.error(data.error || 'An error occurred.');
      }
    } else if (error.request) {
      // Network error
      toast.error('Network error. Please check your connection.');
    }

    return Promise.reject(error);
  }
);

// Utility function to get subdomain
export const getSubdomain = () => {
  // In development, use env variable
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_SUBDOMAIN || null;
  }

  // In production, extract from hostname
  const hostname = window.location.hostname;
  const parts = hostname.split('.');

  // Handle localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null;
  }

  // Check if we have a subdomain
  // Example: business1.mypadibusiness.com -> business1
  if (parts.length >= 3) {
    return parts[0];
  }

  return null;
};

// Helper function to build full URL with subdomain
export const buildSubdomainUrl = (subdomain) => {
  if (import.meta.env.DEV) {
    return window.location.origin;
  }

  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  
  if (parts.length >= 2) {
    const domain = parts.slice(-2).join('.');
    return `${window.location.protocol}//${subdomain}.${domain}`;
  }

  return window.location.origin;
};

export default api;