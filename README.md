# Management Assets System - Dokumentasi Lengkap
## Sistem Manajemen Aset Enterprise Multi-Company

## Overview
Sistem manajemen aset enterprise yang lengkap dengan dukungan multi-company, dilengkapi dengan backend Node.js/Express/Prisma dan frontend Next.js/Zustand/Tailwind CSS. Sistem ini mendukung manajemen aset fisik dan software untuk berbagai perusahaan dengan fitur lengkap untuk berbagai role pengguna.

## 🏢 Fitur Utama Sistem

### 1. **Multi-Company Support**
- **Pengelolaan Multi Perusahaan**: Satu sistem untuk mengelola aset dari berbagai perusahaan
- **Data Isolation**: Data perusahaan terisolasi dengan aman
- **Company-specific Configuration**: Konfigurasi khusus per perusahaan
- **Consolidated Reporting**: Laporan terpusat atau per perusahaan

### 2. **Master Data Management**
#### Employee & Organization Structure
- **Employee Management**: Data lengkap karyawan dengan hierarki manajerial
- **Position/Job Title**: Manajemen posisi dan level jabatan
- **Department Hierarchy**: Struktur departemen bertingkat
- **Manager-Subordinate Relationship**: Relasi atasan-bawahan

#### Asset Master Data
- **Asset Categories**: Kategori aset dengan hierarki
- **Locations**: Lokasi aset dengan detail building, floor, room
- **Vendors**: Manajemen supplier dan vendor
- **Asset Specifications**: Spesifikasi teknis detail

### 3. **Asset Lifecycle Management**
#### Physical Asset Management
- **Asset Registration**: Pendaftaran aset dengan QR Code
- **Asset Assignment**: Penugasan aset ke user tertentu di department dan company tertentu
- **Asset Tracking**: Pelacakan real-time dengan QR scanning
- **Status Management**: AVAILABLE → IN_USE → MAINTENANCE → RETIRED → DISPOSED
- **Transfer Management**: Transfer antar user, department, atau location

#### Software Asset Management 🆕
- **Software Catalog**: Katalog software dengan version control
- **License Management**: Manajemen lisensi software (Perpetual, Subscription, dll)
- **Installation Tracking**: Pelacakan instalasi software per asset/user
- **License Compliance**: Monitor kepatuhan lisensi dan seat usage
- **Renewal Management**: Manajemen perpanjangan lisensi

### 4. **Asset Decomposition & Component Management**
- **Asset Breakdown**: Pemecahan aset menjadi komponen-komponen
- **Component Tracking**: Pelacakan komponen individual
- **Component Transfer**: Transfer komponen antar aset
- **Component Maintenance**: Maintenance khusus komponen
- **Reusable Components**: Komponen yang dapat digunakan ulang

### 5. **Maintenance & Service Management**
#### Maintenance Types
- **Preventive Maintenance**: Perawatan terjadwal
- **Corrective Maintenance**: Perbaikan reaktif
- **Emergency Maintenance**: Perawatan darurat

#### Service Features
- **Maintenance Scheduling**: Penjadwalan perawatan
- **Technician Assignment**: Penugasan teknisi
- **Spare Parts Management**: Manajemen suku cadang
- **Cost Tracking**: Pelacakan biaya perawatan
- **Maintenance Contracts**: Kontrak perawatan dengan vendor

### 6. **Inventory & Assignment Management**
#### Department-based Inventory
- **Inventory Assignment**: Aset di-assign ke department tertentu
- **Department Custodian**: Penanggung jawab inventory per department
- **Inventory Loan System**: Sistem peminjaman inventory
- **Stock Management**: Manajemen stok dengan min/max levels

#### Specialized Assignments
- **IT Department**: Laptop, server, network equipment
- **GA Department**: Kendaraan, furniture, office equipment
- **Production Department**: Machinery, tools, production equipment

### 7. **Request & Approval Workflow**
- **Asset Request**: Permintaan aset dengan justifikasi
- **Approval Hierarchy**: Alur persetujuan bertingkat
- **Request Tracking**: Pelacakan status permintaan
- **Automated Notifications**: Notifikasi otomatis
- **Priority Management**: Manajemen prioritas permintaan

### 8. **Financial Management**
- **Purchase Tracking**: Pelacakan pembelian aset
- **Depreciation Calculation**: Perhitungan depresiasi otomatis
- **Asset Valuation**: Penilaian aset berkala
- **Budget Management**: Manajemen budget per department
- **Cost Center Allocation**: Alokasi ke cost center

### 9. **Audit & Compliance**
- **Physical Audit**: Audit fisik aset
- **Financial Audit**: Audit keuangan
- **Compliance Checking**: Pemeriksaan kepatuhan
- **Audit Trail**: Jejak audit untuk semua aktivitas
- **Scheduled Audits**: Audit terjadwal

### 10. **Advanced Features**
#### QR Code & Scanning
- **QR Code Generation**: Generate QR code untuk setiap aset
- **Mobile Scanning**: Scan QR untuk asset tracking
- **Asset Verification**: Verifikasi aset dengan scan
- **Location Tracking**: Pelacakan lokasi dengan scan

#### Reporting & Analytics
- **Executive Dashboard**: Dashboard untuk manajemen tingkat atas
- **Utilization Reports**: Laporan utilisasi aset
- **Maintenance Analysis**: Analisis perawatan
- **Financial Reports**: Laporan keuangan aset
- **Compliance Reports**: Laporan kepatuhan

## 🗃️ Database Schema yang Disempurnakan

### Core Entities

#### Multi-Company Structure
```prisma
model Company {
  id                String   @id @default(cuid())
  name              String   @unique
  code              String   @unique
  address           String?
  phone             String?
  email             String?
  website           String?
  logo              String?
  taxNumber         String?
  registrationNumber String?
  // Relations to all entities
  users             User[]
  departments       Department[]
  assets            Asset[]
  softwareAssets    SoftwareAsset[]
}
```

#### Enhanced User Management
```prisma
model User {
  id              String   @id @default(cuid())
  employeeNumber  String   @unique
  email           String   @unique
  firstName       String
  lastName        String
  phone           String?
  dateOfBirth     DateTime?
  hireDate        DateTime?
  role            UserRole
  
  // Multi-company & hierarchy
  companyId       String
  departmentId    String?
  positionId      String?
  managerId       String?  // Direct manager
  
  // Relations
  manager         User?    @relation("ManagerSubordinate")
  subordinates    User[]   @relation("ManagerSubordinate")
}
```

#### Advanced Asset Management
```prisma
model Asset {
  id              String      @id @default(cuid())
  assetTag        String      @unique
  name            String
  serialNumber    String?
  qrCode          String?
  status          AssetStatus
  
  // Multi-company support
  companyId       String
  company         Company     @relation(fields: [companyId])
  
  // Assignment tracking
  assignedToId    String?
  assignedTo      User?       @relation("AssignedTo")
  
  // Components & Software
  components      AssetComponent[]
  softwareInstallations SoftwareInstallation[]
}
```

#### Software Asset Management
```prisma
model SoftwareAsset {
  id              String        @id @default(cuid())
  name            String
  version         String?
  publisher       String?
  softwareType    SoftwareType  // OS, APPLICATION, UTILITY, etc
  
  licenses        SoftwareLicense[]
  installations   SoftwareInstallation[]
}

model SoftwareLicense {
  id              String        @id @default(cuid())
  licenseType     LicenseType   // PERPETUAL, SUBSCRIPTION, etc
  totalSeats      Int
  usedSeats       Int
  expiryDate      DateTime?
  purchaseCost    Decimal?
}
```

## 👥 User Roles & Access Control

### Role Hierarchy
- **ADMIN**: Akses penuh ke seluruh sistem dan semua perusahaan
- **ASSET_ADMIN**: Mengelola aset, kategori, lokasi, vendor untuk perusahaan tertentu
- **MANAGER**: Melihat laporan, mengelola departemen, approve requests
- **DEPARTMENT_USER**: Request aset, melihat aset departemen sendiri
- **TECHNICIAN**: Mengelola maintenance, spare parts, asset breakdown
- **AUDITOR**: Melakukan audit aset, akses read-only ke data audit
- **TOP_MANAGEMENT**: Dashboard eksekutif, laporan tingkat tinggi

