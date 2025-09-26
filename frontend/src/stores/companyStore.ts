import { create } from 'zustand'
import { companyService, Company, CreateCompanyData, CompanyFilters } from '@/lib/services/companyService'
import { toast } from '@/hooks/useToast'

interface CompanyState {
  companies: Company[]
  currentCompany: Company | null
  loading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  
  // Actions
  fetchCompanies: (filters?: CompanyFilters) => Promise<void>
  fetchCompanyById: (id: string) => Promise<void>
  createCompany: (data: CreateCompanyData) => Promise<boolean>
  updateCompany: (id: string, data: CreateCompanyData) => Promise<boolean>
  deleteCompany: (id: string) => Promise<boolean>
  setCurrentCompany: (company: Company | null) => void
  clearError: () => void
  resetState: () => void
}

const initialState = {
  companies: [],
  currentCompany: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  }
}

export const useCompanyStore = create<CompanyState>((set, get) => ({
  ...initialState,

  fetchCompanies: async (filters = {}) => {
    set({ loading: true, error: null })
    try {
      console.log('CompanyStore: Fetching companies with filters:', filters)
      const response = await companyService.getCompanies(filters)
      console.log('CompanyStore: Received response:', response)
      set({ 
        companies: response.data,
        pagination: response.pagination,
        loading: false 
      })
    } catch (error) {
      console.error('CompanyStore: Error fetching companies:', error)
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to fetch companies'
      set({
        error: errorMessage,
        loading: false,
        companies: [],
        pagination: { ...initialState.pagination }
      })
      toast.error(errorMessage)
      throw error // Re-throw for debugging
    }
  },

  fetchCompanyById: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const response = await companyService.getCompanyById(id)
      set({ 
        currentCompany: response.data,
        loading: false 
      })
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to fetch company'
      set({ 
        error: errorMessage, 
        loading: false,
        currentCompany: null
      })
      toast.error(errorMessage)
    }
  },

  createCompany: async (data: CreateCompanyData) => {
    set({ loading: true, error: null })
    try {
      const response = await companyService.createCompany(data)
      
      // Add the new company to the list
      const { companies } = get()
      set({ 
        companies: [response.data, ...companies],
        loading: false 
      })
      
      toast.success('Company created successfully!')
      return true
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to create company'
      set({ 
        error: errorMessage, 
        loading: false 
      })
      toast.error(errorMessage)
      return false
    }
  },

  updateCompany: async (id: string, data: CreateCompanyData) => {
    set({ loading: true, error: null })
    try {
      const response = await companyService.updateCompany(id, data)
      
      // Update the company in the list
      const { companies } = get()
      const updatedCompanies = companies.map(company => 
        company.id === id ? response.data : company
      )
      
      set({ 
        companies: updatedCompanies,
        currentCompany: response.data,
        loading: false 
      })
      
      toast.success('Company updated successfully!')
      return true
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to update company'
      set({ 
        error: errorMessage, 
        loading: false 
      })
      toast.error(errorMessage)
      return false
    }
  },

  deleteCompany: async (id: string) => {
    set({ loading: true, error: null })
    try {
      await companyService.deleteCompany(id)
      
      // Remove the company from the list
      const { companies } = get()
      const filteredCompanies = companies.filter(company => company.id !== id)
      
      set({ 
        companies: filteredCompanies,
        loading: false 
      })
      
      toast.success('Company deleted successfully!')
      return true
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to delete company'
      set({ 
        error: errorMessage, 
        loading: false 
      })
      toast.error(errorMessage)
      return false
    }
  },

  setCurrentCompany: (company: Company | null) => {
    set({ currentCompany: company })
  },

  clearError: () => {
    set({ error: null })
  },

  resetState: () => {
    set(initialState)
  }
}))

export default useCompanyStore