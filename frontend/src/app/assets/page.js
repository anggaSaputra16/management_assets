'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import Image from 'next/image'
import { useAssetStore, useCategoryStore, useLocationStore, useDepartmentStore, useVendorStore, useUserStore, useInventoryStore, useCompanyStore, useEmployeeStore } from '@/stores'
import { useToast } from '@/contexts/ToastContext'
import useEnumStore from '@/stores/enumStore'
import QRCodeScanner from '@/components/QRCodeScanner'
import QRCodeDisplay from '@/components/QRCodeDisplay'
import AssetSpecifications from '@/components/AssetSpecifications'
import AssetDetailModal from '@/components/AssetDetailModal'
import TransferModal from '@/components/TransferModal'
import DepreciationModal from '@/components/DepreciationModal'
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
import { api } from '@/lib/api'

const AssetsPage = () => {
  const { showSuccess, showError, showInfo } = useToast()
  const enumStore = useEnumStore()
  const {
    assets,
    loading,
  searchTerm,
  statusFilter,
  companyFilter,
  setCompanyFilter,
  conditionFilter,
    showModal,
    editingAsset,
    formData,
    currentPage: storePage,
    pageSize,
    totalAssets,
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
    setPage,
    getAssetStats
  } = useAssetStore()

  const { categories, fetchCategories } = useCategoryStore()
  const { companies, fetchCompanies } = useCompanyStore()
  const { locations, fetchLocations } = useLocationStore()
  const { departments, fetchDepartments } = useDepartmentStore()
  const { vendors, fetchVendors } = useVendorStore()
  const { fetchUsers } = useUserStore()
  const { employees, fetchEmployees } = useEmployeeStore()
  // const { spareParts, fetchSpareParts } = useSparePartsStore()
  const { inventories: spareParts, fetchInventories: fetchSpareParts } = useInventoryStore()

  const [showFilters, setShowFilters] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [assetToDelete, setAssetToDelete] = useState(null)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedAssetForQR, setSelectedAssetForQR] = useState(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importData, setImportData] = useState('')
  const [importResults, setImportResults] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedAssetId, setSelectedAssetId] = useState(null)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [showDepreciationModal, setShowDepreciationModal] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [previewFiles, setPreviewFiles] = useState([])
  const [selectedSoftware, setSelectedSoftware] = useState([])
  const [softwareAssets, setSoftwareAssets] = useState([])

  // Use pagination from store instead of local state
  const stats = getAssetStats()
  const totalPages = Math.ceil(totalAssets / pageSize)
  const paginatedAssets = assets // Assets already paginated from backend

  // Software items: prefer master software assets if available, otherwise fallback to inventory spare parts
  const softwareItems = (Array.isArray(softwareAssets) && softwareAssets.length > 0)
    ? softwareAssets
    : (spareParts?.filter(item => item.type === 'SOFTWARE' || (item.name && item.name.toLowerCase().includes('software'))) || [])

  // Handle file upload
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files)
    setSelectedFiles(prev => [...prev, ...files])
    
    // Create preview for images
    const newPreviews = []
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          newPreviews.push({
            file,
            url: e.target.result,
            type: 'image'
          })
          if (newPreviews.length === files.filter(f => f.type.startsWith('image/')).length) {
            setPreviewFiles(prev => [...prev, ...newPreviews])
          }
        }
        reader.readAsDataURL(file)
      } else {
        newPreviews.push({
          file,
          url: null,
          type: 'document'
        })
      }
    })
    
    // Add document previews immediately
    const docPreviews = newPreviews.filter(p => p.type === 'document')
    if (docPreviews.length > 0) {
      setPreviewFiles(prev => [...prev, ...docPreviews])
    }
  }

  // Remove file from selection
  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setPreviewFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Handle software selection
  const handleSoftwareSelection = (softwareId) => {
    const software = softwareItems.find(item => item.id === softwareId)
    if (software && !selectedSoftware.find(s => s.id === softwareId)) {
      setSelectedSoftware(prev => [...prev, software])
    }
  }

  // Remove software from selection
  const removeSoftware = (softwareId) => {
    setSelectedSoftware(prev => prev.filter(s => s.id !== softwareId))
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        // Initialize enums first
        await enumStore.initializeEnums()
        
        // Load assets with pagination (limit to 20 per page by default)
        await fetchAssets({ page: 1, limit: 20 })
        
        // Load master data in parallel (these are typically smaller datasets)
        Promise.all([
          fetchCategories(),
            fetchCompanies(),
            fetchLocations(),
            fetchDepartments(),
            fetchVendors(),
            fetchUsers(),
            fetchEmployees(),
            fetchSpareParts()
        ]).catch(err => console.warn('Some master data failed to load:', err))
        
        // Also fetch master software assets (if available) - non-blocking
        api.get('/software-assets')
          .then(sw => setSoftwareAssets(sw.data?.data || []))
          .catch(err => {
            console.warn('Could not fetch master software assets:', err.message)
            setSoftwareAssets([])
          })
      } catch (error) {
        console.error('Failed to load data:', error)
        showError('Failed to load critical data. Please refresh the page.')
      }
    }
    
    loadData()
  }, []) // Only run once on mount

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
      // Prepare asset data as regular JSON object
      const assetData = {
        name: formData.name?.trim(),
        description: formData.description?.trim() || null,
        serialNumber: formData.serialNumber?.trim() || null,
        model: formData.model?.trim() || null,
        brand: formData.brand?.trim() || null,
        poNumber: formData.poNumber?.trim() || null,
        categoryId: formData.categoryId,
        locationId: formData.locationId,
        departmentId: formData.departmentId || null,
  vendorId: formData.vendorId || null,
  assignedEmployeeId: formData.assignedEmployeeId || formData.assignedToId || null,
        status: formData.status || 'ACTIVE',
        condition: formData.condition || 'GOOD',
        purchaseDate: formData.purchaseDate || null,
        purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
        warrantyExpiry: formData.warrantyExpiry || null,
        depreciationRate: formData.depreciationRate ? parseFloat(formData.depreciationRate) : null,
        specifications: formData.specifications || {},
        requiredSoftware: selectedSoftware.map(s => s.id)
      }

      // If there are files, use FormData approach
      if (selectedFiles.length > 0) {
        const formDataToSend = new FormData()
        
        // Add asset data to FormData
        Object.keys(assetData).forEach(key => {
          if (assetData[key] !== null && assetData[key] !== undefined) {
            if (key === 'requiredSoftware' || key === 'specifications') {
              formDataToSend.append(key, JSON.stringify(assetData[key]))
            } else {
              formDataToSend.append(key, assetData[key])
            }
          }
        })

        // Add files to FormData
        selectedFiles.forEach((file) => {
          if (file.type.startsWith('image/')) {
            formDataToSend.append('image', file) // Asset main image
          } else {
            formDataToSend.append('attachments', file) // Other documents
          }
        })
        
        // Send FormData
        if (editingAsset) {
          await updateAsset(editingAsset.id, formDataToSend)
        } else {
          await createAsset(formDataToSend)
        }
      } else {
        // No files, send as regular JSON
        if (editingAsset) {
          await updateAsset(editingAsset.id, assetData)
        } else {
          await createAsset(assetData)
        }
      }

      
      showSuccess(editingAsset ? 'Asset updated successfully!' : 'Asset created successfully!')
      setShowModal(false)
      setSelectedFiles([])
      setPreviewFiles([])
      setSelectedSoftware([])
      resetForm()
    } catch (error) {
      console.error('Failed to save asset:', error)
      showError(error.message || 'Failed to save asset. Please try again.')
    }
  }

  const handleEdit = (asset) => {
    setEditingAsset(asset)
    setFormData({
      name: asset.name || '',
      description: asset.description || '',
      assetTag: asset.assetTag || '',
      categoryId: asset.categoryId || '',
      locationId: asset.locationId || '',
      departmentId: asset.departmentId || '',
      vendorId: asset.vendorId || '',
      model: asset.model || '',
      serialNumber: asset.serialNumber || '',
      brand: asset.brand || '',
      poNumber: asset.poNumber || '',
      status: asset.status || 'ACTIVE',
      condition: asset.condition || 'GOOD',
      purchaseDate: asset.purchaseDate || '',
      purchasePrice: asset.purchasePrice || '',
      warrantyExpiry: asset.warrantyExpiry || '',
  depreciationRate: asset.depreciationRate || '',
  assignedEmployeeId: asset.assignedEmployeeId || asset.assignedToId || '',
      imageUrl: asset.imageUrl || '',
      specifications: asset.specifications || {}
    })
    
    // Clear previous selections
    setSelectedFiles([])
    setPreviewFiles([])
    
    // Set existing required software if any
    if (asset.requiredSoftware && asset.requiredSoftware.length > 0) {
      const existingSoftware = asset.requiredSoftware.map(rs => 
        softwareItems.find(item => item.id === rs.softwareId)
      ).filter(Boolean)
      setSelectedSoftware(existingSoftware)
    } else {
      setSelectedSoftware([])
    }
    
    setShowModal(true)
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
  const handleQRScan = async (scanResult) => {
    try {
      setShowQRScanner(false);
      
      if (scanResult.success) {
        // If we have an asset object in the scan result
        if (scanResult.asset && scanResult.asset.id) {
          const { asset } = scanResult;
          showInfo(`Found asset: ${asset.name} (${asset.assetTag})`);
          
          // Scroll to and highlight the asset in the list
          const assetElement = document.querySelector(`[data-asset-id="${asset.id}"]`);
          if (assetElement) {
            assetElement.scrollIntoView({ behavior: 'smooth' });
            assetElement.classList.add('ring-2', 'ring-blue-500', 'bg-white/60');
            setTimeout(() => {
              assetElement.classList.remove('ring-2', 'ring-blue-500', 'bg-white/60');
            }, 3000);
          } else {
            // If asset not visible in current filtered list, reset filters
            setSearchTerm('');
            setStatusFilter('');
            setConditionFilter('');
            showInfo('Filters reset to show the scanned asset');
            
            // Fetch the asset and then scroll to it
            setTimeout(() => {
              const updatedAssetElement = document.querySelector(`[data-asset-id="${asset.id}"]`);
              if (updatedAssetElement) {
                updatedAssetElement.scrollIntoView({ behavior: 'smooth' });
                updatedAssetElement.classList.add('ring-2', 'ring-blue-500', 'bg-white/60');
                setTimeout(() => {
                  updatedAssetElement.classList.remove('ring-2', 'ring-blue-500', 'bg-white/60');
                }, 3000);
              }
            }, 500);
          }
        } else if (scanResult.id) {
          // Just got an ID, search for it in our assets
          const asset = assets.find(a => a.id === scanResult.id);
          if (asset) {
            showInfo(`Found asset: ${asset.name} (${asset.assetTag})`);
            // Same highlighting logic
            const assetElement = document.querySelector(`[data-asset-id="${asset.id}"]`);
            if (assetElement) {
              assetElement.scrollIntoView({ behavior: 'smooth' });
              assetElement.classList.add('ring-2', 'ring-blue-500', 'bg-white/60');
              setTimeout(() => {
                assetElement.classList.remove('ring-2', 'ring-blue-500', 'bg-white/60');
              }, 3000);
            }
          } else {
            // Asset ID from QR not found in current list
            showError('Asset not found in current view. Try refreshing the list.');
          }
        } else {
          showInfo('QR code scanned, but no asset information found.');
        }
      } else {
        showError(scanResult.error || 'QR code scan failed');
      }
    } catch (error) {
      console.error('QR scan handling error:', error);
      showError('Failed to process QR code');
    }
  }

  const handleGenerateQR = async (assetId) => {
    try {
      // Use the paginated assets that are currently displayed in the table
      const asset = paginatedAssets.find(a => a.id === assetId);

      if (asset) {
        setSelectedAssetForQR(asset);
        setShowQRModal(true);
        showSuccess('QR code viewer opened');
      } else {
        showError('Asset not found');
      }
    } catch (error) {
      console.error('QR generation error:', error);
      showError('Failed to generate QR code');
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
        return 'bg-white/60 text-[#111]'
      case 'INACTIVE':
        return 'bg-gray-100 text-[#111]'
      case 'MAINTENANCE':
        return 'bg-white/60 text-[#111]'
      case 'RETIRED':
        return 'bg-white/60 text-[#111]'
      case 'DISPOSED':
        return 'bg-white/60 text-[#111]'
      default:
        return 'bg-gray-100 text-[#111]'
    }
  }

  const getConditionBadgeColor = (condition) => {
    switch (condition) {
      case 'EXCELLENT':
        return 'bg-white/60 text-[#111]'
      case 'GOOD':
        return 'bg-white/60 text-[#111]'
      case 'FAIR':
        return 'bg-white/60 text-[#111]'
      case 'POOR':
        return 'bg-white/60 text-[#111]'
      case 'DAMAGED':
        return 'bg-white/60 text-[#111]'
      default:
        return 'bg-gray-100 text-[#111]'
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
          <div className="p-6 border-b border-black/10/30">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#111]">
                {editingAsset ? 'Edit Asset' : 'Add New Asset'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="text-[#333] hover:text-[#111] glass-button p-2 rounded-lg transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Asset Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                  className="w-full glass-input rounded-lg px-3 py-2 text-[#111] focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Asset Tag
                  <span className="text-sm text-[#333] ml-2">(Auto-generated)</span>
                </label>
                <input
                  type="text"
                  name="assetTag"
                  value={formData.assetTag || (editingAsset ? editingAsset.assetTag : 'Will be auto-generated')}
                  onChange={handleFormChange}
                  readOnly
                  className="w-full glass-input rounded-lg px-3 py-2 bg-gray-50 text-[#333] cursor-not-allowed"
                  placeholder="Auto-generated after creation"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Category *
                </label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleFormChange}
                  required
                  className="w-full glass-input rounded-lg px-3 py-2 text-[#111] focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30"
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
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Company *
                </label>
                <select
                  name="companyId"
                  value={formData.companyId}
                  onChange={handleFormChange}
                  required
                  className="w-full glass-input rounded-lg px-3 py-2 text-[#111] focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30"
                >
                  <option value="">Select Company</option>
                  {Array.isArray(companies) && companies.map(company => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Location *
                </label>
                <select
                  name="locationId"
                  value={formData.locationId}
                  onChange={handleFormChange}
                  required
                  className="w-full glass-input rounded-lg px-3 py-2 text-[#111] focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30"
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
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Department
                </label>
                <select
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleFormChange}
                  className="w-full glass-input rounded-lg px-3 py-2 text-[#111]"
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
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Vendor
                </label>
                <select
                  name="vendorId"
                  value={formData.vendorId}
                  onChange={handleFormChange}
                  className="w-full glass-input rounded-lg px-3 py-2 text-[#111]"
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
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Model
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleFormChange}
                  className="w-full glass-input rounded-lg px-3 py-2 text-[#111] focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Serial Number
                </label>
                <input
                  type="text"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleFormChange}
                  className="w-full glass-input rounded-lg px-3 py-2 text-[#111] focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Brand
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleFormChange}
                  className="w-full glass-input rounded-lg px-3 py-2 text-[#111] focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  PO Number
                </label>
                <input
                  type="text"
                  name="poNumber"
                  value={formData.poNumber}
                  onChange={handleFormChange}
                  placeholder="Purchase Order Number"
                  className="w-full glass-input rounded-lg px-3 py-2 text-[#111] focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30"
                />
              </div>
            </div>

            {/* Employee Assignment */}
            <div>
              <label className="block text-sm font-medium text-[#111] mb-2">
                Assign to Employee (Optional)
              </label>
              <select
                name="assignedEmployeeId"
                value={formData.assignedEmployeeId || ''}
                onChange={handleFormChange}
                className="w-full glass-input rounded-lg px-3 py-2 text-[#111] focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30"
              >
                <option value="">Select Employee</option>
                {Array.isArray(employees) && employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} {emp.npk ? ` - ${emp.npk}` : ''} {emp.position ? `(${emp.position})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  className="w-full glass-input rounded-lg px-3 py-2 text-[#111] focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30"
                >
                  <option value="">Select Status</option>
                  {enumStore.assetStatuses.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Condition
                </label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleFormChange}
                  className="w-full glass-input rounded-lg px-3 py-2 text-[#111] focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30"
                >
                  <option value="">Select Condition</option>
                  {enumStore.assetConditions.map(condition => (
                    <option key={condition.value} value={condition.value}>
                      {condition.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Purchase Date
                </label>
                <input
                  type="date"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleFormChange}
                  className="w-full glass-input rounded-lg px-3 py-2 text-[#111] focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Purchase Price
                </label>
                <input
                  type="number"
                  name="purchasePrice"
                  value={formData.purchasePrice}
                  onChange={handleFormChange}
                  step="0.01"
                  className="w-full glass-input rounded-lg px-3 py-2 text-[#111] focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Depreciation Rate (%)
                </label>
                <input
                  type="number"
                  name="depreciationRate"
                  value={formData.depreciationRate}
                  onChange={handleFormChange}
                  step="0.01"
                  className="w-full glass-input rounded-lg px-3 py-2 text-[#111]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Warranty Expiry
                </label>
                <input
                  type="date"
                  name="warrantyExpiry"
                  value={formData.warrantyExpiry}
                  onChange={handleFormChange}
                  className="w-full glass-input rounded-lg px-3 py-2 text-[#111]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111] mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                rows={3}
                className="w-full glass-input rounded-lg px-3 py-2 text-[#111] focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30"
              />
            </div>

            {/* File Upload Section */}
            <div>
              <label className="block text-sm font-medium text-[#111] mb-2">
                Upload Files (Images/Documents)
              </label>
              <div className="border-dashed border-2 border-black/10 rounded-lg p-4">
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-[#333]
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-white/60 file:text-[#111]
                    hover:file:bg-white/60"
                />
                <p className="text-xs text-[#333] mt-1">
                  Upload images or documents related to this asset (JPEG, PNG, PDF, DOC, XLS, TXT)
                </p>
                
                {/* File Preview */}
                {previewFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <h4 className="text-sm font-medium text-[#111]">Selected Files:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {previewFiles.map((preview, index) => (
                        <div key={index} className="relative border rounded-lg p-2">
                          {preview.type === 'image' ? (
                            <Image 
                              src={preview.url} 
                              alt={preview.file.name}
                              width={80}
                              height={64}
                              className="w-full h-16 object-cover rounded"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-16 bg-gray-100 rounded">
                              <span className="text-xs text-[#333] text-center">
                                {preview.file.name}
                              </span>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="absolute -top-1 -right-1 glass-button text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:glass-button"
                          >
                            ×
                          </button>
                          <p className="text-xs text-[#333] mt-1 truncate">
                            {preview.file.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Required Software Section */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Required Software (For devices that need software installation)
                </label>
                <a href="/master/software-assets" target="_blank" rel="noreferrer" className="text-sm text-[#111] hover:underline">Add / Manage Software</a>
              </div>
              <div className="space-y-3">
                {/* Software Selection Dropdown */}
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleSoftwareSelection(e.target.value)
                      e.target.value = ''
                    }
                  }}
                  className="w-full glass-input rounded-lg px-3 py-2 text-[#111] focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30"
                >
                  <option value="">Select software to add...</option>
                  {softwareItems.map(software => (
                    <option 
                      key={software.id} 
                      value={software.id}
                      disabled={selectedSoftware.some(s => s.id === software.id)}
                    >
                      {software.name} - {software.brand || 'Generic'} ({software.partNumber})
                    </option>
                  ))}
                </select>

                {/* Selected Software List */}
                {selectedSoftware.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-[#111]">Selected Software:</h4>
                    <div className="space-y-2">
                      {selectedSoftware.map((software) => (
                        <div key={software.id} className="flex items-center justify-between bg-white/60 rounded-lg p-3">
                          <div>
                            <p className="font-medium text-sm">{software.name}</p>
                            <p className="text-xs text-[#333]">
                              {software.brand || 'Generic'} - {software.partNumber}
                              {software.description && (
                                <span className="block text-[#333] mt-1">{software.description}</span>
                              )}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeSoftware(software.id)}
                            className="text-[#111] hover:scale-110 transition-transform p-1"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {softwareItems.length === 0 && (
                  <p className="text-sm text-[#333] italic">
                    No software items available in inventory. Add software items to the spare parts inventory first.
                  </p>
                )}
              </div>
            </div>

            {/* Asset Image Upload */}
            <div>
              <label className="block text-sm font-medium text-[#111] mb-2">
                Asset Image
              </label>
              <div className="space-y-4">
                {/* Current Image Preview */}
                {(editingAsset?.imageUrl || (previewFiles.length > 0 && previewFiles.find(p => p.type === 'image'))) && (
                  <div className="flex items-center space-x-4">
                    <div className="w-32 h-32 border rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      <Image 
                        src={
                          previewFiles.find(p => p.type === 'image')?.url || 
                          editingAsset?.imageUrl || 
                          '/placeholder-asset.png'
                        }
                        alt={editingAsset?.name || 'Asset preview'}
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm text-[#111] font-medium">Current Image</p>
                      <p className="text-xs text-[#333]">
                        {editingAsset ? 'Update by selecting a new image below' : 'Selected image preview'}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Image Upload Input */}
                <div className="border-dashed border-2 border-black/10 rounded-lg p-6">
                  <div className="text-center">
                    <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <div className="flex text-sm text-[#333]">
                      <label className="relative cursor-pointer glass-button text-white rounded-md px-4 py-2 font-medium hover:scale-105 transition-transform">
                        <span>Upload Asset Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0]
                              
                              // Add to selectedFiles for form submission
                              setSelectedFiles(prev => {
                                // Remove any existing images first
                                const nonImages = prev.filter(f => !f.type.startsWith('image/'))
                                return [...nonImages, file]
                              })
                              
                              // Create preview
                              const reader = new FileReader()
                              reader.onload = (event) => {
                                setPreviewFiles(prev => {
                                  // Remove any existing image previews
                                  const nonImagePreviews = prev.filter(p => p.type !== 'image')
                                  return [...nonImagePreviews, {
                                    file,
                                    url: event.target.result,
                                    type: 'image'
                                  }]
                                })
                              }
                              reader.readAsDataURL(file)
                            }
                          }}
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1 self-center">or drag and drop</p>
                    </div>
                    <p className="text-xs text-[#333] mt-2">
                      PNG, JPG, WebP up to 10MB
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Asset Specifications */}
            <div>
              <label className="block text-sm font-medium text-[#111] mb-2">
                Specifications
              </label>
              <AssetSpecifications
                asset={editingAsset || { specifications: formData.specifications || {} }}
                category={selectedCategory}
                onUpdate={(specData) => handleFormChange('specifications', specData.specifications)}
                readOnly={false}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false)
                  setSelectedFiles([])
                  setPreviewFiles([])
                  setSelectedSoftware([])
                  resetForm()
                }}
                className="px-4 py-2 border border-black/10 rounded-lg text-[#111] hover:bg-white/60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 glass-button text-white rounded-lg hover:scale-105 transition-transform disabled:opacity-50"
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
              <AlertCircle className="h-6 w-6 text-[#111] mr-3" />
              <h3 className="text-lg font-semibold text-[#111]">Delete Asset</h3>
            </div>
            <p className="text-[#333] mb-6">
              Are you sure you want to delete &quot;{assetToDelete?.name}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="glass-button px-4 py-2 rounded-lg text-[#111] hover:text-[#111] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 glass-button/80 backdrop-blur-sm text-white rounded-lg hover:glass-button/80 transition-all"
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
          <div className="p-6 border-b border-black/10/30">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#111]">Import Assets</h3>
              <button
                onClick={() => {
                  setShowImportModal(false)
                  setImportData('')
                  setImportResults(null)
                }}
                className="text-[#333] hover:text-[#111] glass-button p-2 rounded-lg transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#111] mb-2">
                CSV Data
              </label>
              <p className="text-sm text-[#333] mb-2">
                Paste your CSV data below. Expected format: Name, Description, Serial Number, Model, Brand, Category, Location, Department, Vendor, Purchase Date, Purchase Price, Warranty Expiry, Condition, Notes
              </p>
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                rows={10}
                className="w-full glass-input rounded-lg px-3 py-2 text-[#111]"
                placeholder="Name,Description,Serial Number,Model,Brand,Category,Location,Department,Vendor,Purchase Date,Purchase Price,Warranty Expiry,Condition,Notes&#10;Laptop Dell,Business laptop,ABC123,Latitude 5520,Dell,Computer,Office Floor 1,IT Department,Dell Inc,2023-01-15,15000000,2026-01-15,GOOD,Standard laptop"
              />
            </div>

            {importResults && (
              <div className="mt-4 p-4 border rounded-lg">
                <h4 className="font-medium text-[#111] mb-2">Import Results</h4>
                <div className="space-y-2">
                  <p className="text-[#111]">
                    ✓ {importResults.data.success.length} assets imported successfully
                  </p>
                  {importResults.data.errors.length > 0 && (
                    <div>
                      <p className="text-[#111]">
                        ✗ {importResults.data.errors.length} errors occurred:
                      </p>
                      <ul className="list-disc list-inside text-sm text-[#111] mt-1">
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
                className="px-4 py-2 border border-black/10 rounded-lg text-[#111] hover:bg-white/60"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!importData.trim()}
                className="px-4 py-2 glass-button text-white rounded-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
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
    return (
      <QRCodeDisplay 
        asset={selectedAssetForQR} 
        isOpen={showQRModal} 
        onClose={() => setShowQRModal(false)}
      />
    )
  }

  return (
    <DashboardLayout title="Assets">
      <div className="p-6 space-y-6">
      {/* Header */}
      <div className="glass-card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#111]">Asset Management</h1>
            <p className="text-[#333]">
              Manage and track all organizational assets
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="glass-button px-4 py-2 rounded-lg text-[#111] flex items-center space-x-2 hover:scale-105 transition-transform"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </button>
            <button 
              onClick={() => setShowImportModal(true)}
              className="glass-button px-4 py-2 rounded-lg text-[#111] flex items-center space-x-2 hover:scale-105 transition-transform"
            >
              <Upload className="h-4 w-4" />
              <span>Import</span>
            </button>
            <button 
              onClick={handleExport}
              className="glass-button px-4 py-2 rounded-lg text-[#111] flex items-center space-x-2 hover:scale-105 transition-transform"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
            <button
              onClick={() => {
                resetForm()
                setShowModal(true)
              }}
              className="glass-button px-4 py-2 rounded-lg text-[#111] flex items-center space-x-2 hover:scale-105 transition-transform"
            >
              <Plus className="h-4 w-4" />
              <span>Add Asset</span>
            </button>
            <button
              onClick={() => setShowQRScanner(true)}
              className="glass-button px-4 py-2 rounded-lg text-[#111] flex items-center space-x-2 hover:scale-105 transition-transform"
            >
              <QrCode className="h-4 w-4" />
              <span>Scan QR</span>
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
            <div key={index} className="glass-card">
              <div className="flex items-center">
                <div className="glass-button p-3 rounded-lg">
                  <IconComponent className="h-6 w-6 text-[#111]" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-[#333]">{stat.title}</p>
                  <p className="text-2xl font-bold text-[#111]">
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
        <div className="glass-card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#111] mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#333]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search assets..."
                  className="glass-input pl-10 w-full rounded-lg px-3 py-2 text-sm text-[#111]"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#111] mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); fetchAssets({ page: 1 }) }}
                className="glass-input w-full rounded-lg px-3 py-2 text-sm text-[#111]"
              >
                <option value="">All Status</option>
                {enumStore.assetStatuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111] mb-2">
                Company
              </label>
              <select
                value={companyFilter}
                onChange={(e) => { setCompanyFilter(e.target.value); fetchAssets({ page: 1 }) }}
                className="glass-input w-full rounded-lg px-3 py-2 text-sm text-[#111]"
              >
                <option value="">All Companies</option>
                {Array.isArray(companies) && companies.map(company => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111] mb-2">
                Condition
              </label>
              <select
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value)}
                className="glass-input w-full rounded-lg px-3 py-2 text-sm text-[#111]"
              >
                <option value="">All Conditions</option>
                {enumStore.assetConditions.map(condition => (
                  <option key={condition.value} value={condition.value}>
                    {condition.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('')
                  setConditionFilter('')
                  setCompanyFilter('')
                  fetchAssets({ page: 1 })
                  showInfo('Filters cleared')
                }}
                className="glass-button w-full px-4 py-2 rounded-lg text-sm text-[#111] hover:scale-105 transition-transform"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assets Table */}
      <div className="glass-card overflow-hidden">
        <div className="glass-table overflow-x-auto rounded-xl">
          <table className="min-w-full">
            <thead className="bg-white/60">
              <tr>
                <th className="px-6 py-3 text-left text-[#111] font-semibold uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-[#111] font-semibold uppercase tracking-wider">
                  Asset
                </th>
                <th className="px-6 py-3 text-left text-[#111] font-semibold uppercase tracking-wider">
                  Employee/Owner
                </th>
                <th className="px-6 py-3 text-left text-[#111] font-semibold uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-[#111] font-semibold uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-[#111] font-semibold uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-[#111] font-semibold uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-[#111] font-semibold uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-[#111] font-semibold uppercase tracking-wider">
                  Condition
                </th>
                <th className="px-6 py-3 text-left text-[#111] font-semibold uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-[#111] font-semibold uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-black/10">
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-6 py-4 text-center text-[#111]">
                    <div className="flex items-center justify-center">
                      <Package className="animate-spin h-5 w-5 mr-2" />
                      Loading assets...
                    </div>
                  </td>
                </tr>
              ) : paginatedAssets.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-4 text-center text-[#333]">
                    No assets found
                  </td>
                </tr>
              ) : (
                paginatedAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-white/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border border-gray-200">
                        {asset.imageUrl ? (
                          <Image 
                            src={asset.imageUrl} 
                            alt={asset.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                            onClick={() => {
                              // Open image in modal or larger view
                              setSelectedAssetId(asset.id);
                              setShowDetailModal(true);
                            }}
                          />
                        ) : (
                          <div className="flex flex-col items-center text-gray-400">
                            <Package className="h-5 w-5 mb-1" />
                            <span className="text-xs">No Image</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-[#111]">{asset.name}</span>
                          {asset.qrCodeImage && (
                            <QrCode className="h-4 w-4 ml-2 text-[#111]" title="QR Code Available" />
                          )}
                        </div>
                        <div 
                          className="text-sm text-[#333] cursor-pointer hover:text-[#111]"
                          onClick={() => {
                            setSelectedAssetId(asset.id);
                            setShowDetailModal(true);
                          }}
                          title="Click to view asset details"
                        >
                          <Tag className="inline h-3 w-3 mr-1" />
                          {asset.assetTag}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-[#111]">
                        {asset.assignedEmployee ? (
                          <div>
                            <div className="font-medium">
                              {asset.assignedEmployee.firstName} {asset.assignedEmployee.lastName}
                            </div>
                            <div className="text-[#333] text-xs">
                              NPK: {asset.assignedEmployee.npk || '-'}
                            </div>
                            <div className="text-[#333] text-xs">
                              {asset.assignedEmployee.position || '-'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[#333]">Unassigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#111]">
                      {asset.department?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#111]">
                      {asset.category?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-[#111]">
                        <MapPin className="h-4 w-4 mr-1 text-[#333]" />
                        {asset.location?.name || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#111]">
                      {asset.company?.name || '-'}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#111]">
                      {asset.purchasePrice ? `$${asset.purchasePrice.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(asset)}
                          className="text-[#111] hover:scale-110 transition-transform"
                          title="Edit Asset"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAssetId(asset.id);
                            setShowDetailModal(true);
                          }}
                          className="text-[#111] hover:scale-110 transition-transform"
                          title="View Asset Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {asset.qrCodeImage ? (
                          <button
                            onClick={() => handleViewQR(asset)}
                            className="text-[#111] hover:scale-110 transition-transform"
                            title="View QR Code"
                          >
                            <QrCode className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleGenerateQR(asset.id)}
                            className="text-[#111] hover:scale-110 transition-transform"
                            title="Generate QR Code"
                          >
                            <QrCode className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedAssetId(asset.id);
                            setShowTransferModal(true);
                          }}
                          className="text-[#111] hover:scale-110 transition-transform"
                          title="Transfer Asset"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAssetId(asset.id);
                            setShowDepreciationModal(true);
                          }}
                          className="text-[#111] hover:scale-110 transition-transform"
                          title="Set Depreciation"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(asset)}
                          className="text-[#111] hover:scale-110 transition-transform"
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
        <div className="flex items-center justify-between bg-white px-4 py-3 border border-black/10 rounded-lg">
          <div className="flex items-center">
            <p className="text-sm text-[#111]">
              Showing{' '}
              <span className="font-medium">
                {(storePage - 1) * pageSize + 1}
              </span>{' '}
              to{' '}
              <span className="font-medium">
                {Math.min(storePage * pageSize, totalAssets)}
              </span>{' '}
              of{' '}
              <span className="font-medium">{totalAssets}</span>{' '}
              results
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setPage(storePage - 1)
                fetchAssets({ page: storePage - 1 })
              }}
              disabled={storePage === 1}
              className="inline-flex items-center px-3 py-2 border border-black/10 rounded-lg text-sm font-medium text-[#111] bg-white hover:bg-white/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-[#111]">
              Page {storePage} of {totalPages}
            </span>
            <button
              onClick={() => {
                setPage(storePage + 1)
                fetchAssets({ page: storePage + 1 })
              }}
              disabled={storePage === totalPages}
              className="inline-flex items-center px-3 py-2 border border-black/10 rounded-lg text-sm font-medium text-[#111] bg-white hover:bg-white/40 disabled:opacity-50 disabled:cursor-not-allowed"
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
      
      {/* Asset Detail Modal */}
      <AssetDetailModal 
        assetId={selectedAssetId}
        isOpen={showDetailModal} 
        onClose={() => setShowDetailModal(false)} 
      />
      
      {/* Transfer Modal */}
      <TransferModal 
        assetId={selectedAssetId}
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        onTransferComplete={() => {
          fetchAssets();
          showSuccess('Asset transferred successfully');
        }}
      />
      
      {/* Depreciation Modal */}
      <DepreciationModal 
        assetId={selectedAssetId}
        isOpen={showDepreciationModal}
        onClose={() => setShowDepreciationModal(false)}
        onComplete={() => {
          fetchAssets();
          showSuccess('Depreciation settings saved');
        }}
      />
      </div>
    </DashboardLayout>
  )
}

export default AssetsPage