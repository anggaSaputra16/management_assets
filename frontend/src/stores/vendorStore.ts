import { create } from 'zustand'
import { vendorService } from '@/lib/services/vendorService'
import { toast } from '@/hooks/useToast'

interface Vendor {
  id: number
  name: string
  code: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  contactPerson?: string
  website?: string
  taxId?: string
  description?: string
  isActive: boolean
  companyId: number // Added for multi-company support
  createdAt: string
  updatedAt: string
}

interface VendorState {
  vendors: Vendor[]
  loading: boolean
  error: string | null
  searchTerm: string
  showModal: boolean
  editingVendor: Vendor | null
  formData: {
    name: string
    code: string
    email: string
    phone: string
    address: string
    city: string
    state: string
    postalCode: string
    country: string
    contactPerson: string
    website: string
    taxId: string
    description: string
    isActive: boolean
    // companyId will be auto-injected by API interceptor
  }
}

interface VendorActions {
  fetchVendors: () => Promise<void>
  createVendor: (data: Partial<Vendor>) => Promise<void>
  updateVendor: (id: number, data: Partial<Vendor>) => Promise<void>
  deleteVendor: (id: number) => Promise<void>
  setSearchTerm: (term: string) => void
  setShowModal: (show: boolean) => void
  setEditingVendor: (vendor: Vendor | null) => void
  setFormData: (data: Partial<VendorState['formData']>) => void
  resetForm: () => void
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  getFilteredVendors: () => Vendor[]
  getVendorStats: () => Array<{
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
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'Indonesia',
  contactPerson: '',
  website: '',
  taxId: '',
  description: '',
  isActive: true
}

export const useVendorStore = create<VendorState & VendorActions>((set, get) => ({
  vendors: [],
  loading: false,
  error: null,
  searchTerm: '',
  showModal: false,
  editingVendor: null,
  formData: initialFormData,

  fetchVendors: async () => {
    set({ loading: true, error: null })
    try {
      const response = await vendorService.getAllVendors()
      // Handle the nested response structure
      const vendors = response.data?.vendors || response.vendors || response.data || []
      set({ vendors: Array.isArray(vendors) ? vendors : [], loading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch vendors', loading: false })
    }
  },

  createVendor: async (data) => {
    try {
      await vendorService.createVendor(data)
      await get().fetchVendors()
      get().resetForm()
      toast.success('Vendor created successfully!')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create vendor'
      toast.error(message)
      throw new Error(message)
    }
  },

  updateVendor: async (id, data) => {
    try {
      await vendorService.updateVendor(id, data)
      await get().fetchVendors()
      get().resetForm()
      toast.success('Vendor updated successfully!')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update vendor'
      toast.error(message)
      throw new Error(message)
    }
  },

  deleteVendor: async (id) => {
    try {
      await vendorService.deleteVendor(id)
      await get().fetchVendors()
      toast.success('Vendor deleted successfully!')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete vendor'
      toast.error(message)
      throw new Error(message)
    }
  },

  setSearchTerm: (term) => set({ searchTerm: term }),
  setShowModal: (show) => set({ showModal: show }),
  
  setEditingVendor: (vendor) => {
    set({ editingVendor: vendor })
    if (vendor) {
      set({
        formData: {
          name: vendor.name || '',
          code: vendor.code || '',
          email: vendor.email || '',
          phone: vendor.phone || '',
          address: vendor.address || '',
          city: vendor.city || '',
          state: vendor.state || '',
          postalCode: vendor.postalCode || '',
          country: vendor.country || 'Indonesia',
          contactPerson: vendor.contactPerson || '',
          website: vendor.website || '',
          taxId: vendor.taxId || '',
          description: vendor.description || '',
          isActive: vendor.isActive !== false
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
    editingVendor: null,
    showModal: false
  }),

  handleInputChange: (e) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const { name, value, type } = target;
    const inputValue = type === 'checkbox' && 'checked' in target
      ? (target as HTMLInputElement).checked
      : value;
    set(state => ({
      formData: {
        ...state.formData,
        [name]: inputValue
      }
    }))
  },

  getFilteredVendors: () => {
    const { vendors, searchTerm } = get()
    return vendors.filter(vendor =>
      vendor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  },

  getVendorStats: () => {
    const { vendors } = get()
    return [
      {
        title: 'Total Vendors',
        value: vendors.length,
        icon: 'Store',
        color: 'bg-blue-500',
        textColor: 'text-blue-600',
        bgColor: 'bg-blue-50'
      },
      {
        title: 'Active Vendors',
        value: vendors.filter(v => v.isActive !== false).length,
        icon: 'CheckCircle',
        color: 'bg-green-500',
        textColor: 'text-green-600',
        bgColor: 'bg-green-50'
      },
      {
        title: 'With Email',
        value: vendors.filter(v => v.email).length,
        icon: 'Mail',
        color: 'bg-purple-500',
        textColor: 'text-purple-600',
        bgColor: 'bg-purple-50'
      },
      {
        title: 'With Phone',
        value: vendors.filter(v => v.phone).length,
        icon: 'Phone',
        color: 'bg-orange-500',
        textColor: 'text-orange-600',
        bgColor: 'bg-orange-50'
      }
    ]
  }
}))
