import { create } from 'zustand'
import { locationService } from '@/lib/services/locationService'

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
  }
}

interface LocationActions {
  // Data actions
  fetchLocations: () => Promise<void>
  createLocation: (data: LocationState['formData']) => Promise<void>
  updateLocation: (id: number, data: unknown) => Promise<void>
  deleteLocation: (id: number) => Promise<void>
  
  // UI actions
  setSearchTerm: (term: string) => void
  setShowModal: (show: boolean) => void
  setEditingLocation: (location: Location | null) => void
  setFormData: (data: Partial<LocationState['formData']>) => void
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
  formData: initialFormData,

  // Data actions
  fetchLocations: async () => {
    set({ loading: true, error: null })
    try {
      const response = await locationService.getAllLocations()
      // Handle the nested response structure
      const locations = response.data?.locations || response.locations || response.data || []
      set({ locations: Array.isArray(locations) ? locations : [], loading: false })
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
      get().fetchLocations()
      get().resetForm()
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response?: { data?: { message?: string } } }
        throw new Error(apiError.response?.data?.message || 'Failed to create location')
      }
      throw new Error(error instanceof Error ? error.message : 'Failed to create location')
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
      get().fetchLocations()
      get().resetForm()
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response === 'object'
      ) {
        const err = error as { response?: { data?: { message?: string } } }
        throw new Error(err.response?.data?.message || 'Failed to update location')
      }
      throw new Error('Failed to update location')
    }
  },

  deleteLocation: async (id) => {
    try {
      await locationService.deleteLocation(id)
      get().fetchLocations()
    } catch {
      throw new Error('Failed to delete location')
    }
  },

  // UI actions
  setSearchTerm: (term) => set({ searchTerm: term }),
  
  setShowModal: (show) => set({ showModal: show }),
  
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
