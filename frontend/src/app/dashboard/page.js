'use client'

import { useEffect, useState } from 'react'
import { 
  Package, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Users,
  Wrench,
  BarChart3,
  Calendar,
  Building,
  MapPin,
  Truck
} from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState({
    totalAssets: 0,
    availableAssets: 0,
    assignedAssets: 0,
    maintenanceAssets: 0,
    pendingRequests: 0,
    activeRequests: 0,
    completedRequests: 0,
    maintenanceDue: 0,
    totalUsers: 0,
    totalValue: 0,
    utilizationRate: 0,
    complianceRate: 0
  })
  const [recentActivities, setRecentActivities] = useState([])
  const [assetsByCategory, setAssetsByCategory] = useState([])
  const [requestsByStatus, setRequestsByStatus] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) return
      
      try {
        setLoading(true)
        
        // Fetch comprehensive statistics
        const [
          assetsRes,
          requestsRes, 
          maintenanceRes,
          usersRes,
          activitiesRes,
          categoriesRes
        ] = await Promise.all([
          api.get('/assets/statistics/overview').catch(() => ({ data: { success: false } })),
          api.get('/requests/statistics/overview').catch(() => ({ data: { success: false } })),
          api.get('/maintenance/stats').catch(() => ({ data: { success: false } })),
          api.get('/users/stats').catch(() => ({ data: { success: false } })),
          api.get('/audit/recent?limit=10').catch(() => ({ data: { success: false } })),
          api.get('/categories').catch(() => ({ data: { success: false } }))
        ])
        
        // Process asset statistics
        let newStats = {
          totalAssets: 0,
          availableAssets: 0,
          assignedAssets: 0,
          maintenanceAssets: 0,
          pendingRequests: 0,
          activeRequests: 0,
          completedRequests: 0,
          maintenanceDue: 0,
          totalUsers: 0,
          totalValue: 0,
          utilizationRate: 0,
          complianceRate: 0
        }
        
        if (assetsRes.data.success) {
          const assetData = assetsRes.data.data
          newStats.totalAssets = assetData.totalAssets || 0
          
          // Calculate assets by status
          const statusCounts = assetData.assetsByStatus?.reduce((acc, item) => {
            acc[item.status] = item._count || 0
            return acc
          }, {}) || {}
          
          newStats.availableAssets = statusCounts.AVAILABLE || 0
          newStats.assignedAssets = statusCounts.ASSIGNED || 0
          newStats.maintenanceAssets = statusCounts.MAINTENANCE || 0
          newStats.totalValue = assetData.totalValue?._sum?.currentValue || 0
          
          // Set category breakdown
          if (categoriesRes.data.success && assetData.assetsByCategory) {
            const categoryMap = categoriesRes.data.data.reduce((acc, cat) => {
              acc[cat.id] = cat.name
              return acc
            }, {})
            
            setAssetsByCategory(assetData.assetsByCategory.map(item => ({
              name: categoryMap[item.categoryId] || 'Unknown',
              count: item._count,
              value: item._sum?.currentValue || 0
            })))
          }
        }
        
        if (requestsRes.data.success) {
          const requestData = requestsRes.data.data
          newStats.pendingRequests = requestData.pendingRequests || 0
          newStats.activeRequests = requestData.approvedRequests || 0
          newStats.completedRequests = requestData.allocatedRequests || 0
          
          // Set request breakdown
          setRequestsByStatus([
            { status: 'PENDING', count: requestData.pendingRequests || 0, color: 'bg-yellow-500' },
            { status: 'APPROVED', count: requestData.approvedRequests || 0, color: 'bg-green-500' },
            { status: 'REJECTED', count: requestData.rejectedRequests || 0, color: 'bg-red-500' },
            { status: 'ALLOCATED', count: requestData.allocatedRequests || 0, color: 'bg-blue-500' }
          ])
        }
        
        if (maintenanceRes.data.success) {
          newStats.maintenanceDue = maintenanceRes.data.data.due || 0
        }
        
        if (usersRes.data.success) {
          newStats.totalUsers = usersRes.data.data.total || 0
        }
        
        // Calculate rates
        if (newStats.totalAssets > 0) {
          newStats.utilizationRate = Math.round(((newStats.assignedAssets / newStats.totalAssets) * 100))
          newStats.complianceRate = Math.round((((newStats.totalAssets - newStats.maintenanceDue) / newStats.totalAssets) * 100))
        }
        
        setStats(newStats)
        
        // Set recent activities
        if (activitiesRes.data.success) {
          setRecentActivities(activitiesRes.data.data || [])
        }
        
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        // Use fallback data
        setStats({
          totalAssets: 156,
          availableAssets: 89,
          pendingRequests: 12,
          maintenanceDue: 8,
          totalUsers: 45,
          activeRequests: 23,
          totalValue: 2500000,
          utilizationRate: 75,
          complianceRate: 92
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [user?.id])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Selamat Pagi'
    if (hour < 17) return 'Selamat Siang'
    return 'Selamat Malam'
  }

  const getRoleDisplayName = (role) => {
    const roleNames = {
      'ADMIN': 'Administrator',
      'ASSET_ADMIN': 'Asset Administrator', 
      'MANAGER': 'Manager',
      'EMPLOYEE': 'Employee',
      'DEPARTMENT_USER': 'Department User',
      'TECHNICIAN': 'Teknisi',
      'AUDITOR': 'Auditor',
      'TOP_MANAGEMENT': 'Top Management'
    }
    return roleNames[role] || role
  }

  // Get role-based quick actions
  const getQuickActions = () => {
    const actions = []
    
    if (['ADMIN', 'ASSET_ADMIN'].includes(user?.role)) {
      actions.push(
        { name: 'Add Asset', href: '/assets/create', icon: Package, color: 'bg-blue-600' },
        { name: 'Categories', href: '/categories', icon: BarChart3, color: 'bg-purple-600' },
        { name: 'Locations', href: '/locations', icon: MapPin, color: 'bg-green-600' },
        { name: 'Vendors', href: '/vendors', icon: Truck, color: 'bg-orange-600' }
      )
    }
    
    actions.push(
      { name: 'New Request', href: '/requests/create', icon: FileText, color: 'bg-emerald-600' },
      { name: 'View Assets', href: '/assets', icon: Package, color: 'bg-blue-600' }
    )
    
    if (['ADMIN', 'ASSET_ADMIN', 'MANAGER'].includes(user?.role)) {
      actions.push(
        { name: 'Reports', href: '/reports', icon: BarChart3, color: 'bg-indigo-600' },
        { name: 'Audit Trail', href: '/audit', icon: Clock, color: 'bg-gray-600' }
      )
    }
    
    if (['TECHNICIAN', 'ADMIN', 'ASSET_ADMIN'].includes(user?.role)) {
      actions.push(
        { name: 'Maintenance', href: '/maintenance', icon: Wrench, color: 'bg-yellow-600' }
      )
    }
    
    if (['ADMIN', 'ASSET_ADMIN'].includes(user?.role)) {
      actions.push(
        { name: 'Users', href: '/users', icon: Users, color: 'bg-pink-600' },
        { name: 'Departments', href: '/departments', icon: Building, color: 'bg-teal-600' }
      )
    }
    
    return actions
  }

  const mainStats = [
    {
      title: 'Total Assets',
      value: stats.totalAssets,
      subtitle: `Value: $${stats.totalValue.toLocaleString()}`,
      icon: Package,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Available Assets', 
      value: stats.availableAssets,
      subtitle: `${stats.utilizationRate}% utilization`,
      icon: CheckCircle,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Pending Requests',
      value: stats.pendingRequests,
      subtitle: `${stats.activeRequests} active`,
      icon: FileText,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Maintenance Due',
      value: stats.maintenanceDue,
      subtitle: `${stats.complianceRate}% compliance`,
      icon: AlertTriangle,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ]

  if (['ADMIN', 'ASSET_ADMIN', 'MANAGER', 'TOP_MANAGEMENT'].includes(user?.role)) {
    mainStats.push({
      title: 'System Users',
      value: stats.totalUsers,
      subtitle: 'Active users',
      icon: Users,
      color: 'bg-purple-500',
      textColor: 'text-purple-600', 
      bgColor: 'bg-purple-50'
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">
            {getGreeting()}, {user?.firstName} {user?.lastName}!
          </h1>
          <p className="text-blue-100">
            Selamat datang di Asset Management System. Anda login sebagai {getRoleDisplayName(user?.role)}.
          </p>
          <div className="mt-4 flex items-center space-x-6 text-sm">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {new Date().toLocaleDateString('id-ID', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {new Date().toLocaleTimeString('id-ID', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {getQuickActions().map((action, index) => (
                <a
                  key={index}
                  href={action.href}
                  className="flex flex-col items-center p-4 text-center hover:bg-gray-50 rounded-lg transition-colors border border-gray-100"
                >
                  <div className={`${action.color} p-3 rounded-lg mb-2`}>
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-900">{action.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Main Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {mainStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : stat.value.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg ml-4`}>
                  <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assets by Category */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Assets by Category</h3>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="animate-pulse space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : assetsByCategory.length > 0 ? (
                <div className="space-y-3">
                  {assetsByCategory.map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">{category.name}</span>
                          <span className="text-sm text-gray-600">{category.count} assets</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ 
                              width: `${Math.min((category.count / stats.totalAssets) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No category data available</p>
              )}
            </div>
          </div>

          {/* Requests by Status */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Requests by Status</h3>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="animate-pulse space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : requestsByStatus.length > 0 ? (
                <div className="space-y-3">
                  {requestsByStatus.map((request, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full ${request.color} mr-3`}></div>
                        <span className="text-sm font-medium text-gray-900">{request.status}</span>
                      </div>
                      <span className="text-sm text-gray-600">{request.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No request data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Recent Activities</h3>
              <a href="/audit" className="text-sm text-blue-600 hover:text-blue-800">View All</a>
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.slice(0, 8).map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">
                        {activity.user?.firstName?.charAt(0)}{activity.user?.lastName?.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{activity.user?.firstName} {activity.user?.lastName}</span>{' '}
                        {activity.action} on {activity.tableName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.createdAt).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activities</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Activity logs will appear here when users perform actions.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
