-- Migration: Convert SparePart category from enum to Category relation
-- Date: 2025-11-09

-- Step 1: Add new categoryId column (nullable first)
ALTER TABLE spare_parts 
ADD COLUMN IF NOT EXISTS "categoryId" TEXT;

-- Step 2: After running the Node.js migration script (migrate-sparepart-category.js),
--         make categoryId NOT NULL and add foreign key constraint

-- Run this after data migration is complete:
-- ALTER TABLE spare_parts 
-- ALTER COLUMN "categoryId" SET NOT NULL;

-- ALTER TABLE spare_parts
-- ADD CONSTRAINT "spare_parts_categoryId_fkey" 
-- FOREIGN KEY ("categoryId") REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 3: Drop old category column (after migration is verified successful)
-- ALTER TABLE spare_parts DROP COLUMN category;

-- Step 4: Update index
-- DROP INDEX IF EXISTS "spare_parts_companyId_category_idx";
-- CREATE INDEX "spare_parts_companyId_categoryId_idx" ON spare_parts("companyId", "categoryId");
