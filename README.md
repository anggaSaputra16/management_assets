# Management Assets System - Dokumentasi Lengkap

## Overview
Sistem manajemen aset yang lengkap dengan backend Node.js/Express/Prisma dan frontend Next.js/Zustand/Tailwind CSS. Sistem ini mendukung manajemen aset perusahaan dengan fitur lengkap untuk berbagai role pengguna.

## Teknologi yang Digunakan

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Prisma ORM** - Database ORM dengan PostgreSQL
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Joi** - Data validation
- **multer** - File upload
- **nodemailer** - Email service
- **helmet** - Security middleware
- **CORS** - Cross-origin resource sharing
- **express-rate-limit** - Rate limiting

### Frontend
- **Next.js 14** - React framework dengan TypeScript
- **Zustand** - State management
- **Tailwind CSS** - CSS framework
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Lucide React** - Icons
- **date-fns** - Date utilities
- **Headless UI** - Accessible UI components

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

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/forgot-password` - Forgot password
- `POST /api/auth/reset-password` - Reset password

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Assets
- `GET /api/assets` - Get all assets with filtering
- `GET /api/assets/:id` - Get asset by ID
- `POST /api/assets` - Create new asset
- `PUT /api/assets/:id` - Update asset
- `DELETE /api/assets/:id` - Delete asset
- `POST /api/assets/:id/assign` - Assign asset to user
- `POST /api/assets/:id/unassign` - Unassign asset
- `POST /api/assets/:id/upload-image` - Upload asset image

### Requests
- `GET /api/requests` - Get all requests
- `GET /api/requests/:id` - Get request by ID
- `POST /api/requests` - Create new request
- `PUT /api/requests/:id` - Update request
- `DELETE /api/requests/:id` - Delete request
- `POST /api/requests/:id/approve` - Approve request
- `POST /api/requests/:id/reject` - Reject request

### Maintenance
- `GET /api/maintenance` - Get all maintenance records
- `GET /api/maintenance/:id` - Get maintenance by ID
- `POST /api/maintenance` - Create new maintenance
- `PUT /api/maintenance/:id` - Update maintenance
- `DELETE /api/maintenance/:id` - Delete maintenance
- `POST /api/maintenance/:id/complete` - Complete maintenance

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create new category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Locations
- `GET /api/locations` - Get all locations
- `GET /api/locations/:id` - Get location by ID
- `POST /api/locations` - Create new location
- `PUT /api/locations/:id` - Update location
- `DELETE /api/locations/:id` - Delete location

### Vendors
- `GET /api/vendors` - Get all vendors
- `GET /api/vendors/:id` - Get vendor by ID
- `POST /api/vendors` - Create new vendor
- `PUT /api/vendors/:id` - Update vendor
- `DELETE /api/vendors/:id` - Delete vendor

### Departments
- `GET /api/departments` - Get all departments
- `GET /api/departments/:id` - Get department by ID
- `POST /api/departments` - Create new department
- `PUT /api/departments/:id` - Update department
- `DELETE /api/departments/:id` - Delete department

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/mark-all-read` - Mark all notifications as read

### Audit
- `GET /api/audit` - Get audit logs
- `GET /api/audit/:id` - Get audit by ID
- `POST /api/audit` - Create audit schedule

### Reports
- `GET /api/reports/asset-summary` - Asset summary report
- `GET /api/reports/maintenance-report` - Maintenance report
- `GET /api/reports/request-analysis` - Request analysis report
- `GET /api/reports/audit-report` - Audit report

## Frontend Pages & Features

### Authentication
- **Login Page** (`/login`) - User authentication dengan role-based redirect

### Dashboard
- **Main Dashboard** (`/dashboard`) - Overview untuk semua user
- **Admin Dashboard** (`/admin/dashboard`) - Dashboard khusus admin dengan statistik lengkap

### Asset Management
- **Assets Page** (`/assets`) - Manajemen aset dengan tabel, filter, dan modal CRUD
- **Categories Page** (`/categories`) - Manajemen kategori aset
- **Locations Page** (`/locations`) - Manajemen lokasi aset
- **Vendors Page** (`/vendors`) - Manajemen vendor/supplier

### Request Management
- **Requests Page** (`/requests`) - Manajemen permintaan aset dengan approval workflow

### User Management
- **Users Page** (`/users`) - Manajemen pengguna sistem
- **Departments Page** (`/departments`) - Manajemen departemen

### Maintenance
- **Maintenance Page** (`/maintenance`) - Manajemen pemeliharaan aset

### Audit & Reporting
- **Audit Page** (`/audit`) - Manajemen audit aset
- **Reports Page** (`/reports`) - Laporan dan analitik
- **Notifications Page** (`/notifications`) - Manajemen notifikasi

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

## Deployment

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