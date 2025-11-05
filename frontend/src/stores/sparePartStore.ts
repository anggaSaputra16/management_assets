import { create } from 'zustand'
import { sparePartService } from '@/lib/services/sparePartService'
import { toast } from '@/hooks/useToast'

interface SparePart {
  id: string
  partNumber: string
  name: string
  description?: string
  brand?: string
  model?: string
  category: 'HARDWARE' | 'SOFTWARE' | 'ACCESSORY' | 'CONSUMABLE'
  partType: 'COMPONENT' | 'ACCESSORY' | 'CONSUMABLE' | 'TOOL' | 'SOFTWARE'
  status: 'ACTIVE' | 'DISCONTINUED' | 'OUT_OF_STOCK' | 'OBSOLETE'
  stockLevel: number
  minStockLevel: number
  maxStockLevel: number
  reorderPoint: number
  storageLocation?: string
  specifications?: object
  compatibleWith?: string[]
  notes?: string
  vendorId?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  vendor?: {
    id: string
    name: string
    code: string
  }
  _count?: {
    usages: number
    procurements: number
  }
}

interface SparePartState {
  spareParts: SparePart[]
  loading: boolean
  error: string | null
  selectedSparePart: SparePart | null
  isCreateModalOpen: boolean
  isEditModalOpen: boolean
  isDeleteModalOpen: boolean
  isStockModalOpen: boolean
  formData: {
    partNumber: string
    name: string
    description: string
    brand: string
    model: string
    category: 'HARDWARE' | 'SOFTWARE' | 'ACCESSORY' | 'CONSUMABLE'
    partType: 'COMPONENT' | 'ACCESSORY' | 'CONSUMABLE' | 'TOOL' | 'SOFTWARE'
    status: 'ACTIVE' | 'DISCONTINUED' | 'OUT_OF_STOCK' | 'OBSOLETE'
    stockLevel: string
    minStockLevel: string
    maxStockLevel: string
    reorderPoint: string
    storageLocation: string
    specifications: string
    compatibleWith: string
    notes: string
    vendorId: string
    isActive: boolean
  }
  stockData: {
    stockLevel: string
    notes: string
  }
  filters: {
    search: string
    category: string
    partType: string
    status: string
    vendor: string
    lowStock: boolean
  }
}

interface SparePartActions {
  fetchSpareParts: () => Promise<void>
  createSparePart: (data: Partial<SparePart>) => Promise<void>
  updateSparePart: (id: string, data: Partial<SparePart>) => Promise<void>
  deleteSparePart: (id: string) => Promise<void>
  updateStockLevel: (id: string, stockData: { stockLevel: number; notes?: string }) => Promise<void>
  setSelectedSparePart: (sparePart: SparePart | null) => void
  setIsCreateModalOpen: (isOpen: boolean) => void
  setIsEditModalOpen: (isOpen: boolean) => void
  setIsDeleteModalOpen: (isOpen: boolean) => void
  setIsStockModalOpen: (isOpen: boolean) => void
  setFormData: (data: Partial<SparePartState['formData']>) => void
  setStockData: (data: Partial<SparePartState['stockData']>) => void
  setFilters: (filters: Partial<SparePartState['filters']>) => void
  resetForm: () => void
  resetStockForm: () => void
  getFilteredSpareParts: () => SparePart[]
}

const initialFormData = {
  partNumber: '',
  name: '',
  description: '',
  brand: '',
  model: '',
  category: 'HARDWARE' as const,
  partType: 'COMPONENT' as const,
  status: 'ACTIVE' as const,
  stockLevel: '',
  minStockLevel: '10',
  maxStockLevel: '100',
  reorderPoint: '15',
  storageLocation: '',
  specifications: '',
  compatibleWith: '',
  notes: '',
  vendorId: '',
  isActive: true
}

const initialStockData = {
  stockLevel: '',
  notes: ''
}

const initialFilters = {
  search: '',
  category: '',
  partType: '',
  status: '',
  vendor: '',
  lowStock: false
}

