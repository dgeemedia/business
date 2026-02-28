// frontend/src/services/ratingService.js
import api from './api';

const ratingService = {
  // ── Public: rate a product (phone-verified) ──────────────────────────────
  // ratingData = { phone, rating, comment? }
  submitRating: async (productId, ratingData) => {
    const response = await api.post(`/api/products/${productId}/ratings`, ratingData);
    return response.data;
  },

  // ── Public: get all ratings for a product ────────────────────────────────
  getProductRatings: async (productId, params = {}) => {
    const response = await api.get(`/api/products/${productId}/ratings`, { params });
    return response.data;
  },

  // ── Public: check whether a phone number can rate a product ─────────────
  // Returns { canRate, hasRated, rating }
  canRate: async (productId, phone) => {
    const response = await api.get(`/api/products/${productId}/can-rate`, {
      params: { phone },
    });
    return response.data;
  },

  // ── Authenticated dashboard: all ratings for this business ───────────────
  getBusinessRatings: async () => {
    const response = await api.get('/api/ratings');
    return response.data;
  },

  // ── Backwards-compat alias ────────────────────────────────────────────────
  getProductAverage: async (productId) => {
    const data = await ratingService.getProductRatings(productId, { limit: 1 });
    return { averageRating: data.averageRating, totalRatings: data.totalRatings };
  },
};

export default ratingService;