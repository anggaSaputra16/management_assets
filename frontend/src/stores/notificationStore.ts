import { create } from 'zustand'
import { notificationService } from '@/lib/services'

// Type definitions
interface Notification {
  id: string
  title: string
  message: string
  type: 'REQUEST_APPROVAL' | 'ASSET_ALLOCATION' | 'MAINTENANCE_DUE' | 'AUDIT_SCHEDULED' | 'GENERAL'
  isRead: boolean
  userId: string
  createdAt: string
  updatedAt: string
}

interface ApiError {
  response?: {
    data?: {
      message?: string
    }
  }
  message?: string
}

interface NotificationFilters {
  isRead?: boolean
  type: string
}

interface NotificationPagination {
  current: number
  pages: number
  total: number
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  pagination: NotificationPagination
  filters: NotificationFilters
}

interface NotificationData {
  title: string
  message: string
  type: string
  userId?: string
}

interface BroadcastData {
  title: string
  message: string
  type: string
  userIds: string[]
}

interface RoleData {
  title: string
  message: string
  type: string
  roles: string[]
  departmentId?: string
}

interface NotificationActions {
  fetchNotifications: (params?: Record<string, string | number | boolean>) => Promise<void>
  getNotification: (id: string) => Promise<Notification | null>
  createNotification: (notificationData: NotificationData) => Promise<unknown>
  broadcastNotification: (broadcastData: BroadcastData) => Promise<unknown>
  broadcastToRole: (roleData: RoleData) => Promise<unknown>
  markAsRead: (notificationIds: string[]) => Promise<unknown>
  markAllAsRead: () => Promise<unknown>
  deleteNotification: (id: string) => Promise<unknown>
  deleteAllRead: () => Promise<unknown>
  getStatistics: () => Promise<unknown>
  setFilters: (filters: Partial<NotificationFilters>) => void
  clearFilters: () => void
  clearError: () => void
  reset: () => void
  getUnreadNotifications: () => Notification[]
  getNotificationsByType: (type: string) => Notification[]
}

type NotificationStore = NotificationState & NotificationActions

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  pagination: {
    current: 1,
    pages: 1,
    total: 0
  },
  filters: {
    isRead: undefined,
    type: ''
  }
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  ...initialState,

  // Actions
  fetchNotifications: async (params = {}) => {
    set({ loading: true, error: null })
    try {
      const currentFilters = get().filters
      const finalParams = { ...currentFilters, ...params }
      
      const response = await notificationService.getNotifications(finalParams)
      if (response.success) {
        set({
          notifications: response.data.notifications,
          unreadCount: response.data.unreadCount,
          pagination: response.data.pagination
        })
      }
    } catch (error: unknown) {
      const err = error as ApiError
      const message = err?.response?.data?.message || err?.message || 'Failed to fetch notifications'
      set({ error: message })
    } finally {
      set({ loading: false })
    }
  },

  getNotification: async (id) => {
    set({ loading: true, error: null })
    try {
      const response = await notificationService.getNotification(id)
      return response.success ? response.data : null
    } catch (error: unknown) {
      const err = error as ApiError
      const message = err.response?.data?.message || err.message || 'Failed to fetch notification'
      set({ error: message })
      return null
    } finally {
      set({ loading: false })
    }
  },

  createNotification: async (notificationData: NotificationData) => {
    set({ loading: true, error: null })
    try {
      const response = await notificationService.createNotification(notificationData)
      if (response.success) {
        // Refresh notifications
        await get().fetchNotifications()
        return response.data
      }
    } catch (error: unknown) {
      const err = error as ApiError
      const message = err.response?.data?.message || err.message || 'Failed to create notification'
      set({ error: message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  broadcastNotification: async (broadcastData) => {
    set({ loading: true, error: null })
    try {
      const response = await notificationService.broadcastNotification(broadcastData)
      if (response.success) {
        return response.data
      }
    } catch (error: unknown) {
      const err = error as ApiError
      const message = err.response?.data?.message || err.message || 'Failed to broadcast notification'
      set({ error: message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  broadcastToRole: async (roleData) => {
    set({ loading: true, error: null })
    try {
      const response = await notificationService.broadcastToRole(roleData)
      if (response.success) {
        return response.data
      }
    } catch (error: unknown) {
      const err = error as ApiError
      const message = err.response?.data?.message || err.message || 'Failed to broadcast to role'
      set({ error: message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  markAsRead: async (notificationIds) => {
    try {
      const response = await notificationService.markAsRead(notificationIds)
      if (response.success) {
        // Update local state
        set(state => ({
          notifications: state.notifications.map(notification =>
            notificationIds.includes(notification.id)
              ? { ...notification, isRead: true }
              : notification
          ),
          unreadCount: Math.max(0, state.unreadCount - notificationIds.length)
        }))
        return response.data
      }
    } catch (error: unknown) {
      const err = error as ApiError
      const message = err.response?.data?.message || err.message || 'Failed to mark as read'
      set({ error: message })
      throw error
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await notificationService.markAllAsRead()
      if (response.success) {
        // Update local state
        set(state => ({
          notifications: state.notifications.map(notification => ({
            ...notification,
            isRead: true
          })),
          unreadCount: 0
        }))
        return response.data
      }
    } catch (error: unknown) {
      const err = error as ApiError
      const message = err.response?.data?.message || err.message || 'Failed to mark all as read'
      set({ error: message })
      throw error
    }
  },

  deleteNotification: async (id) => {
    try {
      const response = await notificationService.deleteNotification(id)
      if (response.success) {
        // Remove from local state
        set(state => ({
          notifications: state.notifications.filter(notification => notification.id !== id),
          unreadCount: state.notifications.find(n => n.id === id && !n.isRead) 
            ? state.unreadCount - 1 
            : state.unreadCount
        }))
        return response.data
      }
    } catch (error: unknown) {
      const err = error as ApiError
      const message = err.response?.data?.message || err.message || 'Failed to delete notification'
      set({ error: message })
      throw error
    }
  },

  deleteAllRead: async () => {
    try {
      const response = await notificationService.deleteAllRead()
      if (response.success) {
        // Remove read notifications from local state
        set(state => ({
          notifications: state.notifications.filter(notification => !notification.isRead)
        }))
        return response.data
      }
    } catch (error: unknown) {
      const err = error as ApiError
      const message = err.response?.data?.message || err.message || 'Failed to delete read notifications'
      set({ error: message })
      throw error
    }
  },

  getStatistics: async () => {
    try {
      const response = await notificationService.getStatistics()
      return response.success ? response.data : null
    } catch (error: unknown) {
      const err = error as ApiError
      const message = err.response?.data?.message || err.message || 'Failed to fetch statistics'
      set({ error: message })
      return null
    }
  },

  // Filter actions
  setFilters: (filters) => {
    set(state => ({
      filters: { ...state.filters, ...filters }
    }))
  },

  clearFilters: () => {
    set({ filters: { isRead: undefined, type: '' } })
  },

  // State management
  clearError: () => set({ error: null }),
  
  reset: () => set(initialState),

  // Computed values
  getUnreadNotifications: () => {
    const { notifications } = get()
    return notifications.filter(notification => !notification.isRead)
  },

  getNotificationsByType: (type) => {
    const { notifications } = get()
    return notifications.filter(notification => notification.type === type)
  }
}))