export const useSparePartStore = create<SparePartState & SparePartActions>((set, get) => ({
  spareParts: [],
  loading: false,
  error: null,
  selectedSparePart: null,
  isCreateModalOpen: false,
  isEditModalOpen: false,
  isDeleteModalOpen: false,
  isStockModalOpen: false,
  formData: initialFormData,
  stockData: initialStockData,
  filters: initialFilters,

  fetchSpareParts: async () => {
    set({ loading: true, error: null })
    try {
      const { filters } = get()
      const response = await sparePartService.getAllSpareParts(filters)
      const spareParts = response.data || []
      
      set({ 
        spareParts: Array.isArray(spareParts) ? spareParts : [],
        loading: false 
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch spare parts'
      set({ error: message, loading: false })
      toast.error(message)
    }
  },

  createSparePart: async (data) => {
    try {
      set({ loading: true })
      
      // Process form data
      const processedData = {
        ...data,
        // unitPrice intentionally omitted from inventory create/update in this module
        stockLevel: parseInt(data.stockLevel?.toString() || '0'),
        minStockLevel: parseInt(data.minStockLevel?.toString() || '10'),
        maxStockLevel: parseInt(data.maxStockLevel?.toString() || '100'),
        reorderPoint: parseInt(data.reorderPoint?.toString() || '15'),
        specifications: data.specifications ? JSON.parse(data.specifications.toString()) : undefined,
        compatibleWith: data.compatibleWith ? data.compatibleWith.toString().split(',').map(s => s.trim()) : undefined,
        vendorId: data.vendorId || undefined
      }
      
      await sparePartService.createSparePart(processedData)
      await get().fetchSpareParts()
      get().setIsCreateModalOpen(false)
      get().resetForm()
      toast.success('Spare part created successfully!')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create spare part'
      toast.error(message)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  updateSparePart: async (id, data) => {
    try {
      set({ loading: true })
      
      // Process form data
      const processedData = {
        ...data,
        // unitPrice intentionally omitted from inventory create/update in this module
        stockLevel: parseInt(data.stockLevel?.toString() || '0'),
        minStockLevel: parseInt(data.minStockLevel?.toString() || '10'),
        maxStockLevel: parseInt(data.maxStockLevel?.toString() || '100'),
        reorderPoint: parseInt(data.reorderPoint?.toString() || '15'),
        specifications: data.specifications ? JSON.parse(data.specifications.toString()) : undefined,
        compatibleWith: data.compatibleWith ? data.compatibleWith.toString().split(',').map(s => s.trim()) : undefined,
        vendorId: data.vendorId || undefined
      }
      
      await sparePartService.updateSparePart(id, processedData)
      await get().fetchSpareParts()
      get().setIsEditModalOpen(false)
      get().resetForm()
      toast.success('Spare part updated successfully!')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update spare part'
      toast.error(message)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  deleteSparePart: async (id) => {
    try {
      set({ loading: true })
      await sparePartService.deleteSparePart(id)
      await get().fetchSpareParts()
      get().setIsDeleteModalOpen(false)
      get().setSelectedSparePart(null)
      toast.success('Spare part deleted successfully!')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete spare part'
      toast.error(message)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  updateStockLevel: async (id, stockData) => {
    try {
      set({ loading: true })
      await sparePartService.updateStockLevel(id, stockData)
      await get().fetchSpareParts()
      get().setIsStockModalOpen(false)
      get().resetStockForm()
      toast.success('Stock level updated successfully!')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update stock level'
      toast.error(message)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  setSelectedSparePart: (sparePart) => set({ selectedSparePart: sparePart }),
  setIsCreateModalOpen: (isOpen) => set({ isCreateModalOpen: isOpen }),
  setIsEditModalOpen: (isOpen) => set({ isEditModalOpen: isOpen }),
  setIsDeleteModalOpen: (isOpen) => set({ isDeleteModalOpen: isOpen }),
  setIsStockModalOpen: (isOpen) => set({ isStockModalOpen: isOpen }),
  
  setFormData: (data) => set(state => ({ 
    formData: { ...state.formData, ...data } 
  })),

  setStockData: (data) => set(state => ({ 
    stockData: { ...state.stockData, ...data } 
  })),

  setFilters: (filters) => set(state => ({ 
    filters: { ...state.filters, ...filters } 
  })),

  resetForm: () => set({ 
    formData: initialFormData,
    selectedSparePart: null 
  }),

  resetStockForm: () => set({ 
    stockData: initialStockData 
  }),

  getFilteredSpareParts: () => {
    const { spareParts, filters } = get()
    if (!Array.isArray(spareParts)) return []
    
    return spareParts.filter(part => {
      const matchesSearch = !filters.search || 
        part.partNumber.toLowerCase().includes(filters.search.toLowerCase()) ||
        part.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        part.brand?.toLowerCase().includes(filters.search.toLowerCase()) ||
        part.model?.toLowerCase().includes(filters.search.toLowerCase())
      
      const matchesCategory = !filters.category || part.category === filters.category
      const matchesPartType = !filters.partType || part.partType === filters.partType
      const matchesStatus = !filters.status || part.status === filters.status
      const matchesVendor = !filters.vendor || part.vendorId === filters.vendor
      const matchesLowStock = !filters.lowStock || part.stockLevel <= part.reorderPoint
      
      return matchesSearch && matchesCategory && matchesPartType && 
             matchesStatus && matchesVendor && matchesLowStock
    })
  }
}))