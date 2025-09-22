'use client'

import { useState, useEffect } from 'react'
import { useCategoryStore } from '@/stores'
import { useToast } from '@/contexts/ToastContext'
import {
  Tag,
  Plus,
  Search,
  Edit,
  Trash2,
  FolderOpen,
  Folder,
  CheckCircle,
  X,
  Package,
  AlertTriangle
} from 'lucide-react'

const CategoriesPage = () => {
  const {
    categories,
    loading,
    error,
    searchTerm,
    showModal,
    editingCategory,
    formData,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    setSearchTerm,
    setShowModal,
    setEditingCategory,
    resetForm,
    handleInputChange,
    getFilteredCategories,
    getCategoryStats
  } = useCategoryStore()

  const { showSuccess, showError } = useToast()
  const [statusFilter, setStatusFilter] = useState('')

  const filteredCategories = getFilteredCategories()
  const stats = getCategoryStats()

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.code.trim()) {
      showError('Name and code are required')
      return
    }

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData)
        showSuccess('Category updated successfully')
      } else {
        await createCategory(formData)
        showSuccess('Category created successfully')
      }
      setShowModal(false)
      resetForm()
    } catch (error) {
      showError(error.message || 'Operation failed')
    }
  }

  const handleDelete = async (category) => {
    if (window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
      try {
        await deleteCategory(category.id)
        showSuccess('Category deleted successfully')
      } catch (error) {
        showError(error.message || 'Failed to delete category')
      }
    }
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
  }

  const getParentCategories = () => {
    return categories.filter(cat => !cat.parentId && cat.isActive !== false)
  }

  const getFilteredAndSortedCategories = () => {
    let filtered = filteredCategories

    if (statusFilter) {
      filtered = filtered.filter(cat => 
        statusFilter === 'active' ? cat.isActive !== false : cat.isActive === false
      )
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name))
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                {error}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="glass-header p-6 rounded-lg flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Categories</h1>
          <p className="text-gray-600">
            Manage asset categories and subcategories
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="glass-button inline-flex items-center px-4 py-2 rounded-lg hover:scale-105 transition-transform"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const IconComponent = {
            Tag,
            CheckCircle,
            FolderOpen,
            Folder
          }[stat.icon]

          return (
            <div key={index} className="glass-card p-6 hover:scale-105 transition-transform">
              <div className="flex items-center">
                <div className="gradient-overlay rounded-lg p-3">
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Search and Filters */}
      <div className="glass-card p-6">
        <div className="flex space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search categories..."
                className="glass-input pl-10 w-full rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="glass-input rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <div className="glass-card rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/20">
            <thead className="glass-header">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Parent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Assets
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <Tag className="animate-spin h-5 w-5 mr-2" />
                      Loading categories...
                    </div>
                  </td>
                </tr>
              ) : getFilteredAndSortedCategories().length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No categories found
                  </td>
                </tr>
              ) : (
                getFilteredAndSortedCategories().map((category) => (
                  <tr key={category.id} className="hover:bg-white/10 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {category.parentId ? (
                          <Folder className="h-5 w-5 text-orange-500 mr-3" />
                        ) : (
                          <FolderOpen className="h-5 w-5 text-blue-500 mr-3" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-800">
                            {category.name}
                          </div>
                          {category.description && (
                            <div className="text-sm text-gray-600">
                              {category.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold bg-white/20 text-gray-700 rounded-full backdrop-blur-sm">
                        {category.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {category.parent ? category.parent.name : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div className="flex items-center">
                        <Package className="h-4 w-4 text-gray-500 mr-1" />
                        {category._count?.assets || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full backdrop-blur-sm ${
                        category.isActive !== false 
                          ? 'bg-green-500/20 text-green-700 border border-green-500/30' 
                          : 'bg-red-500/20 text-red-700 border border-red-500/30'
                      }`}>
                        {category.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="text-green-600 hover:text-green-800 hover:scale-110 transition-all"
                          title="Edit Category"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category)}
                          className="text-red-600 hover:text-red-800 hover:scale-110 transition-all"
                          title="Delete Category"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-modal max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="text-gray-500 hover:text-gray-700 hover:scale-110 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="glass-input w-full rounded-lg px-3 py-2 text-sm"
                  placeholder="Enter category name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Code *
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  className="glass-input w-full rounded-lg px-3 py-2 text-sm"
                  placeholder="Enter category code"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="glass-input w-full rounded-lg px-3 py-2 text-sm"
                  placeholder="Enter description (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Category
                </label>
                <select
                  name="parentId"
                  value={formData.parentId}
                  onChange={handleInputChange}
                  className="glass-input w-full rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">None (Main Category)</option>
                  {getParentCategories().map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="mr-2 rounded"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="flex-1 glass-button px-4 py-2 rounded-lg text-sm font-medium hover:scale-105 transition-transform"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 gradient-overlay px-4 py-2 text-white rounded-lg text-sm font-medium hover:scale-105 transition-transform"
                >
                  {editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default CategoriesPage
