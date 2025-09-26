import api from '../api';
import { useAuthStore } from '../../stores/authStore';

const getCompanyId = () => {
  const { user } = useAuthStore.getState();
  return user?.company_id;
};

export const sparePartsService = {
  // Get all spare parts (auto-filtered by company_id in backend)
  getAll: async () => {
    const response = await api.get('/spare-parts');
    return response.data;
  },

  // Get spare part by ID
  getById: async (id) => {
    const response = await api.get(`/spare-parts/${id}`);
    return response.data;
  },

  // Create new spare part
  create: async (sparePartData) => {
    const company_id = getCompanyId();
    const dataWithCompany = { ...sparePartData, company_id };
    const response = await api.post('/spare-parts', dataWithCompany);
    return response.data;
  },

  // Update spare part
  update: async (id, sparePartData) => {
    const company_id = getCompanyId();
    const dataWithCompany = { ...sparePartData, company_id };
    const response = await api.put(`/spare-parts/${id}`, dataWithCompany);
    return response.data;
  },

  // Delete spare part
  delete: async (id) => {
    const response = await api.delete(`/spare-parts/${id}`);
    return response.data;
  },

  // Update stock
  updateStock: async (id, stockData) => {
    const company_id = getCompanyId();
    const dataWithCompany = { ...stockData, company_id };
    const response = await api.patch(`/spare-parts/${id}/stock`, dataWithCompany);
    return response.data;
  },

  // Get spare parts by category
  getByCategory: async (categoryId) => {
    const response = await api.get(`/spare-parts?category_id=${categoryId}`);
    return response.data;
  },

  // Get low stock spare parts
  getLowStock: async (threshold = 10) => {
    const response = await api.get(`/spare-parts?low_stock=${threshold}`);
    return response.data;
  }
};

export default sparePartsService;