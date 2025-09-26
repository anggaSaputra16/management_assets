import api from '../api';
import { useAuthStore } from '../../stores/authStore';

const getCompanyId = () => {
  const { user } = useAuthStore.getState();
  return user?.company_id;
};

export const softwareAssetsService = {
  // Get all software assets (auto-filtered by company_id in backend)
  getAll: async () => {
    const response = await api.get('/software-assets');
    return response.data;
  },

  // Get software asset by ID
  getById: async (id) => {
    const response = await api.get(`/software-assets/${id}`);
    return response.data;
  },

  // Create new software asset
  create: async (softwareAssetData) => {
    const company_id = getCompanyId();
    const dataWithCompany = { ...softwareAssetData, company_id };
    const response = await api.post('/software-assets', dataWithCompany);
    return response.data;
  },

  // Update software asset
  update: async (id, softwareAssetData) => {
    const company_id = getCompanyId();
    const dataWithCompany = { ...softwareAssetData, company_id };
    const response = await api.put(`/software-assets/${id}`, dataWithCompany);
    return response.data;
  },

  // Delete software asset
  delete: async (id) => {
    const response = await api.delete(`/software-assets/${id}`);
    return response.data;
  },

  // Get software assets by type
  getByType: async (type) => {
    const response = await api.get(`/software-assets?type=${type}`);
    return response.data;
  },

  // Get software assets by status
  getByStatus: async (status) => {
    const response = await api.get(`/software-assets?status=${status}`);
    return response.data;
  },

  // Get expiring licenses
  getExpiringLicenses: async (days = 30) => {
    const response = await api.get(`/software-assets?expiring=${days}`);
    return response.data;
  }
};

export default softwareAssetsService;