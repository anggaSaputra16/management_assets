import { create } from 'zustand';
import positionService from '../lib/services/positionService';

const usePositionStore = create((set) => ({
  // State
  positions: [],
  currentPosition: null,
  loading: false,
  error: null,

  // Actions
  fetchPositions: async () => {
    set({ loading: true, error: null });
    try {
      const positions = await positionService.getAll();
      set({ positions, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchPositionById: async (id) => {
    set({ loading: true, error: null });
    try {
      const position = await positionService.getById(id);
      set({ currentPosition: position, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  createPosition: async (positionData) => {
    set({ loading: true, error: null });
    try {
      const newPosition = await positionService.create(positionData);
      set(state => ({
        positions: [...state.positions, newPosition],
        loading: false
      }));
      return newPosition;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updatePosition: async (id, positionData) => {
    set({ loading: true, error: null });
    try {
      const updatedPosition = await positionService.update(id, positionData);
      set(state => ({
        positions: state.positions.map(position =>
          position.id === id ? updatedPosition : position
        ),
        currentPosition: state.currentPosition?.id === id ? updatedPosition : state.currentPosition,
        loading: false
      }));
      return updatedPosition;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deletePosition: async (id) => {
    set({ loading: true, error: null });
    try {
      await positionService.delete(id);
      set(state => ({
        positions: state.positions.filter(position => position.id !== id),
        currentPosition: state.currentPosition?.id === id ? null : state.currentPosition,
        loading: false
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchPositionsByDepartment: async (departmentId) => {
    set({ loading: true, error: null });
    try {
      const positions = await positionService.getByDepartment(departmentId);
      set({ positions, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Clear functions
  clearCurrentPosition: () => set({ currentPosition: null }),
  clearError: () => set({ error: null }),
}));

export default usePositionStore;