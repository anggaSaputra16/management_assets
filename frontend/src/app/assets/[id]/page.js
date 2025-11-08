'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { useAssetStore } from '@/stores'
import { useAssetComponentStore } from '@/stores/assetComponentStore'
import { useAssetSpecificationStore } from '@/stores/assetSpecificationStore'
import { useEnumStore } from '@/stores'
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
  AVAILABLE: 'bg-white/60 text-[#111]',
  IN_USE: 'bg-white/60 text-[#111]',
  MAINTENANCE: 'bg-white/60 text-[#111]',
  RETIRED: 'bg-gray-100 text-[#111]',
  DISPOSED: 'bg-white/60 text-[#111]'
}

const conditionColors = {
  Excellent: 'bg-white/60 text-[#111]',
  Good: 'bg-white/60 text-[#111]',
  Fair: 'bg-white/60 text-[#111]',
  Poor: 'bg-white/60 text-[#111]',
  Damaged: 'bg-white/60 text-[#111]'
}

const componentStatusColors = {
  ACTIVE: 'bg-white/60 text-[#111]',
  INACTIVE: 'bg-gray-100 text-[#111]',
  TRANSFERRED: 'bg-white/60 text-[#111]',
  DAMAGED: 'bg-white/60 text-[#111]',
  REPLACED: 'bg-white/60 text-[#111]'
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
  // All assets list (used for transfer target dropdown when user requests "show all assets")
  const [allAssets, setAllAssets] = useState([])
  const [allAssetsLoading, setAllAssetsLoading] = useState(false)
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

  const {
    transferReasons,
    maintenanceTypes,
    specificationCategories
  } = useEnumStore()

  // Fetch software installed/available for this asset
  const fetchAssetSoftware = useCallback(async () => {
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
  }, [params.id, showToast])

  useEffect(() => {
    if (params.id) {
      fetchAsset(params.id)
      fetchComponents(params.id)
      fetchSpecifications(params.id)
      fetchAssetSoftware()
    }
  }, [params.id, fetchAsset, fetchComponents, fetchSpecifications, fetchAssetSoftware])

  // Software management functions

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
    // Fetch ALL assets to populate the target list (show all assets per request)
    try {
      setAllAssetsLoading(true)
      const res = await (await import('@/lib/services/assetService')).assetService.getAllAssets({ limit: 1000 })
      setAllAssets(res.data || [])
    } catch (error) {
      console.error('Failed to load assets for transfer:', error)
      showToast('Failed to load assets for transfer', 'error')
    } finally {
      setAllAssetsLoading(false)
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
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black/10"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!currentAsset) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-[#111]">Asset Not Found</h2>
          <p className="text-[#333]">The asset you&apos;re looking for doesn&apos;t exist.</p>
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
              className="p-2 hover:bg-white/40 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[#111]">{currentAsset.name}</h1>
              <p className="text-[#333]">Asset Tag: {currentAsset.assetTag}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push(`/assets/${currentAsset.id}/qr-code`)}
              className="flex items-center px-4 py-2 glass-button text-white rounded-lg hover:bg-purple-700"
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
              className="flex items-center px-4 py-2 glass-button text-white rounded-lg hover:scale-105 transition-transform"
            >
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Transfer
            </button>
            <button
              onClick={() => router.push(`/assets/depreciation?assetId=${currentAsset.id}`)}
              className="flex items-center px-4 py-2 glass-button text-white rounded-lg hover:bg-orange-700"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLineJoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
              Depreciation
            </button>
            <button
              onClick={() => router.push(`/assets/${currentAsset.id}/edit`)}
              className="flex items-center px-4 py-2 glass-button text-white rounded-lg hover:scale-105 transition-transform"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Asset
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center px-4 py-2 glass-button text-white rounded-lg hover:scale-105 transition-transform"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-black/10">
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
                    ? 'border-black/10 text-[#111]'
                    : 'border-transparent text-[#333] hover:text-[#111] hover:border-black/10'
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
              <h3 className="text-lg font-medium text-[#111] mb-4">Asset Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#333]">Asset Tag</label>
                  <p className="mt-1 text-sm text-[#111]">{currentAsset.assetTag}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333]">Name</label>
                  <p className="mt-1 text-sm text-[#111]">{currentAsset.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333]">Category</label>
                  <p className="mt-1 text-sm text-[#111]">{currentAsset.category?.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333]">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[currentAsset.status]}`}>
                    {currentAsset.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333]">Condition</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${conditionColors[currentAsset.condition] || 'bg-gray-100 text-[#111]'}`}>
                    {currentAsset.condition || 'Not specified'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333]">Serial Number</label>
                  <p className="mt-1 text-sm text-[#111]">{currentAsset.serialNumber || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333]">Model</label>
                  <p className="mt-1 text-sm text-[#111]">{currentAsset.model || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#333]">Brand</label>
                  <p className="mt-1 text-sm text-[#111]">{currentAsset.brand || 'N/A'}</p>
                </div>
              </div>
              
              {currentAsset.description && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-[#333]">Description</label>
                  <p className="mt-1 text-sm text-[#111]">{currentAsset.description}</p>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="space-y-6">
              {/* Purchase Info */}
              <div className="glass-card shadow p-6">
                <h3 className="text-lg font-medium text-[#111] mb-4">Purchase Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-[#333]">Purchase Date</label>
                    <p className="mt-1 text-sm text-[#111]">
                      {currentAsset.purchaseDate ? new Date(currentAsset.purchaseDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#333]">Purchase Price</label>
                    <p className="mt-1 text-sm text-[#111]">
                      {currentAsset.purchasePrice ? `$${parseFloat(currentAsset.purchasePrice).toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#333]">Current Value</label>
                    <p className="mt-1 text-sm text-[#111]">
                      {currentAsset.currentValue ? `$${parseFloat(currentAsset.currentValue).toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#333]">Warranty Expiry</label>
                    <p className="mt-1 text-sm text-[#111]">
                      {currentAsset.warrantyExpiry ? new Date(currentAsset.warrantyExpiry).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Location Info */}
              <div className="glass-card shadow p-6">
                <h3 className="text-lg font-medium text-[#111] mb-4">Location & Assignment</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-[#333]">Location</label>
                    <p className="mt-1 text-sm text-[#111]">{currentAsset.location?.name || 'Not assigned'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#333]">Department</label>
                    <p className="mt-1 text-sm text-[#111]">{currentAsset.department?.name || 'Not assigned'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#333]">Assigned To</label>
                    <p className="mt-1 text-sm text-[#111]">
                      {currentAsset.assignedTo ? `${currentAsset.assignedTo.firstName} ${currentAsset.assignedTo.lastName}` : 'Not assigned'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#333]">Vendor</label>
                    <p className="mt-1 text-sm text-[#111]">{currentAsset.vendor?.name || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'components' && (
          <div className="glass-card shadow">
            <div className="px-6 py-4 border-b border-black/10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-[#111]">Asset Components</h3>
                <button
                  onClick={() => {
                    resetComponentForm()
                    setShowComponentModal(true)
                  }}
                  className="flex items-center px-4 py-2 glass-button text-white rounded-lg hover:scale-105 transition-transform"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Component
                </button>
              </div>
            </div>

            <div className="p-6">
              {componentsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black/10 mx-auto"></div>
                </div>
              ) : components.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {components.map((component) => (
                    <div key={component.id} className="border border-black/10 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-[#111]">{component.name}</h4>
                          {component.description && (
                            <p className="text-sm text-[#333] mt-1">{component.description}</p>
                          )}
                          <div className="mt-2 space-y-1">
                            {component.partNumber && (
                              <p className="text-xs text-[#333]">Part #: {component.partNumber}</p>
                            )}
                            {component.serialNumber && (
                              <p className="text-xs text-[#333]">Serial: {component.serialNumber}</p>
                            )}
                            {component.brand && (
                              <p className="text-xs text-[#333]">Brand: {component.brand}</p>
                            )}
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${componentStatusColors[component.status]}`}>
                              {component.status}
                            </span>
                            {component.sourcePart && component.sourcePart.id && (
                              <div className="mt-2">
                                <button
                                  onClick={() => router.push(`/master/spare-parts/${component.sourcePart.id}`)}
                                  className="text-sm text-[#111] hover:underline"
                                >
                                  View Source Part: {component.sourcePart.partNumber || component.sourcePart.name}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          <button
                            onClick={() => setEditingComponent(component)}
                            className="p-1 text-[#333] hover:scale-110 transition-transform"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {component.isTransferable && (
                            <button
                              onClick={() => handleTransferModalOpen(component)}
                              className="p-1 text-[#333] hover:scale-110 transition-transform"
                            >
                              <ArrowRightLeft className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedComponent(component)
                              setShowMaintenanceModal(true)
                            }}
                            className="p-1 text-[#333] hover:scale-110 transition-transform"
                          >
                            <Wrench className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleComponentDelete(component)}
                            className="p-1 text-[#333] hover:scale-110 transition-transform"
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
                  <Package className="mx-auto h-12 w-12 text-[#333]" />
                  <h3 className="mt-2 text-sm font-medium text-[#111]">No components</h3>
                  <p className="mt-1 text-sm text-[#333]">Get started by adding a component to this asset.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'software' && (
          <div className="glass-card shadow">
            <div className="px-6 py-4 border-b border-black/10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-[#111]">Installed Software</h3>
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
                  className="flex items-center px-4 py-2 glass-button text-white rounded-lg hover:scale-105 transition-transform"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Install Software
                </button>
              </div>
            </div>

            <div className="p-6">
              {softwareLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black/10 mx-auto"></div>
                </div>
              ) : installedSoftware.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {installedSoftware.map((installation) => (
                    <div key={installation.id} className="border border-black/10 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-[#111]">{installation.softwareAsset.name}</h4>
                          <p className="text-sm text-[#333] mt-1">
                            Version: {installation.version || installation.softwareAsset.version || 'Not specified'}
                          </p>
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-[#333]">
                              Type: {installation.softwareAsset.softwareType || 'Not specified'}
                            </p>
                            {installation.softwareAsset.publisher && (
                              <p className="text-xs text-[#333]">
                                Publisher: {installation.softwareAsset.publisher}
                              </p>
                            )}
                            {installation.installationPath && (
                              <p className="text-xs text-[#333]">
                                Path: {installation.installationPath}
                              </p>
                            )}
                            {installation.license && (
                              <div className="flex items-center space-x-1">
                                <span className="inline-flex px-2 py-1 text-xs font-medium bg-white/60 text-[#111] rounded-full">
                                  Licensed
                                </span>
                                {installation.license.expiryDate && (
                                  <span className="text-xs text-[#333]">
                                    Expires: {new Date(installation.license.expiryDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            )}
                            <p className="text-xs text-[#333]">
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
                            className="p-1 text-[#333] hover:scale-110 transition-transform"
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
                  <Monitor className="mx-auto h-12 w-12 text-[#333]" />
                  <h3 className="mt-2 text-sm font-medium text-[#111]">No software installed</h3>
                  <p className="mt-1 text-sm text-[#333]">Get started by installing software on this asset.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'specifications' && (
          <div className="glass-card shadow">
            <div className="px-6 py-4 border-b border-black/10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-[#111]">Asset Specifications</h3>
                <button
                  onClick={() => {
                    resetSpecForm()
                    setShowSpecModal(true)
                  }}
                  className="flex items-center px-4 py-2 glass-button text-white rounded-lg hover:scale-105 transition-transform"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Specification
                </button>
              </div>
            </div>

            <div className="p-6">
              {specsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black/10 mx-auto"></div>
                </div>
              ) : Object.keys(groupedSpecs).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(groupedSpecs).map(([category, specs]) => (
                    <div key={category}>
                      <h4 className="font-medium text-[#111] mb-3">{category}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {specs.map((spec) => (
                          <div key={spec.id} className="border border-black/10 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center">
                                  <h5 className="font-medium text-[#111]">{spec.name}</h5>
                                  {spec.isCore && (
                                    <span className="ml-2 inline-flex px-2 py-1 text-xs font-medium bg-white/60 text-[#111] rounded-full">
                                      Core
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-[#333] mt-1">
                                  {spec.value} {spec.unit && <span className="text-[#333]">{spec.unit}</span>}
                                </p>
                              </div>
                              <div className="flex items-center space-x-1 ml-2">
                                <button
                                  onClick={() => setEditingSpecification(spec)}
                                  className="p-1 text-[#333] hover:scale-110 transition-transform"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleSpecDelete(spec)}
                                  className="p-1 text-[#333] hover:scale-110 transition-transform"
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
                  <Settings className="mx-auto h-12 w-12 text-[#333]" />
                  <h3 className="mt-2 text-sm font-medium text-[#111]">No specifications</h3>
                  <p className="mt-1 text-sm text-[#333]">Get started by adding specifications to this asset.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="glass-card shadow">
            <div className="px-6 py-4 border-b border-black/10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-[#111]">Asset Maintenance Records</h3>
                <button
                  onClick={() => {
                    setSelectedComponent({ id: 'asset', name: currentAsset.name })
                    setShowMaintenanceModal(true)
                  }}
                  className="flex items-center px-4 py-2 glass-button text-white rounded-lg hover:scale-105 transition-transform"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Maintenance
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Mock maintenance records for now */}
              <div className="space-y-4">
                <div className="border border-black/10 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <Wrench className="h-5 w-5 text-[#111] mr-2" />
                        <h4 className="font-medium text-[#111]">Preventive Maintenance</h4>
                        <span className="ml-2 inline-flex px-2 py-1 text-xs font-medium bg-white/60 text-[#111] rounded-full">
                          Completed
                        </span>
                      </div>
                      <p className="text-sm text-[#333] mt-1">Regular system cleaning and component inspection</p>
                      <div className="mt-2 text-xs text-[#333]">
                        <span>Performed by: John Technician</span> • 
                        <span className="ml-1">Date: {new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span> • 
                        <span className="ml-1">Cost: $150.00</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border border-black/10 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <Wrench className="h-5 w-5 text-[#111] mr-2" />
                        <h4 className="font-medium text-[#111]">Hardware Upgrade</h4>
                        <span className="ml-2 inline-flex px-2 py-1 text-xs font-medium bg-white/60 text-[#111] rounded-full">
                          Scheduled
                        </span>
                      </div>
                      <p className="text-sm text-[#333] mt-1">RAM upgrade from 16GB to 32GB</p>
                      <div className="mt-2 text-xs text-[#333]">
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
                <Wrench className="mx-auto h-12 w-12 text-[#333]" />
                <h3 className="mt-2 text-sm font-medium text-[#111]">No maintenance records</h3>
                <p className="mt-1 text-sm text-[#333]">Get started by adding a maintenance record for this asset.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="glass-card shadow">
            <div className="px-6 py-4 border-b border-black/10">
              <h3 className="text-lg font-medium text-[#111]">Asset History & Audit Trail</h3>
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
                            <span className="h-8 w-8 rounded-full glass-button flex items-center justify-center ring-8 ring-white">
                              <CheckCircle2 className="h-5 w-5 text-white" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-[#333]">
                                Component <span className="font-medium text-[#111]">RAM Module DDR4-3200</span> added to asset
                              </p>
                              <p className="text-xs text-[#333] mt-1">Added by System Admin</p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-[#333]">
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
                            <span className="h-8 w-8 rounded-full glass-button flex items-center justify-center ring-8 ring-white">
                              <ArrowRightLeft className="h-4 w-4 text-white" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-[#333]">
                                Asset transferred from <span className="font-medium text-[#111]">IT Department</span> to <span className="font-medium text-[#111]">Finance Department</span>
                              </p>
                              <p className="text-xs text-[#333] mt-1">Transferred by John Manager</p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-[#333]">
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
                            <span className="h-8 w-8 rounded-full glass-button flex items-center justify-center ring-8 ring-white">
                              <Wrench className="h-4 w-4 text-white" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-[#333]">
                                Maintenance completed: <span className="font-medium text-[#111]">System optimization and cleaning</span>
                              </p>
                              <p className="text-xs text-[#333] mt-1">Performed by Technical Team</p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-[#333]">
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
                            <span className="h-8 w-8 rounded-full glass-button flex items-center justify-center ring-8 ring-white">
                              <User className="h-4 w-4 text-white" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-[#333]">
                                Asset assigned to <span className="font-medium text-[#111]">Sarah Johnson</span>
                              </p>
                              <p className="text-xs text-[#333] mt-1">Assigned by Asset Administrator</p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-[#333]">
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
                              <p className="text-sm text-[#333]">
                                Asset <span className="font-medium text-[#111]">{currentAsset.name}</span> created in the system
                              </p>
                              <p className="text-xs text-[#333] mt-1">Created by System Administrator</p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-[#333]">
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
                <History className="mx-auto h-12 w-12 text-[#333]" />
                <h3 className="mt-2 text-sm font-medium text-[#111]">No history available</h3>
                <p className="mt-1 text-sm text-[#333]">Asset history will appear here as actions are performed.</p>
              </div>
            </div>
          </div>
        )}

        {/* Component Modal */}
        {showComponentModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="glass-card shadow-2xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
              <div className="px-6 py-4 border-b border-black/10">
                <h3 className="text-lg font-medium text-[#111]">
                  {editingComponent ? 'Edit Component' : 'Add New Component'}
                </h3>
              </div>
              
              <form onSubmit={handleComponentSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-1">
                      Component Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={componentForm.name}
                      onChange={handleComponentInputChange}
                      required
                      className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30"
                      placeholder="e.g., RAM Module, CPU, Hard Drive"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-1">
                      Part Number
                    </label>
                    <input
                      type="text"
                      name="partNumber"
                      value={componentForm.partNumber}
                      onChange={handleComponentInputChange}
                      className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30"
                      placeholder="Manufacturer part number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-1">
                      Serial Number
                    </label>
                    <input
                      type="text"
                      name="serialNumber"
                      value={componentForm.serialNumber}
                      onChange={handleComponentInputChange}
                      className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30"
                      placeholder="Component serial number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-1">
                      Brand
                    </label>
                    <input
                      type="text"
                      name="brand"
                      value={componentForm.brand}
                      onChange={handleComponentInputChange}
                      className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30"
                      placeholder="Component brand"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-1">
                      Model
                    </label>
                    <input
                      type="text"
                      name="model"
                      value={componentForm.model}
                      onChange={handleComponentInputChange}
                      className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30"
                      placeholder="Component model"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-1">
                      Purchase Date
                    </label>
                    <input
                      type="date"
                      name="purchaseDate"
                      value={componentForm.purchaseDate}
                      onChange={handleComponentInputChange}
                      className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-1">
                      Purchase Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="purchasePrice"
                      value={componentForm.purchasePrice}
                      onChange={handleComponentInputChange}
                      className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-1">
                      Warranty Expiry
                    </label>
                    <input
                      type="date"
                      name="warrantyExpiry"
                      value={componentForm.warrantyExpiry}
                      onChange={handleComponentInputChange}
                      className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#111] mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={componentForm.description}
                    onChange={handleComponentInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30"
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
                      className="h-4 w-4 text-[#111] focus:ring-black/20 border-black/10 rounded"
                    />
                    <label htmlFor="isReplaceable" className="ml-2 block text-sm text-[#111]">
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
                      className="h-4 w-4 text-[#111] focus:ring-black/20 border-black/10 rounded"
                    />
                    <label htmlFor="isTransferable" className="ml-2 block text-sm text-[#111]">
                      Component is transferable
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#111] mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={componentForm.notes}
                    onChange={handleComponentInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30"
                    placeholder="Additional notes"
                  />
                </div>

                <div className="flex items-center justify-end space-x-4 pt-4 border-t border-black/10">
                  <button
                    type="button"
                    onClick={() => {
                      resetComponentForm()
                      setShowComponentModal(false)
                    }}
                    className="px-4 py-2 text-[#111] bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 glass-button text-white rounded-lg hover:scale-105 transition-transform"
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="glass-card shadow-2xl max-w-lg w-full mx-4">
              <div className="px-6 py-4 border-b border-black/10">
                <h3 className="text-lg font-medium text-[#111]">
                  {editingSpecification ? 'Edit Specification' : 'Add New Specification'}
                </h3>
              </div>
              
              <form onSubmit={handleSpecSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#111] mb-1">
                    Specification Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={specForm.name}
                    onChange={handleSpecInputChange}
                    required
                    className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30"
                    placeholder="e.g., CPU, RAM, Storage"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#111] mb-1">
                    Value *
                  </label>
                  <input
                    type="text"
                    name="value"
                    value={specForm.value}
                    onChange={handleSpecInputChange}
                    required
                    className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30"
                    placeholder="e.g., Intel i7-10700K, 16GB, 1TB SSD"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-1">
                      Unit
                    </label>
                    <input
                      type="text"
                      name="unit"
                      value={specForm.unit}
                      onChange={handleSpecInputChange}
                      className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30"
                      placeholder="e.g., GB, MHz, inches"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-1">
                      Category
                    </label>
                    <select
                      name="category"
                      value={specForm.category}
                      onChange={handleSpecInputChange}
                      className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30"
                    >
                      <option value="">Select category</option>
                      {specificationCategories.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
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
                    className="h-4 w-4 text-[#111] focus:ring-black/20 border-black/10 rounded"
                  />
                  <label htmlFor="isCore" className="ml-2 block text-sm text-[#111]">
                    Core specification
                  </label>
                </div>

                <div className="flex items-center justify-end space-x-4 pt-4 border-t border-black/10">
                  <button
                    type="button"
                    onClick={() => {
                      resetSpecForm()
                      setShowSpecModal(false)
                    }}
                    className="px-4 py-2 text-[#111] bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 glass-button text-white rounded-lg hover:scale-105 transition-transform"
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="glass-card shadow-2xl max-w-lg w-full mx-4">
              <div className="px-6 py-4 border-b border-black/10">
                <h3 className="text-lg font-medium text-[#111]">
                  Transfer Component: {selectedComponent.name}
                </h3>
              </div>
              
              <form onSubmit={handleComponentTransfer} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#111] mb-1">
                    Target Asset *
                  </label>
                  <select
                    name="toAssetId"
                    value={transferData.toAssetId}
                    onChange={(e) => setTransferData({...transferData, toAssetId: e.target.value})}
                    required
                    disabled={allAssetsLoading}
                    className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30 disabled:opacity-50"
                  >
                    <option value="">
                      {allAssetsLoading ? 'Loading assets...' : 'Select target asset'}
                    </option>
                    {allAssets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name} ({asset.assetTag})
                        {asset.category?.name && ` - ${asset.category.name}`}
                        {asset.location?.name && ` | ${asset.location.name}`}
                      </option>
                    ))}
                    {allAssets.length === 0 && !allAssetsLoading && (
                      <option value="" disabled>No assets found</option>
                    )}
                  </select>
                  {!allAssetsLoading && allAssets.length === 0 && (
                    <p className="mt-1 text-sm text-[#333]">
                      No assets found to transfer to.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#111] mb-1">
                    Transfer Reason *
                  </label>
                  <select
                    name="reason"
                    value={transferData.reason}
                    onChange={(e) => setTransferData({...transferData, reason: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30"
                  >
                    <option value="">Select reason</option>
                    {transferReasons.map((reason) => (
                      <option key={reason.value} value={reason.value}>
                        {reason.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#111] mb-1">
                    Transfer Notes
                  </label>
                  <textarea
                    name="notes"
                    value={transferData.notes}
                    onChange={(e) => setTransferData({...transferData, notes: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30"
                    placeholder="Additional notes for the transfer"
                  />
                </div>

                <div className="bg-white/60 border border-black/10 rounded-lg p-3">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-[#111] mt-0.5" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-[#111]">
                        Transfer Warning
                      </h3>
                      <div className="mt-2 text-sm text-[#111]">
                        <p>This component will be removed from the current asset and added to the target asset. This action cannot be undone.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-4 pt-4 border-t border-black/10">
                  <button
                    type="button"
                    onClick={() => {
                      resetTransferForm()
                      setShowTransferModal(false)
                      setSelectedComponent(null)
                    }}
                    className="px-4 py-2 text-[#111] bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 glass-button text-white rounded-lg hover:scale-105 transition-transform"
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="glass-card shadow-2xl max-w-lg w-full mx-4">
              <div className="px-6 py-4 border-b border-black/10">
                <h3 className="text-lg font-medium text-[#111]">
                  Add Maintenance Record: {selectedComponent.name}
                </h3>
              </div>
              
              <form onSubmit={handleComponentMaintenance} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#111] mb-1">
                    Maintenance Type *
                  </label>
                  <select
                    name="maintenanceType"
                    value={maintenanceData.maintenanceType}
                    onChange={(e) => setMaintenanceData({...maintenanceData, maintenanceType: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30"
                  >
                    <option value="">Select maintenance type</option>
                    {maintenanceTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#111] mb-1">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={maintenanceData.description}
                    onChange={(e) => setMaintenanceData({...maintenanceData, description: e.target.value})}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30"
                    placeholder="Describe the maintenance performed"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-1">
                      Maintenance Date
                    </label>
                    <input
                      type="date"
                      name="maintenanceDate"
                      value={maintenanceData.maintenanceDate}
                      onChange={(e) => setMaintenanceData({...maintenanceData, maintenanceDate: e.target.value})}
                      className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-1">
                      Cost
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="cost"
                      value={maintenanceData.cost}
                      onChange={(e) => setMaintenanceData({...maintenanceData, cost: e.target.value})}
                      className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#111] mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    name="notes"
                    value={maintenanceData.notes}
                    onChange={(e) => setMaintenanceData({...maintenanceData, notes: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30"
                    placeholder="Additional maintenance notes"
                  />
                </div>

                <div className="bg-white/60 border border-black/10 rounded-lg p-3">
                  <div className="flex">
                    <Info className="h-5 w-5 text-[#111] mt-0.5" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-[#111]">
                        Maintenance Record
                      </h3>
                      <div className="mt-2 text-sm text-[#111]">
                        <p>This maintenance record will be added to the component&apos;s history for tracking and warranty purposes.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-4 pt-4 border-t border-black/10">
                  <button
                    type="button"
                    onClick={() => {
                      resetMaintenanceForm()
                      setShowMaintenanceModal(false)
                      setSelectedComponent(null)
                    }}
                    className="px-4 py-2 text-[#111] bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 glass-button text-white rounded-lg hover:scale-105 transition-transform"
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="glass-card shadow-2xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
              <div className="px-6 py-4 border-b border-black/10">
                <h3 className="text-lg font-medium text-[#111]">Install Software</h3>
              </div>
              
              <form onSubmit={handleInstallSoftware} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#111] mb-1">
                    Software *
                  </label>
                  <select
                    name="softwareAssetId"
                    value={installationForm.softwareAssetId}
                    onChange={(e) => setInstallationForm({...installationForm, softwareAssetId: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30"
                  >
                    <option value="">Select software to install</option>
                    {availableSoftware.map((software) => (
                      <option key={software.id} value={software.id}>
                        {software.name} - {software.availableLicenses} licenses available
                      </option>
                    ))}
                  </select>
                  {availableSoftware.length === 0 && (
                    <p className="mt-1 text-sm text-[#333]">
                      No software with available licenses found.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-1">
                      Version
                    </label>
                    <input
                      type="text"
                      name="version"
                      value={installationForm.version}
                      onChange={(e) => setInstallationForm({...installationForm, version: e.target.value})}
                      className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30"
                      placeholder="Version (optional)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#111] mb-1">
                      Installation Path
                    </label>
                    <input
                      type="text"
                      name="installationPath"
                      value={installationForm.installationPath}
                      onChange={(e) => setInstallationForm({...installationForm, installationPath: e.target.value})}
                      className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30"
                      placeholder="Installation path (optional)"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#111] mb-1">
                    Installation Notes
                  </label>
                  <textarea
                    name="notes"
                    value={installationForm.notes}
                    onChange={(e) => setInstallationForm({...installationForm, notes: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30"
                    placeholder="Optional installation notes"
                  />
                </div>

                <div className="bg-white/60 border border-black/10 rounded-lg p-3">
                  <div className="flex">
                    <Info className="h-5 w-5 text-[#111] mt-0.5" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-[#111]">
                        License Usage
                      </h3>
                      <div className="mt-2 text-sm text-[#111]">
                        <p>Installing this software will consume one license. Make sure you have available licenses before proceeding.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-4 pt-4 border-t border-black/10">
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
                    className="px-4 py-2 text-[#111] bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!installationForm.softwareAssetId || availableSoftware.length === 0}
                    className="px-4 py-2 glass-button text-white rounded-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="glass-card shadow-2xl max-w-lg w-full mx-4">
              <div className="px-6 py-4 border-b border-black/10">
                <h3 className="text-lg font-medium text-[#111]">
                  Uninstall Software: {selectedInstallation.softwareAsset.name}
                </h3>
              </div>
              
              <form onSubmit={handleUninstallSoftware} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#111] mb-1">
                    Uninstall Reason/Notes
                  </label>
                  <textarea
                    name="notes"
                    value={installationForm.notes}
                    onChange={(e) => setInstallationForm({...installationForm, notes: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-black/10 rounded-lg focus:ring-2 focus:ring-black/20 focus:border-black/30"
                    placeholder="Optional reason for uninstalling this software"
                  />
                </div>

                <div className="bg-white/60 border border-black/10 rounded-lg p-3">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-[#111] mt-0.5" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-[#111]">
                        Uninstall Warning
                      </h3>
                      <div className="mt-2 text-sm text-[#111]">
                        <p>This will remove the software from this asset and free up the license for other installations. This action cannot be undone.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-4 pt-4 border-t border-black/10">
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
                    className="px-4 py-2 text-[#111] bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 glass-button text-white rounded-lg hover:scale-105 transition-transform"
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