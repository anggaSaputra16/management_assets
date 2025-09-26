import { api } from '../api'

export interface Company {
  id: string
  name: string
  code: string
  address?: string
  phone?: string
  email?: string
  website?: string
  logo?: string
  taxNumber?: string
  registrationNumber?: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    users: number
    departments: number
    assets: number
    locations: number
    categories: number
    vendors: number
  }
}

export interface CreateCompanyData {
  name: string
  code: string
  address?: string
  phone?: string
  email?: string
  website?: string
  logo?: string
  taxNumber?: string
  registrationNumber?: string
  description?: string
  isActive: boolean
}

export interface UpdateCompanyData extends CreateCompanyData {
  id: string
}

export interface CompanyFilters {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
}

export interface CompanyResponse {
  success: boolean
  data: Company[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface SingleCompanyResponse {
  success: boolean
  data: Company
}

export interface CompanyStatsResponse {
  success: boolean
  data: {
    totalCompanies: number
    recentCompanies: Array<{
      id: string
      name: string
      code: string
      createdAt: string
      isActive: boolean
    }>
  }
}

class CompanyService {
  async getCompanies(filters: CompanyFilters = {}): Promise<CompanyResponse> {
    const response = await api.get('/companies', { params: filters })
    return response.data
  }

  async getCompanyById(id: string): Promise<SingleCompanyResponse> {
    const response = await api.get(`/companies/${id}`)
    return response.data
  }

  async createCompany(data: CreateCompanyData): Promise<SingleCompanyResponse> {
    const response = await api.post('/companies', data)
    return response.data
  }

  async updateCompany(id: string, data: CreateCompanyData): Promise<SingleCompanyResponse> {
    const response = await api.put(`/companies/${id}`, data)
    return response.data
  }

  async deleteCompany(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/companies/${id}`)
    return response.data
  }

  async getCompanyStats(): Promise<CompanyStatsResponse> {
    const response = await api.get('/companies/stats')
    return response.data
  }
}

export const companyService = new CompanyService()
export default companyService