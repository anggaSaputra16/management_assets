--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13
-- Dumped by pg_dump version 15.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: AssetStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AssetStatus" AS ENUM (
    'AVAILABLE',
    'IN_USE',
    'MAINTENANCE',
    'RETIRED',
    'DISPOSED'
);


ALTER TYPE public."AssetStatus" OWNER TO postgres;

--
-- Name: AttachmentType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AttachmentType" AS ENUM (
    'IMAGE',
    'DOCUMENT',
    'MANUAL',
    'WARRANTY',
    'INVOICE',
    'OTHER'
);


ALTER TYPE public."AttachmentType" OWNER TO postgres;

--
-- Name: AuditStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AuditStatus" AS ENUM (
    'SCHEDULED',
    'IN_PROGRESS',
    'COMPLETED'
);


ALTER TYPE public."AuditStatus" OWNER TO postgres;

--
-- Name: ComponentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ComponentStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'MAINTENANCE',
    'TRANSFERRED',
    'REPLACED',
    'DISPOSED'
);


ALTER TYPE public."ComponentStatus" OWNER TO postgres;

--
-- Name: LicenseStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."LicenseStatus" AS ENUM (
    'ACTIVE',
    'EXPIRED',
    'SUSPENDED',
    'CANCELLED',
    'PENDING_RENEWAL',
    'VIOLATION'
);


ALTER TYPE public."LicenseStatus" OWNER TO postgres;

--
-- Name: LicenseType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."LicenseType" AS ENUM (
    'PERPETUAL',
    'SUBSCRIPTION',
    'OPEN_SOURCE',
    'TRIAL',
    'EDUCATIONAL',
    'ENTERPRISE',
    'OEM',
    'VOLUME'
);


ALTER TYPE public."LicenseType" OWNER TO postgres;

--
-- Name: LocationType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."LocationType" AS ENUM (
    'OFFICE',
    'WAREHOUSE',
    'FACTORY',
    'RETAIL',
    'DATA_CENTER',
    'OTHER'
);


ALTER TYPE public."LocationType" OWNER TO postgres;

--
-- Name: MaintenanceStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."MaintenanceStatus" AS ENUM (
    'SCHEDULED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."MaintenanceStatus" OWNER TO postgres;

--
-- Name: MaintenanceType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."MaintenanceType" AS ENUM (
    'PREVENTIVE',
    'CORRECTIVE',
    'EMERGENCY',
    'SPARE_PART_REPLACEMENT',
    'SOFTWARE_UPDATE',
    'CALIBRATION'
);


ALTER TYPE public."MaintenanceType" OWNER TO postgres;

--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."NotificationType" AS ENUM (
    'REQUEST_APPROVAL',
    'ASSET_ALLOCATION',
    'MAINTENANCE_DUE',
    'AUDIT_SCHEDULED',
    'GENERAL',
    'MAINTENANCE_COMPLETED',
    'REQUEST_REJECTED',
    'ASSET_TRANSFERRED',
    'SOFTWARE_LICENSE_EXPIRING',
    'SPARE_PART_LOW_STOCK',
    'MAINTENANCE_OVERDUE',
    'ASSET_WARRANTY_EXPIRING',
    'DECOMPOSITION_COMPLETED',
    'VENDOR_CONTRACT_EXPIRING'
);


ALTER TYPE public."NotificationType" OWNER TO postgres;

--
-- Name: PartUsageType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PartUsageType" AS ENUM (
    'REPLACEMENT',
    'UPGRADE',
    'REPAIR',
    'INSTALLATION',
    'MAINTENANCE',
    'TRANSFER'
);


ALTER TYPE public."PartUsageType" OWNER TO postgres;

--
-- Name: ProcurementStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ProcurementStatus" AS ENUM (
    'ORDERED',
    'SHIPPED',
    'RECEIVED',
    'PARTIALLY_RECEIVED',
    'CANCELLED'
);


ALTER TYPE public."ProcurementStatus" OWNER TO postgres;

--
-- Name: RegistrationStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RegistrationStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REGISTERED',
    'REJECTED'
);


ALTER TYPE public."RegistrationStatus" OWNER TO postgres;

--
-- Name: ReplacementStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ReplacementStatus" AS ENUM (
    'PLANNED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."ReplacementStatus" OWNER TO postgres;

--
-- Name: RequestStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RequestStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'ALLOCATED',
    'COMPLETED'
);


ALTER TYPE public."RequestStatus" OWNER TO postgres;

--
-- Name: RequestType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RequestType" AS ENUM (
    'ASSET_REQUEST',
    'MAINTENANCE_REQUEST',
    'SPARE_PART_REQUEST',
    'SOFTWARE_LICENSE',
    'ASSET_TRANSFER',
    'ASSET_DISPOSAL',
    'ASSET_BREAKDOWN'
);


ALTER TYPE public."RequestType" OWNER TO postgres;

--
-- Name: SoftwareType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SoftwareType" AS ENUM (
    'OPERATING_SYSTEM',
    'APPLICATION',
    'UTILITY',
    'DRIVER',
    'SECURITY',
    'DEVELOPMENT_TOOL',
    'OFFICE_SUITE',
    'DATABASE',
    'MIDDLEWARE',
    'PLUGIN'
);


ALTER TYPE public."SoftwareType" OWNER TO postgres;

--
-- Name: SparePartCategory; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SparePartCategory" AS ENUM (
    'HARDWARE',
    'SOFTWARE',
    'ACCESSORY',
    'CONSUMABLE'
);


ALTER TYPE public."SparePartCategory" OWNER TO postgres;

--
-- Name: SparePartStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SparePartStatus" AS ENUM (
    'ACTIVE',
    'DISCONTINUED',
    'OUT_OF_STOCK',
    'OBSOLETE'
);


ALTER TYPE public."SparePartStatus" OWNER TO postgres;

--
-- Name: SparePartType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SparePartType" AS ENUM (
    'COMPONENT',
    'ACCESSORY',
    'CONSUMABLE',
    'TOOL',
    'SOFTWARE'
);


ALTER TYPE public."SparePartType" OWNER TO postgres;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserRole" AS ENUM (
    'ADMIN',
    'ASSET_ADMIN',
    'MANAGER',
    'DEPARTMENT_USER',
    'TECHNICIAN',
    'AUDITOR',
    'TOP_MANAGEMENT'
);


ALTER TYPE public."UserRole" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: asset_attachments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.asset_attachments (
    id text NOT NULL,
    "fileName" text NOT NULL,
    "originalName" text NOT NULL,
    "filePath" text NOT NULL,
    "fileSize" integer,
    "mimeType" text,
    "attachmentType" public."AttachmentType" NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "assetId" text NOT NULL,
    "companyId" text NOT NULL,
    "uploadedById" text NOT NULL
);


ALTER TABLE public.asset_attachments OWNER TO postgres;

