/*
  Warnings:

  - You are about to drop the column `borrowerId` on the `inventory_loans` table. All the data in the column will be lost.
  - You are about to drop the column `responsibleId` on the `inventory_loans` table. All the data in the column will be lost.
  - Added the required column `borrowerEmployeeId` to the `inventory_loans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requestedById` to the `inventory_loans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `responsibleEmployeeId` to the `inventory_loans` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "inventory_loans" DROP CONSTRAINT "inventory_loans_borrowerId_fkey";

-- DropForeignKey
ALTER TABLE "inventory_loans" DROP CONSTRAINT "inventory_loans_responsibleId_fkey";

-- AlterTable
ALTER TABLE "inventory_loans" DROP COLUMN "borrowerId",
DROP COLUMN "responsibleId",
ADD COLUMN     "borrowerEmployeeId" TEXT NOT NULL,
ADD COLUMN     "requestedById" TEXT NOT NULL,
ADD COLUMN     "responsibleEmployeeId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "inventory_loans" ADD CONSTRAINT "inventory_loans_borrowerEmployeeId_fkey" FOREIGN KEY ("borrowerEmployeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_loans" ADD CONSTRAINT "inventory_loans_responsibleEmployeeId_fkey" FOREIGN KEY ("responsibleEmployeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_loans" ADD CONSTRAINT "inventory_loans_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
