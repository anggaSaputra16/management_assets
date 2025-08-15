import { create } from 'zustand'
import { departmentService } from '@/lib/services/departmentService'

interface Department {
  id: number
  name: string
  code: string
  description?: string
  managerId?: number
  parentId?: number
  isActive: boolean
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
  formData: {
    name: string
    code: string
    description: string
    managerId: string
    parentId: string
    isActive: boolean
  }
}

interface DepartmentActions {
  fetchDepartments: () => Promise<void>
  createDepartment: (data: Partial<Department>) => Promise<void>
  updateDepartment: (id: number, data: Partial<Department>) => Promise<void>
  deleteDepartment: (id: number) => Promise<void>
  setSearchTerm: (term: string) => void
  setShowModal: (show: boolean) => void
  setEditingDepartment: (department: Department | null) => void
  setFormData: (data: Partial<DepartmentState['formData']>) => void
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
  formData: initialFormData,

  fetchDepartments: async () => {
    set({ loading: true, error: null })
    try {
      const response = await departmentService.getAllDepartments()
      // Handle the nested response structure
      const departments = response.data?.departments || response.departments || response.data || []
      set({ departments: Array.isArray(departments) ? departments : [], loading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch departments', loading: false })
    }
  },

  createDepartment: async (data) => {
    try {
      const departmentData = {
        ...data,
        managerId: data.managerId ? parseInt(data.managerId.toString()) : null,
        parentId: data.parentId ? parseInt(data.parentId.toString()) : null
      }
      await departmentService.createDepartment(departmentData)
      get().fetchDepartments()
      get().resetForm()
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create department')
    }
  },

  updateDepartment: async (id, data) => {
    try {
      const departmentData = {
        ...data,
        managerId: data.managerId ? parseInt(data.managerId.toString()) : null,
        parentId: data.parentId ? parseInt(data.parentId.toString()) : null
      }
      await departmentService.updateDepartment(id, departmentData)
      get().fetchDepartments()
      get().resetForm()
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update department')
    }
  },

  deleteDepartment: async (id) => {
    try {
      await departmentService.deleteDepartment(id)
      get().fetchDepartments()
    } catch {
      throw new Error('Failed to delete department')
    }
  },

  setSearchTerm: (term) => set({ searchTerm: term }),
  setShowModal: (show) => set({ showModal: show }),
  
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
