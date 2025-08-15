'use client'

import { useState, useEffect } from 'react'
import { useAuditStore } from '@/stores'
import {
  FileText,
  Calendar,
  Plus,
  Edit,
  Eye,
  Download,
  Search,
  Filter,
  User,
  Database,
  Activity,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react'

const AuditPage = () => {
  const {
    loading,
    error,
    searchTerm,
    entityTypeFilter,
    actionFilter,
    userFilter,
    dateRangeFilter,
    selectedLog,
    showDetailModal,
    fetchAudits,
    exportAudits,
    setSearchTerm,
    setEntityTypeFilter,
    setActionFilter,
    setUserFilter,
    setDateRangeFilter,
    setSelectedLog,
    setShowDetailModal,
    getFilteredAudits,
    getAuditStats
  } = useAuditStore()

  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const auditLogs = getFilteredAudits()
  const stats = getAuditStats()
  const totalPages = Math.ceil(auditLogs.length / itemsPerPage)
  const paginatedLogs = auditLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  useEffect(() => {
    fetchAudits()
  }, [fetchAudits])

  const handleExport = async () => {
    try {
      await exportAudits({
        searchTerm,
        entityType: entityTypeFilter,
        action: actionFilter,
        user: userFilter,
        startDate: dateRangeFilter.start,
        endDate: dateRangeFilter.end
      })
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setEntityTypeFilter('')
    setActionFilter('')
    setUserFilter('')
    setDateRangeFilter({ start: '', end: '' })
    setCurrentPage(1)
  }

  const getActionBadgeColor = (action) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800'
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800'
      case 'DELETE':
        return 'bg-red-100 text-red-800'
      case 'VIEW':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-purple-100 text-purple-800'
    }
  }

  const formatEntityType = (entityType) => {
    return entityType.charAt(0).toUpperCase() + entityType.slice(1).toLowerCase()
  }

  const renderDetailModal = () => {
    if (!selectedLog || !showDetailModal) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Audit Log Details
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Action
                </label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionBadgeColor(selectedLog.action)}`}>
                  {selectedLog.action}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Entity Type
                </label>
                <p className="text-sm text-gray-900">{formatEntityType(selectedLog.entityType)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Entity ID
                </label>
                <p className="text-sm text-gray-900">{selectedLog.entityId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date
                </label>
                <p className="text-sm text-gray-900">
                  {new Date(selectedLog.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            {selectedLog.user && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User
                </label>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-900">{selectedLog.user.name}</p>
                  <p className="text-sm text-gray-600">{selectedLog.user.email}</p>
                  <p className="text-sm text-gray-600">ID: {selectedLog.userId}</p>
                </div>
              </div>
            )}

            {selectedLog.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <p className="text-sm text-gray-900">{selectedLog.description}</p>
              </div>
            )}

            {selectedLog.oldValues && Object.keys(selectedLog.oldValues).length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Old Values
                </label>
                <div className="bg-red-50 rounded-lg p-3">
                  <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                    {JSON.stringify(selectedLog.oldValues, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {selectedLog.newValues && Object.keys(selectedLog.newValues).length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Values
                </label>
                <div className="bg-green-50 rounded-lg p-3">
                  <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                    {JSON.stringify(selectedLog.newValues, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {selectedLog.userAgent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    User Agent
                  </label>
                  <p className="text-sm text-gray-600 break-all">{selectedLog.userAgent}</p>
                </div>
              )}
              {selectedLog.ipAddress && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    IP Address
                  </label>
                  <p className="text-sm text-gray-900">{selectedLog.ipAddress}</p>
                </div>
              )}
            </div>
          </div>
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
              <X className="h-5 w-5 text-red-400" />
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
          <p className="text-gray-600">
            Track all system activities and changes
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const IconComponent = {
            FileText,
            Calendar,
            Plus,
            Edit
          }[stat.icon]

          return (
            <div key={index} className={`${stat.bgColor} rounded-lg p-6`}>
              <div className="flex items-center">
                <div className={`${stat.color} rounded-lg p-3`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className={`text-2xl font-bold ${stat.textColor}`}>
                    {stat.value.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
                  placeholder="Search logs..."
                  className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Entity Type
              </label>
              <select
                value={entityTypeFilter}
                onChange={(e) => setEntityTypeFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Types</option>
                <option value="assets">Assets</option>
                <option value="users">Users</option>
                <option value="categories">Categories</option>
                <option value="locations">Locations</option>
                <option value="vendors">Vendors</option>
                <option value="departments">Departments</option>
                <option value="requests">Requests</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action
              </label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Actions</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="VIEW">View</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={dateRangeFilter.start}
                onChange={(e) => setDateRangeFilter({ ...dateRangeFilter, start: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={dateRangeFilter.end}
                onChange={(e) => setDateRangeFilter({ ...dateRangeFilter, end: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}

      {/* Audit Logs Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <Activity className="animate-spin h-5 w-5 mr-2" />
                      Loading audit logs...
                    </div>
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Database className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatEntityType(log.entityType)}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {log.entityId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.user ? (
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {log.user.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {log.user.email}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Unknown User</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {log.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedLog(log)
                          setShowDetailModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
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
        <div className="flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-lg">
          <div className="flex items-center">
            <p className="text-sm text-gray-700">
              Showing{' '}
              <span className="font-medium">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{' '}
              to{' '}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, auditLogs.length)}
              </span>{' '}
              of{' '}
              <span className="font-medium">{auditLogs.length}</span>{' '}
              results
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {renderDetailModal()}
    </div>
  )
}

export default AuditPage
