const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Cache for type validation to reduce database queries
 * Structure: { 'UserRole:ADMIN': true, 'AssetStatus:AVAILABLE': true, ... }
 */
const typeCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let lastCacheRefresh = Date.now();

/**
 * Refresh the type cache from database
 */
async function refreshTypeCache() {
  try {
    const types = await prisma.globalTypeMaster.findMany({
      where: { isActive: true },
      select: { group: true, key: true }
    });

    typeCache.clear();
    types.forEach(type => {
      const cacheKey = `${type.group}:${type.key}`;
      typeCache.set(cacheKey, true);
    });

    lastCacheRefresh = Date.now();
    console.log(`✅ Type cache refreshed: ${types.length} types loaded`);
  } catch (error) {
    console.error('❌ Error refreshing type cache:', error);
  }
}

/**
 * Check if cache needs refresh
 */
function shouldRefreshCache() {
  return Date.now() - lastCacheRefresh > CACHE_TTL;
}

/**
 * Validate a type value against GlobalTypeMaster
 * @param {string} group - The type group (e.g., 'UserRole', 'AssetStatus')
 * @param {string} value - The type value to validate (e.g., 'ADMIN', 'AVAILABLE')
 * @param {boolean} nullable - Whether null/undefined values are allowed
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
async function validateType(group, value, nullable = false) {
  // Handle nullable case
  if (!value || value === null || value === undefined) {
    if (nullable) {
      return { valid: true };
    }
    return { valid: false, error: `${group} is required` };
  }

  // Refresh cache if needed
  if (shouldRefreshCache()) {
    await refreshTypeCache();
  }

  // Check cache first
  const cacheKey = `${group}:${value}`;
  if (typeCache.has(cacheKey)) {
    return { valid: true };
  }

  // If not in cache, query database (cache might be stale)
  try {
    const type = await prisma.globalTypeMaster.findFirst({
      where: {
        group,
        key: value,
        isActive: true
      }
    });

    if (type) {
      // Add to cache
      typeCache.set(cacheKey, true);
      return { valid: true };
    }

    return {
      valid: false,
      error: `Invalid ${group}: '${value}'. Please use a valid type from GlobalTypeMaster.`
    };
  } catch (error) {
    console.error('Error validating type:', error);
    return {
      valid: false,
      error: `Error validating ${group}: ${error.message}`
    };
  }
}

/**
 * Validate multiple type fields at once
 * @param {Array<{group: string, value: any, nullable?: boolean, field?: string}>} validations
 * @returns {Promise<{valid: boolean, errors: Array<{field: string, message: string}>}>}
 */
async function validateTypes(validations) {
  const errors = [];

  for (const validation of validations) {
    const result = await validateType(
      validation.group,
      validation.value,
      validation.nullable || false
    );

    if (!result.valid) {
      errors.push({
        field: validation.field || validation.group,
        message: result.error
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get all valid values for a type group
 * @param {string} group - The type group
 * @returns {Promise<Array<{key: string, label: string}>>}
 */
async function getValidTypes(group) {
  try {
    const types = await prisma.globalTypeMaster.findMany({
      where: {
        group,
        isActive: true
      },
      select: {
        key: true,
        label: true,
        sortOrder: true
      },
      orderBy: {
        sortOrder: 'asc'
      }
    });

    return types;
  } catch (error) {
    console.error('Error fetching valid types:', error);
    return [];
  }
}

/**
 * Clear the type cache (useful for testing or after type updates)
 */
function clearTypeCache() {
  typeCache.clear();
  lastCacheRefresh = 0;
}

// Initialize cache on module load
refreshTypeCache();

module.exports = {
  validateType,
  validateTypes,
  getValidTypes,
  refreshTypeCache,
  clearTypeCache
};
