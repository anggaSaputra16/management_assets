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
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    fetchCompanies({ search: searchTerm })
  }, [searchTerm, fetchCompanies])

  // Helper to refresh data after CRUD
  const refreshCompanies = async () => {
    await fetchCompanies({ search: searchTerm })
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.name.trim()) errors.name = 'Company name wajib diisi.'
    if (!formData.code.trim()) errors.code = 'Company code wajib diisi.'
    if (formData.code.length < 2 || formData.code.length > 10) errors.code = 'Code 2-10 karakter.'
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) errors.email = 'Format email tidak valid.'
    if (formData.website && !/^https?:\/\/.+\..+/.test(formData.website)) errors.website = 'Format website tidak valid.'
    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errors = validateForm()
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return
    try {
      let result
      if (editingCompany) {
        result = await updateCompany(editingCompany.id, formData)
      } else {
        result = await createCompany(formData)
      }
      if (result === false) {
        // Ambil error dari store jika ada
        setFormErrors({ backend: 'Gagal menyimpan data. Cek duplikat atau format.' })
        return
      }
      setShowModal(false)
      resetForm()
      setFormErrors({})
      await refreshCompanies()
    } catch (error) {
      // Coba ambil error Joi dari response
      if (error?.response?.data?.details) {
        const backendErrors = {}
        error.response.data.details.forEach(msg => {
          // Mapping error ke field jika bisa
          if (msg.toLowerCase().includes('name')) backendErrors.name = msg
          else if (msg.toLowerCase().includes('code')) backendErrors.code = msg
          else if (msg.toLowerCase().includes('email')) backendErrors.email = msg
          else if (msg.toLowerCase().includes('website')) backendErrors.website = msg
          else backendErrors.backend = msg
        })
        setFormErrors(backendErrors)
      } else {
        setFormErrors({ backend: 'Gagal menyimpan data company!' })
      }
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
        await refreshCompanies()
      } catch (error) {
        alert('Gagal menghapus company!')
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
  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading companies...</div>
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
            <h1 className="text-2xl font-bold text-[#111]">Companies</h1>
            <p className="text-[#333]">Manage company information</p>
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#333] w-4 h-4" />
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
                <tr className="border-b border-black/10">
                  <th className="text-left py-3 px-4 font-medium text-[#111]">Company</th>
                  <th className="text-left py-3 px-4 font-medium text-[#111]">Code</th>
                  <th className="text-left py-3 px-4 font-medium text-[#111]">Contact</th>
                  <th className="text-left py-3 px-4 font-medium text-[#111]">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-[#111]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black/10"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-[#333]">
                      No companies found
                    </td>
                  </tr>
                ) : (
                  filteredCompanies.map((company) => (
                    <tr key={company.id} className="border-b border-black/10 hover:bg-white/60">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <Building2 className="w-4 h-4 text-[#333] mr-2" />
                          <div>
                            <div className="font-medium text-[#111]">{company.name}</div>
                            {company.address && (
                              <div className="text-sm text-[#333]">{company.address}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/60 text-[#111]">
                          {company.code}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          {company.email && (
                            <div className="text-sm text-[#111]">{company.email}</div>
                          )}
                          {company.phone && (
                            <div className="text-sm text-[#333]">{company.phone}</div>
                          )}
                          {company.website && (
                            <div className="text-sm text-[#333]">{company.website}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          company.isActive ? 'bg-white/60 text-[#111]' : 'bg-white/60 text-[#111]'
                        }`}>
                          {company.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(company)}
                            className="text-[#111] hover:scale-110 transition-transform p-1"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setCompanyToDelete(company)
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
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
    <div className="fixed inset-0 bg-white/10 dark:bg-black/30 backdrop-blur-md flex items-center justify-center z-50">
            <div className="glass-card p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">
                {editingCompany ? 'Edit Company' : 'Create Company'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#111] mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`glass-input w-full px-3 py-2 rounded-lg ${formErrors.name ? 'border-black/10' : ''}`}
                    placeholder="Enter company name"
                  />
                  {formErrors.name && <div className="text-[#111] text-xs mt-1">{formErrors.name}</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111] mb-1">
                    Company Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className={`glass-input w-full px-3 py-2 rounded-lg ${formErrors.code ? 'border-black/10' : ''}`}
                    placeholder="Enter company code (2-10 chars)"
                    maxLength={10}
                  />
                  {formErrors.code && <div className="text-[#111] text-xs mt-1">{formErrors.code}</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111] mb-1">
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
                    <label className="block text-sm font-medium text-[#111] mb-1">
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
                    <label className="block text-sm font-medium text-[#111] mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`glass-input w-full px-3 py-2 rounded-lg ${formErrors.email ? 'border-black/10' : ''}`}
                      placeholder="Email address"
                    />
                    {formErrors.email && <div className="text-[#111] text-xs mt-1">{formErrors.email}</div>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111] mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className={`glass-input w-full px-3 py-2 rounded-lg ${formErrors.website ? 'border-black/10' : ''}`}
                    placeholder="https://example.com"
                  />
                  {formErrors.website && <div className="text-[#111] text-xs mt-1">{formErrors.website}</div>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-1">
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
                    <label className="block text-sm font-medium text-[#111] mb-1">
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
                  <label className="block text-sm font-medium text-[#111] mb-1">
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
                {formErrors.backend && <div className="text-[#111] text-xs mt-2">{formErrors.backend}</div>}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-black/10 text-[#111] focus:ring-black/20"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm font-medium text-[#111]">
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
                    className="px-4 py-2 text-[#333] hover:text-[#111]"
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
    <div className="fixed inset-0 bg-white/10 dark:bg-black/30 backdrop-blur-md flex items-center justify-center z-50">
            <div className="glass-card p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4 text-[#111]">Delete Company</h3>
              <p className="text-[#333] mb-4">
                Are you sure you want to delete &quot;{companyToDelete?.name}&quot;? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setCompanyToDelete(null)
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