### Access Control Matrix
| Feature | ADMIN | ASSET_ADMIN | MANAGER | DEPT_USER | TECHNICIAN | AUDITOR | TOP_MGMT |
|---------|-------|-------------|---------|-----------|------------|---------|----------|
| Multi-company Access | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Asset CRUD | ✅ | ✅ | ❌ | ❌ | ❌ | 👁️ | 👁️ |
| Asset Assignment | ✅ | ✅ | ✅ | ❌ | ❌ | 👁️ | 👁️ |
| Request Approval | ✅ | ✅ | ✅ | ❌ | ❌ | 👁️ | 👁️ |
| Maintenance | ✅ | ✅ | 👁️ | ❌ | ✅ | 👁️ | 👁️ |
| Software License | ✅ | ✅ | 👁️ | ❌ | ❌ | 👁️ | 👁️ |
| Reports | ✅ | ✅ | ✅ | 👁️ | 👁️ | ✅ | ✅ |

*Legend: ✅ Full Access, 👁️ Read Only, ❌ No Access*

## 🔄 Business Process Flows

### 1. Asset Assignment Flow
```mermaid
graph TD
    A[Asset Request] --> B[Manager Approval]
    B --> C{Approved?}
    C -->|Yes| D[Asset Assignment]
    C -->|No| E[Request Rejected]
    D --> F[Asset Status: IN_USE]
    D --> G[Generate QR Code]
    D --> H[Notification to User]
    F --> I[Start Depreciation]
    G --> J[Asset Tracking Ready]
```

### 2. Maintenance Workflow
```mermaid
graph TD
    A[Maintenance Due] --> B[Schedule Maintenance]
    B --> C[Assign Technician]
    C --> D[Asset Status: MAINTENANCE]
    D --> E[Technician Work]
    E --> F{Spare Parts Needed?}
    F -->|Yes| G[Order Spare Parts]
    F -->|No| H[Complete Work]
    G --> I[Update Inventory]
    I --> H
    H --> J[Asset Status: AVAILABLE]
    J --> K[Update Maintenance Log]
```

### 3. Asset Breakdown Flow
```mermaid
graph TD
    A[Asset Breakdown Request] --> B[Technical Assessment]
    B --> C[Component Identification]
    C --> D[Create Component Records]
    D --> E[Update Parent Asset Status]
    E --> F[Component Assignment]
    F --> G[Generate Component QR Codes]
    G --> H[Update Inventory]
```

## 🏗️ Architecture & Implementation

### Technology Stack

### Backend Technologies
- **Node.js** - Runtime environment
- **Express.js** - Web framework with middleware
- **Prisma ORM** - Database ORM dengan PostgreSQL
- **JWT** - Authentication & authorization
- **bcrypt** - Password hashing & security
- **Joi** - Request data validation
- **multer** - File upload handling
- **QR Code Generator** - QR code generation for assets
- **helmet** - Security middleware
- **express-rate-limit** - API rate limiting

### Frontend Technologies
- **Next.js 14** - React framework dengan TypeScript
- **Zustand** - State management dengan persistence
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client dengan interceptors
- **React Hook Form** - Form handling & validation
- **Zod** - Runtime schema validation
- **Lucide React** - Icon library
- **QR Scanner** - QR code scanning capabilities
- **Chart.js/Recharts** - Data visualization
- **date-fns** - Date manipulation utilities

## Struktur Database & Models

### User Roles
- **ADMIN**: Akses penuh ke seluruh sistem
- **ASSET_ADMIN**: Mengelola aset, kategori, lokasi, vendor
- **MANAGER**: Melihat laporan, mengelola departemen
- **EMPLOYEE**: Request aset, melihat aset yang dimiliki
- **TECHNICIAN**: Mengelola maintenance
- **AUDITOR**: Melakukan audit aset
- **TOP_MANAGEMENT**: Melihat laporan eksekutif

### Database Schema
```prisma
model User {
  id           Int      @id @default(autoincrement())
  username     String   @unique
  email        String   @unique
  password     String
  fullName     String
  role         Role     @default(EMPLOYEE)
  departmentId Int?
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  department   Department? @relation(fields: [departmentId], references: [id])
  assets       Asset[]
  requests     Request[]
  maintenances Maintenance[]
  notifications Notification[]
  auditTrails  AuditTrail[]
}

model Department {
  id          Int      @id @default(autoincrement())
  name        String   @unique
  description String?
  budget      Decimal  @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  users       User[]
  assets      Asset[]
}

model Category {
  id          Int      @id @default(autoincrement())
  name        String   @unique
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  assets      Asset[]
}

model Location {
  id          Int      @id @default(autoincrement())
  name        String
  address     String
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  assets      Asset[]
}

model Vendor {
  id            Int      @id @default(autoincrement())
  name          String
  contactPerson String
  phone         String
  email         String
  address       String
  description   String?
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  assets        Asset[]
}

model Asset {
  id              Int      @id @default(autoincrement())
  assetCode       String   @unique
  name            String
  description     String?
  categoryId      Int
  locationId      Int
  departmentId    Int?
  vendorId        Int?
  assignedUserId  Int?
  purchasePrice   Decimal  @default(0)
  currentValue    Decimal  @default(0)
  purchaseDate    DateTime
  warrantyEnd     DateTime?
  status          AssetStatus @default(AVAILABLE)
  condition       AssetCondition @default(GOOD)
  serialNumber    String?
  imageUrl        String?
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  category        Category     @relation(fields: [categoryId], references: [id])
  location        Location     @relation(fields: [locationId], references: [id])
  department      Department?  @relation(fields: [departmentId], references: [id])
  vendor          Vendor?      @relation(fields: [vendorId], references: [id])
  assignedUser    User?        @relation(fields: [assignedUserId], references: [id])
  requests        Request[]
  maintenances    Maintenance[]
  auditTrails     AuditTrail[]
}

model Request {
  id          Int           @id @default(autoincrement())
  assetId     Int?
  requesterId Int
  type        RequestType
  priority    Priority      @default(MEDIUM)
  status      RequestStatus @default(PENDING)
  title       String
  description String
  justification String?
  approvedBy  Int?
  approvedAt  DateTime?
  rejectedReason String?
  completedAt DateTime?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  
  asset       Asset?       @relation(fields: [assetId], references: [id])
  requester   User         @relation(fields: [requesterId], references: [id])
}

model Maintenance {
  id              Int               @id @default(autoincrement())
  assetId         Int
  technicianId    Int
  type            MaintenanceType
  priority        Priority          @default(MEDIUM)
  status          MaintenanceStatus @default(SCHEDULED)
  title           String
  description     String
  scheduledDate   DateTime
  completedDate   DateTime?
  cost            Decimal           @default(0)
  notes           String?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  
  asset           Asset            @relation(fields: [assetId], references: [id])
  technician      User             @relation(fields: [technicianId], references: [id])
}

model Notification {
  id        Int              @id @default(autoincrement())
  userId    Int
  title     String
  message   String
  type      NotificationType
  priority  Priority         @default(MEDIUM)
  isRead    Boolean          @default(false)
  data      Json?
  createdAt DateTime         @default(now())
  
  user      User             @relation(fields: [userId], references: [id])
}

model AuditTrail {
  id        Int      @id @default(autoincrement())
  userId    Int
  assetId   Int?
  action    String
  entity    String
  entityId  Int
  oldValues Json?
  newValues Json?
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id])
  asset     Asset?   @relation(fields: [assetId], references: [id])
}
```

## 🌐 API Endpoints

### Authentication & Company Selection
- `POST /api/auth/login` - User login dengan company selection
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user dengan company context
- `POST /api/auth/switch-company` - Switch between companies (ADMIN only)
- `POST /api/auth/refresh` - Refresh token

### Company Management
- `GET /api/companies` - Get accessible companies
- `GET /api/companies/:id` - Get company details
- `POST /api/companies` - Create company (ADMIN only)
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company (ADMIN only)

### Employee & Organization Management
- `GET /api/users` - Get users dalam company context
- `GET /api/users/:id` - Get user dengan hierarchy info
- `POST /api/users` - Create employee
- `PUT /api/users/:id` - Update employee
- `GET /api/users/:id/subordinates` - Get team members
- `GET /api/positions` - Get job positions
- `POST /api/positions` - Create position

