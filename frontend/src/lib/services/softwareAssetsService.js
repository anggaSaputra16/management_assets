import api from '../api';
import { useAuthStore } from '../../stores/authStore';

const getCompanyId = () => {
  const { user } = useAuthStore.getState();
  // Support both backend shapes: camelCase `companyId` or snake_case `company_id`
  return user?.companyId || user?.company_id || null;
};

export const softwareAssetsService = {
  // Get all software assets
  getAll: async () => {
    const response = await api.get('/software-assets');
    return response.data.data || [];
  },

  // Get software asset by ID
  getById: async (id) => {
    const response = await api.get(`/software-assets/${id}`);
    return response.data.data;
  },

  // Create new software asset
  create: async (softwareAssetData) => {
    const company_id = getCompanyId();
    const mappedData = {
      name: softwareAssetData.name,
      version: softwareAssetData.version || '',
      publisher: softwareAssetData.publisher || '',
      description: softwareAssetData.description || '',
      softwareType: softwareAssetData.softwareType || 'APPLICATION',
      category: softwareAssetData.category || '',
      isActive: true,
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
    return response.data.data;
  },

  // Batch create multiple software assets
  batchCreate: async (items) => {
    if (!Array.isArray(items)) throw new Error('items must be an array')
    const company_id = getCompanyId()
    // Map each item to include company_id if missing
    const payload = items.map(item => ({ ...item, company_id: item.company_id || company_id }))
    const response = await api.post('/software-assets/batch', payload)
    return response.data.data
  },

  // Update software asset
  update: async (id, softwareAssetData) => {
    const company_id = getCompanyId();
    const mappedData = {
      name: softwareAssetData.name,
      version: softwareAssetData.version || '',
      publisher: softwareAssetData.publisher || '',
      description: softwareAssetData.description || '',
      softwareType: softwareAssetData.softwareType || 'APPLICATION',
      category: softwareAssetData.category || '',
      isActive: true,
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
    return response.data.data;
  },

  // Delete software asset
  delete: async (id) => {
    const response = await api.delete(`/software-assets/${id}`);
    return response.data;
  },

  // Create one or multiple licenses for a software asset
  createLicenses: async (softwareId, licensePayload) => {
    // licensePayload can be object or array
    const response = await api.post(`/software-assets/${encodeURIComponent(softwareId)}/licenses`, licensePayload);
    return response.data.data;
  },

  // Update a license
  updateLicense: async (softwareId, licenseId, data) => {
    const response = await api.put(`/software-assets/${encodeURIComponent(softwareId)}/licenses/${encodeURIComponent(licenseId)}`, data);
    return response.data.data;
  },

  // Delete (deactivate) a license
  deleteLicense: async (softwareId, licenseId) => {
    const response = await api.delete(`/software-assets/${encodeURIComponent(softwareId)}/licenses/${encodeURIComponent(licenseId)}`);
    return response.data;
  },

  // Upload attachments for a software asset (multipart/form-data)
  uploadAttachments: async (softwareId, files) => {
    const form = new FormData();
    for (const f of files) {
      form.append('attachments', f);
    }
    const response = await api.post(`/software-assets/${encodeURIComponent(softwareId)}/attachments`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data;
  },

  // Get software assets by type
  getByType: async (type) => {
    // Backend expects `softwareType` query param
    const response = await api.get(`/software-assets?softwareType=${encodeURIComponent(type)}`);
    return response.data.data || [];
  },

  // Get software assets by status
  getByStatus: async (status) => {
    // Map higher-level status strings to the backend `isActive` filter when possible
    let q = '';
    if (typeof status === 'boolean') {
      q = `?isActive=${status}`;
    } else if (status === 'ACTIVE') {
      q = '?isActive=true';
    } else if (status === 'INACTIVE' || status === 'INACTIVE') {
      q = '?isActive=false';
    } else {
      q = `?status=${encodeURIComponent(status)}`; // fallback
    }
    const response = await api.get(`/software-assets${q}`);
    return response.data.data || [];
  },

  // Get expiring licenses
  getExpiringLicenses: async () => {
    // Backend currently exposes expiring license counts via /software-assets/stats
    // Return the number of expiring licenses (30-day window is used server-side)
    const response = await api.get('/software-assets/stats');
    return (response.data && response.data.data && response.data.data.expiringLicenses) || 0;
  }
};

export default softwareAssetsService;