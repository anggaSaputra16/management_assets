# Asset Management System - AI Agent Guide

## Architecture Overview
This is a **full-stack enterprise asset management system** with Node.js/Express/Prisma backend and Next.js/Zustand frontend, containerized with Docker.

**Key Components:**
- **Backend**: Express.js REST API with Prisma ORM + PostgreSQL
- **Frontend**: Next.js with TypeScript, Zustand state management, Tailwind CSS
- **Database**: PostgreSQL with comprehensive asset lifecycle schema
- **Deploy**: Docker Compose with development hot-reload support

## Critical Development Patterns

### 1. Database-First Architecture
- **Schema**: All models defined in `backend/prisma/schema.prisma` with comprehensive enums
- **Migrations**: Use `npx prisma migrate dev` for schema changes
- **Seeding**: `npx prisma db seed` creates test data with default admin credentials
- **Code Generation**: Always run `npx prisma generate` after schema changes

### 2. Role-Based Access Control (RBAC)
**7 Role Types:** ADMIN, ASSET_ADMIN, MANAGER, DEPARTMENT_USER, TECHNICIAN, AUDITOR, TOP_MANAGEMENT

**Backend Pattern:**
```javascript
// Routes use middleware: authenticate, authorize(['ADMIN', 'ASSET_ADMIN'])
router.get('/', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), handler)
```

**Frontend Pattern:**
```javascript
// DashboardLayout filters menu items by user role
{ name: 'Users', roles: ['ADMIN', 'ASSET_ADMIN'] }
```

### 3. State Management with Zustand
**Store Pattern:** Each entity has dedicated store in `frontend/src/stores/`
```javascript
// Persistent auth with localStorage sync
export const useAuthStore = create(persist(stateFunction, { name: 'auth-storage' }))
```

**Critical:** Auth store handles hydration with `isHydrated` flag to prevent SSR issues.

### 4. API Service Layer
**Pattern:** Centralized services in `frontend/src/lib/services/` with consistent error handling
```javascript
// All services use axios instance with interceptors for auth + error handling
export const api = axios.create({ baseURL: API_BASE_URL })
```

### 5. Form Validation Strategy
- **Backend**: Joi schemas for request validation in each route
- **Frontend**: React Hook Form with Zod schemas (when TypeScript) or basic validation

## Development Workflow

### Docker Development (Recommended)
```bash
# Hot-reload development with PostgreSQL
.\dev-start-docker.bat  # Windows
./dev-start-docker.sh   # Linux/Mac

# Access: Frontend (3000), Backend (5000), Database (5432)
```

### Manual Development
```bash
# Backend setup (requires local PostgreSQL)
cd backend
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev

# Frontend setup
cd frontend  
npm install
npm run dev
```

### Key Commands
- **Database**: `docker-compose -f docker-compose.dev.yml exec backend npx prisma studio`
- **Logs**: `docker-compose -f docker-compose.dev.yml logs -f [service]`
- **Restart**: `docker-compose -f docker-compose.dev.yml restart [service]`

## Code Conventions

### Backend Patterns
1. **Route Structure**: `middleware → validation → business logic → response`
2. **Error Handling**: Centralized with `middleware/errorHandler.js`
3. **Rate Limiting**: Very generous limits (5000-10000/15min) to support dashboard
4. **File Uploads**: Use multer middleware, store in `/uploads` volume

### Frontend Patterns  
1. **Page Structure**: `app/[feature]/page.tsx` with layout wrapping
2. **Component Location**: Shared in `components/`, feature-specific in page folders
3. **State Pattern**: Zustand stores handle CRUD + loading states
4. **Authentication**: Per-page auth checks, no global guards

### File Naming
- **Backend**: `.js` files, camelCase functions, PascalCase models
- **Frontend**: `.tsx/.js` files, PascalCase components, camelCase utilities

## Asset Management Domain

### Core Entities
- **Assets**: Central entity with lifecycle tracking (AVAILABLE → IN_USE → MAINTENANCE → RETIRED)
- **Requests**: Workflow for asset allocation with approval process
- **Maintenance**: Scheduled/reactive maintenance with technician assignment
- **Audit**: Compliance tracking with scheduled reviews

### Business Rules
1. **Asset Assignment**: Only AVAILABLE assets can be assigned to users
2. **Request Approval**: Requires MANAGER+ role, creates notifications
3. **Maintenance**: Must have TECHNICIAN role, tracks costs and completion
4. **Department Filtering**: DEPARTMENT_USER role sees only their department's assets

## Integration Points

### Authentication Flow
1. Login → JWT token → localStorage + Zustand store
2. Axios interceptor adds `Bearer ${token}` to all requests  
3. 401 response → auto-logout → redirect to login

### Notification System
- **Real-time**: Backend creates notifications in database
- **Display**: Frontend polling via notification service
- **Types**: REQUEST_APPROVAL, MAINTENANCE_DUE, AUDIT_SCHEDULED, etc.

### File Upload Pattern
```javascript
// Backend: multer middleware handles uploads to /uploads
// Frontend: FormData for file submissions
// Storage: Docker volume persistence
```

## Common Debugging

### Rate Limit Issues
- Check logs for "Too many requests" 
- Current limits are very high (5000-10000/15min) for dashboard functionality

### Database Connections
- Use `docker-compose -f docker-compose.dev.yml logs postgres` to check DB health
- Connection string: `postgresql://postgres:postgres123@localhost:5432/management_assets`

### Authentication Problems  
- Check token in localStorage and Zustand store alignment
- Verify JWT_SECRET matches between frontend and backend
- Use `req.user` in backend routes after authenticate middleware

## Default Test Credentials
```
Admin: admin@company.com / password123
Asset Admin: asset.admin@company.com / password123
Manager: it.manager@company.com / password123
```

When extending this system, follow the established patterns for consistency and maintainability.