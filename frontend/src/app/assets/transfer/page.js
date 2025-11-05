'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { useToast } from '@/contexts/ToastContext'
import { 
  ArrowRightLeft, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  Package,
  User,
  MapPin,
  Building2
} from 'lucide-react'
import { api } from '@/lib/api'

const TransferPage = () => {
  const { showSuccess, showError, showInfo } = useToast()
  const router = useRouter()
  
  const [loading, setLoading] = useState(false)
  const [transfers, setTransfers] = useState([])
  const [assets, setAssets] = useState([])
  const [locations, setLocations] = useState([])
  const [departments, setDepartments] = useState([])
  const [users, setUsers] = useState([])
  
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  const [showModal, setShowModal] = useState(false)
  const [selectedTransfer, setSelectedTransfer] = useState(null)
  const [editingTransfer, setEditingTransfer] = useState(null)
  
  const [formData, setFormData] = useState({
    assetId: '',
    reason: '',
    transferDate: new Date().toISOString().split('T')[0],
    effectiveDate: '',
    notes: '',
    fromLocationId: '',
    toLocationId: '',
    fromDepartmentId: '',
    toDepartmentId: '',
    fromUserId: '',
    toUserId: ''
  })

  const itemsPerPage = 10

  useEffect(() => {
    fetchTransfers()
    fetchMasterData()
  }, [currentPage, statusFilter])

  const fetchTransfers = async () => {
    try {
      setLoading(true)
      const response = await api.get('/asset-transfers', {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          status: statusFilter
        }
      })
      
      if (response.data.success) {
        setTransfers(response.data.data.transfers)
        setTotalPages(response.data.data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error fetching transfers:', error)
      showError('Failed to fetch transfers')
    } finally {
      setLoading(false)
    }
  }

  const fetchMasterData = async () => {
    try {
      const [assetsRes, locationsRes, departmentsRes, usersRes] = await Promise.all([
        api.get('/assets?limit=1000'),
        api.get('/locations'),
        api.get('/departments'),
        api.get('/users')
      ])

      setAssets(assetsRes.data.data?.assets || [])
      setLocations(locationsRes.data.data?.locations || [])
      setDepartments(departmentsRes.data.data?.departments || [])
      setUsers(usersRes.data.data?.users || [])
    } catch (error) {
      console.error('Error fetching master data:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      
      const payload = {
        ...formData,
        transferDate: formData.transferDate ? new Date(formData.transferDate).toISOString() : undefined,
        effectiveDate: formData.effectiveDate ? new Date(formData.effectiveDate).toISOString() : undefined
      }

      if (editingTransfer) {
        await api.put(`/asset-transfers/${editingTransfer.id}`, payload)
        showSuccess('Transfer updated successfully')
      } else {
        await api.post('/asset-transfers', payload)
        showSuccess('Transfer created successfully')
      }

      resetForm()
      setShowModal(false)
      fetchTransfers()
    } catch (error) {
      console.error('Error saving transfer:', error)
      showError(error.response?.data?.message || 'Failed to save transfer')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (transferId) => {
    try {
      await api.post(`/asset-transfers/${transferId}/approve`)
      showSuccess('Transfer approved successfully')
      fetchTransfers()
    } catch (error) {
      console.error('Error approving transfer:', error)
      showError(error.response?.data?.message || 'Failed to approve transfer')
    }
  }

  const handleComplete = async (transferId) => {
    try {
      await api.post(`/asset-transfers/${transferId}/complete`)
      showSuccess('Transfer completed successfully')
      fetchTransfers()
    } catch (error) {
      console.error('Error completing transfer:', error)
      showError(error.response?.data?.message || 'Failed to complete transfer')
    }
  }

  const resetForm = () => {
    setFormData({
      assetId: '',
      reason: '',
      transferDate: new Date().toISOString().split('T')[0],
      effectiveDate: '',
      notes: '',
      fromLocationId: '',
      toLocationId: '',
      fromDepartmentId: '',
      toDepartmentId: '',
      fromUserId: '',
      toUserId: ''
    })
    setEditingTransfer(null)
  }

  const handleEdit = (transfer) => {
    setEditingTransfer(transfer)
    setFormData({
      assetId: transfer.assetId,
      reason: transfer.reason,
      transferDate: transfer.transferDate ? new Date(transfer.transferDate).toISOString().split('T')[0] : '',
      effectiveDate: transfer.effectiveDate ? new Date(transfer.effectiveDate).toISOString().split('T')[0] : '',
      notes: transfer.notes || '',
      fromLocationId: transfer.fromLocationId || '',
      toLocationId: transfer.toLocationId || '',
      fromDepartmentId: transfer.fromDepartmentId || '',
      toDepartmentId: transfer.toDepartmentId || '',
      fromUserId: transfer.fromUserId || '',
      toUserId: transfer.toUserId || ''
    })
    setShowModal(true)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      case 'COMPLETED': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4" />
      case 'APPROVED': return <CheckCircle className="h-4 w-4" />
      case 'REJECTED': return <XCircle className="h-4 w-4" />
      case 'COMPLETED': return <CheckCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ArrowRightLeft className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Asset Transfers</h1>
              <p className="text-gray-600">Manage asset transfers between locations, departments, and users</p>
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
            New Transfer
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
                  placeholder="Search transfers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="COMPLETED">Completed</option>
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

        {/* Transfers List */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
          ) : transfers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transfer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asset
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      From/To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transfers.map((transfer) => (
                    <tr key={transfer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {transfer.transferNumber}
                          </div>
                          <div className="text-sm text-gray-500">
                            {transfer.reason}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {transfer.asset?.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {transfer.asset?.assetTag}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {transfer.fromLocation && transfer.toLocation && (
                            <div className="flex items-center text-sm text-gray-500">
                              <MapPin className="h-3 w-3 mr-1" />
                              {transfer.fromLocation.name} → {transfer.toLocation.name}
                            </div>
                          )}
                          {transfer.fromDepartment && transfer.toDepartment && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Building2 className="h-3 w-3 mr-1" />
                              {transfer.fromDepartment.name} → {transfer.toDepartment.name}
                            </div>
                          )}
                          {transfer.fromUser && transfer.toUser && (
                            <div className="flex items-center text-sm text-gray-500">
                              <User className="h-3 w-3 mr-1" />
                              {transfer.fromUser.firstName} → {transfer.toUser.firstName}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transfer.status)}`}>
                          {getStatusIcon(transfer.status)}
                          <span className="ml-1">{transfer.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transfer.transferDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setSelectedTransfer(transfer)}
                            className="text-gray-400 hover:text-blue-600"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {transfer.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleEdit(transfer)}
                                className="text-gray-400 hover:text-blue-600"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleApprove(transfer.id)}
                                className="text-gray-400 hover:text-green-600"
                              >
                                Approve
                              </button>
                            </>
                          )}
                          {transfer.status === 'APPROVED' && (
                            <button
                              onClick={() => handleComplete(transfer.id)}
                              className="text-gray-400 hover:text-blue-600"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <ArrowRightLeft className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No transfers</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new asset transfer.</p>
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

        {/* Transfer Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-white/10 dark:bg-black/30 backdrop-blur-md flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingTransfer ? 'Edit Transfer' : 'Create New Transfer'}
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
                          {asset.name} ({asset.assetTag})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transfer Reason *
                    </label>
                    <select
                      value={formData.reason}
                      onChange={(e) => setFormData({...formData, reason: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Reason</option>
                      <option value="Relocation">Relocation</option>
                      <option value="Department Change">Department Change</option>
                      <option value="User Assignment">User Assignment</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Upgrade">Upgrade</option>
                      <option value="Reallocation">Reallocation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transfer Date
                    </label>
                    <input
                      type="date"
                      value={formData.transferDate}
                      onChange={(e) => setFormData({...formData, transferDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      From Location
                    </label>
                    <select
                      value={formData.fromLocationId}
                      onChange={(e) => setFormData({...formData, fromLocationId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Location</option>
                      {locations.map(location => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      To Location
                    </label>
                    <select
                      value={formData.toLocationId}
                      onChange={(e) => setFormData({...formData, toLocationId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Location</option>
                      {locations.map(location => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      From Department
                    </label>
                    <select
                      value={formData.fromDepartmentId}
                      onChange={(e) => setFormData({...formData, fromDepartmentId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Department</option>
                      {departments.map(department => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      To Department
                    </label>
                    <select
                      value={formData.toDepartmentId}
                      onChange={(e) => setFormData({...formData, toDepartmentId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Department</option>
                      {departments.map(department => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </div>
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
                    placeholder="Additional notes about the transfer"
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
                    {loading ? 'Saving...' : editingTransfer ? 'Update Transfer' : 'Create Transfer'}
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

export default TransferPage