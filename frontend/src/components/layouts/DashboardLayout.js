'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { 
  Package,
  Users,
  FileText,
  Settings,
  Building,
  MapPin,
  Truck,
  Wrench,
  Bell,
  BarChart3,
  Search,
  Menu,
  X,
  LogOut,
  User,
  Shield,
  Home,
  GitBranch,
  Cog
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { getGreeting, getRoleDisplayName } from '@/lib/utils'

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Assets', href: '/assets', icon: Package },
  { name: 'Requests', href: '/requests', icon: FileText },
  { name: 'Spare Parts', href: '/spare-parts', icon: Cog, roles: ['ADMIN', 'ASSET_ADMIN', 'TECHNICIAN'] },
  { name: 'Users', href: '/users', icon: Users, roles: ['ADMIN', 'ASSET_ADMIN'] },
  { name: 'Departments', href: '/departments', icon: Building },
  { name: 'Maintenance', href: '/maintenance', icon: Wrench },
  { name: 'Decomposition', href: '/decomposition', icon: GitBranch, roles: ['ADMIN', 'ASSET_ADMIN', 'TECHNICIAN'] },
  { name: 'Categories', href: '/categories', icon: Settings },
  { name: 'Locations', href: '/locations', icon: MapPin },
  { name: 'Vendors', href: '/vendors', icon: Truck },
  { name: 'Audit', href: '/audit', icon: Shield, roles: ['ADMIN', 'AUDITOR'] },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Reports', href: '/reports', icon: BarChart3 }
]

export default function DashboardLayout({ children, title }) {
  const { user, logout, isHydrated } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (isHydrated && !user) {
      router.push('/login')
    }
  }, [user, isHydrated, router])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const filteredMenuItems = menuItems.filter(item => 
    !item.roles || (user?.role && item.roles.includes(user.role))
  )

  const filteredSearchItems = filteredMenuItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Package className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Asset MS</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {(searchQuery ? filteredSearchItems : filteredMenuItems).map((item) => {
              const isActive = pathname === item.href
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} />
                  <span>{item.name}</span>
                </a>
              )
            })}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {getRoleDisplayName(user.role)}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:pl-0">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {title || 'Dashboard'}
                </h1>
                <p className="text-sm text-gray-500">
                  {getGreeting()}, {user.name}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-500 hover:text-gray-700">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
