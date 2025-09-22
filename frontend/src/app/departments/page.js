'use client'

import { useEffect, useState } from 'react'
import { 
  Building,
  Search, 
  Plus, 
  Edit,
  Trash2,
  Users,
  User
} from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { useAuthStore } from '@/stores/authStore'
import { departmentService } from '@/lib/services/departmentService'

export default function DepartmentsPage() {
  const { user } = useAuthStore()
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    managerId: '',
    parentId: '',
    budget: '',
    isActive: true
  })



  useEffect(() => {
    fetchDepartments()
  }, [])

  const fetchDepartments = async () => {
    try {
      setLoading(true)
      const response = await departmentService.getAllDepartments()
      setDepartments(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Failed to fetch departments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const departmentData = {
        ...formData,
        managerId: formData.managerId ? parseInt(formData.managerId) : null,
        parentId: formData.parentId ? parseInt(formData.parentId) : null,
        budget: formData.budget ? parseFloat(formData.budget.replace(/,/g, '')) : null
      }

      if (editingDepartment) {
        await departmentService.updateDepartment(editingDepartment.id, departmentData)
        alert('Department updated successfully!')
      } else {
        await departmentService.createDepartment(departmentData)
        alert('Department created successfully!')
      }
      
      fetchDepartments()
      resetForm()
    } catch (error) {
      console.error('Failed to save department:', error)
      alert(error.response?.data?.message || 'Failed to save department')
    }
  }

  const handleEdit = (department) => {
    setEditingDepartment(department)
    
    // Format budget dengan koma untuk tampilan
    const formattedBudget = department.budget 
      ? department.budget.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      : ''
    
    setFormData({
      name: department.name || '',
      code: department.code || '',
      description: department.description || '',
      managerId: department.managerId || '',
      parentId: department.parentId || '',
      budget: formattedBudget,
      isActive: department.isActive !== false
    })
    setShowModal(true)
  }

  const handleDelete = async (departmentId) => {
    if (!confirm('Are you sure you want to delete this department?')) return

    try {
      await departmentService.deleteDepartment(departmentId)
      alert('Department deleted successfully!')
      fetchDepartments()
    } catch (error) {
      console.error('Failed to delete department:', error)
      alert('Failed to delete department')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      managerId: '',
      parentId: '',
      budget: '',
      isActive: true
    })
    setEditingDepartment(null)
    setShowModal(false)
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // Handler khusus untuk budget dengan format ribuan
  const handleBudgetChange = (e) => {
    const value = e.target.value
    
    // Hapus semua karakter non-digit
    const numericValue = value.replace(/[^0-9]/g, '')
    
    // Format dengan pemisah ribuan
    const formattedValue = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    
    setFormData(prev => ({
      ...prev,
      budget: formattedValue
    }))
  }



  const filteredDepartments = departments.filter(department =>
    department.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    department.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    department.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const departmentStats = [
    {
      title: 'Total Departments',
      value: departments.length,
      icon: Building,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'Active Departments',
      value: departments.filter(d => d.isActive !== false).length,
      icon: Building,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total Employees',
      value: departments.reduce((sum, d) => sum + (d.employeeCount || 0), 0),
      icon: Users,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'With Managers',
      value: departments.filter(d => d.managerId).length,
      icon: User,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="glass-header p-6 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="gradient-overlay p-2 rounded-lg">
              <Building className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Departments</h1>
              <p className="text-gray-600">Manage organizational departments</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowModal(true)}
            className="glass-button flex items-center px-4 py-2 rounded-lg hover:scale-105 transition-transform"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Department
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {departmentStats.map((stat, index) => (
            <div key={index} className="glass-card p-6 hover:scale-105 transition-transform">
              <div className="flex items-center">
                <div className="gradient-overlay p-3 rounded-lg">
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="glass-card rounded-lg">
          <div className="px-6 py-4 border-b border-white/20">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-800">Departments List</h3>
            </div>
          </div>
          
          <div className="p-6">
            {/* Search */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search departments by name, code, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="glass-input w-full pl-10 pr-4 py-2 rounded-lg"
                />
              </div>
            </div>

            {/* Departments Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/20">
                <thead className="glass-header">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Manager
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Employees
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Budget
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
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td colSpan="6" className="px-6 py-4">
                          <div className="animate-pulse flex space-x-4">
                            <div className="h-4 bg-white/20 rounded w-full"></div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : filteredDepartments.length > 0 ? (
                    filteredDepartments.map((department) => (
                      <tr key={department.id} className="hover:bg-white/10 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-800">{department.name}</div>
                            <div className="text-sm text-gray-600">Code: {department.code}</div>
                            {department.description && (
                              <div className="text-xs text-gray-500 mt-1">{department.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {department.manager ? (
                            <div className="flex items-center">
                              <User className="h-4 w-4 text-gray-500 mr-2" />
                              <div>
                                <div className="text-sm font-medium text-gray-800">
                                  {department.manager.firstName} {department.manager.lastName}
                                </div>
                                <div className="text-sm text-gray-600">{department.manager.email}</div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500">No manager assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="text-sm text-gray-800">{department.employeeCount || 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800">
                          {department.budget ? (
                            new Intl.NumberFormat('id-ID', {
                              style: 'currency',
                              currency: 'IDR'
                            }).format(department.budget)
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full backdrop-blur-sm ${
                            department.isActive !== false
                              ? 'bg-green-500/20 text-green-700 border border-green-500/30'
                              : 'bg-red-500/20 text-red-700 border border-red-500/30'
                          }`}>
                            {department.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEdit(department)}
                              className="text-green-600 hover:text-green-800 hover:scale-110 transition-all"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            {['ADMIN', 'ASSET_ADMIN'].includes(user?.role) && (
                              <button
                                onClick={() => handleDelete(department.id)}
                                className="text-red-600 hover:text-red-800 hover:scale-110 transition-all"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <Building className="mx-auto h-12 w-12 text-gray-500" />
                        <h3 className="mt-2 text-sm font-medium text-gray-800">No departments found</h3>
                        <p className="mt-1 text-sm text-gray-600">
                          Get started by creating a new department.
                        </p>
                        <div className="mt-6">
                          <button
                            onClick={() => setShowModal(true)}
                            className="glass-button inline-flex items-center px-4 py-2 rounded-md hover:scale-105 transition-transform"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Department
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="glass-modal max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
              <div className="px-6 py-4 border-b border-white/20">
                <h3 className="text-lg font-medium text-gray-800">
                  {editingDepartment ? 'Edit Department' : 'Add New Department'}
                </h3>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="glass-input w-full px-3 py-2 rounded-lg"
                      placeholder="Enter department name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department Code *
                    </label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      required
                      className="glass-input w-full px-3 py-2 rounded-lg"
                      placeholder="e.g., IT, HR, FIN"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Manager
                    </label>
                    <select
                      name="managerId"
                      value={formData.managerId}
                      onChange={handleInputChange}
                      className="glass-input w-full px-3 py-2 rounded-lg"
                    >
                      <option value="" className="text-gray-500">Select Manager</option>
                      {/* This would be populated with users from API */}
                      <option value="1" className="text-gray-900">John Doe</option>
                      <option value="2" className="text-gray-900">Jane Smith</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Parent Department
                    </label>
                    <select
                      name="parentId"
                      value={formData.parentId}
                      onChange={handleInputChange}
                      className="glass-input w-full px-3 py-2 rounded-lg"
                    >
                      <option value="">No Parent (Top Level)</option>
                      {departments
                        .filter(d => d.id !== editingDepartment?.id)
                        .map(dept => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))
                      }
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Budget (IDR)
                    </label>
                    <input
                      type="text"
                      name="budget"
                      value={formData.budget}
                      onChange={handleBudgetChange}
                      className="glass-input w-full px-3 py-2 rounded-lg"
                      placeholder="Contoh: 50,000,000"
                    />
                  </div>
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
                    className="glass-input w-full px-3 py-2 rounded-lg resize-vertical"
                    placeholder="Department description and responsibilities"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                    Active department
                  </label>
                </div>

                <div className="flex items-center justify-end space-x-4 pt-4 border-t border-white/20">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="glass-button px-4 py-2 rounded-lg hover:scale-105 transition-transform"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="gradient-overlay px-4 py-2 text-white rounded-lg hover:scale-105 transition-transform"
                  >
                    {editingDepartment ? 'Update Department' : 'Create Department'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
