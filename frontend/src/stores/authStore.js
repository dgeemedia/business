// frontend/src/stores/authStore.js
import { create } from 'zustand';
import authService from '../services/authService';

const useAuthStore = create((set, get) => ({
  user: authService.getCurrentUser(),
  isAuthenticated: authService.isAuthenticated(),
  loading: false,

  // Login action
  login: async (credentials) => {
    set({ loading: true });
    try {
      const data = await authService.login(credentials);
      set({
        user: data.user,
        isAuthenticated: true,
        loading: false,
      });
      return data;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  // Register action
  register: async (userData) => {
    set({ loading: true });
    try {
      const data = await authService.register(userData);
      set({
        user: data.user,
        isAuthenticated: true,
        loading: false,
      });
      return data;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  // Logout action
  logout: () => {
    authService.logout();
    set({
      user: null,
      isAuthenticated: false,
    });
  },

  // Refresh user data
  refreshUser: async () => {
    try {
      const user = await authService.refreshUser();
      if (user) {
        set({ user });
      }
      return user;
    } catch (error) {
      console.error('Failed to refresh user:', error);
      return null;
    }
  },

  // Update user in store
  updateUser: (userData) => {
    const currentUser = get().user;
    const updatedUser = { ...currentUser, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },

  // Check permissions
  hasRole: (role) => {
    const user = get().user;
    return user?.role === role;
  },

  isAdmin: () => {
    const user = get().user;
    return user?.role === 'admin' || user?.role === 'super-admin';
  },

  isSuperAdmin: () => {
    const user = get().user;
    return user?.role === 'super-admin';
  },
}));

export default useAuthStore;