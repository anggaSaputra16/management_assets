import { create } from 'zustand';
import api from '@/lib/api';

const useRoleStore = create((set) => ({
  roles: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  },

  // Fetch all roles
  fetchRoles: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/roles', { params });
      set({ 
        roles: response.data.data, 
        pagination: response.data.pagination,
        loading: false 
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch roles';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  // Get single role
  getRole: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/roles/${id}`);
      set({ loading: false });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch role';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  // Create new role
  createRole: async (roleData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/roles', roleData);
      set((state) => ({ 
        roles: [...state.roles, response.data],
        loading: false 
      }));
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to create role';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  // Update role
  updateRole: async (id, roleData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put(`/roles/${id}`, roleData);
      set((state) => ({
        roles: state.roles.map((role) =>
          role.id === id ? response.data : role
        ),
        loading: false
      }));
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update role';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  // Delete role
  deleteRole: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/roles/${id}`);
      set((state) => ({
        roles: state.roles.filter((role) => role.id !== id),
        loading: false
      }));
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to delete role';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  // Fetch available permissions
  fetchPermissions: async () => {
    try {
      const response = await api.get('/roles/permissions/list');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch permissions';
      set({ error: errorMessage });
      throw error;
    }
  },

  // Clear error
  clearError: () => set({ error: null })
}));

export default useRoleStore;
