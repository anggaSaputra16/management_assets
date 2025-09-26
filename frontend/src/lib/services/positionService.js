import api from '../api';

export const positionService = {
  // Get all positions (auto-filtered by company_id in backend)
  getAll: async () => {
    const response = await api.get('/positions');
    return response.data.data; // Extract data from API response
  },

  // Get position by ID
  getById: async (id) => {
    const response = await api.get(`/positions/${id}`);
    return response.data.data; // Extract data from API response
  },

  // Create new position (companyId injected by backend)
  create: async (positionData) => {
    const response = await api.post('/positions', positionData);
    return response.data.data; // Extract data from API response
  },

  // Update position (companyId maintained by backend)
  update: async (id, positionData) => {
    const response = await api.put(`/positions/${id}`, positionData);
    return response.data.data; // Extract data from API response
  },

  // Delete position
  delete: async (id) => {
    const response = await api.delete(`/positions/${id}`);
    return response.data; // Delete returns success message only
  },

  // Get positions by level
  getByLevel: async (level) => {
    const response = await api.get(`/positions?level=${level}`);
    return response.data.data;
  }
};

export default positionService;