### Multi-Company Asset Management
- `GET /api/assets` - Get assets dengan company filtering
- `GET /api/assets/:id` - Get asset detail dengan full context
- `POST /api/assets` - Create asset dalam company context
- `PUT /api/assets/:id` - Update asset
- `POST /api/assets/:id/assign` - Assign ke user dalam company/department
- `POST /api/assets/:id/transfer` - Transfer antar user/department/location
- `GET /api/assets/:id/qr-code` - Generate/get QR code
- `POST /api/assets/scan` - Scan QR code untuk asset info
- `GET /api/assets/:id/history` - Get asset assignment history

### Asset Breakdown & Components
- `POST /api/assets/:id/breakdown` - Break down asset ke components
- `GET /api/assets/:id/components` - Get asset components
- `POST /api/components/:id/transfer` - Transfer component antar assets
- `GET /api/components/:id/history` - Component transfer history
- `PUT /api/components/:id` - Update component info
- `POST /api/components/:id/maintenance` - Log component maintenance

### Software Asset Management 🆕
- `GET /api/software-assets` - Get software catalog
- `POST /api/software-assets` - Add software to catalog
- `PUT /api/software-assets/:id` - Update software info
- `GET /api/software-licenses` - Get license inventory
- `POST /api/software-licenses` - Purchase/register license
- `PUT /api/software-licenses/:id` - Update license
- `GET /api/software-licenses/:id/usage` - Get license utilization
- `POST /api/software-installations` - Install software
- `DELETE /api/software-installations/:id` - Uninstall software
- `GET /api/assets/:id/software` - Get installed software on asset
- `GET /api/users/:id/software` - Get user's software assignments
- `GET /api/software-compliance` - License compliance report

### Enhanced Maintenance Management
- `GET /api/maintenance` - Get maintenance records dengan filtering
- `POST /api/maintenance` - Schedule maintenance
- `PUT /api/maintenance/:id` - Update maintenance
- `POST /api/maintenance/:id/complete` - Complete maintenance dengan parts usage
- `GET /api/maintenance/schedule` - Maintenance schedule calendar
- `GET /api/maintenance/contracts` - Vendor contracts
- `POST /api/maintenance/contracts` - Create maintenance contract

### Spare Parts & Procurement
- `GET /api/spare-parts` - Get spare parts inventory
- `POST /api/spare-parts` - Add spare part
- `PUT /api/spare-parts/:id` - Update spare part
- `POST /api/spare-parts/procurement` - Order spare parts
- `GET /api/spare-parts/usage/:assetId` - Get parts usage untuk asset
- `POST /api/spare-parts/usage` - Record parts usage
- `GET /api/spare-parts/low-stock` - Get low stock alert

### Inventory & Department Assignment
- `GET /api/inventory` - Get inventory dengan department filtering
- `POST /api/inventory/assign` - Assign asset to department inventory
- `GET /api/inventory/:id/loans` - Get loan history
- `POST /api/inventory/loan` - Loan inventory item
- `PUT /api/inventory/loan/:id/return` - Return loaned item
- `GET /api/departments/:id/inventory` - Get department inventory

### Request & Approval Workflow
- `GET /api/requests` - Get requests dengan role-based filtering
- `POST /api/requests` - Create request
- `PUT /api/requests/:id/approve` - Approve request
- `PUT /api/requests/:id/reject` - Reject request dengan reason
- `GET /api/requests/pending` - Get pending approvals untuk manager
- `GET /api/requests/:id/workflow` - Get approval workflow status

### Advanced Reporting & Analytics
- `GET /api/reports/asset-utilization` - Asset utilization analysis
- `GET /api/reports/maintenance-cost` - Maintenance cost analysis
- `GET /api/reports/software-compliance` - Software license compliance
- `GET /api/reports/depreciation` - Depreciation reports
- `GET /api/reports/inventory-by-department` - Department inventory breakdown
- `GET /api/reports/executive-dashboard` - Executive summary
- `GET /api/reports/audit-trail` - Comprehensive audit trail

### Audit & Compliance
- `GET /api/audit` - Get audit records
- `POST /api/audit/schedule` - Schedule audit
- `PUT /api/audit/:id/complete` - Complete audit dengan findings
- `GET /api/audit/compliance` - Compliance status report
- `GET /api/audit/trail` - Detailed audit trail

### QR Code & Asset Tracking
- `POST /api/qr/generate/:assetId` - Generate QR code
- `POST /api/qr/scan` - Scan QR code dan get asset info
- `GET /api/tracking/:assetId` - Get asset tracking history
- `POST /api/tracking/location-update` - Update asset location via scan

## 🎨 Frontend Architecture & Enhanced Pages

### Multi-Company Dashboard Structure
- **Company Selection** (`/company-selector`) - Company switching interface untuk ADMIN
- **Executive Dashboard** (`/dashboard`) - Cross-company overview untuk TOP_MANAGEMENT  
- **Company Dashboard** (`/dashboard/company`) - Company-specific dashboard dengan KPIs

### Employee & Organization Management
- **Employee Directory** (`/employees`) - Enhanced user management dengan:
  - Employee hierarchy visualization
  - Manager-subordinate relationships
  - Multi-company employee view (ADMIN)
  - Department-wise employee filtering
- **Organization Chart** (`/organization`) - Interactive org chart dengan drag-and-drop
- **Position Management** (`/positions`) - Job positions dan career levels
- **Department Structure** (`/departments`) - Hierarchical department management

### Enhanced Asset Management Pages
- **Asset Catalog** (`/assets`) - Multi-company asset management dengan:
  - Advanced filtering (company, department, status, assignment)
  - Bulk operations (assign, transfer, maintenance)
  - QR code batch generation
  - Asset timeline dan history
- **Asset Details** (`/assets/[id]`) - Comprehensive asset view dengan:
  - Component breakdown visualization
  - Software installation list
  - Complete assignment history
  - Maintenance timeline
  - Financial tracking (purchase, depreciation)
  - QR code display dan printing
- **Asset Assignment Wizard** (`/assets/assign`) - Step-by-step assignment process
- **Asset Transfer Center** (`/assets/transfer`) - Bulk transfer management
- **Component Manager** (`/assets/[id]/components`) - Asset breakdown interface

### Software Asset Management 🆕
- **Software Catalog** (`/software`) - Software asset inventory dengan:
  - Publisher and version tracking
  - System compatibility matrix
  - Installation statistics
- **License Dashboard** (`/software/licenses`) - License management dengan:
  - Real-time seat utilization
  - Expiry date monitoring
  - Renewal cost forecasting
  - Compliance score dashboard
- **Installation Manager** (`/software/installations`) - Software deployment tracking
- **Compliance Monitor** (`/software/compliance`) - License compliance dashboard dengan:
  - Over-deployment alerts
  - Under-utilization analysis
  - Cost optimization recommendations

### Advanced Maintenance Management
- **Maintenance Control Center** (`/maintenance`) - Centralized maintenance management
- **Interactive Scheduler** (`/maintenance/schedule`) - Calendar-based scheduling dengan:
  - Drag-and-drop appointment management
  - Resource conflict detection
  - Automatic technician assignment
- **Technician Workbench** (`/maintenance/technician`) - Role-specific interface untuk technicians
- **Preventive Maintenance** (`/maintenance/preventive`) - Automated scheduling rules
- **Spare Parts Warehouse** (`/maintenance/parts`) - Inventory management dengan:
  - Low stock alerts
  - Automatic reorder points
  - Usage analytics

### Department Inventory Management
- **Department Overview** (`/inventory`) - Department-wise asset allocation
- **Inventory Assignment** (`/inventory/assign`) - Asset-to-department workflows
- **Loan Management** (`/inventory/loans`) - Inter-department loan system
- **Custodian Dashboard** (`/inventory/custody`) - Custodian responsibilities

### Request & Approval Workflows
- **Request Center** (`/requests`) - Unified request management dengan:
  - Role-based view filtering
  - Priority-based sorting
  - Status tracking timeline
- **Approval Dashboard** (`/requests/approve`) - Manager approval interface
- **Request Analytics** (`/requests/analytics`) - Request pattern analysis

### Advanced Reporting & Analytics
- **Executive Reports** (`/reports/executive`) - C-level dashboard dengan:
  - Asset portfolio overview
  - ROI analysis
  - Risk assessment metrics
