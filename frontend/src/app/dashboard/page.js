'use client'

import { useEffect, useState } from 'react'
import { 
  Package,
  Clock,
  AlertTriangle,
  Wrench,
  Calendar,
  Building,
  TrendingUp,
  Download,
  Settings
} from 'lucide-react'
import Link from 'next/link'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState(null)
  // weeklyData removed per request
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const statsResponse = await api.get('/dashboard/stats')
        if (statsResponse.data.success) {
          setStats(statsResponse.data.data)
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchDashboardData()
    }
  }, [user])

  // Progress Ring Component
  // ProgressRing removed (used by Month/Weekly progress which were removed)

  // Quick actions removed per request (kept helper removed)

  // Loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="glass-card p-6 text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Failed to Load Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="glass-button px-6 py-2 rounded-lg hover:scale-105 transition-transform"
          >
            Retry
          </button>
        </div>
      </DashboardLayout>
    )
  }

  // No data state
  if (!stats) {
    return (
      <DashboardLayout>
        <div className="glass-card p-6 text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Data Available</h2>
          <p className="text-gray-600">Start by adding assets to your system.</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Hi, {user?.firstName || user?.name || 'User'}!
              </h1>
              <p className="text-gray-600">
                Welcome back to Asset Management System. Have a productive day!
              </p>
            </div>
            <div className="text-right text-gray-500 text-sm">
              <div className="flex items-center mb-1">
                <Calendar className="h-4 w-4 mr-2" />
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                {new Date().toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Stock Assets - Main Focus */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Total Stock Assets Card */}
          <div className="glass-card p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"></div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Stock Assets</h3>
              <div className="flex space-x-2">
                <button 
                  onClick={() => window.location.href = '/assets'}
                  className="glass-button p-2 rounded-lg hover:scale-105 transition-transform"
                  title="View All Assets"
                >
                  <Settings className="h-4 w-4 text-gray-600" />
                </button>
                <button className="glass-button p-2 rounded-lg hover:scale-105 transition-transform">
                  <Download className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
                  {stats?.overview?.totalAssets || 0}
                </div>
                <div className="text-gray-500 text-sm">Total Stock</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-1">
                  {stats?.assets?.byStatus?.AVAILABLE || 0}
                </div>
                <div className="text-gray-500 text-sm">Available Stock</div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="relative glass-button p-4 rounded-xl text-center overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative text-2xl font-bold text-gray-700 mb-1">
                  {stats?.assets?.byStatus?.IN_USE || 0}
                </div>
                <div className="relative text-gray-500 text-xs">In Use</div>
              </div>
              <div className="relative glass-button p-4 rounded-xl text-center overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-red-400/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative text-2xl font-bold text-gray-700 mb-1">
                  {stats?.assets?.byStatus?.MAINTENANCE || 0}
                </div>
                <div className="relative text-gray-500 text-xs">Maintenance</div>
              </div>
              <div className="relative glass-button p-4 rounded-xl text-center overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-400/20 to-gray-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative text-2xl font-bold text-gray-700 mb-1">
                  {stats?.assets?.byStatus?.RETIRED || 0}
                </div>
                <div className="relative text-gray-500 text-xs">Retired</div>
              </div>
            </div>
          </div>

          {/* Weekly/Month Progress removed per request */}
        </div>

        {/* Available Assets Detail - Hardware & Software */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-800">Available Assets Detail</h3>
            <Link 
              href="/assets?status=AVAILABLE" 
              className="text-blue-600 text-sm hover:underline flex items-center"
            >
              View All
              <TrendingUp className="h-4 w-4 ml-1" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Hardware Assets Available */}
            <div className="glass-button p-6 rounded-xl hover:scale-105 transition-transform">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Package className="h-8 w-8 text-blue-600 mb-2" />
                  <h4 className="text-lg font-semibold text-gray-800">Hardware Assets</h4>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    {stats?.assets?.byStatus?.AVAILABLE || 0}
                  </div>
                  <div className="text-gray-500 text-sm">Ready to Use</div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Condition: Excellent</span>
                  <span className="font-semibold text-green-600">{stats?.assets?.byCondition?.EXCELLENT || 0}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Condition: Good</span>
                  <span className="font-semibold text-blue-600">{stats?.assets?.byCondition?.GOOD || 0}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Condition: Fair</span>
                  <span className="font-semibold text-yellow-600">{stats?.assets?.byCondition?.FAIR || 0}</span>
                </div>
              </div>
              <button 
                onClick={() => window.location.href = '/assets?status=AVAILABLE'}
                className="w-full mt-4 glass-button py-2 rounded-lg text-blue-600 font-medium hover:bg-blue-50 transition"
              >
                Browse Hardware
              </button>
            </div>

            {/* Software Assets Available */}
            <div className="glass-button p-6 rounded-xl hover:scale-105 transition-transform">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Settings className="h-8 w-8 text-purple-600 mb-2" />
                  <h4 className="text-lg font-semibold text-gray-800">Software Assets</h4>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {stats?.software?.available || 0}
                  </div>
                  <div className="text-gray-500 text-sm">Licenses Available</div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Active Licenses</span>
                  <span className="font-semibold text-green-600">{stats?.software?.active || 0}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Total Software</span>
                  <span className="font-semibold text-blue-600">{stats?.software?.total || 0}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Expiring Soon</span>
                  <span className="font-semibold text-red-600">{stats?.software?.expiringSoon || 0}</span>
                </div>
              </div>
              <button 
                onClick={() => window.location.href = '/master/software-assets'}
                className="w-full mt-4 glass-button py-2 rounded-lg text-purple-600 font-medium hover:bg-purple-50 transition"
              >
                Browse Software
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid - reduced as requested (Users & Compliance removed) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {/* Total Value */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <span className="text-green-600 text-sm font-medium">Assets</span>
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-1">
              ${((stats?.overview?.totalValue || 0) / 1000000).toFixed(2)}M
            </div>
            <div className="text-gray-500 text-sm">Total Asset Value</div>
          </div>

          {/* Maintenance */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <span className="text-orange-600 text-sm font-medium">Maintenance</span>
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-1">
              {stats?.maintenance?.overdue || 0}
            </div>
            <div className="text-gray-500 text-sm">Overdue Tasks</div>
          </div>
        </div>

        {/* Recently Available Assets removed per request */}

  {/* Asset Categories & Locations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Categories */}
          <div className="glass-card p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Top Asset Categories</h3>
            <div className="space-y-4">
              {(stats?.assets?.topCategories || []).slice(0, 5).map((category, index) => {
                const percentage = ((category.count / (stats?.overview?.totalAssets || 1)) * 100).toFixed(1)
                return (
                  <div key={category.categoryId || index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700 font-medium">{category.categoryName}</span>
                      <span className="text-gray-600 text-sm">{category.count} assets</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top Locations */}
          <div className="glass-card p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Top Asset Locations</h3>
            <div className="space-y-4">
              {(stats?.assets?.topLocations || []).slice(0, 5).map((location, index) => {
                const percentage = ((location.count / (stats?.overview?.totalAssets || 1)) * 100).toFixed(1)
                return (
                  <div key={location.locationId || index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700 font-medium">{location.locationName}</span>
                      <span className="text-gray-600 text-sm">{location.count} assets</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Recent Activities removed per request */}

        {/* Quick Actions removed per request */}

        {/* Maintenance & Audit Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Maintenance Summary */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <Wrench className="h-5 w-5 mr-2" />
                Maintenance Overview
              </h3>
              <a 
                href="/maintenance" 
                className="text-blue-600 text-sm hover:underline"
              >
                View All
              </a>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="glass-button p-4 rounded-xl text-center">
                <div className="text-3xl font-bold text-gray-800 mb-1">
                  {stats?.maintenance?.upcoming || 0}
                </div>
                <div className="text-gray-600 text-sm">Upcoming</div>
              </div>
              <div className="glass-button p-4 rounded-xl text-center">
                <div className="text-3xl font-bold text-red-600 mb-1">
                  {stats?.maintenance?.overdue || 0}
                </div>
                <div className="text-gray-600 text-sm">Overdue</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Total Cost (This Month)</span>
                <span className="text-gray-800 font-bold">
                  ${(stats?.maintenance?.totalCost || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Total Maintenance</span>
                <span className="text-gray-800 font-bold">{stats?.maintenance?.total || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Completed</span>
                <span className="text-green-600 font-bold">
                  {stats?.maintenance?.byStatus?.COMPLETED || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Audit Summary removed per request */}
        </div>

        {/* Top Companies by Assets (Departments used as fallback detail) */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-800">Top Companies by Assets</h3>
            <Building className="h-6 w-6 text-gray-600" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {((stats?.companies?.topCompanies && stats.companies.topCompanies.length) ? stats.companies.topCompanies : (stats?.departments?.topDepartments || [])).slice(0, 3).map((item, index) => {
              const name = item.companyName || item.name
              const count = item.count || item.assetCount || 0
              const colors = [
                { bg: 'bg-blue-500', gradient: 'from-blue-400 to-blue-600' },
                { bg: 'bg-green-500', gradient: 'from-green-400 to-green-600' },
                { bg: 'bg-purple-500', gradient: 'from-purple-400 to-purple-600' }
              ]
              const color = colors[index] || colors[0]
              
              return (
                <div key={name + index} className="glass-button p-6 rounded-xl hover:scale-105 transition-transform">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-gray-800 font-semibold">{name}</h4>
                    <div className={`w-12 h-12 bg-gradient-to-r ${color.gradient} rounded-full flex items-center justify-center`}>
                      <Building className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-800 mb-2">
                    {count}
                  </div>
                  <p className="text-gray-600 text-sm">Total Assets</p>
                  <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`bg-gradient-to-r ${color.gradient} h-2 rounded-full`}
                      style={{ width: `${((count / (stats?.overview?.totalAssets || 1)) * 100).toFixed(0)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Asset Status Overview */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">Asset Status Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(stats?.assets?.byStatus || {}).map(([status, count]) => {
              const statusConfig = {
                AVAILABLE: { color: 'from-green-400 to-emerald-500', label: 'Available' },
                IN_USE: { color: 'from-blue-400 to-cyan-500', label: 'In Use' },
                MAINTENANCE: { color: 'from-yellow-400 to-orange-500', label: 'Maintenance' },
                RETIRED: { color: 'from-gray-400 to-gray-500', label: 'Retired' },
                DISPOSED: { color: 'from-red-400 to-pink-500', label: 'Disposed' }
              }
              const config = statusConfig[status] || statusConfig.AVAILABLE
              const percentage = ((count / (stats?.overview?.totalAssets || 1)) * 100).toFixed(1)
              
              return (
                <div key={status} className="glass-button p-4 rounded-xl text-center">
                  <div className={`w-12 h-12 mx-auto mb-3 bg-gradient-to-r ${config.color} rounded-full flex items-center justify-center`}>
                    <Package className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-gray-800 mb-1">{count}</div>
                  <div className="text-gray-600 text-sm mb-1">{config.label}</div>
                  <div className="text-gray-500 text-xs">{percentage}%</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}