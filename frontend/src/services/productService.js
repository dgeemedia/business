// frontend/src/services/productService.js
import api from './api';

const productService = {
  // Get all products
  getProducts: async (params = {}) => {
    const response = await api.get('/api/products', { params });
    return response.data;
  },

  // Get single product
  getProduct: async (id) => {
    const response = await api.get(`/api/products/${id}`);
    return response.data;
  },

  // Create product
  createProduct: async (productData) => {
    const response = await api.post('/api/products', productData);
    return response.data;
  },

  // Update product
  updateProduct: async (id, productData) => {
    const response = await api.put(`/api/products/${id}`, productData);
    return response.data;
  },

  // Delete product
  deleteProduct: async (id) => {
    const response = await api.delete(`/api/products/${id}`);
    return response.data;
  },

  // Toggle product availability
  toggleAvailability: async (id) => {
    const response = await api.patch(`/api/products/${id}/toggle`);
    return response.data;
  },

  // Upload product image
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await api.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get product categories
  getCategories: async () => {
    const response = await api.get('/api/products/categories');
    return response.data;
  },
};

export default productService;