import { create } from 'zustand';
import api from '../lib/api';

const useUserStore = create((set) => ({
  users: [],
  currentUser: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  },

  // Fetch all users
  fetchUsers: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.search) params.append('search', filters.search);
      if (filters.role) params.append('role', filters.role);
      if (filters.department) params.append('department', filters.department);
      if (filters.status !== undefined) params.append('status', filters.status);

      const response = await api.get(`/users?${params.toString()}`);
      set({ 
        users: response.data.users,
        pagination: {
          page: response.data.page,
          limit: response.data.limit,
          total: response.data.total,
          totalPages: response.data.totalPages
        },
        loading: false 
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      set({ 
        error: error.response?.data?.error || 'Failed to fetch users',
        loading: false 
      });
      throw error;
    }
  },

  // Fetch user by ID
  fetchUserById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/users/${id}`);
      set({ currentUser: response.data, loading: false });
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      set({ 
        error: error.response?.data?.error || 'Failed to fetch user',
        loading: false 
      });
      throw error;
    }
  },

  // Create new user
  createUser: async (userData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/users', userData);
      const newUser = response.data;
      set((state) => ({
        users: [...state.users, newUser],
        loading: false
      }));
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      set({ 
        error: error.response?.data?.error || 'Failed to create user',
        loading: false 
      });
      throw error;
    }
  },

  // Update user
  updateUser: async (id, userData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put(`/users/${id}`, userData);
      const updatedUser = response.data;
      set((state) => ({
        users: state.users.map((user) => 
          user.id === id ? updatedUser : user
        ),
        currentUser: state.currentUser?.id === id ? updatedUser : state.currentUser,
        loading: false
      }));
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      set({ 
        error: error.response?.data?.error || 'Failed to update user',
        loading: false 
      });
      throw error;
    }
  },

  // Delete user
  deleteUser: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/users/${id}`);
      set((state) => ({
        users: state.users.filter((user) => user.id !== id),
        loading: false
      }));
    } catch (error) {
      console.error('Error deleting user:', error);
      set({ 
        error: error.response?.data?.error || 'Failed to delete user',
        loading: false 
      });
      throw error;
    }
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Clear current user
  clearCurrentUser: () => set({ currentUser: null })
}));

export default useUserStore;
