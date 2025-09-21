import { api } from '@/lib/api'

export const assetSpecificationService = {
  // Get all specifications for an asset
  getAssetSpecifications: async (assetId) => {
    const response = await api.get(`/asset-specifications/asset/${assetId}`)
    return response.data
  },

  // Add specification to asset
  addSpecification: async (data) => {
    const response = await api.post('/asset-specifications', data)
    return response.data
  },

  // Update specification
  updateSpecification: async (id, data) => {
    const response = await api.put(`/asset-specifications/${id}`, data)
    return response.data
  },

  // Delete specification
  deleteSpecification: async (id) => {
    const response = await api.delete(`/asset-specifications/${id}`)
    return response.data
  },

  // Bulk update specifications
  bulkUpdateSpecifications: async (assetId, specifications) => {
    const response = await api.put(`/asset-specifications/asset/${assetId}/bulk`, { specifications })
    return response.data
  }
}