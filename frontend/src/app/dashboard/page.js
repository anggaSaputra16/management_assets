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
  Truck,
  TrendingUp,
  Download,
  Settings,
  Archive,
  Plus
} from 'lucide-react'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState({
    totalAssets: 156,
    availableAssets: 89,
    assignedAssets: 45,
    maintenanceAssets: 8,
    pendingRequests: 12,
    activeRequests: 23,
    completedRequests: 134,
    maintenanceDue: 8,
    totalUsers: 45,
    totalValue: 2500000,
    utilizationRate: 75,
    complianceRate: 92
  })
  const [loading, setLoading] = useState(false)

  // Progress Ring Component
  const ProgressRing = ({ progress, size = 120, strokeWidth = 8, children }) => {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (progress / 100) * circumference

    return (
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size} className="progress-ring">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(107, 114, 128, 0.3)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#374151"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="progress-ring__circle"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      </div>
    )
  }

  const getQuickActions = () => {
    return [
      { name: 'Add Asset', href: '/assets/create', icon: Package, color: 'from-blue-400 to-blue-600' },
      { name: 'Categories', href: '/categories', icon: BarChart3, color: 'from-purple-400 to-purple-600' },
      { name: 'Locations', href: '/locations', icon: MapPin, color: 'from-green-400 to-green-600' },
      { name: 'Vendors', href: '/vendors', icon: Truck, color: 'from-orange-400 to-orange-600' },
      { name: 'New Request', href: '/requests/create', icon: FileText, color: 'from-emerald-400 to-emerald-600' },
      { name: 'Maintenance', href: '/maintenance', icon: Wrench, color: 'from-yellow-400 to-yellow-600' },
      { name: 'Reports', href: '/reports', icon: BarChart3, color: 'from-indigo-400 to-indigo-600' },
      { name: 'Users', href: '/users', icon: Users, color: 'from-pink-400 to-pink-600' },
      { name: 'Departments', href: '/departments', icon: Building, color: 'from-teal-400 to-teal-600' }
    ]
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

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Overall Information Card */}
          <div className="glass-card p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"></div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Overall Information</h3>
              <div className="flex space-x-2">
                <button className="glass-button p-2 rounded-lg">
                  <Settings className="h-4 w-4 text-gray-600" />
                </button>
                <button className="glass-button p-2 rounded-lg">
                  <Download className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">{stats.totalAssets}</div>
                <div className="text-gray-500 text-sm">Total Assets</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">{stats.pendingRequests}</div>
                <div className="text-gray-500 text-sm">Pending Requests</div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="relative glass-button p-4 rounded-xl text-center overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-emerald-400/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative text-2xl font-bold text-gray-700 mb-1">{stats.availableAssets}</div>
                <div className="relative text-gray-500 text-xs">Available</div>
              </div>
              <div className="relative glass-button p-4 rounded-xl text-center overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative text-2xl font-bold text-gray-700 mb-1">{stats.assignedAssets}</div>
                <div className="relative text-gray-500 text-xs">In Use</div>
              </div>
              <div className="relative glass-button p-4 rounded-xl text-center overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-red-400/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative text-2xl font-bold text-gray-700 mb-1">{stats.maintenanceAssets}</div>
                <div className="relative text-gray-500 text-xs">Maintenance</div>
              </div>
            </div>
          </div>

          {/* Weekly Progress */}
          <div className="glass-card p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400"></div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Weekly Progress</h3>
              <button className="glass-button p-2 rounded-lg">
                <TrendingUp className="h-4 w-4 text-gray-600" />
              </button>
            </div>
            
            <div className="flex items-center space-x-4 mb-4">
              <span className="glass-button px-3 py-1 rounded-full text-gray-700 text-sm bg-gradient-to-r from-blue-400/10 to-purple-400/10">Assets</span>
              <span className="text-gray-500 text-sm">Requests</span>
            </div>
            
            {/* Mock Chart Area */}
            <div className="h-32 flex items-end justify-between space-x-2 mb-4">
              {[40, 65, 45, 80, 60, 90, 70].map((height, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-gradient-to-t from-gray-200/30 to-gray-200/10 rounded-t-lg relative"
                    style={{ height: `${height}%` }}
                  >
                    <div 
                      className={`w-full rounded-t-lg absolute bottom-0 ${
                        index === 5 
                          ? 'bg-gradient-to-t from-blue-400 to-purple-400' 
                          : 'bg-gradient-to-t from-blue-300/60 to-purple-300/60'
                      }`}
                      style={{ height: index === 5 ? '100%' : '60%' }}
                    />
                  </div>
                  <div className="text-gray-500 text-xs mt-2">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-center">
              <div className="glass-button px-4 py-2 rounded-lg text-gray-700 text-sm bg-gradient-to-r from-green-400/10 to-emerald-400/10">+24%</div>
              <div className="text-gray-500 text-xs mt-1">compared to last week</div>
            </div>
          </div>

          {/* Month Progress */}
          <div className="glass-card p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400"></div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Month Progress</h3>
              <button className="glass-button p-2 rounded-lg">
                <BarChart3 className="h-4 w-4 text-gray-600" />
              </button>
            </div>
            
            <div className="text-center mb-4">
              <div className="text-green-600 text-sm mb-2 font-medium">+20% compared to last month*</div>
              
              <ProgressRing progress={stats.utilizationRate} size={100}>
                <div className="text-center">
                  <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{stats.utilizationRate}%</div>
                  <div className="text-gray-500 text-xs">Utilization</div>
                </div>
              </ProgressRing>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full mr-2"></div>
                <span className="text-gray-600">Assets</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full mr-2"></div>
                <span className="text-gray-600">Requests</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-green-500 rounded-full mr-2"></div>
                <span className="text-white/80">Maintenance</span>
              </div>
            </div>
            
            <button className="w-full mt-4 glass-button py-2 rounded-lg text-white text-sm">
              Download Report
            </button>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-semibold text-white mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {getQuickActions().slice(0, 10).map((action, index) => (
              <a
                key={index}
                href={action.href}
                className="glass-button p-4 rounded-xl text-center hover:scale-105 transition-all duration-200 group"
              >
                <div className={`w-12 h-12 mx-auto mb-3 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-white text-sm font-medium">{action.name}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Tasks and Goals Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Month Goals */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Month Goals</h3>
              <button className="glass-button p-2 rounded-lg">
                <Plus className="h-4 w-4 text-white" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-3 w-3 text-white" />
                </div>
                <span className="text-white line-through">Process 50 asset requests</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 border-2 border-white/30 rounded-full"></div>
                <span className="text-white/80">Complete maintenance audit</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 border-2 border-white/30 rounded-full"></div>
                <span className="text-white/80">Update asset categories</span>
              </div>
            </div>
          </div>

          {/* Task In Process */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Task In Process (2)</h3>
              <button className="glass-button p-2 rounded-lg">
                <Plus className="h-4 w-4 text-white" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="glass-button p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-medium">Asset Audit Review</h4>
                  <span className="text-white/60 text-sm">Today</span>
                </div>
                <p className="text-white/70 text-sm">Review quarterly asset audit results</p>
              </div>
              
              <div className="glass-button p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-medium">Maintenance Schedule</h4>
                  <span className="text-white/60 text-sm">Tomorrow</span>
                </div>
                <p className="text-white/70 text-sm">Plan next month maintenance tasks</p>
              </div>
              
              <button className="w-full border-2 border-dashed border-white/30 py-8 rounded-xl text-white/60 hover:border-white/50 transition-colors">
                + Add task
              </button>
            </div>
          </div>
        </div>

        {/* Last Projects */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Last Projects</h3>
            <div className="flex items-center space-x-4">
              <span className="text-white/60 text-sm">Sort by</span>
              <div className="flex space-x-2">
                <button className="glass-button p-2 rounded-lg">
                  <div className="grid grid-cols-2 gap-1">
                    <div className="w-2 h-2 bg-white rounded-sm"></div>
                    <div className="w-2 h-2 bg-white rounded-sm"></div>
                    <div className="w-2 h-2 bg-white rounded-sm"></div>
                    <div className="w-2 h-2 bg-white rounded-sm"></div>
                  </div>
                </button>
                <button className="glass-button p-2 rounded-lg">
                  <div className="space-y-1">
                    <div className="w-4 h-0.5 bg-white rounded"></div>
                    <div className="w-4 h-0.5 bg-white rounded"></div>
                    <div className="w-4 h-0.5 bg-white rounded"></div>
                  </div>
                </button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-button p-6 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-semibold">Asset Migration</h4>
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Package className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="text-green-400 text-sm mb-2">● In progress</div>
              <p className="text-white/70 text-sm">Migrate legacy assets to new system database</p>
            </div>
            
            <div className="glass-button p-6 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-semibold">System Integration</h4>
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="text-green-400 text-sm mb-2">● Completed</div>
              <p className="text-white/70 text-sm">Integrate with HR and Finance systems</p>
            </div>
            
            <div className="glass-button p-6 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-semibold">Mobile App</h4>
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <Clock className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="text-blue-400 text-sm mb-2">● In progress</div>
              <p className="text-white/70 text-sm">Develop mobile application for field teams</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}