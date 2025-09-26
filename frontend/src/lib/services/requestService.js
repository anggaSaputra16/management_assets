import { api } from '../api'

export const requestService = {
  // Get all requests - companyId auto-injected by api interceptor
  getAllRequests: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `/requests?${queryString}` : '/requests'
    const response = await api.get(url)
    return response.data
  },

  // Get request by ID - companyId validation on backend
  getRequestById: async (id) => {
    const response = await api.get(`/requests/${id}`)
    return response.data
  },

  // Create new request - companyId auto-injected
  createRequest: async (requestData) => {
    const response = await api.post('/requests', requestData)
    return response.data
  },

  // Update request - companyId auto-injected
  updateRequest: async (id, requestData) => {
    const response = await api.put(`/requests/${id}`, requestData)
    return response.data
  },

  // Delete request - companyId validation on backend
  deleteRequest: async (id) => {
    const response = await api.delete(`/requests/${id}`)
    return response.data
  },

  // Approve request - companyId validation on backend
  approveRequest: async (id, approvalData = {}) => {
    const response = await api.post(`/requests/${id}/approve`, approvalData)
    return response.data
  },

  // Reject request - companyId validation on backend
  rejectRequest: async (id, rejectionData) => {
    const response = await api.post(`/requests/${id}/reject`, rejectionData)
    return response.data
  },

  // Add comment to request - companyId validation on backend
  addComment: async (id, commentData) => {
    const response = await api.post(`/requests/${id}/comments`, commentData)
    return response.data
  },

  // Get request comments
  getRequestComments: async (id) => {
    const response = await api.get(`/requests/${id}/comments`)
    return response.data
  },

  // Get request statistics
  getRequestStats: async () => {
    const response = await api.get('/requests/stats')
    return response.data
  },

  // Search requests
  searchRequests: async (searchTerm) => {
    const response = await api.get(`/requests/search?q=${encodeURIComponent(searchTerm)}`)
    return response.data
  },

  // Get requests by status
  getRequestsByStatus: async (status) => {
    const response = await api.get(`/requests?status=${status}`)
    return response.data
  },

  // Get requests by priority
  getRequestsByPriority: async (priority) => {
    const response = await api.get(`/requests?priority=${priority}`)
    return response.data
  },

  // Get requests by type
  getRequestsByType: async (type) => {
    const response = await api.get(`/requests?type=${type}`)
    return response.data
  },

  // Get my requests (for current user)
  getMyRequests: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `/requests/my?${queryString}` : '/requests/my'
    const response = await api.get(url)
    return response.data
  },

  // Get pending approvals (for managers/admins)
  getPendingApprovals: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `/requests/pending-approvals?${queryString}` : '/requests/pending-approvals'
    const response = await api.get(url)
    return response.data
  }
}