- **Operational Reports** (`/reports/operations`) - Day-to-day operational metrics
- **Financial Analytics** (`/reports/financial`) - Cost analysis dan budgeting
- **Compliance Reports** (`/reports/compliance`) - Regulatory compliance tracking
- **Custom Report Builder** (`/reports/builder`) - Drag-and-drop report creation

### Mobile-Optimized Interfaces
- **QR Scanner App** (`/mobile/scanner`) - Native QR scanning dengan:
  - Bulk scanning mode
  - Offline capability
  - Location tagging
- **Field Maintenance** (`/mobile/maintenance`) - Mobile maintenance logging
- **Quick Asset Lookup** (`/mobile/search`) - Fast asset search dan info

## 🏪 Enhanced State Management Architecture

### Core Multi-Company Stores

```typescript
// Company Context Store
interface CompanyStore {
  currentCompany: Company | null;
  availableCompanies: Company[];
  isMultiCompanyUser: boolean;
  
  switchCompany: (companyId: string) => Promise<void>;
  getCompanyPermissions: () => Permission[];
  canAccessCompany: (companyId: string) => boolean;
}

// Enhanced Authentication Store
interface AuthStore {
  user: User | null;
  company: Company | null;
  permissions: Permission[];
  hierarchy: ManagerialHierarchy;
  
  login: (credentials: LoginData) => Promise<void>;
  switchCompany: (companyId: string) => Promise<void>;
  hasPermission: (permission: string, scope?: 'company' | 'department') => boolean;
  getSubordinates: () => User[];
}

// Advanced Asset Store
interface AssetStore {
  assets: Asset[];
  selectedAssets: string[];
  assetFilters: AssetFilters;
  assetComponents: Map<string, AssetComponent[]>;
  
  // Multi-company operations
  fetchAssetsByCompany: (companyId: string) => Promise<void>;
  bulkAssignAssets: (assetIds: string[], userId: string) => Promise<void>;
  transferAssets: (transferData: BulkTransferData) => Promise<void>;
  
  // Component management
  breakdownAsset: (assetId: string, components: ComponentSpec[]) => Promise<void>;
  transferComponent: (componentId: string, targetAssetId: string) => Promise<void>;
  
  // QR Code integration
  generateQRCodes: (assetIds: string[]) => Promise<QRCodeData[]>;
  scanAsset: (qrData: string) => Promise<AssetScanResult>;
}

// Software Asset Store
interface SoftwareStore {
  softwareAssets: SoftwareAsset[];
  licenses: SoftwareLicense[];
  installations: SoftwareInstallation[];
  complianceStatus: ComplianceData;
  
  // License management
  purchaseLicense: (licenseData: LicensePurchaseData) => Promise<void>;
  renewLicense: (licenseId: string, renewalData: RenewalData) => Promise<void>;
  checkCompliance: (companyId?: string) => Promise<ComplianceReport>;
  
  // Installation management
  deploySoftware: (deploymentData: DeploymentData) => Promise<void>;
  uninstallSoftware: (installationId: string) => Promise<void>;
  trackUsage: (installationId: string) => Promise<UsageData>;
}
```

### Specialized Workflow Stores

```typescript
// Enhanced Request Store
interface RequestStore {
  requests: AssetRequest[];
  pendingApprovals: AssetRequest[];
  requestWorkflow: WorkflowStep[];
  approvalHierarchy: ApprovalHierarchy;
  
  createRequest: (requestData: RequestData) => Promise<void>;
  processApproval: (requestId: string, decision: ApprovalDecision) => Promise<void>;
  escalateRequest: (requestId: string) => Promise<void>;
  trackRequestStatus: (requestId: string) => Promise<RequestStatus>;
}

// Inventory & Department Store
interface InventoryStore {
  departmentInventories: DepartmentInventory[];
  loanTransactions: InventoryLoan[];
  stockLevels: StockLevel[];
  custodianAssignments: CustodianAssignment[];
  
  assignAssetToDepartment: (assignmentData: DepartmentAssignmentData) => Promise<void>;
  initiateLoan: (loanData: LoanInitiationData) => Promise<void>;
  processReturn: (loanId: string, returnData: ReturnData) => Promise<void>;
  updateStockLevels: (updates: StockUpdate[]) => Promise<void>;
}

// Advanced Maintenance Store
interface MaintenanceStore {
  maintenanceSchedule: MaintenanceSchedule[];
  technicians: TechnicianProfile[];
  spareParts: SparePart[];
  maintenanceContracts: MaintenanceContract[];
  
  // Scheduling
  schedulePreventiveMaintenance: (scheduleData: PreventiveScheduleData) => Promise<void>;
  assignTechnician: (maintenanceId: string, technicianId: string) => Promise<void>;
  
  // Parts management
  orderSpareParts: (orderData: PartsOrderData) => Promise<void>;
  recordPartsUsage: (usageData: PartsUsageData) => Promise<void>;
  trackPartInventory: () => Promise<PartInventoryStatus[]>;
}
```

## 🎛️ Advanced UI Component Library

### Specialized Asset Components

```typescript
// Multi-Company Asset Table dengan advanced features
<AssetDataGrid
  companyId={currentCompany?.id}
  columns={customColumns}
  filters={advancedFilters}
  bulkActions={[
    { id: 'assign', label: 'Bulk Assign', icon: UserPlus },
    { id: 'transfer', label: 'Bulk Transfer', icon: Move },
    { id: 'maintenance', label: 'Schedule Maintenance', icon: Tool }
  ]}
  onBulkAction={handleBulkAction}
  virtualScrolling={true}
  exportOptions={['PDF', 'Excel', 'CSV']}
/>

// Asset Assignment Workflow Component
<AssetAssignmentWorkflow
  assets={selectedAssets}
  steps={[
    { id: 'user-selection', component: UserSelector },
    { id: 'department-assignment', component: DepartmentSelector },
    { id: 'location-setup', component: LocationSelector },
    { id: 'confirmation', component: AssignmentConfirmation }
  ]}
  onComplete={handleAssignmentComplete}
  validationRules={assignmentValidationRules}
/>

// Component Breakdown Interface
<AssetComponentManager
  asset={selectedAsset}
  components={assetComponents}
  onBreakdown={handleAssetBreakdown}
  onComponentTransfer={handleComponentTransfer}
  onComponentMaintenance={handleComponentMaintenance}
  componentSpecs={availableComponentSpecs}
/>
```

### Software Management Components

```typescript
// License Compliance Dashboard
<LicenseComplianceDashboard
  licenses={licenses}
  installations={installations}
  complianceMetrics={complianceData}
  alerts={complianceAlerts}
  onRenewal={handleLicenseRenewal}
  onOptimization={handleLicenseOptimization}
/>

// Software Deployment Manager
<SoftwareDeploymentManager
  software={availableSoftware}
  targetAssets={selectedAssets}
  deploymentPolicies={deploymentPolicies}
  onDeploy={handleSoftwareDeployment}
  onUninstall={handleSoftwareRemoval}
  batchMode={true}
/>

// License Utilization Analytics
<LicenseUtilizationChart
  data={utilizationData}
  timeRange={selectedTimeRange}
  showPredictions={true}
  costOptimizationSuggestions={true}
  onExport={handleChartExport}
/>
```

### Maintenance Management Components

```typescript
// Interactive Maintenance Scheduler
<MaintenanceScheduler
  events={maintenanceSchedule}
  technicians={availableTechnicians}
  assets={maintenanceAssets}
  onSchedule={handleMaintenanceScheduling}
  onReschedule={handleRescheduling}
  conflictDetection={true}
  autoAssignment={true}
  calendarView={['month', 'week', 'day']}
/>

// Spare Parts Inventory Manager
<SparePartsInventoryManager
  parts={spareParts}
  lowStockAlerts={lowStockParts}
  reorderPoints={reorderSettings}
  onOrder={handlePartsOrder}
  onUsage={handlePartsUsage}
  inventoryOptimization={true}
/>

// Technician Workbench
<TechnicianWorkbench
  assignedTasks={technicianTasks}
  availableTools={tools}
  spareParts={availableParts}
  onTaskComplete={handleTaskCompletion}
  onPartsRequest={handlePartsRequest}
  mobileOptimized={true}
/>
```

