import { api } from '../api'

export const vendorService = {
  // Get all vendors
  getAllVendors: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `/vendors?${queryString}` : '/vendors'
    const response = await api.get(url)
    return response.data
  },

  // Get vendor by ID
  getVendorById: async (id) => {
    const response = await api.get(`/vendors/${id}`)
    return response.data
  },

  // Create new vendor
  createVendor: async (vendorData) => {
    const response = await api.post('/vendors', vendorData)
    return response.data
  },

  // Update vendor
  updateVendor: async (id, vendorData) => {
    const response = await api.put(`/vendors/${id}`, vendorData)
    return response.data
  },

  // Delete vendor
  deleteVendor: async (id) => {
    const response = await api.delete(`/vendors/${id}`)
    return response.data
  },

  // Get vendor statistics
  getVendorStats: async () => {
    const response = await api.get('/vendors/stats')
    return response.data
  },

  // Search vendors
  searchVendors: async (searchTerm) => {
    const response = await api.get(`/vendors/search?q=${encodeURIComponent(searchTerm)}`)
    return response.data
  },

  // Get vendors by type
  getVendorsByType: async (type) => {
    const response = await api.get(`/vendors?type=${type}`)
    return response.data
  },

  // Toggle vendor status
  toggleVendorStatus: async (id) => {
    const response = await api.patch(`/vendors/${id}/toggle-status`)
    return response.data
  }
}
