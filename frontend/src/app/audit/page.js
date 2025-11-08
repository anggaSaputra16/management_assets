'use client'

import { useState, useEffect } from 'react'
import { useAuditStore, useEnumStore } from '@/stores'
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

  const {
    auditActions,
    loading: enumLoading,
    initializeEnums
  } = useEnumStore()

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
    initializeEnums()
  }, [fetchAudits, initializeEnums])

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
        return 'bg-white/60 text-[#111]'
      case 'UPDATE':
        return 'bg-white/60 text-[#111]'
      case 'DELETE':
        return 'bg-white/60 text-[#111]'
      case 'VIEW':
        return 'bg-gray-100 text-[#111]'
      default:
        return 'bg-white/60 text-[#111]'
    }
  }

  const formatEntityType = (entityType) => {
    return entityType.charAt(0).toUpperCase() + entityType.slice(1).toLowerCase()
  }

  const renderDetailModal = () => {
    if (!selectedLog || !showDetailModal) return null

    return (
      <div className="fixed inset-0 bg-white/10 dark:bg-black/30 backdrop-blur-md flex items-center justify-center p-4 z-50">
        <div className="glass-card max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-black/10">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#111]">
                Audit Log Details
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#111]">
                  Action
                </label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionBadgeColor(selectedLog.action)}`}>
                  {selectedLog.action}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111]">
                  Entity Type
                </label>
                <p className="text-sm text-[#111]">{formatEntityType(selectedLog.entityType)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111]">
                  Entity ID
                </label>
                <p className="text-sm text-[#111]">{selectedLog.entityId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111]">
                  Date
                </label>
                <p className="text-sm text-[#111]">
                  {new Date(selectedLog.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            {selectedLog.user && (
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  User
                </label>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-[#111]">{selectedLog.user.name}</p>
                  <p className="text-sm text-[#333]">{selectedLog.user.email}</p>
                  <p className="text-sm text-[#333]">ID: {selectedLog.userId}</p>
                </div>
              </div>
            )}

            {selectedLog.description && (
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Description
                </label>
                <p className="text-sm text-[#111]">{selectedLog.description}</p>
              </div>
            )}

            {selectedLog.oldValues && Object.keys(selectedLog.oldValues).length > 0 && (
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  Old Values
                </label>
                <div className="bg-white/60 rounded-lg p-3">
                  <pre className="text-xs text-[#111] whitespace-pre-wrap">
                    {JSON.stringify(selectedLog.oldValues, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {selectedLog.newValues && Object.keys(selectedLog.newValues).length > 0 && (
              <div>
                <label className="block text-sm font-medium text-[#111] mb-2">
                  New Values
                </label>
                <div className="bg-white/60 rounded-lg p-3">
                  <pre className="text-xs text-[#111] whitespace-pre-wrap">
                    {JSON.stringify(selectedLog.newValues, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {selectedLog.userAgent && (
                <div>
                  <label className="block text-sm font-medium text-[#111]">
                    User Agent
                  </label>
                  <p className="text-sm text-[#333] break-all">{selectedLog.userAgent}</p>
                </div>
              )}
              {selectedLog.ipAddress && (
                <div>
                  <label className="block text-sm font-medium text-[#111]">
                    IP Address
                  </label>
                  <p className="text-sm text-[#111]">{selectedLog.ipAddress}</p>
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
        <div className="bg-white/60 border border-black/10 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-[#111]" />
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111]">Audit Trail</h1>
          <p className="text-[#333]">
            Track all system activities and changes
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-black/10 rounded-lg text-sm font-medium text-[#111] bg-white hover:bg-white/60"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 glass-button text-white rounded-lg hover:scale-105 transition-transform"
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
                  <p className="text-sm font-medium text-[#333]">{stat.title}</p>
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
        <div className="glass-card p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
                  placeholder="Search logs..."
                  className="pl-10 w-full glass-input rounded-lg px-3 py-2 text-[#111] text-sm"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#111] mb-2">
                Entity Type
              </label>
              <select
                value={entityTypeFilter}
                onChange={(e) => setEntityTypeFilter(e.target.value)}
                className="w-full glass-input rounded-lg px-3 py-2 text-[#111] text-sm"
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
              <label className="block text-sm font-medium text-[#111] mb-2">
                Action
              </label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full glass-input rounded-lg px-3 py-2 text-[#111] text-sm"
              >
                <option value="">All Actions</option>
                {auditActions.map(action => (
                  <option key={action.value} value={action.value}>
                    {action.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111] mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={dateRangeFilter.start}
                onChange={(e) => setDateRangeFilter({ ...dateRangeFilter, start: e.target.value })}
                className="w-full glass-input rounded-lg px-3 py-2 text-[#111] text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111] mb-2">
                End Date
              </label>
              <input
                type="date"
                value={dateRangeFilter.end}
                onChange={(e) => setDateRangeFilter({ ...dateRangeFilter, end: e.target.value })}
                className="w-full glass-input rounded-lg px-3 py-2 text-[#111] text-sm"
              />
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="text-sm text-[#333] hover:text-[#111]"
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}

      {/* Audit Logs Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-black/10">
            <thead className="bg-white/60">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#333] uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#333] uppercase tracking-wider">
                  Entity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#333] uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#333] uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#333] uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#333] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-black/10">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-[#333]">
                    <div className="flex items-center justify-center">
                      <Activity className="animate-spin h-5 w-5 mr-2" />
                      Loading audit logs...
                    </div>
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-[#333]">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/60">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Database className="h-4 w-4 text-[#333] mr-2" />
                        <div>
                          <div className="text-sm font-medium text-[#111]">
                            {formatEntityType(log.entityType)}
                          </div>
                          <div className="text-sm text-[#333]">
                            ID: {log.entityId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.user ? (
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-[#333] mr-2" />
                          <div>
                            <div className="text-sm font-medium text-[#111]">
                              {log.user.name}
                            </div>
                            <div className="text-sm text-[#333]">
                              {log.user.email}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-[#333]">Unknown User</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-[#111] max-w-xs truncate">
                        {log.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#333]">
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
                        className="text-[#111] hover:scale-110 transition-transform"
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
        <div className="flex items-center justify-between bg-white px-4 py-3 border border-black/10 rounded-lg">
          <div className="flex items-center">
            <p className="text-sm text-[#111]">
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
              className="inline-flex items-center px-3 py-2 border border-black/10 rounded-lg text-sm font-medium text-[#111] bg-white hover:bg-white/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-[#111]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="inline-flex items-center px-3 py-2 border border-black/10 rounded-lg text-sm font-medium text-[#111] bg-white hover:bg-white/40 disabled:opacity-50 disabled:cursor-not-allowed"
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
