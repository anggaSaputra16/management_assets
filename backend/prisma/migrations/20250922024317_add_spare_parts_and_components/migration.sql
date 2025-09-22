-- CreateEnum
CREATE TYPE "SparePartCategory" AS ENUM ('HARDWARE', 'SOFTWARE', 'ACCESSORY', 'CONSUMABLE');

-- CreateEnum
CREATE TYPE "SparePartType" AS ENUM ('COMPONENT', 'ACCESSORY', 'CONSUMABLE', 'TOOL', 'SOFTWARE');

-- CreateEnum
CREATE TYPE "SparePartStatus" AS ENUM ('ACTIVE', 'DISCONTINUED', 'OUT_OF_STOCK', 'OBSOLETE');

-- CreateEnum
CREATE TYPE "ProcurementStatus" AS ENUM ('ORDERED', 'SHIPPED', 'RECEIVED', 'PARTIALLY_RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PartUsageType" AS ENUM ('REPLACEMENT', 'UPGRADE', 'REPAIR', 'INSTALLATION', 'MAINTENANCE', 'TRANSFER');

-- CreateEnum
CREATE TYPE "ReplacementStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'APPROVED', 'REGISTERED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ComponentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'TRANSFERRED', 'REPLACED', 'DISPOSED');

-- CreateTable
CREATE TABLE "spare_parts" (
    "id" TEXT NOT NULL,
    "partNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "category" "SparePartCategory" NOT NULL DEFAULT 'HARDWARE',
    "partType" "SparePartType" NOT NULL DEFAULT 'COMPONENT',
    "status" "SparePartStatus" NOT NULL DEFAULT 'ACTIVE',
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "stockLevel" INTEGER NOT NULL DEFAULT 0,
    "minStockLevel" INTEGER NOT NULL DEFAULT 10,
    "maxStockLevel" INTEGER NOT NULL DEFAULT 100,
    "reorderPoint" INTEGER NOT NULL DEFAULT 15,
    "storageLocation" TEXT,
    "specifications" JSONB,
    "compatibleWith" TEXT[],
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "vendorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spare_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procurements" (
    "id" TEXT NOT NULL,
    "procurementNumber" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalCost" DECIMAL(12,2) NOT NULL,
    "status" "ProcurementStatus" NOT NULL DEFAULT 'ORDERED',
    "orderedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDate" TIMESTAMP(3),
    "receivedDate" TIMESTAMP(3),
    "receivedQuantity" INTEGER,
    "invoiceNumber" TEXT,
    "notes" TEXT,
    "partId" TEXT NOT NULL,
    "vendorId" TEXT,
    "orderedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "part_usages" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "usageType" "PartUsageType" NOT NULL DEFAULT 'INSTALLATION',
    "usageDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "partId" TEXT NOT NULL,
    "assetId" TEXT,
    "componentId" TEXT,
    "maintenanceId" TEXT,
    "usedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "part_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "part_replacements" (
    "id" TEXT NOT NULL,
    "replacementNumber" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ReplacementStatus" NOT NULL DEFAULT 'PLANNED',
    "plannedDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "cost" DECIMAL(10,2),
    "notes" TEXT,
    "oldPartId" TEXT,
    "oldComponentId" TEXT,
    "newPartId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "performedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "part_replacements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "new_part_registrations" (
    "id" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "serialNumber" TEXT,
    "assetTag" TEXT,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "registeredDate" TIMESTAMP(3),
    "notes" TEXT,
    "partId" TEXT NOT NULL,
    "assetId" TEXT,
    "registeredById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "new_part_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_components" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "partNumber" TEXT,
    "serialNumber" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "status" "ComponentStatus" NOT NULL DEFAULT 'ACTIVE',
    "purchaseDate" TIMESTAMP(3),
    "purchasePrice" DECIMAL(10,2),
    "warrantyExpiry" TIMESTAMP(3),
    "isReplaceable" BOOLEAN NOT NULL DEFAULT true,
    "isTransferable" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "specifications" JSONB,
    "assetId" TEXT NOT NULL,
    "parentAssetId" TEXT,
    "sourcePartId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "component_transfers" (
    "id" TEXT NOT NULL,
    "transferNumber" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "transferDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "componentId" TEXT NOT NULL,
    "fromAssetId" TEXT NOT NULL,
    "toAssetId" TEXT NOT NULL,
    "transferredById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "component_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "component_maintenance_records" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "maintenanceType" TEXT NOT NULL,
    "maintenanceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cost" DECIMAL(10,2),
    "notes" TEXT,
    "componentId" TEXT NOT NULL,
    "performedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "component_maintenance_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "spare_parts_partNumber_key" ON "spare_parts"("partNumber");

-- CreateIndex
CREATE UNIQUE INDEX "procurements_procurementNumber_key" ON "procurements"("procurementNumber");

-- CreateIndex
CREATE UNIQUE INDEX "part_replacements_replacementNumber_key" ON "part_replacements"("replacementNumber");

-- CreateIndex
CREATE UNIQUE INDEX "new_part_registrations_registrationNumber_key" ON "new_part_registrations"("registrationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "component_transfers_transferNumber_key" ON "component_transfers"("transferNumber");

-- AddForeignKey
ALTER TABLE "spare_parts" ADD CONSTRAINT "spare_parts_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurements" ADD CONSTRAINT "procurements_partId_fkey" FOREIGN KEY ("partId") REFERENCES "spare_parts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurements" ADD CONSTRAINT "procurements_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurements" ADD CONSTRAINT "procurements_orderedById_fkey" FOREIGN KEY ("orderedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_usages" ADD CONSTRAINT "part_usages_partId_fkey" FOREIGN KEY ("partId") REFERENCES "spare_parts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_usages" ADD CONSTRAINT "part_usages_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_usages" ADD CONSTRAINT "part_usages_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "asset_components"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_usages" ADD CONSTRAINT "part_usages_maintenanceId_fkey" FOREIGN KEY ("maintenanceId") REFERENCES "maintenance_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_usages" ADD CONSTRAINT "part_usages_usedById_fkey" FOREIGN KEY ("usedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_replacements" ADD CONSTRAINT "part_replacements_oldPartId_fkey" FOREIGN KEY ("oldPartId") REFERENCES "spare_parts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_replacements" ADD CONSTRAINT "part_replacements_oldComponentId_fkey" FOREIGN KEY ("oldComponentId") REFERENCES "asset_components"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_replacements" ADD CONSTRAINT "part_replacements_newPartId_fkey" FOREIGN KEY ("newPartId") REFERENCES "spare_parts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_replacements" ADD CONSTRAINT "part_replacements_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_replacements" ADD CONSTRAINT "part_replacements_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "new_part_registrations" ADD CONSTRAINT "new_part_registrations_partId_fkey" FOREIGN KEY ("partId") REFERENCES "spare_parts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "new_part_registrations" ADD CONSTRAINT "new_part_registrations_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "new_part_registrations" ADD CONSTRAINT "new_part_registrations_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_components" ADD CONSTRAINT "asset_components_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_components" ADD CONSTRAINT "asset_components_parentAssetId_fkey" FOREIGN KEY ("parentAssetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_components" ADD CONSTRAINT "asset_components_sourcePartId_fkey" FOREIGN KEY ("sourcePartId") REFERENCES "spare_parts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_transfers" ADD CONSTRAINT "component_transfers_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "asset_components"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_transfers" ADD CONSTRAINT "component_transfers_fromAssetId_fkey" FOREIGN KEY ("fromAssetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_transfers" ADD CONSTRAINT "component_transfers_toAssetId_fkey" FOREIGN KEY ("toAssetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_transfers" ADD CONSTRAINT "component_transfers_transferredById_fkey" FOREIGN KEY ("transferredById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_maintenance_records" ADD CONSTRAINT "component_maintenance_records_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "asset_components"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_maintenance_records" ADD CONSTRAINT "component_maintenance_records_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
