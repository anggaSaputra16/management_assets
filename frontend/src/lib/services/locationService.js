import { api } from '../api'

export const locationService = {
  // Get all locations - companyId auto-injected by api interceptor
  getAllLocations: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `/locations?${queryString}` : '/locations'
    const response = await api.get(url)
    return response.data
  },

  // Get location by ID - companyId validation on backend
  getLocationById: async (id) => {
    const response = await api.get(`/locations/${id}`)
    return response.data
  },

  // Create new location - companyId auto-injected
  createLocation: async (locationData) => {
    const response = await api.post('/locations', locationData)
    return response.data
  },

  // Update location - companyId auto-injected
  updateLocation: async (id, locationData) => {
    const response = await api.put(`/locations/${id}`, locationData)
    return response.data
  },

  // Delete location - companyId validation on backend
  deleteLocation: async (id) => {
    const response = await api.delete(`/locations/${id}`)
    return response.data
  },

  // Get location statistics - companyId filtered
  getLocationStats: async () => {
    const response = await api.get('/locations/stats')
    return response.data
  },

  // Search locations - companyId filtered
  searchLocations: async (searchTerm) => {
    const response = await api.get(`/locations/search?q=${encodeURIComponent(searchTerm)}`)
    return response.data
  },

  // Get locations by type - companyId filtered
  getLocationsByType: async (type) => {
    const response = await api.get(`/locations?type=${type}`)
    return response.data
  },

  // Toggle location status
  toggleLocationStatus: async (id) => {
    const response = await api.patch(`/locations/${id}/toggle-status`)
    return response.data
  },

  // Get assets by location
  getAssetsByLocation: async (locationId) => {
    const response = await api.get(`/locations/${locationId}/assets`)
    return response.data
  }
}
