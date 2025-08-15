import { create } from 'zustand'
import { maintenanceService } from '@/lib/services/maintenanceService'

interface Maintenance {
  id: number
  assetId: number
  type: string
  title: string
  description?: string
  status: string
  priority: string
  assigneeId?: number
  scheduledDate: string
  completedDate?: string
  estimatedCost?: number
  actualCost?: number
  notes?: string
  attachments?: string[]
  createdAt: string
  updatedAt: string
  asset?: {
    id: number
    name: string
    assetTag: string
  }
  assignee?: {
    id: number
    name: string
    email: string
  }
}

interface MaintenanceState {
  maintenanceRecords: Maintenance[]
  loading: boolean
  error: string | null
  searchTerm: string
  typeFilter: string
  statusFilter: string
  priorityFilter: string
  assetFilter: string
  showModal: boolean
  editingMaintenance: Maintenance | null
  formData: {
    assetId: string
    type: string
    title: string
    description: string
    status: string
    priority: string
    assigneeId: string
    scheduledDate: string
    estimatedCost: string
    notes: string
  }
}

interface MaintenanceActions {
  fetchMaintenance: () => Promise<void>
  createMaintenance: (data: Partial<Maintenance>) => Promise<void>
  updateMaintenance: (id: number, data: Partial<Maintenance>) => Promise<void>
  deleteMaintenance: (id: number) => Promise<void>
  updateMaintenanceStatus: (id: number, status: string) => Promise<void>
  setSearchTerm: (term: string) => void
  setTypeFilter: (type: string) => void
  setStatusFilter: (status: string) => void
  setPriorityFilter: (priority: string) => void
  setAssetFilter: (asset: string) => void
  setShowModal: (show: boolean) => void
  setEditingMaintenance: (maintenance: Maintenance | null) => void
  setFormData: (data: Partial<MaintenanceState['formData']>) => void
  resetForm: () => void
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  getFilteredMaintenance: () => Maintenance[]
  getMaintenanceStats: () => Array<{
    title: string
    value: number
    icon: string
    color: string
    textColor: string
    bgColor: string
  }>
}

const initialFormData = {
  assetId: '',
  type: 'PREVENTIVE',
  title: '',
  description: '',
  status: 'SCHEDULED',
  priority: 'MEDIUM',
  assigneeId: '',
  scheduledDate: '',
  estimatedCost: '',
  notes: ''
}

