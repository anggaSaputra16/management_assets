'use client'

import { useState, useEffect } from 'react'
import { useRequestStore, useAssetStore, useCategoryStore, useUserStore, useEnumStore } from '@/stores'
import { useToast } from '@/contexts/ToastContext'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import FilterModal from './_components/filterModal'
import {
  FileText,
  Plus,
  Filter,
  Edit,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  X
} from 'lucide-react'

const RequestsPage = () => {
  const { showSuccess, showError } = useToast()
  const {
    loading,
    searchTerm,
    typeFilter,
    statusFilter,
    priorityFilter,
    showModal,
    editingRequest,
    formData,
    fetchRequests,
    createRequest,
    updateRequest,
    deleteRequest,
    approveRequest,
    rejectRequest,
    setSearchTerm,
    setTypeFilter,
    setStatusFilter,
    setPriorityFilter,
    setShowModal,
    setEditingRequest,
    resetForm,
    handleInputChange,
    getFilteredRequests,
    getRequestStats
  } = useRequestStore()

  const { assets, fetchAssets } = useAssetStore()
  const { categories, fetchCategories } = useCategoryStore()
  const { users, fetchUsers } = useUserStore()
  const {
    requestTypes,
    requestStatuses,
    priorityLevels,
    initializeEnums
  } = useEnumStore()

  const [currentPage, setCurrentPage] = useState(1)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [requestToDelete, setRequestToDelete] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const itemsPerPage = 10

  const filteredRequests = getFilteredRequests()
  const stats = getRequestStats()
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage)
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchRequests(),
          fetchAssets(),
          fetchCategories(),
          fetchUsers(),
          initializeEnums()
        ])
      } catch (error) {
        console.error('Failed to load data:', error)
        showError('Failed to load data. Please refresh the page.')
      }
    }
    
    loadData()
  }, [fetchRequests, fetchAssets, fetchCategories, fetchUsers, initializeEnums, showError])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.title?.trim()) {
      showError('Title is required')
      return
    }
    
    if (!formData.type) {
      showError('Request type is required')
      return
    }

    try {
      if (editingRequest) {
        await updateRequest(editingRequest.id, formData)
        showSuccess('Request updated successfully!')
      } else {
        await createRequest(formData)
        showSuccess('Request created successfully!')
      }
      setShowModal(false)
    } catch (error) {
      console.error('Failed to save request:', error)
      showError('Failed to save request. Please try again.')
    }
  }

  const handleEdit = (request) => {
    setEditingRequest(request)
  }

  const handleView = (request) => {
    setSelectedRequest(request)
    setShowDetailModal(true)
  }

  const handleDelete = (request) => {
    setRequestToDelete(request)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (requestToDelete) {
      try {
        await deleteRequest(requestToDelete.id)
        setShowDeleteModal(false)
        setRequestToDelete(null)
        showSuccess(`Request "${requestToDelete.title}" deleted successfully!`)
      } catch (error) {
        console.error('Failed to delete request:', error)
        showError('Failed to delete request. Please try again.')
      }
    }
  }

  const handleApprove = async (requestId) => {
    try {
      await approveRequest(requestId)
      showSuccess('Request approved successfully!')
    } catch (error) {
      console.error('Failed to approve request:', error)
      showError('Failed to approve request.')
    }
  }

  const handleReject = async (requestId, reason = '') => {
    try {
      await rejectRequest(requestId, reason)
      showSuccess('Request rejected successfully!')
    } catch (error) {
      console.error('Failed to reject request:', error)
      showError('Failed to reject request.')
    }
  }

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-white/60 text-[#111]'
      case 'APPROVED':
        return 'bg-white/60 text-[#111]'
      case 'REJECTED':
        return 'bg-white/60 text-[#111]'
      case 'ALLOCATED':
        return 'bg-white/60 text-[#111]'
      case 'COMPLETED':
        return 'bg-gray-100 text-[#111]'
      default:
        return 'bg-gray-100 text-[#111]'
    }
  }

  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-white/60 text-[#111]'
      case 'MEDIUM':
        return 'bg-white/60 text-[#111]'
      case 'LOW':
        return 'bg-white/60 text-[#111]'
      default:
        return 'bg-gray-100 text-[#111]'
    }
  }

  const renderModal = () => {
    if (!showModal) return null

    return (
      <div className="fixed inset-0 bg-white/10 dark:bg-black/30 backdrop-blur-md flex items-center justify-center p-4 z-50">
        <div className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-black/10">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#111]">
                {editingRequest ? 'Edit Request' : 'New Request'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="text-[#333] hover:text-[#333]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full glass-input rounded-lg px-3 py-2 text-[#111] focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                  className="w-full glass-input rounded-lg px-3 py-2 text-[#111] focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30"
                >
                  <option value="">Select Type</option>
                  {requestTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111] mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full glass-input rounded-lg px-3 py-2 text-[#111] focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full glass-input rounded-lg px-3 py-2 text-[#111] focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30"
                >
                  <option value="">Select Priority</option>
                  {priorityLevels.map(priority => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Asset (if applicable)
                </label>
                <select
                  name="assetId"
                  value={formData.assetId}
                  onChange={handleInputChange}
                  className="w-full glass-input rounded-lg px-3 py-2 text-[#111] focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30"
                >
                  <option value="">Select Asset</option>
                  {Array.isArray(assets) && assets.map(asset => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name} ({asset.assetTag})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Category (if applicable)
                </label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
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
                  Assignee
                </label>
                <select
                  name="assigneeId"
                  value={formData.assigneeId}
                  onChange={handleInputChange}
                  className="w-full glass-input rounded-lg px-3 py-2 text-[#111] focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30"
                >
                  <option value="">Select Assignee</option>
                  {Array.isArray(users) && users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  className="w-full glass-input rounded-lg px-3 py-2 text-[#111] focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Estimated Cost
                </label>
                <input
                  type="number"
                  name="estimatedCost"
                  value={formData.estimatedCost}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full glass-input rounded-lg px-3 py-2 text-[#111] focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111] mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={2}
                className="w-full glass-input rounded-lg px-3 py-2 text-[#111] focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="px-4 py-2 border border-black/10 rounded-lg text-[#111] hover:bg-white/60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 glass-button text-[#111] rounded-lg hover:scale-105 transition-transform disabled:opacity-50"
              >
                {loading ? 'Saving...' : editingRequest ? 'Update Request' : 'Create Request'}
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
      <div className="fixed inset-0 bg-white/10 dark:bg-black/30 backdrop-blur-md flex items-center justify-center p-4 z-50">
        <div className="glass-card max-w-md w-full">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-[#111] mr-3" />
              <h3 className="text-lg font-semibold text-[#111]">Delete Request</h3>
            </div>
            <p className="text-[#333] mb-6">
              Are you sure you want to delete &quot;{requestToDelete?.title}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-black/10 rounded-lg text-[#111] hover:bg-white/60"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 glass-button text-[#111] rounded-lg hover:scale-105 transition-transform"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderDetailModal = () => {
    if (!showDetailModal || !selectedRequest) return null

    return (
      <div className="fixed inset-0 bg-white/10 dark:bg-black/30 backdrop-blur-md flex items-center justify-center p-4 z-50">
        <div className="glass-card max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-black/10">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#111]">Request Details</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-[#333] hover:text-[#333]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#111]">Title</label>
                <p className="text-sm text-[#111]">{selectedRequest.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111]">Type</label>
                <span className="inline-flex px-2 py-1 text-xs font-semibold bg-white/60 text-[#111] rounded-full">
                  {selectedRequest.type}
                </span>
              </div>
            </div>

            {selectedRequest.description && (
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">Description</label>
                <p className="text-sm text-[#111]">{selectedRequest.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#111]">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(selectedRequest.status)}`}>
                  {selectedRequest.status}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111]">Priority</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityBadgeColor(selectedRequest.priority)}`}>
                  {selectedRequest.priority}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#111]">Requester</label>
                <p className="text-sm text-[#111]">{selectedRequest.requester?.name || 'Unknown'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111]">Assignee</label>
                <p className="text-sm text-[#111]">{selectedRequest.assignee?.name || 'Not assigned'}</p>
              </div>
            </div>

            {selectedRequest.asset && (
              <div>
                <label className="block text-sm font-medium text-[#111]">Related Asset</label>
                <p className="text-sm text-[#111]">
                  {selectedRequest.asset.name} ({selectedRequest.asset.assetTag})
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#111]">Request Date</label>
                <p className="text-sm text-[#111]">
                  {new Date(selectedRequest.requestDate).toLocaleDateString()}
                </p>
              </div>
              {selectedRequest.dueDate && (
                <div>
                  <label className="block text-sm font-medium text-[#111]">Due Date</label>
                  <p className="text-sm text-[#111]">
                    {new Date(selectedRequest.dueDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {selectedRequest.estimatedCost && (
              <div>
                <label className="block text-sm font-medium text-[#111]">Estimated Cost</label>
                <p className="text-sm text-[#111]">
                  ${selectedRequest.estimatedCost.toLocaleString()}
                </p>
              </div>
            )}

            {selectedRequest.notes && (
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">Notes</label>
                <p className="text-sm text-[#111]">{selectedRequest.notes}</p>
              </div>
            )}

            {selectedRequest.status === 'PENDING' && (
              <div className="flex space-x-2 pt-4 border-t">
                <button
                  onClick={() => {
                    handleApprove(selectedRequest.id)
                    setShowDetailModal(false)
                  }}
                  className="px-4 py-2 glass-button text-[#111] rounded-lg hover:scale-105 transition-transform"
                >
                  <CheckCircle className="h-4 w-4 mr-2 inline" />
                  Approve
                </button>
                <button
                  onClick={() => {
                    handleReject(selectedRequest.id, 'Rejected from detail view')
                    setShowDetailModal(false)
                  }}
                  className="px-4 py-2 glass-button text-[#111] rounded-lg hover:scale-105 transition-transform"
                >
                  <XCircle className="h-4 w-4 mr-2 inline" />
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
      {/* Header */}
      <div className="glass-header p-6 rounded-lg flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111]">Asset Requests</h1>
          <p className="text-[#333]">
            Manage asset requests and allocations
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setFiltersOpen(true)}
            className="glass-button inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium hover:scale-105 transition-transform"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="glass-button inline-flex items-center px-4 py-2 rounded-lg hover:scale-105 transition-transform"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const IconComponent = {
            FileText,
            ClipboardList: FileText,
            Clock,
            CheckCircle,
            XCircle
          }[stat.icon] || FileText

          return (
            <div key={index} className="glass-card hover:scale-105 transition-transform">
              <div className="flex items-center">
                <div className="glass-button rounded-lg p-3">
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

      {/* Requests Table */}
      <div className="glass-card overflow-hidden">
        <div className="glass-table overflow-x-auto rounded-xl">
          <table className="min-w-full">
            <thead className="bg-white/60">
              <tr>
                <th className="px-6 py-3 text-left text-[#111] font-semibold uppercase tracking-wider">
                  Request
                </th>
                <th className="px-6 py-3 text-left text-[#111] font-semibold uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-[#111] font-semibold uppercase tracking-wider">
                  Requester
                </th>
                <th className="px-6 py-3 text-left text-[#111] font-semibold uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-[#111] font-semibold uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-[#111] font-semibold uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-[#111] font-semibold uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-black/10">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-[#111]">
                    <div className="flex items-center justify-center">
                      <FileText className="animate-spin h-5 w-5 mr-2" />
                      Loading requests...
                    </div>
                  </td>
                </tr>
              ) : paginatedRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-[#333]">
                    No requests found
                  </td>
                </tr>
              ) : (
                paginatedRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-white/40">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-[#111]">{request.title}</div>
                        <div className="text-sm text-[#333]">{request.description?.substring(0, 50)}...</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold bg-white/60 text-[#111] rounded-full">
                        {request.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-[#111]">
                        <User className="h-4 w-4 mr-1 text-[#333]" />
                        {request.requester?.name || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityBadgeColor(request.priority)}`}>
                        {request.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#111]">
                      {new Date(request.requestDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(request)}
                          className="text-[#111] hover:scale-110 transition-transform"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(request)}
                          className="text-[#111] hover:scale-110 transition-transform"
                          title="Edit Request"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {request.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(request.id)}
                              className="text-[#111] hover:scale-110 transition-transform"
                              title="Approve Request"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleReject(request.id)}
                              className="text-[#111] hover:scale-110 transition-transform"
                              title="Reject Request"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(request)}
                          className="text-[#111] hover:scale-110 transition-transform"
                          title="Delete Request"
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
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{' '}
              to{' '}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, filteredRequests.length)}
              </span>{' '}
              of{' '}
              <span className="font-medium">{filteredRequests.length}</span>{' '}
              results
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="inline-flex items-center px-3 py-2 border border-black/10 rounded-lg text-sm font-medium text-[#111] bg-white hover:bg-white/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-[#111]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
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
      {renderDetailModal()}
      </div>
      <FilterModal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        requestTypes={requestTypes}
        requestStatuses={requestStatuses}
        priorityLevels={priorityLevels}
        onClearAll={() => {
          setSearchTerm('')
          setTypeFilter('')
          setStatusFilter('')
          setPriorityFilter('')
        }}
      />
    </DashboardLayout>
  )
}

export default RequestsPage
