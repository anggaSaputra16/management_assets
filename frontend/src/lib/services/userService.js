import { api } from '../api'

export const userService = {
  // Get all users
  getAllUsers: async () => {
    try {
      const response = await api.get('/users')
      return response.data
    } catch (error) {
      console.error('Failed to fetch users:', error)
      throw error
    }
  },

  // Get user by ID
  getUserById: async (id) => {
    try {
      const response = await api.get(`/users/${id}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch user:', error)
      throw error
    }
  },

  // Create new user
  createUser: async (userData) => {
    try {
      const response = await api.post('/users', userData)
      return response.data
    } catch (error) {
      console.error('Failed to create user:', error)
      throw error
    }
  },

  // Update user
  updateUser: async (id, userData) => {
    try {
      const response = await api.put(`/users/${id}`, userData)
      return response.data
    } catch (error) {
      console.error('Failed to update user:', error)
      throw error
    }
  },

  // Delete user
  deleteUser: async (id) => {
    try {
      const response = await api.delete(`/users/${id}`)
      return response.data
    } catch (error) {
      console.error('Failed to delete user:', error)
      throw error
    }
  },

  // Change user password
  changePassword: async (id, passwordData) => {
    try {
      const response = await api.put(`/users/${id}/password`, passwordData)
      return response.data
    } catch (error) {
      console.error('Failed to change password:', error)
      throw error
    }
  },

  // Get users by role
  getUsersByRole: async (role) => {
    try {
      const response = await api.get(`/users?role=${role}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch users by role:', error)
      throw error
    }
  },

  // Get users by department
  getUsersByDepartment: async (departmentId) => {
    try {
      const response = await api.get(`/users?departmentId=${departmentId}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch users by department:', error)
      throw error
    }
  },

  // Toggle user status
  toggleUserStatus: async (id) => {
    try {
      const response = await api.patch(`/users/${id}/toggle-status`)
      return response.data
    } catch (error) {
      console.error('Failed to toggle user status:', error)
      throw error
    }
  }
}
