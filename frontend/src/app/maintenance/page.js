'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { useMaintenanceStore } from '@/stores'
import { useToast } from '@/contexts/ToastContext'
import {
  Wrench,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  User,
  Download,
  X
} from 'lucide-react'
    
const MaintenancePage = () => {
  const {
    loading,
    error,
    searchTerm,
    typeFilter,
    statusFilter,
    priorityFilter,
    assetFilter,
    showModal,
    editingMaintenance,
    formData,
    fetchMaintenance,
    createMaintenance,
    updateMaintenance,
    deleteMaintenance,
    updateMaintenanceStatus,
    setSearchTerm,
    setTypeFilter,
    setStatusFilter,
    setPriorityFilter,
    setAssetFilter,
    setShowModal,
    setEditingMaintenance,
    resetForm,
    handleInputChange,
    getFilteredMaintenance,
    getMaintenanceStats
  } = useMaintenanceStore()

  const { showSuccess, showError } = useToast()
  const [showFilters, setShowFilters] = useState(false)
  const [selectedMaintenance, setSelectedMaintenance] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const filteredMaintenance = getFilteredMaintenance()
  const stats = getMaintenanceStats()

  // Mock data for assets and users (would come from their respective stores)
  const [assets] = useState([
    { id: 1, name: 'Laptop Dell XPS', assetTag: 'LT001' },
    { id: 2, name: 'Printer HP LaserJet', assetTag: 'PR001' },
    { id: 3, name: 'Server Dell PowerEdge', assetTag: 'SV001' }
  ])

  const [users] = useState([
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    { id: 3, name: 'Bob Wilson', email: 'bob@example.com' }
  ])

  useEffect(() => {
    fetchMaintenance()
  }, [fetchMaintenance])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.assetId || !formData.scheduledDate) {
      showError('Title, asset, and scheduled date are required')
      return
    }

    try {
      if (editingMaintenance) {
        await updateMaintenance(editingMaintenance.id, formData)
        showSuccess('Maintenance record updated successfully')
      } else {
        await createMaintenance(formData)
        showSuccess('Maintenance record created successfully')
      }
      setShowModal(false)
      resetForm()
    } catch (error) {
      showError(error.message || 'Operation failed')
    }
  }

  const handleDelete = async (maintenance) => {
    if (window.confirm(`Are you sure you want to delete maintenance "${maintenance.title}"?`)) {
      try {
        await deleteMaintenance(maintenance.id)
        showSuccess('Maintenance record deleted successfully')
      } catch (error) {
        showError(error.message || 'Failed to delete maintenance record')
      }
    }
  }

  const handleEdit = (maintenance) => {
    setEditingMaintenance(maintenance)
  }

  const handleView = (maintenance) => {
    setSelectedMaintenance(maintenance)
    setShowDetailModal(true)
  }

  const handleStatusUpdate = async (maintenance, newStatus) => {
    try {
      await updateMaintenanceStatus(maintenance.id, newStatus)
      showSuccess(`Maintenance status updated to ${newStatus}`)
    } catch (error) {
      showError(error.message || 'Failed to update status')
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setTypeFilter('')
    setStatusFilter('')
    setPriorityFilter('')
    setAssetFilter('')
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'OVERDUE':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800'
      case 'LOW':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const exportMaintenance = () => {
    try {
      const csvContent = [
        ['ID', 'Title', 'Asset', 'Type', 'Status', 'Priority', 'Scheduled Date', 'Assignee', 'Estimated Cost'],
        ...filteredMaintenance.map(m => [
          m.id,
          m.title,
          m.asset?.name || '',
          m.type,
          m.status,
          m.priority,
          new Date(m.scheduledDate).toLocaleDateString(),
          m.assignee?.name || '',
          m.estimatedCost || 0
        ])
      ].map(row => row.join(',')).join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `maintenance-records-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      showSuccess('Maintenance records exported successfully')
    } catch {
      showError('Failed to export maintenance records')
    }
  }

  const renderDetailModal = () => {
    if (!showDetailModal || !selectedMaintenance) return null

    return (
      <div className="fixed inset-0 bg-white/10 dark:bg-black/30 backdrop-blur-md flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Maintenance Details
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <p className="text-sm text-gray-900">{selectedMaintenance.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <span className="inline-flex px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded-full">
                  {selectedMaintenance.type}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedMaintenance.status)}`}>
                  {selectedMaintenance.status}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedMaintenance.priority)}`}>
                  {selectedMaintenance.priority}
                </span>
              </div>
            </div>

            {selectedMaintenance.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <p className="text-sm text-gray-900">{selectedMaintenance.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Asset</label>
                <p className="text-sm text-gray-900">
                  {selectedMaintenance.asset?.name} ({selectedMaintenance.asset?.assetTag})
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Assignee</label>
                <p className="text-sm text-gray-900">
                  {selectedMaintenance.assignee?.name || 'Not assigned'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Scheduled Date</label>
                <p className="text-sm text-gray-900">
                  {new Date(selectedMaintenance.scheduledDate).toLocaleDateString()}
                </p>
              </div>
              {selectedMaintenance.completedDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Completed Date</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedMaintenance.completedDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Estimated Cost</label>
                <p className="text-sm text-gray-900">
                  {selectedMaintenance.estimatedCost 
                    ? new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR'
                      }).format(selectedMaintenance.estimatedCost)
                    : '-'
                  }
                </p>
              </div>
              {selectedMaintenance.actualCost && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Actual Cost</label>
                  <p className="text-sm text-gray-900">
                    {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR'
                    }).format(selectedMaintenance.actualCost)}
                  </p>
                </div>
              )}
            </div>

            {selectedMaintenance.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <p className="text-sm text-gray-900">{selectedMaintenance.notes}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6 text-sm text-gray-500">
              <div>
                <label className="block text-sm font-medium text-gray-700">Created</label>
                <p>{new Date(selectedMaintenance.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Updated</label>
                <p>{new Date(selectedMaintenance.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>

            {selectedMaintenance.status !== 'COMPLETED' && selectedMaintenance.status !== 'CANCELLED' && (
              <div className="flex space-x-2 pt-4 border-t">
                <button
                  onClick={() => handleStatusUpdate(selectedMaintenance, 'IN_PROGRESS')}
                  className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                >
                  Mark In Progress
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedMaintenance, 'COMPLETED')}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Mark Completed
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedMaintenance, 'CANCELLED')}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderModal = () => {
    if (!showModal) return null

    return (
      <div className="fixed inset-0 bg-white/10 dark:bg-black/30 backdrop-blur-md flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingMaintenance ? 'Edit Maintenance' : 'Add New Maintenance'}
            </h3>
            <button
              onClick={() => {
                setShowModal(false)
                resetForm()
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter maintenance title"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asset *
                </label>
                <select
                  name="assetId"
                  value={formData.assetId}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
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
                  Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PREVENTIVE">Preventive</option>
                  <option value="CORRECTIVE">Corrective</option>
                  <option value="EMERGENCY">Emergency</option>
                  <option value="ROUTINE">Routine</option>
                </select>
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assignee
                </label>
                <select
                  name="assigneeId"
                  value={formData.assigneeId}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Assignee</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Date *
                </label>
                <input
                  type="date"
                  name="scheduledDate"
                  value={formData.scheduledDate}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Cost
              </label>
              <input
                type="number"
                name="estimatedCost"
                value={formData.estimatedCost}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter estimated cost"
                min="0"
                step="0.01"
              />
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Additional notes"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                {editingMaintenance ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                {error}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout title="Maintenance">
      <div className="p-6 space-y-6">
      {/* Header */}
      <div className="glass-header p-6 rounded-lg flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Maintenance</h1>
          <p className="text-gray-600">
            Manage asset maintenance schedules and records
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportMaintenance}
            className="glass-button inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium hover:scale-105 transition-transform"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="glass-button inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium hover:scale-105 transition-transform"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="glass-button inline-flex items-center px-4 py-2 rounded-lg hover:scale-105 transition-transform"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Maintenance
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const IconComponent = {
            Wrench,
            Clock,
            CheckCircle,
            AlertTriangle
          }[stat.icon]

          return (
            <div key={index} className="glass-card p-6 hover:scale-105 transition-transform">
              <div className="flex items-center">
                <div className="gradient-overlay rounded-lg p-3">
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {stat.value}
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
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search maintenance..."
                  className="glass-input pl-10 w-full rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="glass-input w-full rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Types</option>
                <option value="PREVENTIVE">Preventive</option>
                <option value="CORRECTIVE">Corrective</option>
                <option value="EMERGENCY">Emergency</option>
                <option value="ROUTINE">Routine</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Status</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Priorities</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Asset
              </label>
              <select
                value={assetFilter}
                onChange={(e) => setAssetFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Assets</option>
                {assets.map(asset => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Maintenance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asset
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scheduled
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assignee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <Wrench className="animate-spin h-5 w-5 mr-2" />
                      Loading maintenance records...
                    </div>
                  </td>
                </tr>
              ) : filteredMaintenance.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No maintenance records found
                  </td>
                </tr>
              ) : (
                filteredMaintenance.map((maintenance) => (
                  <tr key={maintenance.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Wrench className="h-5 w-5 text-blue-500 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {maintenance.title}
                          </div>
                          {maintenance.description && (
                            <div className="text-sm text-gray-500">
                              {maintenance.description.length > 50 
                                ? `${maintenance.description.substring(0, 50)}...`
                                : maintenance.description
                              }
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {maintenance.asset?.name || 'Unknown Asset'}
                      <div className="text-xs text-gray-500">
                        {maintenance.asset?.assetTag}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded-full">
                        {maintenance.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(maintenance.status)}`}>
                        {maintenance.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(maintenance.priority)}`}>
                        {maintenance.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                        {new Date(maintenance.scheduledDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {maintenance.assignee ? (
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-1" />
                          {maintenance.assignee.name}
                        </div>
                      ) : (
                        <span className="text-gray-500">Not assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(maintenance)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(maintenance)}
                          className="text-green-600 hover:text-green-900"
                          title="Edit Maintenance"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(maintenance)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Maintenance"
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

      {/* Modals */}
      {renderModal()}
      {renderDetailModal()}
      </div>
    </DashboardLayout>
  )
}

export default MaintenancePage
