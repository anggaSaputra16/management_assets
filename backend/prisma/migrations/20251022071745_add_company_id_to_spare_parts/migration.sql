/*
  Warnings:

  - A unique constraint covering the columns `[companyId,partNumber]` on the table `spare_parts` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `companyId` to the `spare_parts` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "spare_parts_partNumber_key";

-- AlterTable
ALTER TABLE "spare_parts" ADD COLUMN     "companyId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "spare_parts_companyId_category_idx" ON "spare_parts"("companyId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "spare_parts_companyId_partNumber_key" ON "spare_parts"("companyId", "partNumber");

-- AddForeignKey
ALTER TABLE "spare_parts" ADD CONSTRAINT "spare_parts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
