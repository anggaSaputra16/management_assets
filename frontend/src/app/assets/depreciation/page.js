'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { useToast } from '@/contexts/ToastContext'
import { 
  TrendingDown, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Calculator,
  Package,
  DollarSign,
  Calendar,
  BarChart3
} from 'lucide-react'
import { api } from '@/lib/api'

const DepreciationPage = () => {
  const { showSuccess, showError } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [depreciations, setDepreciations] = useState([])
  const [assets, setAssets] = useState([])
  
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [isActiveFilter, setIsActiveFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  const [showModal, setShowModal] = useState(false)
  const [selectedDepreciation, setSelectedDepreciation] = useState(null)
  const [editingDepreciation, setEditingDepreciation] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  
  const [formData, setFormData] = useState({
    assetId: '',
    depreciationMethod: 'STRAIGHT_LINE',
    usefulLife: 5,
    salvageValue: 0,
    depreciationRate: 0.2,
    notes: ''
  })

  const itemsPerPage = 10

  useEffect(() => {
    fetchDepreciations()
    fetchAssets()
  }, [currentPage, isActiveFilter])

  const fetchDepreciations = async () => {
    try {
      setLoading(true)
      const response = await api.get('/asset-depreciations', {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          isActive: isActiveFilter
        }
      })
      
      if (response.data.success) {
        setDepreciations(response.data.data.depreciations)
        setTotalPages(response.data.data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error fetching depreciations:', error)
      showError('Failed to fetch depreciations')
    } finally {
      setLoading(false)
    }
  }

  const fetchAssets = async () => {
    try {
      const response = await api.get('/assets?limit=1000')
      setAssets(response.data.data?.assets || [])
    } catch (error) {
      console.error('Error fetching assets:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      
      if (editingDepreciation) {
        await api.put(`/asset-depreciations/${editingDepreciation.id}`, formData)
        showSuccess('Depreciation updated successfully')
      } else {
        await api.post('/asset-depreciations', formData)
        showSuccess('Depreciation created successfully')
      }

      resetForm()
      setShowModal(false)
      fetchDepreciations()
    } catch (error) {
      console.error('Error saving depreciation:', error)
      showError(error.response?.data?.message || 'Failed to save depreciation')
    } finally {
      setLoading(false)
    }
  }

  const handleCalculate = async (depreciationId) => {
    try {
      const period = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0')
      await api.post(`/asset-depreciations/${depreciationId}/calculate`, { period })
      showSuccess('Depreciation calculated successfully')
      fetchDepreciations()
    } catch (error) {
      console.error('Error calculating depreciation:', error)
      showError(error.response?.data?.message || 'Failed to calculate depreciation')
    }
  }

  const handlePreview = async (depreciationId) => {
    try {
      const response = await api.get(`/asset-depreciations/${depreciationId}/preview`)
      if (response.data.success) {
        setPreviewData(response.data.data)
        setShowPreview(true)
      }
    } catch (error) {
      console.error('Error fetching preview:', error)
      showError('Failed to load depreciation preview')
    }
  }

  const resetForm = () => {
    setFormData({
      assetId: '',
      depreciationMethod: 'STRAIGHT_LINE',
      usefulLife: 5,
      salvageValue: 0,
      depreciationRate: 0.2,
      notes: ''
    })
    setEditingDepreciation(null)
  }

  const handleEdit = (depreciation) => {
    setEditingDepreciation(depreciation)
    setFormData({
      assetId: depreciation.assetId,
      depreciationMethod: depreciation.depreciationMethod,
      usefulLife: depreciation.usefulLife,
      salvageValue: parseFloat(depreciation.salvageValue) || 0,
      depreciationRate: parseFloat(depreciation.depreciationRate) || 0.2,
      notes: depreciation.notes || ''
    })
    setShowModal(true)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount || 0)
  }

  const getMethodDisplay = (method) => {
    switch (method) {
      case 'STRAIGHT_LINE': return 'Straight Line'
      case 'DECLINING_BALANCE': return 'Declining Balance'
      case 'UNITS_OF_PRODUCTION': return 'Units of Production'
      default: return method
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingDown className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Asset Depreciation</h1>
              <p className="text-gray-600">Manage asset depreciation schedules and calculations</p>
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
            New Depreciation
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search depreciations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <select
                value={isActiveFilter}
                onChange={(e) => setIsActiveFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>
          </div>
        </div>

        {/* Depreciations List */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
          ) : depreciations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asset
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Values
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {depreciations.map((depreciation) => (
                    <tr key={depreciation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {depreciation.asset?.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {depreciation.asset?.assetTag}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {getMethodDisplay(depreciation.depreciationMethod)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {depreciation.usefulLife} years
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <DollarSign className="h-3 w-3 text-gray-400 mr-1" />
                            <span className="text-gray-500">Book:</span>
                            <span className="ml-1 font-medium">
                              {formatCurrency(depreciation.currentBookValue)}
                            </span>
                          </div>
                          <div className="flex items-center text-sm">
                            <span className="text-gray-500">Accumulated:</span>
                            <span className="ml-1 font-medium">
                              {formatCurrency(depreciation.accumulatedDepreciation)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="text-sm text-gray-900">
                            {depreciation.lastCalculatedDate ? 
                              new Date(depreciation.lastCalculatedDate).toLocaleDateString() : 
                              'Not calculated'
                            }
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{
                                width: `${Math.min(
                                  ((parseFloat(depreciation.accumulatedDepreciation) || 0) / 
                                   (parseFloat(depreciation.asset?.purchasePrice) || 1)) * 100, 
                                  100
                                )}%`
                              }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          depreciation.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {depreciation.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setSelectedDepreciation(depreciation)}
                            className="text-gray-400 hover:text-blue-600"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handlePreview(depreciation.id)}
                            className="text-gray-400 hover:text-purple-600"
                          >
                            <BarChart3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(depreciation)}
                            className="text-gray-400 hover:text-blue-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleCalculate(depreciation.id)}
                            className="text-gray-400 hover:text-green-600"
                          >
                            <Calculator className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <TrendingDown className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No depreciations</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new asset depreciation.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Depreciation Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-white/10 dark:bg-black/30 backdrop-blur-md flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingDepreciation ? 'Edit Depreciation' : 'Create New Depreciation'}
                </h3>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Asset *
                    </label>
                    <select
                      value={formData.assetId}
                      onChange={(e) => setFormData({...formData, assetId: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Asset</option>
                      {assets.map(asset => (
                        <option key={asset.id} value={asset.id}>
                          {asset.name} ({asset.assetTag}) - {formatCurrency(asset.purchasePrice)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Depreciation Method *
                    </label>
                    <select
                      value={formData.depreciationMethod}
                      onChange={(e) => setFormData({...formData, depreciationMethod: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="STRAIGHT_LINE">Straight Line</option>
                      <option value="DECLINING_BALANCE">Declining Balance</option>
                      <option value="UNITS_OF_PRODUCTION">Units of Production</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Useful Life (Years) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.usefulLife}
                      onChange={(e) => setFormData({...formData, usefulLife: parseInt(e.target.value)})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Salvage Value (IDR)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.salvageValue}
                      onChange={(e) => setFormData({...formData, salvageValue: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {formData.depreciationMethod === 'DECLINING_BALANCE' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Depreciation Rate (0-1)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        value={formData.depreciationRate}
                        onChange={(e) => setFormData({...formData, depreciationRate: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Additional notes about the depreciation schedule"
                  />
                </div>

                <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm()
                      setShowModal(false)
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : editingDepreciation ? 'Update Depreciation' : 'Create Depreciation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && previewData && (
          <div className="fixed inset-0 bg-white/10 dark:bg-black/30 backdrop-blur-md flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Depreciation Preview
                </h3>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Annual Depreciation</label>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(previewData.annualDepreciation)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Monthly Depreciation</label>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(previewData.monthlyDepreciation)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Current Book Value</label>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(previewData.currentBookValue)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Remaining Book Value</label>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(previewData.remainingBookValue)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Accumulated Depreciation</label>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(previewData.accumulatedDepreciation)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Total Depreciable</label>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(previewData.totalDepreciableAmount)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowPreview(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default DepreciationPage