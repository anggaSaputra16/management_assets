import { useState, useEffect } from 'react'
import { assetService } from '@/lib/services'
import { useAssetStore, useLocationStore, useDepartmentStore } from '@/stores'
import { Package, MapPin, Building, FileText, X, ArrowRight } from 'lucide-react'

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
    <div className="fixed inset-0 glass-modal-backdrop flex items-center justify-center z-50 p-4">
      <div className="glass-modal rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"></div>
        
        <div className="flex justify-between items-center p-6 border-b border-white/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 glass-button rounded-lg">
              <ArrowRight className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Transfer Asset
              </h2>
              {currentAsset && (
                <p className="text-sm text-white/70 mt-1">
                  {currentAsset.name} ({currentAsset.assetTag})
                </p>
              )}
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="glass-button p-2 rounded-lg text-white/70 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {error && (
              <div className="p-4 glass-card border border-red-300 bg-red-50/50 text-red-700 rounded-lg flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>{error}</span>
              </div>
            )}

            {/* Current Status */}
            {currentAsset && (
              <div className="glass-card p-4">
                <h3 className="text-sm font-medium text-white/90 mb-3 flex items-center space-x-2">
                  <Package className="w-4 h-4" />
                  <span>Current Status</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center justify-between py-2 px-3 bg-white/10 rounded-lg">
                    <span className="text-white/70 flex items-center space-x-2">
                      <MapPin className="w-3 h-3" />
                      <span>Location:</span>
                    </span>
                    <span className="text-white/90 font-medium">
                      {currentAsset.location?.name || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 bg-white/10 rounded-lg">
                    <span className="text-white/70 flex items-center space-x-2">
                      <Building className="w-3 h-3" />
                      <span>Department:</span>
                    </span>
                    <span className="text-white/90 font-medium">
                      {currentAsset.department?.name || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Transfer Details */}
            <div className="glass-card p-4">
              <h3 className="text-sm font-medium text-white/90 mb-4 flex items-center space-x-2">
                <ArrowRight className="w-4 h-4" />
                <span>Transfer Details</span>
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="locationId" className="flex items-center space-x-2 text-sm font-medium text-white/90 mb-2">
                      <MapPin className="w-3 h-3" />
                      <span>New Location</span>
                    </label>
                    <select
                      id="locationId"
                      name="locationId"
                      value={formData.locationId}
                      onChange={handleChange}
                      className="glass-input w-full px-3 py-2 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
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
                    <label htmlFor="departmentId" className="flex items-center space-x-2 text-sm font-medium text-white/90 mb-2">
                      <Building className="w-3 h-3" />
                      <span>New Department</span>
                    </label>
                    <select
                      id="departmentId"
                      name="departmentId"
                      value={formData.departmentId}
                      onChange={handleChange}
                      className="glass-input w-full px-3 py-2 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
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
                  <label htmlFor="reason" className="flex items-center space-x-2 text-sm font-medium text-white/90 mb-2">
                    <FileText className="w-3 h-3" />
                    <span>Reason for Transfer <span className="text-red-400">*</span></span>
                  </label>
                  <select
                    id="reason"
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    className="glass-input w-full px-3 py-2 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
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
                  <label htmlFor="notes" className="block text-sm font-medium text-white/90 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    value={formData.notes}
                    onChange={handleChange}
                    className="glass-input w-full px-3 py-2 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                    placeholder="Enter any additional notes or instructions..."
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/20 p-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="glass-button px-6 py-2 rounded-lg text-white/90 hover:text-white transition-all hover:scale-105"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`glass-button px-6 py-2 rounded-lg text-white font-medium transition-all hover:scale-105 ${
                loading 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
              }`}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <ArrowRight className="w-4 h-4" />
                  <span>Transfer Asset</span>
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}