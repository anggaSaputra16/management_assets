import { create } from 'zustand'
import api from '@/lib/api'

// Types for Spare Parts Management
interface SparePart {
  id: string
  partNumber: string
  name: string
  description?: string
  brand?: string
  model?: string
  category: 'Hardware' | 'Software' | 'Accessory' | 'Consumable'
  unitPrice: number
  stockLevel: number
  minStockLevel: number
  maxStockLevel: number
  reorderPoint: number
  specifications?: Record<string, unknown>
  compatibleWith?: string[]
  partType: 'COMPONENT' | 'ACCESSORY' | 'CONSUMABLE' | 'TOOL' | 'SOFTWARE'
  status: 'ACTIVE' | 'DISCONTINUED' | 'OUT_OF_STOCK' | 'OBSOLETE'
  storageLocation?: string
  vendorId?: string
  vendor?: {
    id: string
    name: string
    code: string
  }
  notes?: string
  createdAt: string
  updatedAt: string
  _count?: {
    procurements: number
    usages: number
    replacements: number
  }
}

interface Procurement {
  id: string
  procurementNumber: string
  partId: string
  quantity: number
  unitPrice: number
  totalCost: number
  status: 'ORDERED' | 'SHIPPED' | 'RECEIVED' | 'PARTIALLY_RECEIVED' | 'CANCELLED'
  orderedDate: string
  expectedDate?: string
  receivedDate?: string
  receivedQuantity?: number
  vendorId?: string
  orderedById: string
  notes?: string
  invoiceNumber?: string
  part: {
    partNumber: string
    name: string
  }
  vendor?: {
    name: string
  }
  orderedBy: {
    firstName: string
    lastName: string
  }
}

interface PartUsage {
  id: string
  partId: string
  quantity: number
  usageType: 'REPLACEMENT' | 'UPGRADE' | 'REPAIR' | 'INSTALLATION' | 'MAINTENANCE' | 'TRANSFER'
  assetId?: string
  componentId?: string
  maintenanceId?: string
  usedById: string
  notes?: string
  usageDate: string
  part: {
    partNumber: string
    name: string
  }
  asset?: {
    assetTag: string
    name: string
  }
  usedBy: {
    firstName: string
    lastName: string
  }
}

interface PartReplacement {
  id: string
  replacementNumber: string
  oldPartId?: string
  oldComponentId?: string
  newPartId: string
  assetId: string
  reason: string
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  plannedDate?: string
  completedDate?: string
  performedById?: string
  notes?: string
  cost?: number
  newPart: {
    partNumber: string
    name: string
  }
  asset: {
    assetTag: string
    name: string
  }
  oldComponent?: {
    name: string
    partNumber?: string
  }
  performedBy?: {
    firstName: string
    lastName: string
  }
}

interface NewPartRegistration {
  id: string
  registrationNumber: string
  partId: string
  serialNumber?: string
  assetTag?: string
  status: 'PENDING' | 'APPROVED' | 'REGISTERED' | 'REJECTED'
  registeredDate?: string
  assetId?: string
  registeredById: string
  notes?: string
  part: {
    partNumber: string
    name: string
  }
  asset?: {
    assetTag: string
    name: string
  }
  registeredBy: {
    firstName: string
    lastName: string
  }
}

interface SparePartsState {
  // Inventory Management
  spareParts: SparePart[]
  currentSparePart: SparePart | null
  
  // Procurement
  procurements: Procurement[]
  currentProcurement: Procurement | null
  
  // Usage Tracking
  usages: PartUsage[]
  
  // Replacements
  replacements: PartReplacement[]
  
  // Registrations
  registrations: NewPartRegistration[]
  
  // UI State
  loading: boolean
  error: string | null
  
  // Filters
  searchTerm: string
  categoryFilter: string
  partTypeFilter: string
  statusFilter: string
  lowStockOnly: boolean
  vendorFilter: string
  
  // Modal States
  showInventoryModal: boolean
  showProcurementModal: boolean
  showUsageModal: boolean
  showReplacementModal: boolean
  showRegistrationModal: boolean
  
