// frontend/src/services/authService.js
import api from './api';

const authService = {
  // Login
  login: async (credentials) => {
    const response = await api.post('/api/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Register
  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  // Get current user
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Get user role
  getUserRole: () => {
    const user = authService.getCurrentUser();
    return user?.role || null;
  },

  // Check if super admin
  isSuperAdmin: () => {
    return authService.getUserRole() === 'super-admin';
  },

  // Check if admin
  isAdmin: () => {
    const role = authService.getUserRole();
    return role === 'admin' || role === 'super-admin';
  },

  // Refresh user data
  refreshUser: async () => {
    try {
      const response = await api.get('/api/auth/me');
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data.user;
    } catch (error) {
      console.error('Failed to refresh user:', error);
      return null;
    }
  },
};

export default authService;