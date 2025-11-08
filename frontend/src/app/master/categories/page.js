'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useCategoryStore } from '@/stores/categoryStore'
import { Plus, Edit, Trash2, Search, Tag } from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'

export default function MasterCategoriesPage() {
  const { user } = useAuthStore()
  const {
    categories,
    loading,
    searchTerm,
    showModal,
    editingCategory,
    formData,
    currentPage,
    pageSize,
    totalCategories,
    setSearchTerm,
    setShowModal,
    setEditingCategory,
    setFormData,
    setPage,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory
  } = useCategoryStore()

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState(null)

  useEffect(() => {
    fetchCategories({ page: 1, limit: pageSize })
  }, [fetchCategories, pageSize])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData)
      } else {
        await createCategory(formData)
      }
      setShowModal(false)
      resetForm()
      // Refresh current page data
      fetchCategories({ page: currentPage, limit: pageSize, search: searchTerm })
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name || '',
      code: category.code || '',
      description: category.description || '',
      depreciation_rate: category.depreciation_rate || '',
      useful_life_years: category.useful_life_years || ''
    })
    setShowModal(true)
  }

  const handleDelete = async () => {
    if (categoryToDelete) {
      try {
        await deleteCategory(categoryToDelete.id)
        setShowDeleteModal(false)
        setCategoryToDelete(null)
        // Refresh current page data
        fetchCategories({ page: currentPage, limit: pageSize, search: searchTerm })
      } catch (error) {
        console.error('Error deleting category:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      depreciation_rate: '',
      useful_life_years: ''
    })
    setEditingCategory(null)
  }

  const handleSearch = () => {
    fetchCategories({ page: 1, limit: pageSize, search: searchTerm })
  }

  const handlePageChange = (newPage) => {
    setPage(newPage)
    fetchCategories({ page: newPage, limit: pageSize, search: searchTerm })
  }

  const totalPages = Math.ceil(totalCategories / pageSize)

  return (
    <DashboardLayout title="Master Data - Categories" icon={Tag}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#111]">Asset Categories</h1>
            <p className="text-[#333]">Manage asset categories and classification</p>
          </div>
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="glass-button flex items-center px-4 py-2 rounded-lg hover:scale-105 transition-transform"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </button>
        </div>

        {/* Search */}
        <div className="glass-card p-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#333] w-4 h-4" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="glass-input w-full pl-10 pr-4 py-2 rounded-lg"
              />
            </div>
            <button
              onClick={handleSearch}
              className="glass-button px-6 py-2 rounded-lg hover:scale-105 transition-transform"
            >
              Search
            </button>
          </div>
        </div>

        {/* Categories Table */}
        <div className="glass-card p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/10">
                  <th className="text-left py-3 px-4 font-medium text-[#111]">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-[#111]">Code</th>
                  <th className="text-left py-3 px-4 font-medium text-[#111]">Depreciation Rate</th>
                  <th className="text-left py-3 px-4 font-medium text-[#111]">Useful Life</th>
                  <th className="text-left py-3 px-4 font-medium text-[#111]">Assets Count</th>
                  <th className="text-left py-3 px-4 font-medium text-[#111]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black/10"></div>
                      </div>
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-[#333]">
                      No categories found
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr key={category.id} className="border-b border-black/10 hover:bg-white/60">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <Tag className="w-4 h-4 text-[#333] mr-2" />
                          <div>
                            <div className="font-medium text-[#111]">{category.name}</div>
                            {category.description && (
                              <div className="text-sm text-[#333]">{category.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/60 text-[#111]">
                          {category.code}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#111]">
                        {category.depreciation_rate ? `${category.depreciation_rate}%` : '-'}
                      </td>
                      <td className="py-3 px-4 text-[#111]">
                        {category.useful_life_years ? `${category.useful_life_years} years` : '-'}
                      </td>
                      <td className="py-3 px-4 text-[#111]">
                        {category._count?.assets || 0}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(category)}
                            className="text-[#111] hover:scale-110 transition-transform p-1"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setCategoryToDelete(category)
                              setShowDeleteModal(true)
                            }}
                            className="text-[#111] hover:scale-110 transition-transform p-1"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalCategories > 0 && (
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-black/10">
              <div className="text-sm text-[#333]">
                Showing {Math.min((currentPage - 1) * pageSize + 1, totalCategories)} to {Math.min(currentPage * pageSize, totalCategories)} of {totalCategories} categories
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="glass-button px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-[#111]">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="glass-button px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
    <div className="fixed inset-0 bg-white/10 dark:bg-black/30 backdrop-blur-md flex items-center justify-center z-50">
            <div className="glass-card p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">
                {editingCategory ? 'Edit Category' : 'Create Category'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#111] mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="glass-input w-full px-3 py-2 rounded-lg"
                    placeholder="Enter category name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111] mb-1">
                    Category Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="glass-input w-full px-3 py-2 rounded-lg"
                    placeholder="Enter category code"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111] mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="glass-input w-full px-3 py-2 rounded-lg"
                    placeholder="Enter description"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111] mb-1">
                    Depreciation Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.depreciation_rate}
                    onChange={(e) => setFormData({ ...formData, depreciation_rate: e.target.value })}
                    className="glass-input w-full px-3 py-2 rounded-lg"
                    placeholder="Enter depreciation rate"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111] mb-1">
                    Useful Life (Years)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.useful_life_years}
                    onChange={(e) => setFormData({ ...formData, useful_life_years: e.target.value })}
                    className="glass-input w-full px-3 py-2 rounded-lg"
                    placeholder="Enter useful life in years"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                    className="px-4 py-2 text-[#333] hover:text-[#111]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="glass-button px-4 py-2 rounded-lg"
                  >
                    {editingCategory ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
    <div className="fixed inset-0 bg-white/10 dark:bg-black/30 backdrop-blur-md flex items-center justify-center z-50">
            <div className="glass-card p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4 text-[#111]">Delete Category</h3>
              <p className="text-[#333] mb-4">
                Are you sure you want to delete &quot;{categoryToDelete?.name}&quot;? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setCategoryToDelete(null)
                  }}
                  className="px-4 py-2 text-[#333] hover:text-[#111]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 glass-button text-white rounded-lg hover:scale-105 transition-transform"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}