  // Form Data
  inventoryFormData: Partial<SparePart>
  procurementFormData: Partial<Procurement>
  usageFormData: Partial<PartUsage>
  replacementFormData: Partial<PartReplacement>
  registrationFormData: Partial<NewPartRegistration>
  
  // Analytics
  inventoryStats: {
    totalParts: number
    lowStockParts: number
    outOfStockParts: number
    totalStockItems: number
    distribution: {
      byCategory: Array<{ category: string; _count: number; _sum: { stockLevel: number } }>
      byType: Array<{ partType: string; _count: number }>
    }
    activity: {
      recentUsages: number
      pendingProcurements: number
    }
  } | null
  
  lowStockAlerts: SparePart[]
}

interface SparePartsActions {
  // Inventory Management
  fetchSpareParts: () => Promise<void>
  fetchSparePartById: (id: string) => Promise<void>
  createSparePart: (data: Partial<SparePart>) => Promise<void>
  updateSparePart: (id: string, data: Partial<SparePart>) => Promise<void>
  deleteSparePart: (id: string) => Promise<void>
  
  // Procurement
  fetchProcurements: () => Promise<void>
  createProcurement: (data: Partial<Procurement>) => Promise<void>
  receiveProcurement: (id: string, receivedQuantity: number, notes?: string) => Promise<void>
  
  // Usage Tracking
  fetchUsages: () => Promise<void>
  recordUsage: (data: Partial<PartUsage>) => Promise<void>
  
  // Replacements
  fetchReplacements: () => Promise<void>
  createReplacement: (data: Partial<PartReplacement>) => Promise<void>
  completeReplacement: (id: string, cost?: number, notes?: string) => Promise<void>
  
  // Registration
  fetchRegistrations: () => Promise<void>
  registerAsAsset: (data: {
    partId: string
    serialNumber?: string
    assetTag?: string
    categoryId: string
    locationId?: string
    departmentId?: string
    notes?: string
  }) => Promise<void>
  
  // Analytics
  fetchInventoryStats: () => Promise<void>
  fetchLowStockAlerts: () => Promise<void>
  
  // Filters
  setSearchTerm: (term: string) => void
  setCategoryFilter: (category: string) => void
  setPartTypeFilter: (type: string) => void
  setStatusFilter: (status: string) => void
  setLowStockOnly: (lowStock: boolean) => void
  setVendorFilter: (vendor: string) => void
  
  // Modal Controls
  setShowInventoryModal: (show: boolean) => void
  setShowProcurementModal: (show: boolean) => void
  setShowUsageModal: (show: boolean) => void
  setShowReplacementModal: (show: boolean) => void
  setShowRegistrationModal: (show: boolean) => void
  
  // Form Controls
  setInventoryFormData: (data: Partial<SparePart>) => void
  setProcurementFormData: (data: Partial<Procurement>) => void
  setUsageFormData: (data: Partial<PartUsage>) => void
  setReplacementFormData: (data: Partial<PartReplacement>) => void
  setRegistrationFormData: (data: Partial<NewPartRegistration>) => void
  
  resetForm: () => void
  clearError: () => void
}

