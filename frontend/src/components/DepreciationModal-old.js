import { useState, useEffect } from 'react'
import { useAssetStore, useDepreciationStore } from '@/stores'

export default function DepreciationModal({ assetId, isOpen, onClose, onComplete }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { currentAsset, fetchAsset } = useAssetStore()
  const { 
    setDepreciation, 
    getDepreciation,
    currentCalculation,
    resetState 
  } = useDepreciationStore()
  
  const [formData, setFormData] = useState({
    depreciationMethod: 'STRAIGHT_LINE',
    usefulLife: 5,
    salvageValue: 0,
    depreciationRate: 0.2,
    notes: ''
  })

  useEffect(() => {
    if (isOpen && assetId) {
      resetState()
      fetchAsset(assetId)
      
      // Try to get existing depreciation data
      getDepreciation(assetId).catch(() => {
        // Silently fail if no depreciation is set
        console.log('No depreciation data available yet')
      })
    }
  }, [isOpen, assetId, fetchAsset, getDepreciation, resetState])

  // Update form if we have an existing depreciation calculation
  useEffect(() => {
    if (currentCalculation && currentAsset?.purchasePrice) {
      setFormData({
        depreciationMethod: currentCalculation.depreciationMethod || 'STRAIGHT_LINE',
        usefulLife: currentCalculation.usefulLife || 5,
        salvageValue: currentCalculation.salvageValue || 0,
        depreciationRate: currentCalculation.depreciationMethod === 'DECLINING_BALANCE' 
          ? currentCalculation.depreciationRate || 0.2 
          : 0.2,
        notes: currentCalculation.notes || ''
      })
    } else if (currentAsset?.purchasePrice) {
      // Set salvage value to 10% of purchase price as default
      setFormData(prev => ({
        ...prev,
        salvageValue: Math.round(currentAsset.purchasePrice * 0.1 * 100) / 100
      }))
    }
  }, [currentCalculation, currentAsset])

  const handleChange = (e) => {
    const { name, value } = e.target
    let parsedValue = value

    // Convert numeric fields
    if (['usefulLife', 'salvageValue', 'depreciationRate'].includes(name)) {
      parsedValue = parseFloat(value) || 0
    }

    setFormData(prev => ({
      ...prev,
      [name]: parsedValue
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate form
      if (!currentAsset?.purchasePrice) {
        throw new Error('Asset must have a purchase price to set up depreciation')
      }

      if (formData.salvageValue >= currentAsset.purchasePrice) {
        throw new Error('Salvage value must be less than purchase price')
      }

      if (formData.depreciationMethod === 'DECLINING_BALANCE' && 
          (formData.depreciationRate <= 0 || formData.depreciationRate > 1)) {
        throw new Error('Depreciation rate must be between 0 and 1')
      }

      // Process depreciation setup
      await setDepreciation(assetId, formData)
      onComplete?.()
      onClose()
    } catch (error) {
      setError(error.message || 'Failed to set up depreciation')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return 'N/A'
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-semibold">Setup Asset Depreciation</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="overflow-y-auto">
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
                  <strong>Purchase Price:</strong> {formatCurrency(currentAsset.purchasePrice)} | 
                  <strong> Purchase Date:</strong> {currentAsset.purchaseDate 
                    ? new Date(currentAsset.purchaseDate).toLocaleDateString() 
                    : 'N/A'}
                </p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Depreciation Method *
              </label>
              <select
                name="depreciationMethod"
                value={formData.depreciationMethod}
                onChange={handleChange}
                required
                className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="STRAIGHT_LINE">Straight Line</option>
                <option value="DECLINING_BALANCE">Declining Balance</option>
                <option value="UNITS_OF_PRODUCTION">Units of Production</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {formData.depreciationMethod === 'STRAIGHT_LINE'
                  ? 'Straight Line: Equal depreciation over useful life'
                  : formData.depreciationMethod === 'DECLINING_BALANCE'
                  ? 'Declining Balance: Accelerated depreciation with a fixed rate applied to current value'
                  : 'Units of Production: Depreciation based on actual usage/production units'}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Useful Life (Years) *
              </label>
              <input
                type="number"
                name="usefulLife"
                value={formData.usefulLife}
                onChange={handleChange}
                min="1"
                max="50"
                required
                className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Salvage Value *
              </label>
              <input
                type="number"
                name="salvageValue"
                value={formData.salvageValue}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
                className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Estimated value at the end of its useful life.
              </p>
            </div>

            {formData.depreciationMethod === 'DECLINING_BALANCE' && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Depreciation Rate *
                </label>
                <input
                  type="number"
                  name="depreciationRate"
                  value={formData.depreciationRate}
                  onChange={handleChange}
                  min="0.01"
                  max="0.99"
                  step="0.01"
                  required
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Rate at which the asset value declines (e.g., 0.2 for 20% per year)
                </p>
              </div>
            )}

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
                placeholder="Additional notes about depreciation..."
              ></textarea>
            </div>
          </div>

          <div className="border-t p-4 flex justify-end space-x-2 sticky bottom-0 bg-white">
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
              ) : 'Save Depreciation Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}