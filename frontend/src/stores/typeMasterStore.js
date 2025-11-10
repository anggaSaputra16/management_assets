import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

// Cache duration: 10 minutes
const CACHE_DURATION = 10 * 60 * 1000;

/**
 * Type Master Store
 * Manages dynamic type data from GlobalTypeMaster table
 * Replaces all hardcoded enums with API-driven types
 */
const useTypeMasterStore = create(
  persist(
    (set, get) => ({
      // State
      typesByGroup: {}, // { UserRole: [{key, label, sortOrder}], AssetStatus: [...], ... }
      lastFetch: {}, // { UserRole: timestamp, AssetStatus: timestamp, ... }
      loading: {}, // { UserRole: true/false, ... }
      errors: {}, // { UserRole: 'error message', ... }
      isHydrated: false,

      // Actions
      
      /**
       * Set hydration status (for SSR compatibility)
       */
      setHydrated: () => set({ isHydrated: true }),

      /**
       * Load types for a specific group
       * @param {string} group - Type group name (e.g., 'UserRole', 'AssetStatus')
       * @param {boolean} forceRefresh - Force refresh even if cached
       */
      loadTypes: async (group, forceRefresh = false) => {
        const state = get();
        
        // Check if cache is still valid
        if (!forceRefresh && state.typesByGroup[group] && state.lastFetch[group]) {
          const age = Date.now() - state.lastFetch[group];
          if (age < CACHE_DURATION) {
            console.log(`✅ Using cached types for ${group} (age: ${Math.round(age / 1000)}s)`);
            return state.typesByGroup[group];
          }
        }

        // Set loading state
        set(state => ({
          loading: { ...state.loading, [group]: true },
          errors: { ...state.errors, [group]: null }
        }));

        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`${API_BASE_URL}/master/types`, {
            params: { group, isActive: true },
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });

          const types = response.data;
          
          set(state => ({
            typesByGroup: { ...state.typesByGroup, [group]: types },
            lastFetch: { ...state.lastFetch, [group]: Date.now() },
            loading: { ...state.loading, [group]: false }
          }));

          console.log(`✅ Loaded ${types.length} types for ${group}`);
          return types;
        } catch (error) {
          console.error(`❌ Error loading types for ${group}:`, error);
          const errorMessage = error.response?.data?.error || error.message;
          
          set(state => ({
            loading: { ...state.loading, [group]: false },
            errors: { ...state.errors, [group]: errorMessage }
          }));

          throw error;
        }
      },

      /**
       * Load multiple type groups at once
       * @param {string[]} groups - Array of group names
       */
      loadMultipleTypes: async (groups) => {
        const promises = groups.map(group => get().loadTypes(group));
        return Promise.all(promises);
      },

      /**
       * Get types for a specific group (from cache or load if needed)
       * @param {string} group - Type group name
       * @returns {Promise<Array>} Array of types
       */
      getTypes: async (group) => {
        const state = get();
        
        // If already loaded and fresh, return from cache
        if (state.typesByGroup[group] && state.lastFetch[group]) {
          const age = Date.now() - state.lastFetch[group];
          if (age < CACHE_DURATION) {
            return state.typesByGroup[group];
          }
        }

        // Otherwise, load from API
        return get().loadTypes(group);
      },

      /**
       * Get types synchronously (only returns if already in cache)
       * @param {string} group - Type group name
       * @returns {Array} Array of types or empty array
       */
      getTypesSync: (group) => {
        return get().typesByGroup[group] || [];
      },

      /**
       * Get label for a specific type key
       * @param {string} group - Type group name
       * @param {string} key - Type key
       * @returns {string} Label or key if not found
       */
      getTypeLabel: (group, key) => {
        const types = get().typesByGroup[group] || [];
        const type = types.find(t => t.key === key);
        return type?.label || key;
      },

      /**
       * Check if a type key is valid for a group
       * @param {string} group - Type group name
       * @param {string} key - Type key to validate
       * @returns {boolean} True if valid
       */
      isValidType: (group, key) => {
        const types = get().typesByGroup[group] || [];
        return types.some(t => t.key === key);
      },

      /**
       * Refresh all cached types
       */
      refreshAllTypes: async () => {
        const state = get();
        const groups = Object.keys(state.typesByGroup);
        
        if (groups.length === 0) {
          console.log('No types to refresh');
          return;
        }

        console.log(`Refreshing ${groups.length} type groups...`);
        return get().loadMultipleTypes(groups);
      },

      /**
       * Clear all cached types
       */
      clearCache: () => {
        set({
          typesByGroup: {},
          lastFetch: {},
          errors: {}
        });
        console.log('Type cache cleared');
      },

      /**
       * Get loading state for a group
       * @param {string} group - Type group name
       * @returns {boolean} Loading state
       */
      isLoading: (group) => {
        return get().loading[group] || false;
      },

      /**
       * Get error for a group
       * @param {string} group - Type group name
       * @returns {string|null} Error message
       */
      getError: (group) => {
        return get().errors[group] || null;
      },

      /**
       * Create a new type (ADMIN/ASSET_ADMIN only)
       * @param {object} typeData - { group, key, label, description, sortOrder }
       */
      createType: async (typeData) => {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.post(`${API_BASE_URL}/master/types`, typeData, {
            headers: { Authorization: `Bearer ${token}` }
          });

          // Refresh the group after creation
          await get().loadTypes(typeData.group, true);
          
          return response.data;
        } catch (error) {
          console.error('Error creating type:', error);
          throw error;
        }
      },

      /**
       * Update a type (ADMIN/ASSET_ADMIN only)
       * @param {string} id - Type ID
       * @param {object} updates - Fields to update
       */
      updateType: async (id, updates) => {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.put(`${API_BASE_URL}/master/types/${id}`, updates, {
            headers: { Authorization: `Bearer ${token}` }
          });

          // Refresh all groups since we don't know which group this belongs to
          await get().refreshAllTypes();
          
          return response.data;
        } catch (error) {
          console.error('Error updating type:', error);
          throw error;
        }
      },

      /**
       * Delete (deactivate) a type (ADMIN only)
       * @param {string} id - Type ID
       */
      deleteType: async (id) => {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.delete(`${API_BASE_URL}/master/types/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          // Refresh all groups
          await get().refreshAllTypes();
          
          return response.data;
        } catch (error) {
          console.error('Error deleting type:', error);
          throw error;
        }
      },

      /**
       * Preload common types on app initialization
       */
      preloadCommonTypes: async () => {
        const commonGroups = [
          'UserRole',
          'AssetStatus',
          'RequestStatus',
          'RequestType',
          'MaintenanceStatus',
          'MaintenanceType',
          'NotificationType'
        ];
        
        console.log('Preloading common type groups...');
        return get().loadMultipleTypes(commonGroups);
      }
    }),
    {
      name: 'type-master-storage',
      partialize: (state) => ({
        typesByGroup: state.typesByGroup,
        lastFetch: state.lastFetch
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated();
          console.log('Type master store hydrated from localStorage');
        }
      }
    }
  )
);

export default useTypeMasterStore;
