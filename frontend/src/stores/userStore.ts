import { create } from 'zustand'
import { userService } from '@/lib/services/userService'

interface User {
  id: number
  name: string
  email: string
  role: string
  phone?: string
  departmentId?: number
  position?: string
  employeeId?: string
  isActive: boolean
  lastLogin?: string
  createdAt: string
  updatedAt: string
  department?: {
    id: number
    name: string
  }
}

interface UserState {
  users: User[]
  loading: boolean
  error: string | null
  searchTerm: string
  roleFilter: string
  departmentFilter: string
  statusFilter: string
  showModal: boolean
  showPasswordModal: boolean
  editingUser: User | null
  formData: {
    name: string
    email: string
    role: string
    phone: string
    departmentId: string
    position: string
    employeeId: string
    password: string
    confirmPassword: string
    isActive: boolean
  }
  passwordData: {
    currentPassword: string
    newPassword: string
    confirmPassword: string
  }
}

interface UserActions {
  fetchUsers: () => Promise<void>
  createUser: (data: Partial<User>) => Promise<void>
  updateUser: (id: number, data: Partial<User>) => Promise<void>
  deleteUser: (id: number) => Promise<void>
  changePassword: (id: number, passwordData: UserState['passwordData']) => Promise<void>
  toggleUserStatus: (id: number) => Promise<void>
  setSearchTerm: (term: string) => void
  setRoleFilter: (role: string) => void
  setDepartmentFilter: (department: string) => void
  setStatusFilter: (status: string) => void
  setShowModal: (show: boolean) => void
  setShowPasswordModal: (show: boolean) => void
  setEditingUser: (user: User | null) => void
  setFormData: (data: Partial<UserState['formData']>) => void
  setPasswordData: (data: Partial<UserState['passwordData']>) => void
  resetForm: () => void
  resetPasswordForm: () => void
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  handlePasswordInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  getFilteredUsers: () => User[]
  getUserStats: () => Array<{
    title: string
    value: number
    icon: string
    color: string
    textColor: string
    bgColor: string
  }>
}

const initialFormData = {
  name: '',
  email: '',
  role: 'USER',
  phone: '',
  departmentId: '',
  position: '',
  employeeId: '',
  password: '',
  confirmPassword: '',
  isActive: true
}

const initialPasswordData = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
}

export const useUserStore = create<UserState & UserActions>((set, get) => ({
  users: [],
  loading: false,
  error: null,
  searchTerm: '',
  roleFilter: '',
  departmentFilter: '',
  statusFilter: '',
  showModal: false,
  showPasswordModal: false,
  editingUser: null,
  formData: initialFormData,
  passwordData: initialPasswordData,

  fetchUsers: async () => {
    set({ loading: true, error: null })
    try {
      const response = await userService.getAllUsers()
      // Handle the nested response structure
      const users = response.data?.users || response.users || response.data || []
      set({ users: Array.isArray(users) ? users : [], loading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch users', loading: false })
    }
  },

  createUser: async (data) => {
    try {
      const userData = {
        ...data,
        departmentId: data.departmentId ? parseInt(data.departmentId.toString()) : null
      }
      await userService.createUser(userData)
      get().fetchUsers()
      get().resetForm()
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create user')
    }
  },

  updateUser: async (id, data) => {
    try {
      const userData = {
        ...data,
        departmentId: data.departmentId ? parseInt(data.departmentId.toString()) : null
      }
      await userService.updateUser(id, userData)
      get().fetchUsers()
      get().resetForm()
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update user')
    }
  },

  deleteUser: async (id) => {
    try {
      await userService.deleteUser(id)
      get().fetchUsers()
    } catch {
      throw new Error('Failed to delete user')
    }
  },

  changePassword: async (id, passwordData) => {
    try {
      await userService.changePassword(id, passwordData)
      get().resetPasswordForm()
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to change password')
    }
  },

  toggleUserStatus: async (id) => {
    try {
      await userService.toggleUserStatus(id)
      get().fetchUsers()
    } catch {
      throw new Error('Failed to toggle user status')
    }
  },

  setSearchTerm: (term) => set({ searchTerm: term }),
  setRoleFilter: (role) => set({ roleFilter: role }),
  setDepartmentFilter: (department) => set({ departmentFilter: department }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  setShowModal: (show) => set({ showModal: show }),
  setShowPasswordModal: (show) => set({ showPasswordModal: show }),
  
  setEditingUser: (user) => {
    set({ editingUser: user })
    if (user) {
      set({
        formData: {
          name: user.name || '',
          email: user.email || '',
          role: user.role || 'USER',
          phone: user.phone || '',
          departmentId: user.departmentId?.toString() || '',
          position: user.position || '',
          employeeId: user.employeeId || '',
          password: '',
          confirmPassword: '',
          isActive: user.isActive !== false
        },
        showModal: true
      })
    }
  },

  setFormData: (data) => set(state => ({ 
    formData: { ...state.formData, ...data } 
  })),

  setPasswordData: (data) => set(state => ({ 
    passwordData: { ...state.passwordData, ...data } 
  })),

  resetForm: () => set({
    formData: initialFormData,
    editingUser: null,
    showModal: false
  }),

  resetPasswordForm: () => set({
    passwordData: initialPasswordData,
    showPasswordModal: false
  }),

  handleInputChange: (e) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    const { name, value, type } = target
    const checked = (target as HTMLInputElement).checked
    
    set(state => ({
      formData: {
        ...state.formData,
        [name]: type === 'checkbox' ? checked : value
      }
    }))
  },

  handlePasswordInputChange: (e) => {
    const { name, value } = e.target
    
    set(state => ({
      passwordData: {
        ...state.passwordData,
        [name]: value
      }
    }))
  },

  getFilteredUsers: () => {
    const { users, searchTerm, roleFilter, departmentFilter, statusFilter } = get()
    if (!Array.isArray(users)) return []
    return users.filter(user => {
      const matchesSearch = !searchTerm || 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.position?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesRole = !roleFilter || user.role === roleFilter
      const matchesDepartment = !departmentFilter || user.departmentId?.toString() === departmentFilter
      const matchesStatus = !statusFilter || 
        (statusFilter === 'active' && user.isActive) ||
        (statusFilter === 'inactive' && !user.isActive)
      
      return matchesSearch && matchesRole && matchesDepartment && matchesStatus
    })
  },

  getUserStats: () => {
    const { users } = get()
    return [
      {
        title: 'Total Users',
        value: users.length,
        icon: 'Users',
        color: 'bg-blue-500',
        textColor: 'text-blue-600',
        bgColor: 'bg-blue-50'
      },
      {
        title: 'Active Users',
        value: users.filter(u => u.isActive !== false).length,
        icon: 'UserCheck',
        color: 'bg-green-500',
        textColor: 'text-green-600',
        bgColor: 'bg-green-50'
      },
      {
        title: 'Administrators',
        value: users.filter(u => ['ADMIN', 'ASSET_ADMIN'].includes(u.role)).length,
        icon: 'Shield',
        color: 'bg-purple-500',
        textColor: 'text-purple-600',
        bgColor: 'bg-purple-50'
      },
      {
        title: 'Recent Login',
        value: users.filter(u => {
          if (!u.lastLogin) return false
          const lastLogin = new Date(u.lastLogin)
          const sevenDaysAgo = new Date()
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
          return lastLogin > sevenDaysAgo
        }).length,
        icon: 'Activity',
        color: 'bg-orange-500',
        textColor: 'text-orange-600',
        bgColor: 'bg-orange-50'
      }
    ]
  }
}))
