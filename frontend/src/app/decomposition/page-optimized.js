'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { decompositionService } from '@/lib/services/decompositionService'
import { assetService } from '@/lib/services/assetService'
import { categoryService } from '@/lib/services/categoryService'
import { useToast } from '@/contexts/ToastContext'
import useOptimizedEnumStore from '@/stores/optimizedEnumStore'
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Play,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'

const statusColors = {
  PLANNED: 'bg-blue-100 text-blue-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-orange-100 text-orange-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800'
}

const statusIcons = {
  PLANNED: Clock,
  PENDING: Clock,
  IN_PROGRESS: AlertTriangle,
  COMPLETED: CheckCircle,
  CANCELLED: XCircle
}

export default function DecompositionPage() {
  const router = useRouter()
  const { showSuccess, showError } = useToast()
  const enumStore = useOptimizedEnumStore()
  
  // State management with better separation
  const [decompositions, setDecompositions] = useState([])
  const [assets, setAssets] = useState([])
  const [categories, setCategories] = useState([])
  
  // Loading states - separated for better UX
  const [loadingStates, setLoadingStates] = useState({
    decompositions: true,
    assets: false,
    categories: false,
    enums: false
  })
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingDecomposition, setEditingDecomposition] = useState(null)
  
  // Form data state
  const [formData, setFormData] = useState({
    sourceAssetId: '',
    targetAssetId: '',
    reason: '',
    description: '',
    plannedDate: '',
    notes: '',
    items: [],
    postStatus: 'RETIRED'
  })

  // Refs for performance optimization
  const searchTimeoutRef = useRef(null)
  const abortControllerRef = useRef(null)

  // Optimized fetchData function with abort controller
  const fetchDecompositions = useCallback(async (searchParams = {}) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController()
    
    console.debug('[DecompositionPage] fetchDecompositions start', searchParams)
    
    setLoadingStates(prev => ({ ...prev, decompositions: true }))
    
    try {
      const response = await decompositionService.getAllDecompositions({
        search: searchParams.search || searchTerm,
        status: searchParams.status || statusFilter,
        page: 1,
        limit: 50, // Reasonable limit
        signal: abortControllerRef.current.signal
      })
      
      if (!abortControllerRef.current.signal.aborted) {
        setDecompositions(response.data || [])
        console.info('[DecompositionPage] Loaded decompositions:', (response.data || []).length)
      }
      
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('[DecompositionPage] fetchDecompositions error', err)
        showError(err?.message || 'Failed to fetch decompositions')
      }
    } finally {
      if (!abortControllerRef.current.signal.aborted) {
        setLoadingStates(prev => ({ ...prev, decompositions: false }))
      }
    }
  }, [searchTerm, statusFilter, showError])

  // Optimized categories fetch
  const fetchCategories = useCallback(async () => {
    if (categories.length > 0) {
      console.debug('[DecompositionPage] Categories already loaded, skipping...')
      return
    }

    setLoadingStates(prev => ({ ...prev, categories: true }))
    
    try {
      const response = await categoryService.getAllCategories()
      const catPayload = response.data?.data?.categories || response.data?.categories || response.data || response.categories || []
      setCategories(Array.isArray(catPayload) ? catPayload : [])
      console.debug('[DecompositionPage] Categories loaded:', Array.isArray(catPayload) ? catPayload.length : 0)
    } catch (err) {
      console.error('[DecompositionPage] fetchCategories error', err)
      showError('Failed to load categories')
    } finally {
      setLoadingStates(prev => ({ ...prev, categories: false }))
    }
  }, [categories.length, showError])

  // Lazy load assets only when modal opens
  const fetchModalAssets = useCallback(async () => {
    if (loadingStates.assets || assets.length > 0) return

    setLoadingStates(prev => ({ ...prev, assets: true }))
    
    try {
      console.debug('[DecompositionPage] Loading modal assets...')
      const response = await assetService.getAllAssets({ 
        status: 'AVAILABLE', 
        limit: 200, // Reasonable limit
        page: 1
      })
      setAssets(response.data || [])
      console.info('[DecompositionPage] Modal assets loaded:', (response.data || []).length)
    } catch (err) {
      console.error('[DecompositionPage] fetchModalAssets error', err)
      showError('Failed to load assets')
    } finally {
      setLoadingStates(prev => ({ ...prev, assets: false }))
    }
  }, [loadingStates.assets, assets.length, showError])

  // Initialize data on component mount
  useEffect(() => {
    const initializeData = async () => {
      console.debug('[DecompositionPage] Initializing...')
      
      setLoadingStates(prev => ({ ...prev, enums: true }))
      
      try {
        // Initialize optimized enums (only 5 API calls instead of 27)
        await enumStore.initializeDecompositionEnums()
        
        // Load initial data in parallel
        await Promise.allSettled([
          fetchDecompositions(),
          fetchCategories()
        ])
        
        console.debug('[DecompositionPage] Initialization complete')
        
      } catch (error) {
        console.error('[DecompositionPage] Initialization failed:', error)
        showError('Failed to initialize data')
      } finally {
        setLoadingStates(prev => ({ ...prev, enums: false }))
      }
    }
    
    initializeData()
  }, [enumStore, fetchDecompositions, fetchCategories, showError]) // Include all dependencies

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchDecompositions({ search: searchTerm, status: statusFilter })
    }, 500) // Reduced debounce time

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchTerm, statusFilter, fetchDecompositions])

  // Modal open effect - lazy load assets
  useEffect(() => {
    if (showModal && assets.length === 0) {
      fetchModalAssets()
    }
  }, [showModal, fetchModalAssets, assets.length])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  // Immediate search handler
  const handleSearch = useCallback(() => {
    fetchDecompositions({ search: searchTerm, status: statusFilter })
  }, [searchTerm, statusFilter, fetchDecompositions])

  // Form handlers
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (loadingStates.assets) {
      showError('Please wait for assets to load')
      return
    }

    try {
      console.debug('[DecompositionPage] Submitting form...')
      
      // Validate source asset
      const src = assets.find(a => a.id === formData.sourceAssetId)
      if (!src) {
        showError('Please select a valid source asset')
        return
      }
      
      if ((src.status || '').toUpperCase() !== 'AVAILABLE') {
        showError('Source asset must be AVAILABLE to create decomposition plan')
        return
      }

      const payload = {
        sourceAssetId: formData.sourceAssetId,
        title: formData.reason || '',
        description: formData.description || formData.notes || '',
        plannedDate: formData.plannedDate || null,
        items: (formData.items || []).map(it => ({
          name: it.componentName || it.name || '',
          description: it.componentDetails || it.description || '',
          quantity: it.quantity || 1,
          category: it.category || 'HARDWARE'
        }))
      }

      if (editingDecomposition) {
        await decompositionService.updateDecomposition(editingDecomposition.id, payload)
        showSuccess('Decomposition updated successfully')
      } else {
        await decompositionService.createDecomposition(payload)
        showSuccess('Decomposition plan created successfully')
      }
      
      resetForm()
      fetchDecompositions()
      
    } catch (err) {
      console.error('[DecompositionPage] Submit error:', err)
      showError(err.message || 'Failed to save decomposition')
    }
  }

  const handleExecute = async (decomposition) => {
    if (!window.confirm('Are you sure you want to execute this decomposition? This action cannot be undone.')) {
      return
    }

    try {
      await decompositionService.executeDecomposition(decomposition.id, { postStatus: 'RETIRED' })
      showSuccess('Decomposition executed successfully')
      fetchDecompositions()
    } catch (err) {
      console.error('[DecompositionPage] Execute error:', err)
      showError(err.message || 'Failed to execute decomposition')
    }
  }

  const handleDelete = async (decomposition) => {
    if (!window.confirm('Are you sure you want to delete this decomposition plan?')) {
      return
    }

    try {
      await decompositionService.deleteDecomposition(decomposition.id)
      showSuccess('Decomposition deleted successfully')
      fetchDecompositions()
    } catch (err) {
      console.error('[DecompositionPage] Delete error:', err)
      showError(err.message || 'Failed to delete decomposition')
    }
  }

  const handleEdit = (decomposition) => {
    setEditingDecomposition(decomposition)
    
    const mappedItems = (decomposition.items || []).map(it => ({
      componentName: it.componentName || it.name || '',
      componentDetails: it.componentDetails || it.description || '',
      quantity: it.quantity || 1,
      condition: it.condition || 'Good',
      action: it.action || 'Store',
      category: it.category || 'HARDWARE',
      targetLocation: it.targetLocation || '',
      notes: it.notes || ''
    }))

    setFormData({
      sourceAssetId: decomposition.sourceAssetId || '',
      targetAssetId: decomposition.targetAssetId || '',
      reason: decomposition.reason || decomposition.title || '',
      description: decomposition.description || '',
      plannedDate: decomposition.plannedDate ? decomposition.plannedDate.split('T')[0] : '',
      notes: decomposition.notes || '',
      items: mappedItems
    })
    
    setShowModal(true)
  }

  const resetForm = useCallback(() => {
    setFormData({
      sourceAssetId: '',
      targetAssetId: '',
      reason: '',
      description: '',
      plannedDate: '',
      notes: '',
      items: []
    })
    setEditingDecomposition(null)
    setShowModal(false)
  }, [])

  // Form data handlers
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }, [])

  const addDecompositionItem = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        componentName: '',
        componentDetails: '',
        quantity: 1,
        condition: enumStore.assetConditions[0]?.value || 'GOOD',
        action: enumStore.decompositionActions[0]?.value || 'RECYCLE',
        category: categories.length > 0 ? (categories[0].id || categories[0]) : 'HARDWARE',
        targetLocation: '',
        notes: ''
      }]
    }))
  }, [enumStore.assetConditions, enumStore.decompositionActions, categories])

  const updateDecompositionItem = useCallback((index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }, [])

  const removeDecompositionItem = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }, [])

  // Memoized filtered data
  const filteredDecompositions = useMemo(() => {
    if (!searchTerm && !statusFilter) return decompositions

    return decompositions.filter(decomposition => {
      const q = searchTerm.toLowerCase()
      const matchesSearch = !q || 
        decomposition.asset?.name?.toLowerCase().includes(q) ||
        decomposition.asset?.assetTag?.toLowerCase().includes(q) ||
        (decomposition.title || decomposition.reason || '').toLowerCase().includes(q)

      const matchesStatus = !statusFilter || decomposition.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [decompositions, searchTerm, statusFilter])

  // Memoized stats
  const decompositionStats = useMemo(() => [
    {
      title: 'Total Plans',
      value: decompositions.length,
      icon: Package,
      color: 'bg-blue-100',
      textColor: 'text-blue-800'
    },
    {
      title: 'Pending',
      value: decompositions.filter(d => d.status === 'PENDING' || d.status === 'PLANNED').length,
      icon: Clock,
      color: 'bg-yellow-100',
      textColor: 'text-yellow-800'
    },
    {
      title: 'In Progress',
      value: decompositions.filter(d => d.status === 'IN_PROGRESS').length,
      icon: AlertTriangle,
      color: 'bg-orange-100',
      textColor: 'text-orange-800'
    },
    {
      title: 'Completed',
      value: decompositions.filter(d => d.status === 'COMPLETED').length,
      icon: CheckCircle,
      color: 'bg-green-100',
      textColor: 'text-green-800'
    }
  ], [decompositions])

  // Check if we're still loading initial data
  const isInitialLoading = loadingStates.decompositions && decompositions.length === 0

  if (isInitialLoading || loadingStates.enums) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-500 mb-4" />
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900">Loading Decomposition Module</p>
            <p className="text-sm text-gray-500 mt-2">
              {loadingStates.enums ? 'Initializing system data...' : 'Loading decomposition plans...'}
            </p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Asset Decomposition</h1>
              <p className="text-gray-600">Manage asset breakdown and component transfers</p>
            </div>
          </div>
          
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Decomposition Plan
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {decompositionStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters and List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Decomposition Plans</h3>
              {loadingStates.decompositions && (
                <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
              )}
            </div>
          </div>
          
          <div className="p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by asset name, tag, or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                {enumStore.requestStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              
              <button
                onClick={handleSearch}
                disabled={loadingStates.decompositions}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                <Filter className="h-4 w-4 mr-2" />
                Search
              </button>
            </div>

            {/* Decomposition List */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source Asset
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Planned Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDecompositions.length > 0 ? (
                    filteredDecompositions.map((decomposition) => {
                      const StatusIcon = statusIcons[decomposition.status] || Package
                      const statusClass = statusColors[decomposition.status] || 'bg-gray-100 text-gray-800'
                      const statusLabel = (decomposition.status || '').replace('_', ' ')
                      
                      return (
                        <tr key={decomposition.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {decomposition.asset?.name || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {decomposition.asset?.assetTag || 'N/A'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {decomposition.title || decomposition.reason || 'N/A'}
                            </div>
                            {decomposition.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {decomposition.description}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusLabel}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {decomposition.plannedDate 
                              ? new Date(decomposition.plannedDate).toLocaleDateString() 
                              : 'Not set'
                            }
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {decomposition.items?.length || 0} items
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => router.push(`/decomposition/${decomposition.id}`)}
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {(decomposition.status === 'PLANNED' || decomposition.status === 'PENDING') && (
                                <>
                                  <button
                                    onClick={() => handleEdit(decomposition)}
                                    className="text-indigo-600 hover:text-indigo-800 transition-colors"
                                    title="Edit"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleExecute(decomposition)}
                                    className="text-green-600 hover:text-green-800 transition-colors"
                                    title="Execute"
                                  >
                                    <Play className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleDelete(decomposition)}
                                className="text-red-600 hover:text-red-800 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <Package className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No decomposition plans found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Get started by creating a decomposition plan.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-screen overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingDecomposition ? 'Edit Decomposition Plan' : 'Create Decomposition Plan'}
                </h3>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Source Asset *
                    </label>
                    <select
                      name="sourceAssetId"
                      value={formData.sourceAssetId}
                      onChange={handleInputChange}
                      required
                      disabled={loadingStates.assets}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">
                        {loadingStates.assets ? 'Loading assets...' : 'Select source asset'}
                      </option>
                      {assets.map(asset => (
                        <option key={asset.id} value={asset.id}>
                          {asset.name} ({asset.assetTag})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason *
                    </label>
                    <select
                      name="reason"
                      value={formData.reason}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select reason</option>
                      {enumStore.decompositionReasons.map(reason => (
                        <option key={reason.value} value={reason.value}>
                          {reason.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Planned Date
                    </label>
                    <input
                      type="date"
                      name="plannedDate"
                      value={formData.plannedDate}
                      onChange={handleInputChange}
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
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe the decomposition plan"
                  />
                </div>

                {/* Decomposition Items */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Decomposition Items
                    </label>
                    <button
                      type="button"
                      onClick={addDecompositionItem}
                      className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Item
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formData.items.map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Component Name
                            </label>
                            <input
                              type="text"
                              value={item.componentName}
                              onChange={(e) => updateDecompositionItem(index, 'componentName', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="e.g., CPU, RAM"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Condition
                            </label>
                            <select
                              value={item.condition}
                              onChange={(e) => updateDecompositionItem(index, 'condition', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            >
                              {enumStore.assetConditions.map(condition => (
                                <option key={condition.value} value={condition.value}>
                                  {condition.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Action
                            </label>
                            <select
                              value={item.action}
                              onChange={(e) => updateDecompositionItem(index, 'action', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            >
                              {enumStore.decompositionActions.map(action => (
                                <option key={action.value} value={action.value}>
                                  {action.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                            <select
                              value={item.category || (categories.length > 0 ? (categories[0].id || categories[0]) : '')}
                              onChange={(e) => updateDecompositionItem(index, 'category', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Select Category</option>
                              {categories.length > 0 ? (
                                categories.map(c => (
                                  <option key={typeof c === 'object' ? c.id : c} value={typeof c === 'object' ? c.id : c}>
                                    {typeof c === 'object' ? c.name : String(c).charAt(0) + String(c).slice(1).toLowerCase()}
                                  </option>
                                ))
                              ) : (
                                enumStore.sparePartCategories.map((category) => (
                                  <option key={category.value} value={category.value}>
                                    {category.label}
                                  </option>
                                ))
                              )}
                            </select>
                          </div>
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => removeDecompositionItem(index)}
                              className="p-1 text-red-600 hover:text-red-800 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="mt-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Details
                          </label>
                          <input
                            type="text"
                            value={item.componentDetails}
                            onChange={(e) => updateDecompositionItem(index, 'componentDetails', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Component details and specifications"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loadingStates.assets}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {editingDecomposition ? 'Update Plan' : 'Create Plan'}
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