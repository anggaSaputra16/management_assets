'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { useMaintenanceStore } from '@/stores'
import { useEnumStore } from '@/stores'
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

  const {
    maintenanceTypes,
    maintenanceStatuses,
    priorityLevels,
    loading: enumLoading,
    initializeEnums
  } = useEnumStore()

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
    initializeEnums()
  }, [fetchMaintenance, initializeEnums])

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
        return 'bg-white/60 text-[#111]'
      case 'IN_PROGRESS':
        return 'bg-white/60 text-[#111]'
      case 'COMPLETED':
        return 'bg-white/60 text-[#111]'
      case 'CANCELLED':
        return 'bg-white/60 text-[#111]'
      case 'OVERDUE':
        return 'bg-white/60 text-[#111]'
      default:
        return 'bg-gray-100 text-[#111]'
    }
  }

  const getPriorityColor = (priority) => {
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
        <div className="glass-card max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-black/10">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#111]">
                Maintenance Details
              </h3>
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
                <p className="text-sm text-[#111]">{selectedMaintenance.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111]">Type</label>
                <span className="inline-flex px-2 py-1 text-xs font-semibold bg-white/60 text-[#111] rounded-full">
                  {selectedMaintenance.type}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111]">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedMaintenance.status)}`}>
                  {selectedMaintenance.status}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111]">Priority</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedMaintenance.priority)}`}>
                  {selectedMaintenance.priority}
                </span>
              </div>
            </div>

            {selectedMaintenance.description && (
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">Description</label>
                <p className="text-sm text-[#111]">{selectedMaintenance.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#111]">Asset</label>
                <p className="text-sm text-[#111]">
                  {selectedMaintenance.asset?.name} ({selectedMaintenance.asset?.assetTag})
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111]">Assignee</label>
                <p className="text-sm text-[#111]">
                  {selectedMaintenance.assignee?.name || 'Not assigned'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111]">Scheduled Date</label>
                <p className="text-sm text-[#111]">
                  {new Date(selectedMaintenance.scheduledDate).toLocaleDateString()}
                </p>
              </div>
              {selectedMaintenance.completedDate && (
                <div>
                  <label className="block text-sm font-medium text-[#111]">Completed Date</label>
                  <p className="text-sm text-[#111]">
                    {new Date(selectedMaintenance.completedDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#111]">Estimated Cost</label>
                <p className="text-sm text-[#111]">
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
                  <label className="block text-sm font-medium text-[#111]">Actual Cost</label>
                  <p className="text-sm text-[#111]">
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
                <label className="block text-sm font-medium text-[#111] mb-2">Notes</label>
                <p className="text-sm text-[#111]">{selectedMaintenance.notes}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6 text-sm text-[#333]">
              <div>
                <label className="block text-sm font-medium text-[#111]">Created</label>
                <p>{new Date(selectedMaintenance.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111]">Updated</label>
                <p>{new Date(selectedMaintenance.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Edit History */}
            {selectedMaintenance.editedBy && selectedMaintenance.lastEditedAt && (
              <div className="pt-4 border-t border-black/10">
                <div className="flex items-center text-sm text-[#333]">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>
                    Terakhir diedit oleh <span className="font-medium text-[#111]">
                      {selectedMaintenance.editedByUser ? 
                        `${selectedMaintenance.editedByUser.firstName} ${selectedMaintenance.editedByUser.lastName}` : 
                        'Unknown User'}
                    </span> pada {new Date(selectedMaintenance.lastEditedAt).toLocaleDateString('id-ID', { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              </div>
            )}

            {selectedMaintenance.status !== 'COMPLETED' && selectedMaintenance.status !== 'CANCELLED' && (
              <div className="flex space-x-2 pt-4 border-t">
                <button
                  onClick={() => handleStatusUpdate(selectedMaintenance, 'IN_PROGRESS')}
                  className="px-3 py-1 glass-button text-white rounded text-sm hover:scale-105 transition-transform"
                >
                  Mark In Progress
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedMaintenance, 'COMPLETED')}
                  className="px-3 py-1 glass-button text-white rounded text-sm hover:scale-105 transition-transform"
                >
                  Mark Completed
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedMaintenance, 'CANCELLED')}
                  className="px-3 py-1 glass-button text-white rounded text-sm hover:scale-105 transition-transform"
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
        <div className="glass-card max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#111]">
              {editingMaintenance ? 'Edit Maintenance' : 'Add New Maintenance'}
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#111] mb-1">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full glass-input rounded-lg px-3 py-2 text-[#111] text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                placeholder="Enter maintenance title"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#111] mb-1">
                  Asset *
                </label>
                <select
                  name="assetId"
                  value={formData.assetId}
                  onChange={handleInputChange}
                  className="w-full glass-input rounded-lg px-3 py-2 text-[#111] text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
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
                <label className="block text-sm font-medium text-[#111] mb-1">
                  Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full glass-input rounded-lg px-3 py-2 text-[#111] text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                >
                  <option value="">Select Type</option>
                  {maintenanceTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111] mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full glass-input rounded-lg px-3 py-2 text-[#111] text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30"
                placeholder="Enter description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#111] mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full glass-input rounded-lg px-3 py-2 text-[#111] text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30"
                >
                  <option value="">Select Status</option>
                  {maintenanceStatuses.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111] mb-1">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full glass-input rounded-lg px-3 py-2 text-[#111] text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30"
                >
                  <option value="">Select Priority</option>
                  {priorityLevels.map(priority => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#111] mb-1">
                  Assignee
                </label>
                <select
                  name="assigneeId"
                  value={formData.assigneeId}
                  onChange={handleInputChange}
                  className="w-full glass-input rounded-lg px-3 py-2 text-[#111] text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
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
                <label className="block text-sm font-medium text-[#111] mb-1">
                  Scheduled Date *
                </label>
                <input
                  type="date"
                  name="scheduledDate"
                  value={formData.scheduledDate}
                  onChange={handleInputChange}
                  className="w-full glass-input rounded-lg px-3 py-2 text-[#111] text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111] mb-1">
                Estimated Cost
              </label>
              <input
                type="number"
                name="estimatedCost"
                value={formData.estimatedCost}
                onChange={handleInputChange}
                className="w-full glass-input rounded-lg px-3 py-2 text-[#111] text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                placeholder="Enter estimated cost"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111] mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={2}
                className="w-full glass-input rounded-lg px-3 py-2 text-[#111] text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
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
                className="flex-1 px-4 py-2 border border-black/10 rounded-lg text-sm font-medium text-[#111] hover:bg-white/60"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 glass-button text-white rounded-lg text-sm font-medium hover:scale-105 transition-transform"
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
        <div className="bg-white/60 border border-black/10 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-[#111]" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-[#111]">Error</h3>
              <div className="mt-2 text-sm text-[#111]">
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
          <h1 className="text-2xl font-bold text-[#111]">Maintenance</h1>
          <p className="text-[#333]">
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
                  <p className="text-sm font-medium text-[#333]">{stat.title}</p>
                  <p className="text-2xl font-bold text-[#111]">
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
              <label className="block text-sm font-medium text-[#111] mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#333]" />
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
              <label className="block text-sm font-medium text-[#111] mb-2">
                Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="glass-input w-full rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Types</option>
                {maintenanceTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111] mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full glass-input rounded-lg px-3 py-2 text-[#111] text-sm"
              >
                <option value="">All Status</option>
                {maintenanceStatuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111] mb-2">
                Priority
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full glass-input rounded-lg px-3 py-2 text-[#111] text-sm"
              >
                <option value="">All Priorities</option>
                {priorityLevels.map(priority => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111] mb-2">
                Asset
              </label>
              <select
                value={assetFilter}
                onChange={(e) => setAssetFilter(e.target.value)}
                className="w-full glass-input rounded-lg px-3 py-2 text-[#111] text-sm"
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
                className="w-full px-4 py-2 border border-black/10 rounded-lg text-sm text-[#111] hover:bg-white/60"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-black/10">
            <thead className="bg-white/60">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#333] uppercase tracking-wider">
                  Maintenance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#333] uppercase tracking-wider">
                  Asset
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#333] uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#333] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#333] uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#333] uppercase tracking-wider">
                  Scheduled
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#333] uppercase tracking-wider">
                  Assignee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#333] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-black/10">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-[#333]">
                    <div className="flex items-center justify-center">
                      <Wrench className="animate-spin h-5 w-5 mr-2" />
                      Loading maintenance records...
                    </div>
                  </td>
                </tr>
              ) : filteredMaintenance.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-[#333]">
                    No maintenance records found
                  </td>
                </tr>
              ) : (
                filteredMaintenance.map((maintenance) => (
                  <tr key={maintenance.id} className="hover:bg-white/60">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Wrench className="h-5 w-5 text-[#111] mr-3" />
                        <div>
                          <div className="text-sm font-medium text-[#111]">
                            {maintenance.title}
                          </div>
                          {maintenance.description && (
                            <div className="text-sm text-[#333]">
                              {maintenance.description.length > 50 
                                ? `${maintenance.description.substring(0, 50)}...`
                                : maintenance.description
                              }
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#111]">
                      {maintenance.asset?.name || 'Unknown Asset'}
                      <div className="text-xs text-[#333]">
                        {maintenance.asset?.assetTag}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold bg-white/60 text-[#111] rounded-full">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#111]">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-[#333] mr-1" />
                        {new Date(maintenance.scheduledDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#111]">
                      {maintenance.assignee ? (
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-[#333] mr-1" />
                          {maintenance.assignee.name}
                        </div>
                      ) : (
                        <span className="text-[#333]">Not assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(maintenance)}
                          className="text-[#111] hover:scale-110 transition-transform"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(maintenance)}
                          className="text-[#111] hover:scale-110 transition-transform"
                          title="Edit Maintenance"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(maintenance)}
                          className="text-[#111] hover:scale-110 transition-transform"
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
