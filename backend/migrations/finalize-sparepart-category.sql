-- Finalize migration: Add constraints and clean up old column

-- Step 1: Make categoryId NOT NULL (all data already migrated)
ALTER TABLE spare_parts 
ALTER COLUMN "categoryId" SET NOT NULL;

-- Step 2: Add foreign key constraint
ALTER TABLE spare_parts
ADD CONSTRAINT "spare_parts_categoryId_fkey" 
FOREIGN KEY ("categoryId") REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 3: Drop old category enum column
ALTER TABLE spare_parts DROP COLUMN IF EXISTS category;

-- Step 4: Update indexes
DROP INDEX IF EXISTS "spare_parts_companyId_category_idx";
CREATE INDEX IF NOT EXISTS "spare_parts_companyId_categoryId_idx" ON spare_parts("companyId", "categoryId");
