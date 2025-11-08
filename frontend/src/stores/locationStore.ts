import { create } from 'zustand'
import { locationService } from '@/lib/services/locationService'
import { toast } from '@/hooks/useToast'

interface Location {
  id: number
  name: string
  code: string
  type: string
  address?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  description?: string
  capacity?: number
  managerId?: number
  isActive: boolean
  companyId: number // Added for multi-company support
  createdAt: string
  updatedAt: string
}

interface LocationState {
  locations: Location[]
  loading: boolean
  error: string | null
  searchTerm: string
  showModal: boolean
  editingLocation: Location | null
  currentPage: number
  pageSize: number
  totalLocations: number
  formData: {
    name: string
    code: string
    type: string
    address: string
    city: string
    state: string
    postalCode: string
    country: string
    description: string
    capacity: string
    managerId: string
    isActive: boolean
    // companyId will be auto-injected by API interceptor
  }
}

interface LocationActions {
  // Data actions
  fetchLocations: (params?: { page?: number; limit?: number; search?: string }) => Promise<void>
  createLocation: (data: LocationState['formData']) => Promise<void>
  updateLocation: (id: number, data: unknown) => Promise<void>
  deleteLocation: (id: number) => Promise<void>
  
  // UI actions
  setSearchTerm: (term: string) => void
  setShowModal: (show: boolean) => void
  setEditingLocation: (location: Location | null) => void
  setFormData: (data: Partial<LocationState['formData']>) => void
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  resetForm: () => void
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  
  // Computed getters
  getFilteredLocations: () => Location[]
  getLocationStats: () => Array<{
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
  type: 'OFFICE',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'Indonesia',
  description: '',
  capacity: '',
  managerId: '',
  isActive: true
}

export const useLocationStore = create<LocationState & LocationActions>((set, get) => ({
  // Initial state
  locations: [],
  loading: false,
  error: null,
  searchTerm: '',
  showModal: false,
  editingLocation: null,
  currentPage: 1,
  pageSize: 20,
  totalLocations: 0,
  formData: initialFormData,

  // Data actions
  fetchLocations: async (params) => {
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
      
      const response = await locationService.getAllLocations(queryParams)
      // Handle the nested response structure with pagination
      const locations = response.data?.locations || response.locations || response.data || []
      const pagination = response.data?.pagination || response.pagination || {}
      
      set({ 
        locations: Array.isArray(locations) ? locations : [], 
        totalLocations: pagination.total || 0,
        currentPage: pagination.current || 1,
        loading: false 
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch locations'
      set({ error: message, loading: false })
    }
  },

  createLocation: async (data) => {
    try {
      const formData = data as LocationState['formData']
      const locationData = {
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        managerId: formData.managerId ? parseInt(formData.managerId) : null
      }
      await locationService.createLocation(locationData)
      await get().fetchLocations()
      get().resetForm()
      toast.success('Location created successfully!')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create location'
      toast.error(message)
      throw new Error(message)
    }
  },

  updateLocation: async (id, data) => {
    try {
      const formData = data as LocationState['formData']
      const locationData = {
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        managerId: formData.managerId ? parseInt(formData.managerId) : null
      }
      await locationService.updateLocation(id, locationData)
      await get().fetchLocations()
      get().resetForm()
      toast.success('Location updated successfully!')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update location'
      toast.error(message)
      throw new Error(message)
    }
  },

  deleteLocation: async (id) => {
    try {
      await locationService.deleteLocation(id)
      await get().fetchLocations()
      toast.success('Location deleted successfully!')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete location'
      toast.error(message)
      throw new Error(message)
    }
  },

  // UI actions
  setSearchTerm: (term) => set({ searchTerm: term }),
  
  setShowModal: (show) => set({ showModal: show }),
  setPage: (page) => set({ currentPage: page }),
  setPageSize: (size) => set({ pageSize: size }),
  
  setEditingLocation: (location) => {
    set({ editingLocation: location })
    if (location) {
      set({
        formData: {
          name: location.name || '',
          code: location.code || '',
          type: location.type || 'OFFICE',
          address: location.address || '',
          city: location.city || '',
          state: location.state || '',
          postalCode: location.postalCode || '',
          country: location.country || 'Indonesia',
          description: location.description || '',
          capacity: location.capacity?.toString() || '',
          managerId: location.managerId?.toString() || '',
          isActive: location.isActive !== false
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
    editingLocation: null,
    showModal: false
  }),

  handleInputChange: (e) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    const { name, value, type } = target
    set(state => ({
      formData: {
        ...state.formData,
        [name]: type === 'checkbox' && 'checked' in target ? (target as HTMLInputElement).checked : value
      }
    }))
  },

  // Computed getters
  getFilteredLocations: () => {
    const { locations, searchTerm } = get()
    return locations.filter(location =>
      location.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.type?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  },

  getLocationStats: () => {
    const { locations } = get()
    return [
      {
        title: 'Total Locations',
        value: locations.length,
        icon: 'MapPin',
        color: 'bg-blue-500',
        textColor: 'text-blue-600',
        bgColor: 'bg-blue-50'
      },
      {
        title: 'Active Locations',
        value: locations.filter(l => l.isActive !== false).length,
        icon: 'Building',
        color: 'bg-green-500',
        textColor: 'text-green-600',
        bgColor: 'bg-green-50'
      },
      {
        title: 'Office Locations',
        value: locations.filter(l => l.type === 'OFFICE').length,
        icon: 'Building',
        color: 'bg-purple-500',
        textColor: 'text-purple-600',
        bgColor: 'bg-purple-50'
      },
      {
        title: 'Warehouse',
        value: locations.filter(l => l.type === 'WAREHOUSE').length,
        icon: 'Package',
        color: 'bg-orange-500',
        textColor: 'text-orange-600',
        bgColor: 'bg-orange-50'
      }
    ]
  }
}))
