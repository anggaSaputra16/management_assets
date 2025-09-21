import { create } from 'zustand'
import { assetComponentService } from '@/lib/services/assetComponentService'
import { assetService } from '@/lib/services/assetService'

interface AssetComponent {
  id: string
  name: string
  description?: string
  partNumber?: string
  serialNumber?: string
  brand?: string
  model?: string
  status: string
  purchaseDate?: string
  purchasePrice?: number
  warrantyExpiry?: string
  isReplaceable: boolean
  isTransferable: boolean
  notes?: string
  assetId: string
  parentAssetId?: string
  asset?: {
    id: string
    name: string
    assetTag: string
  }
  parentAsset?: {
    id: string
    name: string
    assetTag: string
  }
  transfers?: unknown[]
  maintenanceRecords?: unknown[]
  createdAt: string
  updatedAt: string
}

interface ComponentState {
  components: AssetComponent[]
  compatibleAssets: Array<{
    id: string
    name: string
    assetTag: string
    category?: { name: string }
    location?: { name: string }
  }>
  loading: boolean
  error: string | null
  showModal: boolean
  showTransferModal: boolean
  showMaintenanceModal: boolean
  editingComponent: AssetComponent | null
  selectedComponent: AssetComponent | null
  formData: {
    name: string
    description: string
    partNumber: string
    serialNumber: string
    brand: string
    model: string
    purchaseDate: string
    purchasePrice: string
    warrantyExpiry: string
    isReplaceable: boolean
    isTransferable: boolean
    parentAssetId: string
    notes: string
  }
  transferData: {
    toAssetId: string
    reason: string
    notes: string
  }
  maintenanceData: {
    description: string
    maintenanceType: string
    cost: string
    notes: string
  }
}

interface ComponentActions {
  fetchComponents: (assetId: string) => Promise<void>
  addComponent: (assetId: string, data: unknown) => Promise<void>
  updateComponent: (id: string, data: unknown) => Promise<void>
  transferComponent: (id: string, data: unknown) => Promise<void>
  deleteComponent: (id: string) => Promise<void>
  addComponentMaintenance: (id: string, data: unknown) => Promise<void>
  fetchCompatibleAssets: (componentId: string) => Promise<void>
  setShowModal: (show: boolean) => void
  setShowTransferModal: (show: boolean) => void
  setShowMaintenanceModal: (show: boolean) => void
  setEditingComponent: (component: AssetComponent | null) => void
  setSelectedComponent: (component: AssetComponent | null) => void
  setFormData: (data: Partial<ComponentState['formData']>) => void
  setTransferData: (data: Partial<ComponentState['transferData']>) => void
  setMaintenanceData: (data: Partial<ComponentState['maintenanceData']>) => void
  resetForm: () => void
  resetTransferForm: () => void
  resetMaintenanceForm: () => void
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
}

const initialFormData = {
  name: '',
  description: '',
  partNumber: '',
  serialNumber: '',
  brand: '',
  model: '',
  purchaseDate: '',
  purchasePrice: '',
  warrantyExpiry: '',
  isReplaceable: true,
  isTransferable: true,
  parentAssetId: '',
  notes: ''
}

const initialTransferData = {
  toAssetId: '',
  reason: '',
  notes: ''
}

const initialMaintenanceData = {
  description: '',
  maintenanceType: 'Cleaning',
  cost: '',
  notes: ''
}

