-- AlterTable
ALTER TABLE "spare_parts" ADD COLUMN     "createdFromRequestId" TEXT,
ADD COLUMN     "sourceAssetId" TEXT;

-- CreateTable
CREATE TABLE "software_attachments" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "attachmentType" "AttachmentType" NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "softwareAssetId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,

    CONSTRAINT "software_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "spare_parts_createdFromRequestId_idx" ON "spare_parts"("createdFromRequestId");

-- CreateIndex
CREATE INDEX "spare_parts_sourceAssetId_idx" ON "spare_parts"("sourceAssetId");
