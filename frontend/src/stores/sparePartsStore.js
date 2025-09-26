import { create } from 'zustand';
import sparePartsService from '../lib/services/sparePartsService';

const useSparePartsStore = create((set) => ({
  // State
  spareParts: [],
  currentSparePart: null,
  loading: false,
  error: null,

  // Actions
  fetchSpareParts: async () => {
    set({ loading: true, error: null });
    try {
      const spareParts = await sparePartsService.getAll();
      set({ spareParts, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchSparePartById: async (id) => {
    set({ loading: true, error: null });
    try {
      const sparePart = await sparePartsService.getById(id);
      set({ currentSparePart: sparePart, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  createSparePart: async (sparePartData) => {
    set({ loading: true, error: null });
    try {
      const newSparePart = await sparePartsService.create(sparePartData);
      set(state => ({
        spareParts: [...state.spareParts, newSparePart],
        loading: false
      }));
      return newSparePart;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateSparePart: async (id, sparePartData) => {
    set({ loading: true, error: null });
    try {
      const updatedSparePart = await sparePartsService.update(id, sparePartData);
      set(state => ({
        spareParts: state.spareParts.map(sparePart =>
          sparePart.id === id ? updatedSparePart : sparePart
        ),
        currentSparePart: state.currentSparePart?.id === id ? updatedSparePart : state.currentSparePart,
        loading: false
      }));
      return updatedSparePart;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteSparePart: async (id) => {
    set({ loading: true, error: null });
    try {
      await sparePartsService.delete(id);
      set(state => ({
        spareParts: state.spareParts.filter(sparePart => sparePart.id !== id),
        currentSparePart: state.currentSparePart?.id === id ? null : state.currentSparePart,
        loading: false
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateStock: async (id, stockData) => {
    set({ loading: true, error: null });
    try {
      const updatedSparePart = await sparePartsService.updateStock(id, stockData);
      set(state => ({
        spareParts: state.spareParts.map(sparePart =>
          sparePart.id === id ? updatedSparePart : sparePart
        ),
        currentSparePart: state.currentSparePart?.id === id ? updatedSparePart : state.currentSparePart,
        loading: false
      }));
      return updatedSparePart;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchSparePartsByCategory: async (categoryId) => {
    set({ loading: true, error: null });
    try {
      const spareParts = await sparePartsService.getByCategory(categoryId);
      set({ spareParts, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchLowStockSpareParts: async (threshold = 10) => {
    set({ loading: true, error: null });
    try {
      const spareParts = await sparePartsService.getLowStock(threshold);
      set({ spareParts, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Clear functions
  clearCurrentSparePart: () => set({ currentSparePart: null }),
  clearError: () => set({ error: null }),
}));

export default useSparePartsStore;