export const useAssetComponentStore = create<ComponentState & ComponentActions>((set, get) => ({
  components: [],
  compatibleAssets: [],
  loading: false,
  error: null,
  showModal: false,
  showTransferModal: false,
  showMaintenanceModal: false,
  editingComponent: null,
  selectedComponent: null,
  formData: initialFormData,
  transferData: initialTransferData,
  maintenanceData: initialMaintenanceData,

  fetchComponents: async (assetId: string) => {
    set({ loading: true, error: null })
    try {
      const response = await assetComponentService.getAssetComponents(assetId)
      set({ components: Array.isArray(response.data) ? response.data : [], loading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch components'
      set({ error: message, loading: false })
    }
  },

  addComponent: async (assetId: string, data: unknown) => {
    try {
      if (typeof data === 'object' && data !== null) {
        await assetComponentService.addComponent({ ...(data as object), assetId })
      } else {
        throw new Error('Component data must be an object')
      }
      await get().fetchComponents(assetId)
      get().resetForm()
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to add component')
    }
  },

  updateComponent: async (id: string, data: unknown) => {
    try {
      await assetComponentService.updateComponent(id, data)
      // Refresh components if we have the current asset ID
      const currentAssetId = get().components[0]?.assetId
      if (currentAssetId) {
        await get().fetchComponents(currentAssetId)
      }
      get().resetForm()
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update component')
    }
  },

  transferComponent: async (id: string, data: unknown) => {
    try {
      await assetComponentService.transferComponent(id, data)
      // Refresh components
      const currentAssetId = get().components[0]?.assetId
      if (currentAssetId) {
        await get().fetchComponents(currentAssetId)
      }
      get().resetTransferForm()
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to transfer component')
    }
  },

  deleteComponent: async (id: string) => {
    try {
      await assetComponentService.deleteComponent(id)
      set(state => ({
        components: state.components.filter(c => c.id !== id)
      }))
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete component')
    }
  },

  addComponentMaintenance: async (id: string, data: unknown) => {
    try {
      await assetComponentService.addComponentMaintenance(id, data)
      get().resetMaintenanceForm()
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to add maintenance record')
    }
  },

  fetchCompatibleAssets: async (componentId: string) => {
    set({ loading: true, error: null })
    try {
      const response = await assetService.getCompatibleAssets(componentId)
      set({ compatibleAssets: Array.isArray(response.data) ? response.data : [], loading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch compatible assets'
      set({ error: message, loading: false, compatibleAssets: [] })
    }
  },

  setShowModal: (show: boolean) => set({ showModal: show }),
  setShowTransferModal: (show: boolean) => set({ showTransferModal: show }),
  setShowMaintenanceModal: (show: boolean) => set({ showMaintenanceModal: show }),

  setEditingComponent: (component: AssetComponent | null) => {
    set({ editingComponent: component })
    if (component) {
      set({
        formData: {
          name: component.name || '',
          description: component.description || '',
          partNumber: component.partNumber || '',
          serialNumber: component.serialNumber || '',
          brand: component.brand || '',
          model: component.model || '',
          purchaseDate: component.purchaseDate ? component.purchaseDate.split('T')[0] : '',
          purchasePrice: component.purchasePrice?.toString() || '',
          warrantyExpiry: component.warrantyExpiry ? component.warrantyExpiry.split('T')[0] : '',
          isReplaceable: component.isReplaceable !== false,
          isTransferable: component.isTransferable !== false,
          parentAssetId: component.parentAssetId || '',
          notes: component.notes || ''
        },
        showModal: true
      })
    }
  },

  setSelectedComponent: (component: AssetComponent | null) => set({ selectedComponent: component }),

  setFormData: (data: Partial<ComponentState['formData']>) => set(state => ({ 
    formData: { ...state.formData, ...data } 
  })),

  setTransferData: (data: Partial<ComponentState['transferData']>) => set(state => ({ 
    transferData: { ...state.transferData, ...data } 
  })),

  setMaintenanceData: (data: Partial<ComponentState['maintenanceData']>) => set(state => ({ 
    maintenanceData: { ...state.maintenanceData, ...data } 
  })),

  resetForm: () => set({
    formData: initialFormData,
    editingComponent: null,
    showModal: false
  }),

  resetTransferForm: () => set({
    transferData: initialTransferData,
    selectedComponent: null,
    showTransferModal: false
  }),

  resetMaintenanceForm: () => set({
    maintenanceData: initialMaintenanceData,
    selectedComponent: null,
    showMaintenanceModal: false
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