## 📱 Mobile & Progressive Web App Features

### QR Code Integration
- **Native Camera Integration**: Access device camera untuk QR scanning
- **Bulk QR Operations**: Scan multiple assets dalam satu session  
- **Offline QR Data**: Cache asset data untuk offline QR lookup
- **QR Code Printing**: Generate printable QR labels dengan asset info

### Mobile-First Features
- **Touch-Optimized Interface**: Gesture-based navigation
- **Voice Commands**: Voice input untuk hands-free operation
- **GPS Integration**: Location tracking untuk asset movements
- **Push Notifications**: Real-time alerts dan reminders

### PWA Capabilities
- **Offline Functionality**: Critical features available offline
- **Background Sync**: Sync data when connection restored
- **Install Prompts**: Native app-like installation
- **Caching Strategy**: Intelligent content caching

## 🚀 Implementation Strategy & Roadmap

### Multi-Company Dashboard
- **Executive Dashboard** (`/dashboard`) - Overview semua companies (ADMIN/TOP_MGMT)
- **Company Dashboard** (`/dashboard/company/:id`) - Dashboard per company
- **Department Dashboard** (`/dashboard/department/:id`) - Dashboard per department

### Enhanced Asset Management
- **Assets Page** (`/assets`) - Asset list dengan multi-company filtering
  - QR Code generation dan scanning
  - Asset assignment dengan user/department selection
  - Asset breakdown ke components
  - Software installation tracking
- **Asset Detail** (`/assets/:id`) - Comprehensive asset detail
  - Assignment history
  - Component breakdown
  - Maintenance history
  - Software installations
  - Transfer history
  - QR code display

### Employee & Organization Management 🆕
- **Employees Page** (`/employees`) - Employee management dengan hierarchy
  - Employee directory dengan org chart
  - Manager-subordinate relationships
  - Position and department assignments
  - Employee asset assignments
- **Organization Chart** (`/organization`) - Visual hierarchy chart
- **Positions Page** (`/positions`) - Job title dan level management

### Software Asset Management 🆕
- **Software Catalog** (`/software`) - Software asset catalog
  - Software library dengan versions
  - Installation tracking
  - License management
- **License Management** (`/software/licenses`) - Software license tracking
  - License utilization dashboard
  - Expiry notifications
  - Compliance monitoring
  - Renewal management
- **Software Installations** (`/software/installations`) - Installation tracking
  - Per-user software assignments
  - Per-asset software installations
  - Installation/uninstallation logs

### Component & Breakdown Management 🆕
- **Asset Components** (`/components`) - Component tracking
  - Component inventory
  - Transfer history
  - Maintenance records
## 🚀 Implementation Strategy & Roadmap

### Phase 1: Multi-Company Foundation (3-4 weeks)
#### Database Layer
1. **Schema Migration**: Implement multi-company database schema
   - Add company_id to all relevant tables
   - Create Company and Position models
   - Update relationships dan constraints
2. **Data Migration**: Migrate existing data ke multi-company structure
3. **Database Indexing**: Optimize queries dengan company-based indexing

#### Backend API Enhancement
1. **Authentication System**: Company context dalam JWT tokens
2. **Middleware Updates**: Company isolation middleware
3. **API Endpoints**: Update existing endpoints untuk multi-company support
4. **Security**: Implement row-level security policies

#### Frontend Foundation
1. **Company Context**: React context untuk company management
2. **Authentication Flow**: Company selection dalam login process
3. **Navigation Updates**: Company-aware navigation system
4. **State Management**: Update Zustand stores untuk multi-company

### Phase 2: Enhanced Asset Management (4-5 weeks)
#### Asset Lifecycle Enhancement
1. **QR Code System**: 
   - QR code generation untuk all assets
   - QR scanning interface (web dan mobile)
   - Asset lookup via QR scanning
2. **Asset Assignment Workflow**:
   - Multi-step assignment process
   - Approval workflows
   - Assignment history tracking
3. **Asset Transfer System**:
   - Inter-department transfers
   - Location change tracking
   - Transfer approval process

#### Component Breakdown System
1. **Asset Decomposition**:
   - Break down assets into reusable components
   - Component specification management
   - Component transfer workflows
2. **Component Tracking**:
   - Individual component lifecycle
   - Component maintenance records
   - Component reassignment

### Phase 3: Software Asset Management (3-4 weeks)
#### Software Catalog & Licensing
1. **Software Asset Registry**:
   - Software catalog dengan version control
   - Publisher dan compatibility information
   - Software categorization
2. **License Management**:
   - License type handling (Perpetual, Subscription, etc.)
   - Seat management dan allocation
   - Renewal tracking dan alerts
3. **Compliance Monitoring**:
   - License utilization tracking
   - Over-deployment detection
   - Cost optimization recommendations

#### Installation Management
1. **Software Deployment**:
   - Installation tracking per asset/user
   - Deployment automation
   - Installation verification
2. **License Compliance**:
   - Real-time compliance monitoring
   - Audit trail untuk software usage
   - Compliance reporting

### Phase 4: Advanced Features (5-6 weeks)
#### Maintenance System Enhancement
1. **Preventive Maintenance**:
   - Automated scheduling based on usage/time
   - Maintenance calendar integration
   - Technician workload management
2. **Spare Parts Management**:
   - Inventory management dengan reorder points
   - Parts usage tracking
   - Procurement workflow
3. **Maintenance Analytics**:
   - MTTR (Mean Time to Repair) analysis
   - Cost analysis dan optimization
   - Predictive maintenance insights

#### Advanced Reporting & Analytics
1. **Executive Dashboard**:
   - Multi-company KPI dashboard
   - Asset portfolio analysis
   - Financial performance metrics
2. **Custom Reports**:
   - Report builder interface
   - Scheduled reports
   - Export capabilities (PDF, Excel, CSV)
3. **Analytics Engine**:
   - Asset utilization analysis
   - Cost optimization insights
   - Risk assessment metrics

### Phase 5: Mobile & Integration (3-4 weeks)
#### Mobile Application
1. **Progressive Web App**:
   - Mobile-optimized interface
   - Offline capabilities
   - Push notifications
2. **QR Code Mobile App**:
   - Native camera integration
   - Bulk scanning capabilities
   - GPS location tagging

#### System Integration
1. **API Documentation**: Comprehensive API documentation
2. **Third-party Integration**: ERP/CRM system integration points
3. **Data Import/Export**: Bulk data management tools

### Phase 6: Optimization & Launch (2-3 weeks)
#### Performance Optimization
1. **Database Optimization**: Query optimization dan indexing
2. **Frontend Performance**: Code splitting dan lazy loading
3. **Caching Strategy**: Redis implementation untuk performance

#### Security & Compliance
1. **Security Audit**: Comprehensive security review
2. **Data Privacy**: GDPR compliance features
3. **Audit Trail**: Complete activity logging

## 📋 Best Practices & Development Guidelines

### Database Design Patterns

#### Multi-Tenancy Implementation
```sql
-- Row-Level Security (RLS) untuk data isolation
CREATE POLICY company_isolation_policy ON assets 
FOR ALL TO application_user 
USING (company_id = current_setting('app.current_company_id')::UUID);

-- Compound indexes untuk multi-tenant queries
CREATE INDEX CONCURRENTLY idx_assets_company_status_dept 
ON assets(company_id, status, department_id);

-- Partial indexes untuk common filters
CREATE INDEX CONCURRENTLY idx_assets_active_in_use 
ON assets(company_id, assigned_to_id) 
WHERE status = 'IN_USE' AND is_active = true;
```

#### Data Integrity Constraints
```sql
-- Ensure company consistency across related tables
ALTER TABLE assets ADD CONSTRAINT fk_asset_company_department
CHECK (
  (department_id IS NULL) OR 
  (company_id = (SELECT company_id FROM departments WHERE id = department_id))
);

-- Prevent cross-company assignments
ALTER TABLE assets ADD CONSTRAINT fk_asset_company_user
CHECK (
  (assigned_to_id IS NULL) OR
  (company_id = (SELECT company_id FROM users WHERE id = assigned_to_id))
);
```

### API Design Standards

