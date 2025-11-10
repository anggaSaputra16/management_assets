import { create } from 'zustand'
import { decompositionService } from '@/lib/services/decompositionService'

const useDecompositionStore = create((set, get) => ({
  // State
  decompositions: [],
  pendingRequests: [],
  selectedRequest: null,
  selectedAsset: null,
  modalMode: null, // 'create-from-request' | 'create-manual' | null
  loading: false,
  error: null,

  // Actions
  fetchDecompositions: async (params = {}) => {
    set({ loading: true, error: null })
    try {
      const response = await decompositionService.getAll(params)
      set({ 
        decompositions: Array.isArray(response.data) ? response.data : [],
        loading: false 
      })
      return response
    } catch (error) {
      console.error('Error fetching decompositions:', error)
      set({ error: error.message, loading: false })
      throw error
    }
  },

  fetchPendingRequests: async () => {
    set({ loading: true, error: null })
    try {
      const response = await decompositionService.getPendingRequests()
      set({ 
        pendingRequests: Array.isArray(response.data) ? response.data : [],
        loading: false 
      })
      return response
    } catch (error) {
      console.error('Error fetching pending requests:', error)
      set({ error: error.message, loading: false })
      throw error
    }
  },

  openModalFromRequest: (request) => {
    set({ 
      selectedRequest: request,
      selectedAsset: request.sourceAsset || request.asset,
      modalMode: 'create-from-request'
    })
  },

  openManualModal: () => {
    set({ 
      selectedRequest: null,
      selectedAsset: null,
      modalMode: 'create-manual'
    })
  },

  closeModal: () => {
    set({ 
      selectedRequest: null,
      selectedAsset: null,
      modalMode: null
    })
  },

  submitDecomposition: async (decompositionData) => {
    set({ loading: true, error: null })
    try {
      const { selectedRequest, modalMode } = get()
      
      // If creating from request, add requestId to payload
      const payload = {
        ...decompositionData
      }
      
      if (modalMode === 'create-from-request' && selectedRequest) {
        payload.requestId = selectedRequest.id
        // sourceAssetId will be overridden by backend from request
      }

      const response = await decompositionService.create(payload)
      
      // Refresh lists after successful creation
      await get().fetchDecompositions()
      await get().fetchPendingRequests()
      
      // Close modal
      get().closeModal()
      
      set({ loading: false })
      return response
    } catch (error) {
      console.error('Error submitting decomposition:', error)
      set({ error: error.message, loading: false })
      throw error
    }
  },

  executeDecomposition: async (id, postStatus) => {
    set({ loading: true, error: null })
    try {
      const response = await decompositionService.execute(id, postStatus)
      
      // Refresh lists
      await get().fetchDecompositions()
      await get().fetchPendingRequests()
      
      set({ loading: false })
      return response
    } catch (error) {
      console.error('Error executing decomposition:', error)
      set({ error: error.message, loading: false })
      throw error
    }
  },

  clearError: () => set({ error: null })
}))

export default useDecompositionStore
