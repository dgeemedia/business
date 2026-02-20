// frontend/src/utils/helpers.js

// ── Currency ──────────────────────────────────────────────────────────────────
// Currency symbol map — extend as needed
const CURRENCY_SYMBOLS = {
  NGN: '₦',
  USD: '$',
  EUR: '€',
  GBP: '£',
  GHS: '₵',
  KES: 'KSh',
  ZAR: 'R',
  XOF: 'CFA',
  XAF: 'FCFA',
};

/**
 * Format a number as currency.
 *
 * Usage:
 *   formatCurrency(1500)            // reads currency from localStorage (set by settings)
 *   formatCurrency(1500, 'USD')     // explicit override
 *
 * The dashboard sets localStorage['business_currency'] whenever settings load.
 * This means every page (Products, Orders, Dashboard) automatically uses the
 * same currency as the storefront without passing it around as a prop.
 */
export const formatCurrency = (amount, currency) => {
  // If no currency passed, try to read from localStorage (written by businessStore)
  const resolvedCurrency = currency || localStorage.getItem('business_currency') || 'NGN';
  const symbol = CURRENCY_SYMBOLS[resolvedCurrency] || resolvedCurrency;
  const formattedAmount = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
  return `${symbol}${formattedAmount}`;
};

// Format date
export const formatDate = (date, format = 'medium') => {
  if (!date) return '';
  const d = new Date(date);
  const formats = {
    short:  { month: 'short', day: 'numeric' },
    medium: { year: 'numeric', month: 'short', day: 'numeric' },
    long:   { year: 'numeric', month: 'long', day: 'numeric' },
    full:   { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' },
  };
  return new Intl.DateTimeFormat('en-US', formats[format]).format(d);
};

// Format relative time (e.g., "2 hours ago")
export const formatRelativeTime = (date) => {
  if (!date) return '';
  const now  = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);
  if (diffInSeconds < 60)    return 'Just now';
  if (diffInSeconds < 3600)  return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return formatDate(date, 'short');
};

export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const generateColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${hash % 360}, 70%, 50%)`;
};

export const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const isValidPhone = (phone) => {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) return cleaned.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3');
  return phone;
};

export const calculatePercentage = (value, total) => {
  if (!total || total === 0) return 0;
  return ((value / total) * 100).toFixed(1);
};

export const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

export const downloadFile = (url, filename) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => { clearTimeout(timeout); func(...args); }, wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

export const getStatusColor = (status) => {
  const colors = {
    PENDING: 'yellow', CONFIRMED: 'blue', PREPARING: 'indigo',
    READY: 'purple', DELIVERED: 'green', CANCELLED: 'red',
    ACTIVE: 'green', SUSPENDED: 'red', TRIAL: 'blue',
    PAID: 'green', UNPAID: 'yellow', FAILED: 'red',
  };
  return colors[status] || 'gray';
};

export const getStatusBadgeClass = (status) => {
  const color = getStatusColor(status);
  return `badge-${color === 'yellow' ? 'warning' : color === 'green' ? 'success' : color === 'red' ? 'danger' : 'info'}`;
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export const isImage = (filename) => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  return imageExtensions.includes(filename.split('.').pop().toLowerCase());
};

export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) result[group] = [];
    result[group].push(item);
    return result;
  }, {});
};

export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const daysUntil = (date) => {
  if (!date) return null;
  const diffTime = new Date(date) - new Date();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const isExpired = (date) => {
  if (!date) return false;
  return new Date(date) < new Date();
};

export const storage = {
  get: (key, defaultValue = null) => {
    try { const item = localStorage.getItem(key); return item ? JSON.parse(item) : defaultValue; }
    catch { return defaultValue; }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (error) { console.error('Failed to save to localStorage:', error); }
  },
  remove: (key) => {
    try { localStorage.removeItem(key); }
    catch (error) { console.error('Failed to remove from localStorage:', error); }
  },
  clear: () => {
    try { localStorage.clear(); }
    catch (error) { console.error('Failed to clear localStorage:', error); }
  },
};