import { create } from 'zustand'
import { departmentService } from '@/lib/services/departmentService'
import { toast } from '@/hooks/useToast'

interface Department {
  id: number
  name: string
  code: string
  description?: string
  managerId?: number
  parentId?: number
  isActive: boolean
  companyId: number // Added for multi-company support
  createdAt: string
  updatedAt: string
  manager?: {
    id: number
    name: string
  }
}

interface DepartmentState {
  departments: Department[]
  loading: boolean
  error: string | null
  searchTerm: string
  showModal: boolean
  editingDepartment: Department | null
  currentPage: number
  pageSize: number
  totalDepartments: number
  formData: {
    name: string
    code: string
    description: string
    managerId: string
    parentId: string
    isActive: boolean
    // companyId will be auto-injected by API interceptor
  }
}

interface DepartmentActions {
  fetchDepartments: (params?: { page?: number; limit?: number; search?: string }) => Promise<void>
  fetchDepartmentsByCompany?: (companyId?: string | number) => Promise<void>
  createDepartment: (data: Partial<Department>) => Promise<void>
  updateDepartment: (id: number, data: Partial<Department>) => Promise<void>
  deleteDepartment: (id: number) => Promise<void>
  setSearchTerm: (term: string) => void
  setShowModal: (show: boolean) => void
  setEditingDepartment: (department: Department | null) => void
  setFormData: (data: Partial<DepartmentState['formData']>) => void
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  resetForm: () => void
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  getFilteredDepartments: () => Department[]
  getDepartmentStats: () => Array<{
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
  code: '',
  description: '',
  managerId: '',
  parentId: '',
  isActive: true
}

export const useDepartmentStore = create<DepartmentState & DepartmentActions>((set, get) => ({
  departments: [],
  loading: false,
  error: null,
  searchTerm: '',
  showModal: false,
  editingDepartment: null,
  currentPage: 1,
  pageSize: 20,
  totalDepartments: 0,
  formData: initialFormData,

  fetchDepartments: async (params) => {
    set({ loading: true, error: null })
    try {
      const { currentPage, pageSize } = get()
      const queryParams: Record<string, string> = {
        page: (params?.page || currentPage).toString(),
        limit: (params?.limit || pageSize).toString()
      }
      
      if (params?.search) {
        queryParams.search = params.search
      }
      
      const response = await departmentService.getAllDepartments(queryParams)
      // Handle the nested response structure with pagination
      const departments = response.data?.departments || response.departments || response.data || []
      const pagination = response.data?.pagination || response.pagination || {}
      
      set({ 
        departments: Array.isArray(departments) ? departments : [], 
        totalDepartments: pagination.total || 0,
        currentPage: pagination.current || 1,
        loading: false 
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch departments'
      set({ error: message, loading: false })
      toast.error(message)
    }
  },

  // Fetch departments scoped to a specific company (used by filters)
  fetchDepartmentsByCompany: async (companyId?: string | number) => {
    set({ loading: true, error: null })
    try {
      // allow both number and string ids
      const payload: Record<string, string> = {}
      if (companyId) payload.companyId = companyId.toString()
      const response = await departmentService.getAllDepartments(payload)
      const departments = response.data?.departments || response.departments || response.data || []
      set({ departments: Array.isArray(departments) ? departments : [], loading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch departments for company'
      set({ error: message, loading: false })
      toast.error(message)
    }
  },

  createDepartment: async (data) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const departmentData: any = {
        ...data,
        managerId: data.managerId && data.managerId.toString().trim() !== '' 
          ? data.managerId.toString()
          : undefined,
        parentId: data.parentId && data.parentId.toString().trim() !== '' 
          ? data.parentId.toString() 
          : undefined
      }
      // Remove undefined fields to avoid sending them
      Object.keys(departmentData).forEach(key => {
        if (departmentData[key] === undefined) {
          delete departmentData[key]
        }
      })
      
      await departmentService.createDepartment(departmentData)
      await get().fetchDepartments()
      get().resetForm()
      toast.success('Department created successfully!')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create department'
      toast.error(message)
      throw new Error(message)
    }
  },

  updateDepartment: async (id, data) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const departmentData: any = {
        ...data,
        managerId: data.managerId && data.managerId.toString().trim() !== '' 
          ? data.managerId.toString()
          : undefined,
        parentId: data.parentId && data.parentId.toString().trim() !== '' 
          ? data.parentId.toString() 
          : undefined
      }
      // Remove undefined fields to avoid sending them
      Object.keys(departmentData).forEach(key => {
        if (departmentData[key] === undefined) {
          delete departmentData[key]
        }
      })
      
      await departmentService.updateDepartment(id, departmentData)
      await get().fetchDepartments()
      get().resetForm()
      toast.success('Department updated successfully!')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update department'
      toast.error(message)
      throw new Error(message)
    }
  },

  deleteDepartment: async (id) => {
    try {
      await departmentService.deleteDepartment(id)
      await get().fetchDepartments()
      toast.success('Department deleted successfully!')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete department'
      toast.error(message)
      throw new Error(message)
    }
  },

  setSearchTerm: (term) => set({ searchTerm: term }),
  setShowModal: (show) => set({ showModal: show }),
  setPage: (page) => set({ currentPage: page }),
  setPageSize: (size) => set({ pageSize: size }),
  
  setEditingDepartment: (department) => {
    set({ editingDepartment: department })
    if (department) {
      set({
        formData: {
          name: department.name || '',
          code: department.code || '',
          description: department.description || '',
          managerId: department.managerId?.toString() || '',
          parentId: department.parentId?.toString() || '',
          isActive: department.isActive !== false
        },
        showModal: true
      })
    }
  },

  setFormData: (data) => set(state => ({ 
    formData: { ...state.formData, ...data } 
  })),

  resetForm: () => set({
    formData: initialFormData,
    editingDepartment: null,
    showModal: false
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

  getFilteredDepartments: () => {
    const { departments, searchTerm } = get()
    if (!Array.isArray(departments)) return []
    return departments.filter(department =>
      department.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      department.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      department.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  },

  getDepartmentStats: () => {
    const { departments } = get()
    return [
      {
        title: 'Total Departments',
        value: departments.length,
        icon: 'Building2',
        color: 'bg-blue-500',
        textColor: 'text-blue-600',
        bgColor: 'bg-blue-50'
      },
      {
        title: 'Active Departments',
        value: departments.filter(d => d.isActive !== false).length,
        icon: 'CheckCircle',
        color: 'bg-green-500',
        textColor: 'text-green-600',
        bgColor: 'bg-green-50'
      },
      {
        title: 'With Manager',
        value: departments.filter(d => d.managerId).length,
        icon: 'User',
        color: 'bg-purple-500',
        textColor: 'text-purple-600',
        bgColor: 'bg-purple-50'
      },
      {
        title: 'Sub Departments',
        value: departments.filter(d => d.parentId).length,
        icon: 'GitBranch',
        color: 'bg-orange-500',
        textColor: 'text-orange-600',
        bgColor: 'bg-orange-50'
      }
    ]
  }
}))
