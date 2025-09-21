import { api } from '../api'

export const assetService = {
  // Get all assets
  getAllAssets: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `/assets?${queryString}` : '/assets'
    const response = await api.get(url)
    return response.data
  },

  // Get asset by ID
  getAssetById: async (id) => {
    const response = await api.get(`/assets/${id}`)
    return response.data
  },

  // Create new asset
  createAsset: async (assetData) => {
    const response = await api.post('/assets', assetData)
    return response.data
  },

  // Update asset
  updateAsset: async (id, assetData) => {
    const response = await api.put(`/assets/${id}`, assetData)
    return response.data
  },

  // Delete asset
  deleteAsset: async (id) => {
    const response = await api.delete(`/assets/${id}`)
    return response.data
  },

  // Upload asset image
  uploadAssetImage: async (id, imageFile) => {
    const formData = new FormData()
    formData.append('image', imageFile)
    const response = await api.post(`/assets/${id}/upload-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  // Get asset statistics
  getAssetStats: async () => {
    const response = await api.get('/assets/stats')
    return response.data
  },

  // Search assets
  searchAssets: async (searchTerm) => {
    const response = await api.get(`/assets/search?q=${encodeURIComponent(searchTerm)}`)
    return response.data
  },

  // Get assets by category
  getAssetsByCategory: async (categoryId) => {
    const response = await api.get(`/assets?categoryId=${categoryId}`)
    return response.data
  },

  // Get assets by location
  getAssetsByLocation: async (locationId) => {
    const response = await api.get(`/assets?locationId=${locationId}`)
    return response.data
  },

  // Get assets by status
  getAssetsByStatus: async (status) => {
    const response = await api.get(`/assets?status=${status}`)
    return response.data
  },

  // Assign asset to user
  assignAsset: async (id, assignmentData) => {
    const response = await api.post(`/assets/${id}/assign`, assignmentData)
    return response.data
  },

  // Return asset
  returnAsset: async (id, returnData = {}) => {
    const response = await api.post(`/assets/${id}/return`, returnData)
    return response.data
  },

  // Transfer asset
  transferAsset: async (id, transferData) => {
    const response = await api.post(`/assets/${id}/transfer`, transferData)
    return response.data
  },

  // Update asset status
  updateAssetStatus: async (id, status, notes = '') => {
    const response = await api.patch(`/assets/${id}/status`, { status, notes })
    return response.data
  },

  // Get asset history
  getAssetHistory: async (id) => {
    const response = await api.get(`/assets/${id}/history`)
    return response.data
  },

  // Get asset maintenance records
  getAssetMaintenance: async (id) => {
    const response = await api.get(`/assets/${id}/maintenance`)
    return response.data
  },

  // Calculate depreciation
  calculateDepreciation: async (id) => {
    const response = await api.get(`/assets/${id}/depreciation`)
    return response.data
  },

  // Bulk import assets
  bulkImport: async (assetsData) => {
    const response = await api.post('/assets/bulk-import', { assets: assetsData })
    return response.data
  },

  // Export assets
  exportAssets: async (format = 'csv', filters = {}) => {
    const params = new URLSearchParams({ format, ...filters })
    if (format === 'csv') {
      const response = await api.get(`/assets/export?${params}`, { responseType: 'blob' })
      return response
    } else {
      const response = await api.get(`/assets/export?${params}`)
      return response.data
    }
  },

  // Get compatible assets for component transfer
  getCompatibleAssets: async (componentId) => {
    const response = await api.get(`/assets/compatible/${componentId}`)
    return response.data
  },

  // QR Code related methods
  generateQRCode: async (id, format = 'file') => {
    const response = await api.post(`/assets/${id}/generate-qr`, { format })
    return response.data
  },

  scanQRCode: async (qrData, scanLocation = '', scanContext = 'SEARCH') => {
    const response = await api.post('/assets/scan-qr', { 
      qrData, 
      scanLocation, 
      scanContext 
    })
    return response.data
  },

  getQRScanHistory: async (id, limit = 10) => {
    const response = await api.get(`/assets/${id}/qr-scans?limit=${limit}`)
    return response.data
  }
}