#### Company Context Middleware
```typescript
// Company context injection
export const companyContext = async (req: Request, res: Response, next: NextFunction) => {
  const companyId = req.headers['x-company-id'] || req.user?.company_id;
  
  if (!companyId) {
    return res.status(400).json({ error: 'Company context required' });
  }
  
  // Verify user access to company
  const hasAccess = await verifyCompanyAccess(req.user.id, companyId);
  if (!hasAccess && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied to company' });
  }
  
  req.company = await getCompanyById(companyId);
  next();
};

// Usage in routes
router.get('/assets', authenticate, companyContext, getAssets);
```

#### Standardized Response Format
```typescript
// API response wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    pagination?: PaginationInfo;
    filters?: FilterInfo;
    company?: CompanyInfo;
  };
}

// Consistent error handling
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  const response: ApiResponse<null> = {
    success: false,
    error: err.message,
    meta: {
      company: req.company ? { id: req.company.id, name: req.company.name } : undefined
    }
  };
  
  res.status(500).json(response);
};
```

### Frontend Architecture Patterns

#### Company-Aware Components
```typescript
// Higher-order component untuk company context
export const withCompanyContext = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return (props: P) => {
    const { currentCompany, permissions } = useCompanyStore();
    
    if (!currentCompany) {
      return <CompanySelector />;
    }
    
    return (
      <CompanyProvider value={{ currentCompany, permissions }}>
        <Component {...props} />
      </CompanyProvider>
    );
  };
};

// Usage
export default withCompanyContext(AssetManagementPage);
```

#### Multi-Company Data Fetching
```typescript
// Custom hook untuk multi-company data
export const useCompanyAssets = (filters?: AssetFilters) => {
  const { currentCompany } = useCompanyStore();
  
  return useSWR(
    currentCompany ? [`/api/assets`, currentCompany.id, filters] : null,
    ([url, companyId, filters]) => 
      apiClient.get(url, { 
        headers: { 'X-Company-ID': companyId },
        params: filters 
      }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000
    }
  );
};
```

### Security Implementation

#### Role-Based Access Control
```typescript
// Permission system
export const permissions = {
  ASSET_READ: 'asset:read',
  ASSET_WRITE: 'asset:write', 
  ASSET_DELETE: 'asset:delete',
  ASSET_ASSIGN: 'asset:assign',
  COMPANY_SWITCH: 'company:switch',
  MULTI_COMPANY_VIEW: 'company:multi_view'
} as const;

// Permission checking
export const hasPermission = (
  userRole: UserRole, 
  permission: string, 
  context?: 'company' | 'department'
): boolean => {
  const rolePermissions = getRolePermissions(userRole, context);
  return rolePermissions.includes(permission);
};

// Frontend permission guard
export const PermissionGuard: React.FC<{
  permission: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}> = ({ permission, fallback, children }) => {
  const { user, permissions } = useAuth();
  
  if (!permissions.includes(permission)) {
    return <>{fallback || <AccessDenied />}</>;
  }
  
  return <>{children}</>;
};
```

#### Data Validation Schemas
```typescript
// Zod schemas untuk validation
export const assetCreateSchema = z.object({
  name: z.string().min(1).max(255),
  companyId: z.string().uuid(),
  categoryId: z.string().uuid(),
  serialNumber: z.string().optional(),
  purchasePrice: z.number().positive().optional(),
  specifications: z.record(z.any()).optional()
}).refine((data) => {
  // Custom validation: ensure company access
  return validateCompanyAccess(data.companyId);
});

// Server-side validation middleware
export const validateSchema = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      res.status(400).json({ 
        success: false, 
        error: 'Validation failed',
        details: error.errors 
      });
    }
  };
};
```

### Performance Optimization

#### Database Query Optimization
```typescript
// Efficient multi-company queries dengan proper indexing
export const getCompanyAssets = async (
  companyId: string, 
  filters: AssetFilters,
  pagination: PaginationOptions
) => {
  return await prisma.asset.findMany({
    where: {
      company_id: companyId,
      ...(filters.status && { status: filters.status }),
      ...(filters.department_id && { department_id: filters.department_id }),
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { asset_tag: { contains: filters.search, mode: 'insensitive' } },
          { serial_number: { contains: filters.search, mode: 'insensitive' } }
        ]
      })
    },
    include: {
      category: true,
      department: true,
      assigned_to: {
        select: { id: true, first_name: true, last_name: true }
      },
      _count: {
        select: { components: true, software_installations: true }
      }
    },
    orderBy: { created_at: 'desc' },
    skip: pagination.skip,
    take: pagination.take
  });
};
```

#### Frontend Performance Optimization
```typescript
// Virtualized tables untuk large datasets
import { FixedSizeList as List } from 'react-window';

export const VirtualizedAssetTable: React.FC<{
  assets: Asset[];
  onRowClick: (asset: Asset) => void;
}> = ({ assets, onRowClick }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style} onClick={() => onRowClick(assets[index])}>
      <AssetRow asset={assets[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={assets.length}
      itemSize={60}
    >
      {Row}
    </List>
  );
};

// Memoized components untuk expensive operations
export const AssetCard = React.memo<{ asset: Asset }>(({ asset }) => {
  const calculations = useMemo(() => ({
    totalValue: calculateAssetValue(asset),
    depreciationRate: calculateDepreciation(asset),
    utilizationScore: calculateUtilization(asset)
  }), [asset.id, asset.purchase_price, asset.created_at]);

  return (
    <Card>
      <AssetInfo asset={asset} calculations={calculations} />
    </Card>
  );
});
```

## 🎯 Success Metrics & KPIs

### Business Metrics
- **Asset Utilization Rate**: % of assets in active use
- **Maintenance Cost Reduction**: Cost savings dari preventive maintenance
- **Request Processing Time**: Average time untuk asset request approval
- **Compliance Score**: Software license compliance percentage
- **Asset Recovery Rate**: Value recovered from disposed assets

### Technical Metrics  
- **System Response Time**: < 200ms untuk kritical operations
- **Database Query Performance**: < 50ms untuk standard queries
- **Mobile App Performance**: < 3s initial load time
- **System Uptime**: 99.9% availability target
- **Data Accuracy**: < 0.1% data inconsistency rate

### User Experience Metrics
- **User Adoption Rate**: % of target users actively using system
- **Feature Usage**: Most/least used features analysis
- **User Satisfaction Score**: Regular user feedback surveys
- **Support Ticket Volume**: Reduction in support requests
- **Training Completion Rate**: User onboarding success

Dengan implementasi roadmap dan best practices ini, sistem Asset Management akan menjadi solusi enterprise yang robust, scalable, dan user-friendly untuk mengelola aset multi-company dengan fitur-fitur advanced yang sesuai dengan kebutuhan bisnis modern.
  - Break down assets ke components
  - Component assignment
  - Reusable component tracking

### Enhanced Maintenance Management
- **Maintenance Page** (`/maintenance`) - Comprehensive maintenance management
  - Maintenance calendar
  - Technician assignments
  - Spare parts usage
  - Cost tracking
  - Vendor contracts
- **Maintenance Contracts** (`/maintenance/contracts`) - Contract management
- **Spare Parts** (`/maintenance/spare-parts`) - Inventory management
  - Stock levels
  - Procurement orders
  - Usage tracking
  - Low stock alerts

### Inventory & Department Assignment
- **Inventory Management** (`/inventory`) - Department-based inventory
  - Department allocation
  - Custodian assignments
  - Loan management
  - Stock tracking
- **Department Inventory** (`/departments/:id/inventory`) - Per-department view
- **Inventory Loans** (`/inventory/loans`) - Loan tracking system

### Enhanced Request Management
- **Request Center** (`/requests`) - Centralized request management
  - Request creation dengan justification
  - Approval workflow tracking
  - Priority management
  - Status notifications
- **Approval Center** (`/requests/approvals`) - Manager approval interface
- **Request Analytics** (`/requests/analytics`) - Request pattern analysis

### QR Code & Asset Tracking 🆕
- **QR Scanner** (`/scanner`) - Mobile-friendly QR scanning
  - Asset identification
  - Location updates
  - Quick asset info
- **Asset Tracking** (`/tracking`) - Real-time asset location tracking
  - Movement history
  - Current locations
  - Assignment tracking

### Advanced Reporting & Analytics
- **Executive Reports** (`/reports/executive`) - High-level dashboards
  - Asset utilization across companies
  - Financial summaries
  - Performance metrics
