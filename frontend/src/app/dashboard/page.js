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

  // Loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black/10 mx-auto"></div>
            <p className="mt-4 text-[#333]">Loading dashboard data...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="glass-card p-4 sm:p-6 text-center">
          <AlertTriangle className="h-16 w-16 text-[#111] mx-auto mb-4" />
          <h2 className="text-lg sm:text-xl font-semibold text-[#111] mb-2">Failed to Load Dashboard</h2>
          <p className="text-[#333] mb-4 text-sm sm:text-base">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="glass-button px-4 sm:px-6 py-2 rounded-lg md:hover:scale-105 transition-transform"
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
        <div className="glass-card p-4 sm:p-6 text-center">
          <Package className="h-16 w-16 text-[#333] mx-auto mb-4" />
          <h2 className="text-lg sm:text-xl font-semibold text-[#111] mb-2">No Data Available</h2>
          <p className="text-[#333] text-sm sm:text-base">Start by adding assets to your system.</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 px-4 sm:px-6 overflow-x-hidden">
        {/* Header Section */}
        <div className="glass-card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#111] mb-1 sm:mb-2">
                Hi, {user?.firstName || user?.name || 'User'}!
              </h1>
              <p className="text-[#333] text-sm sm:text-base">
                Welcome back to Asset Management System. Have a productive day!
              </p>
            </div>
            <div className="text-left sm:text-right text-[#333] text-xs sm:text-sm">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Total Stock Assets Card */}
          <div className="glass-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-[#111]">Stock Assets</h3>
              <div className="flex space-x-2">
                <button 
                  onClick={() => window.location.href = '/assets'}
                  className="glass-button p-2 rounded-lg md:hover:scale-105 transition-transform"
                  title="View All Assets"
                >
                  <Settings className="h-4 w-4 text-[#111]" />
                </button>
                <button className="glass-button p-2 rounded-lg md:hover:scale-105 transition-transform">
                  <Download className="h-4 w-4 text-[#111]" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-6">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#111] mb-1">
                  {stats?.overview?.totalAssets || 0}
                </div>
                <div className="text-[#333] text-xs sm:text-sm">Total Stock</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#111] mb-1">
                  {stats?.assets?.byStatus?.AVAILABLE || 0}
                </div>
                <div className="text-[#333] text-xs sm:text-sm">Available Stock</div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="glass-button p-4 rounded-xl text-center">
                <div className="text-xl sm:text-2xl font-bold text-[#111] mb-1">
                  {stats?.assets?.byStatus?.IN_USE || 0}
                </div>
                <div className="text-[#333] text-xs">In Use</div>
              </div>
              <div className="glass-button p-4 rounded-xl text-center">
                <div className="text-xl sm:text-2xl font-bold text-[#111] mb-1">
                  {stats?.assets?.byStatus?.MAINTENANCE || 0}
                </div>
                <div className="text-[#333] text-xs">Maintenance</div>
              </div>
              <div className="glass-button p-4 rounded-xl text-center">
                <div className="text-xl sm:text-2xl font-bold text-[#111] mb-1">
                  {stats?.assets?.byStatus?.RETIRED || 0}
                </div>
                <div className="text-[#333] text-xs">Retired</div>
              </div>
            </div>
          </div>

          {/* Maintenance & Audit Summary - placed next to Stock Assets */}
          <div className="glass-card p-4 sm:p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-[#111] flex items-center">
                <Wrench className="h-5 w-5 mr-2" />
                Maintenance & Audit
              </h3>
              <div className="flex space-x-2">
                <a href="/maintenance" className="glass-button p-2 rounded-lg md:hover:scale-105 transition-transform" title="Maintenance">
                  <Wrench className="h-4 w-4 text-[#111]" />
                </a>
                <a href="/audit" className="glass-button p-2 rounded-lg md:hover:scale-105 transition-transform" title="Audit">
                  <Calendar className="h-4 w-4 text-[#111]" />
                </a>
              </div>
            </div>

            {/* Top (big) stats like Stock Assets layout */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-6">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#111] mb-1">
                  {stats?.maintenance?.upcoming || 0}
                </div>
                <div className="text-[#333] text-xs sm:text-sm">Upcoming Maint.</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#111] mb-1">
                  {stats?.maintenance?.overdue || 0}
                </div>
                <div className="text-[#333] text-xs sm:text-sm">Overdue Maint.</div>
              </div>
            </div>

            {/* Mini cards grid similar to Stock Assets bottom section */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">

              <div className="glass-button p-4 rounded-xl text-center">
                <div className="text-xl sm:text-2xl font-bold text-[#111] mb-1">
                  {(stats?.audit?.scheduled ?? stats?.audit?.byStatus?.SCHEDULED ?? 0)}
                </div>
                <div className="text-[#333] text-xs">Scheduled</div>
              </div>
              <div className="glass-button p-4 rounded-xl text-center">
                <div className="text-xl sm:text-2xl font-bold text-[#111] mb-1">
                  {(stats?.audit?.inProgress ?? stats?.audit?.byStatus?.IN_PROGRESS ?? 0)}
                  </div>
                <div className="text-[#333] text-xs">In Progress</div>
              </div>
                <div className="glass-button p-4 rounded-xl text-center">
                  <div className="text-xl sm:text-2xl font-bold text-[#111] mb-1">
                    {stats?.maintenance?.byStatus?.COMPLETED || 0}
                  </div>
                <div className="text-[#333] text-xs">Completed</div>
              </div>
            </div>
          </div>

          {/* Weekly/Month Progress removed per request */}
        </div>

        {/* Available Assets Detail - Hardware & Software */}
        <div className="glass-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-semibold text-[#111]">Available Assets Detail</h3>
            <Link 
              href="/assets?status=AVAILABLE" 
              className="text-[#111] text-sm hover:underline flex items-center"
            >
              View All
              <TrendingUp className="h-4 w-4 ml-1" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Hardware Assets Available */}
            <div className="glass-button p-4 sm:p-6 rounded-xl md:hover:scale-105 transition-transform">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Package className="h-6 w-6 md:h-8 md:w-8 text-[#111] mb-2" />
                  <h4 className="text-base sm:text-lg font-semibold text-[#111]">Hardware Assets</h4>
                </div>
                <div className="text-right">
                  <div className="text-2xl sm:text-3xl font-bold text-[#111]">
                    {stats?.assets?.byStatus?.AVAILABLE || 0}
                  </div>
                  <div className="text-[#333] text-xs sm:text-sm">Ready to Use</div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-[#333]">
                  <span>Condition: Excellent</span>
                  <span className="font-semibold text-[#111]">{stats?.assets?.byCondition?.EXCELLENT || 0}</span>
                </div>
                <div className="flex justify-between text-[#333]">
                  <span>Condition: Good</span>
                  <span className="font-semibold text-[#111]">{stats?.assets?.byCondition?.GOOD || 0}</span>
                </div>
                <div className="flex justify-between text-[#333]">
                  <span>Condition: Fair</span>
                  <span className="font-semibold text-[#111]">{stats?.assets?.byCondition?.FAIR || 0}</span>
                </div>
              </div>
              <button 
                onClick={() => window.location.href = '/assets?status=AVAILABLE'}
                className="w-full mt-4 glass-button py-2 rounded-lg text-[#111] font-medium md:hover:scale-105 transition-transform"
              >
                Browse Hardware
              </button>
            </div>

            {/* Software Assets Available */}
            <div className="glass-button p-4 sm:p-6 rounded-xl md:hover:scale-105 transition-transform">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Settings className="h-6 w-6 md:h-8 md:w-8 text-[#111] mb-2" />
                  <h4 className="text-base sm:text-lg font-semibold text-[#111]">Software Assets</h4>
                </div>
                <div className="text-right">
                  <div className="text-2xl sm:text-3xl font-bold text-[#111]">
                    {stats?.software?.available || 0}
                  </div>
                  <div className="text-[#333] text-xs sm:text-sm">Licenses Available</div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-[#333]">
                  <span>Active Licenses</span>
                  <span className="font-semibold text-[#111]">{stats?.software?.active || 0}</span>
                </div>
                <div className="flex justify-between text-[#333]">
                  <span>Total Software</span>
                  <span className="font-semibold text-[#111]">{stats?.software?.total || 0}</span>
                </div>
                <div className="flex justify-between text-[#333]">
                  <span>Expiring Soon</span>
                  <span className="font-semibold text-[#111]">{stats?.software?.expiringSoon || 0}</span>
                </div>
              </div>
              <button 
                onClick={() => window.location.href = '/master/software-assets'}
                className="w-full mt-4 glass-button py-2 rounded-lg text-[#111] font-medium md:hover:scale-105 transition-transform"
              >
                Browse Software
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid - reduced as requested (Users & Compliance removed) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Total Value */}
          <div className="glass-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-transparent to-emerald-500 rounded-xl">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <span className="text-[#111] text-sm font-medium">Assets</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#111] mb-1">
              ${((stats?.overview?.totalValue || 0) / 1000000).toFixed(2)}M
            </div>
            <div className="text-[#333] text-sm">Total Asset Value</div>
          </div>

          {/* Maintenance */}
          <div className="glass-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <span className="text-[#111] text-sm font-medium">Maintenance</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#111] mb-1">
              {stats?.maintenance?.overdue || 0}
            </div>
            <div className="text-[#333] text-sm">Overdue Tasks</div>
          </div>
        </div>

        {/* Asset Categories & Locations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Top Categories */}
          <div className="glass-card p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold text-[#111] mb-4 sm:mb-6">Top Asset Categories</h3>
            <div className="space-y-4">
              {(stats?.assets?.topCategories || []).slice(0, 5).map((category, index) => {
                const percentage = ((category.count / (stats?.overview?.totalAssets || 1)) * 100).toFixed(1)
                return (
                  <div key={category.categoryId || index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[#111] font-medium">{category.categoryName}</span>
                      <span className="text-[#333] text-sm">{category.count} assets</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-transparent to-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top Locations */}
          <div className="glass-card p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold text-[#111] mb-4 sm:mb-6">Top Asset Locations</h3>
            <div className="space-y-4">
              {(stats?.assets?.topLocations || []).slice(0, 5).map((location, index) => {
                const percentage = ((location.count / (stats?.overview?.totalAssets || 1)) * 100).toFixed(1)
                return (
                  <div key={location.locationId || index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[#111] font-medium">{location.locationName}</span>
                      <span className="text-[#333] text-sm">{location.count} assets</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-transparent to-emerald-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Top Companies by Assets (Departments used as fallback detail) */}
        <div className="glass-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg sm:text-xl font-semibold text-[#111]">Top Companies by Assets</h3>
            <Building className="h-6 w-6 text-[#333]" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {((stats?.companies?.topCompanies && stats.companies.topCompanies.length) ? stats.companies.topCompanies : (stats?.departments?.topDepartments || [])).slice(0, 3).map((item, index) => {
              const name = item.companyName || item.name
              const count = item.count || item.assetCount || 0
              const colors = [
                { bg: 'bg-white/600', gradient: 'from-transparent to-transparent' },
                { bg: 'bg-white/600', gradient: 'from-transparent to-transparent' },
                { bg: 'bg-white/600', gradient: 'from-purple-400 to-purple-600' }
              ]
              const color = colors[index] || colors[0]
              
              return (
                <div key={name + index} className="glass-button p-4 sm:p-6 rounded-xl md:hover:scale-105 transition-transform">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[#111] font-semibold truncate max-w-[60%]">{name}</h4>
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r ${color.gradient} rounded-full flex items-center justify-center`}>
                      <Building className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-[#111] mb-2">
                    {count}
                  </div>
                  <p className="text-[#333] text-sm">Total Assets</p>
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
        <div className="glass-card p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold text-[#111] mb-4 sm:mb-6">Asset Status Overview</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
            {Object.entries(stats?.assets?.byStatus || {}).map(([status, count]) => {
              const statusConfig = {
                AVAILABLE: { color: 'from-transparent to-emerald-500', label: 'Available' },
                IN_USE: { color: 'from-transparent to-cyan-500', label: 'In Use' },
                MAINTENANCE: { color: 'from-yellow-400 to-orange-500', label: 'Maintenance' },
                RETIRED: { color: 'from-gray-400 to-gray-500', label: 'Retired' },
                DISPOSED: { color: 'from-red-400 to-pink-500', label: 'Disposed' }
              }
              const config = statusConfig[status] || statusConfig.AVAILABLE
              const percentage = ((count / (stats?.overview?.totalAssets || 1)) * 100).toFixed(1)
              
              return (
                <div key={status} className="glass-button p-4 rounded-xl text-center">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 bg-gradient-to-r ${config.color} rounded-full flex items-center justify-center`}>
                    <Package className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-[#111] mb-1">{count}</div>
                  <div className="text-[#333] text-xs sm:text-sm mb-1">{config.label}</div>
                  <div className="text-[#333] text-xs">{percentage}%</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}