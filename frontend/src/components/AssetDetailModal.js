import { useState, useEffect, useMemo } from 'react'
import { useAssetStore, useDepreciationStore } from '@/stores'
import { Package, Settings, DollarSign, X, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'

// Modal for displaying detailed asset information with specifications
export default function AssetDetailModal({ assetId, assetIds, isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('details')
  const [currentAssetIndex, setCurrentAssetIndex] = useState(0)
  const { currentAsset, fetchAsset, assets, fetchMultipleAssets } = useAssetStore()
  const { currentCalculation, getDepreciation, isLoading: depreciationLoading } = useDepreciationStore()
  const [loading, setLoading] = useState(true)
  
  // Support for both single asset and multiple assets
  const assetIdList = useMemo(() => 
    assetIds || (assetId ? [assetId] : []), 
    [assetIds, assetId]
  )
  const isMultiple = assetIdList.length > 1
  const displayAsset = isMultiple ? assets[currentAssetIndex] : currentAsset

  useEffect(() => {
    if (isOpen && assetIdList.length > 0) {
      setLoading(true)
      setCurrentAssetIndex(0)
      
      if (isMultiple) {
        // Fetch multiple assets
        fetchMultipleAssets(assetIdList).then(() => {
          setLoading(false)
        }).catch(() => {
          setLoading(false)
        })
      } else {
        // Fetch single asset
        fetchAsset(assetIdList[0]).then(() => {
          setLoading(false)
        }).catch(() => {
          setLoading(false)
        })
      }
    }
  }, [isOpen, assetIdList, fetchAsset, fetchMultipleAssets, isMultiple])

  // Separate effect for depreciation to avoid infinite loop
  useEffect(() => {
    const targetAsset = isMultiple ? assets[currentAssetIndex] : currentAsset
    const targetAssetId = isMultiple ? assetIdList[currentAssetIndex] : assetId
    
    if (isOpen && targetAssetId && targetAsset?.purchasePrice && !loading) {
      getDepreciation(targetAssetId).catch(() => {
        console.log('No depreciation data available')
      })
    }
  }, [isOpen, assetId, assetIdList, currentAssetIndex, displayAsset?.purchasePrice, loading, getDepreciation, isMultiple, assets, currentAsset])

  const handlePrevious = () => {
    // Infinite looping - go to last asset if at first
    const newIndex = currentAssetIndex > 0 ? currentAssetIndex - 1 : assetIdList.length - 1
    setCurrentAssetIndex(newIndex)
    setActiveTab('details') // Reset to details tab
  }

  const handleNext = () => {
    // Infinite looping - go to first asset if at last
    const newIndex = currentAssetIndex < assetIdList.length - 1 ? currentAssetIndex + 1 : 0
    setCurrentAssetIndex(newIndex)
    setActiveTab('details') // Reset to details tab
  }

  if (!isOpen) return null

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('id-ID')
  }

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return 'N/A'
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR' 
    }).format(amount)
  }

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'MAINTENANCE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'RETIRED':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'DISPOSED':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getConditionBadgeColor = (condition) => {
    switch (condition) {
      case 'EXCELLENT':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'GOOD':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'FAIR':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'POOR':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'DAMAGED':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="fixed inset-0 glass-modal-backdrop flex items-center justify-center z-50 p-4">
      <div className="glass-modal rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"></div>
        
        <div className="flex justify-between items-center p-6 border-b border-white/20">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              {displayAsset?.name || 'Loading...'}
            </h2>
            {displayAsset?.assetTag && (
              <p className="text-sm text-black/70">Asset Tag: {displayAsset.assetTag}</p>
            )}
            {isMultiple && (
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={handlePrevious}
                  className="glass-button p-1 rounded hover:scale-110 text-black/70 hover:text-green transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-white/60 px-2">
                  {currentAssetIndex + 1} of {assetIdList.length}
                </span>
                <button
                  onClick={handleNext}
                  className="glass-button p-1 rounded hover:scale-110 text-black/70 hover:text-green transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          <button 
            onClick={onClose} 
            className="glass-button p-2 rounded-lg text-black/70 hover:text-green transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 flex justify-center items-center flex-1">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/50"></div>
          </div>
        ) : displayAsset ? (
          <>
            {/* Tabs */}
            <div className="flex border-b border-white/20">
              <button
                className={`px-6 py-3 flex items-center space-x-2 transition-all ${
                  activeTab === 'details' 
                    ? 'border-b-2 border-blue-400 text-blue-400' 
                    : 'text-black/70 hover:text-green/90'
                }`}
                onClick={() => setActiveTab('details')}
              >
                <Package className="w-4 h-4" />
                <span>Details</span>
              </button>
              <button
                className={`px-6 py-3 flex items-center space-x-2 transition-all ${
                  activeTab === 'specs' 
                    ? 'border-b-2 border-blue-400 text-blue-400' 
                    : 'text-black/70 hover:text-green/90'
                }`}
                onClick={() => setActiveTab('specs')}
              >
                <Settings className="w-4 h-4" />
                <span>Specifications</span>
              </button>
              {displayAsset.purchasePrice && (
                <button
                  className={`px-6 py-3 flex items-center space-x-2 transition-all ${
                    activeTab === 'depreciation' 
                      ? 'border-b-2 border-blue-400 text-blue-400' 
                      : 'text-black/70 hover:text-green/90'
                  }`}
                  onClick={() => setActiveTab('depreciation')}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Depreciation</span>
                </button>
              )}
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {/* Asset Image */}
                  {displayAsset.imageUrl && (
                    <div className="glass-card p-4 text-center">
                      <h3 className="text-sm font-medium text-white/90 mb-3">Asset Image</h3>
                      <div className="inline-block border-2 border-white/20 rounded-lg overflow-hidden">
                        <Image 
                          src={displayAsset.imageUrl} 
                          alt={displayAsset.name}
                          width={300}
                          height={200}
                          className="object-contain"
                        />
                      </div>
                    </div>
                  )}

                  {/* Basic Information */}
                  <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-white/90 mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-black/70">Status:</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadgeColor(displayAsset.status)}`}>
                            {displayAsset.status}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-black/70">Condition:</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getConditionBadgeColor(displayAsset.condition)}`}>
                            {displayAsset.condition}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-black/70">Category:</span>
                          <span className="text-white/90">{displayAsset.category?.name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-black/70">Location:</span>
                          <span className="text-white/90">{displayAsset.location?.name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-black/70">Department:</span>
                          <span className="text-white/90">{displayAsset.department?.name || 'N/A'}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-black/70">Model:</span>
                          <span className="text-white/90">{displayAsset.model || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-black/70">Serial Number:</span>
                          <span className="text-white/90 font-mono text-sm">{displayAsset.serialNumber || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-black/70">Purchase Date:</span>
                          <span className="text-white/90">{formatDate(displayAsset.purchaseDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-black/70">Purchase Price:</span>
                          <span className="text-white/90 font-semibold">{formatCurrency(displayAsset.purchasePrice)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-black/70">Warranty Until:</span>
                          <span className="text-white/90">{formatDate(displayAsset.warrantyExpiry)}</span>
                        </div>
                      </div>
                    </div>

                    {displayAsset.description && (
                      <div className="mt-6 pt-4 border-t border-white/20">
                        <h4 className="text-white/90 font-medium mb-2">Description:</h4>
                        <p className="text-black/70 leading-relaxed">{displayAsset.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'specs' && (
                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-white/90 mb-4">Technical Specifications</h3>
                  {displayAsset.specifications && Object.keys(displayAsset.specifications).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(displayAsset.specifications).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center py-2 border-b border-white/10 last:border-0">
                          <span className="text-black/70 font-medium">{key}</span>
                          <span className="text-white/90">{value}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Settings className="w-12 h-12 text-white/30 mx-auto mb-3" />
                      <p className="text-white/60">No technical specifications available for this asset.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'depreciation' && (
                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-white/90 mb-4">Depreciation Information</h3>
                  {depreciationLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/50"></div>
                    </div>
                  ) : currentCalculation ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-black/70 text-sm">Original Value</p>
                          <p className="text-xl font-bold text-white/90">{formatCurrency(currentCalculation.originalValue)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-black/70 text-sm">Current Value</p>
                          <p className="text-xl font-bold text-green-400">{formatCurrency(currentCalculation.currentValue)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-black/70 text-sm">Depreciated</p>
                          <p className="text-xl font-bold text-red-400">{formatCurrency(currentCalculation.accumulatedDepreciation)}</p>
                        </div>
                      </div>

                      {/* Depreciation Progress */}
                      <div>
                        <div className="flex justify-between text-sm text-black/70 mb-2">
                          <span>Depreciation Progress</span>
                          <span>{Math.round((currentCalculation.accumulatedDepreciation / (currentCalculation.originalValue - currentCalculation.salvageValue)) * 100)}%</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-green-400 to-red-400 h-3 rounded-full transition-all duration-1000"
                            style={{ 
                              width: `${Math.min(100, (currentCalculation.accumulatedDepreciation / (currentCalculation.originalValue - currentCalculation.salvageValue)) * 100)}%` 
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-white/50 mt-1">
                          <span>New</span>
                          <span>Salvage: {formatCurrency(currentCalculation.salvageValue)}</span>
                        </div>
                      </div>

                      {/* Depreciation Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/20">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-black/70">Method:</span>
                            <span className="text-white/90">{currentCalculation.depreciationMethod.replace('_', ' ')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-black/70">Useful Life:</span>
                            <span className="text-white/90">{currentCalculation.usefulLife} years</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-black/70">Years in Service:</span>
                            <span className="text-white/90">{currentCalculation.yearsInService} years</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-black/70">Last Calculated:</span>
                            <span className="text-white/90">{formatDate(currentCalculation.lastCalculated)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <DollarSign className="w-12 h-12 text-white/30 mx-auto mb-3" />
                      <p className="text-white/60 mb-2">No depreciation data available for this asset.</p>
                      <p className="text-sm text-white/50">Set up depreciation in the asset management section.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-white/20 p-4 flex justify-end">
              <button
                onClick={onClose}
                className="glass-button px-6 py-2 rounded-lg text-white/90 hover:text-green transition-all hover:scale-105"
              >
                Close
              </button>
            </div>
          </>
        ) : (
          <div className="p-8 flex justify-center items-center flex-1">
            <div className="text-center">
              <Package className="w-12 h-12 text-white/30 mx-auto mb-3" />
              <p className="text-white/60">Asset not found</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}