'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useDepartmentStore } from '@/stores/departmentStore'
import { PlusCircle, Search, Edit, Trash2, Building2, X } from 'lucide-react'

export default function DepartmentsPage() {
  const { user, token, isAuthenticated } = useAuthStore()
  const { 
    departments, 
    loading,
    currentPage,
    pageSize,
    totalDepartments,
    setPage,
    fetchDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment 
  } = useDepartmentStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    budgetLimit: '',
    isActive: true
  })

  useEffect(() => {
    fetchDepartments({ page: 1, limit: pageSize })
  }, [fetchDepartments, pageSize])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const submitData = {
        ...formData,
        budgetLimit: formData.budgetLimit ? parseFloat(formData.budgetLimit) : undefined
      }
      
      if (selectedDepartment) {
        await updateDepartment(selectedDepartment.id, submitData)
        setIsEditModalOpen(false)
      } else {
        await createDepartment(submitData)
        setIsCreateModalOpen(false)
      }
      resetForm()
      // Refresh current page data
      fetchDepartments({ page: currentPage, limit: pageSize, search: searchTerm })
    } catch (error) {
      console.error('Error saving department:', error)
      // Toast is already handled by the store
    }
  }

  const handleEdit = (department) => {
    setSelectedDepartment(department)
    setFormData({
      name: department.name,
      code: department.code,
      description: department.description || '',
      budgetLimit: department.budgetLimit?.toString() || '',
      isActive: department.isActive
    })
    setIsEditModalOpen(true)
  }

  const handleDelete = async () => {
    if (selectedDepartment) {
      try {
        await deleteDepartment(selectedDepartment.id)
        setIsDeleteModalOpen(false)
        setSelectedDepartment(null)
        // Refresh current page data
        fetchDepartments({ page: currentPage, limit: pageSize, search: searchTerm })
      } catch (error) {
        console.error('Error deleting department:', error)
        // Toast is already handled by the store
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      budgetLimit: '',
      isActive: true
    })
    setSelectedDepartment(null)
  }

  const handleSearch = () => {
    fetchDepartments({ page: 1, limit: pageSize, search: searchTerm })
  }

  const handlePageChange = (newPage) => {
    setPage(newPage)
    fetchDepartments({ page: newPage, limit: pageSize, search: searchTerm })
  }

  const totalPages = Math.ceil(totalDepartments / pageSize)

  if (!user) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Building2 className="h-6 w-6 text-[#111]" />
          <h1 className="text-2xl font-bold text-[#111]">Departments</h1>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center space-x-2 glass-button text-white px-4 py-2 rounded-lg hover:scale-105 transition-transform transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Add Department</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="flex gap-4 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#333] h-4 w-4" />
            <input
              type="text"
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 pr-4 py-2 border border-black/10 rounded-lg w-full focus:ring-2 focus:ring-black/20 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-2 glass-button text-white rounded-lg hover:scale-105 transition-transform transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {/* Departments Table */}
      <div className="glass-card shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-black/10">
            <thead className="bg-white/60">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#333] uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#333] uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#333] uppercase tracking-wider">
                  Budget Limit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#333] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[#333] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-black/10">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#333]">
                    Loading departments...
                  </td>
                </tr>
              ) : departments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#333]">
                    No departments found
                  </td>
                </tr>
              ) : (
                departments.map((department) => (
                  <tr key={department.id} className="hover:bg-white/60">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-[#111]">{department.name}</div>
                        {department.description && (
                          <div className="text-sm text-[#333]">{department.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#111]">{department.code}</td>
                    <td className="px-6 py-4 text-sm text-[#111]">
                      {department.budgetLimit 
                        ? `Rp ${new Intl.NumberFormat('id-ID').format(department.budgetLimit)}`
                        : '-'
                      }
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        department.isActive 
                          ? 'bg-white/60 text-[#111]' 
                          : 'bg-white/60 text-[#111]'
                      }`}>
                        {department.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => handleEdit(department)}
                          className="text-[#111] hover:text-[#111] p-1"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedDepartment(department)
                            setIsDeleteModalOpen(true)
                          }}
                          className="text-[#111] hover:scale-110 transition-transform p-1"
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

        {/* Pagination Controls */}
        {totalDepartments > 0 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-black/10">
            <div className="text-sm text-[#333]">
              Showing {Math.min((currentPage - 1) * pageSize + 1, totalDepartments)} to {Math.min(currentPage * pageSize, totalDepartments)} of {totalDepartments} departments
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 glass-button text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform transition-colors"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-[#111]">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-4 py-2 glass-button text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-white/10 dark:bg-black/30 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-card max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-medium text-[#111]">
                {selectedDepartment ? 'Edit Department' : 'Create Department'}
              </h3>
              <button 
                onClick={() => {
                  setIsCreateModalOpen(false)
                  setIsEditModalOpen(false)
                  resetForm()
                }}
                className="text-[#333] hover:text-[#333]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#111] mb-1">
                    Department Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full glass-input rounded-lg px-3 py-2 text-[#111] focus:ring-2 focus:ring-black/20 focus:border-transparent"
                    placeholder="Enter department name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#111] mb-1">
                    Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full glass-input rounded-lg px-3 py-2 text-[#111] focus:ring-2 focus:ring-black/20 focus:border-transparent"
                    placeholder="Enter department code"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#111] mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full glass-input rounded-lg px-3 py-2 text-[#111] focus:ring-2 focus:ring-black/20 focus:border-transparent"
                    placeholder="Enter department description"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#111] mb-1">
                    Budget Limit
                  </label>
                  <input
                    type="number"
                    value={formData.budgetLimit}
                    onChange={(e) => setFormData({ ...formData, budgetLimit: e.target.value })}
                    className="w-full glass-input rounded-lg px-3 py-2 text-[#111] focus:ring-2 focus:ring-black/20 focus:border-transparent"
                    placeholder="Enter budget limit (optional)"
                  />
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded border-black/10 text-[#111] focus:ring-black/20"
                    />
                    <span className="ml-2 text-sm text-[#111]">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false)
                    setIsEditModalOpen(false)
                    resetForm()
                  }}
                  className="px-4 py-2 text-sm font-medium text-[#111] bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white glass-button rounded-lg hover:scale-105 transition-transform disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (selectedDepartment ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-white/10 dark:bg-black/30 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-card max-w-sm w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-[#111] mb-4">Delete Department</h3>
              <p className="text-[#333] mb-6">
                Are you sure you want to delete &ldquo;{selectedDepartment?.name}&rdquo;? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false)
                    setSelectedDepartment(null)
                  }}
                  className="px-4 py-2 text-sm font-medium text-[#111] bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white glass-button rounded-lg hover:scale-105 transition-transform disabled:opacity-50"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
