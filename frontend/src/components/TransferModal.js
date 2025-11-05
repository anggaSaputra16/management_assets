import { useState, useEffect } from 'react'
import { assetService } from '@/lib/services'
import { useAssetStore, useLocationStore, useDepartmentStore } from '@/stores'
import { Package, MapPin, Building, FileText, ArrowRight } from 'lucide-react'
import HighContrastModal from '@/components/ui/HighContrastModal'

export default function TransferModal({ assetId, isOpen, onClose, onTransferComplete }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { currentAsset, fetchAsset } = useAssetStore()
  const { locations, fetchLocations } = useLocationStore()
  const { departments, fetchDepartments } = useDepartmentStore()
  
  const [formData, setFormData] = useState({
    locationId: '',
    departmentId: '',
    reason: '',
    notes: ''
  })

  // Load asset and required data
  useEffect(() => {
    if (isOpen && assetId) {
      fetchAsset(assetId)
      fetchLocations()
      fetchDepartments()
    }
  }, [isOpen, assetId, fetchAsset, fetchLocations, fetchDepartments])

  // Update form with current asset data when loaded
  useEffect(() => {
    if (currentAsset) {
      setFormData(prev => ({
        ...prev,
        locationId: currentAsset.locationId || '',
        departmentId: currentAsset.departmentId || ''
      }))
    }
  }, [currentAsset])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate form
      if (!formData.locationId && !formData.departmentId) {
        throw new Error('Please select at least a new location or department')
      }

      if (!formData.reason) {
        throw new Error('Please provide a reason for the transfer')
      }

      // Check if anything actually changed
      if (
        formData.locationId === currentAsset.locationId && 
        formData.departmentId === currentAsset.departmentId
      ) {
        throw new Error('No changes detected. Please change location or department.')
      }

      // Process transfer - map frontend fields to backend fields
      const transferData = {
        toLocationId: formData.locationId !== currentAsset.locationId ? formData.locationId : undefined,
        toDepartmentId: formData.departmentId !== currentAsset.departmentId ? formData.departmentId : undefined,
        reason: formData.reason,
        notes: formData.notes,
        effectiveDate: new Date()
      }

      // Remove undefined values
      Object.keys(transferData).forEach(key => {
        if (transferData[key] === undefined) {
          delete transferData[key]
        }
      })

      await assetService.transferAsset(assetId, transferData)
      
      // Refresh asset data and notify parent
      await fetchAsset(assetId)
      onTransferComplete?.()
      onClose()
    } catch (error) {
      setError(error.message || 'Failed to transfer asset')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <HighContrastModal isOpen={isOpen} title="Transfer Asset" onClose={onClose}>
      <div className="w-full max-h-[70vh] overflow-y-auto">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400" />

        <form onSubmit={handleSubmit} className="flex-1">
          <div className="p-0 space-y-4">
            {error && (
              <div className="p-4 border border-red-300 bg-red-50 text-red-700 rounded-lg flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span>{error}</span>
              </div>
            )}

            {/* Current Status */}
            {currentAsset && (
              <div className="p-4 border rounded-lg">
                <h3 className="text-sm font-medium mb-3 flex items-center space-x-2">
                  <Package className="w-4 h-4" />
                  <span>Current Status</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 flex items-center space-x-2">
                      <MapPin className="w-3 h-3" />
                      <span>Location:</span>
                    </span>
                    <span className="text-gray-900 font-medium">
                      {currentAsset.location?.name || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 flex items-center space-x-2">
                      <Building className="w-3 h-3" />
                      <span>Department:</span>
                    </span>
                    <span className="text-gray-900 font-medium">
                      {currentAsset.department?.name || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Transfer Details */}
            <div className="p-4 border rounded-lg">
              <h3 className="text-sm font-medium mb-4 flex items-center space-x-2">
                <ArrowRight className="w-4 h-4" />
                <span>Transfer Details</span>
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="locationId" className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-3 h-3" />
                      <span>New Location</span>
                    </label>
                    <select
                      id="locationId"
                      name="locationId"
                      value={formData.locationId}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="">Select location...</option>
                      {locations.map(location => (
                        <option 
                          key={location.id} 
                          value={location.id}
                          disabled={location.id === currentAsset?.locationId}
                        >
                          {location.name} {location.id === currentAsset?.locationId && '(Current)'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="departmentId" className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                      <Building className="w-3 h-3" />
                      <span>New Department</span>
                    </label>
                    <select
                      id="departmentId"
                      name="departmentId"
                      value={formData.departmentId}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="">Select department...</option>
                      {departments.map(department => (
                        <option 
                          key={department.id} 
                          value={department.id}
                          disabled={department.id === currentAsset?.departmentId}
                        >
                          {department.name} {department.id === currentAsset?.departmentId && '(Current)'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="reason" className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                    <FileText className="w-3 h-3" />
                    <span>Reason for Transfer <span className="text-red-400">*</span></span>
                  </label>
                  <select
                    id="reason"
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-400"
                    required
                  >
                    <option value="">Select reason...</option>
                    <option value="DEPARTMENT_CHANGE">Department Change</option>
                    <option value="LOCATION_CHANGE">Location Change</option>
                    <option value="PROJECT_REASSIGNMENT">Project Reassignment</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    value={formData.notes}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-400 resize-none"
                    placeholder="Enter any additional notes or instructions..."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-2 rounded-lg text-gray-700 border hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-2 rounded-lg text-white font-medium ${
                  loading ? 'bg-gray-400 opacity-70' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? 'Processing...' : 'Transfer Asset'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </HighContrastModal>
  )
}