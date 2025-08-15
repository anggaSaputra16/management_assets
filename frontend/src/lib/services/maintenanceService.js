import { api } from '../api'

export const maintenanceService = {
  // Get all maintenance records
  getAllMaintenance: async () => {
    try {
      const response = await api.get('/maintenance')
      return response.data
    } catch (error) {
      console.error('Failed to fetch maintenance records:', error)
      throw error
    }
  },

  // Get maintenance by ID
  getMaintenanceById: async (id) => {
    try {
      const response = await api.get(`/maintenance/${id}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch maintenance record:', error)
      throw error
    }
  },

  // Create new maintenance record
  createMaintenance: async (maintenanceData) => {
    try {
      const response = await api.post('/maintenance', maintenanceData)
      return response.data
    } catch (error) {
      console.error('Failed to create maintenance record:', error)
      throw error
    }
  },

  // Update maintenance record
  updateMaintenance: async (id, maintenanceData) => {
    try {
      const response = await api.put(`/maintenance/${id}`, maintenanceData)
      return response.data
    } catch (error) {
      console.error('Failed to update maintenance record:', error)
      throw error
    }
  },

  // Delete maintenance record
  deleteMaintenance: async (id) => {
    try {
      const response = await api.delete(`/maintenance/${id}`)
      return response.data
    } catch (error) {
      console.error('Failed to delete maintenance record:', error)
      throw error
    }
  },

  // Get maintenance by asset
  getMaintenanceByAsset: async (assetId) => {
    try {
      const response = await api.get(`/maintenance?assetId=${assetId}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch maintenance by asset:', error)
      throw error
    }
  },

  // Get maintenance by status
  getMaintenanceByStatus: async (status) => {
    try {
      const response = await api.get(`/maintenance?status=${status}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch maintenance by status:', error)
      throw error
    }
  },

  // Update maintenance status
  updateMaintenanceStatus: async (id, status) => {
    try {
      const response = await api.patch(`/maintenance/${id}/status`, { status })
      return response.data
    } catch (error) {
      console.error('Failed to update maintenance status:', error)
      throw error
    }
  },

  // Get maintenance schedule/calendar
  getMaintenanceSchedule: async (startDate, endDate) => {
    try {
      const response = await api.get(`/maintenance/schedule?start=${startDate}&end=${endDate}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch maintenance schedule:', error)
      throw error
    }
  },

  // Get overdue maintenance
  getOverdueMaintenance: async () => {
    try {
      const response = await api.get('/maintenance/overdue')
      return response.data
    } catch (error) {
      console.error('Failed to fetch overdue maintenance:', error)
      throw error
    }
  }
}
