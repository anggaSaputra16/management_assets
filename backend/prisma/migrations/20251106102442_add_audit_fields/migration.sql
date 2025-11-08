-- AlterTable
ALTER TABLE "asset_requests" ADD COLUMN     "editedBy" TEXT,
ADD COLUMN     "lastEditedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "asset_transfers" ADD COLUMN     "editedBy" TEXT,
ADD COLUMN     "lastEditedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "editedBy" TEXT,
ADD COLUMN     "lastEditedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "audit_records" ADD COLUMN     "editedBy" TEXT,
ADD COLUMN     "lastEditedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "maintenance_records" ADD COLUMN     "editedBy" TEXT,
ADD COLUMN     "lastEditedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "software_assets" ADD COLUMN     "editedBy" TEXT,
ADD COLUMN     "lastEditedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "spare_parts" ADD COLUMN     "editedBy" TEXT,
ADD COLUMN     "lastEditedAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_editedBy_fkey" FOREIGN KEY ("editedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_requests" ADD CONSTRAINT "asset_requests_editedBy_fkey" FOREIGN KEY ("editedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_editedBy_fkey" FOREIGN KEY ("editedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_records" ADD CONSTRAINT "audit_records_editedBy_fkey" FOREIGN KEY ("editedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spare_parts" ADD CONSTRAINT "spare_parts_editedBy_fkey" FOREIGN KEY ("editedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_transfers" ADD CONSTRAINT "asset_transfers_editedBy_fkey" FOREIGN KEY ("editedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "software_assets" ADD CONSTRAINT "software_assets_editedBy_fkey" FOREIGN KEY ("editedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
