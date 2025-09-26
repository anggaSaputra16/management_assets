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
    setSearchTerm,
    setShowModal,
    setEditingLocation,
    setFormData,
    fetchLocations,
    createLocation,
    updateLocation,
    deleteLocation
  } = useLocationStore()

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [locationToDelete, setLocationToDelete] = useState(null)

  useEffect(() => {
    fetchLocations()
  }, [fetchLocations])

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

  const filteredLocations = locations.filter(loc =>
    loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <DashboardLayout title="Master Data - Locations" icon={MapPin}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
            <p className="text-gray-600">Manage physical locations and facilities</p>
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="glass-input w-full pl-10 pr-4 py-2 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Locations Table */}
        <div className="glass-card p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Location</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Code</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Address</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Building/Floor</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Assets Count</th>
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
                ) : filteredLocations.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-500">
                      No locations found
                    </td>
                  </tr>
                ) : (
                  filteredLocations.map((location) => (
                    <tr key={location.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div className="font-medium text-gray-900">{location.name}</div>
                            {location.room && (
                              <div className="text-sm text-gray-500">Room: {location.room}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {location.code}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-700">{location.address || '-'}</td>
                      <td className="py-3 px-4 text-gray-700">
                        {[location.building, location.floor].filter(Boolean).join(' / ') || '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {location._count?.assets || 0}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(location)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setLocationToDelete(location)
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
                {editingLocation ? 'Edit Location' : 'Create Location'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="glass-card p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4 text-red-600">Delete Location</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete this location? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setLocationToDelete(null)
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