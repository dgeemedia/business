// frontend/src/services/staffService.js
import api from './api';

const staffService = {
  getAllStaff: async () => {
    const response = await api.get('/api/users/staff');
    return response.data;
  },

  createStaff: async (staffData) => {
    const response = await api.post('/api/users/staff', staffData);
    return response.data;
  },

  updateStaff: async (userId, staffData) => {
    const response = await api.put(`/api/users/staff/${userId}`, staffData);
    return response.data;
  },

  deleteStaff: async (userId) => {
    const response = await api.delete(`/api/users/staff/${userId}`);
    return response.data;
  },

  toggleStaffStatus: async (userId) => {
    const response = await api.patch(`/api/users/staff/${userId}/toggle`);
    return response.data;
  },
};

export default staffService;