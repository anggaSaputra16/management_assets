import { create } from 'zustand';
import { enumService } from '../lib/services/enumService';

const useOptimizedEnumStore = create((set, get) => ({
  // State - Only store what's needed for decomposition
  requestStatuses: [],
  assetConditions: [],
  decompositionReasons: [],
  decompositionActions: [],
  sparePartCategories: [],
  
  // Global loading state
  isLoading: false,
  isInitialized: false,
  errors: {},

  // Actions
  initializeDecompositionEnums: async () => {
    const state = get();
    if (state.isInitialized) {
      console.log('[OptimizedEnum] Already initialized, skipping...');
      return;
    }

    set({ isLoading: true });
    
    try {
      console.log('[OptimizedEnum] Initializing essential enums for decomposition...');
      
      // Only load essential enums for decomposition module
      const [
        requestStatusesRes,
        assetConditionsRes,
        decompositionReasonsRes,
        decompositionActionsRes,
        sparePartCategoriesRes
      ] = await Promise.allSettled([
        enumService.getRequestStatuses(),
        enumService.getAssetConditions(),
        enumService.getDecompositionReasons(),
        enumService.getDecompositionActions(),
        enumService.getSparePartCategories()
      ]);

      // Process results with error handling
      const newState = {
        requestStatuses: requestStatusesRes.status === 'fulfilled' ? (requestStatusesRes.value?.data || []) : [],
        assetConditions: assetConditionsRes.status === 'fulfilled' ? (assetConditionsRes.value?.data || []) : [],
        decompositionReasons: decompositionReasonsRes.status === 'fulfilled' ? (decompositionReasonsRes.value?.data || []) : [],
        decompositionActions: decompositionActionsRes.status === 'fulfilled' ? (decompositionActionsRes.value?.data || []) : [],
        sparePartCategories: sparePartCategoriesRes.status === 'fulfilled' ? (sparePartCategoriesRes.value?.data || []) : [],
        isLoading: false,
        isInitialized: true
      };

      // Log errors if any
      const errors = {};
      if (requestStatusesRes.status === 'rejected') errors.requestStatuses = requestStatusesRes.reason?.message;
      if (assetConditionsRes.status === 'rejected') errors.assetConditions = assetConditionsRes.reason?.message;
      if (decompositionReasonsRes.status === 'rejected') errors.decompositionReasons = decompositionReasonsRes.reason?.message;
      if (decompositionActionsRes.status === 'rejected') errors.decompositionActions = decompositionActionsRes.reason?.message;
      if (sparePartCategoriesRes.status === 'rejected') errors.sparePartCategories = sparePartCategoriesRes.reason?.message;
      
      newState.errors = errors;
      
      set(newState);
      console.log('[OptimizedEnum] Initialization complete');
      
    } catch (error) {
      console.error('[OptimizedEnum] Initialization failed:', error);
      set({ 
        isLoading: false, 
        errors: { global: error.message }
      });
    }
  },

  // Lazy load additional enums if needed
  loadAdditionalEnum: async (enumType) => {
    try {
      let response;
      switch (enumType) {
        case 'userRoles':
          response = await enumService.getUserRoles();
          set(state => ({ ...state, userRoles: response.data || [] }));
          break;
        case 'notificationTypes':
          response = await enumService.getNotificationTypes();
          set(state => ({ ...state, notificationTypes: response.data || [] }));
          break;
        // Add other enums as needed
        default:
          console.warn(`[OptimizedEnum] Unknown enum type: ${enumType}`);
      }
    } catch (error) {
      console.error(`[OptimizedEnum] Failed to load ${enumType}:`, error);
      set(state => ({ 
        ...state, 
        errors: { ...state.errors, [enumType]: error.message }
      }));
    }
  },

  // Reset store
  reset: () => {
    set({
      requestStatuses: [],
      assetConditions: [],
      decompositionReasons: [],
      decompositionActions: [],
      sparePartCategories: [],
      isLoading: false,
      isInitialized: false,
      errors: {}
    });
  }
}));

export default useOptimizedEnumStore;