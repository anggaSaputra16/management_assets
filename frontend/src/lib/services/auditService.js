import { api } from '../api'

export const auditService = {
  // Get all audit logs - companyId auto-injected by api interceptor
  getAllAudits: async () => {
    try {
      const response = await api.get('/audit')
      return response.data
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
      throw error
    }
  },

  // Get audit by ID - companyId validation on backend
  getAuditById: async (id) => {
    try {
      const response = await api.get(`/audit/${id}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch audit log:', error)
      throw error
    }
  },

  // Create new audit log - companyId auto-injected
  createAudit: async (auditData) => {
    try {
      const response = await api.post('/audit', auditData)
      return response.data
    } catch (error) {
      console.error('Failed to create audit log:', error)
      throw error
    }
  },

  // Get audit logs by entity type - companyId filtered
  getAuditsByEntity: async (entityType, entityId) => {
    try {
      const response = await api.get(`/audit/entity/${entityType}/${entityId}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch audit logs by entity:', error)
      throw error
    }
  },

  // Get audit logs by user - companyId filtered
  getAuditsByUser: async (userId) => {
    try {
      const response = await api.get(`/audit/user/${userId}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch audit logs by user:', error)
      throw error
    }
  },

  // Get audit logs by action
  getAuditsByAction: async (action) => {
    try {
      const response = await api.get(`/audit/action/${action}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch audit logs by action:', error)
      throw error
    }
  },

  // Get audit logs by date range
  getAuditsByDateRange: async (startDate, endDate) => {
    try {
      const response = await api.get(`/audit/date-range?start=${startDate}&end=${endDate}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch audit logs by date range:', error)
      throw error
    }
  },

  // Export audit logs
  exportAudits: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams(filters).toString()
      const response = await api.get(`/audit/export?${queryParams}`, {
        responseType: 'blob'
      })
      return response.data
    } catch (error) {
      console.error('Failed to export audit logs:', error)
      throw error
    }
  },

  // Get audit statistics
  getAuditStats: async () => {
    try {
      const response = await api.get('/audit/stats')
      return response.data
    } catch (error) {
      console.error('Failed to fetch audit statistics:', error)
      throw error
    }
  }
}
