-- Migration script to update existing inventory records with companyId
-- Run this AFTER the Prisma migration if there are existing inventory records

-- Update inventory records to set companyId from related asset
UPDATE inventories i
SET "companyId" = a."companyId"
FROM assets a
WHERE i."assetId" = a.id
AND i."companyId" IS NULL;

-- Verify the update
SELECT 
  COUNT(*) as total_inventories,
  COUNT("companyId") as inventories_with_company,
  COUNT(*) - COUNT("companyId") as inventories_without_company
FROM inventories;

-- If any records still have NULL companyId, investigate:
SELECT 
  i.id,
  i."inventoryTag",
  i."assetId",
  i."departmentId",
  i."companyId"
FROM inventories i
LEFT JOIN assets a ON i."assetId" = a.id
WHERE i."companyId" IS NULL;
