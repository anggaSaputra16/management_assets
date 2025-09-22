import { api } from '@/lib/api'

export const decompositionService = {
  // Get all decompositions
  getAllDecompositions: async (params = {}) => {
    const response = await api.get('/decomposition', { params })
    return response.data
  },

  // Get single decomposition
  getDecomposition: async (id) => {
    const response = await api.get(`/decomposition/${id}`)
    return response.data
  },

  // Create decomposition plan
  createDecomposition: async (data) => {
    const response = await api.post('/decomposition', data)
    return response.data
  },

  // Update decomposition
  updateDecomposition: async (id, data) => {
    const response = await api.put(`/decomposition/${id}`, data)
    return response.data
  },

  // Execute decomposition
  executeDecomposition: async (id) => {
    const response = await api.post(`/decomposition/${id}/execute`)
    return response.data
  },

  // Delete decomposition
  deleteDecomposition: async (id) => {
    const response = await api.delete(`/decomposition/${id}`)
    return response.data
  },

  // Get compatible assets
  getCompatibleAssets: async (sourceAssetId) => {
    const response = await api.get(`/decomposition/assets/compatible/${sourceAssetId}`)
    return response.data
  }
}