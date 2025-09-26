import { useState, useEffect } from 'react'
import { useAssetStore, useDepreciationStore } from '@/stores'
import { Calculator, DollarSign, Clock, Percent, FileText, X, TrendingDown } from 'lucide-react'

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
        salvageValue: Math.round(currentAsset.purchasePrice * 0.1)
      }))
    }
  }, [currentCalculation, currentAsset])

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!currentAsset?.purchasePrice) {
        throw new Error('Asset must have a purchase price for depreciation calculation')
      }

      if (formData.salvageValue >= currentAsset.purchasePrice) {
        throw new Error('Salvage value must be less than purchase price')
      }

      if (formData.usefulLife <= 0) {
        throw new Error('Useful life must be greater than 0')
      }

      const depreciationData = {
        ...formData,
        originalValue: currentAsset.purchasePrice
      }

      await setDepreciation(assetId, depreciationData)
      onComplete?.()
      onClose()
    } catch (error) {
      setError(error.message || 'Failed to set depreciation')
    } finally {
      setLoading(false)
    }
  }

  const calculatePreview = () => {
    if (!currentAsset?.purchasePrice || formData.usefulLife <= 0) return null

    const originalValue = currentAsset.purchasePrice
    const { salvageValue, usefulLife, depreciationMethod, depreciationRate } = formData
    const depreciableAmount = originalValue - salvageValue

    if (depreciationMethod === 'STRAIGHT_LINE') {
      const annualDepreciation = depreciableAmount / usefulLife
      return {
        annualDepreciation,
        monthlyDepreciation: annualDepreciation / 12,
        totalDepreciation: depreciableAmount
      }
    } else if (depreciationMethod === 'DECLINING_BALANCE') {
      const annualDepreciation = originalValue * depreciationRate
      return {
        annualDepreciation,
        monthlyDepreciation: annualDepreciation / 12,
        totalDepreciation: depreciableAmount
      }
    }
    
    return null
  }

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return 'N/A'
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const preview = calculatePreview()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 glass-modal-backdrop flex items-center justify-center z-50 p-4">
      <div className="glass-modal rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"></div>
        
        <div className="flex justify-between items-center p-6 border-b border-white/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 glass-button rounded-lg">
              <TrendingDown className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Depreciation Setup
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

            {/* Asset Information */}
            {currentAsset && (
              <div className="glass-card p-4">
                <h3 className="text-sm font-medium text-white/90 mb-3 flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Asset Value</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center justify-between py-2 px-3 bg-white/10 rounded-lg">
                    <span className="text-white/70">Purchase Price:</span>
                    <span className="text-white/90 font-medium">
                      {formatCurrency(currentAsset.purchasePrice)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 bg-white/10 rounded-lg">
                    <span className="text-white/70">Purchase Date:</span>
                    <span className="text-white/90 font-medium">
                      {currentAsset.purchaseDate ? new Date(currentAsset.purchaseDate).toLocaleDateString('id-ID') : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 bg-white/10 rounded-lg">
                    <span className="text-white/70">Current Status:</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      currentCalculation 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {currentCalculation ? 'Configured' : 'Not Set'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Depreciation Settings */}
              <div className="glass-card p-4">
                <h3 className="text-sm font-medium text-white/90 mb-4 flex items-center space-x-2">
                  <Calculator className="w-4 h-4" />
                  <span>Depreciation Settings</span>
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="depreciationMethod" className="block text-sm font-medium text-white/90 mb-2">
                      Method
                    </label>
                    <select
                      id="depreciationMethod"
                      name="depreciationMethod"
                      value={formData.depreciationMethod}
                      onChange={handleChange}
                      className="glass-input w-full px-3 py-2 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    >
                      <option value="STRAIGHT_LINE">Straight Line</option>
                      <option value="DECLINING_BALANCE">Declining Balance</option>
                      <option value="DOUBLE_DECLINING_BALANCE">Double Declining Balance</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label htmlFor="usefulLife" className="flex items-center space-x-2 text-sm font-medium text-white/90 mb-2">
                        <Clock className="w-3 h-3" />
                        <span>Useful Life (years)</span>
                      </label>
                      <input
                        type="number"
                        id="usefulLife"
                        name="usefulLife"
                        value={formData.usefulLife}
                        onChange={handleChange}
                        min="1"
                        max="50"
                        step="1"
                        className="glass-input w-full px-3 py-2 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="salvageValue" className="flex items-center space-x-2 text-sm font-medium text-white/90 mb-2">
                        <DollarSign className="w-3 h-3" />
                        <span>Salvage Value</span>
                      </label>
                      <input
                        type="number"
                        id="salvageValue"
                        name="salvageValue"
                        value={formData.salvageValue}
                        onChange={handleChange}
                        min="0"
                        step="1000"
                        className="glass-input w-full px-3 py-2 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      />
                    </div>

                    {(formData.depreciationMethod === 'DECLINING_BALANCE' || 
                      formData.depreciationMethod === 'DOUBLE_DECLINING_BALANCE') && (
                      <div>
                        <label htmlFor="depreciationRate" className="flex items-center space-x-2 text-sm font-medium text-white/90 mb-2">
                          <Percent className="w-3 h-3" />
                          <span>Depreciation Rate</span>
                        </label>
                        <input
                          type="number"
                          id="depreciationRate"
                          name="depreciationRate"
                          value={formData.depreciationRate}
                          onChange={handleChange}
                          min="0.01"
                          max="1"
                          step="0.01"
                          className="glass-input w-full px-3 py-2 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        />
                        <p className="text-xs text-white/60 mt-1">
                          {Math.round(formData.depreciationRate * 100)}% per year
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="glass-card p-4">
                <h3 className="text-sm font-medium text-white/90 mb-4 flex items-center space-x-2">
                  <Calculator className="w-4 h-4" />
                  <span>Calculation Preview</span>
                </h3>
                
                {preview && currentAsset ? (
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span className="text-white/70">Original Value:</span>
                      <span className="text-white/90 font-medium">
                        {formatCurrency(currentAsset.purchasePrice)}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span className="text-white/70">Salvage Value:</span>
                      <span className="text-white/90 font-medium">
                        {formatCurrency(formData.salvageValue)}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span className="text-white/70">Depreciable Amount:</span>
                      <span className="text-white/90 font-medium">
                        {formatCurrency(currentAsset.purchasePrice - formData.salvageValue)}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span className="text-white/70">Annual Depreciation:</span>
                      <span className="text-green-400 font-medium">
                        {formatCurrency(preview.annualDepreciation)}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-white/70">Monthly Depreciation:</span>
                      <span className="text-green-400 font-medium">
                        {formatCurrency(preview.monthlyDepreciation)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calculator className="w-8 h-8 text-white/30 mx-auto mb-2" />
                    <p className="text-white/60 text-sm">
                      Preview will show when asset has purchase price
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="glass-card p-4">
              <label htmlFor="notes" className="flex items-center space-x-2 text-sm font-medium text-white/90 mb-2">
                <FileText className="w-3 h-3" />
                <span>Notes</span>
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                className="glass-input w-full px-3 py-2 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                placeholder="Add any notes about this depreciation setup..."
              />
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
              disabled={loading || !currentAsset?.purchasePrice}
              className={`glass-button px-6 py-2 rounded-lg text-white font-medium transition-all hover:scale-105 ${
                loading || !currentAsset?.purchasePrice
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700'
              }`}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Calculator className="w-4 h-4" />
                  <span>{currentCalculation ? 'Update' : 'Set'} Depreciation</span>
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}