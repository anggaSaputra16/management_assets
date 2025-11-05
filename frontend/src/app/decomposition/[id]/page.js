'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft, 
  GitBranch, 
  Package, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Settings,
  User,
  Calendar,
  FileText,
  Trash2,
  Play
} from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { useToast } from '@/contexts/ToastContext'
import { decompositionService } from '@/lib/services/decompositionService'
import { useSparePartsStore } from '@/stores/sparePartsStore'

export default function DecompositionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { showSuccess, showError } = useToast()
  const { fetchSpareParts } = useSparePartsStore()
  const [loading, setLoading] = useState(true)
  const [decomposition, setDecomposition] = useState(null)
  const [compatibleAssets, setCompatibleAssets] = useState([])
  const [showExecuteModal, setShowExecuteModal] = useState(false)
  const [executing, setExecuting] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchDecomposition()
    }
  }, [params.id, fetchDecomposition])

  const fetchDecomposition = useCallback(async () => {
    try {
      setLoading(true)
      const response = await decompositionService.getDecomposition(params.id)
      
      if (response.success) {
        setDecomposition(response.data)
        
        // Fetch compatible assets if decomposition is pending
        if (response.data.status === 'PENDING') {
          const compatibleResponse = await decompositionService.getCompatibleAssets(response.data.sourceAssetId)
          if (compatibleResponse.success) {
            setCompatibleAssets(compatibleResponse.data)
          }
        }
      } else {
        showError('Failed to fetch decomposition details')
      }
    } catch (error) {
      console.error('Error fetching decomposition:', error)
      showError('Error loading decomposition details')
    } finally {
      setLoading(false)
    }
  }, [params.id, showError])

  const handleExecute = async () => {
    if (!decomposition) return

    try {
      setExecuting(true)
      const response = await decompositionService.executeDecomposition(decomposition.id)
      
      if (response.success) {
        showSuccess('Decomposition executed successfully')
        // Refresh decomposition data and spare parts inventory so newly created spare parts are visible
        fetchDecomposition()
        try { fetchSpareParts() } catch (e) { /* ignore */ }
        setShowExecuteModal(false)
      } else {
        showError(response.message || 'Failed to execute decomposition')
      }
    } catch (error) {
      console.error('Error executing decomposition:', error)
      showError('Error executing decomposition')
    } finally {
      setExecuting(false)
    }
  }

  const handleDelete = async () => {
    if (!decomposition || !confirm('Are you sure you want to delete this decomposition plan?')) {
      return
    }

    try {
      const response = await decompositionService.deleteDecomposition(decomposition.id)
      
      if (response.success) {
        showSuccess('Decomposition deleted successfully')
        router.push('/decomposition')
      } else {
        showError(response.message || 'Failed to delete decomposition')
      }
    } catch (error) {
      console.error('Error deleting decomposition:', error)
      showError('Error deleting decomposition')
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      IN_PROGRESS: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Settings },
      COMPLETED: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertCircle }
    }
    
    const config = statusConfig[status] || statusConfig.PENDING
    const Icon = config.icon
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', ' ')}
      </span>
    )
  }

  const getActionBadge = (action) => {
    const actionConfig = {
      Transfer: { bg: 'bg-blue-100', text: 'text-blue-800' },
      Dispose: { bg: 'bg-red-100', text: 'text-red-800' },
      Store: { bg: 'bg-gray-100', text: 'text-gray-800' },
      Repair: { bg: 'bg-yellow-100', text: 'text-yellow-800' }
    }
    
    const config = actionConfig[action] || actionConfig.Store
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {action}
      </span>
    )
  }

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <DashboardLayout title="Decomposition Details">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!decomposition) {
    return (
      <DashboardLayout title="Decomposition Not Found">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Decomposition Not Found</h3>
          <p className="text-gray-600 mb-4">The decomposition plan you&apos;re looking for doesn&apos;t exist.</p>
          <button
            onClick={() => router.push('/decomposition')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Decomposition
          </button>
        </div>
      </DashboardLayout>
    )
  }

  const ExecuteModal = () => (
  <div className="fixed inset-0 bg-white/10 dark:bg-black/30 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Execute Decomposition</h3>
          <p className="text-gray-600 mb-6">
            Are you sure you want to execute this decomposition plan? This action will:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 mb-6 space-y-1">
            <li>Transfer selected components to target assets</li>
            <li>Update component statuses based on actions</li>
            <li>Create transfer records for tracking</li>
            <li>Mark the decomposition as completed</li>
          </ul>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowExecuteModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={executing}
            >
              Cancel
            </button>
            <button
              onClick={handleExecute}
              disabled={executing}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
            >
              {executing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Executing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Execute
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <DashboardLayout title="Decomposition Details">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/decomposition')}
              className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <GitBranch className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Decomposition Plan
                </h1>
                <p className="text-gray-600">
                  {decomposition.sourceAsset?.name} → {decomposition.targetAsset?.name || 'Multiple Assets'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {getStatusBadge(decomposition.status)}
            
            {decomposition.status === 'PENDING' && (
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowExecuteModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Execute
                </button>
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Details Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Source Asset
                    </label>
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {decomposition.sourceAsset?.name} ({decomposition.sourceAsset?.assetTag})
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Asset
                    </label>
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {decomposition.targetAsset?.name ? 
                          `${decomposition.targetAsset.name} (${decomposition.targetAsset.assetTag})` : 
                          'Multiple Assets'
                        }
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Planned Date
                    </label>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {new Date(decomposition.plannedDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Performed By
                    </label>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {decomposition.performedBy ? 
                          `${decomposition.performedBy.firstName} ${decomposition.performedBy.lastName}` :
                          'Not assigned'
                        }
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason
                  </label>
                  <div className="flex items-start space-x-2">
                    <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
                    <span className="text-sm text-gray-900">
                      {decomposition.reason || 'No reason provided'}
                    </span>
                  </div>
                </div>
                
                {decomposition.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-700">{decomposition.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Components to Process */}
            <div className="bg-white rounded-lg shadow border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Components to Process</h3>
                <p className="text-sm text-gray-600">
                  {decomposition.items?.length || 0} components in this decomposition plan
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Component
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {decomposition.items?.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.component?.name || 'Unknown Component'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.component?.partNumber && `PN: ${item.component.partNumber}`}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getActionBadge(item.action)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {item.targetAssetId && item.action === 'Transfer' && (
                              <span>
                                Transfer to: {compatibleAssets.find(a => a.id === item.targetAssetId)?.name || 'Unknown Asset'}
                              </span>
                            )}
                            {item.action === 'Dispose' && <span>Component will be disposed</span>}
                            {item.action === 'Store' && <span>Component will be stored</span>}
                            {item.action === 'Repair' && <span>Component needs repair</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700">
                            {item.notes || 'No notes'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Timeline & Status */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-lg shadow border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Status</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="text-center">
                  {getStatusBadge(decomposition.status)}
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Created:</span>
                    <span className="text-gray-900">
                      {formatDateTime(decomposition.createdAt)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Updated:</span>
                    <span className="text-gray-900">
                      {formatDateTime(decomposition.updatedAt)}
                    </span>
                  </div>
                  
                  {decomposition.completedAt && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Completed:</span>
                      <span className="text-gray-900">
                        {formatDateTime(decomposition.completedAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="bg-white rounded-lg shadow border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Progress</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      decomposition.status !== 'PENDING' ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                    <span className="text-sm text-gray-700">Plan Created</span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      decomposition.status === 'IN_PROGRESS' || decomposition.status === 'COMPLETED' ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                    <span className="text-sm text-gray-700">Execution Started</span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      decomposition.status === 'COMPLETED' ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                    <span className="text-sm text-gray-700">Completed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Statistics */}
            <div className="bg-white rounded-lg shadow border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Summary</h3>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Components:</span>
                  <span className="font-medium text-gray-900">
                    {decomposition.items?.length || 0}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">To Transfer:</span>
                  <span className="font-medium text-blue-600">
                    {decomposition.items?.filter(item => item.action === 'Transfer').length || 0}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">To Dispose:</span>
                  <span className="font-medium text-red-600">
                    {decomposition.items?.filter(item => item.action === 'Dispose').length || 0}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">To Store:</span>
                  <span className="font-medium text-gray-600">
                    {decomposition.items?.filter(item => item.action === 'Store').length || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Execute Modal */}
      {showExecuteModal && <ExecuteModal />}
    </DashboardLayout>
  )
}
