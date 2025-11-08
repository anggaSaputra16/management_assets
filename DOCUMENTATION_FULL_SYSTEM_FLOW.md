# Asset Management System — Full System Flow & Relations

This document describes the complete system flow, data model relations, and workflows for the Asset Management System as implemented in this repository. It collects architecture notes, database relations, business rules, and end-to-end flows for each major feature.

---

## Table of Contents

- Architecture Overview
- Database Schema & Relations
  - Core entity relations
  - Detailed relations map
- Authentication & Authorization Flow
- Asset Lifecycle Management
  - Creation
  - Status lifecycle
- Request & Approval Workflow
- Notification System
- Maintenance Management
- Asset Transfer Workflow
- Depreciation Calculation
- Audit & Compliance Workflow
- Decomposition (Retirement)
- Dashboard Data Flow
- Search & Filter Implementation
- State Management Pattern (Zustand)
- UI Component Hierarchy
- Data Synchronization Strategy
- Report Generation Flow
- Performance & Optimization
- Error Handling Strategy
- Business Rules
- Future Enhancements
- Implementation Status Summary

---

## Architecture Overview

- Frontend: Next.js (App Router), React, TypeScript (some JS), Zustand for state management. Pages in `frontend/src/app/...`, stores in `frontend/src/stores/`, services in `frontend/src/lib/services/`.
- Backend: Node.js (Express), Prisma ORM, PostgreSQL. Backend code in `backend/src/` with routes under `backend/src/routes/` and Prisma schema in `backend/prisma/schema.prisma`.
- Communication: REST API via Axios from frontend to backend. JWT-based authentication + role-based authorization middleware on backend.
- Dev/Deploy: Docker Compose for local development, scripts at repo root (`dev-start-docker.sh`, `docker-compose.dev.yml`, etc.).

---

## Database Schema & Relations

### Core Entity Relationships (high-level)

- User (employee)
  - belongsTo Department (N:1)
  - hasMany Assets (1:N) — assigned assets
  - hasMany Requests (1:N)
  - hasMany Maintenance tasks (1:N) — technician
  - hasMany Audits (1:N) — auditor

- Asset
  - belongsTo Category (N:1)
  - belongsTo Location (N:1)
  - belongsTo Department (N:1)
  - belongsTo Vendor (N:1)
  - may belongTo User (N:1) when assigned
  - hasMany Maintenance entries (1:N)
  - hasMany Transfers (1:N)
  - hasMany Depreciation/AssetValue entries (1:N)
  - hasMany Attachments/Documents (1:N)

- Department
  - belongsTo Company (N:1)
  - hasMany Users, Assets, Requests

- Category
  - hasMany Assets
  - contains depreciation defaults (useful life, rate)

- Request
  - belongsTo User (requestedBy)
  - belongsTo Asset
  - belongsTo Department

- Maintenance
  - belongsTo Asset
  - belongsTo User (technician)
  - may have history/notes, parts used

Detailed relations follow the Prisma schema in `backend/prisma/schema.prisma`. Foreign keys are used consistently; Prisma models include relation fields and _count helpers.

---

## Authentication & Authorization Flow

- Login: POST /auth/login — validate credentials, backend returns JWT and user payload.
- Frontend stores token in localStorage and in Zustand auth store.
- Axios interceptor attaches `Authorization: Bearer ${token}` to each request.
- Backend authenticate middleware verifies JWT and attaches `req.user`.
- Backend authorize middleware checks `req.user.role` against allowed roles per route (ADMIN, ASSET_ADMIN, MANAGER, DEPARTMENT_USER, TECHNICIAN, AUDITOR, TOP_MANAGEMENT).
- On 401 responses, frontend interceptor logs user out and redirects to /login.

---

## Asset Lifecycle Management

### Asset Creation

1. User (ADMIN or ASSET_ADMIN) fills asset creation form in frontend.
2. Form includes references (category, location, vendor, department) pulled from master data endpoints.
3. POST /assets with asset payload.
4. Backend validates with Joi, creates asset record in DB with status `AVAILABLE`.
5. Backend computes initial depreciation, writes to depreciation table if relevant, logs creation.
6. Frontend refreshes current page of assets and shows success toast.

### Asset Status Lifecycle

- Typical states: AVAILABLE → IN_USE → MAINTENANCE → RETIRED
- Assignment flows move assets from AVAILABLE → IN_USE.
- Maintenance tasks mark assets as MAINTENANCE while work in progress.
- Decomposition moves an asset to RETIRED and may create spare part inventory.

---

## Request & Approval Workflow

1. Department user creates a Request for an AVAILABLE asset.
2. Request saved with status `PENDING`, target approver is department manager.
3. Manager receives notification; they can approve or reject via API endpoints.
4. If approved:
   - Request status set to `APPROVED`.
   - Asset status updated to `IN_USE` and assigned to the requesting user.
   - Notifications generated for involved users.
5. If rejected: request status `REJECTED` with reason and notification sent.

---

## Notification System

- Backend creates notification entries on events (request created, approved, maintenance due, audit scheduled, warranty expiring).
- Frontend polls notifications or reads unread count endpoint.
- Clicking notification marks it as read and navigates to the relevant page.

---

## Maintenance Management

Two types: Preventive (scheduled) and Reactive (reported).

Reactive:
- User reports issue for an assigned asset.
- POST /maintenance — assigned to a technician, asset status becomes `MAINTENANCE`.
- Technician updates status, adds notes/costs/parts.
- Upon completion, status `COMPLETED`, asset returns to `IN_USE` (if still assigned).

