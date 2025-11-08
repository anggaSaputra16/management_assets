import { useState, useEffect, useMemo } from 'react'
import { useAssetStore } from '@/stores'
import { Package, Settings, X, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import EditHistory from './EditHistory'

// Modal for displaying detailed asset information with specifications
export default function AssetDetailModal({ assetId, assetIds, isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('details')
  const [currentAssetIndex, setCurrentAssetIndex] = useState(0)
  const { currentAsset, fetchAsset, assets, fetchMultipleAssets } = useAssetStore()
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

  // Depreciation/finance details are currently not used in this product variant
  // so we intentionally omit fetching or showing depreciation data here.

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

  // Currency/finance formatting intentionally omitted (finance values hidden)

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-white/60 text-[#111] border border-black/10'
      case 'INACTIVE':
        return 'bg-white/60 text-[#111] border border-black/10'
      case 'MAINTENANCE':
        return 'bg-yellow-100 text-[#111] border border-yellow-300'
      case 'RETIRED':
        return 'bg-white/60 text-[#111] border border-black/10'
      case 'DISPOSED':
        return 'bg-white/60 text-[#111] border border-black/10'
      default:
        return 'bg-white/60 text-[#111] border border-black/10'
    }
  }

  const getConditionBadgeColor = (condition) => {
    switch (condition) {
      case 'EXCELLENT':
        return 'bg-white/60 text-[#111] border border-black/10'
      case 'GOOD':
        return 'bg-white/60 text-[#111] border border-black/10'
      case 'FAIR':
        return 'bg-yellow-100 text-[#111] border border-yellow-300'
      case 'POOR':
        return 'bg-orange-100 text-[#111] border border-orange-300'
      case 'DAMAGED':
        return 'bg-white/60 text-[#111] border border-black/10'
      default:
        return 'bg-white/60 text-[#111] border border-black/10'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col relative shadow-2xl ring-1 ring-black/10">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"></div>
        
        <div className="flex justify-between items-center p-6 border-b border-black/10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-transparent to-transparent rounded-lg shadow-md">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#111]">
                {displayAsset?.name || 'Loading...'}
              </h2>
              {displayAsset?.assetTag && (
                <p className="text-sm text-[#333] mt-1">{displayAsset.assetTag}</p>
              )}
            </div>
            {isMultiple && (
              <div className="flex items-center space-x-2 ml-6">
                <button
                  onClick={handlePrevious}
                  className="p-1.5 rounded-md bg-white/60 hover:bg-gray-200 text-[#111] hover:text-[#111] transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-[#333] px-2 font-medium">
                  {currentAssetIndex + 1} of {assetIdList.length}
                </span>
                <button
                  onClick={handleNext}
                  className="p-1.5 rounded-md bg-white/60 hover:bg-gray-200 text-[#111] hover:text-[#111] transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-lg bg-white/60 hover:bg-gray-200 text-[#111] hover:text-[#111] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 flex justify-center items-center flex-1">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black/10"></div>
          </div>
        ) : displayAsset ? (
          <>
            {/* Tabs */}
            <div className="flex border-b border-black/10 bg-white/60">
              <button
                className={`px-6 py-3 flex items-center space-x-2 transition-all font-medium ${
                  activeTab === 'details' 
                    ? 'border-b-2 border-black/10 text-[#111] bg-white' 
                    : 'text-[#333] hover:text-[#111] hover:bg-white/60'
                }`}
                onClick={() => setActiveTab('details')}
              >
                <Package className="w-4 h-4" />
                <span>Details</span>
              </button>
              <button
                className={`px-6 py-3 flex items-center space-x-2 transition-all font-medium ${
                  activeTab === 'specs' 
                    ? 'border-b-2 border-black/10 text-[#111] bg-white' 
                    : 'text-[#333] hover:text-[#111] hover:bg-white/60'
                }`}
                onClick={() => setActiveTab('specs')}
              >
                <Settings className="w-4 h-4" />
                <span>Specifications</span>
              </button>
              {/* Depreciation tab removed - not used in this deployment */}
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto p-6 bg-white/60">
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {/* Asset Image */}
                  {displayAsset.imageUrl && (
                    <div className="glass-card rounded-lg p-4 text-center shadow-sm">
                      <h3 className="text-sm font-semibold text-[#111] mb-3">Asset Image</h3>
                      <div className="inline-block border-2 border-black/10 rounded-lg overflow-hidden">
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
                  <div className="glass-card rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-[#111] mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-black/10">
                          <span className="text-[#111] font-medium">Status:</span>
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(displayAsset.status)}`}>
                            {displayAsset.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-black/10">
                          <span className="text-[#111] font-medium">Condition:</span>
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getConditionBadgeColor(displayAsset.condition)}`}>
                            {displayAsset.condition}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-black/10">
                          <span className="text-[#111] font-medium">Category:</span>
                          <span className="text-[#111]">{displayAsset.category?.name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-black/10">
                          <span className="text-[#111] font-medium">Location:</span>
                          <span className="text-[#111]">{displayAsset.location?.name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-[#111] font-medium">Department:</span>
                          <span className="text-[#111]">{displayAsset.department?.name || 'N/A'}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-black/10">
                          <span className="text-[#111] font-medium">Model:</span>
                          <span className="text-[#111]">{displayAsset.model || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-black/10">
                          <span className="text-[#111] font-medium">Serial Number:</span>
                          <span className="text-[#111] font-mono text-sm">{displayAsset.serialNumber || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-black/10">
                          <span className="text-[#111] font-medium">Purchase Date:</span>
                          <span className="text-[#111]">{formatDate(displayAsset.purchaseDate)}</span>
                        </div>
                        {/* Purchase price removed from UI - finance details are out of scope */}
                        <div className="flex justify-between items-center py-2">
                          <span className="text-[#111] font-medium">Warranty Until:</span>
                          <span className="text-[#111]">{formatDate(displayAsset.warrantyExpiry)}</span>
                        </div>
                      </div>
                    </div>

                    {displayAsset.description && (
                      <div className="mt-6 pt-4 border-t border-black/10">
                        <h4 className="text-[#111] font-semibold mb-2">Description:</h4>
                        <p className="text-[#111] leading-relaxed">{displayAsset.description}</p>
                      </div>
                    )}

                    {/* Edit History */}
                    <EditHistory 
                      editedBy={displayAsset.editedBy}
                      lastEditedAt={displayAsset.lastEditedAt}
                      editedByUser={displayAsset.editedByUser}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'specs' && (
                <div className="glass-card rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-[#111] mb-4">Technical Specifications</h3>
                  {displayAsset.specifications && Object.keys(displayAsset.specifications).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(displayAsset.specifications).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center py-3 px-4 bg-white/60 rounded-lg border border-black/10">
                          <span className="text-[#111] font-semibold">{key}</span>
                          <span className="text-[#111]">{value}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Settings className="w-12 h-12 text-[#333] mx-auto mb-3" />
                      <p className="text-[#333]">No technical specifications available for this asset.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Depreciation UI intentionally removed. */}
            </div>

            <div className="border-t border-black/10 bg-white p-4 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-lg bg-white/60 hover:bg-gray-200 text-[#111] font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </>
        ) : (
          <div className="p-8 flex justify-center items-center flex-1 bg-white/60">
            <div className="text-center">
              <Package className="w-12 h-12 text-[#333] mx-auto mb-3" />
              <p className="text-[#333]">Asset not found</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}