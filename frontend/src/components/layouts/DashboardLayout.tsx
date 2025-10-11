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
  Plus
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { getGreeting, getRoleDisplayName } from '@/lib/utils'

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Inventory', href: '/inventory', icon: Package, roles: ['ADMIN', 'ASSET_ADMIN', 'MANAGER', 'DEPARTMENT_USER', 'TECHNICIAN'] },
  { name: 'Assets', href: '/assets', icon: Package },
  { name: 'Requests', href: '/requests', icon: FileText },
  { name: 'Maintenance', href: '/maintenance', icon: Wrench },
  { name: 'Decomposition', href: '/decomposition', icon: GitBranch, roles: ['ADMIN', 'ASSET_ADMIN', 'TECHNICIAN'] },
  { name: 'Audit', href: '/audit', icon: Shield, roles: ['ADMIN', 'AUDITOR'] },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  // Master Data Section
  { name: 'Master Data', href: '/master', icon: Settings, roles: ['ADMIN', 'ASSET_ADMIN'], isSection: true },
  { name: 'Companies', href: '/master/companies', icon: Building, roles: ['ADMIN', 'ASSET_ADMIN'], parent: 'Master Data' },
  { name: 'Users', href: '/users', icon: Users, roles: ['ADMIN', 'ASSET_ADMIN'], parent: 'Master Data' },
  { name: 'Departments', href: '/departments', icon: Building, parent: 'Master Data' },
  { name: 'Positions', href: '/master/positions', icon: User, roles: ['ADMIN', 'ASSET_ADMIN'], parent: 'Master Data' },
  { name: 'Categories', href: '/categories', icon: Settings, parent: 'Master Data' },
  { name: 'Locations', href: '/locations', icon: MapPin, parent: 'Master Data' },
  { name: 'Vendors', href: '/vendors', icon: Truck, parent: 'Master Data' },
  { name: 'Software Assets', href: '/master/software-assets', icon: Package, roles: ['ADMIN', 'ASSET_ADMIN'], parent: 'Master Data' },
  { name: 'Spare Parts', href: '/master/spare-parts', icon: Settings, roles: ['ADMIN', 'ASSET_ADMIN', 'TECHNICIAN'], parent: 'Master Data' }
]

import { ReactNode } from 'react'

interface DashboardLayoutProps {
  children: ReactNode
  title?: string
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { user, logout, isHydrated } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  useEffect(() => {
    if (isHydrated && !user) {
      router.push('/login')
    }
  }, [user, isHydrated, router])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
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
        <div className="glass-card p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-600 border-t-transparent mx-auto"></div>
          <p className="text-gray-700 mt-4 text-center">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 glass-sidebar transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'
      } sidebar-transition`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-20 px-6 border-b border-gray-300/30">
            <div className="flex items-center space-x-3">
              <div className="p-2 glass-button rounded-xl">
                <Package className="h-8 w-8 text-gray-700" />
              </div>
              {!sidebarCollapsed && (
                <div className="sidebar-text">
                  <span className="text-xl font-bold text-gray-800">Pakuwon</span>
                  <p className="text-xs text-gray-600">Management System</p>
                </div>
              )}
            </div>
          </div>
            <div className="flex items-center space-x-2 p-2 justify-center">
              <button
                onClick={toggleSidebar}
                className="hidden lg:flex text-gray-600 hover:text-gray-800 p-2 glass-button rounded-lg transition-all w-full items-center justify-center"
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <Menu className="h-5 w-5" />
              </button>
              <button
                // onClick={() => setSidebarOpen(false)}
                onClick={toggleSidebar}
                className="lg:hidden text-gray-600 hover:text-gray-800 p-2 glass-button rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

          {/* Search */}
          {!sidebarCollapsed && (
            <div className="p-4 border-b border-gray-300/20">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 glass-input rounded-xl text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300/50"
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {(searchQuery ? filteredSearchItems : filteredMenuItems).map((item) => {
              const isActive = pathname === item.href
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`menu-item flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'active glass-button text-gray-800 shadow-lg'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                  title={sidebarCollapsed ? item.name : ''}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-gray-800' : 'text-gray-500'}`} />
                  {!sidebarCollapsed && (
                    <>
                      <span className="sidebar-text">{item.name}</span>
                      {isActive && (
                        <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </>
                  )}
                </a>
              )
            })}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-gray-300/20">
            <div className="glass-card p-4 rounded-xl">
              <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} mb-3`}>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                  <User className="h-6 w-6 text-white" />
                </div>
                {!sidebarCollapsed && (
                  <div className="flex-1 min-w-0 sidebar-text">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {getRoleDisplayName(user.role)}
                    </p>
                  </div>
                )}
              </div>
              {!sidebarCollapsed && (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 glass-button rounded-lg transition-all sidebar-text"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              )}
              {sidebarCollapsed && (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 glass-button rounded-lg transition-all"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 glass-modal-backdrop lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Profile Menu Overlay */}
      {showProfileMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowProfileMenu(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:pl-0">
        {/* Top bar */}
        <header className="glass-header backdrop-blur-md border-b border-gray-300/20 sticky top-0 z-30">
          <div className="flex items-center justify-between h-20 px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-600 hover:text-gray-800 p-2 glass-button rounded-lg transition-all"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {title || 'Dashboard'}
                </h1>
                <p className="text-sm text-gray-600">
                  {getGreeting()}, {user.name}!
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Quick Actions */}
              <div className="hidden md:flex items-center space-x-2">
                <button 
                  onClick={() => router.push('/assets')}
                  className="glass-button p-3 rounded-xl text-gray-600 hover:text-gray-800 transition-all hover:scale-105" 
                  title="Quick Add Asset"
                >
                  <Plus className="h-5 w-5" />
                </button>
                <button className="glass-button p-3 rounded-xl text-gray-600 hover:text-gray-800 transition-all hover:scale-105" title="Search">
                  <Search className="h-5 w-5" />
                </button>
              </div>

              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => router.push('/notifications')}
                  className="relative glass-button p-3 rounded-xl text-gray-600 hover:text-gray-800 transition-all hover:scale-105"
                  title="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                </button>
              </div>

              {/* Profile Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 glass-button p-2 rounded-xl hover:scale-105 transition-all"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                    <p className="text-xs text-gray-600">{getRoleDisplayName(user.role)}</p>
                  </div>
                </button>

                {/* Profile Dropdown */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 glass-modal rounded-xl shadow-xl z-50">
                    <div className="p-4 border-b border-gray-300/20">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                          <User className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                          <p className="text-xs text-gray-600">{user.email}</p>
                          <p className="text-xs text-blue-600">{getRoleDisplayName(user.role)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <button 
                        onClick={() => router.push('/profile')}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 glass-button rounded-lg transition-all"
                      >
                        <User className="h-4 w-4" />
                        <span>View Profile</span>
                      </button>
                      <button 
                        onClick={() => router.push('/settings')}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 glass-button rounded-lg transition-all"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </button>
                      <hr className="my-2 border-gray-300/20" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-600 hover:text-red-800 glass-button rounded-lg transition-all"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
