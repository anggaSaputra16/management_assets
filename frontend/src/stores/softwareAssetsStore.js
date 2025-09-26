import { create } from 'zustand';
import softwareAssetsService from '../lib/services/softwareAssetsService';

const useSoftwareAssetsStore = create((set) => ({
  // State
  softwareAssets: [],
  currentSoftwareAsset: null,
  loading: false,
  error: null,

  // Actions
  fetchSoftwareAssets: async () => {
    set({ loading: true, error: null });
    try {
      const softwareAssets = await softwareAssetsService.getAll();
      set({ softwareAssets, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchSoftwareAssetById: async (id) => {
    set({ loading: true, error: null });
    try {
      const softwareAsset = await softwareAssetsService.getById(id);
      set({ currentSoftwareAsset: softwareAsset, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  createSoftwareAsset: async (softwareAssetData) => {
    set({ loading: true, error: null });
    try {
      const newSoftwareAsset = await softwareAssetsService.create(softwareAssetData);
      set(state => ({
        softwareAssets: [...state.softwareAssets, newSoftwareAsset],
        loading: false
      }));
      return newSoftwareAsset;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateSoftwareAsset: async (id, softwareAssetData) => {
    set({ loading: true, error: null });
    try {
      const updatedSoftwareAsset = await softwareAssetsService.update(id, softwareAssetData);
      set(state => ({
        softwareAssets: state.softwareAssets.map(softwareAsset =>
          softwareAsset.id === id ? updatedSoftwareAsset : softwareAsset
        ),
        currentSoftwareAsset: state.currentSoftwareAsset?.id === id ? updatedSoftwareAsset : state.currentSoftwareAsset,
        loading: false
      }));
      return updatedSoftwareAsset;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteSoftwareAsset: async (id) => {
    set({ loading: true, error: null });
    try {
      await softwareAssetsService.delete(id);
      set(state => ({
        softwareAssets: state.softwareAssets.filter(softwareAsset => softwareAsset.id !== id),
        currentSoftwareAsset: state.currentSoftwareAsset?.id === id ? null : state.currentSoftwareAsset,
        loading: false
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchSoftwareAssetsByType: async (type) => {
    set({ loading: true, error: null });
    try {
      const softwareAssets = await softwareAssetsService.getByType(type);
      set({ softwareAssets, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchSoftwareAssetsByStatus: async (status) => {
    set({ loading: true, error: null });
    try {
      const softwareAssets = await softwareAssetsService.getByStatus(status);
      set({ softwareAssets, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchExpiringLicenses: async (days = 30) => {
    set({ loading: true, error: null });
    try {
      const softwareAssets = await softwareAssetsService.getExpiringLicenses(days);
      set({ softwareAssets, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Clear functions
  clearCurrentSoftwareAsset: () => set({ currentSoftwareAsset: null }),
  clearError: () => set({ error: null }),
}));

export default useSoftwareAssetsStore;