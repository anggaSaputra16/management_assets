// Company Context Utility
// Provides helper functions for multi-company support

import { useAuthStore } from '@/stores/authStore'

/**
 * Get current user's company ID from auth store
 * This function should be used when you need to manually access companyId
 * Note: API interceptor already auto-injects companyId to all requests
 */
export const getCurrentCompanyId = (): number | null => {
  const user = useAuthStore.getState().user
  const companyId = user?.companyId
  return companyId ? Number(companyId) : null
}

/**
 * Validate if user belongs to a company
 * Throws error if user is not authenticated or doesn't have companyId
 */
export const validateCompanyContext = (): number => {
  const companyId = getCurrentCompanyId()
  if (!companyId) {
    throw new Error('User must be authenticated and belong to a company')
  }
  return companyId
}

/**
 * Filter array of objects by current user's company ID
 * This is a fallback for client-side filtering, but backend should handle filtering
 */
export const filterByCompany = <T extends { companyId: number }>(items: T[]): T[] => {
  const currentCompanyId = getCurrentCompanyId()
  if (!currentCompanyId) return []
  
  return items.filter(item => item.companyId === currentCompanyId)
}

/**
 * Check if an item belongs to current user's company
 */
export const belongsToCurrentCompany = (item: { companyId: number }): boolean => {
  const currentCompanyId = getCurrentCompanyId()
  return currentCompanyId !== null && item.companyId === currentCompanyId
}

/**
 * Ensure form data includes companyId (fallback, API interceptor handles this)
 */
export const ensureCompanyIdInFormData = <T extends Record<string, unknown>>(formData: T): T & { companyId: number } => {
  const companyId = validateCompanyContext()
  return {
    ...formData,
    companyId
  }
}

/**
 * Company context hooks and utilities for React components
 */
export const useCompanyContext = () => {
  const companyId = getCurrentCompanyId()
  
  return {
    companyId,
    isCompanyUser: companyId !== null,
    validateCompany: validateCompanyContext,
    filterByCompany: <T extends { companyId: number }>(items: T[]) => filterByCompany(items),
    belongsToCompany: (item: { companyId: number }) => belongsToCurrentCompany(item)
  }
}