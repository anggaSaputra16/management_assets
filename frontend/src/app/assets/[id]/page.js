'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { useAssetStore } from '@/stores'
import { useAssetComponentStore } from '@/stores/assetComponentStore'
import { useAssetSpecificationStore } from '@/stores/assetSpecificationStore'
import { useToast } from '@/contexts/ToastContext'
import { assetSoftwareService } from '@/lib/services/assetSoftwareService'
import { softwareAssetsService } from '@/lib/services/softwareAssetsService'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Plus, 
  Settings, 
  Package,
  Wrench,
  ArrowRightLeft,
  History,
  User,
  CheckCircle2,
  AlertTriangle,
  Info,
  Monitor,
  Download,
  X
} from 'lucide-react'

const statusColors = {
  AVAILABLE: 'bg-green-100 text-green-800',
  IN_USE: 'bg-blue-100 text-blue-800',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800',
  RETIRED: 'bg-gray-100 text-gray-800',
  DISPOSED: 'bg-red-100 text-red-800'
}

const conditionColors = {
  Excellent: 'bg-green-100 text-green-800',
  Good: 'bg-blue-100 text-blue-800',
  Fair: 'bg-yellow-100 text-yellow-800',
  Poor: 'bg-orange-100 text-orange-800',
  Damaged: 'bg-red-100 text-red-800'
}

const componentStatusColors = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  TRANSFERRED: 'bg-blue-100 text-blue-800',
  DAMAGED: 'bg-red-100 text-red-800',
  REPLACED: 'bg-orange-100 text-orange-800'
}

