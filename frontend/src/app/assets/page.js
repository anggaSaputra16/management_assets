'use client'

import { useState, useEffect } from 'react'
import { useAssetStore, useCategoryStore, useLocationStore, useDepartmentStore, useVendorStore } from '@/stores'
import { useToast } from '@/contexts/ToastContext'
import QRCodeScanner from '@/components/QRCodeScanner'
import AssetSpecifications from '@/components/AssetSpecifications'
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Download,
  Upload,
  CheckCircle,
  Wrench,
  Archive,
  X,
  Tag,
  AlertCircle,
  MapPin,
  QrCode,
  Eye
} from 'lucide-react'

const AssetsPage = () => {
  const { showSuccess, showError, showInfo } = useToast()
  const {
    loading,
    searchTerm,
    statusFilter,
    conditionFilter,
    showModal,
    editingAsset,
    formData,
    fetchAssets,
    createAsset,
    updateAsset,
    deleteAsset,
    bulkImportAssets,
    exportAssets,
    setSearchTerm,
    setStatusFilter,
    setConditionFilter,
    setShowModal,
    setEditingAsset,
    resetForm,
    handleFieldChange,
    getFilteredAssets,
    getAssetStats
  } = useAssetStore()

  const { categories, fetchCategories } = useCategoryStore()
  const { locations, fetchLocations } = useLocationStore()
  const { departments, fetchDepartments } = useDepartmentStore()
  const { vendors, fetchVendors } = useVendorStore()

  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [assetToDelete, setAssetToDelete] = useState(null)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedAssetForQR, setSelectedAssetForQR] = useState(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importData, setImportData] = useState('')
  const [importResults, setImportResults] = useState(null)
  const itemsPerPage = 10

  const filteredAssets = getFilteredAssets()
  const stats = getAssetStats()
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage)
  const paginatedAssets = filteredAssets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchAssets(),
          fetchCategories(),
          fetchLocations(),
          fetchDepartments(),
          fetchVendors()
        ])
      } catch (error) {
        console.error('Failed to load data:', error)
        showError('Failed to load data. Please refresh the page.')
      }
    }
    
    loadData()
  }, [fetchAssets, fetchCategories, fetchLocations, fetchDepartments, fetchVendors, showError])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.name?.trim()) {
      showError('Asset name is required')
      return
    }
    
    if (!formData.categoryId) {
      showError('Category is required')
      return
    }
    
    if (!formData.locationId) {
      showError('Location is required')
      return
    }

    try {
      if (editingAsset) {
        await updateAsset(editingAsset.id, formData)
        showSuccess('Asset updated successfully!')
      } else {
        await createAsset(formData)
        showSuccess('Asset created successfully!')
      }
      setShowModal(false)
    } catch (error) {
      console.error('Failed to save asset:', error)
      showError('Failed to save asset. Please try again.')
    }
  }

  const handleEdit = (asset) => {
    setEditingAsset(asset)
  }

  const handleDelete = (asset) => {
    setAssetToDelete(asset)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (assetToDelete) {
      try {
        await deleteAsset(assetToDelete.id)
        setShowDeleteModal(false)
        setAssetToDelete(null)
        showSuccess(`Asset "${assetToDelete.name}" deleted successfully!`)
      } catch (error) {
        console.error('Failed to delete asset:', error)
        showError('Failed to delete asset. Please try again.')
      }
    }
  }

  // Import/Export handlers
  const handleImport = async () => {
    if (!importData.trim()) {
      showError('Please enter CSV data to import')
      return
    }

    try {
      // Parse CSV data
      const lines = importData.trim().split('\n')
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
      
      const assetsData = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.replace(/"/g, '').trim())
        const asset = {}
        
        headers.forEach((header, index) => {
          const value = values[index]
          switch (header.toLowerCase()) {
            case 'name':
              asset.name = value
              break
            case 'description':
              asset.description = value || null
              break
            case 'serial number':
            case 'serialnumber':
              asset.serialNumber = value || null
              break
            case 'model':
              asset.model = value || null
              break
            case 'brand':
              asset.brand = value || null
              break
            case 'category':
              // Find category by name
              const category = categories.find(c => c.name.toLowerCase() === value.toLowerCase())
              asset.categoryId = category?.id
              break
            case 'location':
              // Find location by name
              const location = locations.find(l => l.name.toLowerCase() === value.toLowerCase())
              asset.locationId = location?.id
              break
            case 'department':
              // Find department by name
              const department = departments.find(d => d.name.toLowerCase() === value.toLowerCase())
              asset.departmentId = department?.id
              break
            case 'vendor':
              // Find vendor by name
              const vendor = vendors.find(v => v.name.toLowerCase() === value.toLowerCase())
              asset.vendorId = vendor?.id
              break
            case 'purchase date':
            case 'purchasedate':
              asset.purchaseDate = value ? new Date(value).toISOString() : null
              break
            case 'purchase price':
            case 'purchaseprice':
              asset.purchasePrice = value ? parseFloat(value) : null
              break
            case 'warranty expiry':
            case 'warrantyexpiry':
              asset.warrantyExpiry = value ? new Date(value).toISOString() : null
              break
            case 'condition':
              asset.condition = value || 'GOOD'
              break
            case 'notes':
              asset.notes = value || null
              break
          }
        })
        
        return asset
      })

      // Import assets
      const result = await bulkImportAssets(assetsData)
      setImportResults(result)
      showSuccess(`Import completed! ${result.data.success.length} assets created, ${result.data.errors.length} errors.`)
      
      if (result.data.errors.length === 0) {
        setShowImportModal(false)
        setImportData('')
      }
    } catch (error) {
      console.error('Import error:', error)
      showError('Failed to import assets. Please check your CSV format.')
    }
  }

  const handleExport = async () => {
    try {
      const blob = await exportAssets('csv', {
        status: statusFilter,
        condition: conditionFilter,
        search: searchTerm
      })
      
      // Create and download the file
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `assets-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      showSuccess('Assets exported successfully!')
    } catch (error) {
      console.error('Export error:', error)
      showError('Failed to export assets')
    }
  }

  // QR Code handlers
  const handleQRScan = async (qrData) => {
    try {
      const response = await fetch('/api/assets/scan-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          qrData: typeof qrData === 'string' ? qrData : JSON.stringify(qrData),
          scanLocation: 'Assets List',
          scanContext: 'SEARCH'
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setShowQRScanner(false)
        // Navigate to asset details or show in modal
        if (result.data?.id) {
          showInfo(`Found asset: ${result.data.name} (${result.data.assetTag})`)
          // Scroll to asset or highlight it
          const assetElement = document.querySelector(`[data-asset-id="${result.data.id}"]`)
          if (assetElement) {
            assetElement.scrollIntoView({ behavior: 'smooth' })
            assetElement.classList.add('ring-2', 'ring-blue-500')
            setTimeout(() => {
              assetElement.classList.remove('ring-2', 'ring-blue-500')
            }, 3000)
          }
        }
      } else {
        showError(result.message || 'QR code scan failed')
      }
    } catch (error) {
      console.error('QR scan error:', error)
      showError('Failed to process QR code')
    }
  }

  const handleGenerateQR = async (assetId) => {
    try {
      const response = await fetch(`/api/assets/${assetId}/generate-qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const result = await response.json()
      
      if (result.success) {
        showSuccess('QR code generated successfully!')
        await fetchAssets()
      } else {
        showError(result.message || 'Failed to generate QR code')
      }
    } catch (error) {
      console.error('QR generation error:', error)
      showError('Failed to generate QR code')
    }
  }

  const handleViewQR = (asset) => {
    if (asset.qrCodeImage) {
      setSelectedAssetForQR(asset)
      setShowQRModal(true)
    }
  }

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800'
      case 'MAINTENANCE':
        return 'bg-yellow-100 text-yellow-800'
      case 'RETIRED':
        return 'bg-red-100 text-red-800'
      case 'DISPOSED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getConditionBadgeColor = (condition) => {
    switch (condition) {
      case 'EXCELLENT':
        return 'bg-green-100 text-green-800'
      case 'GOOD':
        return 'bg-blue-100 text-blue-800'
      case 'FAIR':
        return 'bg-yellow-100 text-yellow-800'
      case 'POOR':
        return 'bg-orange-100 text-orange-800'
      case 'DAMAGED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Handle form data changes including specifications
  const handleFormChange = (fieldOrEvent, value) => {
    // If it's an event object
    if (fieldOrEvent && fieldOrEvent.target) {
      const { name, value: eventValue } = fieldOrEvent.target
      if (name === 'categoryId') {
        handleFieldChange(name, eventValue)
        // Update selected category for specifications template
        const category = categories.find(c => c.id === eventValue)
        setSelectedCategory(category)
      } else {
        handleFieldChange(name, eventValue)
      }
    } else {
      // Direct field and value call
      const field = fieldOrEvent
      if (field === 'specifications') {
        handleFieldChange(field, value)
      } else if (field === 'categoryId') {
        handleFieldChange(field, value)
        // Update selected category for specifications template
        const category = categories.find(c => c.id === value)
        setSelectedCategory(category)
      } else {
        handleFieldChange(field, value)
      }
    }
  }

  const renderModal = () => {
    if (!showModal) return null

    return (
      <div className="fixed inset-0 glass-modal-backdrop flex items-center justify-center p-4 z-50">
        <div className="glass-modal rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200/30">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingAsset ? 'Edit Asset' : 'Add New Asset'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="text-gray-500 hover:text-gray-700 glass-button p-2 rounded-lg transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asset Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asset Tag
                  <span className="text-sm text-gray-500 ml-2">(Auto-generated)</span>
                </label>
                <input
                  type="text"
                  name="assetTag"
                  value={formData.assetTag || (editingAsset ? editingAsset.assetTag : 'Will be auto-generated')}
                  onChange={handleFormChange}
                  readOnly
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-600 cursor-not-allowed"
                  placeholder="Auto-generated after creation"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleFormChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Category</option>
                  {Array.isArray(categories) && categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <select
                  name="locationId"
                  value={formData.locationId}
                  onChange={handleFormChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Location</option>
                  {Array.isArray(locations) && locations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <select
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Select Department</option>
                  {Array.isArray(departments) && departments.map(department => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendor
                </label>
                <select
                  name="vendorId"
                  value={formData.vendorId}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Select Vendor</option>
                  {Array.isArray(vendors) && vendors.map(vendor => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Serial Number
                </label>
                <input
                  type="text"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="RETIRED">Retired</option>
                  <option value="DISPOSED">Disposed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition
                </label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="EXCELLENT">Excellent</option>
                  <option value="GOOD">Good</option>
                  <option value="FAIR">Fair</option>
                  <option value="POOR">Poor</option>
                  <option value="DAMAGED">Damaged</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purchase Date
                </label>
                <input
                  type="date"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purchase Price
                </label>
                <input
                  type="number"
                  name="purchasePrice"
                  value={formData.purchasePrice}
                  onChange={handleFormChange}
                  step="0.01"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Depreciation Rate (%)
                </label>
                <input
                  type="number"
                  name="depreciationRate"
                  value={formData.depreciationRate}
                  onChange={handleFormChange}
                  step="0.01"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warranty Expiry
                </label>
                <input
                  type="date"
                  name="warrantyExpiry"
                  value={formData.warrantyExpiry}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Asset Specifications */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specifications
              </label>
              <AssetSpecifications
                category={selectedCategory}
                specifications={formData.specifications || {}}
                onChange={(specs) => handleFormChange('specifications', specs)}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : editingAsset ? 'Update Asset' : 'Create Asset'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  const renderDeleteModal = () => {
    if (!showDeleteModal) return null

    return (
      <div className="fixed inset-0 glass-modal-backdrop flex items-center justify-center p-4 z-50">
        <div className="glass-modal max-w-md w-full">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-800">Delete Asset</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete &quot;{assetToDelete?.name}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="glass-button px-4 py-2 rounded-lg text-gray-700 hover:text-gray-800 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500/80 backdrop-blur-sm text-white rounded-lg hover:bg-red-600/80 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderImportModal = () => {
    if (!showImportModal) return null

    return (
      <div className="fixed inset-0 glass-modal-backdrop flex items-center justify-center p-4 z-50">
        <div className="glass-modal max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200/30">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Import Assets</h3>
              <button
                onClick={() => {
                  setShowImportModal(false)
                  setImportData('')
                  setImportResults(null)
                }}
                className="text-gray-500 hover:text-gray-700 glass-button p-2 rounded-lg transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CSV Data
              </label>
              <p className="text-sm text-gray-600 mb-2">
                Paste your CSV data below. Expected format: Name, Description, Serial Number, Model, Brand, Category, Location, Department, Vendor, Purchase Date, Purchase Price, Warranty Expiry, Condition, Notes
              </p>
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                rows={10}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Name,Description,Serial Number,Model,Brand,Category,Location,Department,Vendor,Purchase Date,Purchase Price,Warranty Expiry,Condition,Notes&#10;Laptop Dell,Business laptop,ABC123,Latitude 5520,Dell,Computer,Office Floor 1,IT Department,Dell Inc,2023-01-15,15000000,2026-01-15,GOOD,Standard laptop"
              />
            </div>

            {importResults && (
              <div className="mt-4 p-4 border rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Import Results</h4>
                <div className="space-y-2">
                  <p className="text-green-600">
                    ✓ {importResults.data.success.length} assets imported successfully
                  </p>
                  {importResults.data.errors.length > 0 && (
                    <div>
                      <p className="text-red-600">
                        ✗ {importResults.data.errors.length} errors occurred:
                      </p>
                      <ul className="list-disc list-inside text-sm text-red-600 mt-1">
                        {importResults.data.errors.map((error, index) => (
                          <li key={index}>Row {error.row}: {error.error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={() => {
                  setShowImportModal(false)
                  setImportData('')
                  setImportResults(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!importData.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import Assets
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderQRModal = () => {
    if (!showQRModal || !selectedAssetForQR) return null

    return (
      <div className="fixed inset-0 glass-modal-backdrop flex items-center justify-center p-4 z-50">
        <div className="glass-modal max-w-md w-full">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">QR Code</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-gray-500 hover:text-gray-700 glass-button p-2 rounded-lg transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="text-center">
              <h4 className="text-md font-medium text-gray-900 mb-2">
                {selectedAssetForQR.name}
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Asset Tag: {selectedAssetForQR.assetTag}
              </p>
              
              <div className="flex justify-center mb-4">
                <img 
                  src={`/api${selectedAssetForQR.qrCodeImage}`}
                  alt="QR Code"
                  className="max-w-xs max-h-xs border border-gray-200 rounded"
                />
              </div>
              
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = `/api${selectedAssetForQR.qrCodeImage}`
                    link.download = `qr-${selectedAssetForQR.assetTag}.png`
                    link.click()
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Download className="h-4 w-4 mr-2 inline" />
                  Download
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Print
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="glass-card p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"></div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Asset Management</h1>
            <p className="text-gray-600">
              Manage and track all organizational assets
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="glass-button px-4 py-2 rounded-lg text-gray-700 flex items-center space-x-2 hover:scale-105 transition-transform relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-400/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Filter className="h-4 w-4 relative z-10" />
              <span className="relative z-10">Filters</span>
            </button>
            <button 
              onClick={() => setShowImportModal(true)}
              className="glass-button px-4 py-2 rounded-lg text-gray-700 flex items-center space-x-2 hover:scale-105 transition-transform relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-emerald-400/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Upload className="h-4 w-4 relative z-10" />
              <span className="relative z-10">Import</span>
            </button>
            <button 
              onClick={handleExport}
              className="glass-button px-4 py-2 rounded-lg text-gray-700 flex items-center space-x-2 hover:scale-105 transition-transform relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400/10 to-red-400/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Download className="h-4 w-4 relative z-10" />
              <span className="relative z-10">Export</span>
            </button>
            <button
              onClick={() => {
                resetForm()
                setShowModal(true)
              }}
              className="glass-button px-4 py-2 rounded-lg text-gray-700 flex items-center space-x-2 hover:scale-105 transition-transform relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-indigo-400/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Plus className="h-4 w-4 relative z-10" />
              <span className="relative z-10">Add Asset</span>
            </button>
            <button
              onClick={() => setShowQRScanner(true)}
              className="glass-button px-4 py-2 rounded-lg text-gray-700 flex items-center space-x-2 hover:scale-105 transition-transform relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <QrCode className="h-4 w-4 relative z-10" />
              <span className="relative z-10">Scan QR</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const IconComponent = {
            Package,
            CheckCircle,
            Wrench,
            Archive
          }[stat.icon]

          return (
            <div key={index} className="glass-card p-6">
              <div className="flex items-center">
                <div className={`bg-gradient-to-r ${stat.color} rounded-lg p-3 shadow-lg`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-white/70">{stat.title}</p>
                  <p className="text-2xl font-bold text-white">
                    {stat.value.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="glass-card p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search assets..."
                  className="glass-input pl-10 w-full rounded-lg px-3 py-2 text-sm placeholder-white/60"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="RETIRED">Retired</option>
                <option value="DISPOSED">Disposed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Condition
              </label>
              <select
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value)}
                className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="">All Conditions</option>
                <option value="EXCELLENT">Excellent</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="POOR">Poor</option>
                <option value="DAMAGED">Damaged</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('')
                  setConditionFilter('')
                  showInfo('Filters cleared')
                }}
                className="glass-button w-full px-4 py-2 rounded-lg text-sm text-white hover:scale-105 transition-transform"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assets Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/20">
            <thead className="glass-button">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                  Asset
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                  Condition
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/90 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-white/70">
                    <div className="flex items-center justify-center">
                      <Package className="animate-spin h-5 w-5 mr-2" />
                      Loading assets...
                    </div>
                  </td>
                </tr>
              ) : paginatedAssets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-white/70">
                    No assets found
                  </td>
                </tr>
              ) : (
                paginatedAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-white">{asset.name}</span>
                          {asset.qrCodeImage && (
                            <QrCode className="h-4 w-4 ml-2 text-green-400" title="QR Code Available" />
                          )}
                        </div>
                        <div className="text-sm text-white/60">
                          <Tag className="inline h-3 w-3 mr-1" />
                          {asset.assetTag}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {asset.category?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-white">
                        <MapPin className="h-4 w-4 mr-1 text-white/60" />
                        {asset.location?.name || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(asset.status)}`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getConditionBadgeColor(asset.condition)}`}>
                        {asset.condition}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {asset.purchasePrice ? `$${asset.purchasePrice.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(asset)}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                          title="Edit Asset"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {asset.qrCodeImage ? (
                          <button
                            onClick={() => handleViewQR(asset)}
                            className="text-green-400 hover:text-green-300 transition-colors"
                            title="View QR Code"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleGenerateQR(asset.id)}
                            className="text-purple-400 hover:text-purple-300 transition-colors"
                            title="Generate QR Code"
                          >
                            <QrCode className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(asset)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                          title="Delete Asset"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-lg">
          <div className="flex items-center">
            <p className="text-sm text-gray-700">
              Showing{' '}
              <span className="font-medium">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{' '}
              to{' '}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, filteredAssets.length)}
              </span>{' '}
              of{' '}
              <span className="font-medium">{filteredAssets.length}</span>{' '}
              results
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {renderModal()}
      {renderDeleteModal()}
      {renderImportModal()}
      {renderQRModal()}

      {/* QR Code Scanner */}
      {showQRScanner && (
        <QRCodeScanner
          isOpen={showQRScanner}
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </div>
  )
}

export default AssetsPage