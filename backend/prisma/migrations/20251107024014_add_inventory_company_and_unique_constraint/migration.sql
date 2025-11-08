/*
  Warnings:

  - A unique constraint covering the columns `[assetId,departmentId]` on the table `inventories` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `companyId` to the `inventories` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "inventories" ADD COLUMN     "companyId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "inventories_companyId_departmentId_status_idx" ON "inventories"("companyId", "departmentId", "status");

-- CreateIndex
CREATE INDEX "inventories_companyId_status_idx" ON "inventories"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "inventories_assetId_departmentId_key" ON "inventories"("assetId", "departmentId");