// API Service
const sparePartsAPI = {
  // Inventory
  getSpareParts: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    const response = await api.get(`/spare-parts/inventory?${queryString}`)
    return response.data
  },
  
  getSparePartById: async (id: string) => {
    const response = await api.get(`/spare-parts/inventory/${id}`)
    return response.data
  },
  
  createSparePart: async (data: Partial<SparePart>) => {
    const response = await api.post('/spare-parts/inventory', data)
    return response.data
  },
  
  updateSparePart: async (id: string, data: Partial<SparePart>) => {
    const response = await api.put(`/spare-parts/inventory/${id}`, data)
    return response.data
  },
  
  // Procurement
  createProcurement: async (data: Partial<Procurement>) => {
    const response = await api.post('/spare-parts/procurement', data)
    return response.data
  },
  
  receiveProcurement: async (id: string, receivedQuantity: number, notes?: string) => {
    const response = await api.post(`/spare-parts/procurement/${id}/receive`, { receivedQuantity, notes })
    return response.data
  },
  
  // Usage
  recordUsage: async (data: Partial<PartUsage>) => {
    const response = await api.post('/spare-parts/usage', data)
    return response.data
  },
  
  // Replacement
  createReplacement: async (data: Partial<PartReplacement>) => {
    const response = await api.post('/spare-parts/replacement', data)
    return response.data
  },
  
  completeReplacement: async (id: string, cost?: number, notes?: string) => {
    const response = await api.post(`/spare-parts/replacement/${id}/complete`, { cost, notes })
    return response.data
  },
  
  // Registration
  registerAsAsset: async (data: unknown) => {
    const response = await api.post('/spare-parts/register-as-asset', data)
    return response.data
  },
  
  // Analytics
  getInventoryStats: async () => {
    const response = await api.get('/spare-parts/analytics/inventory-stats')
    return response.data
  },
  
  getLowStockAlerts: async () => {
    const response = await api.get('/spare-parts/alerts/low-stock')
    return response.data
  }
}

const initialInventoryFormData = {
  partNumber: '',
  name: '',
  description: '',
  brand: '',
  model: '',
  category: 'Hardware' as const,
  unitPrice: 0,
  stockLevel: 0,
  minStockLevel: 10,
  maxStockLevel: 100,
  reorderPoint: 15,
  partType: 'COMPONENT' as const,
  storageLocation: '',
  vendorId: '',
  notes: ''
}

const initialProcurementFormData = {
  partId: '',
  quantity: 1,
  unitPrice: 0,
  vendorId: '',
  notes: ''
}

const initialUsageFormData = {
  partId: '',
  quantity: 1,
  usageType: 'INSTALLATION' as const,
  assetId: '',
  notes: ''
}

const initialReplacementFormData = {
  newPartId: '',
  assetId: '',
  reason: '',
  notes: ''
}

const initialRegistrationFormData = {
  partId: '',
  serialNumber: '',
  assetTag: '',
  categoryId: '',
  notes: ''
}

