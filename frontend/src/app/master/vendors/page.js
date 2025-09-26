'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useVendorStore } from '@/stores/vendorStore'
import { Plus, Edit, Trash2, Search, Building2 } from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'

export default function MasterVendorsPage() {
  const {
    vendors,
    loading,
    searchTerm,
    showModal,
    editingVendor,
    formData,
    setSearchTerm,
    setShowModal,
    setEditingVendor,
    setFormData,
    fetchVendors,
    createVendor,
    updateVendor,
    deleteVendor
  } = useVendorStore()

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [vendorToDelete, setVendorToDelete] = useState(null)

  useEffect(() => {
    fetchVendors()
  }, [fetchVendors])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingVendor) {
        await updateVendor(editingVendor.id, formData)
      } else {
        await createVendor(formData)
      }
      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleEdit = (vendor) => {
    setEditingVendor(vendor)
    setFormData({
      name: vendor.name || '',
      code: vendor.code || '',
      contact_person: vendor.contact_person || '',
      phone: vendor.phone || '',
      email: vendor.email || '',
      address: vendor.address || ''
    })
    setShowModal(true)
  }

  const handleDelete = async () => {
    if (vendorToDelete) {
      try {
        await deleteVendor(vendorToDelete.id)
        setShowDeleteModal(false)
        setVendorToDelete(null)
      } catch (error) {
        console.error('Error deleting vendor:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      contact_person: '',
      phone: '',
      email: '',
      address: ''
    })
    setEditingVendor(null)
  }

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <DashboardLayout title="Master Data - Vendors" icon={Building2}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
            <p className="text-gray-600">Manage suppliers and service providers</p>
          </div>
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="glass-button flex items-center px-4 py-2 rounded-lg hover:scale-105 transition-transform"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Vendor
          </button>
        </div>

        {/* Search */}
        <div className="glass-card p-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="glass-input w-full pl-10 pr-4 py-2 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Vendors Table */}
        <div className="glass-card p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Vendor</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Code</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Contact Person</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Phone</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-500">
                      No vendors found
                    </td>
                  </tr>
                ) : (
                  filteredVendors.map((vendor) => (
                    <tr key={vendor.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div className="font-medium text-gray-900">{vendor.name}</div>
                            {vendor.address && (
                              <div className="text-sm text-gray-500">{vendor.address}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {vendor.code}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-700">{vendor.contact_person || '-'}</td>
                      <td className="py-3 px-4 text-gray-700">{vendor.phone || '-'}</td>
                      <td className="py-3 px-4 text-gray-700">{vendor.email || '-'}</td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(vendor)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setVendorToDelete(vendor)
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
                {editingVendor ? 'Edit Vendor' : 'Create Vendor'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="glass-input w-full px-3 py-2 rounded-lg"
                    placeholder="Enter vendor name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="glass-input w-full px-3 py-2 rounded-lg"
                    placeholder="Enter vendor code"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    className="glass-input w-full px-3 py-2 rounded-lg"
                    placeholder="Enter contact person"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
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
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="glass-input w-full px-3 py-2 rounded-lg"
                    placeholder="Enter address"
                    rows="2"
                  />
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
                    {editingVendor ? 'Update' : 'Create'}
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
              <h3 className="text-lg font-semibold mb-4 text-red-600">Delete Vendor</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete this vendor? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setVendorToDelete(null)
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