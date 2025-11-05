import api from '../api';

export const sparePartsService = {
  // Get all spare parts
  getAll: async () => {
    const response = await api.get('/spare-parts');
    return response.data.data || [];
  },

  // Get spare part by ID
  getById: async (id) => {
    const response = await api.get(`/spare-parts/${id}`);
    return response.data.data;
  },

  // Create new spare part
  create: async (sparePartData) => {
    const response = await api.post('/spare-parts', sparePartData);
    return response.data.data;
  },

  // Update spare part
  update: async (id, sparePartData) => {
    const response = await api.put(`/spare-parts/${id}`, sparePartData);
    return response.data.data;
  },

  // Delete spare part
  delete: async (id) => {
    const response = await api.delete(`/spare-parts/${id}`);
    return response.data;
  },

  // Update stock
  updateStock: async (id, stockData) => {
    const response = await api.put(`/spare-parts/${id}/stock`, stockData);
    return response.data.data;
  },

  // Get spare parts by category
  // Get spare parts by category (uses `category` query param expected by backend)
  getByCategory: async (category) => {
    const response = await api.get(`/spare-parts?category=${encodeURIComponent(category)}`);
    return response.data.data;
  },

  // Get low stock spare parts
  getLowStock: async () => {
    // Backend treats lowStock as a flag and will perform server-side/JS-side filtering when requested.
    const response = await api.get(`/spare-parts?lowStock=true`);
    return response.data.data;
  }
};

export default sparePartsService;