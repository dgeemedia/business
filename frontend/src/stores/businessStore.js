// frontend/src/stores/businessStore.js
import { create } from 'zustand';
import businessService from '../services/businessService';

const useBusinessStore = create((set, get) => ({
  currentBusiness: null,
  businesses: [],
  loading: false,
  stats: null,

  // Fetch current business
  fetchCurrentBusiness: async () => {
    set({ loading: true });
    try {
      const business = await businessService.getCurrentBusiness();
      set({ currentBusiness: business, loading: false });
      return business;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  // Fetch all businesses (super admin)
  fetchAllBusinesses: async () => {
    set({ loading: true });
    try {
      const businesses = await businessService.getAllBusinesses();
      set({ businesses, loading: false });
      return businesses;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  // Create business
  createBusiness: async (businessData) => {
    try {
      const newBusiness = await businessService.createBusiness(businessData);
      const currentBusinesses = get().businesses;
      set({ businesses: [...currentBusinesses, newBusiness] });
      return newBusiness;
    } catch (error) {
      throw error;
    }
  },

  // Update business
  updateBusiness: async (businessId, data) => {
    try {
      const updatedBusiness = await businessService.updateBusiness(businessId, data);
      
      // Update in current business if it's the same
      if (get().currentBusiness?.id === businessId) {
        set({ currentBusiness: updatedBusiness });
      }

      // Update in businesses list
      const businesses = get().businesses.map((b) =>
        b.id === businessId ? updatedBusiness : b
      );
      set({ businesses });

      return updatedBusiness;
    } catch (error) {
      throw error;
    }
  },

  // Update subscription
  updateSubscription: async (businessId, subscriptionData) => {
    try {
      const result = await businessService.updateSubscription(businessId, subscriptionData);
      await get().fetchCurrentBusiness();
      return result;
    } catch (error) {
      throw error;
    }
  },

  // Suspend business
  suspendBusiness: async (businessId) => {
    try {
      await businessService.suspendBusiness(businessId);
      await get().fetchAllBusinesses();
    } catch (error) {
      throw error;
    }
  },

  // Activate business
  activateBusiness: async (businessId) => {
    try {
      await businessService.activateBusiness(businessId);
      await get().fetchAllBusinesses();
    } catch (error) {
      throw error;
    }
  },

  // Fetch business stats
  fetchBusinessStats: async (businessId) => {
    try {
      const stats = await businessService.getBusinessStats(businessId);
      set({ stats });
      return stats;
    } catch (error) {
      throw error;
    }
  },

  // Check if business is active
  isBusinessActive: () => {
    const business = get().currentBusiness;
    return business?.status === 'ACTIVE';
  },

  // Check subscription status
  hasActiveSubscription: () => {
    const business = get().currentBusiness;
    if (!business?.subscriptionEndsAt) return false;
    
    const endDate = new Date(business.subscriptionEndsAt);
    const now = new Date();
    return endDate > now;
  },
}));

export default useBusinessStore;