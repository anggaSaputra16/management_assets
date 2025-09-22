import { create } from 'zustand'
import { assetSpecificationService } from '@/lib/services/assetSpecificationService'

interface AssetSpecification {
  id: string
  name: string
  value: string
  unit?: string
  category?: string
  isCore: boolean
  assetId: string
  createdAt: string
  updatedAt: string
}

interface SpecificationState {
  specifications: AssetSpecification[]
  grouped: Record<string, AssetSpecification[]>
  loading: boolean
  error: string | null
  showModal: boolean
  showBulkModal: boolean
  editingSpecification: AssetSpecification | null
  formData: {
    name: string
    value: string
    unit: string
    category: string
    isCore: boolean
  }
  bulkSpecs: AssetSpecification[]
}

interface SpecificationActions {
  fetchSpecifications: (assetId: string) => Promise<void>
  addSpecification: (assetId: string, data: unknown) => Promise<void>
  updateSpecification: (id: string, data: unknown) => Promise<void>
  deleteSpecification: (id: string) => Promise<void>
  bulkUpdateSpecifications: (assetId: string, specifications: unknown[]) => Promise<void>
  setShowModal: (show: boolean) => void
  setShowBulkModal: (show: boolean) => void
  setEditingSpecification: (specification: AssetSpecification | null) => void
  setFormData: (data: Partial<SpecificationState['formData']>) => void
  setBulkSpecs: (specs: AssetSpecification[]) => void
  addBulkSpec: () => void
  removeBulkSpec: (index: number) => void
  updateBulkSpec: (index: number, field: string, value: unknown) => void
  resetForm: () => void
  resetBulkForm: () => void
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
}

const initialFormData = {
  name: '',
  value: '',
  unit: '',
  category: 'Hardware',
  isCore: false
}

export const useAssetSpecificationStore = create<SpecificationState & SpecificationActions>((set, get) => ({
  specifications: [],
  grouped: {},
  loading: false,
  error: null,
  showModal: false,
  showBulkModal: false,
  editingSpecification: null,
  formData: initialFormData,
  bulkSpecs: [],

  fetchSpecifications: async (assetId: string) => {
    set({ loading: true, error: null })
    try {
      const response = await assetSpecificationService.getAssetSpecifications(assetId)
      set({ 
        specifications: Array.isArray(response.data.specifications) ? response.data.specifications : [],
        grouped: response.data.grouped || {},
        loading: false 
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch specifications'
      set({ error: message, loading: false })
    }
  },

  addSpecification: async (assetId: string, data: unknown) => {
    try {
      await assetSpecificationService.addSpecification({ ...(data as object), assetId })
      await get().fetchSpecifications(assetId)
      get().resetForm()
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to add specification')
    }
  },

  updateSpecification: async (id: string, data: unknown) => {
    try {
      await assetSpecificationService.updateSpecification(id, data)
      // Refresh specifications if we have the current asset ID
      const currentAssetId = get().specifications[0]?.assetId
      if (currentAssetId) {
        await get().fetchSpecifications(currentAssetId)
      }
      get().resetForm()
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update specification')
    }
  },

  deleteSpecification: async (id: string) => {
    try {
      await assetSpecificationService.deleteSpecification(id)
      set(state => ({
        specifications: state.specifications.filter(s => s.id !== id)
      }))
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete specification')
    }
  },

  bulkUpdateSpecifications: async (assetId: string, specifications: unknown[]) => {
    try {
      await assetSpecificationService.bulkUpdateSpecifications(assetId, specifications)
      await get().fetchSpecifications(assetId)
      get().resetBulkForm()
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update specifications')
    }
  },

  setShowModal: (show: boolean) => set({ showModal: show }),
  setShowBulkModal: (show: boolean) => set({ showBulkModal: show }),

  setEditingSpecification: (specification: AssetSpecification | null) => {
    set({ editingSpecification: specification })
    if (specification) {
      set({
        formData: {
          name: specification.name || '',
          value: specification.value || '',
          unit: specification.unit || '',
          category: specification.category || 'Hardware',
          isCore: specification.isCore !== false
        },
        showModal: true
      })
    }
  },

  setFormData: (data: Partial<SpecificationState['formData']>) => set(state => ({ 
    formData: { ...state.formData, ...data } 
  })),

  setBulkSpecs: (specs: AssetSpecification[]) => set({ bulkSpecs: specs }),

  addBulkSpec: () => set(state => ({
    bulkSpecs: [...state.bulkSpecs, { ...initialFormData, id: Date.now().toString() } as AssetSpecification]
  })),

  removeBulkSpec: (index: number) => set(state => ({
    bulkSpecs: state.bulkSpecs.filter((_, i) => i !== index)
  })),

  updateBulkSpec: (index: number, field: string, value: unknown) => set(state => ({
    bulkSpecs: state.bulkSpecs.map((spec, i) => 
      i === index ? { ...spec, [field]: value } : spec
    )
  })),

  resetForm: () => set({
    formData: initialFormData,
    editingSpecification: null,
    showModal: false
  }),

  resetBulkForm: () => set({
    bulkSpecs: [],
    showBulkModal: false
  }),

  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    const { name, value, type } = target
    const checked = (target as HTMLInputElement).checked
    
    set(state => ({
      formData: {
        ...state.formData,
        [name]: type === 'checkbox' ? checked : value
      }
    }))
  }
}))
