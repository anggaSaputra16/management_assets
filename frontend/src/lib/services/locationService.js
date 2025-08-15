import { api } from '../api'

export const locationService = {
  // Get all locations
  getAllLocations: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `/locations?${queryString}` : '/locations'
    const response = await api.get(url)
    return response.data
  },

  // Get location by ID
  getLocationById: async (id) => {
    const response = await api.get(`/locations/${id}`)
    return response.data
  },

  // Create new location
  createLocation: async (locationData) => {
    const response = await api.post('/locations', locationData)
    return response.data
  },

  // Update location
  updateLocation: async (id, locationData) => {
    const response = await api.put(`/locations/${id}`, locationData)
    return response.data
  },

  // Delete location
  deleteLocation: async (id) => {
    const response = await api.delete(`/locations/${id}`)
    return response.data
  },

  // Get location statistics
  getLocationStats: async () => {
    const response = await api.get('/locations/stats')
    return response.data
  },

  // Search locations
  searchLocations: async (searchTerm) => {
    const response = await api.get(`/locations/search?q=${encodeURIComponent(searchTerm)}`)
    return response.data
  },

  // Get locations by type
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
