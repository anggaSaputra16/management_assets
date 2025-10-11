/*
  Warnings:

  - You are about to drop the column `cost` on the `maintenance_records` table. All the data in the column will be lost.
  - The `maintenanceType` column on the `maintenance_records` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[companyId,code]` on the table `categories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,code]` on the table `departments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,name]` on the table `locations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,code]` on the table `locations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[maintenanceNumber]` on the table `maintenance_records` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[employeeNumber]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,code]` on the table `vendors` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `companyId` to the `asset_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `asset_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `assets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `departments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `locations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `maintenance_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maintenanceNumber` to the `maintenance_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `maintenance_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `employeeNumber` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `vendors` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('ASSET_REQUEST', 'MAINTENANCE_REQUEST', 'SPARE_PART_REQUEST', 'SOFTWARE_LICENSE', 'ASSET_TRANSFER', 'ASSET_DISPOSAL', 'ASSET_BREAKDOWN');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('PREVENTIVE', 'CORRECTIVE', 'EMERGENCY', 'SPARE_PART_REPLACEMENT', 'SOFTWARE_UPDATE', 'CALIBRATION');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('OFFICE', 'WAREHOUSE', 'FACTORY', 'RETAIL', 'DATA_CENTER', 'OTHER');

-- CreateEnum
CREATE TYPE "SoftwareType" AS ENUM ('OPERATING_SYSTEM', 'APPLICATION', 'UTILITY', 'DRIVER', 'SECURITY', 'DEVELOPMENT_TOOL', 'OFFICE_SUITE', 'DATABASE', 'MIDDLEWARE', 'PLUGIN');

-- CreateEnum
CREATE TYPE "LicenseType" AS ENUM ('PERPETUAL', 'SUBSCRIPTION', 'OPEN_SOURCE', 'TRIAL', 'EDUCATIONAL', 'ENTERPRISE', 'OEM', 'VOLUME');

-- CreateEnum
CREATE TYPE "LicenseStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED', 'PENDING_RENEWAL', 'VIOLATION');

-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('IMAGE', 'DOCUMENT', 'MANUAL', 'WARRANTY', 'INVOICE', 'OTHER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'MAINTENANCE_COMPLETED';
ALTER TYPE "NotificationType" ADD VALUE 'REQUEST_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'ASSET_TRANSFERRED';
ALTER TYPE "NotificationType" ADD VALUE 'SOFTWARE_LICENSE_EXPIRING';
ALTER TYPE "NotificationType" ADD VALUE 'SPARE_PART_LOW_STOCK';
ALTER TYPE "NotificationType" ADD VALUE 'MAINTENANCE_OVERDUE';
ALTER TYPE "NotificationType" ADD VALUE 'ASSET_WARRANTY_EXPIRING';
ALTER TYPE "NotificationType" ADD VALUE 'DECOMPOSITION_COMPLETED';
ALTER TYPE "NotificationType" ADD VALUE 'VENDOR_CONTRACT_EXPIRING';

-- DropIndex
DROP INDEX "categories_code_key";

-- DropIndex
DROP INDEX "categories_name_key";

-- DropIndex
DROP INDEX "departments_code_key";

-- DropIndex
DROP INDEX "departments_name_key";

-- DropIndex
DROP INDEX "vendors_code_key";

-- DropIndex
DROP INDEX "vendors_name_key";

-- AlterTable
ALTER TABLE "asset_requests" ADD COLUMN     "actualCost" DECIMAL(15,2),
ADD COLUMN     "companyId" TEXT NOT NULL,
ADD COLUMN     "completedDate" TIMESTAMP(3),
ADD COLUMN     "estimatedCost" DECIMAL(15,2),
ADD COLUMN     "requestType" "RequestType" NOT NULL DEFAULT 'ASSET_REQUEST',
ADD COLUMN     "requiredDate" TIMESTAMP(3),
ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "companyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "departments" ADD COLUMN     "companyId" TEXT NOT NULL,
ADD COLUMN     "costCenter" TEXT,
ADD COLUMN     "parentDepartmentId" TEXT;

-- AlterTable
ALTER TABLE "locations" ADD COLUMN     "capacity" INTEGER,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "code" TEXT,
ADD COLUMN     "companyId" TEXT NOT NULL,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "managerId" TEXT,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "type" "LocationType" DEFAULT 'OFFICE';

-- AlterTable
ALTER TABLE "maintenance_records" DROP COLUMN "cost",
ADD COLUMN     "actualCost" DECIMAL(15,2),
ADD COLUMN     "companyId" TEXT NOT NULL,
ADD COLUMN     "downtime" INTEGER,
ADD COLUMN     "estimatedCost" DECIMAL(15,2),
ADD COLUMN     "maintenanceNumber" TEXT NOT NULL,
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "requestId" TEXT,
ADD COLUMN     "startedDate" TIMESTAMP(3),
ADD COLUMN     "supervisorId" TEXT,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "workDescription" TEXT,
DROP COLUMN "maintenanceType",
ADD COLUMN     "maintenanceType" "MaintenanceType" NOT NULL DEFAULT 'CORRECTIVE';

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "actionLabel" TEXT,
ADD COLUMN     "actionUrl" TEXT,
ADD COLUMN     "companyId" TEXT NOT NULL,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "relatedEntityId" TEXT,
ADD COLUMN     "relatedEntityType" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "address" TEXT,
ADD COLUMN     "companyId" TEXT NOT NULL,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "emergencyContact" TEXT,
ADD COLUMN     "emergencyPhone" TEXT,
ADD COLUMN     "employeeNumber" TEXT NOT NULL,
ADD COLUMN     "hireDate" TIMESTAMP(3),
ADD COLUMN     "managerId" TEXT,
ADD COLUMN     "positionId" TEXT,
ADD COLUMN     "terminationDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "vendors" ADD COLUMN     "companyId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "logo" TEXT,
    "taxNumber" TEXT,
    "registrationNumber" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "positions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "level" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_workflows" (
    "id" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "comments" TEXT,
    "processedDate" TIMESTAMP(3),
    "requestId" TEXT NOT NULL,
    "processedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "request_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_attachments" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "description" TEXT,
    "requestId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "request_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_attachments" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "description" TEXT,
    "attachmentType" TEXT NOT NULL DEFAULT 'GENERAL',
    "maintenanceId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_trails" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "description" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_trails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "software_assets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT,
    "publisher" TEXT,
    "description" TEXT,
    "softwareType" "SoftwareType" NOT NULL,
    "category" TEXT,
    "systemRequirements" JSONB,
    "installationPath" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "software_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "software_licenses" (
    "id" TEXT NOT NULL,
    "licenseKey" TEXT,
    "licenseType" "LicenseType" NOT NULL,
    "status" "LicenseStatus" NOT NULL DEFAULT 'ACTIVE',
    "totalSeats" INTEGER NOT NULL DEFAULT 1,
    "usedSeats" INTEGER NOT NULL DEFAULT 0,
    "availableSeats" INTEGER NOT NULL DEFAULT 1,
    "purchaseDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "renewalDate" TIMESTAMP(3),
    "purchaseCost" DECIMAL(15,2),
    "renewalCost" DECIMAL(15,2),
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "softwareAssetId" TEXT NOT NULL,
    "vendorId" TEXT,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "software_licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "software_installations" (
    "id" TEXT NOT NULL,
    "installationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uninstallationDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'INSTALLED',
    "installationPath" TEXT,
    "version" TEXT,
    "notes" TEXT,
    "softwareAssetId" TEXT NOT NULL,
    "licenseId" TEXT,
    "assetId" TEXT,
    "userId" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "software_installations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "license_renewals" (
    "id" TEXT NOT NULL,
    "renewalDate" TIMESTAMP(3) NOT NULL,
    "newExpiryDate" TIMESTAMP(3) NOT NULL,
    "cost" DECIMAL(15,2) NOT NULL,
    "notes" TEXT,
    "licenseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "license_renewals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_attachments" (
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
    "assetId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,

    CONSTRAINT "asset_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_required_software" (
    "id" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "assetId" TEXT NOT NULL,
    "softwareAssetId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "asset_required_software_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_name_key" ON "companies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "companies_code_key" ON "companies"("code");

-- CreateIndex
CREATE INDEX "audit_trails_entityType_entityId_idx" ON "audit_trails"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_trails_userId_createdAt_idx" ON "audit_trails"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_trails_companyId_createdAt_idx" ON "audit_trails"("companyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "asset_required_software_assetId_softwareAssetId_key" ON "asset_required_software"("assetId", "softwareAssetId");

-- CreateIndex
CREATE UNIQUE INDEX "categories_companyId_code_key" ON "categories"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "departments_companyId_code_key" ON "departments"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "locations_companyId_name_key" ON "locations"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "locations_companyId_code_key" ON "locations"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_records_maintenanceNumber_key" ON "maintenance_records"("maintenanceNumber");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_createdAt_idx" ON "notifications"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_companyId_type_createdAt_idx" ON "notifications"("companyId", "type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "users_employeeNumber_key" ON "users"("employeeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_companyId_code_key" ON "vendors"("companyId", "code");

-- AddForeignKey
ALTER TABLE "positions" ADD CONSTRAINT "positions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_parentDepartmentId_fkey" FOREIGN KEY ("parentDepartmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_requests" ADD CONSTRAINT "asset_requests_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_workflows" ADD CONSTRAINT "request_workflows_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "asset_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_workflows" ADD CONSTRAINT "request_workflows_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_attachments" ADD CONSTRAINT "request_attachments_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "asset_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_attachments" ADD CONSTRAINT "request_attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "asset_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_attachments" ADD CONSTRAINT "maintenance_attachments_maintenanceId_fkey" FOREIGN KEY ("maintenanceId") REFERENCES "maintenance_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_attachments" ADD CONSTRAINT "maintenance_attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_trails" ADD CONSTRAINT "audit_trails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_trails" ADD CONSTRAINT "audit_trails_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "software_assets" ADD CONSTRAINT "software_assets_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "software_licenses" ADD CONSTRAINT "software_licenses_softwareAssetId_fkey" FOREIGN KEY ("softwareAssetId") REFERENCES "software_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "software_licenses" ADD CONSTRAINT "software_licenses_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "software_licenses" ADD CONSTRAINT "software_licenses_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "software_installations" ADD CONSTRAINT "software_installations_softwareAssetId_fkey" FOREIGN KEY ("softwareAssetId") REFERENCES "software_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "software_installations" ADD CONSTRAINT "software_installations_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "software_licenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "software_installations" ADD CONSTRAINT "software_installations_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "software_installations" ADD CONSTRAINT "software_installations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "software_installations" ADD CONSTRAINT "software_installations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_renewals" ADD CONSTRAINT "license_renewals_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "software_licenses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_attachments" ADD CONSTRAINT "asset_attachments_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_attachments" ADD CONSTRAINT "asset_attachments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_attachments" ADD CONSTRAINT "asset_attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_required_software" ADD CONSTRAINT "asset_required_software_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_required_software" ADD CONSTRAINT "asset_required_software_softwareAssetId_fkey" FOREIGN KEY ("softwareAssetId") REFERENCES "software_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_required_software" ADD CONSTRAINT "asset_required_software_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
