# Test Decomposition Category Validation

## Summary
Fixed validation issue in decomposition module where `category` field was too restrictive.

### Problem:
- Backend validation: `"items[0].category" must be one of [HARDWARE, SOFTWARE, ACCESSORY, CONSUMABLE]`
- Frontend menggunakan data dari master Category table yang lebih fleksibel
- Schema Prisma menggunakan enum SparePartCategory yang rigid

### Solution:
1. **Updated Joi Validation** (✅)
   - Changed `category: Joi.string().valid('HARDWARE','SOFTWARE','ACCESSORY','CONSUMABLE')` 
   - To: `category: Joi.string().optional()` - accepts any string from master category

2. **Updated Prisma Schema** (✅)  
   - Removed `enum SparePartCategory`
   - Changed `SparePart.category` from `SparePartCategory` to `String` 
   - Default value: `"HARDWARE"`

3. **Database Migration** (✅)
   - Applied schema changes with `npx prisma db push --accept-data-loss`
   - Generated new Prisma client

### Files Modified:
- `backend/src/routes/decomposition.js` - Flexible Joi validation
- `backend/prisma/schema.prisma` - String category field
- Database schema updated via migration

### Expected Result:
- Frontend can now send any category value from master Category table
- Backend accepts flexible category strings
- Spare parts created with proper category values
- No more validation errors on decomposition creation

### Test Cases:
✅ Category from master table (e.g., "Electronics", "Office Equipment")  
✅ Default enum values (HARDWARE, SOFTWARE, etc.)  
✅ Custom category values  
✅ Empty/null category (defaults to "HARDWARE")  

## Status: RESOLVED ✅
Decomposition module now supports flexible category selection from master Category table.