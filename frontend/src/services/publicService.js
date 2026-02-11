// frontend/src/services/publicService.js
import api from './api';

const publicService = {
  getAllBusinesses: async () => {
    const response = await api.get('/api/business/public/all');
    return response.data;
  },

  getBusinessPublic: async (subdomain) => {
    const response = await api.get(`/api/business/public/${subdomain}`);
    return response.data;
  },

  getPublicProducts: async (subdomain) => {
    const response = await api.get(`/api/business/public/${subdomain}/products`);
    return response.data;
  },

  createPublicOrder: async (orderData) => {
    const response = await api.post('/api/orders/public', orderData);
    return response.data;
  },
};

export default publicService;