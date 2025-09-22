'use client'

import { useEffect } from 'react'
import { 
  MapPin,
  Search, 
  Plus, 
  Edit,
  Trash2,
  Building,
  Package
} from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { useAuthStore } from '@/stores/authStore'
import { useLocationStore } from '@/stores/locationStore'

export default function LocationsPage() {
  const { user } = useAuthStore()
  const {
    // State
    loading,
    searchTerm,
    showModal,
    editingLocation,
    formData,
    
    // Actions
    fetchLocations,
    createLocation,
    updateLocation,
    deleteLocation,
    setSearchTerm,
    setShowModal,
    setEditingLocation,
    resetForm,
    handleInputChange,
    
    // Computed
    getFilteredLocations,
    getLocationStats
  } = useLocationStore()

  useEffect(() => {
    fetchLocations()
  }, [fetchLocations])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (editingLocation) {
        await updateLocation(editingLocation.id, formData)
        alert('Location updated successfully!')
      } else {
        await createLocation(formData)
        alert('Location created successfully!')
      }
    } catch (error) {
      console.error('Failed to save location:', error)
      alert(error.message || 'Failed to save location')
    }
  }

  const handleEdit = (location) => {
    setEditingLocation(location)
  }

  const handleDelete = async (locationId) => {
    if (!confirm('Are you sure you want to delete this location?')) return

    try {
      await deleteLocation(locationId)
      alert('Location deleted successfully!')
    } catch (error) {
      console.error('Failed to delete location:', error)
      alert('Failed to delete location')
    }
  }

  const filteredLocations = getFilteredLocations()
  const locationStats = getLocationStats()

  const locationTypes = [
    { value: 'OFFICE', label: 'Office' },
    { value: 'WAREHOUSE', label: 'Warehouse' },
    { value: 'BRANCH', label: 'Branch' },
    { value: 'FACILITY', label: 'Facility' },
    { value: 'REMOTE', label: 'Remote' }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="glass-header p-6 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="gradient-overlay p-2 rounded-lg">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Locations</h1>
              <p className="text-gray-600">Manage office locations and facilities</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowModal(true)}
            className="glass-button flex items-center px-4 py-2 rounded-lg hover:scale-105 transition-transform"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Location
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {locationStats.map((stat, index) => {
            const IconComponent = stat.icon === 'MapPin' ? MapPin : 
                                 stat.icon === 'Building' ? Building : Package
            return (
              <div key={index} className="glass-card p-6 hover:scale-105 transition-transform">
                <div className="flex items-center">
                  <div className="gradient-overlay p-3 rounded-lg">
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Search and Filters */}
        <div className="glass-card rounded-lg">
          <div className="px-6 py-4 border-b border-white/20">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-800">Locations List</h3>
            </div>
          </div>
          
          <div className="p-6">
            {/* Search */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search locations by name, code, city, or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="glass-input w-full pl-10 pr-4 py-2 rounded-lg"
                />
              </div>
            </div>

            {/* Locations Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/20">
                <thead className="glass-header">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Capacity
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
                  ) : filteredLocations.length > 0 ? (
                    filteredLocations.map((location) => (
                      <tr key={location.id} className="hover:bg-white/10 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-800">{location.name}</div>
                            <div className="text-sm text-gray-600">Code: {location.code}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-white/20 text-gray-700 backdrop-blur-sm">
                            {location.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-800">
                            {location.address && <div>{location.address}</div>}
                            <div>{location.city}, {location.state}</div>
                            <div className="text-gray-600">{location.country}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800">
                          {location.capacity || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full backdrop-blur-sm ${
                            location.isActive !== false
                              ? 'bg-green-500/20 text-green-700 border border-green-500/30'
                              : 'bg-red-500/20 text-red-700 border border-red-500/30'
                          }`}>
                            {location.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEdit(location)}
                              className="text-blue-600 hover:text-blue-800 hover:scale-110 transition-all"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            {['ADMIN', 'ASSET_ADMIN'].includes(user?.role) && (
                              <button
                                onClick={() => handleDelete(location.id)}
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
                        <MapPin className="mx-auto h-12 w-12 text-gray-500" />
                        <h3 className="mt-2 text-sm font-medium text-gray-800">No locations found</h3>
                        <p className="mt-1 text-sm text-gray-600">
                          Get started by creating a new location.
                        </p>
                        <div className="mt-6">
                          <button
                            onClick={() => setShowModal(true)}
                            className="glass-button inline-flex items-center px-4 py-2 rounded-md hover:scale-105 transition-transform"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Location
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
                  {editingLocation ? 'Edit Location' : 'Add New Location'}
                </h3>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
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
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      required
                      className="glass-input w-full px-3 py-2 rounded-lg"
                      placeholder="e.g., OFF001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type *
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      required
                      className="glass-input w-full px-3 py-2 rounded-lg"
                    >
                      {locationTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Capacity
                    </label>
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      className="glass-input w-full px-3 py-2 rounded-lg"
                      placeholder="Number of people"
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="glass-input w-full px-3 py-2 rounded-lg"
                    placeholder="Street address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="glass-input w-full px-3 py-2 rounded-lg"
                      placeholder="City"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State/Province
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="glass-input w-full px-3 py-2 rounded-lg"
                      placeholder="State or Province"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      className="glass-input w-full px-3 py-2 rounded-lg"
                      placeholder="Postal code"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="glass-input w-full px-3 py-2 rounded-lg"
                    placeholder="Country"
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
                    className="glass-input w-full px-3 py-2 rounded-lg"
                    placeholder="Optional description"
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
                    Active location
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
                    {editingLocation ? 'Update Location' : 'Create Location'}
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