Preventive:
- Cron job or scheduled background task identifies assets due for maintenance and creates maintenance records.

---

## Asset Transfer Workflow

- Transfer initiated via frontend form.
- POST /asset-transfer endpoint which uses Prisma transaction to update asset's department/location and create transfer record.
- Transfer logic should be atomic — update asset, create transfer record, create audit log in single transaction.

---

## Depreciation Calculation

- Straight-line method is used in current implementation.
- Annual depreciation = (Purchase Price - Salvage Value) / Useful Life.
- Monthly depreciation derived from annual value; book value updated accordingly.
- Triggers: asset creation, scheduled monthly job, or manual recalculation.

---

## Audit & Compliance Workflow

1. Admin/Auditor schedules an audit (select assets, date, type).
2. Auditor performs physical verification: checks existence, location, condition, compliance.
3. Results recorded and `PASS`/`FAIL` flagged.
4. Failed audits create remediation tasks and notify managers.

---

## Decomposition (Retirement)

- Decomposition retires asset (status RETIRED).
- Optionally creates spare parts records from asset components and updates inventory.
- Backend should unassign asset from user and write a final depreciation/disposal entry.

---

## Dashboard Data Flow

- Backend aggregates metrics (asset counts by status, department summaries, maintenance stats, financials, depreciation trends).
- Frontend fetches dashboard data endpoint (role-based scopes applied) and renders via Chart components.

---

## Search & Filter Implementation

- All list endpoints accept pagination and filter query params (page, limit, search, status, departmentId, etc.).
- Backend builds Prisma `where` clauses from incoming params and returns paginated results with `total` and `current`.
- Frontend triggers search using `handleSearch()` which calls store action `fetchX({page:1, limit, search})`.

---

## State Management Pattern (Zustand)

- Each major resource has a corresponding store in `frontend/src/stores/`.
- Stores follow the pattern:
  - data array (current page), loading, error
  - pagination: currentPage, pageSize, total
  - actions: fetch, create, update, delete, setPage, setPageSize
- After any create/update/delete, stores call fetch for the current page to keep client-side state consistent with server.

---

## UI Component Hierarchy

- `DashboardLayout` wraps pages and provides sidebar, header and notifications.
- Reusable components include `DataTable`, `Modal`, `Pagination` UI, and small inputs.
- Page components import the corresponding store and call `fetchX` on mount (useEffect).

---

## Data Synchronization Strategy

- Stores use server as source of truth: after writes they re-fetch the relevant page.
- Optimistic updates are not broadly used; instead we rely on fetch-after-write to ensure consistency.

---

## Report Generation Flow

- Report endpoints accept filters and return aggregated results.
- Frontend renders charts and allows export to CSV/Excel/PDF.

---

## Performance & Optimization

- Server-side pagination is implemented across major endpoints (assets, categories, departments, locations, vendors, users).
- Use Prisma selective `select`/`include` to reduce response size.
- Database indices exist on common lookup columns (IDs, tags, serial numbers).

---

## Error Handling Strategy

- Backend: centralized error middleware returns safe messages; Prisma errors translated to user-friendly messages when possible.
- Frontend: Axios interceptors handle 401 auto-logout; stores set `error` state to show UI messages.

---

## Business Rules (High-level)

- Only AVAILABLE assets can be assigned.
- Request approval required for assignment in most flows; MANAGER role required to approve departmental requests.
- Maintenance can only be started on non-RETIRED assets.
- Transfers must be atomic and cannot affect RETIRED assets.
- Decomposition permanently retires assets and may create spare parts.

---

## Future Enhancement Suggestions

- Real-time notifications via WebSocket.
- Redis caching for heavy reference data.
- Barcode/QR scanning and mobile app for technicians.
- More advanced reporting and scheduled exports.

---

## Implementation Status Summary

- Authentication & RBAC: Implemented
- Master Data (Categories, Departments, Locations, Vendors, Users): Implemented with CRUD + pagination support
- Assets: CRUD with pagination, depreciation calculation present
- Requests: Implemented with approval flow
- Maintenance: Implemented (reactive + preventive scaffolding)
- Audit: Implemented scheduling + completion
- Transfer: Implemented basic flow (recommend verifying transactional behavior for price adjustments)
- Decomposition: Implemented but spare-parts creation and inventory updates need review
- Software license tracking & some advanced flows: partially implemented / pending UI

---

## Where to Look in Codebase

- Frontend stores: `frontend/src/stores/`
- Frontend pages: `frontend/src/app/...`
- Frontend services: `frontend/src/lib/services/`
- Backend routes: `backend/src/routes/`
- Prisma schema: `backend/prisma/schema.prisma`
- Dev scripts & Docker: repo root (`docker-compose.dev.yml`, `dev-start-docker.sh`)

---

## Notes & Recommendations

- The repo already contains server-side pagination for many endpoints. Ensure each frontend store calls the APIs with `page` and `limit` parameters and uses `total` from response to render pagination.
- For complex write operations that must modify multiple tables (transfer, decomposition, inventory stock adjustments), use Prisma transactions (`prisma.$transaction`) to preserve atomicity.
- Add integration tests that exercise end-to-end flows (requests → approval → assignment; maintenance lifecycle; transfer transaction) to guard against regressions.

---

_Last updated: generated automatically from codebase analysis on November 5, 2025._
