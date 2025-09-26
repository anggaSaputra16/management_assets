import { create } from 'zustand'
import { requestService } from '@/lib/services/requestService'

interface Request {
  id: number
  type: string
  title: string
  description?: string
  priority: string
  status: string
  requesterId: number
  assigneeId?: number
  assetId?: number
  categoryId?: number
  estimatedCost?: number
  actualCost?: number
  requestDate: string
  approvedDate?: string
  completedDate?: string
  dueDate?: string
  notes?: string
  attachments?: string[]
  companyId: number // Added for multi-company support
  createdAt: string
  updatedAt: string
  requester?: {
    id: number
    name: string
    email: string
  }
  assignee?: {
    id: number
    name: string
    email: string
  }
  asset?: {
    id: number
    name: string
    assetTag: string
  }
  category?: {
    id: number
    name: string
  }
}

interface RequestState {
  requests: Request[]
  loading: boolean
  error: string | null
  searchTerm: string
  typeFilter: string
  statusFilter: string
  priorityFilter: string
  showModal: boolean
  editingRequest: Request | null
  formData: {
    type: string
    title: string
    description: string
    priority: string
    status: string
    requesterId: string
    assigneeId: string
    assetId: string
    categoryId: string
    estimatedCost: string
    dueDate: string
    notes: string
  }
}

interface RequestActions {
  fetchRequests: () => Promise<void>
  createRequest: (data: Partial<Request>) => Promise<void>
  updateRequest: (id: number, data: Partial<Request>) => Promise<void>
  deleteRequest: (id: number) => Promise<void>
  setSearchTerm: (term: string) => void
  setTypeFilter: (type: string) => void
  setStatusFilter: (status: string) => void
  setPriorityFilter: (priority: string) => void
  setShowModal: (show: boolean) => void
  setEditingRequest: (request: Request | null) => void
  setFormData: (data: Partial<RequestState['formData']>) => void
  resetForm: () => void
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  getFilteredRequests: () => Request[]
  getRequestStats: () => Array<{
    title: string
    value: number
    icon: string
    color: string
    textColor: string
    bgColor: string
  }>
}

const initialFormData = {
  type: 'MAINTENANCE',
  title: '',
  description: '',
  priority: 'MEDIUM',
  status: 'PENDING',
  requesterId: '',
  assigneeId: '',
  assetId: '',
  categoryId: '',
  estimatedCost: '',
  dueDate: '',
  notes: ''
}

export const useRequestStore = create<RequestState & RequestActions>((set, get) => ({
  requests: [],
  loading: false,
  error: null,
  searchTerm: '',
  typeFilter: '',
  statusFilter: '',
  priorityFilter: '',
  showModal: false,
  editingRequest: null,
  formData: initialFormData,

  fetchRequests: async () => {
    set({ loading: true, error: null })
    try {
      const response = await requestService.getAllRequests()
      // Handle the nested response structure
      const requests = response.data?.requests || response.requests || response.data || []
      set({ requests: Array.isArray(requests) ? requests : [], loading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch requests', loading: false })
    }
  },

  createRequest: async (data) => {
    try {
      const requestData = {
        ...data,
        requesterId: parseInt(data.requesterId?.toString() || '0'),
        assigneeId: data.assigneeId ? parseInt(data.assigneeId.toString()) : null,
        assetId: data.assetId ? parseInt(data.assetId.toString()) : null,
        categoryId: data.categoryId ? parseInt(data.categoryId.toString()) : null,
        estimatedCost: data.estimatedCost ? parseFloat(data.estimatedCost.toString()) : null
      }
      await requestService.createRequest(requestData)
      get().fetchRequests()
      get().resetForm()
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create request')
    }
  },

  updateRequest: async (id, data) => {
    try {
      const requestData = {
        ...data,
        requesterId: parseInt(data.requesterId?.toString() || '0'),
        assigneeId: data.assigneeId ? parseInt(data.assigneeId.toString()) : null,
        assetId: data.assetId ? parseInt(data.assetId.toString()) : null,
        categoryId: data.categoryId ? parseInt(data.categoryId.toString()) : null,
        estimatedCost: data.estimatedCost ? parseFloat(data.estimatedCost.toString()) : null
      }
      await requestService.updateRequest(id, requestData)
      get().fetchRequests()
      get().resetForm()
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update request')
    }
  },

  deleteRequest: async (id) => {
    try {
      await requestService.deleteRequest(id)
      get().fetchRequests()
    } catch {
      throw new Error('Failed to delete request')
    }
  },

  setSearchTerm: (term) => set({ searchTerm: term }),
  setTypeFilter: (type) => set({ typeFilter: type }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  setPriorityFilter: (priority) => set({ priorityFilter: priority }),
  setShowModal: (show) => set({ showModal: show }),
  
  setEditingRequest: (request) => {
    set({ editingRequest: request })
    if (request) {
      set({
        formData: {
          type: request.type || 'MAINTENANCE',
          title: request.title || '',
          description: request.description || '',
          priority: request.priority || 'MEDIUM',
          status: request.status || 'PENDING',
          requesterId: request.requesterId?.toString() || '',
          assigneeId: request.assigneeId?.toString() || '',
          assetId: request.assetId?.toString() || '',
          categoryId: request.categoryId?.toString() || '',
          estimatedCost: request.estimatedCost?.toString() || '',
          dueDate: request.dueDate ? request.dueDate.split('T')[0] : '',
          notes: request.notes || ''
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
    editingRequest: null,
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

  getFilteredRequests: () => {
    const { requests, searchTerm, typeFilter, statusFilter, priorityFilter } = get()
    if (!Array.isArray(requests)) return []
    return requests.filter(request => {
      const matchesSearch = !searchTerm || 
        request.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.requester?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesType = !typeFilter || request.type === typeFilter
      const matchesStatus = !statusFilter || request.status === statusFilter
      const matchesPriority = !priorityFilter || request.priority === priorityFilter
      
      return matchesSearch && matchesType && matchesStatus && matchesPriority
    })
  },

  getRequestStats: () => {
    const { requests } = get()
    return [
      {
        title: 'Total Requests',
        value: requests.length,
        icon: 'ClipboardList',
        color: 'bg-blue-500',
        textColor: 'text-blue-600',
        bgColor: 'bg-blue-50'
      },
      {
        title: 'Pending Requests',
        value: requests.filter(r => r.status === 'PENDING').length,
        icon: 'Clock',
        color: 'bg-yellow-500',
        textColor: 'text-yellow-600',
        bgColor: 'bg-yellow-50'
      },
      {
        title: 'In Progress',
        value: requests.filter(r => r.status === 'IN_PROGRESS').length,
        icon: 'Play',
        color: 'bg-blue-500',
        textColor: 'text-blue-600',
        bgColor: 'bg-blue-50'
      },
      {
        title: 'Completed',
        value: requests.filter(r => r.status === 'COMPLETED').length,
        icon: 'CheckCircle',
        color: 'bg-green-500',
        textColor: 'text-green-600',
        bgColor: 'bg-green-50'
      }
    ]
  }
}))
