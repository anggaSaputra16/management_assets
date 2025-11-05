import { useState, useEffect } from 'react'
import { assetService } from '@/lib/services'
import { useAssetStore, useLocationStore, useDepartmentStore } from '@/stores'

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

      // Process transfer
      await assetService.transferAsset(assetId, formData)
      
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
    <div className="fixed inset-0 bg-white/10 dark:bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Transfer Asset</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-4">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {currentAsset && (
              <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
                <p><strong>Asset:</strong> {currentAsset.name} ({currentAsset.assetTag})</p>
                <p className="text-sm mt-1">
                  <strong>Current Location:</strong> {currentAsset.location?.name || 'N/A'} | 
                  <strong> Department:</strong> {currentAsset.department?.name || 'N/A'}
                </p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                New Location
              </label>
              <select
                name="locationId"
                value={formData.locationId}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select Location</option>
                {locations.map(location => (
                  <option 
                    key={location.id} 
                    value={location.id}
                    disabled={location.id === currentAsset?.locationId}
                  >
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                New Department
              </label>
              <select
                name="departmentId"
                value={formData.departmentId}
                onChange={handleChange}
                className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select Department</option>
                {departments.map(department => (
                  <option 
                    key={department.id} 
                    value={department.id}
                    disabled={department.id === currentAsset?.departmentId}
                  >
                    {department.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Reason for Transfer *
              </label>
              <select
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                required
                className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select Reason</option>
                <option value="DEPARTMENT_CHANGE">Department Change</option>
                <option value="LOCATION_CHANGE">Location Change</option>
                <option value="PROJECT_REASSIGNMENT">Project Reassignment</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Additional details about this transfer..."
              ></textarea>
            </div>
          </div>

          <div className="border-t p-4 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : 'Transfer Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}