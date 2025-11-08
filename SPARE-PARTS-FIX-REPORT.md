# Spare Parts & Asset Management Fix Report

## Issues Fixed

### 1. Spare Parts Category Display Issue ✅ FIXED
**Problem:** Spare parts table showing category IDs instead of category names
- Categories showing as "cmhn4urvy003dt53qfytfywm5" instead of "Building"  
- Categories showing as "HARDWARE" instead of proper category names

**Root Cause:** 
- SparePart model has a `category` field that can contain either:
  - Category IDs (e.g., "cmhn4urvy003dt53qfytfywm5") 
  - String values (e.g., "HARDWARE")
- The API wasn't resolving these to proper category names from the Category table

**Solution Applied:**
Enhanced spare parts API endpoints to resolve category names:

```javascript
// Added to GET /api/spare-parts, GET /api/spare-parts/public, GET /api/spare-parts/low-stock, GET /api/spare-parts/:id
const categories = await prisma.category.findMany({
  where: {
    OR: [
      { id: { in: categoryStrings } },    // Match by ID
      { code: { in: categoryStrings } },  // Match by code  
      { name: { in: categoryStrings } }   // Match by name
    ]
  },
  select: { id: true, code: true, name: true }
})

categories.forEach(cat => {
  categoryMap[cat.id] = cat.name      // ID -> name mapping
  categoryMap[cat.code] = cat.name    // Code -> name mapping
  categoryMap[cat.name] = cat.name    // Name -> name mapping
})

// Enhanced response with resolved category names
const enhancedSpareParts = spareParts.map(sp => ({
  ...sp,
  categoryName: categoryMap[sp.category] || sp.category,
  categoryDisplay: categoryMap[sp.category] || sp.category
}))
```

**Files Modified:**
- `backend/src/routes/spareParts.js` - Enhanced all endpoints that return spare parts data

**Test Results:**
- ✅ Category ID `cmhn4urvy003dt53qfytfywm5` now correctly displays as "Building"
- ✅ String categories like "HARDWARE" fall back to original string when no match found
- ✅ New fields `categoryName` and `categoryDisplay` added to API responses

### 2. Asset Status After Decomposition Issue ⚠️ PARTIALLY IDENTIFIED
**Problem:** Assets should be marked as inactive/retired after decomposition execution

**Current Status:**
- Found decomposition request `cmhq9b1xn0002ywfqqu9vs51a` with status: `APPROVED`, completedDate: `null`
- Asset `MJT-AST-0007` still shows: Status: `AVAILABLE`, Active: `true`
- However, spare part was created with `createdFromRequestId: "cmhq9b1xn0002ywfqqu9vs51a"`

**Analysis:**
The decomposition execution code (lines 480-495 in `/backend/src/routes/decomposition.js`) should update asset status:

```javascript
// Update the source asset status: use requested postStatus (default RETIRED) and deactivate it
await tx.asset.update({
  where: { id: reqRecord.asset.id },
  data: {
    status: postStatus || 'RETIRED',
    isActive: false,
    notes: `${reqRecord.asset.notes || ''}\n[${new Date().toISOString()}] Asset decomposed via request ${id}`
  }
})
```

**Possible Causes:**
1. Execution endpoint `/api/decomposition/:id/execute` not called after approval
2. Error in asset status update logic that's being caught silently
3. Transaction rollback due to other errors

**Recommended Next Steps:**
1. Check frontend decomposition flow to ensure execution endpoint is called after approval
2. Add better error logging to asset status update in decomposition execution
3. Test decomposition execution flow end-to-end

## API Enhancements Summary

### Spare Parts API Now Returns:
```json
{
  "id": "cmhq9b1xw0004ywfqd7n8d6da",
  "name": "roda",
  "category": "cmhn4urvy003dt53qfytfywm5",        // Original category value
  "categoryName": "Building",                     // ✅ NEW: Resolved category name
  "categoryDisplay": "Building",                  // ✅ NEW: Display-friendly name
  // ... other fields
}
```

### Enhanced Endpoints:
- `GET /api/spare-parts` - Main listing with pagination
- `GET /api/spare-parts/public` - Public endpoint (dev only)  
- `GET /api/spare-parts/low-stock` - Low stock listing
- `GET /api/spare-parts/:id` - Single spare part details

## Database Analysis

### Current Data State:
- **Categories**: 23 categories across companies (Building, Computer Hardware, etc.)
- **Spare Parts**: Mix of category IDs and string values
- **Assets**: No retired/inactive assets found from decomposition

### Category Mapping Examples:
- `"cmhn4urvy003dt53qfytfywm5"` → `"Building"` ✅
- `"HARDWARE"` → `"HARDWARE"` (no match, fallback) ✅
- `"COMP001"` → `"Computer Hardware"` (would work if used)

## Next Actions Required

1. **Frontend Update**: Update spare parts table to use `categoryDisplay` instead of `category`
2. **Asset Flow Investigation**: Debug why decomposed assets aren't being marked as retired
3. **Testing**: Perform end-to-end decomposition test to verify complete flow
4. **Data Migration** (Optional): Consider migrating existing "HARDWARE" categories to proper category IDs

## Performance Impact
- ✅ Minimal: Additional category lookup only for spare parts with categories
- ✅ Cached: Uses Set for unique category strings to avoid duplicate queries
- ✅ Batch Query: Single query to resolve all categories at once per request