export default function AssetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState('overview')
  
  // Software state
  const [installedSoftware, setInstalledSoftware] = useState([])
  const [availableSoftware, setAvailableSoftware] = useState([])
  const [softwareLoading, setSoftwareLoading] = useState(false)
  const [showSoftwareModal, setShowSoftwareModal] = useState(false)
  const [showUninstallModal, setShowUninstallModal] = useState(false)
  const [selectedInstallation, setSelectedInstallation] = useState(null)
  const [installationForm, setInstallationForm] = useState({
    softwareAssetId: '',
    licenseId: '',
    version: '',
    installationPath: '',
    notes: ''
  })
  
  const { 
    currentAsset, 
    loading: assetLoading, 
    fetchAsset, 
    deleteAsset 
  } = useAssetStore()

  const {
    components,
    compatibleAssets,
    loading: componentsLoading,
    showModal: showComponentModal,
    showTransferModal,
    showMaintenanceModal,
    editingComponent,
    selectedComponent,
    formData: componentForm,
    transferData,
    maintenanceData,
    fetchComponents,
    addComponent,
    updateComponent,
    transferComponent,
    deleteComponent,
    addComponentMaintenance,
    fetchCompatibleAssets,
    setShowModal: setShowComponentModal,
    setShowTransferModal,
    setShowMaintenanceModal,
    setEditingComponent,
    setSelectedComponent,
    setTransferData,
    setMaintenanceData,
    resetForm: resetComponentForm,
    resetTransferForm,
    resetMaintenanceForm,
    handleInputChange: handleComponentInputChange
  } = useAssetComponentStore()

  const {
    grouped: groupedSpecs,
    loading: specsLoading,
    showModal: showSpecModal,
    editingSpecification,
    formData: specForm,
    fetchSpecifications,
    addSpecification,
    updateSpecification,
    deleteSpecification,
    setShowModal: setShowSpecModal,
    setEditingSpecification,
    resetForm: resetSpecForm,
    handleInputChange: handleSpecInputChange
  } = useAssetSpecificationStore()

  useEffect(() => {
    if (params.id) {
      fetchAsset(params.id)
      fetchComponents(params.id)
      fetchSpecifications(params.id)
      fetchAssetSoftware()
    }
  }, [params.id, fetchAsset, fetchComponents, fetchSpecifications])

  // Software management functions
  const fetchAssetSoftware = async () => {
    if (!params.id) return
    
    setSoftwareLoading(true)
    try {
      const [installedResult, availableResult] = await Promise.all([
        assetSoftwareService.getAssetSoftware(params.id),
        assetSoftwareService.getAvailableSoftware(params.id)
      ])
      
      setInstalledSoftware(installedResult.data || [])
      setAvailableSoftware(availableResult.data || [])
    } catch (error) {
      console.error('Failed to fetch asset software:', error)
      showToast('Failed to load software information', 'error')
    } finally {
      setSoftwareLoading(false)
    }
  }

  const handleInstallSoftware = async (e) => {
    e.preventDefault()
    try {
      await assetSoftwareService.installSoftware({
        assetId: params.id,
        ...installationForm
      })
      showToast('Software installed successfully', 'success')
      setShowSoftwareModal(false)
      setInstallationForm({
        softwareAssetId: '',
        licenseId: '',
        version: '',
        installationPath: '',
        notes: ''
      })
      await fetchAssetSoftware() // Refresh data
    } catch (error) {
      showToast(error.message, 'error')
    }
  }

  const handleUninstallSoftware = async (e) => {
    e.preventDefault()
    try {
      await assetSoftwareService.uninstallSoftware(
        selectedInstallation.id,
        installationForm.notes
      )
      showToast('Software uninstalled successfully', 'success')
      setShowUninstallModal(false)
      setSelectedInstallation(null)
      setInstallationForm({
        softwareAssetId: '',
        licenseId: '',
        version: '',
        installationPath: '',
        notes: ''
      })
      await fetchAssetSoftware() // Refresh data
    } catch (error) {
      showToast(error.message, 'error')
    }
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
        await deleteAsset(currentAsset.id)
        showToast('Asset deleted successfully', 'success')
        router.push('/assets')
      } catch (error) {
        showToast(error.message, 'error')
      }
    }
  }

  const handleComponentSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingComponent) {
        await updateComponent(editingComponent.id, componentForm)
        showToast('Component updated successfully', 'success')
      } else {
        await addComponent(params.id, componentForm)
        showToast('Component added successfully', 'success')
      }
    } catch (error) {
      showToast(error.message, 'error')
    }
  }

  const handleComponentTransfer = async (e) => {
    e.preventDefault()
    try {
      await transferComponent(selectedComponent.id, transferData)
      showToast('Component transferred successfully', 'success')
    } catch (error) {
      showToast(error.message, 'error')
    }
  }

  const handleComponentMaintenance = async (e) => {
    e.preventDefault()
    try {
      await addComponentMaintenance(selectedComponent.id, maintenanceData)
      showToast('Maintenance record added successfully', 'success')
    } catch (error) {
      showToast(error.message, 'error')
    }
  }

  const handleTransferModalOpen = async (component) => {
    setSelectedComponent(component)
    setShowTransferModal(true)
    // Fetch compatible assets for this component
    try {
      await fetchCompatibleAssets(component.id)
    } catch (error) {
      console.error('Failed to load compatible assets:', error)
      showToast('Failed to load compatible assets', 'error')
    }
  }

  const handleSpecSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingSpecification) {
        await updateSpecification(editingSpecification.id, specForm)
        showToast('Specification updated successfully', 'success')
      } else {
        await addSpecification(params.id, specForm)
        showToast('Specification added successfully', 'success')
      }
    } catch (error) {
      showToast(error.message, 'error')
    }
  }

  const handleComponentDelete = async (component) => {
    if (window.confirm('Are you sure you want to delete this component?')) {
      try {
        await deleteComponent(component.id)
        showToast('Component deleted successfully', 'success')
      } catch (error) {
        showToast(error.message, 'error')
      }
    }
  }

  const handleSpecDelete = async (spec) => {
    if (window.confirm('Are you sure you want to delete this specification?')) {
      try {
        await deleteSpecification(spec.id)
        showToast('Specification deleted successfully', 'success')
      } catch (error) {
        showToast(error.message, 'error')
      }
    }
  }

  if (assetLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!currentAsset) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Asset Not Found</h2>
          <p className="text-gray-600">The asset you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{currentAsset.name}</h1>
              <p className="text-gray-600">Asset Tag: {currentAsset.assetTag}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push(`/assets/${currentAsset.id}/qr-code`)}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="3" width="5" height="5" strokeWidth={2} />
                <rect x="3" y="16" width="5" height="5" strokeWidth={2} />
                <rect x="16" y="3" width="5" height="5" strokeWidth={2} />
                <line x1="9" y1="9" x2="9" y2="10" strokeWidth={2} />
                <line x1="9" y1="13" x2="9" y2="14" strokeWidth={2} />
                <line x1="12" y1="9" x2="13" y2="9" strokeWidth={2} />
                <line x1="12" y1="12" x2="12" y2="13" strokeWidth={2} />
                <line x1="12" y1="16" x2="12" y2="17" strokeWidth={2} />
                <line x1="16" y1="12" x2="17" y2="12" strokeWidth={2} />
                <line x1="11" y1="17" x2="12" y2="17" strokeWidth={2} />
              </svg>
              QR Code
            </button>
            <button
              onClick={() => router.push(`/assets/transfer?assetId=${currentAsset.id}`)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Transfer
            </button>
            <button
              onClick={() => router.push(`/assets/depreciation?assetId=${currentAsset.id}`)}
              className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLineJoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
              Depreciation
            </button>
            <button
              onClick={() => router.push(`/assets/${currentAsset.id}/edit`)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Asset
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'overview', label: 'Overview', icon: Info },
              { key: 'components', label: 'Components', icon: Package },
              { key: 'software', label: 'Software', icon: Monitor },
              { key: 'specifications', label: 'Specifications', icon: Settings },
              { key: 'maintenance', label: 'Maintenance', icon: Wrench },
              { key: 'history', label: 'History', icon: History }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-purple-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Asset Info */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Asset Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Asset Tag</label>
                  <p className="mt-1 text-sm text-gray-900">{currentAsset.assetTag}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Name</label>
                  <p className="mt-1 text-sm text-gray-900">{currentAsset.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Category</label>
                  <p className="mt-1 text-sm text-gray-900">{currentAsset.category?.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[currentAsset.status]}`}>
                    {currentAsset.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Condition</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${conditionColors[currentAsset.condition] || 'bg-gray-100 text-gray-800'}`}>
                    {currentAsset.condition || 'Not specified'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Serial Number</label>
                  <p className="mt-1 text-sm text-gray-900">{currentAsset.serialNumber || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Model</label>
                  <p className="mt-1 text-sm text-gray-900">{currentAsset.model || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Brand</label>
                  <p className="mt-1 text-sm text-gray-900">{currentAsset.brand || 'N/A'}</p>
                </div>
              </div>
              
              {currentAsset.description && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-500">Description</label>
                  <p className="mt-1 text-sm text-gray-900">{currentAsset.description}</p>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="space-y-6">
              {/* Purchase Info */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Purchase Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Purchase Date</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {currentAsset.purchaseDate ? new Date(currentAsset.purchaseDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Purchase Price</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {currentAsset.purchasePrice ? `$${parseFloat(currentAsset.purchasePrice).toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Current Value</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {currentAsset.currentValue ? `$${parseFloat(currentAsset.currentValue).toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Warranty Expiry</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {currentAsset.warrantyExpiry ? new Date(currentAsset.warrantyExpiry).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Location Info */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Location & Assignment</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Location</label>
                    <p className="mt-1 text-sm text-gray-900">{currentAsset.location?.name || 'Not assigned'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Department</label>
                    <p className="mt-1 text-sm text-gray-900">{currentAsset.department?.name || 'Not assigned'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Assigned To</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {currentAsset.assignedTo ? `${currentAsset.assignedTo.firstName} ${currentAsset.assignedTo.lastName}` : 'Not assigned'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Vendor</label>
                    <p className="mt-1 text-sm text-gray-900">{currentAsset.vendor?.name || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'components' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Asset Components</h3>
                <button
                  onClick={() => {
                    resetComponentForm()
                    setShowComponentModal(true)
                  }}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Component
                </button>
              </div>
            </div>

            <div className="p-6">
              {componentsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                </div>
              ) : components.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {components.map((component) => (
                    <div key={component.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{component.name}</h4>
                          {component.description && (
                            <p className="text-sm text-gray-600 mt-1">{component.description}</p>
                          )}
                          <div className="mt-2 space-y-1">
                            {component.partNumber && (
                              <p className="text-xs text-gray-500">Part #: {component.partNumber}</p>
                            )}
                            {component.serialNumber && (
                              <p className="text-xs text-gray-500">Serial: {component.serialNumber}</p>
                            )}
                            {component.brand && (
                              <p className="text-xs text-gray-500">Brand: {component.brand}</p>
                            )}
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${componentStatusColors[component.status]}`}>
                              {component.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          <button
                            onClick={() => setEditingComponent(component)}
                            className="p-1 text-gray-400 hover:text-blue-600"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {component.isTransferable && (
                            <button
                              onClick={() => handleTransferModalOpen(component)}
                              className="p-1 text-gray-400 hover:text-blue-600"
                            >
                              <ArrowRightLeft className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedComponent(component)
                              setShowMaintenanceModal(true)
                            }}
                            className="p-1 text-gray-400 hover:text-green-600"
                          >
                            <Wrench className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleComponentDelete(component)}
                            className="p-1 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No components</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by adding a component to this asset.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'software' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Installed Software</h3>
                <button
                  onClick={() => {
                    setInstallationForm({
                      softwareAssetId: '',
                      licenseId: '',
                      version: '',
                      installationPath: '',
                      notes: ''
                    })
                    setShowSoftwareModal(true)
                  }}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Install Software
                </button>
              </div>
            </div>

            <div className="p-6">
              {softwareLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                </div>
              ) : installedSoftware.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {installedSoftware.map((installation) => (
                    <div key={installation.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{installation.softwareAsset.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Version: {installation.version || installation.softwareAsset.version || 'Not specified'}
                          </p>
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-gray-500">
                              Type: {installation.softwareAsset.softwareType || 'Not specified'}
                            </p>
                            {installation.softwareAsset.publisher && (
                              <p className="text-xs text-gray-500">
                                Publisher: {installation.softwareAsset.publisher}
                              </p>
                            )}
                            {installation.installationPath && (
                              <p className="text-xs text-gray-500">
                                Path: {installation.installationPath}
                              </p>
                            )}
                            {installation.license && (
                              <div className="flex items-center space-x-1">
                                <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                  Licensed
                                </span>
                                {installation.license.expiryDate && (
                                  <span className="text-xs text-gray-500">
                                    Expires: {new Date(installation.license.expiryDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            )}
                            <p className="text-xs text-gray-400">
                              Installed: {new Date(installation.installationDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          <button
                            onClick={() => {
                              setSelectedInstallation(installation)
                              setInstallationForm({
                                softwareAssetId: installation.softwareAssetId,
                                licenseId: installation.licenseId || '',
                                version: installation.version || '',
                                installationPath: installation.installationPath || '',
                                notes: ''
                              })
                              setShowUninstallModal(true)
                            }}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Uninstall Software"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Monitor className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No software installed</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by installing software on this asset.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'specifications' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Asset Specifications</h3>
                <button
                  onClick={() => {
                    resetSpecForm()
                    setShowSpecModal(true)
                  }}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Specification
                </button>
              </div>
            </div>

            <div className="p-6">
              {specsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                </div>
              ) : Object.keys(groupedSpecs).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(groupedSpecs).map(([category, specs]) => (
                    <div key={category}>
                      <h4 className="font-medium text-gray-900 mb-3">{category}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {specs.map((spec) => (
                          <div key={spec.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center">
                                  <h5 className="font-medium text-gray-900">{spec.name}</h5>
                                  {spec.isCore && (
                                    <span className="ml-2 inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                      Core
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  {spec.value} {spec.unit && <span className="text-gray-400">{spec.unit}</span>}
                                </p>
                              </div>
                              <div className="flex items-center space-x-1 ml-2">
                                <button
                                  onClick={() => setEditingSpecification(spec)}
                                  className="p-1 text-gray-400 hover:text-blue-600"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleSpecDelete(spec)}
                                  className="p-1 text-gray-400 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Settings className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No specifications</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by adding specifications to this asset.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Asset Maintenance Records</h3>
                <button
                  onClick={() => {
                    setSelectedComponent({ id: 'asset', name: currentAsset.name })
                    setShowMaintenanceModal(true)
                  }}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Maintenance
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Mock maintenance records for now */}
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <Wrench className="h-5 w-5 text-green-600 mr-2" />
                        <h4 className="font-medium text-gray-900">Preventive Maintenance</h4>
                        <span className="ml-2 inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Completed
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Regular system cleaning and component inspection</p>
                      <div className="mt-2 text-xs text-gray-500">
                        <span>Performed by: John Technician</span> • 
                        <span className="ml-1">Date: {new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span> • 
                        <span className="ml-1">Cost: $150.00</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <Wrench className="h-5 w-5 text-yellow-600 mr-2" />
                        <h4 className="font-medium text-gray-900">Hardware Upgrade</h4>
                        <span className="ml-2 inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          Scheduled
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">RAM upgrade from 16GB to 32GB</p>
                      <div className="mt-2 text-xs text-gray-500">
                        <span>Assigned to: Jane Smith</span> • 
                        <span className="ml-1">Scheduled: {new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span> • 
                        <span className="ml-1">Est. Cost: $280.00</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Empty state if no maintenance records */}
              <div className="text-center py-8 hidden">
                <Wrench className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No maintenance records</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by adding a maintenance record for this asset.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Asset History & Audit Trail</h3>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {/* Timeline */}
                <div className="flow-root">
                  <ul className="-mb-8">
                    <li>
                      <div className="relative pb-8">
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                              <CheckCircle2 className="h-5 w-5 text-white" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-500">
                                Component <span className="font-medium text-gray-900">RAM Module DDR4-3200</span> added to asset
                              </p>
                              <p className="text-xs text-gray-400 mt-1">Added by System Admin</p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              <time>{new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString()}</time>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>

                    <li>
                      <div className="relative pb-8">
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                              <ArrowRightLeft className="h-4 w-4 text-white" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-500">
                                Asset transferred from <span className="font-medium text-gray-900">IT Department</span> to <span className="font-medium text-gray-900">Finance Department</span>
                              </p>
                              <p className="text-xs text-gray-400 mt-1">Transferred by John Manager</p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              <time>{new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</time>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>

                    <li>
                      <div className="relative pb-8">
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center ring-8 ring-white">
                              <Wrench className="h-4 w-4 text-white" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-500">
                                Maintenance completed: <span className="font-medium text-gray-900">System optimization and cleaning</span>
                              </p>
                              <p className="text-xs text-gray-400 mt-1">Performed by Technical Team</p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              <time>{new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}</time>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>

                    <li>
                      <div className="relative pb-8">
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center ring-8 ring-white">
                              <User className="h-4 w-4 text-white" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-500">
                                Asset assigned to <span className="font-medium text-gray-900">Sarah Johnson</span>
                              </p>
                              <p className="text-xs text-gray-400 mt-1">Assigned by Asset Administrator</p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              <time>{new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toLocaleDateString()}</time>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>

                    <li>
                      <div className="relative">
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-gray-500 flex items-center justify-center ring-8 ring-white">
                              <Package className="h-4 w-4 text-white" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-500">
                                Asset <span className="font-medium text-gray-900">{currentAsset.name}</span> created in the system
                              </p>
                              <p className="text-xs text-gray-400 mt-1">Created by System Administrator</p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              <time>{currentAsset.createdAt ? new Date(currentAsset.createdAt).toLocaleDateString() : 'N/A'}</time>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Empty state if no history */}
              <div className="text-center py-8 hidden">
                <History className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No history available</h3>
                <p className="mt-1 text-sm text-gray-500">Asset history will appear here as actions are performed.</p>
              </div>
            </div>
          </div>
        )}

        {/* Component Modal */}
        {showComponentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingComponent ? 'Edit Component' : 'Add New Component'}
                </h3>
              </div>
              
              <form onSubmit={handleComponentSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Component Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={componentForm.name}
                      onChange={handleComponentInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., RAM Module, CPU, Hard Drive"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Part Number
                    </label>
                    <input
                      type="text"
                      name="partNumber"
                      value={componentForm.partNumber}
                      onChange={handleComponentInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Manufacturer part number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Serial Number
                    </label>
                    <input
                      type="text"
                      name="serialNumber"
                      value={componentForm.serialNumber}
                      onChange={handleComponentInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Component serial number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brand
                    </label>
                    <input
                      type="text"
                      name="brand"
                      value={componentForm.brand}
                      onChange={handleComponentInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Component brand"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Model
                    </label>
                    <input
                      type="text"
                      name="model"
                      value={componentForm.model}
                      onChange={handleComponentInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Component model"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purchase Date
                    </label>
                    <input
                      type="date"
                      name="purchaseDate"
                      value={componentForm.purchaseDate}
                      onChange={handleComponentInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purchase Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="purchasePrice"
                      value={componentForm.purchasePrice}
                      onChange={handleComponentInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Warranty Expiry
                    </label>
                    <input
                      type="date"
                      name="warrantyExpiry"
                      value={componentForm.warrantyExpiry}
                      onChange={handleComponentInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={componentForm.description}
                    onChange={handleComponentInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Optional description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isReplaceable"
                      name="isReplaceable"
                      checked={componentForm.isReplaceable}
                      onChange={handleComponentInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isReplaceable" className="ml-2 block text-sm text-gray-900">
                      Component is replaceable
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isTransferable"
                      name="isTransferable"
                      checked={componentForm.isTransferable}
                      onChange={handleComponentInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isTransferable" className="ml-2 block text-sm text-gray-900">
                      Component is transferable
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={componentForm.notes}
                    onChange={handleComponentInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Additional notes"
                  />
                </div>

                <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      resetComponentForm()
                      setShowComponentModal(false)
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingComponent ? 'Update Component' : 'Add Component'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Specification Modal */}
        {showSpecModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingSpecification ? 'Edit Specification' : 'Add New Specification'}
                </h3>
              </div>
              
              <form onSubmit={handleSpecSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specification Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={specForm.name}
                    onChange={handleSpecInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., CPU, RAM, Storage"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Value *
                  </label>
                  <input
                    type="text"
                    name="value"
                    value={specForm.value}
                    onChange={handleSpecInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Intel i7-10700K, 16GB, 1TB SSD"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit
                    </label>
                    <input
                      type="text"
                      name="unit"
                      value={specForm.unit}
                      onChange={handleSpecInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., GB, MHz, inches"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      name="category"
                      value={specForm.category}
                      onChange={handleSpecInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Hardware">Hardware</option>
                      <option value="Software">Software</option>
                      <option value="Performance">Performance</option>
                      <option value="Display">Display</option>
                      <option value="Network">Network</option>
                      <option value="Storage">Storage</option>
                      <option value="Memory">Memory</option>
                      <option value="General">General</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isCore"
                    name="isCore"
                    checked={specForm.isCore}
                    onChange={handleSpecInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isCore" className="ml-2 block text-sm text-gray-900">
                    Core specification
                  </label>
                </div>

                <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      resetSpecForm()
                      setShowSpecModal(false)
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingSpecification ? 'Update Specification' : 'Add Specification'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Component Transfer Modal */}
        {showTransferModal && selectedComponent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Transfer Component: {selectedComponent.name}
                </h3>
              </div>
              
              <form onSubmit={handleComponentTransfer} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Asset *
                  </label>
                  <select
                    name="toAssetId"
                    value={transferData.toAssetId}
                    onChange={(e) => setTransferData({...transferData, toAssetId: e.target.value})}
                    required
                    disabled={componentsLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  >
                    <option value="">
                      {componentsLoading ? 'Loading compatible assets...' : 'Select target asset'}
                    </option>
                    {compatibleAssets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name} ({asset.assetTag})
                        {asset.category?.name && ` - ${asset.category.name}`}
                        {asset.location?.name && ` | ${asset.location.name}`}
                      </option>
                    ))}
                    {compatibleAssets.length === 0 && !componentsLoading && (
                      <option value="" disabled>No compatible assets found</option>
                    )}
                  </select>
                  {!componentsLoading && compatibleAssets.length === 0 && (
                    <p className="mt-1 text-sm text-gray-500">
                      No compatible assets found. Assets must be in the same category and have available status.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transfer Reason *
                  </label>
                  <select
                    name="reason"
                    value={transferData.reason}
                    onChange={(e) => setTransferData({...transferData, reason: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select reason</option>
                    <option value="Upgrade">Upgrade</option>
                    <option value="Replacement">Replacement</option>
                    <option value="Repair">Repair</option>
                    <option value="Reallocation">Reallocation</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transfer Notes
                  </label>
                  <textarea
                    name="notes"
                    value={transferData.notes}
                    onChange={(e) => setTransferData({...transferData, notes: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Additional notes for the transfer"
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Transfer Warning
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>This component will be removed from the current asset and added to the target asset. This action cannot be undone.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      resetTransferForm()
                      setShowTransferModal(false)
                      setSelectedComponent(null)
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Transfer Component
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Component Maintenance Modal */}
        {showMaintenanceModal && selectedComponent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Add Maintenance Record: {selectedComponent.name}
                </h3>
              </div>
              
              <form onSubmit={handleComponentMaintenance} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maintenance Type *
                  </label>
                  <select
                    name="maintenanceType"
                    value={maintenanceData.maintenanceType}
                    onChange={(e) => setMaintenanceData({...maintenanceData, maintenanceType: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select maintenance type</option>
                    <option value="PREVENTIVE">Preventive Maintenance</option>
                    <option value="CORRECTIVE">Corrective Maintenance</option>
                    <option value="EMERGENCY">Emergency Repair</option>
                    <option value="UPGRADE">Upgrade</option>
                    <option value="INSPECTION">Inspection</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={maintenanceData.description}
                    onChange={(e) => setMaintenanceData({...maintenanceData, description: e.target.value})}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe the maintenance performed"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maintenance Date
                    </label>
                    <input
                      type="date"
                      name="maintenanceDate"
                      value={maintenanceData.maintenanceDate}
                      onChange={(e) => setMaintenanceData({...maintenanceData, maintenanceDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cost
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="cost"
                      value={maintenanceData.cost}
                      onChange={(e) => setMaintenanceData({...maintenanceData, cost: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    name="notes"
                    value={maintenanceData.notes}
                    onChange={(e) => setMaintenanceData({...maintenanceData, notes: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Additional maintenance notes"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex">
                    <Info className="h-5 w-5 text-blue-400 mt-0.5" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Maintenance Record
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>This maintenance record will be added to the component&apos;s history for tracking and warranty purposes.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      resetMaintenanceForm()
                      setShowMaintenanceModal(false)
                      setSelectedComponent(null)
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Maintenance Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Software Installation Modal */}
        {showSoftwareModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Install Software</h3>
              </div>
              
              <form onSubmit={handleInstallSoftware} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Software *
                  </label>
                  <select
                    name="softwareAssetId"
                    value={installationForm.softwareAssetId}
                    onChange={(e) => setInstallationForm({...installationForm, softwareAssetId: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select software to install</option>
                    {availableSoftware.map((software) => (
                      <option key={software.id} value={software.id}>
                        {software.name} - {software.availableLicenses} licenses available
                      </option>
                    ))}
                  </select>
                  {availableSoftware.length === 0 && (
                    <p className="mt-1 text-sm text-gray-500">
                      No software with available licenses found.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Version
                    </label>
                    <input
                      type="text"
                      name="version"
                      value={installationForm.version}
                      onChange={(e) => setInstallationForm({...installationForm, version: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Version (optional)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Installation Path
                    </label>
                    <input
                      type="text"
                      name="installationPath"
                      value={installationForm.installationPath}
                      onChange={(e) => setInstallationForm({...installationForm, installationPath: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Installation path (optional)"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Installation Notes
                  </label>
                  <textarea
                    name="notes"
                    value={installationForm.notes}
                    onChange={(e) => setInstallationForm({...installationForm, notes: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Optional installation notes"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex">
                    <Info className="h-5 w-5 text-blue-400 mt-0.5" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        License Usage
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>Installing this software will consume one license. Make sure you have available licenses before proceeding.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setInstallationForm({
                        softwareAssetId: '',
                        licenseId: '',
                        version: '',
                        installationPath: '',
                        notes: ''
                      })
                      setShowSoftwareModal(false)
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!installationForm.softwareAssetId || availableSoftware.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Install Software
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Software Uninstall Modal */}
        {showUninstallModal && selectedInstallation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Uninstall Software: {selectedInstallation.softwareAsset.name}
                </h3>
              </div>
              
              <form onSubmit={handleUninstallSoftware} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Uninstall Reason/Notes
                  </label>
                  <textarea
                    name="notes"
                    value={installationForm.notes}
                    onChange={(e) => setInstallationForm({...installationForm, notes: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Optional reason for uninstalling this software"
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Uninstall Warning
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>This will remove the software from this asset and free up the license for other installations. This action cannot be undone.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUninstallModal(false)
                      setSelectedInstallation(null)
                      setInstallationForm({
                        softwareAssetId: '',
                        licenseId: '',
                        version: '',
                        installationPath: '',
                        notes: ''
                      })
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Uninstall Software
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