- **Operational Reports** (`/reports/operational`) - Detailed operational reports
  - Maintenance cost analysis
  - Software compliance
  - Department utilization
- **Compliance Reports** (`/reports/compliance`) - Audit dan compliance
  - License compliance
  - Asset audit results
  - Regulatory compliance

### User & Access Management
- **Users Page** (`/users`) - Enhanced user management
  - Multi-company user assignments
  - Role-based access control
  - Employee hierarchy management
- **Departments Page** (`/departments`) - Department structure
  - Hierarchical department management
  - Budget allocations
  - Manager assignments

### System Administration
- **System Settings** (`/settings`) - System configuration
  - Company settings
  - Global configurations
  - Email templates
- **Audit Trail** (`/audit`) - Comprehensive audit logging
  - User activity tracking
  - Data change logs
  - Security events

## State Management (Zustand Stores)

### AuthStore
- User authentication state
- Login/logout functionality
- User profile management

### AssetStore
- Asset list and CRUD operations
- Asset filtering and search
- Asset assignment management

### RequestStore
- Request list and management
- Approval/rejection workflow
- Request status tracking

### NotificationStore
- Notification list
- Read/unread status
- Real-time updates

### CategoryStore, LocationStore, VendorStore, DepartmentStore
- CRUD operations untuk masing-masing entitas
- Loading states dan error handling

## UI Components

### Shared Components
- **Button** - Reusable button dengan variants
- **Input** - Form input dengan validation
- **Select** - Dropdown select component
- **Card** - Container component
- **Badge** - Status badges dengan color variants
- **Modal** - Modal dialog component
- **Table** - Data table dengan sorting dan pagination
- **DashboardLayout** - Shared layout dengan navigation

### Features
- **Responsive Design** - Mobile-first approach
- **Dark/Light Theme** - Theme switching capability
- **Loading States** - Loading indicators
- **Error Handling** - Error boundaries dan toast notifications
- **Form Validation** - Client-side validation dengan Zod
- **Search & Filtering** - Real-time search dan advanced filters
- **Role-based Access** - UI elements berdasarkan user role

## Setup & Installation

### Backend Setup
1. Navigate ke folder backend
2. Install dependencies: `npm install`
3. Setup database PostgreSQL
4. Copy `.env.example` ke `.env` dan konfigurasi database
5. Run Prisma migration: `npx prisma migrate dev`
6. Seed database: `npx prisma db seed`
7. Start server: `npm run dev`

### Frontend Setup
1. Navigate ke folder frontend
2. Install dependencies: `npm install`
3. Copy `.env.local.example` ke `.env.local` dan konfigurasi API URL
4. Start development server: `npm run dev`

### Environment Variables

#### Backend (.env)
```
NODE_ENV=development
PORT=5000
DATABASE_URL="postgresql://username:password@localhost:5432/management_assets"
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
UPLOAD_PATH=uploads
```

#### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_UPLOAD_URL=http://localhost:5000/uploads
```

## Fitur Utama

### 1. Multi-Role Access Control
- Sistem role-based dengan 7 jenis role
- Dynamic navigation berdasarkan role
- Protected routes dan API endpoints

### 2. Asset Lifecycle Management
- Asset registration dan tracking
- Assignment/unassignment
- Status dan condition monitoring
- Warranty tracking

### 3. Request Workflow
- Asset request dengan approval process
- Priority levels (LOW, MEDIUM, HIGH)
- Request type (PURCHASE, ASSIGNMENT, RETURN, REPAIR)
- Automated notifications

### 4. Maintenance Management
- Preventive dan corrective maintenance
- Scheduling dan tracking
- Cost management
- Technician assignment

### 5. Audit & Compliance
- Scheduled audits
- Asset verification
- Compliance checking
- Audit trail untuk semua activities

### 6. Reporting & Analytics
- Asset summary reports
- Maintenance reports
- Request analysis
- Financial reports
- Export capabilities

### 7. Notification System
- Real-time notifications
- Email notifications
- Priority-based alerts
- Read/unread tracking

## Security Features

- JWT-based authentication dengan refresh tokens
- Password hashing dengan bcrypt
- Rate limiting untuk API endpoints
- CORS configuration
- Input validation dan sanitization
- Audit trail untuk semua operations
- Role-based access control
- Secure file upload

## Best Practices

### Code Organization
- Modular architecture
- Separation of concerns
- Clean folder structure
- Consistent naming conventions

### Error Handling
- Centralized error handling
- User-friendly error messages
- Proper HTTP status codes
- Error logging

### Performance
- Database indexing
- Query optimization
- Client-side caching dengan Zustand
- Image optimization
- Lazy loading

### Security
- Input validation
- SQL injection prevention
- XSS protection
- CSRF protection
- Secure headers

## Development Commands

### Backend
```bash
npm run dev          # Start development server
npm run build        # Build production
npm run start        # Start production server
npx prisma studio    # Open Prisma Studio
npx prisma migrate   # Run migrations
npx prisma generate  # Generate Prisma client
```

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

## Testing

### Backend Testing
- Unit tests dengan Jest
- Integration tests untuk API endpoints
- Database testing dengan test database

### Frontend Testing
- Component testing dengan React Testing Library
- E2E testing dengan Cypress
- Type checking dengan TypeScript

## 🚀 Enhanced Development & Deployment

### Development Setup dengan Multi-Company Support

#### Environment Configuration

**Backend (.env)**
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/management_assets"

# Authentication
JWT_SECRET=your_super_secure_jwt_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Multi-Company Settings
DEFAULT_COMPANY_ID=company_default_uuid
ALLOW_COMPANY_CREATION=true
MAX_COMPANIES_PER_ADMIN=10

# File Upload
UPLOAD_PATH=uploads
MAX_FILE_SIZE=10MB
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx

# QR Code Settings  
QR_CODE_SIZE=200
QR_CODE_FORMAT=PNG
QR_BASE_URL=https://yourdomain.com/assets

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@company.com
EMAIL_PASS=your_email_password

# Redis (untuk caching dan sessions)
REDIS_URL=redis://localhost:6379

# Application Settings
NODE_ENV=development
PORT=5000
API_VERSION=v1
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=1000
```

**Frontend (.env.local)**
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5001/api
NEXT_PUBLIC_UPLOAD_URL=http://localhost:5001/uploads
NEXT_PUBLIC_QR_SCANNER_URL=http://localhost:5001/qr

# Company Settings
NEXT_PUBLIC_MULTI_COMPANY_ENABLED=true
NEXT_PUBLIC_DEFAULT_COMPANY_NAME="Default Company"

# Feature Flags
NEXT_PUBLIC_ENABLE_SOFTWARE_MANAGEMENT=true
NEXT_PUBLIC_ENABLE_COMPONENT_BREAKDOWN=true
NEXT_PUBLIC_ENABLE_MOBILE_SCANNING=true
NEXT_PUBLIC_ENABLE_ADVANCED_REPORTING=true

# PWA Settings
NEXT_PUBLIC_PWA_ENABLED=true
NEXT_PUBLIC_ENABLE_OFFLINE_MODE=true

# Analytics (optional)
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID
NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

### Enhanced Development Commands

#### Backend Commands
```bash
# Development dengan hot reload
npm run dev

# Database operations
npx prisma migrate dev --name multi_company_support
npx prisma db seed
npx prisma studio
npx prisma generate

# Testing
npm run test                    # Unit tests
npm run test:integration       # Integration tests  
npm run test:coverage         # Test coverage report

# Code quality
npm run lint                   # ESLint
npm run lint:fix              # Auto-fix linting issues
npm run format                # Prettier formatting

# Build dan deployment
npm run build
npm run start:prod
```

#### Frontend Commands
```bash
# Development
npm run dev

# Building
npm run build
npm run start
npm run export                 # Static export

# Code quality
npm run lint
npm run lint:fix
npm run type-check            # TypeScript checking
npm run format

# Testing
npm run test                  # Unit tests
npm run test:watch           # Watch mode
npm run test:coverage        # Coverage report
npm run e2e                  # E2E tests dengan Cypress

# PWA dan mobile
npm run build:pwa            # Build PWA version
npm run analyze              # Bundle analysis
```

