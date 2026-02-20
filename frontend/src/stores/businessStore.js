// frontend/src/stores/businessStore.js
import { create } from 'zustand';
import businessService from '../services/businessService';

const useBusinessStore = create((set, get) => ({
  currentBusiness: null,
  businesses: [],
  loading: false,
  stats: null,

  fetchCurrentBusiness: async () => {
    set({ loading: true });
    try {
      const business = await businessService.getCurrentBusiness();
      set({ currentBusiness: business, loading: false });

      // ✅ Write currency to localStorage so formatCurrency() picks it up
      // on every dashboard page without needing to pass it as a prop
      if (business?.currency) {
        localStorage.setItem('business_currency', business.currency);
      }

      return business;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

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

  createBusiness: async (businessData) => {
    try {
      const newBusiness = await businessService.createBusiness(businessData);
      set(state => ({ businesses: [...state.businesses, newBusiness] }));
      return newBusiness;
    } catch (error) { throw error; }
  },

  updateBusiness: async (businessId, data) => {
    try {
      const updatedBusiness = await businessService.updateBusiness(businessId, data);

      if (get().currentBusiness?.id === businessId) {
        set({ currentBusiness: updatedBusiness });
        // ✅ Also update localStorage when settings change
        if (updatedBusiness?.currency) {
          localStorage.setItem('business_currency', updatedBusiness.currency);
        }
      }

      set(state => ({
        businesses: state.businesses.map(b => b.id === businessId ? updatedBusiness : b),
      }));
      return updatedBusiness;
    } catch (error) { throw error; }
  },

  updateSubscription: async (businessId, subscriptionData) => {
    try {
      const result = await businessService.updateSubscription(businessId, subscriptionData);
      await get().fetchCurrentBusiness();
      return result;
    } catch (error) { throw error; }
  },

  suspendBusiness: async (businessId) => {
    try {
      await businessService.suspendBusiness(businessId);
      await get().fetchAllBusinesses();
    } catch (error) { throw error; }
  },

  activateBusiness: async (businessId) => {
    try {
      await businessService.activateBusiness(businessId);
      await get().fetchAllBusinesses();
    } catch (error) { throw error; }
  },

  fetchBusinessStats: async (businessId) => {
    try {
      const stats = await businessService.getBusinessStats(businessId);
      set({ stats });
      return stats;
    } catch (error) { throw error; }
  },

  isBusinessActive: () => get().currentBusiness?.status === 'ACTIVE',

  hasActiveSubscription: () => {
    const business = get().currentBusiness;
    if (!business?.subscriptionEndsAt) return false;
    return new Date(business.subscriptionEndsAt) > new Date();
  },

  // ✅ Helper: get currency for the current business
  getCurrency: () => {
    return get().currentBusiness?.currency
      || localStorage.getItem('business_currency')
      || 'NGN';
  },
}));

export default useBusinessStore;