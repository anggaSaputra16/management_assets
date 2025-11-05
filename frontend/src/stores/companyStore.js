import { create } from 'zustand';
import api from '../lib/api';

export const useCompanyStore = create((set) => ({
  // State
  companies: [],
  currentCompany: null,
  loading: false,
  error: null,

  // Actions
  fetchCompanies: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.append('search', params.search);
      if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);

      console.log('Fetching companies from API...');
      const response = await api.get(`/companies?${queryParams.toString()}`);
      console.log('Companies API response:', response.data);
      console.log('Companies data:', response.data.data);
      
      set({ 
        companies: response.data.data, 
        loading: false 
      });
      
      return response.data.data;
    } catch (error) {
      console.error('Error in fetchCompanies:', error);
      console.error('Error response:', error.response?.data);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchCompanyById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/companies/${id}`);
      set({ currentCompany: response.data.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  createCompany: async (companyData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/companies', companyData);
      set(state => ({
        companies: [response.data.data, ...state.companies],
        loading: false
      }));
      return response.data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateCompany: async (id, companyData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put(`/companies/${id}`, companyData);
      set(state => ({
        companies: state.companies.map(company =>
          company.id === id ? response.data.data : company
        ),
        currentCompany: state.currentCompany?.id === id ? response.data.data : state.currentCompany,
        loading: false
      }));
      return response.data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteCompany: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/companies/${id}`);
      set(state => ({
        companies: state.companies.filter(company => company.id !== id),
        currentCompany: state.currentCompany?.id === id ? null : state.currentCompany,
        loading: false
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Clear functions
  clearCurrentCompany: () => set({ currentCompany: null }),
  clearError: () => set({ error: null }),
}));