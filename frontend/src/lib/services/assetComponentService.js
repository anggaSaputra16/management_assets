import { api } from '@/lib/api'

export const assetComponentService = {
  // Get all components for an asset
  getAssetComponents: async (assetId) => {
    const response = await api.get(`/asset-components/asset/${assetId}`)
    return response.data
  },

  // Add component to asset
  addComponent: async (data) => {
    const response = await api.post('/asset-components', data)
    return response.data
  },

  // Update component
  updateComponent: async (id, data) => {
    const response = await api.put(`/asset-components/${id}`, data)
    return response.data
  },

  // Transfer component
  transferComponent: async (id, data) => {
    const response = await api.post(`/asset-components/${id}/transfer`, data)
    return response.data
  },

  // Delete component
  deleteComponent: async (id) => {
    const response = await api.delete(`/asset-components/${id}`)
    return response.data
  },

  // Get component maintenance history
  getComponentMaintenance: async (id) => {
    const response = await api.get(`/asset-components/${id}/maintenance`)
    return response.data
  },

  // Add component maintenance
  addComponentMaintenance: async (id, data) => {
    const response = await api.post(`/asset-components/${id}/maintenance`, data)
    return response.data
  }
}