--
-- Name: asset_components; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.asset_components (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "partNumber" text,
    "serialNumber" text,
    brand text,
    model text,
    status public."ComponentStatus" DEFAULT 'ACTIVE'::public."ComponentStatus" NOT NULL,
    "purchaseDate" timestamp(3) without time zone,
    "purchasePrice" numeric(10,2),
    "warrantyExpiry" timestamp(3) without time zone,
    "isReplaceable" boolean DEFAULT true NOT NULL,
    "isTransferable" boolean DEFAULT true NOT NULL,
    notes text,
    specifications jsonb,
    "assetId" text NOT NULL,
    "parentAssetId" text,
    "sourcePartId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.asset_components OWNER TO postgres;

--
-- Name: asset_depreciations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.asset_depreciations (
    id text NOT NULL,
    "depreciationMethod" text DEFAULT 'STRAIGHT_LINE'::text NOT NULL,
    "usefulLife" integer NOT NULL,
    "salvageValue" numeric(15,2),
    "depreciationRate" numeric(5,4),
    "currentBookValue" numeric(15,2),
    "accumulatedDepreciation" numeric(15,2),
    "lastCalculatedDate" timestamp(3) without time zone,
    "isActive" boolean DEFAULT true NOT NULL,
    notes text,
    "assetId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.asset_depreciations OWNER TO postgres;

--
-- Name: asset_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.asset_requests (
    id text NOT NULL,
    "requestNumber" text NOT NULL,
    description text NOT NULL,
    justification text NOT NULL,
    priority text DEFAULT 'MEDIUM'::text NOT NULL,
    status public."RequestStatus" DEFAULT 'PENDING'::public."RequestStatus" NOT NULL,
    "requestedDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "approvedDate" timestamp(3) without time zone,
    "allocatedDate" timestamp(3) without time zone,
    "rejectionReason" text,
    notes text,
    "requesterId" text NOT NULL,
    "departmentId" text NOT NULL,
    "assetId" text,
    "approvedById" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "actualCost" numeric(15,2),
    "companyId" text NOT NULL,
    "completedDate" timestamp(3) without time zone,
    "estimatedCost" numeric(15,2),
    "requestType" public."RequestType" DEFAULT 'ASSET_REQUEST'::public."RequestType" NOT NULL,
    "requiredDate" timestamp(3) without time zone,
    title text NOT NULL
);


ALTER TABLE public.asset_requests OWNER TO postgres;

--
-- Name: asset_required_software; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.asset_required_software (
    id text NOT NULL,
    "isRequired" boolean DEFAULT true NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "assetId" text NOT NULL,
    "softwareAssetId" text NOT NULL,
    "companyId" text NOT NULL
);


ALTER TABLE public.asset_required_software OWNER TO postgres;

--
-- Name: asset_transfers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.asset_transfers (
    id text NOT NULL,
    "transferNumber" text NOT NULL,
    reason text NOT NULL,
    "transferDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "effectiveDate" timestamp(3) without time zone,
    notes text,
    "approvalNotes" text,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "assetId" text NOT NULL,
    "fromLocationId" text,
    "toLocationId" text,
    "fromDepartmentId" text,
    "toDepartmentId" text,
    "fromUserId" text,
    "toUserId" text,
    "requestedById" text NOT NULL,
    "approvedById" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.asset_transfers OWNER TO postgres;

--
-- Name: assets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assets (
    id text NOT NULL,
    "assetTag" text NOT NULL,
    name text NOT NULL,
    description text,
    "serialNumber" text,
    model text,
    brand text,
    "purchaseDate" timestamp(3) without time zone,
    "purchasePrice" numeric(15,2),
    "currentValue" numeric(15,2),
    "warrantyExpiry" timestamp(3) without time zone,
    status public."AssetStatus" DEFAULT 'AVAILABLE'::public."AssetStatus" NOT NULL,
    condition text,
    notes text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "categoryId" text NOT NULL,
    "vendorId" text,
    "locationId" text,
    "departmentId" text,
    "assignedToId" text,
    "poNumber" text,
    "qrCode" text,
    "imageUrl" text,
    specifications jsonb,
    "companyId" text NOT NULL
);


ALTER TABLE public.assets OWNER TO postgres;

--
-- Name: audit_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_records (
    id text NOT NULL,
    "auditType" text NOT NULL,
    "scheduledDate" timestamp(3) without time zone NOT NULL,
    "completedDate" timestamp(3) without time zone,
    status public."AuditStatus" DEFAULT 'SCHEDULED'::public."AuditStatus" NOT NULL,
    findings text,
    recommendations text,
    "assetId" text,
    "auditorId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.audit_records OWNER TO postgres;

--
-- Name: audit_trails; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_trails (
    id text NOT NULL,
    action text NOT NULL,
    "entityType" text NOT NULL,
    "entityId" text NOT NULL,
    "oldValues" jsonb,
    "newValues" jsonb,
    description text,
    "ipAddress" text,
    "userAgent" text,
    "sessionId" text,
    "userId" text NOT NULL,
    "companyId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_trails OWNER TO postgres;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    description text,
    "parentId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text NOT NULL
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: companies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.companies (
    id text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    address text,
    phone text,
    email text,
    website text,
    logo text,
    "taxNumber" text,
    "registrationNumber" text,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.companies OWNER TO postgres;

--
-- Name: component_maintenance_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.component_maintenance_records (
    id text NOT NULL,
    description text NOT NULL,
    "maintenanceType" text NOT NULL,
    "maintenanceDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    cost numeric(10,2),
    notes text,
    "componentId" text NOT NULL,
    "performedById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.component_maintenance_records OWNER TO postgres;

--
-- Name: component_transfers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.component_transfers (
    id text NOT NULL,
    "transferNumber" text NOT NULL,
    reason text NOT NULL,
    "transferDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    notes text,
    "componentId" text NOT NULL,
    "fromAssetId" text NOT NULL,
    "toAssetId" text NOT NULL,
    "transferredById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.component_transfers OWNER TO postgres;

--
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    id text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    description text,
    "managerId" text,
    "budgetLimit" numeric(15,2),
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text NOT NULL,
    "costCenter" text,
    "parentDepartmentId" text
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- Name: depreciation_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.depreciation_records (
    id text NOT NULL,
    period text NOT NULL,
    "depreciationAmount" numeric(15,2) NOT NULL,
    "bookValueBefore" numeric(15,2) NOT NULL,
    "bookValueAfter" numeric(15,2) NOT NULL,
    "calculationDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    notes text,
    "depreciationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.depreciation_records OWNER TO postgres;

--
-- Name: disposal_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.disposal_records (
    id text NOT NULL,
    "disposalType" text NOT NULL,
    "disposalDate" timestamp(3) without time zone NOT NULL,
    "disposalValue" numeric(15,2),
    reason text NOT NULL,
    "approvalReference" text,
    notes text,
    "assetId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.disposal_records OWNER TO postgres;

--
-- Name: inventories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventories (
    id text NOT NULL,
    "inventoryTag" text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    "availableQty" integer DEFAULT 1 NOT NULL,
    condition text DEFAULT 'GOOD'::text NOT NULL,
    status text DEFAULT 'AVAILABLE'::text NOT NULL,
    location text,
    notes text,
    "minStockLevel" integer DEFAULT 1,
    "assetId" text NOT NULL,
    "departmentId" text NOT NULL,
    "custodianId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.inventories OWNER TO postgres;

--
-- Name: inventory_loans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory_loans (
    id text NOT NULL,
    "loanNumber" text NOT NULL,
    purpose text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    "loanDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expectedReturnDate" timestamp(3) without time zone NOT NULL,
    "actualReturnDate" timestamp(3) without time zone,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    condition text,
    notes text,
    "approvalNotes" text,
    "inventoryId" text NOT NULL,
    "borrowerId" text NOT NULL,
    "approvedById" text,
    "responsibleId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.inventory_loans OWNER TO postgres;

--
-- Name: license_renewals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.license_renewals (
    id text NOT NULL,
    "renewalDate" timestamp(3) without time zone NOT NULL,
    "newExpiryDate" timestamp(3) without time zone NOT NULL,
    cost numeric(15,2) NOT NULL,
    notes text,
    "licenseId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.license_renewals OWNER TO postgres;

--
-- Name: locations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.locations (
    id text NOT NULL,
    name text NOT NULL,
    building text,
    floor text,
    room text,
    address text,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    capacity integer,
    city text,
    code text,
    "companyId" text NOT NULL,
    country text,
    "managerId" text,
    "postalCode" text,
    state text,
    type public."LocationType" DEFAULT 'OFFICE'::public."LocationType"
);


ALTER TABLE public.locations OWNER TO postgres;

--
-- Name: maintenance_attachments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.maintenance_attachments (
    id text NOT NULL,
    filename text NOT NULL,
    "originalName" text NOT NULL,
    "mimeType" text NOT NULL,
    "fileSize" integer NOT NULL,
    "filePath" text NOT NULL,
    description text,
    "attachmentType" text DEFAULT 'GENERAL'::text NOT NULL,
    "maintenanceId" text NOT NULL,
    "uploadedById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.maintenance_attachments OWNER TO postgres;

--
-- Name: maintenance_contracts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.maintenance_contracts (
    id text NOT NULL,
    "contractNumber" text NOT NULL,
    description text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    cost numeric(15,2) NOT NULL,
    terms text,
    "isActive" boolean DEFAULT true NOT NULL,
    "vendorId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.maintenance_contracts OWNER TO postgres;

--
-- Name: maintenance_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.maintenance_records (
    id text NOT NULL,
    description text NOT NULL,
    "scheduledDate" timestamp(3) without time zone NOT NULL,
    "completedDate" timestamp(3) without time zone,
    status public."MaintenanceStatus" DEFAULT 'SCHEDULED'::public."MaintenanceStatus" NOT NULL,
    notes text,
    "assetId" text NOT NULL,
    "technicianId" text,
    "vendorId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "actualCost" numeric(15,2),
    "companyId" text NOT NULL,
    downtime integer,
    "estimatedCost" numeric(15,2),
    "maintenanceNumber" text NOT NULL,
    priority text DEFAULT 'MEDIUM'::text NOT NULL,
    "requestId" text,
    "startedDate" timestamp(3) without time zone,
    "supervisorId" text,
    title text NOT NULL,
    "workDescription" text,
    "maintenanceType" public."MaintenanceType" DEFAULT 'CORRECTIVE'::public."MaintenanceType" NOT NULL
);


ALTER TABLE public.maintenance_records OWNER TO postgres;

--
-- Name: new_part_registrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.new_part_registrations (
    id text NOT NULL,
    "registrationNumber" text NOT NULL,
    "serialNumber" text,
    "assetTag" text,
    status public."RegistrationStatus" DEFAULT 'PENDING'::public."RegistrationStatus" NOT NULL,
    "registeredDate" timestamp(3) without time zone,
    notes text,
    "partId" text NOT NULL,
    "assetId" text,
    "registeredById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.new_part_registrations OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type public."NotificationType" NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "actionLabel" text,
    "actionUrl" text,
    "companyId" text NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    metadata jsonb,
    priority text DEFAULT 'MEDIUM'::text NOT NULL,
    "relatedEntityId" text,
    "relatedEntityType" text
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: part_replacements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.part_replacements (
    id text NOT NULL,
    "replacementNumber" text NOT NULL,
    reason text NOT NULL,
    status public."ReplacementStatus" DEFAULT 'PLANNED'::public."ReplacementStatus" NOT NULL,
    "plannedDate" timestamp(3) without time zone,
    "completedDate" timestamp(3) without time zone,
    cost numeric(10,2),
    notes text,
    "oldPartId" text,
    "oldComponentId" text,
    "newPartId" text NOT NULL,
    "assetId" text NOT NULL,
    "performedById" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.part_replacements OWNER TO postgres;

--
-- Name: part_usages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.part_usages (
    id text NOT NULL,
    quantity integer NOT NULL,
    "usageType" public."PartUsageType" DEFAULT 'INSTALLATION'::public."PartUsageType" NOT NULL,
    "usageDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    notes text,
    "partId" text NOT NULL,
    "assetId" text,
    "componentId" text,
    "maintenanceId" text,
    "usedById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.part_usages OWNER TO postgres;

--
-- Name: positions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.positions (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    level text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text NOT NULL
);


ALTER TABLE public.positions OWNER TO postgres;

--
-- Name: procurements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.procurements (
    id text NOT NULL,
    "procurementNumber" text NOT NULL,
    quantity integer NOT NULL,
    "unitPrice" numeric(10,2) NOT NULL,
    "totalCost" numeric(12,2) NOT NULL,
    status public."ProcurementStatus" DEFAULT 'ORDERED'::public."ProcurementStatus" NOT NULL,
    "orderedDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expectedDate" timestamp(3) without time zone,
    "receivedDate" timestamp(3) without time zone,
    "receivedQuantity" integer,
    "invoiceNumber" text,
    notes text,
    "partId" text NOT NULL,
    "vendorId" text,
    "orderedById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.procurements OWNER TO postgres;

--
-- Name: request_attachments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.request_attachments (
    id text NOT NULL,
    filename text NOT NULL,
    "originalName" text NOT NULL,
    "mimeType" text NOT NULL,
    "fileSize" integer NOT NULL,
    "filePath" text NOT NULL,
    description text,
    "requestId" text NOT NULL,
    "uploadedById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.request_attachments OWNER TO postgres;

--
-- Name: request_workflows; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.request_workflows (
    id text NOT NULL,
    step text NOT NULL,
    "stepOrder" integer NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    comments text,
    "processedDate" timestamp(3) without time zone,
    "requestId" text NOT NULL,
    "processedById" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.request_workflows OWNER TO postgres;

--
-- Name: software_assets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.software_assets (
    id text NOT NULL,
    name text NOT NULL,
    version text,
    publisher text,
    description text,
    "softwareType" public."SoftwareType" NOT NULL,
    category text,
    "systemRequirements" jsonb,
    "installationPath" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text NOT NULL
);


ALTER TABLE public.software_assets OWNER TO postgres;

--
-- Name: software_installations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.software_installations (
    id text NOT NULL,
    "installationDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "uninstallationDate" timestamp(3) without time zone,
    status text DEFAULT 'INSTALLED'::text NOT NULL,
    "installationPath" text,
    version text,
    notes text,
    "softwareAssetId" text NOT NULL,
    "licenseId" text,
    "assetId" text,
    "userId" text,
    "companyId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.software_installations OWNER TO postgres;

--
-- Name: software_licenses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.software_licenses (
    id text NOT NULL,
    "licenseKey" text,
    "licenseType" public."LicenseType" NOT NULL,
    status public."LicenseStatus" DEFAULT 'ACTIVE'::public."LicenseStatus" NOT NULL,
    "totalSeats" integer DEFAULT 1 NOT NULL,
    "usedSeats" integer DEFAULT 0 NOT NULL,
    "availableSeats" integer DEFAULT 1 NOT NULL,
    "purchaseDate" timestamp(3) without time zone,
    "expiryDate" timestamp(3) without time zone,
    "renewalDate" timestamp(3) without time zone,
    "purchaseCost" numeric(15,2),
    "renewalCost" numeric(15,2),
    notes text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "softwareAssetId" text NOT NULL,
    "vendorId" text,
    "companyId" text NOT NULL
);


ALTER TABLE public.software_licenses OWNER TO postgres;

--
-- Name: spare_parts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.spare_parts (
    id text NOT NULL,
    "partNumber" text NOT NULL,
    name text NOT NULL,
    description text,
    brand text,
    model text,
    category public."SparePartCategory" DEFAULT 'HARDWARE'::public."SparePartCategory" NOT NULL,
    "partType" public."SparePartType" DEFAULT 'COMPONENT'::public."SparePartType" NOT NULL,
    status public."SparePartStatus" DEFAULT 'ACTIVE'::public."SparePartStatus" NOT NULL,
    "unitPrice" numeric(10,2) NOT NULL,
    "stockLevel" integer DEFAULT 0 NOT NULL,
    "minStockLevel" integer DEFAULT 10 NOT NULL,
    "maxStockLevel" integer DEFAULT 100 NOT NULL,
    "reorderPoint" integer DEFAULT 15 NOT NULL,
    "storageLocation" text,
    specifications jsonb,
    "compatibleWith" text[],
    notes text,
    "isActive" boolean DEFAULT true NOT NULL,
    "vendorId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text NOT NULL
);


ALTER TABLE public.spare_parts OWNER TO postgres;

--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_settings (
    id text NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.system_settings OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    phone text,
    role public."UserRole" DEFAULT 'DEPARTMENT_USER'::public."UserRole" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "departmentId" text,
    address text,
    "companyId" text NOT NULL,
    "dateOfBirth" timestamp(3) without time zone,
    "emergencyContact" text,
    "emergencyPhone" text,
    "employeeNumber" text NOT NULL,
    "hireDate" timestamp(3) without time zone,
    "managerId" text,
    "positionId" text,
    "terminationDate" timestamp(3) without time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: vendors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vendors (
    id text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    email text,
    phone text,
    address text,
    "contactPerson" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text NOT NULL
);


ALTER TABLE public.vendors OWNER TO postgres;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
bece964f-440c-4cc3-ac1c-ba5810469a1d	ea78a924e4f6bb765d03ddce385c60f98d903e427e2b796414982d7014033287	2025-10-06 03:35:32.871704+00	20250718023019_init	\N	\N	2025-10-06 03:35:32.727006+00	1
e887fbd9-9cfd-4272-a51b-432c9656ec4a	6da0f28e43468dfae35bd9d700598568cf3dedf429b244dc50af000ffa4adb93	2025-10-06 03:35:32.999282+00	20250922024317_add_spare_parts_and_components	\N	\N	2025-10-06 03:35:32.877212+00	1
d8a6eced-73b1-4ff5-9ac7-5f60c44e3bf9	088b22dbc22171883132b1819ac5c47dafdec1c5ccde75d6abe64ade43309336	2025-10-06 03:35:33.065361+00	20250924023331_add_po_number_transfer_depreciation_qr	\N	\N	2025-10-06 03:35:33.002961+00	1
a418de3a-3ce6-487f-9eaf-09e5d40234ff	8d06121473cbe6e746ae8dca1757f2b9ed00c0458ec675c1a4ac19c678ed59a3	2025-10-06 03:35:33.073639+00	20250924061635_add_specifications_field	\N	\N	2025-10-06 03:35:33.068335+00	1
1c0e7768-d4a2-4895-bbdc-419a4e36f733	46d4bfde5cb34b7ad2dac1387a5fdbd7cf065a75caba1c77886e54df2fc53bd9	2025-10-08 03:19:31.142897+00	20251008031930_add_missing_columns	\N	\N	2025-10-08 03:19:30.729881+00	1
4400d2df-29cd-4425-bcc9-c036c5630ea1	fde74f6507fff756c965b275986dad2058000615e3047a357fedadc7424554cc	2025-10-22 07:17:45.424545+00	20251022071745_add_company_id_to_spare_parts	\N	\N	2025-10-22 07:17:45.387148+00	1
\.


--
-- Data for Name: asset_attachments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.asset_attachments (id, "fileName", "originalName", "filePath", "fileSize", "mimeType", "attachmentType", description, "isActive", "createdAt", "updatedAt", "assetId", "companyId", "uploadedById") FROM stdin;
\.


--
-- Data for Name: asset_components; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.asset_components (id, name, description, "partNumber", "serialNumber", brand, model, status, "purchaseDate", "purchasePrice", "warrantyExpiry", "isReplaceable", "isTransferable", notes, specifications, "assetId", "parentAssetId", "sourcePartId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: asset_depreciations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.asset_depreciations (id, "depreciationMethod", "usefulLife", "salvageValue", "depreciationRate", "currentBookValue", "accumulatedDepreciation", "lastCalculatedDate", "isActive", notes, "assetId", "createdAt", "updatedAt") FROM stdin;
cmgkbcvns000313x72t7meum4	STRAIGHT_LINE	0	\N	0.0300	12000000.00	0.00	2025-10-10 03:55:27.688	t	\N	cmgkbcvka000213x7z1fkmtdb	2025-10-10 03:55:27.689	2025-10-10 03:55:27.689
\.


--
-- Data for Name: asset_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.asset_requests (id, "requestNumber", description, justification, priority, status, "requestedDate", "approvedDate", "allocatedDate", "rejectionReason", notes, "requesterId", "departmentId", "assetId", "approvedById", "createdAt", "updatedAt", "actualCost", "companyId", "completedDate", "estimatedCost", "requestType", "requiredDate", title) FROM stdin;
\.


--
-- Data for Name: asset_required_software; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.asset_required_software (id, "isRequired", notes, "createdAt", "updatedAt", "assetId", "softwareAssetId", "companyId") FROM stdin;
\.


--
-- Data for Name: asset_transfers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.asset_transfers (id, "transferNumber", reason, "transferDate", "effectiveDate", notes, "approvalNotes", status, "assetId", "fromLocationId", "toLocationId", "fromDepartmentId", "toDepartmentId", "fromUserId", "toUserId", "requestedById", "approvedById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: assets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assets (id, "assetTag", name, description, "serialNumber", model, brand, "purchaseDate", "purchasePrice", "currentValue", "warrantyExpiry", status, condition, notes, "isActive", "createdAt", "updatedAt", "categoryId", "vendorId", "locationId", "departmentId", "assignedToId", "poNumber", "qrCode", "imageUrl", specifications, "companyId") FROM stdin;
cmghf8gsc001uwsabj7d0dfby	AST-2024-001	Dell OptiPlex 7090	Desktop computer for IT department	DL7090001	OptiPlex 7090	Dell	2024-01-15 00:00:00	12000000.00	10000000.00	2027-01-15 00:00:00	IN_USE	Good	\N	t	2025-10-08 03:20:41.724	2025-10-08 03:20:41.724	cmghf8gra001gwsablcqv34hq	cmghf8gqb0013wsabs0fx2lbn	cmghf8gq4000ywsabe4cw9j24	cmghf8ggd0006wsaby418wq7k	\N	\N	\N	\N	\N	cmghf8gfy0000wsabtq67m6rw
cmghf8gsj001wwsabxhq5ysa1	AST-2024-002	HP ProLiant DL380	Web server for company applications	HP380001	ProLiant DL380 Gen10	HP	2024-02-01 00:00:00	45000000.00	40000000.00	2027-02-01 00:00:00	IN_USE	Excellent	\N	t	2025-10-08 03:20:41.731	2025-10-08 03:20:41.731	cmghf8gre001iwsab6q673bgr	cmghf8gqb0014wsabzsk4drz0	cmghf8gq4000xwsab0715eevi	cmghf8ggd0006wsaby418wq7k	\N	\N	\N	\N	\N	cmghf8gfy0000wsabtq67m6rw
cmghf8gsn001ywsabe2hotumg	AST-2024-003	Ergonomic Office Chair	Executive office chair with lumbar support	ERG001	Executive Pro	Office Comfort	2024-03-10 00:00:00	2500000.00	2200000.00	2026-03-10 00:00:00	AVAILABLE	Good	\N	t	2025-10-08 03:20:41.735	2025-10-10 02:38:28.049	cmghf8grr001owsabnqqzzy1s	cmghf8gqb0013wsabs0fx2lbn	cmghf8gq4000ywsabe4cw9j24	cmghf8ggd0007wsabkauoqckw	\N	\N	{"id":"cmghf8gsn001ywsabe2hotumg","assetTag":"AST-2024-003","name":"Ergonomic Office Chair","assignedTo":null,"type":"asset","timestamp":"2025-10-10T02:38:28.021Z"}	\N	\N	cmghf8gfy0000wsabtq67m6rw
cmgkbcvka000213x7z1fkmtdb	AST-000004	Dell OptiPlex 7090 insert 4	test	DL7090001	OptiPlex 7090	DELL	2025-09-15 00:00:00	12000000.00	\N	2027-01-15 00:00:00	AVAILABLE	EXCELLENT	\N	t	2025-10-10 03:55:27.562	2025-10-22 08:28:54.445	cmghf8gqg0018wsab5o1g5yt6	cmghf8gqb0014wsabzsk4drz0	cmghf8gq4000ywsabe4cw9j24	cmghf8ggd0006wsaby418wq7k	cmghf8gpo000swsabj6yxa9le	PO096565	{"id":"cmgkbcvka000213x7z1fkmtdb","assetTag":"AST-000004","name":"Dell OptiPlex 7090 insert 4","assignedTo":"IT User","type":"asset","timestamp":"2025-10-22T08:28:54.388Z"}	\N	{"ram 32gb": "core i9"}	cmghf8gfy0000wsabtq67m6rw
\.


--
-- Data for Name: audit_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_records (id, "auditType", "scheduledDate", "completedDate", status, findings, recommendations, "assetId", "auditorId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: audit_trails; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_trails (id, action, "entityType", "entityId", "oldValues", "newValues", description, "ipAddress", "userAgent", "sessionId", "userId", "companyId", "createdAt") FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name, code, description, "parentId", "isActive", "createdAt", "updatedAt", "companyId") FROM stdin;
cmghf8gqg0018wsab5o1g5yt6	Information Technology	IT	IT equipment and devices	\N	t	2025-10-08 03:20:41.656	2025-10-08 03:20:41.656	cmghf8gfy0000wsabtq67m6rw
cmghf8gqo001awsab23num560	Furniture	FUR	Office furniture and fixtures	\N	t	2025-10-08 03:20:41.664	2025-10-08 03:20:41.664	cmghf8gfy0000wsabtq67m6rw
cmghf8gqu001cwsabn7g5fwes	Vehicles	VEH	Company vehicles and transportation	\N	t	2025-10-08 03:20:41.67	2025-10-08 03:20:41.67	cmghf8gfy0000wsabtq67m6rw
cmghf8gqy001ewsab7r44fwme	Office Equipment	OFC	General office equipment	\N	t	2025-10-08 03:20:41.674	2025-10-08 03:20:41.674	cmghf8gfy0000wsabtq67m6rw
cmghf8gra001gwsablcqv34hq	Computers	IT-COMP	Desktop and laptop computers	cmghf8gqg0018wsab5o1g5yt6	t	2025-10-08 03:20:41.686	2025-10-08 03:20:41.686	cmghf8gfy0000wsabtq67m6rw
cmghf8gre001iwsab6q673bgr	Servers	IT-SERV	Server hardware	cmghf8gqg0018wsab5o1g5yt6	t	2025-10-08 03:20:41.69	2025-10-08 03:20:41.69	cmghf8gfy0000wsabtq67m6rw
cmghf8gri001kwsabskeekmmq	Network Equipment	IT-NET	Routers, switches, and network devices	cmghf8gqg0018wsab5o1g5yt6	t	2025-10-08 03:20:41.694	2025-10-08 03:20:41.694	cmghf8gfy0000wsabtq67m6rw
cmghf8grn001mwsabkq0e1lfw	Printers	IT-PRINT	Printing devices	cmghf8gqg0018wsab5o1g5yt6	t	2025-10-08 03:20:41.699	2025-10-08 03:20:41.699	cmghf8gfy0000wsabtq67m6rw
cmghf8grr001owsabnqqzzy1s	Office Chairs	FUR-CHAIR	Office seating furniture	cmghf8gqo001awsab23num560	t	2025-10-08 03:20:41.703	2025-10-08 03:20:41.703	cmghf8gfy0000wsabtq67m6rw
cmghf8gru001qwsabe76zc40j	Desks	FUR-DESK	Office desks and tables	cmghf8gqo001awsab23num560	t	2025-10-08 03:20:41.707	2025-10-08 03:20:41.707	cmghf8gfy0000wsabtq67m6rw
cmghf8gry001swsabmhzisd2y	Company Cars	VEH-CAR	Company owned vehicles	cmghf8gqu001cwsabn7g5fwes	t	2025-10-08 03:20:41.71	2025-10-08 03:20:41.71	cmghf8gfy0000wsabtq67m6rw
cmh006sw20003ewrn6pbsqltx	Company Networking	NET	test	\N	t	2025-10-21 03:27:07.202	2025-10-21 03:27:07.202	cmghf8gfy0000wsabtq67m6rw
cmh00sjln0000fhypv8zw1arn	Software	Software computer	test	\N	t	2025-10-21 03:44:01.595	2025-10-21 03:44:01.595	cmghf8gfy0000wsabtq67m6rw
cmh00to9t0001fhypu0fuldae	software	software office	tst	\N	t	2025-10-21 03:44:54.305	2025-10-21 03:44:54.305	cmghf8gfy0000wsabtq67m6rw
cmh019efr0002fhypkvdjrt7o	Networking	test	test	\N	t	2025-10-21 03:57:08.055	2025-10-21 03:57:08.055	cmghf8gfy0000wsabtq67m6rw
cmh4idkxu00028ne7v8a7hdnr	test	T	test	\N	t	2025-10-24 07:07:21.283	2025-10-24 07:07:21.283	cmghf8gfy0000wsabtq67m6rw
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.companies (id, name, code, address, phone, email, website, logo, "taxNumber", "registrationNumber", description, "isActive", "createdAt", "updatedAt") FROM stdin;
cmghf8gfy0000wsabtq67m6rw	PT. Asset Management Indonesia	MAIN	Jl. Sudirman Kav 1, Jakarta Pusat, Indonesia 10110	+62215551000	info@assetmanagement.co.id	https://www.assetmanagement.co.id	\N	01.234.567.8-901.000	REG-2024-001	Main company for asset management system pdate	t	2025-10-08 03:20:41.279	2025-10-21 03:17:20.995
cmgzzvcmm0000xp5mwb93ru1k	PT ARTISAN WAHYU	AW	Gandaria 8 Office Tower	098877977	info@assetmanagement.co.id	https://www.assetmanagement.co.id	\N	01.234.567.8-901.000	REG-2024-001	test companiew master data	t	2025-10-21 03:18:12.91	2025-10-21 03:18:12.91
cmh4i66ic00003plzq8dv3tri	Customer Celerance 	CC	gandaria office tower 8	0215551235	info@kompsejahtera.com	https://www.nuiiapps.com	\N	2132131243	HP380005	test ajah	t	2025-10-24 07:01:35.988	2025-10-24 07:01:35.988
\.


--
-- Data for Name: component_maintenance_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.component_maintenance_records (id, description, "maintenanceType", "maintenanceDate", cost, notes, "componentId", "performedById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: component_transfers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.component_transfers (id, "transferNumber", reason, "transferDate", notes, "componentId", "fromAssetId", "toAssetId", "transferredById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (id, name, code, description, "managerId", "budgetLimit", "isActive", "createdAt", "updatedAt", "companyId", "costCenter", "parentDepartmentId") FROM stdin;
cmghf8ggd0006wsaby418wq7k	Information Technology	IT	IT Department managing technology infrastructure	\N	500000000.00	t	2025-10-08 03:20:41.293	2025-10-08 03:20:41.293	cmghf8gfy0000wsabtq67m6rw	\N	\N
cmghf8ggd0007wsabkauoqckw	Human Resources	HR	Human Resources Department	\N	200000000.00	t	2025-10-08 03:20:41.293	2025-10-08 03:20:41.293	cmghf8gfy0000wsabtq67m6rw	\N	\N
cmghf8ggd0008wsab9lcr1gex	Finance	FIN	Finance and Accounting Department	\N	300000000.00	t	2025-10-08 03:20:41.293	2025-10-08 03:20:41.293	cmghf8gfy0000wsabtq67m6rw	\N	\N
cmghf8ggd0009wsabv6hpyn3p	Operations	OPS	Operations Department	\N	800000000.00	t	2025-10-08 03:20:41.293	2025-10-08 03:20:41.293	cmghf8gfy0000wsabtq67m6rw	\N	\N
cmghf8ggd000awsab0g36utgq	Marketing	MKT	Marketing Department	\N	400000000.00	t	2025-10-08 03:20:41.293	2025-10-08 03:20:41.293	cmghf8gfy0000wsabtq67m6rw	\N	\N
cmgzzkcuq000b12m5v70p4lmu	ACCOUNTING	ACT 	acounting departments update	\N	2000000000.00	t	2025-10-21 03:09:39.986	2025-10-24 07:05:00.843	cmghf8gfy0000wsabtq67m6rw	\N	\N
cmh4ibfdu00018ne7hl0uz9f0	Customer cleraance	CC	test	\N	3000000000.00	t	2025-10-24 07:05:40.77	2025-10-24 07:05:40.77	cmghf8gfy0000wsabtq67m6rw	\N	\N
\.


--
-- Data for Name: depreciation_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.depreciation_records (id, period, "depreciationAmount", "bookValueBefore", "bookValueAfter", "calculationDate", notes, "depreciationId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: disposal_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.disposal_records (id, "disposalType", "disposalDate", "disposalValue", reason, "approvalReference", notes, "assetId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: inventories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventories (id, "inventoryTag", quantity, "availableQty", condition, status, location, notes, "minStockLevel", "assetId", "departmentId", "custodianId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: inventory_loans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory_loans (id, "loanNumber", purpose, quantity, "loanDate", "expectedReturnDate", "actualReturnDate", status, condition, notes, "approvalNotes", "inventoryId", "borrowerId", "approvedById", "responsibleId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: license_renewals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.license_renewals (id, "renewalDate", "newExpiryDate", cost, notes, "licenseId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: locations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.locations (id, name, building, floor, room, address, description, "isActive", "createdAt", "updatedAt", capacity, city, code, "companyId", country, "managerId", "postalCode", state, type) FROM stdin;
cmghf8gq4000xwsab0715eevi	Server Room	Main Building	1st Floor	Server-01	\N	Main server room with cooling system	t	2025-10-08 03:20:41.644	2025-10-08 03:20:41.644	\N	\N	\N	cmghf8gfy0000wsabtq67m6rw	\N	\N	\N	\N	OFFICE
cmghf8gq4000ywsabe4cw9j24	IT Office	Main Building	2nd Floor	IT-201	\N	IT Department office space	t	2025-10-08 03:20:41.644	2025-10-08 03:20:41.644	\N	\N	\N	cmghf8gfy0000wsabtq67m6rw	\N	\N	\N	\N	OFFICE
cmghf8gq4000zwsabt89ifdgm	HR Office	Main Building	3rd Floor	HR-301	\N	Human Resources office	t	2025-10-08 03:20:41.644	2025-10-08 03:20:41.644	\N	\N	\N	cmghf8gfy0000wsabtq67m6rw	\N	\N	\N	\N	OFFICE
cmghf8gq40010wsabxdtq0kcz	Finance Office	Main Building	4th Floor	FIN-401	\N	Finance department office	t	2025-10-08 03:20:41.644	2025-10-08 03:20:41.644	\N	\N	\N	cmghf8gfy0000wsabtq67m6rw	\N	\N	\N	\N	OFFICE
cmghf8gq40011wsabe2clhh95	Meeting Room A	Main Building	5th Floor	MTG-A	\N	Large meeting room with projector	t	2025-10-08 03:20:41.644	2025-10-08 03:20:41.644	\N	\N	\N	cmghf8gfy0000wsabtq67m6rw	\N	\N	\N	\N	OFFICE
cmghf8gq40012wsab9dobf0dt	Warehouse	Storage Building	Ground Floor	WH-001	\N	Main storage warehouse	t	2025-10-08 03:20:41.644	2025-10-08 03:20:41.644	\N	\N	\N	cmghf8gfy0000wsabtq67m6rw	\N	\N	\N	\N	OFFICE
cmgzzih7i000912m5izlhn0ms	ruang IT update 2	 office tower 8	32	ruang IT update	gandaria office tower 8		t	2025-10-21 03:08:12.318	2025-10-24 07:08:36.976	\N		IT001	cmghf8gfy0000wsabtq67m6rw	Indonesia	\N			OFFICE
\.


--
-- Data for Name: maintenance_attachments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.maintenance_attachments (id, filename, "originalName", "mimeType", "fileSize", "filePath", description, "attachmentType", "maintenanceId", "uploadedById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: maintenance_contracts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.maintenance_contracts (id, "contractNumber", description, "startDate", "endDate", cost, terms, "isActive", "vendorId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: maintenance_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.maintenance_records (id, description, "scheduledDate", "completedDate", status, notes, "assetId", "technicianId", "vendorId", "createdAt", "updatedAt", "actualCost", "companyId", downtime, "estimatedCost", "maintenanceNumber", priority, "requestId", "startedDate", "supervisorId", title, "workDescription", "maintenanceType") FROM stdin;
\.


--
-- Data for Name: new_part_registrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.new_part_registrations (id, "registrationNumber", "serialNumber", "assetTag", status, "registeredDate", notes, "partId", "assetId", "registeredById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, title, message, type, "isRead", "userId", "createdAt", "updatedAt", "actionLabel", "actionUrl", "companyId", "expiresAt", metadata, priority, "relatedEntityId", "relatedEntityType") FROM stdin;
\.


--
-- Data for Name: part_replacements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.part_replacements (id, "replacementNumber", reason, status, "plannedDate", "completedDate", cost, notes, "oldPartId", "oldComponentId", "newPartId", "assetId", "performedById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: part_usages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.part_usages (id, quantity, "usageType", "usageDate", notes, "partId", "assetId", "componentId", "maintenanceId", "usedById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: positions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.positions (id, title, description, level, "isActive", "createdAt", "updatedAt", "companyId") FROM stdin;
cmh005akc0001ewrn9vjvquy5	MANAGER IT update 3	manager dev it	MANAGER	t	2025-10-21 03:25:56.796	2025-10-24 07:06:37.548	cmghf8gfy0000wsabtq67m6rw
cmh4iewm800048ne7uqpq6pu3	staff	test	STAFF	t	2025-10-24 07:08:23.072	2025-10-24 07:08:23.072	cmghf8gfy0000wsabtq67m6rw
\.


--
-- Data for Name: procurements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.procurements (id, "procurementNumber", quantity, "unitPrice", "totalCost", status, "orderedDate", "expectedDate", "receivedDate", "receivedQuantity", "invoiceNumber", notes, "partId", "vendorId", "orderedById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: request_attachments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.request_attachments (id, filename, "originalName", "mimeType", "fileSize", "filePath", description, "requestId", "uploadedById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: request_workflows; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.request_workflows (id, step, "stepOrder", status, comments, "processedDate", "requestId", "processedById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: software_assets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.software_assets (id, name, version, publisher, description, "softwareType", category, "systemRequirements", "installationPath", "isActive", "createdAt", "updatedAt", "companyId") FROM stdin;
cmh0dz79k0002tiaks2ihbxzb	ms office 2025	1		test	APPLICATION		\N	\N	t	2025-10-21 09:53:07.208	2025-10-21 09:53:07.208	cmghf8gfy0000wsabtq67m6rw
cmh0e9zf90007qte4bdnwqmw0	microfsoft office	1		1	APPLICATION		\N	\N	t	2025-10-21 10:01:30.261	2025-10-21 10:01:30.261	cmghf8gfy0000wsabtq67m6rw
cmh0e55gm0002qte4if0xfi2u	windows 11 pro	bheta		test update	APPLICATION		\N	\N	t	2025-10-21 09:57:44.806	2025-10-21 10:41:20.686	cmghf8gfy0000wsabtq67m6rw
\.


--
-- Data for Name: software_installations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.software_installations (id, "installationDate", "uninstallationDate", status, "installationPath", version, notes, "softwareAssetId", "licenseId", "assetId", "userId", "companyId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: software_licenses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.software_licenses (id, "licenseKey", "licenseType", status, "totalSeats", "usedSeats", "availableSeats", "purchaseDate", "expiryDate", "renewalDate", "purchaseCost", "renewalCost", notes, "isActive", "createdAt", "updatedAt", "softwareAssetId", "vendorId", "companyId") FROM stdin;
cmh0dz79o0004tiakk4l1dmb5	214243242	SUBSCRIPTION	ACTIVE	5	1	4	2025-10-21 00:00:00	2025-11-18 00:00:00	\N	1000000000.00	\N	\N	t	2025-10-21 09:53:07.212	2025-10-21 09:53:07.212	cmh0dz79k0002tiaks2ihbxzb	cmghf8gqb0014wsabzsk4drz0	cmghf8gfy0000wsabtq67m6rw
cmh0e55gq0004qte4jc4iqxom	124523422	SUBSCRIPTION	ACTIVE	3	0	3	2025-10-21 00:00:00	2025-11-20 00:00:00	\N	10000000.00	\N	\N	t	2025-10-21 09:57:44.811	2025-10-21 09:57:44.811	cmh0e55gm0002qte4if0xfi2u	cmghf8gqb0014wsabzsk4drz0	cmghf8gfy0000wsabtq67m6rw
cmh0e9zfe0009qte4r9fatrwh	32142342132142weew32	SUBSCRIPTION	ACTIVE	5	0	5	2025-10-05 00:00:00	2025-11-24 00:00:00	\N	20000.00	\N	\N	t	2025-10-21 10:01:30.266	2025-10-21 10:01:30.266	cmh0e9zf90007qte4bdnwqmw0	cmghf8gqb0014wsabzsk4drz0	cmghf8gfy0000wsabtq67m6rw
\.


--
-- Data for Name: spare_parts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.spare_parts (id, "partNumber", name, description, brand, model, category, "partType", status, "unitPrice", "stockLevel", "minStockLevel", "maxStockLevel", "reorderPoint", "storageLocation", specifications, "compatibleWith", notes, "isActive", "vendorId", "createdAt", "updatedAt", "companyId") FROM stdin;
cmh1p87pp000186cm5mwzrti8	SP-1761119749640	test	test	\N	\N	HARDWARE	COMPONENT	ACTIVE	200000.00	2	5	6	2	test	{"test": "test"}	\N	test	t	cmghf8gqb0014wsabzsk4drz0	2025-10-22 07:55:49.645	2025-10-22 07:55:49.645	cmghf8gfy0000wsabtq67m6rw
cmh1phdr0000386cmkhbddsnu	SP-1761120177365	test	test	\N	\N	CONSUMABLE	COMPONENT	ACTIVE	20000000.00	2	1	3	1	office	{"dah": "itu aja", "spek": "bagus", "harga": "murah"}	\N	test	t	cmghf8gqb0014wsabzsk4drz0	2025-10-22 08:02:57.372	2025-10-22 08:02:57.372	cmghf8gfy0000wsabtq67m6rw
cmh4igy3s00068ne7afkx8f5p	SP-1761289798308	test	test	\N	\N	HARDWARE	COMPONENT	ACTIVE	2000.00	2	1	100	3	20000	{"test": "test", "test 2": "test 2"}	\N	test	t	cmghf8gqb0014wsabzsk4drz0	2025-10-24 07:09:58.312	2025-10-24 07:09:58.312	cmghf8gfy0000wsabtq67m6rw
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_settings (id, key, value, description, "isActive", "createdAt", "updatedAt") FROM stdin;
cmghf8gg80001wsabzckxk6zg	SYSTEM_NAME	Asset Management System	Name of the asset management system	t	2025-10-08 03:20:41.288	2025-10-08 03:20:41.288
cmghf8gg80002wsablurdy4lc	DEFAULT_CURRENCY	IDR	Default currency for asset values	t	2025-10-08 03:20:41.288	2025-10-08 03:20:41.288
cmghf8gg80003wsabav75984r	ASSET_TAG_PREFIX	AST	Prefix for auto-generated asset tags	t	2025-10-08 03:20:41.288	2025-10-08 03:20:41.288
cmghf8gg80004wsabc0q9ylq8	MAINTENANCE_REMINDER_DAYS	7	Days before maintenance due to send reminder	t	2025-10-08 03:20:41.288	2025-10-08 03:20:41.288
cmghf8gg80005wsabf5wljxju	AUDIT_REMINDER_DAYS	3	Days before audit due to send reminder	t	2025-10-08 03:20:41.288	2025-10-08 03:20:41.288
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, username, password, "firstName", "lastName", phone, role, "isActive", "createdAt", "updatedAt", "departmentId", address, "companyId", "dateOfBirth", "emergencyContact", "emergencyPhone", "employeeNumber", "hireDate", "managerId", "positionId", "terminationDate") FROM stdin;
cmghf8go6000cwsabcad598pn	admin@company.com	admin	$2a$12$JbpXO4Wm0ZENem9eXo5g8O9flgfV.aos4lYQsF8QEbz6tfCntdh.K	System	Administrator	+62812345678901	ADMIN	t	2025-10-08 03:20:41.574	2025-10-08 03:20:41.574	\N	\N	cmghf8gfy0000wsabtq67m6rw	\N	\N	\N	EMP001	\N	\N	\N	\N
cmghf8goh000ewsabe8c3olu0	asset.admin@company.com	assetadmin	$2a$12$JbpXO4Wm0ZENem9eXo5g8O9flgfV.aos4lYQsF8QEbz6tfCntdh.K	Asset	Administrator	+62812345678902	ASSET_ADMIN	t	2025-10-08 03:20:41.585	2025-10-08 03:20:41.585	\N	\N	cmghf8gfy0000wsabtq67m6rw	\N	\N	\N	EMP002	\N	\N	\N	\N
cmghf8goo000gwsab9ssup0xe	ceo@company.com	ceo	$2a$12$JbpXO4Wm0ZENem9eXo5g8O9flgfV.aos4lYQsF8QEbz6tfCntdh.K	Chief	Executive	+62812345678903	TOP_MANAGEMENT	t	2025-10-08 03:20:41.592	2025-10-08 03:20:41.592	\N	\N	cmghf8gfy0000wsabtq67m6rw	\N	\N	\N	EMP003	\N	\N	\N	\N
cmghf8gou000iwsab22jspg0d	it.manager@company.com	itmanager	$2a$12$JbpXO4Wm0ZENem9eXo5g8O9flgfV.aos4lYQsF8QEbz6tfCntdh.K	IT	Manager	+62812345678904	MANAGER	t	2025-10-08 03:20:41.598	2025-10-08 03:20:41.598	cmghf8ggd0006wsaby418wq7k	\N	cmghf8gfy0000wsabtq67m6rw	\N	\N	\N	EMP004	\N	\N	\N	\N
cmghf8gp0000kwsab68noyrh7	hr.manager@company.com	hrmanager	$2a$12$JbpXO4Wm0ZENem9eXo5g8O9flgfV.aos4lYQsF8QEbz6tfCntdh.K	HR	Manager	+62812345678905	MANAGER	t	2025-10-08 03:20:41.604	2025-10-08 03:20:41.604	cmghf8ggd0007wsabkauoqckw	\N	cmghf8gfy0000wsabtq67m6rw	\N	\N	\N	EMP005	\N	\N	\N	\N
cmghf8gp7000mwsabz1b1jnh5	tech1@company.com	technician1	$2a$12$JbpXO4Wm0ZENem9eXo5g8O9flgfV.aos4lYQsF8QEbz6tfCntdh.K	John	Technician	+62812345678906	TECHNICIAN	t	2025-10-08 03:20:41.61	2025-10-08 03:20:41.61	cmghf8ggd0006wsaby418wq7k	\N	cmghf8gfy0000wsabtq67m6rw	\N	\N	\N	EMP006	\N	\N	\N	\N
cmghf8gpd000owsabfujdogxx	tech2@company.com	technician2	$2a$12$JbpXO4Wm0ZENem9eXo5g8O9flgfV.aos4lYQsF8QEbz6tfCntdh.K	Jane	Technician	+62812345678907	TECHNICIAN	t	2025-10-08 03:20:41.617	2025-10-08 03:20:41.617	cmghf8ggd0009wsabv6hpyn3p	\N	cmghf8gfy0000wsabtq67m6rw	\N	\N	\N	EMP007	\N	\N	\N	\N
cmghf8gpi000qwsab1zsxeer7	auditor@company.com	auditor	$2a$12$JbpXO4Wm0ZENem9eXo5g8O9flgfV.aos4lYQsF8QEbz6tfCntdh.K	Internal	Auditor	+62812345678908	AUDITOR	t	2025-10-08 03:20:41.622	2025-10-08 03:20:41.622	\N	\N	cmghf8gfy0000wsabtq67m6rw	\N	\N	\N	EMP008	\N	\N	\N	\N
cmghf8gpo000swsabj6yxa9le	it.user@company.com	ituser	$2a$12$JbpXO4Wm0ZENem9eXo5g8O9flgfV.aos4lYQsF8QEbz6tfCntdh.K	IT	User	+62812345678909	DEPARTMENT_USER	t	2025-10-08 03:20:41.628	2025-10-08 03:20:41.628	cmghf8ggd0006wsaby418wq7k	\N	cmghf8gfy0000wsabtq67m6rw	\N	\N	\N	EMP009	\N	\N	\N	\N
cmghf8gpt000uwsabf3m0ervd	hr.user@company.com	hruser	$2a$12$JbpXO4Wm0ZENem9eXo5g8O9flgfV.aos4lYQsF8QEbz6tfCntdh.K	HR	User	+62812345678910	DEPARTMENT_USER	t	2025-10-08 03:20:41.633	2025-10-08 03:20:41.633	cmghf8ggd0007wsabkauoqckw	\N	cmghf8gfy0000wsabtq67m6rw	\N	\N	\N	EMP010	\N	\N	\N	\N
cmghf8gpy000wwsabej35cicc	finance.user@company.com	finuser	$2a$12$JbpXO4Wm0ZENem9eXo5g8O9flgfV.aos4lYQsF8QEbz6tfCntdh.K	Finance	User	+62812345678911	DEPARTMENT_USER	t	2025-10-08 03:20:41.638	2025-10-08 03:20:41.638	cmghf8ggd0008wsab9lcr1gex	\N	cmghf8gfy0000wsabtq67m6rw	\N	\N	\N	EMP011	\N	\N	\N	\N
\.


--
-- Data for Name: vendors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vendors (id, name, code, email, phone, address, "contactPerson", "isActive", "createdAt", "updatedAt", "companyId") FROM stdin;
cmghf8gqb0013wsabs0fx2lbn	PT. Teknologi Maju	TM001	sales@tekmaju.com	+62215551234	Jl. Sudirman No. 123, Jakarta	Budi Santoso	t	2025-10-08 03:20:41.651	2025-10-08 03:20:41.651	cmghf8gfy0000wsabtq67m6rw
cmghf8gqb0014wsabzsk4drz0	CV. Komputer Sejahtera	KS001	info@kompsejahtera.com	+62215551235	Jl. Gatot Subroto No. 456, Jakarta	Siti Rahayu	t	2025-10-08 03:20:41.651	2025-10-08 03:20:41.651	cmghf8gfy0000wsabtq67m6rw
cmghf8gqb0015wsab3hzaef82	PT. Furniture Indonesia	FI001	sales@furnitureid.com	+62215551236	Jl. Asia Afrika No. 789, Bandung	Ahmad Wijaya	t	2025-10-08 03:20:41.651	2025-10-08 03:20:41.651	cmghf8gfy0000wsabtq67m6rw
cmghf8gqb0016wsabhg3tb2m5	PT. Elektronik Prima	EP001	sales@elektronikprima.com	+62215551237	Jl. Diponegoro No. 321, Surabaya	Dewi Lestari	t	2025-10-08 03:20:41.651	2025-10-08 03:20:41.651	cmghf8gfy0000wsabtq67m6rw
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: asset_attachments asset_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_attachments
    ADD CONSTRAINT asset_attachments_pkey PRIMARY KEY (id);


--
-- Name: asset_components asset_components_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_components
    ADD CONSTRAINT asset_components_pkey PRIMARY KEY (id);


--
-- Name: asset_depreciations asset_depreciations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_depreciations
    ADD CONSTRAINT asset_depreciations_pkey PRIMARY KEY (id);


--
-- Name: asset_requests asset_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_requests
    ADD CONSTRAINT asset_requests_pkey PRIMARY KEY (id);


--
-- Name: asset_required_software asset_required_software_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_required_software
    ADD CONSTRAINT asset_required_software_pkey PRIMARY KEY (id);


--
-- Name: asset_transfers asset_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_transfers
    ADD CONSTRAINT asset_transfers_pkey PRIMARY KEY (id);


--
-- Name: assets assets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_pkey PRIMARY KEY (id);


--
-- Name: audit_records audit_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_records
    ADD CONSTRAINT audit_records_pkey PRIMARY KEY (id);


--
-- Name: audit_trails audit_trails_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_trails
    ADD CONSTRAINT audit_trails_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: component_maintenance_records component_maintenance_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.component_maintenance_records
    ADD CONSTRAINT component_maintenance_records_pkey PRIMARY KEY (id);


--
-- Name: component_transfers component_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.component_transfers
    ADD CONSTRAINT component_transfers_pkey PRIMARY KEY (id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: depreciation_records depreciation_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.depreciation_records
    ADD CONSTRAINT depreciation_records_pkey PRIMARY KEY (id);


--
-- Name: disposal_records disposal_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.disposal_records
    ADD CONSTRAINT disposal_records_pkey PRIMARY KEY (id);


--
-- Name: inventories inventories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventories
    ADD CONSTRAINT inventories_pkey PRIMARY KEY (id);


--
-- Name: inventory_loans inventory_loans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_loans
    ADD CONSTRAINT inventory_loans_pkey PRIMARY KEY (id);


--
-- Name: license_renewals license_renewals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.license_renewals
    ADD CONSTRAINT license_renewals_pkey PRIMARY KEY (id);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: maintenance_attachments maintenance_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_attachments
    ADD CONSTRAINT maintenance_attachments_pkey PRIMARY KEY (id);


--
-- Name: maintenance_contracts maintenance_contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_contracts
    ADD CONSTRAINT maintenance_contracts_pkey PRIMARY KEY (id);


--
-- Name: maintenance_records maintenance_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_records
    ADD CONSTRAINT maintenance_records_pkey PRIMARY KEY (id);


--
-- Name: new_part_registrations new_part_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.new_part_registrations
    ADD CONSTRAINT new_part_registrations_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: part_replacements part_replacements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.part_replacements
    ADD CONSTRAINT part_replacements_pkey PRIMARY KEY (id);


--
-- Name: part_usages part_usages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.part_usages
    ADD CONSTRAINT part_usages_pkey PRIMARY KEY (id);


--
-- Name: positions positions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_pkey PRIMARY KEY (id);


--
-- Name: procurements procurements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.procurements
    ADD CONSTRAINT procurements_pkey PRIMARY KEY (id);


--
-- Name: request_attachments request_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.request_attachments
    ADD CONSTRAINT request_attachments_pkey PRIMARY KEY (id);


--
-- Name: request_workflows request_workflows_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.request_workflows
    ADD CONSTRAINT request_workflows_pkey PRIMARY KEY (id);


--
-- Name: software_assets software_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.software_assets
    ADD CONSTRAINT software_assets_pkey PRIMARY KEY (id);


--
-- Name: software_installations software_installations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.software_installations
    ADD CONSTRAINT software_installations_pkey PRIMARY KEY (id);


--
-- Name: software_licenses software_licenses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.software_licenses
    ADD CONSTRAINT software_licenses_pkey PRIMARY KEY (id);


--
-- Name: spare_parts spare_parts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.spare_parts
    ADD CONSTRAINT spare_parts_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vendors vendors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_pkey PRIMARY KEY (id);


--
-- Name: asset_depreciations_assetId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "asset_depreciations_assetId_key" ON public.asset_depreciations USING btree ("assetId");


--
-- Name: asset_requests_requestNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "asset_requests_requestNumber_key" ON public.asset_requests USING btree ("requestNumber");


--
-- Name: asset_required_software_assetId_softwareAssetId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "asset_required_software_assetId_softwareAssetId_key" ON public.asset_required_software USING btree ("assetId", "softwareAssetId");


--
-- Name: asset_transfers_transferNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "asset_transfers_transferNumber_key" ON public.asset_transfers USING btree ("transferNumber");


--
-- Name: assets_assetTag_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "assets_assetTag_key" ON public.assets USING btree ("assetTag");


--
-- Name: audit_trails_companyId_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "audit_trails_companyId_createdAt_idx" ON public.audit_trails USING btree ("companyId", "createdAt");


--
-- Name: audit_trails_entityType_entityId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "audit_trails_entityType_entityId_idx" ON public.audit_trails USING btree ("entityType", "entityId");


--
-- Name: audit_trails_userId_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "audit_trails_userId_createdAt_idx" ON public.audit_trails USING btree ("userId", "createdAt");


--
-- Name: categories_companyId_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "categories_companyId_code_key" ON public.categories USING btree ("companyId", code);


--
-- Name: companies_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX companies_code_key ON public.companies USING btree (code);


--
-- Name: companies_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX companies_name_key ON public.companies USING btree (name);


--
-- Name: component_transfers_transferNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "component_transfers_transferNumber_key" ON public.component_transfers USING btree ("transferNumber");


--
-- Name: departments_companyId_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "departments_companyId_code_key" ON public.departments USING btree ("companyId", code);


--
-- Name: disposal_records_assetId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "disposal_records_assetId_key" ON public.disposal_records USING btree ("assetId");


--
-- Name: inventories_inventoryTag_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "inventories_inventoryTag_key" ON public.inventories USING btree ("inventoryTag");


--
-- Name: inventory_loans_loanNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "inventory_loans_loanNumber_key" ON public.inventory_loans USING btree ("loanNumber");


--
-- Name: locations_companyId_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "locations_companyId_code_key" ON public.locations USING btree ("companyId", code);


--
-- Name: locations_companyId_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "locations_companyId_name_key" ON public.locations USING btree ("companyId", name);


--
-- Name: maintenance_contracts_contractNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "maintenance_contracts_contractNumber_key" ON public.maintenance_contracts USING btree ("contractNumber");


--
-- Name: maintenance_records_maintenanceNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "maintenance_records_maintenanceNumber_key" ON public.maintenance_records USING btree ("maintenanceNumber");


--
-- Name: new_part_registrations_registrationNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "new_part_registrations_registrationNumber_key" ON public.new_part_registrations USING btree ("registrationNumber");


--
-- Name: notifications_companyId_type_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "notifications_companyId_type_createdAt_idx" ON public.notifications USING btree ("companyId", type, "createdAt");


--
-- Name: notifications_userId_isRead_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "notifications_userId_isRead_createdAt_idx" ON public.notifications USING btree ("userId", "isRead", "createdAt");


--
-- Name: part_replacements_replacementNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "part_replacements_replacementNumber_key" ON public.part_replacements USING btree ("replacementNumber");


--
-- Name: procurements_procurementNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "procurements_procurementNumber_key" ON public.procurements USING btree ("procurementNumber");


--
-- Name: spare_parts_companyId_category_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "spare_parts_companyId_category_idx" ON public.spare_parts USING btree ("companyId", category);


--
-- Name: spare_parts_companyId_partNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "spare_parts_companyId_partNumber_key" ON public.spare_parts USING btree ("companyId", "partNumber");


--
-- Name: system_settings_key_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX system_settings_key_key ON public.system_settings USING btree (key);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_employeeNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "users_employeeNumber_key" ON public.users USING btree ("employeeNumber");


--
-- Name: users_username_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);


--
-- Name: vendors_companyId_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "vendors_companyId_code_key" ON public.vendors USING btree ("companyId", code);


--
-- Name: asset_attachments asset_attachments_assetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_attachments
    ADD CONSTRAINT "asset_attachments_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES public.assets(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: asset_attachments asset_attachments_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_attachments
    ADD CONSTRAINT "asset_attachments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: asset_attachments asset_attachments_uploadedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_attachments
    ADD CONSTRAINT "asset_attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: asset_components asset_components_assetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_components
    ADD CONSTRAINT "asset_components_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES public.assets(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: asset_components asset_components_parentAssetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_components
    ADD CONSTRAINT "asset_components_parentAssetId_fkey" FOREIGN KEY ("parentAssetId") REFERENCES public.assets(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: asset_components asset_components_sourcePartId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_components
    ADD CONSTRAINT "asset_components_sourcePartId_fkey" FOREIGN KEY ("sourcePartId") REFERENCES public.spare_parts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: asset_depreciations asset_depreciations_assetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_depreciations
    ADD CONSTRAINT "asset_depreciations_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES public.assets(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: asset_requests asset_requests_approvedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_requests
    ADD CONSTRAINT "asset_requests_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: asset_requests asset_requests_assetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_requests
    ADD CONSTRAINT "asset_requests_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES public.assets(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: asset_requests asset_requests_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_requests
    ADD CONSTRAINT "asset_requests_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: asset_requests asset_requests_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_requests
    ADD CONSTRAINT "asset_requests_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: asset_requests asset_requests_requesterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_requests
    ADD CONSTRAINT "asset_requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: asset_required_software asset_required_software_assetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_required_software
    ADD CONSTRAINT "asset_required_software_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES public.assets(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: asset_required_software asset_required_software_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_required_software
    ADD CONSTRAINT "asset_required_software_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: asset_required_software asset_required_software_softwareAssetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_required_software
    ADD CONSTRAINT "asset_required_software_softwareAssetId_fkey" FOREIGN KEY ("softwareAssetId") REFERENCES public.software_assets(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: asset_transfers asset_transfers_approvedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_transfers
    ADD CONSTRAINT "asset_transfers_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: asset_transfers asset_transfers_assetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_transfers
    ADD CONSTRAINT "asset_transfers_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES public.assets(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: asset_transfers asset_transfers_fromDepartmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_transfers
    ADD CONSTRAINT "asset_transfers_fromDepartmentId_fkey" FOREIGN KEY ("fromDepartmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: asset_transfers asset_transfers_fromLocationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_transfers
    ADD CONSTRAINT "asset_transfers_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES public.locations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: asset_transfers asset_transfers_fromUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_transfers
    ADD CONSTRAINT "asset_transfers_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: asset_transfers asset_transfers_requestedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_transfers
    ADD CONSTRAINT "asset_transfers_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: asset_transfers asset_transfers_toDepartmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_transfers
    ADD CONSTRAINT "asset_transfers_toDepartmentId_fkey" FOREIGN KEY ("toDepartmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: asset_transfers asset_transfers_toLocationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_transfers
    ADD CONSTRAINT "asset_transfers_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES public.locations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: asset_transfers asset_transfers_toUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_transfers
    ADD CONSTRAINT "asset_transfers_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: assets assets_assignedToId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT "assets_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: assets assets_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT "assets_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: assets assets_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT "assets_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: assets assets_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT "assets_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: assets assets_locationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT "assets_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES public.locations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: assets assets_vendorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT "assets_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES public.vendors(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: audit_records audit_records_assetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_records
    ADD CONSTRAINT "audit_records_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES public.assets(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: audit_records audit_records_auditorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_records
    ADD CONSTRAINT "audit_records_auditorId_fkey" FOREIGN KEY ("auditorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: audit_trails audit_trails_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_trails
    ADD CONSTRAINT "audit_trails_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: audit_trails audit_trails_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_trails
    ADD CONSTRAINT "audit_trails_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: categories categories_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "categories_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: categories categories_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: component_maintenance_records component_maintenance_records_componentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.component_maintenance_records
    ADD CONSTRAINT "component_maintenance_records_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES public.asset_components(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: component_maintenance_records component_maintenance_records_performedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.component_maintenance_records
    ADD CONSTRAINT "component_maintenance_records_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: component_transfers component_transfers_componentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.component_transfers
    ADD CONSTRAINT "component_transfers_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES public.asset_components(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: component_transfers component_transfers_fromAssetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.component_transfers
    ADD CONSTRAINT "component_transfers_fromAssetId_fkey" FOREIGN KEY ("fromAssetId") REFERENCES public.assets(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: component_transfers component_transfers_toAssetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.component_transfers
    ADD CONSTRAINT "component_transfers_toAssetId_fkey" FOREIGN KEY ("toAssetId") REFERENCES public.assets(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: component_transfers component_transfers_transferredById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.component_transfers
    ADD CONSTRAINT "component_transfers_transferredById_fkey" FOREIGN KEY ("transferredById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: departments departments_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT "departments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: departments departments_managerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT "departments_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: departments departments_parentDepartmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT "departments_parentDepartmentId_fkey" FOREIGN KEY ("parentDepartmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: depreciation_records depreciation_records_depreciationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.depreciation_records
    ADD CONSTRAINT "depreciation_records_depreciationId_fkey" FOREIGN KEY ("depreciationId") REFERENCES public.asset_depreciations(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: disposal_records disposal_records_assetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.disposal_records
    ADD CONSTRAINT "disposal_records_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES public.assets(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: inventories inventories_assetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventories
    ADD CONSTRAINT "inventories_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES public.assets(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: inventories inventories_custodianId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventories
    ADD CONSTRAINT "inventories_custodianId_fkey" FOREIGN KEY ("custodianId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: inventories inventories_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventories
    ADD CONSTRAINT "inventories_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: inventory_loans inventory_loans_approvedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_loans
    ADD CONSTRAINT "inventory_loans_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: inventory_loans inventory_loans_borrowerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_loans
    ADD CONSTRAINT "inventory_loans_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: inventory_loans inventory_loans_inventoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_loans
    ADD CONSTRAINT "inventory_loans_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES public.inventories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: inventory_loans inventory_loans_responsibleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_loans
    ADD CONSTRAINT "inventory_loans_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: license_renewals license_renewals_licenseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.license_renewals
    ADD CONSTRAINT "license_renewals_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES public.software_licenses(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: locations locations_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT "locations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: locations locations_managerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT "locations_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: maintenance_attachments maintenance_attachments_maintenanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_attachments
    ADD CONSTRAINT "maintenance_attachments_maintenanceId_fkey" FOREIGN KEY ("maintenanceId") REFERENCES public.maintenance_records(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: maintenance_attachments maintenance_attachments_uploadedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_attachments
    ADD CONSTRAINT "maintenance_attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: maintenance_contracts maintenance_contracts_vendorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_contracts
    ADD CONSTRAINT "maintenance_contracts_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES public.vendors(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: maintenance_records maintenance_records_assetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_records
    ADD CONSTRAINT "maintenance_records_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES public.assets(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: maintenance_records maintenance_records_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_records
    ADD CONSTRAINT "maintenance_records_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: maintenance_records maintenance_records_requestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_records
    ADD CONSTRAINT "maintenance_records_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES public.asset_requests(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: maintenance_records maintenance_records_supervisorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_records
    ADD CONSTRAINT "maintenance_records_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: maintenance_records maintenance_records_technicianId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_records
    ADD CONSTRAINT "maintenance_records_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: maintenance_records maintenance_records_vendorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_records
    ADD CONSTRAINT "maintenance_records_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES public.vendors(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: new_part_registrations new_part_registrations_assetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.new_part_registrations
    ADD CONSTRAINT "new_part_registrations_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES public.assets(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: new_part_registrations new_part_registrations_partId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.new_part_registrations
    ADD CONSTRAINT "new_part_registrations_partId_fkey" FOREIGN KEY ("partId") REFERENCES public.spare_parts(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: new_part_registrations new_part_registrations_registeredById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.new_part_registrations
    ADD CONSTRAINT "new_part_registrations_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: notifications notifications_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: notifications notifications_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: part_replacements part_replacements_assetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.part_replacements
    ADD CONSTRAINT "part_replacements_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES public.assets(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: part_replacements part_replacements_newPartId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.part_replacements
    ADD CONSTRAINT "part_replacements_newPartId_fkey" FOREIGN KEY ("newPartId") REFERENCES public.spare_parts(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: part_replacements part_replacements_oldComponentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.part_replacements
    ADD CONSTRAINT "part_replacements_oldComponentId_fkey" FOREIGN KEY ("oldComponentId") REFERENCES public.asset_components(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: part_replacements part_replacements_oldPartId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.part_replacements
    ADD CONSTRAINT "part_replacements_oldPartId_fkey" FOREIGN KEY ("oldPartId") REFERENCES public.spare_parts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: part_replacements part_replacements_performedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.part_replacements
    ADD CONSTRAINT "part_replacements_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: part_usages part_usages_assetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.part_usages
    ADD CONSTRAINT "part_usages_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES public.assets(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: part_usages part_usages_componentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.part_usages
    ADD CONSTRAINT "part_usages_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES public.asset_components(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: part_usages part_usages_maintenanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.part_usages
    ADD CONSTRAINT "part_usages_maintenanceId_fkey" FOREIGN KEY ("maintenanceId") REFERENCES public.maintenance_records(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: part_usages part_usages_partId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.part_usages
    ADD CONSTRAINT "part_usages_partId_fkey" FOREIGN KEY ("partId") REFERENCES public.spare_parts(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: part_usages part_usages_usedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.part_usages
    ADD CONSTRAINT "part_usages_usedById_fkey" FOREIGN KEY ("usedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: positions positions_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT "positions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: procurements procurements_orderedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.procurements
    ADD CONSTRAINT "procurements_orderedById_fkey" FOREIGN KEY ("orderedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: procurements procurements_partId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.procurements
    ADD CONSTRAINT "procurements_partId_fkey" FOREIGN KEY ("partId") REFERENCES public.spare_parts(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: procurements procurements_vendorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.procurements
    ADD CONSTRAINT "procurements_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES public.vendors(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: request_attachments request_attachments_requestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.request_attachments
    ADD CONSTRAINT "request_attachments_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES public.asset_requests(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: request_attachments request_attachments_uploadedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.request_attachments
    ADD CONSTRAINT "request_attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: request_workflows request_workflows_processedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.request_workflows
    ADD CONSTRAINT "request_workflows_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: request_workflows request_workflows_requestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.request_workflows
    ADD CONSTRAINT "request_workflows_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES public.asset_requests(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: software_assets software_assets_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.software_assets
    ADD CONSTRAINT "software_assets_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: software_installations software_installations_assetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.software_installations
    ADD CONSTRAINT "software_installations_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES public.assets(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: software_installations software_installations_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.software_installations
    ADD CONSTRAINT "software_installations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: software_installations software_installations_licenseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.software_installations
    ADD CONSTRAINT "software_installations_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES public.software_licenses(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: software_installations software_installations_softwareAssetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.software_installations
    ADD CONSTRAINT "software_installations_softwareAssetId_fkey" FOREIGN KEY ("softwareAssetId") REFERENCES public.software_assets(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: software_installations software_installations_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.software_installations
    ADD CONSTRAINT "software_installations_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: software_licenses software_licenses_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.software_licenses
    ADD CONSTRAINT "software_licenses_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: software_licenses software_licenses_softwareAssetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.software_licenses
    ADD CONSTRAINT "software_licenses_softwareAssetId_fkey" FOREIGN KEY ("softwareAssetId") REFERENCES public.software_assets(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: software_licenses software_licenses_vendorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.software_licenses
    ADD CONSTRAINT "software_licenses_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES public.vendors(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: spare_parts spare_parts_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.spare_parts
    ADD CONSTRAINT "spare_parts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: spare_parts spare_parts_vendorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.spare_parts
    ADD CONSTRAINT "spare_parts_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES public.vendors(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: users users_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: users users_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: users users_managerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: users users_positionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES public.positions(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: vendors vendors_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT "vendors_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

