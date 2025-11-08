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
    currentPage,
    pageSize,
    totalVendors,
    setSearchTerm,
    setShowModal,
    setEditingVendor,
    setFormData,
    setPage,
    fetchVendors,
    createVendor,
    updateVendor,
    deleteVendor
  } = useVendorStore()

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [vendorToDelete, setVendorToDelete] = useState(null)

  useEffect(() => {
    fetchVendors({ page: 1, limit: pageSize })
  }, [fetchVendors, pageSize])

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
      // Refresh current page data
      fetchVendors({ page: currentPage, limit: pageSize, search: searchTerm })
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleEdit = (vendor) => {
    setEditingVendor(vendor)
    setFormData({
      name: vendor.name || '',
      code: vendor.code || '',
      contactPerson: vendor.contactPerson || '',
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
        // Refresh current page data
        fetchVendors({ page: currentPage, limit: pageSize, search: searchTerm })
      } catch (error) {
        console.error('Error deleting vendor:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: ''
    })
    setEditingVendor(null)
  }

  const handleSearch = () => {
    fetchVendors({ page: 1, limit: pageSize, search: searchTerm })
  }

  const handlePageChange = (newPage) => {
    setPage(newPage)
    fetchVendors({ page: newPage, limit: pageSize, search: searchTerm })
  }

  const totalPages = Math.ceil(totalVendors / pageSize)

  return (
    <DashboardLayout title="Master Data - Vendors" icon={Building2}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#111]">Vendors</h1>
            <p className="text-[#333]">Manage suppliers and service providers</p>
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#333] w-4 h-4" />
              <input
                type="text"
                placeholder="Search vendors..."
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

        {/* Vendors Table */}
        <div className="glass-card p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/10">
                  <th className="text-left py-3 px-4 font-medium text-[#111]">Vendor</th>
                  <th className="text-left py-3 px-4 font-medium text-[#111]">Code</th>
                  <th className="text-left py-3 px-4 font-medium text-[#111]">Contact Person</th>
                  <th className="text-left py-3 px-4 font-medium text-[#111]">Phone</th>
                  <th className="text-left py-3 px-4 font-medium text-[#111]">Email</th>
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
                ) : vendors.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-[#333]">
                      No vendors found
                    </td>
                  </tr>
                ) : (
                  vendors.map((vendor) => (
                    <tr key={vendor.id} className="border-b border-black/10 hover:bg-white/60">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <Building2 className="w-4 h-4 text-[#333] mr-2" />
                          <div>
                            <div className="font-medium text-[#111]">{vendor.name}</div>
                            {vendor.address && (
                              <div className="text-sm text-[#333]">{vendor.address}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/60 text-[#111]">
                          {vendor.code}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#111]">{vendor.contactPerson || '-'}</td>
                      <td className="py-3 px-4 text-[#111]">{vendor.phone || '-'}</td>
                      <td className="py-3 px-4 text-[#111]">{vendor.email || '-'}</td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(vendor)}
                            className="text-[#111] hover:scale-110 transition-transform p-1"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setVendorToDelete(vendor)
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
          {totalVendors > 0 && (
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-black/10 px-4">
              <div className="text-sm text-[#333]">
                Showing {Math.min((currentPage - 1) * pageSize + 1, totalVendors)} to {Math.min(currentPage * pageSize, totalVendors)} of {totalVendors} vendors
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
                {editingVendor ? 'Edit Vendor' : 'Create Vendor'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#111] mb-1">
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
                  <label className="block text-sm font-medium text-[#111] mb-1">
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
                  <label className="block text-sm font-medium text-[#111] mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="glass-input w-full px-3 py-2 rounded-lg"
                    placeholder="Enter contact person"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
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
                      className="glass-input w-full px-3 py-2 rounded-lg"
                      placeholder="Email address"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111] mb-1">
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
                    className="px-4 py-2 text-[#333] hover:text-[#111]"
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
          <div className="fixed inset-0 bg-white/10 dark:bg-black/30 backdrop-blur-md flex items-center justify-center z-50">
            <div className="glass-card p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4 text-[#111]">Delete Vendor</h3>
              <p className="text-[#333] mb-4">
                Are you sure you want to delete this vendor? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setVendorToDelete(null)
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