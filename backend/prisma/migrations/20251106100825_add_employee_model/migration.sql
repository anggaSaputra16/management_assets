/*
  Warnings:

  - You are about to drop the column `fromUserId` on the `asset_transfers` table. All the data in the column will be lost.
  - You are about to drop the column `toUserId` on the `asset_transfers` table. All the data in the column will be lost.
  - You are about to drop the column `assignedToId` on the `assets` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "asset_transfers" DROP CONSTRAINT "asset_transfers_fromUserId_fkey";

-- DropForeignKey
ALTER TABLE "asset_transfers" DROP CONSTRAINT "asset_transfers_toUserId_fkey";

-- DropForeignKey
ALTER TABLE "assets" DROP CONSTRAINT "assets_assignedToId_fkey";

-- AlterTable
ALTER TABLE "asset_transfers" DROP COLUMN "fromUserId",
DROP COLUMN "toUserId",
ADD COLUMN     "fromEmployeeId" TEXT,
ADD COLUMN     "toEmployeeId" TEXT;

-- AlterTable
ALTER TABLE "assets" DROP COLUMN "assignedToId",
ADD COLUMN     "assignedEmployeeId" TEXT;

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "npk" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "hireDate" TIMESTAMP(3),
    "terminationDate" TIMESTAMP(3),
    "address" TEXT,
    "position" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,
    "departmentId" TEXT,
    "locationId" TEXT,
    "userId" TEXT,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employees_npk_key" ON "employees"("npk");

-- CreateIndex
CREATE UNIQUE INDEX "employees_userId_key" ON "employees"("userId");

-- CreateIndex
CREATE INDEX "employees_companyId_idx" ON "employees"("companyId");

-- CreateIndex
CREATE INDEX "employees_departmentId_idx" ON "employees"("departmentId");

-- CreateIndex
CREATE INDEX "employees_locationId_idx" ON "employees"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "employees_companyId_npk_key" ON "employees"("companyId", "npk");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_assignedEmployeeId_fkey" FOREIGN KEY ("assignedEmployeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_transfers" ADD CONSTRAINT "asset_transfers_fromEmployeeId_fkey" FOREIGN KEY ("fromEmployeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_transfers" ADD CONSTRAINT "asset_transfers_toEmployeeId_fkey" FOREIGN KEY ("toEmployeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
