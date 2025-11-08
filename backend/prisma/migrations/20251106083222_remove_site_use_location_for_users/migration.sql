/*
  Warnings:

  - You are about to drop the column `siteId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `sites` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "sites" DROP CONSTRAINT "sites_companyId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_siteId_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "siteId",
ADD COLUMN     "locationId" TEXT;

-- DropTable
DROP TABLE "sites";

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
