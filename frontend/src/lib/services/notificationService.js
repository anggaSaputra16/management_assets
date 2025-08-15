import { api } from '../api'

export const notificationService = {
  // Get all notifications for current user
  getNotifications: async (params = {}) => {
    const { page = 1, limit = 20, isRead, type } = params
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    })
    
    if (isRead !== undefined) {
      queryParams.append('isRead', isRead.toString())
    }
    
    if (type) {
      queryParams.append('type', type)
    }
    
    const response = await api.get(`/notifications?${queryParams.toString()}`)
    return response.data
  },

  // Get notification by ID
  getNotification: async (id) => {
    const response = await api.get(`/notifications/${id}`)
    return response.data
  },

  // Create notification (Admin/Asset Admin only)
  createNotification: async (notificationData) => {
    const response = await api.post('/notifications', notificationData)
    return response.data
  },

  // Broadcast notification to multiple users (Admin/Asset Admin only)
  broadcastNotification: async (broadcastData) => {
    const response = await api.post('/notifications/broadcast', broadcastData)
    return response.data
  },

  // Broadcast to role (Admin/Asset Admin only)
  broadcastToRole: async (roleData) => {
    const response = await api.post('/notifications/broadcast-role', roleData)
    return response.data
  },

  // Mark notifications as read
  markAsRead: async (notificationIds) => {
    const response = await api.put('/notifications/mark-read', {
      notificationIds
    })
    return response.data
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await api.put('/notifications/mark-all-read')
    return response.data
  },

  // Delete notification
  deleteNotification: async (id) => {
    const response = await api.delete(`/notifications/${id}`)
    return response.data
  },

  // Delete all read notifications
  deleteAllRead: async () => {
    const response = await api.delete('/notifications/read/all')
    return response.data
  },

  // Get notification statistics
  getStatistics: async () => {
    const response = await api.get('/notifications/statistics/overview')
    return response.data
  }
}
