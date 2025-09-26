import { api } from '../api'

export const categoryService = {
  // Get all categories - companyId auto-injected by api interceptor
  getAllCategories: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `/categories?${queryString}` : '/categories'
    const response = await api.get(url)
    return response.data
  },

  // Get category by ID - companyId validation on backend
  getCategoryById: async (id) => {
    const response = await api.get(`/categories/${id}`)
    return response.data
  },

  // Create new category - companyId auto-injected
  createCategory: async (categoryData) => {
    const response = await api.post('/categories', categoryData)
    return response.data
  },

  // Update category - companyId auto-injected
  updateCategory: async (id, categoryData) => {
    const response = await api.put(`/categories/${id}`, categoryData)
    return response.data
  },

  // Delete category - companyId validation on backend
  deleteCategory: async (id) => {
    const response = await api.delete(`/categories/${id}`)
    return response.data
  },

  // Get category statistics
  getCategoryStats: async () => {
    const response = await api.get('/categories/stats')
    return response.data
  },

  // Search categories
  searchCategories: async (searchTerm) => {
    const response = await api.get(`/categories/search?q=${encodeURIComponent(searchTerm)}`)
    return response.data
  },

  // Get categories tree (hierarchical)
  getCategoriesTree: async () => {
    const response = await api.get('/categories/tree')
    return response.data
  },

  // Get category with assets count
  getCategoryWithAssetsCount: async (id) => {
    const response = await api.get(`/categories/${id}/assets-count`)
    return response.data
  },

  // Toggle category status
  toggleCategoryStatus: async (id) => {
    const response = await api.patch(`/categories/${id}/toggle-status`)
    return response.data
  }
}