export const useMaintenanceStore = create<MaintenanceState & MaintenanceActions>((set, get) => ({
  maintenanceRecords: [],
  loading: false,
  error: null,
  searchTerm: '',
  typeFilter: '',
  statusFilter: '',
  priorityFilter: '',
  assetFilter: '',
  showModal: false,
  editingMaintenance: null,
  formData: initialFormData,

  fetchMaintenance: async () => {
    set({ loading: true, error: null })
    try {
      const response = await maintenanceService.getAllMaintenance()
      set({ maintenanceRecords: response.data || [], loading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch maintenance records'
      set({ error: message, loading: false })
    }
  },

  createMaintenance: async (data) => {
    try {
      const maintenanceData = {
        ...data,
        assetId: parseInt(data.assetId?.toString() || '0'),
        assigneeId: data.assigneeId ? parseInt(data.assigneeId.toString()) : null,
        estimatedCost: data.estimatedCost ? parseFloat(data.estimatedCost.toString()) : null
      }
      await maintenanceService.createMaintenance(maintenanceData)
      get().fetchMaintenance()
      get().resetForm()
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create maintenance record')
    }
  },

  updateMaintenance: async (id, data) => {
    try {
      const maintenanceData = {
        ...data,
        assetId: parseInt(data.assetId?.toString() || '0'),
        assigneeId: data.assigneeId ? parseInt(data.assigneeId.toString()) : null,
        estimatedCost: data.estimatedCost ? parseFloat(data.estimatedCost.toString()) : null
      }
      await maintenanceService.updateMaintenance(id, maintenanceData)
      get().fetchMaintenance()
      get().resetForm()
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update maintenance record')
    }
  },

  deleteMaintenance: async (id) => {
    try {
      await maintenanceService.deleteMaintenance(id)
      get().fetchMaintenance()
    } catch {
      throw new Error('Failed to delete maintenance record')
    }
  },

  updateMaintenanceStatus: async (id, status) => {
    try {
      await maintenanceService.updateMaintenanceStatus(id, status)
      get().fetchMaintenance()
    } catch {
      throw new Error('Failed to update maintenance status')
    }
  },

  setSearchTerm: (term) => set({ searchTerm: term }),
  setTypeFilter: (type) => set({ typeFilter: type }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  setPriorityFilter: (priority) => set({ priorityFilter: priority }),
  setAssetFilter: (asset) => set({ assetFilter: asset }),
  setShowModal: (show) => set({ showModal: show }),
  
  setEditingMaintenance: (maintenance) => {
    set({ editingMaintenance: maintenance })
    if (maintenance) {
      set({
        formData: {
          assetId: maintenance.assetId?.toString() || '',
          type: maintenance.type || 'PREVENTIVE',
          title: maintenance.title || '',
          description: maintenance.description || '',
          status: maintenance.status || 'SCHEDULED',
          priority: maintenance.priority || 'MEDIUM',
          assigneeId: maintenance.assigneeId?.toString() || '',
          scheduledDate: maintenance.scheduledDate ? maintenance.scheduledDate.split('T')[0] : '',
          estimatedCost: maintenance.estimatedCost?.toString() || '',
          notes: maintenance.notes || ''
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
    editingMaintenance: null,
    showModal: false
  }),

  handleInputChange: (e) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    const { name, value } = target
    
    set(state => ({
      formData: {
        ...state.formData,
        [name]: value
      }
    }))
  },

  getFilteredMaintenance: () => {
    const { maintenanceRecords, searchTerm, typeFilter, statusFilter, priorityFilter, assetFilter } = get()
    return maintenanceRecords.filter(maintenance => {
      const matchesSearch = !searchTerm || 
        maintenance.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        maintenance.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        maintenance.asset?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        maintenance.asset?.assetTag?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesType = !typeFilter || maintenance.type === typeFilter
      const matchesStatus = !statusFilter || maintenance.status === statusFilter
      const matchesPriority = !priorityFilter || maintenance.priority === priorityFilter
      const matchesAsset = !assetFilter || maintenance.assetId?.toString() === assetFilter
      
      return matchesSearch && matchesType && matchesStatus && matchesPriority && matchesAsset
    })
  },

  getMaintenanceStats: () => {
    const { maintenanceRecords } = get()
    const now = new Date()
    
    return [
      {
        title: 'Total Maintenance',
        value: maintenanceRecords.length,
        icon: 'Wrench',
        color: 'bg-blue-500',
        textColor: 'text-blue-600',
        bgColor: 'bg-blue-50'
      },
      {
        title: 'Pending',
        value: maintenanceRecords.filter(m => ['SCHEDULED', 'IN_PROGRESS'].includes(m.status)).length,
        icon: 'Clock',
        color: 'bg-yellow-500',
        textColor: 'text-yellow-600',
        bgColor: 'bg-yellow-50'
      },
      {
        title: 'Completed',
        value: maintenanceRecords.filter(m => m.status === 'COMPLETED').length,
        icon: 'CheckCircle',
        color: 'bg-green-500',
        textColor: 'text-green-600',
        bgColor: 'bg-green-50'
      },
      {
        title: 'Overdue',
        value: maintenanceRecords.filter(m => {
          if (m.status === 'COMPLETED') return false
          const scheduledDate = new Date(m.scheduledDate)
          return scheduledDate < now
        }).length,
        icon: 'AlertTriangle',
        color: 'bg-red-500',
        textColor: 'text-red-600',
        bgColor: 'bg-red-50'
      }
    ]
  }
}))
