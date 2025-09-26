'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useCompanyStore } from '@/stores/companyStore'
import { Plus, Search, Edit, Trash2, Building2 } from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'

export default function MasterCompaniesPage() {
  const { user } = useAuthStore()
  const { 
    companies, 
    loading, 
    fetchCompanies,
    createCompany,
    updateCompany,
    deleteCompany 
  } = useCompanyStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingCompany, setEditingCompany] = useState(null)
  const [companyToDelete, setCompanyToDelete] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    taxNumber: '',
    registrationNumber: '',
    description: '',
    isActive: true
  })

  useEffect(() => {
    fetchCompanies({ search: searchTerm })
  }, [searchTerm, fetchCompanies])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingCompany) {
        await updateCompany(editingCompany.id, formData)
      } else {
        await createCompany(formData)
      }
      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('Error saving company:', error)
    }
  }

  const handleEdit = (company) => {
    setEditingCompany(company)
    setFormData({
      name: company.name || '',
      code: company.code || '',
      address: company.address || '',
      phone: company.phone || '',
      email: company.email || '',
      website: company.website || '',
      taxNumber: company.taxNumber || '',
      registrationNumber: company.registrationNumber || '',
      description: company.description || '',
      isActive: company.isActive !== false
    })
    setShowModal(true)
  }

  const handleDelete = async () => {
    if (companyToDelete) {
      try {
        await deleteCompany(companyToDelete.id)
        setShowDeleteModal(false)
        setCompanyToDelete(null)
      } catch (error) {
        console.error('Error deleting company:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      address: '',
      phone: '',
      email: '',
      website: '',
      taxNumber: '',
      registrationNumber: '',
      description: '',
      isActive: true
    })
    setEditingCompany(null)
  }

  if (!user) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  const filteredCompanies = companies.filter(comp =>
    comp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comp.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comp.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <DashboardLayout title="Master Data - Companies" icon={Building2}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
            <p className="text-gray-600">Manage company information</p>
          </div>
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="glass-button flex items-center px-4 py-2 rounded-lg hover:scale-105 transition-transform"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Company
          </button>
        </div>

        {/* Search */}
        <div className="glass-card p-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="glass-input w-full pl-10 pr-4 py-2 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Companies Table */}
        <div className="glass-card p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Company</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Code</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Contact</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-500">
                      No companies found
                    </td>
                  </tr>
                ) : (
                  filteredCompanies.map((company) => (
                    <tr key={company.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div className="font-medium text-gray-900">{company.name}</div>
                            {company.address && (
                              <div className="text-sm text-gray-500">{company.address}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {company.code}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          {company.email && (
                            <div className="text-sm text-gray-900">{company.email}</div>
                          )}
                          {company.phone && (
                            <div className="text-sm text-gray-500">{company.phone}</div>
                          )}
                          {company.website && (
                            <div className="text-sm text-gray-500">{company.website}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          company.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {company.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(company)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setCompanyToDelete(company)
                              setShowDeleteModal(true)
                            }}
                            className="text-red-600 hover:text-red-800 p-1"
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
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="glass-card p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">
                {editingCompany ? 'Edit Company' : 'Create Company'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="glass-input w-full px-3 py-2 rounded-lg"
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="glass-input w-full px-3 py-2 rounded-lg"
                    placeholder="Enter company code (2-10 chars)"
                    maxLength={10}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="glass-input w-full px-3 py-2 rounded-lg"
                    placeholder="Enter company address"
                    rows="2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="glass-input w-full px-3 py-2 rounded-lg"
                      placeholder="Phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="glass-input w-full px-3 py-2 rounded-lg"
                      placeholder="Email address"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="glass-input w-full px-3 py-2 rounded-lg"
                    placeholder="https://example.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tax Number
                    </label>
                    <input
                      type="text"
                      value={formData.taxNumber}
                      onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                      className="glass-input w-full px-3 py-2 rounded-lg"
                      placeholder="Tax number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Registration Number
                    </label>
                    <input
                      type="text"
                      value={formData.registrationNumber}
                      onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                      className="glass-input w-full px-3 py-2 rounded-lg"
                      placeholder="Registration number"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="glass-input w-full px-3 py-2 rounded-lg"
                    placeholder="Company description"
                    rows="2"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">
                    Active
                  </label>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="glass-button px-4 py-2 rounded-lg"
                  >
                    {editingCompany ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="glass-card p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4 text-red-600">Delete Company</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete &quot;{companyToDelete?.name}&quot;? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setCompanyToDelete(null)
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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