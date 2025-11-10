import { useEffect } from 'react';
import useTypeMasterStore from '../stores/typeMasterStore';

/**
 * Hook to load and access types for a specific group
 * Automatically loads types on mount if not cached
 * 
 * @param {string} group - Type group name (e.g., 'UserRole', 'AssetStatus')
 * @param {boolean} autoLoad - Auto-load on mount (default: true)
 * @returns {object} { types, loading, error, refresh, getLabel, isValid }
 * 
 * @example
 * const { types, loading, getLabel } = useTypes('UserRole');
 * 
 * // In a select dropdown
 * <select>
 *   {types.map(type => (
 *     <option key={type.key} value={type.key}>{type.label}</option>
 *   ))}
 * </select>
 * 
 * // Get label for a value
 * const roleLabel = getLabel('ADMIN'); // Returns "Administrator"
 */
export function useTypes(group, autoLoad = true) {
  const {
    getTypesSync,
    loadTypes,
    isLoading,
    getError,
    getTypeLabel,
    isValidType,
    isHydrated
  } = useTypeMasterStore();

  // Auto-load types on mount
  useEffect(() => {
    if (autoLoad && isHydrated) {
      loadTypes(group);
    }
  }, [group, autoLoad, isHydrated, loadTypes]);

  return {
    types: getTypesSync(group),
    loading: isLoading(group),
    error: getError(group),
    refresh: () => loadTypes(group, true),
    getLabel: (key) => getTypeLabel(group, key),
    isValid: (key) => isValidType(group, key)
  };
}

/**
 * Hook to preload multiple type groups
 * Useful for dashboard or pages that need multiple types
 * 
 * @param {string[]} groups - Array of group names
 * @returns {object} { loading, refresh }
 * 
 * @example
 * const { loading } = useMultipleTypes(['UserRole', 'AssetStatus', 'RequestType']);
 */
export function useMultipleTypes(groups) {
  const {
    loadMultipleTypes,
    loading,
    isHydrated
  } = useTypeMasterStore();

  const groupsKey = groups.join(',');

  useEffect(() => {
    if (isHydrated && groups.length > 0) {
      loadMultipleTypes(groups);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupsKey, isHydrated, loadMultipleTypes]);

  const isAnyLoading = groups.some(group => loading[group]);

  return {
    loading: isAnyLoading,
    refresh: () => loadMultipleTypes(groups)
  };
}

/**
 * Hook to preload common types on app initialization
 * Call this in _app.js or main layout
 * 
 * @example
 * // In _app.js or layout
 * usePreloadTypes();
 */
export function usePreloadTypes() {
  const { preloadCommonTypes, isHydrated } = useTypeMasterStore();

  useEffect(() => {
    if (isHydrated) {
      preloadCommonTypes();
    }
  }, [isHydrated, preloadCommonTypes]);
}

export default useTypes;
