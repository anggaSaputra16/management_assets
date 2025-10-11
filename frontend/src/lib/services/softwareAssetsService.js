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
    // Map frontend fields to backend expected format
    const mappedData = {
      name: softwareAssetData.name,
      version: softwareAssetData.version || '',
      publisher: softwareAssetData.publisher || '',
      description: softwareAssetData.description || '',
      softwareType: 'APPLICATION', // Default type
      category: softwareAssetData.category || '',
      isActive: true,
      // License data
      license_type: softwareAssetData.license_type || 'PERPETUAL',
      license_key: softwareAssetData.license_key || '',
      status: softwareAssetData.status || 'ACTIVE',
      cost: softwareAssetData.cost ? parseFloat(softwareAssetData.cost) : null,
      purchase_date: softwareAssetData.purchase_date || null,
      expiry_date: softwareAssetData.expiry_date || null,
      max_installations: softwareAssetData.max_installations ? parseInt(softwareAssetData.max_installations) : 1,
      current_installations: softwareAssetData.current_installations ? parseInt(softwareAssetData.current_installations) : 0,
      vendor_id: softwareAssetData.vendor_id || null,
      company_id
    };
    
    const response = await api.post('/software-assets', mappedData);
    return response.data;
  },

  // Update software asset
  update: async (id, softwareAssetData) => {
    const company_id = getCompanyId();
    // Map frontend fields to backend expected format
    const mappedData = {
      name: softwareAssetData.name,
      version: softwareAssetData.version || '',
      publisher: softwareAssetData.publisher || '',
      description: softwareAssetData.description || '',
      softwareType: 'APPLICATION', // Default type
      category: softwareAssetData.category || '',
      isActive: true,
      // License data
      license_type: softwareAssetData.license_type || 'PERPETUAL',
      license_key: softwareAssetData.license_key || '',
      status: softwareAssetData.status || 'ACTIVE',
      cost: softwareAssetData.cost ? parseFloat(softwareAssetData.cost) : null,
      purchase_date: softwareAssetData.purchase_date || null,
      expiry_date: softwareAssetData.expiry_date || null,
      max_installations: softwareAssetData.max_installations ? parseInt(softwareAssetData.max_installations) : 1,
      current_installations: softwareAssetData.current_installations ? parseInt(softwareAssetData.current_installations) : 0,
      vendor_id: softwareAssetData.vendor_id || null,
      company_id
    };
    
    const response = await api.put(`/software-assets/${id}`, mappedData);
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