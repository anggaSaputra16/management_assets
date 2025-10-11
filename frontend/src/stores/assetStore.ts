import { create } from 'zustand'
import { assetService } from '@/lib/services'
import { Asset } from '@/types'

interface AssetState {
  assets: Asset[]
  currentAsset: Asset | null
  loading: boolean
  error: string | null
  searchTerm: string
  statusFilter: string
  conditionFilter: string
  showModal: boolean
  editingAsset: Asset | null
  formData: {
    name: string
    assetTag: string
    categoryId: string
    locationId: string
    departmentId: string
    vendorId: string
    assignedToId: string
    model: string
    serialNumber: string
    brand: string
    poNumber: string
    status: string
    condition: string
    purchaseDate: string
    purchasePrice: string
    depreciationRate: string
    warrantyExpiry: string
    description: string
    specifications?: Record<string, string>
  }
}

interface ImportResult {
  success: boolean
  data?: Asset[]
  errors?: string[]
}

interface ExportFilters {
  status?: string
  condition?: string
  categoryId?: string
  locationId?: string
  departmentId?: string
}

interface AssetActions {
  fetchAssets: () => Promise<void>
  fetchAsset: (id: string) => Promise<void>
  fetchMultipleAssets: (ids: string[]) => Promise<void>
  createAsset: (data: Partial<Asset> | FormData) => Promise<void>
  updateAsset: (id: string, data: Partial<Asset> | FormData) => Promise<void>
  deleteAsset: (id: string) => Promise<void>
  bulkImportAssets: (assetsData: Partial<Asset>[]) => Promise<ImportResult>
  exportAssets: (format?: string, filters?: ExportFilters) => Promise<Blob>
  setSearchTerm: (term: string) => void
  setStatusFilter: (status: string) => void
  setConditionFilter: (condition: string) => void
  setShowModal: (show: boolean) => void
  setEditingAsset: (asset: Asset | null) => void
  setFormData: (data: Partial<AssetState['formData']>) => void
  resetForm: () => void
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  handleFieldChange: (field: string, value: unknown) => void
  getFilteredAssets: () => Asset[]
  getAssetStats: () => Array<{
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
  assetTag: '',
  categoryId: '',
  locationId: '',
  departmentId: '',
  vendorId: '',
  assignedToId: '',
  model: '',
  serialNumber: '',
  brand: '',
  poNumber: '',
  status: 'ACTIVE',
  condition: 'GOOD',
  purchaseDate: '',
  purchasePrice: '',
  depreciationRate: '',
  warrantyExpiry: '',
  description: '',
  specifications: {}
}

export const useAssetStore = create<AssetState & AssetActions>((set, get) => ({
  assets: [],
  currentAsset: null,
  loading: false,
  error: null,
  searchTerm: '',
  statusFilter: '',
  conditionFilter: '',
  showModal: false,
  editingAsset: null,
  formData: initialFormData,

  fetchAssets: async () => {
    set({ loading: true, error: null })
    try {
      const response = await assetService.getAllAssets()
      set({ assets: response.data || [], loading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch assets', loading: false })
    }
  },

  fetchAsset: async (id) => {
    set({ loading: true, error: null })
    try {
      const response = await assetService.getAssetById(id)
      set({ currentAsset: response.data || null, loading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch asset', loading: false })
    }
  },

  fetchMultipleAssets: async (ids) => {
    set({ loading: true, error: null })
    try {
      const assetPromises = ids.map(id => assetService.getAssetById(id))
      const responses = await Promise.all(assetPromises)
      const fetchedAssets = responses.map(response => response.data).filter(Boolean)
      set({ assets: fetchedAssets, loading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch assets', loading: false })
    }
  },

  createAsset: async (data) => {
    try {
      // If data is FormData, pass it directly to the service
      if (data instanceof FormData) {
        await assetService.createAsset(data)
      } else {
        // Handle regular object data
        const assetData = {
          ...data,
          // Keep IDs as strings since backend uses CUID strings
          categoryId: data.categoryId?.toString() || '',
          locationId: data.locationId?.toString() || '',
          departmentId: data.departmentId ? data.departmentId.toString() : null,
          vendorId: data.vendorId ? data.vendorId.toString() : null,
          assignedToId: data.assignedToId ? data.assignedToId.toString() : null,
          // Send prices as strings (backend will convert)
          purchasePrice: data.purchasePrice ? data.purchasePrice.toString() : null,
          currentValue: data.currentValue ? data.currentValue.toString() : null,
          // Format dates properly
          purchaseDate: data.purchaseDate ? data.purchaseDate.toString() : null,
          warrantyExpiry: data.warrantyExpiry ? data.warrantyExpiry.toString() : null,
          // Ensure specifications is properly passed
          specifications: data.specifications || {},
          // Remove fields that shouldn't be sent to create endpoint
          assetTag: undefined,
          depreciationRate: undefined // This should be handled in depreciation module, not asset creation
        }
        await assetService.createAsset(assetData)
      }
      get().fetchAssets()
      get().resetForm()
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create asset')
    }
  },

  updateAsset: async (id, data) => {
    try {
      // If data is FormData, pass it directly to the service
      if (data instanceof FormData) {
        await assetService.updateAsset(id, data)
      } else {
        // Handle regular object data
        const assetData = {
          ...data,
          // Keep IDs as strings since backend uses CUID strings
          categoryId: data.categoryId?.toString() || undefined,
          locationId: data.locationId?.toString() || undefined,
          departmentId: data.departmentId ? data.departmentId.toString() : null,
          vendorId: data.vendorId ? data.vendorId.toString() : null,
          assignedToId: data.assignedToId ? data.assignedToId.toString() : null,
          // Send prices as strings (backend will convert)
          purchasePrice: data.purchasePrice ? data.purchasePrice.toString() : null,
          currentValue: data.currentValue ? data.currentValue.toString() : null,
          // Format dates properly
          purchaseDate: data.purchaseDate ? data.purchaseDate.toString() : null,
          warrantyExpiry: data.warrantyExpiry ? data.warrantyExpiry.toString() : null,
          // Make sure specifications is properly passed
          specifications: data.specifications || undefined,
          // Remove fields that shouldn't be sent to update endpoint
          depreciationRate: undefined // This should be handled in depreciation module, not asset update
        }
        await assetService.updateAsset(id, assetData)
      }
      get().fetchAssets()
      get().resetForm()
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update asset')
    }
  },

  deleteAsset: async (id) => {
    try {
      await assetService.deleteAsset(id)
      get().fetchAssets()
    } catch {
      throw new Error('Failed to delete asset')
    }
  },

  bulkImportAssets: async (assetsData) => {
    try {
      const result = await assetService.bulkImport(assetsData)
      get().fetchAssets()
      return result
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to import assets')
    }
  },

  exportAssets: async (format = 'csv', filters = {}) => {
    try {
      return await assetService.exportAssets(format, filters)
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to export assets')
    }
  },

  setSearchTerm: (term) => set({ searchTerm: term }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  setConditionFilter: (condition) => set({ conditionFilter: condition }),
  setShowModal: (show) => set({ showModal: show }),
  
  setEditingAsset: (asset) => {
    set({ editingAsset: asset })
    if (asset) {
      set({
        formData: {
          name: asset.name || '',
          assetTag: asset.assetTag || '',
          categoryId: asset.categoryId?.toString() || '',
          locationId: asset.locationId?.toString() || '',
          departmentId: asset.departmentId?.toString() || '',
          vendorId: asset.vendorId?.toString() || '',
          assignedToId: asset.assignedToId?.toString() || '',
          model: asset.model || '',
          serialNumber: asset.serialNumber || '',
          brand: asset.brand || '',
          poNumber: asset.poNumber || '',
          status: asset.status || 'ACTIVE',
          condition: asset.condition || 'GOOD',
          purchaseDate: asset.purchaseDate ? asset.purchaseDate.split('T')[0] : '',
          purchasePrice: asset.purchasePrice?.toString() || '',
          depreciationRate: asset.depreciationRate?.toString() || '',
          warrantyExpiry: asset.warrantyExpiry ? asset.warrantyExpiry.split('T')[0] : '',
          description: asset.description || '',
          specifications: asset.specifications || {}
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
    editingAsset: null,
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

  handleFieldChange: (field, value) => {
    set(state => ({
      formData: {
        ...state.formData,
        [field]: value
      }
    }))
  },

  getFilteredAssets: () => {
    const { assets, searchTerm, statusFilter, conditionFilter } = get()
    return assets.filter(asset => {
      const matchesSearch = !searchTerm || 
        asset.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.assetTag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.model?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = !statusFilter || asset.status === statusFilter
      const matchesCondition = !conditionFilter || asset.condition === conditionFilter
      
      return matchesSearch && matchesStatus && matchesCondition
    })
  },

  getAssetStats: () => {
    const { assets } = get()
    return [
      {
        title: 'Total Assets',
        value: assets.length,
        icon: 'Package',
        color: 'bg-blue-500',
        textColor: 'text-blue-600',
        bgColor: 'bg-blue-50'
      },
      {
        title: 'Active Assets',
        value: assets.filter(a => a.status === 'AVAILABLE').length,
        icon: 'CheckCircle',
        color: 'bg-green-500',
        textColor: 'text-green-600',
        bgColor: 'bg-green-50'
      },
      {
        title: 'In Maintenance',
        value: assets.filter(a => a.status === 'MAINTENANCE').length,
        icon: 'Wrench',
        color: 'bg-yellow-500',
        textColor: 'text-yellow-600',
        bgColor: 'bg-yellow-50'
      },
      {
        title: 'Retired Assets',
        value: assets.filter(a => a.status === 'RETIRED').length,
        icon: 'Archive',
        color: 'bg-red-500',
        textColor: 'text-red-600',
        bgColor: 'bg-red-50'
      }
    ]
  }
}))
