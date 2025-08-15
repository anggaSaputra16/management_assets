import { create } from 'zustand'
import { auditService } from '@/lib/services/auditService'

interface AuditLog {
  id: number
  entityType: string
  entityId: number
  action: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  userId: number
  userAgent?: string
  ipAddress?: string
  description?: string
  createdAt: string
  user?: {
    id: number
    name: string
    email: string
  }
}

interface AuditState {
  auditLogs: AuditLog[]
  loading: boolean
  error: string | null
  searchTerm: string
  entityTypeFilter: string
  actionFilter: string
  userFilter: string
  dateRangeFilter: {
    start: string
    end: string
  }
  selectedLog: AuditLog | null
  showDetailModal: boolean
}

interface AuditActions {
  fetchAudits: () => Promise<void>
  fetchAuditsByEntity: (entityType: string, entityId: number) => Promise<void>
  fetchAuditsByUser: (userId: number) => Promise<void>
  fetchAuditsByAction: (action: string) => Promise<void>
  fetchAuditsByDateRange: (startDate: string, endDate: string) => Promise<void>
  exportAudits: (filters?: Record<string, string>) => Promise<void>
  setSearchTerm: (term: string) => void
  setEntityTypeFilter: (entityType: string) => void
  setActionFilter: (action: string) => void
  setUserFilter: (user: string) => void
  setDateRangeFilter: (range: { start: string; end: string }) => void
  setSelectedLog: (log: AuditLog | null) => void
  setShowDetailModal: (show: boolean) => void
  getFilteredAudits: () => AuditLog[]
  getAuditStats: () => Array<{
    title: string
    value: number
    icon: string
    color: string
    textColor: string
    bgColor: string
  }>
}

export const useAuditStore = create<AuditState & AuditActions>((set, get) => ({
  auditLogs: [],
  loading: false,
  error: null,
  searchTerm: '',
  entityTypeFilter: '',
  actionFilter: '',
  userFilter: '',
  dateRangeFilter: {
    start: '',
    end: ''
  },
  selectedLog: null,
  showDetailModal: false,

  fetchAudits: async () => {
    set({ loading: true, error: null })
    try {
      const response = await auditService.getAllAudits()
      set({ auditLogs: response.data || [], loading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch audit logs'
      set({ error: message, loading: false })
    }
  },

  fetchAuditsByEntity: async (entityType, entityId) => {
    set({ loading: true, error: null })
    try {
      const response = await auditService.getAuditsByEntity(entityType, entityId)
      set({ auditLogs: response.data || [], loading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch audit logs'
      set({ error: message, loading: false })
    }
  },

  fetchAuditsByUser: async (userId) => {
    set({ loading: true, error: null })
    try {
      const response = await auditService.getAuditsByUser(userId)
      set({ auditLogs: response.data || [], loading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch audit logs'
      set({ error: message, loading: false })
    }
  },

  fetchAuditsByAction: async (action) => {
    set({ loading: true, error: null })
    try {
      const response = await auditService.getAuditsByAction(action)
      set({ auditLogs: response.data || [], loading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch audit logs'
      set({ error: message, loading: false })
    }
  },

  fetchAuditsByDateRange: async (startDate, endDate) => {
    set({ loading: true, error: null })
    try {
      const response = await auditService.getAuditsByDateRange(startDate, endDate)
      set({ auditLogs: response.data || [], loading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch audit logs'
      set({ error: message, loading: false })
    }
  },

  exportAudits: async (filters = {}) => {
    try {
      const blob = await auditService.exportAudits(filters)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to export audit logs')
    }
  },

  setSearchTerm: (term) => set({ searchTerm: term }),
  setEntityTypeFilter: (entityType) => set({ entityTypeFilter: entityType }),
  setActionFilter: (action) => set({ actionFilter: action }),
  setUserFilter: (user) => set({ userFilter: user }),
  setDateRangeFilter: (range) => set({ dateRangeFilter: range }),
  setSelectedLog: (log) => set({ selectedLog: log }),
  setShowDetailModal: (show) => set({ showDetailModal: show }),

  getFilteredAudits: () => {
    const { auditLogs, searchTerm, entityTypeFilter, actionFilter, userFilter, dateRangeFilter } = get()
    return auditLogs.filter(log => {
      const matchesSearch = !searchTerm || 
        log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entityType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesEntityType = !entityTypeFilter || log.entityType === entityTypeFilter
      const matchesAction = !actionFilter || log.action === actionFilter
      const matchesUser = !userFilter || log.userId?.toString() === userFilter
      
      const matchesDateRange = (!dateRangeFilter.start || new Date(log.createdAt) >= new Date(dateRangeFilter.start)) &&
                              (!dateRangeFilter.end || new Date(log.createdAt) <= new Date(dateRangeFilter.end))
      
      return matchesSearch && matchesEntityType && matchesAction && matchesUser && matchesDateRange
    })
  },

  getAuditStats: () => {
    const { auditLogs } = get()
    const today = new Date()
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    return [
      {
        title: 'Total Logs',
        value: auditLogs.length,
        icon: 'FileText',
        color: 'bg-blue-500',
        textColor: 'text-blue-600',
        bgColor: 'bg-blue-50'
      },
      {
        title: 'This Week',
        value: auditLogs.filter(log => new Date(log.createdAt) >= lastWeek).length,
        icon: 'Calendar',
        color: 'bg-green-500',
        textColor: 'text-green-600',
        bgColor: 'bg-green-50'
      },
      {
        title: 'Create Actions',
        value: auditLogs.filter(log => log.action === 'CREATE').length,
        icon: 'Plus',
        color: 'bg-purple-500',
        textColor: 'text-purple-600',
        bgColor: 'bg-purple-50'
      },
      {
        title: 'Update Actions',
        value: auditLogs.filter(log => log.action === 'UPDATE').length,
        icon: 'Edit',
        color: 'bg-orange-500',
        textColor: 'text-orange-600',
        bgColor: 'bg-orange-50'
      }
    ]
  }
}))
