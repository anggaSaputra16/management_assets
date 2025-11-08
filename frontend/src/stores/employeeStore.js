import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { employeeService } from '@/lib/services/employeeService';

export const useEmployeeStore = create(
  persist(
    (set, get) => ({
      employees: [],
      currentEmployee: null,
      loading: false,
      error: null,
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
      filters: {
        search: '',
        departmentId: '',
        locationId: '',
        isActive: null,
      },
      stats: {
        total: 0,
        active: 0,
        withAssets: 0,
        withAppAccess: 0,
      },

      // Fetch employees from API
      fetchEmployees: async (page, limit) => {
        try {
          set({ loading: true, error: null });
          
          const currentFilters = get().filters;
          const currentPage = page || get().pagination.page;
          const currentLimit = limit || get().pagination.limit || 1000; // Use high limit for loan form dropdown
          
          const params = {
            page: currentPage,
            limit: currentLimit,
            ...(currentFilters.search && { search: currentFilters.search }),
            ...(currentFilters.departmentId && { departmentId: currentFilters.departmentId }),
            ...(currentFilters.locationId && { locationId: currentFilters.locationId }),
            ...(currentFilters.isActive !== null && { isActive: currentFilters.isActive }),
          };
          
          const response = await employeeService.getAllEmployees(params);
          
          set({
            employees: response.employees || [],
            pagination: response.pagination || get().pagination,
            loading: false,
          });
        } catch (error) {
          console.error('Failed to fetch employees:', error);
          set({
            error: error?.message || 'Failed to fetch employees',
            loading: false,
          });
        }
      },

      // Set employees list
      setEmployees: (employees) => set({ employees }),

      // Set current employee
      setCurrentEmployee: (employee) => set({ currentEmployee: employee }),

      // Set loading state
      setLoading: (loading) => set({ loading }),

      // Set error
      setError: (error) => set({ error }),

      // Set pagination
      setPagination: (pagination) => set({ pagination }),

      // Set filters
      setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters },
      })),

      // Reset filters
      resetFilters: () => set({
        filters: {
          search: '',
          departmentId: '',
          locationId: '',
          isActive: null,
        },
      }),

      // Set stats
      setStats: (stats) => set({ stats }),

      // Add employee
      addEmployee: (employee) => set((state) => ({
        employees: [employee, ...state.employees],
      })),

      // Update employee
      updateEmployee: (id, updatedEmployee) => set((state) => ({
        employees: state.employees.map((emp) =>
          emp.id === id ? { ...emp, ...updatedEmployee } : emp
        ),
        currentEmployee:
          state.currentEmployee?.id === id
            ? { ...state.currentEmployee, ...updatedEmployee }
            : state.currentEmployee,
      })),

      // Remove employee
      removeEmployee: (id) => set((state) => ({
        employees: state.employees.filter((emp) => emp.id !== id),
        currentEmployee:
          state.currentEmployee?.id === id ? null : state.currentEmployee,
      })),

      // Clear current employee
      clearCurrentEmployee: () => set({ currentEmployee: null }),

      // Reset store
      reset: () => set({
        employees: [],
        currentEmployee: null,
        loading: false,
        error: null,
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
        filters: {
          search: '',
          departmentId: '',
          locationId: '',
          isActive: null,
        },
        stats: {
          total: 0,
          active: 0,
          withAssets: 0,
          withAppAccess: 0,
        },
      }),
    }),
    {
      name: 'employee-storage',
      partialize: (state) => ({
        // Don't persist loading states or current employee
        employees: state.employees,
        filters: state.filters,
        pagination: state.pagination,
      }),
    }
  )
);
