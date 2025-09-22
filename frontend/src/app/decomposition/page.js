'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { decompositionService } from '@/lib/services/decompositionService'
import { assetService } from '@/lib/services/assetService'
import { useToast } from '@/contexts/ToastContext'
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
  AlertTriangle
} from 'lucide-react'

const statusColors = {
  PLANNED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800'
}

const statusIcons = {
  PLANNED: Clock,
  IN_PROGRESS: AlertTriangle,
  COMPLETED: CheckCircle,
  CANCELLED: XCircle
}

export default function DecompositionPage() {
  const router = useRouter()
  const { showToast } = useToast()
  
  const [decompositions, setDecompositions] = useState([])
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingDecomposition, setEditingDecomposition] = useState(null)
  const [formData, setFormData] = useState({
    sourceAssetId: '',
    targetAssetId: '',
    reason: '',
    description: '',
    plannedDate: '',
    notes: '',
    items: []
  })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [decompositionsRes, assetsRes] = await Promise.all([
        decompositionService.getAllDecompositions({ search: searchTerm, status: statusFilter }),
        assetService.getAllAssets()
      ])
      setDecompositions(decompositionsRes.data || [])
      setAssets(assetsRes.data || [])
    } catch (err) {
      console.error('Failed to fetch data:', err)
      showToast('Failed to fetch data', 'error')
    } finally {
      setLoading(false)
    }
  }, [searchTerm, statusFilter, showToast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = () => {
    fetchData()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingDecomposition) {
        await decompositionService.updateDecomposition(editingDecomposition.id, formData)
        showToast('Decomposition updated successfully', 'success')
      } else {
        await decompositionService.createDecomposition(formData)
        showToast('Decomposition plan created successfully', 'success')
      }
      resetForm()
      fetchData()
    } catch (err) {
      console.error('Failed to save decomposition:', err)
      showToast(err.message, 'error')
    }
  }

  const handleExecute = async (decomposition) => {
    if (window.confirm('Are you sure you want to execute this decomposition? This action cannot be undone.')) {
      try {
        await decompositionService.executeDecomposition(decomposition.id)
        showToast('Decomposition executed successfully', 'success')
        fetchData()
      } catch (err) {
        console.error('Failed to execute decomposition:', err)
        showToast(err.message, 'error')
      }
    }
  }

  const handleDelete = async (decomposition) => {
    if (window.confirm('Are you sure you want to delete this decomposition plan?')) {
      try {
        await decompositionService.deleteDecomposition(decomposition.id)
        showToast('Decomposition deleted successfully', 'success')
        fetchData()
      } catch (err) {
        console.error('Failed to delete decomposition:', err)
        showToast(err.message, 'error')
      }
    }
  }

  const handleEdit = (decomposition) => {
    setEditingDecomposition(decomposition)
    setFormData({
      sourceAssetId: decomposition.sourceAssetId || '',
      targetAssetId: decomposition.targetAssetId || '',
      reason: decomposition.reason || '',
      description: decomposition.description || '',
      plannedDate: decomposition.plannedDate ? decomposition.plannedDate.split('T')[0] : '',
      notes: decomposition.notes || '',
      items: decomposition.items || []
    })
    setShowModal(true)
  }

  const resetForm = () => {
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
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const addDecompositionItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        componentName: '',
        componentDetails: '',
        quantity: 1,
        condition: 'Good',
        action: 'Transfer',
        targetLocation: '',
        notes: ''
      }]
    }))
  }

  const updateDecompositionItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const removeDecompositionItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const filteredDecompositions = decompositions.filter(decomposition => {
    const matchesSearch = !searchTerm || 
      decomposition.sourceAsset?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      decomposition.sourceAsset?.assetTag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      decomposition.reason?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = !statusFilter || decomposition.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getDecompositionStats = () => {
    return [
      {
        title: 'Total Plans',
        value: decompositions.length,
        icon: Package,
        color: 'bg-blue-500',
        textColor: 'text-blue-600',
        bgColor: 'bg-blue-50'
      },
      {
        title: 'Planned',
        value: decompositions.filter(d => d.status === 'PLANNED').length,
        icon: Clock,
        color: 'bg-yellow-500',
        textColor: 'text-yellow-600',
        bgColor: 'bg-yellow-50'
      },
      {
        title: 'In Progress',
        value: decompositions.filter(d => d.status === 'IN_PROGRESS').length,
        icon: AlertTriangle,
        color: 'bg-orange-500',
        textColor: 'text-orange-600',
        bgColor: 'bg-orange-50'
      },
      {
        title: 'Completed',
        value: decompositions.filter(d => d.status === 'COMPLETED').length,
        icon: CheckCircle,
        color: 'bg-green-500',
        textColor: 'text-green-600',
        bgColor: 'bg-green-50'
      }
    ]
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
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
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Decomposition Plan
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {getDecompositionStats().map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
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
                <option value="PLANNED">Planned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              
              <button
                onClick={handleSearch}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
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
                      Target Asset
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
                      const StatusIcon = statusIcons[decomposition.status]
                      return (
                        <tr key={decomposition.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {decomposition.sourceAsset?.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {decomposition.sourceAsset?.assetTag}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {decomposition.targetAsset ? (
                                <>
                                  <div className="font-medium">{decomposition.targetAsset.name}</div>
                                  <div className="text-gray-500">{decomposition.targetAsset.assetTag}</div>
                                </>
                              ) : (
                                <span className="text-gray-400">No target asset</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{decomposition.reason}</div>
                            {decomposition.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {decomposition.description}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${statusColors[decomposition.status]}`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {decomposition.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {decomposition.plannedDate ? new Date(decomposition.plannedDate).toLocaleDateString() : 'Not set'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {decomposition.items?.length || 0} items
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => router.push(`/decomposition/${decomposition.id}`)}
                                className="text-blue-600 hover:text-blue-900"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {decomposition.status === 'PLANNED' && (
                                <>
                                  <button
                                    onClick={() => handleEdit(decomposition)}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="Edit"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleExecute(decomposition)}
                                    className="text-green-600 hover:text-green-900"
                                    title="Execute"
                                  >
                                    <Play className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleDelete(decomposition)}
                                className="text-red-600 hover:text-red-900"
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
                      <td colSpan="7" className="px-6 py-12 text-center">
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select source asset</option>
                      {assets.map(asset => (
                        <option key={asset.id} value={asset.id}>
                          {asset.name} ({asset.assetTag})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Asset (Optional)
                    </label>
                    <select
                      name="targetAssetId"
                      value={formData.targetAssetId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select target asset</option>
                      {assets.filter(a => a.id !== formData.sourceAssetId).map(asset => (
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
                      <option value="End of Life">End of Life</option>
                      <option value="Damage">Damage</option>
                      <option value="Upgrade">Upgrade</option>
                      <option value="Optimization">Optimization</option>
                      <option value="Maintenance">Maintenance</option>
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
                      className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Item
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formData.items.map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Component Name
                            </label>
                            <input
                              type="text"
                              value={item.componentName}
                              onChange={(e) => updateDecompositionItem(index, 'componentName', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="e.g., CPU, RAM"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Condition
                            </label>
                            <select
                              value={item.condition}
                              onChange={(e) => updateDecompositionItem(index, 'condition', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="Good">Good</option>
                              <option value="Fair">Fair</option>
                              <option value="Poor">Poor</option>
                              <option value="Damaged">Damaged</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Action
                            </label>
                            <select
                              value={item.action}
                              onChange={(e) => updateDecompositionItem(index, 'action', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="Transfer">Transfer</option>
                              <option value="Dispose">Dispose</option>
                              <option value="Store">Store</option>
                              <option value="Repair">Repair</option>
                            </select>
                          </div>
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => removeDecompositionItem(index)}
                              className="p-1 text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="mt-2">
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Details
                          </label>
                          <input
                            type="text"
                            value={item.componentDetails}
                            onChange={(e) => updateDecompositionItem(index, 'componentDetails', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Component details and specifications"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Additional notes"
                  />
                </div>

                <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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