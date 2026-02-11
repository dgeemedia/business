//
import api from './api';

const ratingService = {
  // Get ratings for a product
  getProductRatings: async (productId) => {
    const response = await api.get(`/api/ratings/product/${productId}`);
    return response.data;
  },

  // Submit a rating (public - uses phone number)
  submitRating: async (ratingData) => {
    const response = await api.post('/api/ratings', ratingData);
    return response.data;
  },

  // Get average rating for product
  getProductAverage: async (productId) => {
    const response = await api.get(`/api/ratings/product/${productId}/average`);
    return response.data;
  },

  // Verify if phone number can rate (has purchased)
  canRate: async (productId, phoneNumber) => {
    const response = await api.post('/api/ratings/can-rate', {
      productId,
      phoneNumber,
    });
    return response.data;
  },

  // Get all ratings for business
  getBusinessRatings: async () => {
    const response = await api.get('/api/ratings');
    return response.data;
  },
};

export default ratingService;