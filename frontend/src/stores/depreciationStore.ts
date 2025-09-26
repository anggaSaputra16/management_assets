import { create } from 'zustand';
import { setAssetDepreciation, getAssetDepreciation } from '../lib/services/depreciationService';
import { type DepreciationData, type DepreciationCalculation } from '../lib/services/depreciationService';

interface DepreciationState {
  isLoading: boolean;
  error: string | null;
  currentCalculation: DepreciationCalculation | null;
  
  // Actions
  setDepreciation: (assetId: string, data: DepreciationData) => Promise<void>;
  getDepreciation: (assetId: string) => Promise<void>;
  resetState: () => void;
}

export const useDepreciationStore = create<DepreciationState>((set) => ({
  isLoading: false,
  error: null,
  currentCalculation: null,
  
  setDepreciation: async (assetId, data) => {
    set({ isLoading: true, error: null });
    try {
      await setAssetDepreciation(assetId, data);
      // After setting, get the current calculation
      const response = await getAssetDepreciation(assetId);
      set({ 
        currentCalculation: response.data,
        isLoading: false 
      });
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error setting depreciation';
      set({ 
        error: errorMessage,
        isLoading: false 
      });
    }
  },
  
  getDepreciation: async (assetId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await getAssetDepreciation(assetId);
      set({ 
        currentCalculation: response.data,
        isLoading: false 
      });
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error getting depreciation calculation';
      set({ 
        error: errorMessage,
        isLoading: false 
      });
    }
  },
  
  resetState: () => {
    set({
      isLoading: false,
      error: null,
      currentCalculation: null
    });
  }
}));