import { api } from '../api'

export const departmentService = {
  // Get all departments
  getAllDepartments: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `/departments?${queryString}` : '/departments'
    const response = await api.get(url)
    return response.data
  },

  // Get department by ID
  getDepartmentById: async (id) => {
    const response = await api.get(`/departments/${id}`)
    return response.data
  },

  // Create new department
  createDepartment: async (departmentData) => {
    const response = await api.post('/departments', departmentData)
    return response.data
  },

  // Update department
  updateDepartment: async (id, departmentData) => {
    const response = await api.put(`/departments/${id}`, departmentData)
    return response.data
  },

  // Delete department
  deleteDepartment: async (id) => {
    const response = await api.delete(`/departments/${id}`)
    return response.data
  },

  // Get department statistics
  getDepartmentStats: async () => {
    const response = await api.get('/departments/stats')
    return response.data
  },

  // Search departments
  searchDepartments: async (searchTerm) => {
    const response = await api.get(`/departments/search?q=${encodeURIComponent(searchTerm)}`)
    return response.data
  },

  // Get departments tree (hierarchical)
  getDepartmentsTree: async () => {
    const response = await api.get('/departments/tree')
    return response.data
  },

  // Get department employees
  getDepartmentEmployees: async (id) => {
    const response = await api.get(`/departments/${id}/employees`)
    return response.data
  },

  // Get department assets
  getDepartmentAssets: async (id) => {
    const response = await api.get(`/departments/${id}/assets`)
    return response.data
  },

  // Toggle department status
  toggleDepartmentStatus: async (id) => {
    const response = await api.patch(`/departments/${id}/toggle-status`)
    return response.data
  },

  // Assign manager to department
  assignManager: async (id, managerId) => {
    const response = await api.patch(`/departments/${id}/manager`, { managerId })
    return response.data
  },

  // Get department budget utilization
  getDepartmentBudgetUtilization: async (id) => {
    const response = await api.get(`/departments/${id}/budget-utilization`)
    return response.data
  }
}
