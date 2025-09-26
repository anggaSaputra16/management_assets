-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "poNumber" TEXT,
ADD COLUMN     "qrCode" TEXT;

-- CreateTable
CREATE TABLE "asset_transfers" (
    "id" TEXT NOT NULL,
    "transferNumber" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "transferDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveDate" TIMESTAMP(3),
    "notes" TEXT,
    "approvalNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "assetId" TEXT NOT NULL,
    "fromLocationId" TEXT,
    "toLocationId" TEXT,
    "fromDepartmentId" TEXT,
    "toDepartmentId" TEXT,
    "fromUserId" TEXT,
    "toUserId" TEXT,
    "requestedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_depreciations" (
    "id" TEXT NOT NULL,
    "depreciationMethod" TEXT NOT NULL DEFAULT 'STRAIGHT_LINE',
    "usefulLife" INTEGER NOT NULL,
    "salvageValue" DECIMAL(15,2),
    "depreciationRate" DECIMAL(5,4),
    "currentBookValue" DECIMAL(15,2),
    "accumulatedDepreciation" DECIMAL(15,2),
    "lastCalculatedDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "assetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_depreciations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "depreciation_records" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "depreciationAmount" DECIMAL(15,2) NOT NULL,
    "bookValueBefore" DECIMAL(15,2) NOT NULL,
    "bookValueAfter" DECIMAL(15,2) NOT NULL,
    "calculationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "depreciationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "depreciation_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventories" (
    "id" TEXT NOT NULL,
    "inventoryTag" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "availableQty" INTEGER NOT NULL DEFAULT 1,
    "condition" TEXT NOT NULL DEFAULT 'GOOD',
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "location" TEXT,
    "notes" TEXT,
    "minStockLevel" INTEGER DEFAULT 1,
    "assetId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "custodianId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_loans" (
    "id" TEXT NOT NULL,
    "loanNumber" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "loanDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedReturnDate" TIMESTAMP(3) NOT NULL,
    "actualReturnDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "condition" TEXT,
    "notes" TEXT,
    "approvalNotes" TEXT,
    "inventoryId" TEXT NOT NULL,
    "borrowerId" TEXT NOT NULL,
    "approvedById" TEXT,
    "responsibleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_loans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "asset_transfers_transferNumber_key" ON "asset_transfers"("transferNumber");

-- CreateIndex
CREATE UNIQUE INDEX "asset_depreciations_assetId_key" ON "asset_depreciations"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "inventories_inventoryTag_key" ON "inventories"("inventoryTag");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_loans_loanNumber_key" ON "inventory_loans"("loanNumber");

-- AddForeignKey
ALTER TABLE "asset_transfers" ADD CONSTRAINT "asset_transfers_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_transfers" ADD CONSTRAINT "asset_transfers_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_transfers" ADD CONSTRAINT "asset_transfers_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_transfers" ADD CONSTRAINT "asset_transfers_fromDepartmentId_fkey" FOREIGN KEY ("fromDepartmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_transfers" ADD CONSTRAINT "asset_transfers_toDepartmentId_fkey" FOREIGN KEY ("toDepartmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_transfers" ADD CONSTRAINT "asset_transfers_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_transfers" ADD CONSTRAINT "asset_transfers_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_transfers" ADD CONSTRAINT "asset_transfers_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_transfers" ADD CONSTRAINT "asset_transfers_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_depreciations" ADD CONSTRAINT "asset_depreciations_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "depreciation_records" ADD CONSTRAINT "depreciation_records_depreciationId_fkey" FOREIGN KEY ("depreciationId") REFERENCES "asset_depreciations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_custodianId_fkey" FOREIGN KEY ("custodianId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_loans" ADD CONSTRAINT "inventory_loans_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_loans" ADD CONSTRAINT "inventory_loans_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_loans" ADD CONSTRAINT "inventory_loans_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_loans" ADD CONSTRAINT "inventory_loans_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
