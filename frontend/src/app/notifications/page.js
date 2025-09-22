'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, CheckCheck, Trash2, Search } from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { useNotificationStore } from '@/stores/notificationStore'
import { useToast } from '@/contexts/ToastContext'

export default function NotificationsPage() {
  const { showSuccess, showError } = useToast()
  const [filter, setFilter] = useState('all') // all, unread, read
  const [searchTerm, setSearchTerm] = useState('')
  
  const {
    notifications,
    loading,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotificationStore()

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || 
                         (filter === 'unread' && !notification.isRead) ||
                         (filter === 'read' && notification.isRead)
    
    const matchesSearch = !searchTerm || 
                         notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead([notificationId])
      showSuccess('Notification marked as read')
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      showError('Failed to mark notification as read')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      showSuccess('All notifications marked as read')
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      showError('Failed to mark all notifications as read')
    }
  }

  const handleDelete = async (notificationId) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      try {
        await deleteNotification(notificationId)
        showSuccess('Notification deleted successfully')
      } catch (error) {
        console.error('Failed to delete notification:', error)
        showError('Failed to delete notification')
      }
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'REQUEST_APPROVAL':
        return '📋'
      case 'ASSET_ALLOCATION':
        return '📦'
      case 'MAINTENANCE_DUE':
        return '🔧'
      case 'AUDIT_SCHEDULED':
        return '📊'
      default:
        return '📢'
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
        <div className="glass-header p-6 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="gradient-overlay p-2 rounded-lg">
              <Bell className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
              <p className="text-gray-600">
                {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
              </p>
            </div>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="glass-button flex items-center px-4 py-2 rounded-lg hover:scale-105 transition-transform"
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark All Read
            </button>
          )}
        </div>

        {/* Filters and Search */}
        <div className="glass-card p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Filter tabs */}
            <div className="flex space-x-1 bg-white/20 backdrop-blur-sm rounded-lg p-1">
              {[
                { key: 'all', label: 'All', count: notifications.length },
                { key: 'unread', label: 'Unread', count: unreadCount },
                { key: 'read', label: 'Read', count: notifications.length - unreadCount }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    filter === tab.key
                      ? 'bg-white/30 text-gray-800 backdrop-blur-sm shadow-sm scale-105'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-white/10'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search notifications..."
                className="glass-input w-full pl-10 pr-4 py-2 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-2">
          {filteredNotifications.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <Bell className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No notifications</h3>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? "You don't have any notifications yet."
                  : `No ${filter} notifications found.`}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg shadow border border-gray-200 p-4 hover:shadow-md transition-shadow ${
                  !notification.isRead ? 'border-l-4 border-l-purple-500' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="text-2xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`text-sm font-medium ${
                          !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h3>
                        <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>
                      
                      <p className={`text-sm ${
                        !notification.isRead ? 'text-gray-800' : 'text-gray-600'
                      } line-clamp-2`}>
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          notification.type === 'REQUEST_APPROVAL' ? 'bg-blue-100 text-blue-800' :
                          notification.type === 'ASSET_ALLOCATION' ? 'bg-green-100 text-green-800' :
                          notification.type === 'MAINTENANCE_DUE' ? 'bg-yellow-100 text-yellow-800' :
                          notification.type === 'AUDIT_SCHEDULED' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {notification.type.replace('_', ' ').toLowerCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {!notification.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete notification"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}