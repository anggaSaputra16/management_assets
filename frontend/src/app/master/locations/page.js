'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useLocationStore } from '@/stores/locationStore'
import { Plus, Edit, Trash2, Search, MapPin } from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'

export default function MasterLocationsPage() {
  const {
    locations,
    loading,
    searchTerm,
    showModal,
    editingLocation,
    formData,
    currentPage,
    pageSize,
    totalLocations,
    setSearchTerm,
    setShowModal,
    setEditingLocation,
    setFormData,
    setPage,
    fetchLocations,
    createLocation,
    updateLocation,
    deleteLocation
  } = useLocationStore()

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [locationToDelete, setLocationToDelete] = useState(null)

  useEffect(() => {
    fetchLocations({ page: 1, limit: pageSize })
  }, [fetchLocations, pageSize])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingLocation) {
        await updateLocation(editingLocation.id, formData)
      } else {
        await createLocation(formData)
      }
      setShowModal(false)
      resetForm()
      // Refresh current page data
      fetchLocations({ page: currentPage, limit: pageSize, search: searchTerm })
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleEdit = (location) => {
    setEditingLocation(location)
    setFormData({
      name: location.name || '',
      code: location.code || '',
      address: location.address || '',
      building: location.building || '',
      floor: location.floor || '',
      room: location.room || ''
    })
    setShowModal(true)
  }

  const handleDelete = async () => {
    if (locationToDelete) {
      try {
        await deleteLocation(locationToDelete.id)
        setShowDeleteModal(false)
        setLocationToDelete(null)
        // Refresh current page data
        fetchLocations({ page: currentPage, limit: pageSize, search: searchTerm })
      } catch (error) {
        console.error('Error deleting location:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      address: '',
      building: '',
      floor: '',
      room: ''
    })
    setEditingLocation(null)
  }

  const handleSearch = () => {
    fetchLocations({ page: 1, limit: pageSize, search: searchTerm })
  }

  const handlePageChange = (newPage) => {
    setPage(newPage)
    fetchLocations({ page: newPage, limit: pageSize, search: searchTerm })
  }

  const totalPages = Math.ceil(totalLocations / pageSize)

  return (
    <DashboardLayout title="Master Data - Locations" icon={MapPin}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#111]">Locations</h1>
            <p className="text-[#333]">Manage physical locations and facilities</p>
          </div>
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="glass-button flex items-center px-4 py-2 rounded-lg hover:scale-105 transition-transform"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Location
          </button>
        </div>

        {/* Search */}
        <div className="glass-card p-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#333] w-4 h-4" />
              <input
                type="text"
                placeholder="Search locations..."
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

        {/* Locations Table */}
        <div className="glass-card p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/10">
                  <th className="text-left py-3 px-4 font-medium text-[#111]">Location</th>
                  <th className="text-left py-3 px-4 font-medium text-[#111]">Code</th>
                  <th className="text-left py-3 px-4 font-medium text-[#111]">Address</th>
                  <th className="text-left py-3 px-4 font-medium text-[#111]">Building/Floor</th>
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
                ) : locations.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-[#333]">
                      No locations found
                    </td>
                  </tr>
                ) : (
                  locations.map((location) => (
                    <tr key={location.id} className="border-b border-black/10 hover:bg-white/60">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 text-[#333] mr-2" />
                          <div>
                            <div className="font-medium text-[#111]">{location.name}</div>
                            {location.room && (
                              <div className="text-sm text-[#333]">Room: {location.room}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/60 text-[#111]">
                          {location.code}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#111]">{location.address || '-'}</td>
                      <td className="py-3 px-4 text-[#111]">
                        {[location.building, location.floor].filter(Boolean).join(' / ') || '-'}
                      </td>
                      <td className="py-3 px-4 text-[#111]">
                        {location._count?.assets || 0}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(location)}
                            className="text-[#111] hover:scale-110 transition-transform p-1"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setLocationToDelete(location)
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
          {totalLocations > 0 && (
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-black/10 px-4">
              <div className="text-sm text-[#333]">
                Showing {Math.min((currentPage - 1) * pageSize + 1, totalLocations)} to {Math.min(currentPage * pageSize, totalLocations)} of {totalLocations} locations
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
                {editingLocation ? 'Edit Location' : 'Create Location'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#111] mb-1">
                    Location Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="glass-input w-full px-3 py-2 rounded-lg"
                    placeholder="Enter location name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111] mb-1">
                    Location Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="glass-input w-full px-3 py-2 rounded-lg"
                    placeholder="Enter location code"
                  />
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-1">
                      Building
                    </label>
                    <input
                      type="text"
                      value={formData.building}
                      onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                      className="glass-input w-full px-3 py-2 rounded-lg"
                      placeholder="Building"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-1">
                      Floor
                    </label>
                    <input
                      type="text"
                      value={formData.floor}
                      onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                      className="glass-input w-full px-3 py-2 rounded-lg"
                      placeholder="Floor"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111] mb-1">
                    Room
                  </label>
                  <input
                    type="text"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="glass-input w-full px-3 py-2 rounded-lg"
                    placeholder="Enter room number"
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
                    {editingLocation ? 'Update' : 'Create'}
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
              <h3 className="text-lg font-semibold mb-4 text-[#111]">Delete Location</h3>
              <p className="text-[#333] mb-4">
                Are you sure you want to delete this location? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setLocationToDelete(null)
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