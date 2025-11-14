import React, { useEffect, useState } from 'react';
import useTypeMasterStore from '../stores/typeMasterStore';

/**
 * TypeBadge Component
 * Displays a badge with dynamic label from GlobalTypeMaster
 * Replaces all hardcoded status/type badges
 * 
 * @param {string} group - Type group name (e.g., 'AssetStatus', 'RequestStatus')
 * @param {string} value - Type key value
 * @param {object} colorMap - Optional custom color mapping { key: 'color-class' }
 * @param {string} defaultColor - Default badge color if no mapping (default: 'gray')
 * 
 * @example
 * <TypeBadge
 *   group="AssetStatus"
 *   value="AVAILABLE"
 *   colorMap={{
 *     AVAILABLE: 'green',
 *     IN_USE: 'blue',
 *     MAINTENANCE: 'yellow',
 *     RETIRED: 'gray'
 *   }}
 * />
 */
const TypeBadge = ({ group, value, colorMap = {}, defaultColor = 'gray' }) => {
  const { getTypeLabel, getTypesSync, loadTypes } = useTypeMasterStore();
  const [label, setLabel] = useState(value);

  useEffect(() => {
    // Check if types are already loaded
    const types = getTypesSync(group);
    if (types.length === 0) {
      // Load types if not in cache
      loadTypes(group).catch(console.error);
    }
  }, [group, getTypesSync, loadTypes]);

  useEffect(() => {
    // Update label when types are loaded
    setLabel(getTypeLabel(group, value));
  }, [group, value, getTypeLabel]);

  if (!value) {
    return <span className="badge badge-secondary">N/A</span>;
  }

  // Get color from map or use default
  const color = colorMap[value] || defaultColor;

  // Map color names to Tailwind classes
  const colorClasses = {
    green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    pink: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
    indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    teal: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300'
  };

  const badgeClass = colorClasses[color] || colorClasses.gray;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
      {label}
    </span>
  );
};

export default TypeBadge;

/**
 * Common color mappings for different type groups
 * Export these for consistent usage across the app
 */
export const STATUS_COLORS = {
  // AssetStatus
  AVAILABLE: 'green',
  IN_USE: 'blue',
  MAINTENANCE: 'yellow',
  RETIRED: 'gray',
  DISPOSED: 'red',
  
  // RequestStatus
  PENDING: 'yellow',
  APPROVED: 'green',
  REJECTED: 'red',
  ALLOCATED: 'blue',
  COMPLETED: 'green',
  
  // MaintenanceStatus
  SCHEDULED: 'blue',
  IN_PROGRESS: 'yellow',
  CANCELLED: 'red',
  
  // AuditStatus
  // SCHEDULED: 'blue',
  // IN_PROGRESS: 'yellow',
  // COMPLETED: 'green',
  
  // SparePartStatus
  ACTIVE: 'green',
  DISCONTINUED: 'red',
  OUT_OF_STOCK: 'orange',
  OBSOLETE: 'gray',
  
  // ProcurementStatus
  ORDERED: 'blue',
  SHIPPED: 'purple',
  RECEIVED: 'green',
  PARTIALLY_RECEIVED: 'yellow',
  // CANCELLED: 'red',
  
  // LicenseStatus
  // ACTIVE: 'green',
  EXPIRED: 'red',
  SUSPENDED: 'orange',
  PENDING_RENEWAL: 'yellow',
  VIOLATION: 'red'
};
