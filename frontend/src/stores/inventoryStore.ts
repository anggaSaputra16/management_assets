import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  inventoryService,
  type InventoryItem,
  type InventoryLoan,
  type CreateInventoryData,
  type UpdateInventoryData,
  type CreateLoanData,
  type ReturnLoanData,
  type InventoryStats
} from '../lib/services/inventoryService';

interface InventoryState {
  // Inventory state
  inventories: InventoryItem[];
  inventory: InventoryItem | null;
  inventoryLoading: boolean;
  inventoryError: string | null;

  // Loans state
  loans: InventoryLoan[];
  loan: InventoryLoan | null;
  loansLoading: boolean;
  loansError: string | null;

  // Stats state
  stats: InventoryStats | null;
  statsLoading: boolean;
  statsError: string | null;

  // Pagination
  inventoryPagination: {
    total: number;
    pages: number;
    current: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  loansPagination: {
    total: number;
    pages: number;
    current: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  // Filters
  inventoryFilters: {
    search: string;
    departmentId: string;
    status: string;
    condition: string;
  };
  loansFilters: {
    search: string;
    status: string;
    borrowerId: string;
  };
}

interface InventoryActions {
  // Inventory actions
  fetchInventories: (page?: number, limit?: number) => Promise<void>;
  createInventory: (data: CreateInventoryData) => Promise<InventoryItem>;
  updateInventory: (id: string, data: UpdateInventoryData) => Promise<InventoryItem>;
  deleteInventory: (id: string) => Promise<void>;
  setInventoryFilters: (filters: Partial<InventoryState['inventoryFilters']>) => void;
  clearInventoryError: () => void;

  // Loans actions
  fetchLoans: (page?: number, limit?: number) => Promise<void>;
  createLoan: (data: CreateLoanData) => Promise<InventoryLoan>;
  returnLoan: (id: string, data: ReturnLoanData) => Promise<InventoryLoan>;
  setLoansFilters: (filters: Partial<InventoryState['loansFilters']>) => void;
  clearLoansError: () => void;

  // Stats actions
  fetchStats: () => Promise<void>;

  // Utility actions
  printLoanLabel: (loan: InventoryLoan) => void;
  resetState: () => void;
}

const initialState: InventoryState = {
  inventories: [],
  inventory: null,
  inventoryLoading: false,
  inventoryError: null,

  loans: [],
  loan: null,
  loansLoading: false,
  loansError: null,

  stats: null,
  statsLoading: false,
  statsError: null,

  inventoryPagination: {
    total: 0,
    pages: 0,
    current: 1,
    hasNext: false,
    hasPrev: false,
  },

  loansPagination: {
    total: 0,
    pages: 0,
    current: 1,
    hasNext: false,
    hasPrev: false,
  },

  inventoryFilters: {
    search: '',
    departmentId: '',
    status: '',
    condition: '',
  },

  loansFilters: {
    search: '',
    status: '',
    borrowerId: '',
  },
};

export const useInventoryStore = create<InventoryState & InventoryActions>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Inventory actions
    fetchInventories: async (page = 1, limit = 10) => {
      try {
        set({ inventoryLoading: true, inventoryError: null });
        
        const filters = get().inventoryFilters;
        const params: Record<string, string | number> = { page, limit };
        
        if (filters.search) params.search = filters.search;
        if (filters.departmentId) params.departmentId = filters.departmentId;
        if (filters.status) params.status = filters.status;
        if (filters.condition) params.condition = filters.condition;

        const response = await inventoryService.getInventories(params);

        // Normalize numeric fields to avoid runtime issues in UI
        const normalized = (response.inventories || []).map((inv: unknown) => {
          const obj = inv as Record<string, unknown>
          return {
            ...obj,
            quantity: obj['quantity'] != null ? Number(String(obj['quantity'])) : 0,
            availableQty: obj['availableQty'] != null ? Number(String(obj['availableQty'])) : 0,
            minStockLevel: obj['minStockLevel'] != null ? Number(String(obj['minStockLevel'])) : 0
          }
        });

        set({
          inventories: normalized as InventoryItem[],
          inventoryPagination: response.pagination,
          inventoryLoading: false,
        });
      } catch (error) {
        set({
          inventoryError: error instanceof Error ? error.message : 'Failed to fetch inventories',
          inventoryLoading: false,
        });
      }
    },

    createInventory: async (data: CreateInventoryData) => {
      try {
        set({ inventoryLoading: true, inventoryError: null });
        
        const newInventory = await inventoryService.createInventory(data);
        
        // Refresh inventory list
        await get().fetchInventories();
        
        set({ inventoryLoading: false });
        return newInventory;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create inventory';
        set({
          inventoryError: errorMessage,
          inventoryLoading: false,
        });
        throw error;
      }
    },

    updateInventory: async (id: string, data: UpdateInventoryData) => {
      try {
        set({ inventoryLoading: true, inventoryError: null });
        
        const updatedInventory = await inventoryService.updateInventory(id, data);
        
        // Update local state
        set((state) => ({
          inventories: state.inventories.map((inv) =>
            inv.id === id ? updatedInventory : inv
          ),
          inventoryLoading: false,
        }));
        
        return updatedInventory;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update inventory';
        set({
          inventoryError: errorMessage,
          inventoryLoading: false,
        });
        throw error;
      }
    },

    deleteInventory: async (id: string) => {
      try {
        set({ inventoryLoading: true, inventoryError: null });
        
        await inventoryService.deleteInventory(id);
        
        // Remove from local state
        set((state) => ({
          inventories: state.inventories.filter((inv) => inv.id !== id),
          inventoryLoading: false,
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete inventory';
        set({
          inventoryError: errorMessage,
          inventoryLoading: false,
        });
        throw error;
      }
    },

    setInventoryFilters: (filters) => {
      set((state) => ({
        inventoryFilters: { ...state.inventoryFilters, ...filters },
      }));
      // Auto-refresh when filters change
      setTimeout(() => get().fetchInventories(), 100);
    },

    clearInventoryError: () => {
      set({ inventoryError: null });
    },

    // Loans actions
    fetchLoans: async (page = 1, limit = 10) => {
      try {
        set({ loansLoading: true, loansError: null });
        
        const filters = get().loansFilters;
        const params: Record<string, string | number> = { page, limit };
        
        if (filters.search) params.search = filters.search;
        if (filters.status) params.status = filters.status;
        if (filters.borrowerId) params.borrowerId = filters.borrowerId;

        const response = await inventoryService.getLoans(params);
        
        set({
          loans: response.loans,
          loansPagination: response.pagination,
          loansLoading: false,
        });
      } catch (error) {
        set({
          loansError: error instanceof Error ? error.message : 'Failed to fetch loans',
          loansLoading: false,
        });
      }
    },

    createLoan: async (data: CreateLoanData) => {
      try {
        set({ loansLoading: true, loansError: null });
        
        const newLoan = await inventoryService.createLoan(data);
        
        // Refresh both loans and inventories (since availability changed)
        await Promise.all([
          get().fetchLoans(),
          get().fetchInventories(),
        ]);
        
        set({ loansLoading: false });
        return newLoan;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create loan';
        set({
          loansError: errorMessage,
          loansLoading: false,
        });
        throw error;
      }
    },

    returnLoan: async (id: string, data: ReturnLoanData) => {
      try {
        set({ loansLoading: true, loansError: null });
        
        const returnedLoan = await inventoryService.returnLoan(id, data);
        
        // Refresh both loans and inventories (since availability changed)
        await Promise.all([
          get().fetchLoans(),
          get().fetchInventories(),
        ]);
        
        set({ loansLoading: false });
        return returnedLoan;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to return loan';
        set({
          loansError: errorMessage,
          loansLoading: false,
        });
        throw error;
      }
    },

      // Approve loan (Manager/Admin)
      approveLoan: async (id: string, approvalData?: { approvalNotes?: string }) => {
        try {
          set({ loansLoading: true, loansError: null });

          const updatedLoan = await inventoryService.approveLoan(id, approvalData);

          // Refresh loans list
          await get().fetchLoans();

          set({ loansLoading: false });
          return updatedLoan;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to approve loan';
          set({ loansError: errorMessage, loansLoading: false });
          throw error;
        }
      },

    setLoansFilters: (filters) => {
      set((state) => ({
        loansFilters: { ...state.loansFilters, ...filters },
      }));
      // Auto-refresh when filters change
      setTimeout(() => get().fetchLoans(), 100);
    },

    clearLoansError: () => {
      set({ loansError: null });
    },

    // Stats actions
    fetchStats: async () => {
      try {
        set({ statsLoading: true, statsError: null });
        
        const stats = await inventoryService.getStats();
        
        set({
          stats,
          statsLoading: false,
        });
      } catch (error) {
        set({
          statsError: error instanceof Error ? error.message : 'Failed to fetch stats',
          statsLoading: false,
        });
      }
    },

    // Utility actions
    printLoanLabel: (loan: InventoryLoan) => {
      inventoryService.printLoanLabel(loan);
    },

    resetState: () => {
      set(initialState);
    },
  }))
);

// Export types for use in components
export type { InventoryItem, InventoryLoan, CreateInventoryData, UpdateInventoryData, CreateLoanData, ReturnLoanData, InventoryStats };