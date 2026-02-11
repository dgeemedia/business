// frontend/src/services/orderService.js
import api from './api';

const orderService = {
  // Get all orders
  getOrders: async (params = {}) => {
    const response = await api.get('/api/orders', { params });
    return response.data;
  },

  // Get single order
  getOrder: async (id) => {
    const response = await api.get(`/api/orders/${id}`);
    return response.data;
  },

  // Create order
  createOrder: async (orderData) => {
    const response = await api.post('/api/orders', orderData);
    return response.data;
  },

  // Update order status
  updateOrderStatus: async (id, status) => {
    const response = await api.patch(`/api/orders/${id}/status`, { status });
    return response.data;
  },

  // Cancel order
  cancelOrder: async (id) => {
    const response = await api.patch(`/api/orders/${id}/cancel`);
    return response.data;
  },

  // Get order statistics
  getOrderStats: async (params = {}) => {
    const response = await api.get('/api/orders/stats', { params });
    return response.data;
  },

  // Get revenue data
  getRevenueData: async (params = {}) => {
    const response = await api.get('/api/orders/revenue', { params });
    return response.data;
  },
};

export default orderService;