import { api } from '../api'

export const sparePartService = {
  // Get all spare parts
  getAllSpareParts: async (params = {}) => {
    try {
      const response = await api.get('/spare-parts', { params })
      return response.data
    } catch (error) {
      console.error('Failed to fetch spare parts:', error)
      throw error
    }
  },

  // Get spare part by ID
  getSparePartById: async (id) => {
    try {
      const response = await api.get(`/spare-parts/${id}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch spare part:', error)
      throw error
    }
  },

  // Create new spare part
  createSparePart: async (sparePartData) => {
    try {
      const response = await api.post('/spare-parts', sparePartData)
      return response.data
    } catch (error) {
      console.error('Failed to create spare part:', error)
      throw error
    }
  },

  // Update spare part
  updateSparePart: async (id, sparePartData) => {
    try {
      const response = await api.put(`/spare-parts/${id}`, sparePartData)
      return response.data
    } catch (error) {
      console.error('Failed to update spare part:', error)
      throw error
    }
  },

  // Delete spare part
  deleteSparePart: async (id) => {
    try {
      const response = await api.delete(`/spare-parts/${id}`)
      return response.data
    } catch (error) {
      console.error('Failed to delete spare part:', error)
      throw error
    }
  },

  // Update stock level
  updateStockLevel: async (id, stockData) => {
    try {
      const response = await api.put(`/spare-parts/${id}/stock`, stockData)
      return response.data
    } catch (error) {
      console.error('Failed to update stock level:', error)
      throw error
    }
  },

  // Get spare parts statistics
  getSparePartsStats: async () => {
    try {
      const response = await api.get('/spare-parts/stats')
      return response.data
    } catch (error) {
      console.error('Failed to fetch spare parts stats:', error)
      throw error
    }
  },

  // Get low stock spare parts
  getLowStockSpareParts: async () => {
    try {
      const response = await api.get('/spare-parts/low-stock')
      return response.data
    } catch (error) {
      console.error('Failed to fetch low stock spare parts:', error)
      throw error
    }
  }
}