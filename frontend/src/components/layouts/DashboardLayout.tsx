'use client'

import { useEffect, useState, useRef, ReactNode, ComponentType } from 'react'
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
import { useNotificationStore } from '@/stores/notificationStore'
import { getGreeting, getRoleDisplayName } from '@/lib/utils'

interface MenuItem {
  name: string
  href?: string
  icon: ComponentType<React.SVGProps<SVGSVGElement>>
  roles?: string[]
  parent?: string
  isSection?: boolean
  children?: MenuItem[]
}

const menuItems: MenuItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Inventory', href: '/inventory', icon: Package, roles: ['ADMIN', 'ASSET_ADMIN', 'MANAGER', 'DEPARTMENT_USER', 'TECHNICIAN'] },
  // Assets moved under Master Data (will be displayed from the Master Data page/section)
  { name: 'Assets', href: '/assets', icon: Package, parent: 'Master Data' },
  { name: 'Requests', href: '/requests', icon: FileText },
  { name: 'Maintenance', href: '/maintenance', icon: Wrench },
  { name: 'Decomposition', href: '/decomposition', icon: GitBranch, roles: ['ADMIN', 'ASSET_ADMIN', 'TECHNICIAN'] },
  // FIX: Sidebar Loans - role-specific loan pages (Manage / Approval) rendered based on user role
  // NOTE: individual entries are rendered dynamically below based on current user role
  { name: 'Audit', href: '/audit', icon: Shield, roles: ['ADMIN', 'AUDITOR'] },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  // Master Data Section
  { name: 'Master Data', href: '/master', icon: Settings, roles: ['ADMIN', 'ASSET_ADMIN'], isSection: true },
  { name: 'Companies', href: '/master/companies', icon: Building, roles: ['ADMIN', 'ASSET_ADMIN'], parent: 'Master Data' },
  { name: 'Users', href: '/users', icon: Users, roles: ['ADMIN', 'ASSET_ADMIN'], parent: 'Master Data' },
  { name: 'Roles', href: '/roles', icon: Shield, roles: ['ADMIN'], parent: 'Master Data' },
  { name: 'Departments', href: '/departments', icon: Building, parent: 'Master Data' },
  { name: 'Locations', href: '/locations', icon: MapPin, parent: 'Master Data' },
  { name: 'Categories', href: '/categories', icon: Settings, parent: 'Master Data' },
  { name: 'Vendors', href: '/vendors', icon: Truck, parent: 'Master Data' },
  { name: 'Software Assets', href: '/master/software-assets', icon: Package, roles: ['ADMIN', 'ASSET_ADMIN'], parent: 'Master Data' },
  { name: 'Spare Parts', href: '/master/spare-parts', icon: Settings, roles: ['ADMIN', 'ASSET_ADMIN', 'TECHNICIAN'], parent: 'Master Data' }
]


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
  const [unreadCount, setUnreadCount] = useState(0)
  const profileFirstButtonRef = useRef<HTMLButtonElement | null>(null)
  const { getStatistics, fetchNotifications } = useNotificationStore()

  useEffect(() => {
    if (isHydrated && !user) {
      router.push('/login')
    }
  }, [user, isHydrated, router])

  // Fetch notification stats (unread count) when user is available
  useEffect(() => {
    let mounted = true
    const loadStats = async () => {
      if (!user) return
      try {
        const stats = await getStatistics()
        const s = stats as { unreadNotifications?: number }
        if (mounted && s && typeof s.unreadNotifications === 'number') {
          setUnreadCount(s.unreadNotifications)
        }
      } catch {
        // ignore silently
      }
    }
    loadStats()

    // Also fetch basic notifications list in background to keep store in sync
    fetchNotifications().catch(() => {})

    return () => { mounted = false }
  }, [user, getStatistics, fetchNotifications])

  // Accessibility: close profile menu on Escape and focus first button when opened
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowProfileMenu(false)
    }
    if (showProfileMenu) {
      document.addEventListener('keydown', handleKey)
      // focus first actionable element in the menu
      setTimeout(() => (profileFirstButtonRef.current as HTMLButtonElement | null)?.focus(), 0)
    }
    return () => document.removeEventListener('keydown', handleKey)
  }, [showProfileMenu])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  // Hanya tampilkan menu utama, module master (parent: 'Master Data') disembunyikan dari sidebar
  const filteredMenuItems = menuItems.filter(item => {
    // Sembunyikan semua menu yang punya parent 'Master Data'
    if (item.parent === 'Master Data') return false;
    // Tampilkan menu sesuai role
    return !item.roles || (user?.role && item.roles.includes(user.role));
  })

  // Inject role-specific loan menu entries
  const loanMenuItems: MenuItem[] = []
  // Staff => Manage Loans (DEPARTMENT_USER considered 'staff') and Admin
  // Staff/Admin => Request Loan (create/request a loan)
  if (user?.role === 'DEPARTMENT_USER' || user?.role === 'ADMIN') {
    loanMenuItems.push({ name: 'Request Loan', href: '/loans/manage', icon: FileText })
  }
  // Manager, Top Management, and Admin => Approval Loans
  if (user?.role === 'MANAGER' || user?.role === 'TOP_MANAGEMENT' || user?.role === 'ADMIN') {
    loanMenuItems.push({ name: 'Approval Loan', href: '/loans/approvals', icon: FileText })
  }

  // Build a Loans parent grouping when there are loan items
  const auditIndex = filteredMenuItems.findIndex(i => i.name === 'Audit')
  const loanParent: MenuItem | null = loanMenuItems.length
    ? { name: 'Loans', href: '#', icon: FileText, children: loanMenuItems }
    : null

  // Append loan parent (if present) after Audit
  const finalMenuItems = [
    ...filteredMenuItems.slice(0, auditIndex + 1),
    ...(loanParent ? [loanParent] : []),
    ...filteredMenuItems.slice(auditIndex + 1)
  ]

  const filteredSearchItems = finalMenuItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-600 border-t-transparent mx-auto"></div>
          <p className="text-[#111] mt-4 text-center">Loading...</p>
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
          <div className="flex items-center justify-between h-20 px-6 border-b border-black/10/30">
            <div className="flex items-center space-x-3">
              <div className="p-2 glass-button rounded-xl">
                <Package className="h-8 w-8 text-[#111]" />
              </div>
              {!sidebarCollapsed && (
                <div className="sidebar-text">
                  <span className="text-xl font-bold text-[#111]">Pakuwon</span>
                  <p className="text-xs text-[#333]">Management System</p>
                </div>
              )}
            </div>
          </div>
            <div className="flex items-center space-x-2 p-2 justify-center">
              <button
                onClick={toggleSidebar}
                className="hidden lg:flex text-[#333] hover:text-[#111] p-2 glass-button rounded-lg transition-all w-full items-center justify-center"
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <Menu className="h-5 w-5" />
              </button>
              <button
                // onClick={() => setSidebarOpen(false)}
                onClick={toggleSidebar}
                className="lg:hidden text-[#333] hover:text-[#111] p-2 glass-button rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

          {/* Search */}
          {!sidebarCollapsed && (
            <div className="p-4 border-b border-black/10/20">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#333]" />
                <input
                  type="text"
                  placeholder="Search menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 glass-input rounded-xl text-[#111] placeholder-[#666] focus:outline-none focus:ring-2 focus:ring-black/20/50"
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {(searchQuery ? filteredSearchItems : finalMenuItems).map((item) => {
              // If item has children, render a grouped section
              if (item.children && Array.isArray(item.children)) {
                return (
                  <div key={item.name} className="space-y-1">
                    {/* Parent label (non-navigable) */}
                    <div className={`menu-item flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 rounded-xl text-sm font-semibold text-[#111]`}>
                      <item.icon className="h-5 w-5 text-[#333]" />
                      {!sidebarCollapsed && <span className="sidebar-text">{item.name}</span>}
                    </div>

                    {/* Children links */}
                    <div className="pl-8">
                      {item.children.map((child: MenuItem) => {
                        const isActiveChild = pathname === child.href
                        return (
                          <a
                            key={child.name}
                            href={child.href}
                            className={`menu-item flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                              isActiveChild
                                ? 'active glass-button text-[#111] shadow-lg'
                                : 'text-[#333] hover:text-[#111]'
                            }`}
                            onClick={() => setSidebarOpen(false)}
                            title={sidebarCollapsed ? child.name : ''}
                          >
                            <child.icon className={`h-4 w-4 ${isActiveChild ? 'text-[#111]' : 'text-[#333]'}`} />
                            {!sidebarCollapsed && (
                              <>
                                <span className="sidebar-text">{child.name}</span>
                                {isActiveChild && (
                                  <div className="ml-auto w-2 h-2 bg-white/600 rounded-full"></div>
                                )}
                              </>
                            )}
                          </a>
                        )
                      })}
                    </div>
                  </div>
                )
              }

              const isActive = pathname === item.href
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`menu-item flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'active glass-button text-[#111] shadow-lg'
                      : 'text-[#333] hover:text-[#111]'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                  title={sidebarCollapsed ? item.name : ''}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-[#111]' : 'text-[#333]'}`} />
                  {!sidebarCollapsed && (
                    <>
                      <span className="sidebar-text">{item.name}</span>
                      {isActive && (
                        <div className="ml-auto w-2 h-2 bg-white/600 rounded-full"></div>
                      )}
                    </>
                  )}
                </a>
              )
            })}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-black/10/20">
            <div className="glass-card p-4 rounded-xl">
              <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} mb-3`}>
                <div className="w-12 h-12 bg-gradient-to-r from-transparent to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                  <User className="h-6 w-6 text-white" />
                </div>
                {!sidebarCollapsed && (
                  <div className="flex-1 min-w-0 sidebar-text">
                    <p className="text-sm font-semibold text-[#111] truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-[#333] truncate">
                      {getRoleDisplayName(user.role)}
                    </p>
                  </div>
                )}
              </div>
              {!sidebarCollapsed && (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm text-[#333] hover:text-[#111] glass-button rounded-lg transition-all sidebar-text"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              )}
              {sidebarCollapsed && (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center px-3 py-2 text-sm text-[#333] hover:text-[#111] glass-button rounded-lg transition-all"
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

        <header className="glass-header backdrop-blur-md border-b border-black/10/20 sticky top-0 z-30">
          <div className="flex items-center justify-between h-20 px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-[#333] hover:text-[#111] p-2 glass-button rounded-lg transition-all"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-[#111]">
                  {title || 'Dashboard'}
                </h1>
                <p className="text-sm text-[#333]">
                  {getGreeting()}, {user.name}!
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Quick Actions */}
              <div className="hidden md:flex items-center space-x-2">
                {/* Quick Add Asset */}
                <button 
                  onClick={() => router.push('/assets/add')}
                  className="glass-button p-3 rounded-xl text-[#333] hover:text-[#111] transition-all hover:scale-105" 
                  title="Quick Add Asset"
                >
                  <Plus className="h-5 w-5" />
                </button>
                {/* Search */}
                <button 
                  onClick={() => router.push('/assets')}
                  className="glass-button p-3 rounded-xl text-[#333] hover:text-[#111] transition-all hover:scale-105" 
                  title="Search"
                >
                  <Search className="h-5 w-5" />
                </button>
                {/* FIX: Action dropdown - consolidated Request/Maintenance/Decomposition quick links */}
                <div className="relative">
                  <button
                    onClick={() => router.push('/actions')}
                    className="glass-button p-3 rounded-xl text-[#333] hover:text-[#111] transition-all hover:scale-105"
                    title="Actions"
                  >
                    <FileText className="h-5 w-5" />
                  </button>
                </div>
              </div>
              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => router.push('/notifications')}
                  className="relative glass-button p-3 rounded-xl text-[#333] hover:text-[#111] transition-all hover:scale-105"
                  title="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 ? (
                    <span className="absolute -top-1 -right-1 min-w-[18px] px-1 h-4 bg-white/600 rounded-full text-white text-xs flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  ) : (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-white/600 rounded-full opacity-0" aria-hidden="true"></span>
                  )}
                </button>
              </div>
              {/* Profile & Settings */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  aria-haspopup="true"
                  aria-expanded={showProfileMenu}
                  className="flex items-center space-x-2 glass-button p-2 rounded-xl hover:scale-105 transition-all"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-transparent to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold text-[#111]">{user.name}</p>
                    <p className="text-xs text-[#333]">{getRoleDisplayName(user.role)}</p>
                  </div>
                </button>
                {/* Profile Dropdown */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 glass-modal rounded-xl shadow-xl z-50">
                    <div className="p-4 border-b border-black/10/20">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-transparent to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                          <User className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#111]">{user.name}</p>
                          <p className="text-xs text-[#333]">{user.email}</p>
                          <p className="text-xs text-[#111]">{getRoleDisplayName(user.role)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <button 
                        ref={profileFirstButtonRef}
                        onClick={() => { setShowProfileMenu(false); router.push('/profile') }}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-[#333] hover:text-[#111] glass-button rounded-lg transition-all"
                      >
                        <User className="h-4 w-4" />
                        <span>View Profile</span>
                      </button>
                      <button 
                        onClick={() => { setShowProfileMenu(false); router.push('/settings') }}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-[#333] hover:text-[#111] glass-button rounded-lg transition-all"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </button>
                      <hr className="my-2 border-black/10/20" />
                      <button
                        onClick={() => { setShowProfileMenu(false); handleLogout() }}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-[#111] hover:text-[#111] glass-button rounded-lg transition-all"
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
        <main className="flex-1 overflow-y-auto">
          {/* Use full-width responsive container so pages can render wide layouts consistently */}
          <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 py-6 mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
