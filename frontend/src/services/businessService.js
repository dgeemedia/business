// frontend/src/services/businessService.js
import api from './api';

const businessService = {
  // Get current business info
  getCurrentBusiness: async () => {
    const response = await api.get('/api/business/current');
    return response.data;
  },

  // Get all businesses (super admin only)
  getAllBusinesses: async () => {
    const response = await api.get('/api/business/all');
    return response.data;
  },

  // Create new business (super admin only)
  createBusiness: async (businessData) => {
    const response = await api.post('/api/business/create', businessData);
    return response.data;
  },

  // Update business
  updateBusiness: async (businessId, data) => {
    const response = await api.put(`/api/business/${businessId}`, data);
    return response.data;
  },

  // Update subscription
  updateSubscription: async (businessId, subscriptionData) => {
    const response = await api.put(`/api/business/${businessId}/subscription`, subscriptionData);
    return response.data;
  },

  // Suspend business
  suspendBusiness: async (businessId) => {
    const response = await api.post(`/api/business/${businessId}/suspend`);
    return response.data;
  },

  // Activate business
  activateBusiness: async (businessId) => {
    const response = await api.post(`/api/business/${businessId}/activate`);
    return response.data;
  },

  // Delete business
  deleteBusiness: async (businessId) => {
    const response = await api.delete(`/api/business/${businessId}`);
    return response.data;
  },

  // Get business stats
  getBusinessStats: async (businessId) => {
    const response = await api.get(`/api/business/${businessId}/stats`);
    return response.data;
  },
};

export default businessService;