## 🚢 Production Deployment Guide

### Docker Deployment (Recommended)

#### Multi-Stage Dockerfile untuk Production

**Backend Dockerfile.prod**
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Production stage
FROM node:18-alpine AS production
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy application
COPY --from=builder /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate

# Security hardening
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 5000
CMD ["npm", "start"]
```

**Frontend Dockerfile.prod**
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage  
FROM nginx:alpine AS production
COPY --from=builder /app/out /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Production Docker Compose

**docker-compose.prod.yml**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: management_assets
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "5432:5432"
    restart: unless-stopped
    networks:
      - asset_management_network

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped
    networks:
      - asset_management_network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/management_assets
      REDIS_URL: redis://redis:6379
      NODE_ENV: production
    depends_on:
      - postgres
      - redis
    ports:
      - "5000:5000"
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    restart: unless-stopped
    networks:
      - asset_management_network
    healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:5001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    volumes:
      - ./ssl:/etc/nginx/ssl:ro
    restart: unless-stopped
    networks:
      - asset_management_network

volumes:
  postgres_data:
  redis_data:

networks:
  asset_management_network:
    driver: bridge
```

### Cloud Deployment Options

#### AWS Deployment dengan ECS

**Task Definition Template**
```json
{
  "family": "asset-management",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "your-registry/asset-management-backend:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:db-credentials"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/asset-management",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "backend"
        }
      }
    }
  ]
}
```

#### Kubernetes Deployment

**Kubernetes Manifests**
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: asset-management-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: asset-management-backend
  template:
    metadata:
      labels:
        app: asset-management-backend
    spec:
      containers:
      - name: backend
        image: asset-management-backend:latest
        ports:
        - containerPort: 5000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: database-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5

---
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: asset-management-backend-service
spec:
  selector:
    app: asset-management-backend
  ports:
  - port: 80
    targetPort: 5000
  type: LoadBalancer
```

### Database Management & Migrations

#### Production Migration Strategy
```bash
# Pre-deployment backup
pg_dump -h localhost -U username -d management_assets > backup_$(date +%Y%m%d_%H%M%S).sql

# Run migrations dengan rollback plan
npx prisma migrate deploy

# Seed production data (if needed)
npx prisma db seed --preview-feature

# Verify data integrity
npm run verify:data-integrity
```

#### Database Optimization untuk Production
```sql
-- Performance indexes untuk multi-company queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assets_company_status 
ON assets(company_id, status) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_company_active 
ON users(company_id, is_active) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_scheduled 
ON maintenance_records(scheduled_date) 
WHERE status IN ('SCHEDULED', 'IN_PROGRESS');

-- Partial indexes untuk common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assets_assigned 
ON assets(company_id, assigned_to_id) 
WHERE status = 'IN_USE';

-- Full-text search indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assets_search 
ON assets USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
```

### Monitoring & Observability

#### Application Monitoring Setup

**Prometheus Metrics (Backend)**
```javascript
const prometheus = require('prom-client');

// Custom metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code', 'company_id']
});

const assetOperations = new prometheus.Counter({
  name: 'asset_operations_total',
  help: 'Total number of asset operations',
  labelNames: ['operation', 'company_id', 'user_role']
});

// Middleware untuk tracking
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || 'unknown', res.statusCode, req.company?.id)
      .observe(duration);
  });
  next();
});
```

**Health Check Endpoints**
```javascript
// Comprehensive health check
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    checks: {
      database: 'unknown',
      redis: 'unknown',
      disk_space: 'unknown'
    }
  };

  try {
    // Database check
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = 'healthy';
  } catch (error) {
    health.checks.database = 'unhealthy';
    health.status = 'unhealthy';
  }

  // Redis check
  try {
    await redis.ping();
    health.checks.redis = 'healthy';
  } catch (error) {
    health.checks.redis = 'unhealthy';
  }

  // Disk space check
  const stats = await fs.promises.statSync('./uploads');
  health.checks.disk_space = stats ? 'healthy' : 'warning';

  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});
```

#### Logging Strategy

**Structured Logging dengan Winston**
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'asset-management-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Audit logging untuk critical operations
const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/audit.log' })
  ]
});

// Usage dalam operations
app.post('/api/assets/:id/assign', async (req, res) => {
  try {
    const result = await assignAsset(req.params.id, req.body);
    
    auditLogger.info('Asset assigned', {
      asset_id: req.params.id,
      user_id: req.user.id,
      company_id: req.company.id,
      assigned_to: req.body.assigned_to,
      timestamp: new Date().toISOString()
    });
    
    res.json(result);
  } catch (error) {
    logger.error('Asset assignment failed', {
      asset_id: req.params.id,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Assignment failed' });
  }
});
```

### Security Hardening

#### Production Security Checklist

**Backend Security**
- [ ] Environment variables secured (no secrets in code)
- [ ] HTTPS enforced dengan proper SSL certificates
- [ ] Rate limiting implemented pada all endpoints
- [ ] SQL injection prevention dengan parameterized queries
- [ ] XSS protection dengan content security policy
- [ ] CORS properly configured
- [ ] Authentication tokens secured dengan HTTP-only cookies
- [ ] Database connections using SSL
- [ ] File upload restrictions dan virus scanning
- [ ] API versioning implemented
- [ ] Error messages tidak expose sensitive information
- [ ] Logging tidak include sensitive data
- [ ] Regular security dependency updates

**Database Security**
- [ ] Database access restricted ke application only
- [ ] Row-level security policies implemented
- [ ] Database backups encrypted
- [ ] Connection pooling dengan proper limits
- [ ] Database user dengan minimal required permissions
- [ ] Regular database security patches
- [ ] Audit logging enabled
- [ ] Data encryption at rest

**Infrastructure Security**
- [ ] Server access restricted dengan SSH keys
- [ ] Firewall configured dengan minimal open ports
- [ ] Regular OS security updates
- [ ] Container images scanned for vulnerabilities
- [ ] Network segmentation implemented
- [ ] Load balancer configured dengan security headers
- [ ] DDoS protection enabled
- [ ] Intrusion detection system active

Sistem Asset Management ini sekarang siap untuk deployment production dengan semua fitur enterprise yang dibutuhkan untuk multi-company asset management. Implementasi mengikuti best practices untuk scalability, security, dan maintainability.

### Production Setup
1. Setup production database
2. Configure environment variables
3. Build aplikasi untuk production
4. Setup reverse proxy (Nginx)
5. Configure SSL certificates
6. Setup monitoring dan logging

### Monitoring
- Application performance monitoring
- Error tracking
- Database monitoring
- User activity tracking

## Future Enhancements

1. **Mobile App** - React Native mobile application
2. **Advanced Analytics** - Machine learning untuk predictive maintenance
3. **Integration** - API integration dengan sistem ERP/CRM
4. **Barcode/QR Code** - Asset tracking dengan barcode scanning
5. **Advanced Reporting** - Dashboard dengan charts dan visualizations
6. **Multi-tenancy** - Support untuk multiple organizations
7. **Document Management** - File attachments untuk assets dan maintenance
8. **Workflow Engine** - Custom approval workflows
9. **API Documentation** - Swagger/OpenAPI documentation
10. **Real-time Updates** - WebSocket untuk real-time notifications

## Support & Documentation

- Kode tersedia di repository
- Documentation lengkap di README
- API documentation di Postman collection
- Video tutorials dan user guide
- Technical support dan maintenance

Sistem ini menyediakan solusi lengkap untuk manajemen aset perusahaan dengan fitur modern, security yang baik, dan user experience yang optimal.


## password & username

Default admin credentials:
- Email: admin@company.com
- Password: password123

Other test accounts:
- Asset Admin: asset.admin@company.com / password123
- IT Manager: it.manager@company.com / password123
- Technician: tech1@company.com / password123
- Auditor: auditor@company.com / password123



restart docker PS D:\dev\development\management-assets> docker-compose -f docker-compose.dev.yml restart frontend

PS D:\dev\development\management-assets> docker logs --tail 20 management-assets-backend-dev

PS D:\dev\development\management-assets> docker logs --tail 20 management-assets-frontend-dev# Windows
.\start-dev-docker.bat

# Linux/Mac
./start-dev-docker.sh

# Manual
docker-compose -f docker-compose.dev.yml up -d