import { create } from 'zustand'
import { assetService } from '@/lib/services'

interface Transfer {
  id: string
  assetId: string
  fromLocationId: string
  toLocationId: string
  fromDepartmentId: string
  toDepartmentId: string
  reason: string
  notes: string
  transferredBy: string
  transferredAt: string
  asset?: {
    id: string
    name: string
    assetTag: string
  }
  fromLocation?: {
    id: string
    name: string
  }
  toLocation?: {
    id: string
    name: string
  }
  fromDepartment?: {
    id: string
    name: string
  }
  toDepartment?: {
    id: string
    name: string
  }
  user?: {
    id: string
    name: string
  }
}

interface TransferState {
  transfers: Transfer[]
  currentTransfer: Transfer | null
  loading: boolean
  error: string | null
  
  // Actions
  fetchTransfers: () => Promise<void>
  fetchAssetTransfers: (assetId: string) => Promise<void>
  transferAsset: (assetId: string, transferData: {
    locationId: string
    departmentId: string
    reason: string
    notes?: string
  }) => Promise<void>
  resetState: () => void
}

export const useTransferStore = create<TransferState>((set, get) => ({
  transfers: [],
  currentTransfer: null,
  loading: false,
  error: null,
  
  fetchTransfers: async () => {
    set({ loading: true, error: null })
    try {
      const response = await assetService.getTransfers()
      set({ 
        transfers: response.data || [],
        loading: false 
      })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch transfers',
        loading: false 
      })
    }
  },
  
  fetchAssetTransfers: async (assetId) => {
    set({ loading: true, error: null })
    try {
      const response = await assetService.getAssetTransfers(assetId)
      set({ 
        transfers: response.data || [],
        loading: false 
      })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch asset transfers',
        loading: false 
      })
    }
  },
  
  transferAsset: async (assetId, transferData) => {
    set({ loading: true, error: null })
    try {
      const response = await assetService.transferAsset(assetId, transferData)
      set({ 
        currentTransfer: response.data,
        loading: false 
      })
      
      // Refresh transfers list if we already have transfers loaded
      if (get().transfers.length > 0) {
        get().fetchAssetTransfers(assetId)
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to transfer asset',
        loading: false 
      })
      throw error
    }
  },
  
  resetState: () => {
    set({
      transfers: [],
      currentTransfer: null,
      loading: false,
      error: null
    })
  }
}))