export const useSparePartsStore = create<SparePartsState & SparePartsActions>((set, get) => ({
  // Initial State
  spareParts: [],
  currentSparePart: null,
  procurements: [],
  currentProcurement: null,
  usages: [],
  replacements: [],
  registrations: [],
  loading: false,
  error: null,
  
  // Filters
  searchTerm: '',
  categoryFilter: '',
  partTypeFilter: '',
  statusFilter: 'ACTIVE',
  lowStockOnly: false,
  vendorFilter: '',
  
  // Modal States
  showInventoryModal: false,
  showProcurementModal: false,
  showUsageModal: false,
  showReplacementModal: false,
  showRegistrationModal: false,
  
  // Form Data
  inventoryFormData: initialInventoryFormData,
  procurementFormData: initialProcurementFormData,
  usageFormData: initialUsageFormData,
  replacementFormData: initialReplacementFormData,
  registrationFormData: initialRegistrationFormData,
  
  // Analytics
  inventoryStats: null,
  lowStockAlerts: [],
  
  // Actions
  fetchSpareParts: async () => {
    set({ loading: true, error: null })
    try {
      const { searchTerm, categoryFilter, partTypeFilter, statusFilter, lowStockOnly, vendorFilter } = get()
      const params = {
        ...(searchTerm && { search: searchTerm }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(partTypeFilter && { partType: partTypeFilter }),
        ...(statusFilter && { status: statusFilter }),
        ...(lowStockOnly && { lowStock: 'true' }),
        ...(vendorFilter && { vendorId: vendorFilter })
      }
      
      const response = await sparePartsAPI.getSpareParts(params)
      if (response.success) {
        set({ spareParts: response.data.spareParts, loading: false })
      } else {
        set({ error: response.message, loading: false })
      }
    } catch (err) {
      console.error('Failed to fetch spare parts:', err)
      set({ error: 'Failed to fetch spare parts', loading: false })
    }
  },
  
  fetchSparePartById: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const response = await sparePartsAPI.getSparePartById(id)
      if (response.success) {
        set({ currentSparePart: response.data, loading: false })
      } else {
        set({ error: response.message, loading: false })
      }
    } catch (err) {
      console.error('Failed to fetch spare part details:', err)
      set({ error: 'Failed to fetch spare part details', loading: false })
    }
  },
  
  createSparePart: async (data: Partial<SparePart>) => {
    set({ loading: true, error: null })
    try {
      const response = await sparePartsAPI.createSparePart(data)
      if (response.success) {
        get().fetchSpareParts()
        get().resetForm()
        set({ showInventoryModal: false, loading: false })
      } else {
        set({ error: response.message, loading: false })
      }
    } catch (err) {
      console.error('Failed to create spare part:', err)
      set({ error: 'Failed to create spare part', loading: false })
    }
  },
  
  updateSparePart: async (id: string, data: Partial<SparePart>) => {
    set({ loading: true, error: null })
    try {
      const response = await sparePartsAPI.updateSparePart(id, data)
      if (response.success) {
        get().fetchSpareParts()
        get().resetForm()
        set({ showInventoryModal: false, loading: false })
      } else {
        set({ error: response.message, loading: false })
      }
    } catch (err) {
      console.error('Failed to update spare part:', err)
      set({ error: 'Failed to update spare part', loading: false })
    }
  },
  
  deleteSparePart: async (id: string) => {
    set({ loading: true, error: null })
    try {
      // Implement delete API call
      console.log('Deleting spare part with id:', id)
      // const response = await sparePartsAPI.deleteSparePart(id)
      get().fetchSpareParts()
      set({ loading: false })
    } catch (err) {
      console.error('Failed to delete spare part:', err)
      set({ error: 'Failed to delete spare part', loading: false })
    }
  },
  
  fetchProcurements: async () => {
    // Implement procurement fetching
  },
  
  createProcurement: async (data: Partial<Procurement>) => {
    set({ loading: true, error: null })
    try {
      const response = await sparePartsAPI.createProcurement(data)
      if (response.success) {
        get().fetchProcurements()
        get().resetForm()
        set({ showProcurementModal: false, loading: false })
      } else {
        set({ error: response.message, loading: false })
      }
    } catch (err) {
      console.error('Failed to create procurement:', err)
      set({ error: 'Failed to create procurement', loading: false })
    }
  },
  
  receiveProcurement: async (id: string, receivedQuantity: number, notes?: string) => {
    set({ loading: true, error: null })
    try {
      const response = await sparePartsAPI.receiveProcurement(id, receivedQuantity, notes)
      if (response.success) {
        get().fetchProcurements()
        get().fetchSpareParts() // Update inventory
        set({ loading: false })
      } else {
        set({ error: response.message, loading: false })
      }
    } catch (err) {
      console.error('Failed to receive procurement:', err)
      set({ error: 'Failed to receive procurement', loading: false })
    }
  },
  
  fetchUsages: async () => {
    // Implement usage fetching
  },
  
  recordUsage: async (data: Partial<PartUsage>) => {
    set({ loading: true, error: null })
    try {
      const response = await sparePartsAPI.recordUsage(data)
      if (response.success) {
        get().fetchUsages()
        get().fetchSpareParts() // Update inventory
        get().resetForm()
        set({ showUsageModal: false, loading: false })
      } else {
        set({ error: response.message, loading: false })
      }
    } catch (err) {
      console.error('Failed to record usage:', err)
      set({ error: 'Failed to record usage', loading: false })
    }
  },
  
  fetchReplacements: async () => {
    // Implement replacement fetching
  },
  
  createReplacement: async (data: Partial<PartReplacement>) => {
    set({ loading: true, error: null })
    try {
      const response = await sparePartsAPI.createReplacement(data)
      if (response.success) {
        get().fetchReplacements()
        get().resetForm()
        set({ showReplacementModal: false, loading: false })
      } else {
        set({ error: response.message, loading: false })
      }
    } catch (err) {
      console.error('Failed to create replacement:', err)
      set({ error: 'Failed to create replacement', loading: false })
    }
  },
  
  completeReplacement: async (id: string, cost?: number, notes?: string) => {
    set({ loading: true, error: null })
    try {
      const response = await sparePartsAPI.completeReplacement(id, cost, notes)
      if (response.success) {
        get().fetchReplacements()
        get().fetchSpareParts() // Update inventory
        set({ loading: false })
      } else {
        set({ error: response.message, loading: false })
      }
    } catch (err) {
      console.error('Failed to complete replacement:', err)
      set({ error: 'Failed to complete replacement', loading: false })
    }
  },
  
  fetchRegistrations: async () => {
    // Implement registration fetching
  },
  
  registerAsAsset: async (data) => {
    set({ loading: true, error: null })
    try {
      const response = await sparePartsAPI.registerAsAsset(data)
      if (response.success) {
        get().fetchRegistrations()
        get().fetchSpareParts() // Update inventory
        get().resetForm()
        set({ showRegistrationModal: false, loading: false })
      } else {
        set({ error: response.message, loading: false })
      }
    } catch (err) {
      console.error('Failed to register part as asset:', err)
      set({ error: 'Failed to register part as asset', loading: false })
    }
  },
  
  fetchInventoryStats: async () => {
    set({ loading: true, error: null })
    try {
      const response = await sparePartsAPI.getInventoryStats()
      if (response.success) {
        set({ inventoryStats: response.data, loading: false })
      } else {
        set({ error: response.message, loading: false })
      }
    } catch (err) {
      console.error('Failed to fetch inventory statistics:', err)
      set({ error: 'Failed to fetch inventory statistics', loading: false })
    }
  },
  
  fetchLowStockAlerts: async () => {
    try {
      const response = await sparePartsAPI.getLowStockAlerts()
      if (response.success) {
        set({ lowStockAlerts: response.data })
      }
    } catch (error) {
      console.error('Failed to fetch low stock alerts:', error)
    }
  },
  
  // Filter Actions
  setSearchTerm: (term: string) => set({ searchTerm: term }),
  setCategoryFilter: (category: string) => set({ categoryFilter: category }),
  setPartTypeFilter: (type: string) => set({ partTypeFilter: type }),
  setStatusFilter: (status: string) => set({ statusFilter: status }),
  setLowStockOnly: (lowStock: boolean) => set({ lowStockOnly: lowStock }),
  setVendorFilter: (vendor: string) => set({ vendorFilter: vendor }),
  
  // Modal Actions
  setShowInventoryModal: (show: boolean) => set({ showInventoryModal: show }),
  setShowProcurementModal: (show: boolean) => set({ showProcurementModal: show }),
  setShowUsageModal: (show: boolean) => set({ showUsageModal: show }),
  setShowReplacementModal: (show: boolean) => set({ showReplacementModal: show }),
  setShowRegistrationModal: (show: boolean) => set({ showRegistrationModal: show }),
  
  // Form Actions
  setInventoryFormData: (data: Partial<SparePart>) => 
    set((state) => ({ inventoryFormData: { ...state.inventoryFormData, ...data } })),
  
  setProcurementFormData: (data: Partial<Procurement>) => 
    set((state) => ({ procurementFormData: { ...state.procurementFormData, ...data } })),
  
  setUsageFormData: (data: Partial<PartUsage>) => 
    set((state) => ({ usageFormData: { ...state.usageFormData, ...data } })),
  
  setReplacementFormData: (data: Partial<PartReplacement>) => 
    set((state) => ({ replacementFormData: { ...state.replacementFormData, ...data } })),
  
  setRegistrationFormData: (data: Partial<NewPartRegistration>) => 
    set((state) => ({ registrationFormData: { ...state.registrationFormData, ...data } })),
  
  resetForm: () => set({
    inventoryFormData: initialInventoryFormData,
    procurementFormData: initialProcurementFormData,
    usageFormData: initialUsageFormData,
    replacementFormData: initialReplacementFormData,
    registrationFormData: initialRegistrationFormData
  }),
  
  clearError: () => set({ error: null })
}))

export default useSparePartsStore
