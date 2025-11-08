# Inventory Module Implementation - Complete

## 📋 Konsep Inventory
**Inventory = Alokasi Asset ke Department** (bukan stok gudang)
- Setiap asset dari tabel Assets dialokasikan ke department
- Quantity = jumlah unit asset yang sama di department
- availableQty = unit yang bisa dipinjam (berkurang saat loan, bertambah saat return)
- Custodian = PIC yang manage inventory di department (optional)

Lihat detail konsep di: [`INVENTORY-CONCEPT-GUIDE.md`](INVENTORY-CONCEPT-GUIDE.md)

## Overview
Module inventory telah diimplementasikan sebagai inventory allocation & loan management per department dengan fitur:
1. **Company scoping** - Setiap inventory terkait dengan company untuk multi-company support
2. **Dynamic asset selection** - Assets dipilih dari daftar yang available dan belum ada di inventory department
3. **Duplicate prevention** - Checker otomatis mencegah asset yang sama didaftarkan 2x di department yang sama
4. **Loan notification scheduler** - Notifikasi otomatis untuk loan yang jatuh tempo atau overdue
5. **Approval workflow** - Manager/Admin dapat approve loan requests

## Database Changes

### Schema Updates (Prisma)
```prisma
model Inventory {
  // Added fields:
  companyId       String    // Direct company scoping
  
  // Added constraints:
  @@unique([assetId, departmentId]) // Prevent duplicate
  @@index([companyId, departmentId, status])
  @@index([companyId, status])
}
```

**Migration:** `20251107024014_add_inventory_company_and_unique_constraint`

## Backend Implementation

### 1. Inventory Routes (`backend/src/routes/inventory.js`)

#### New Endpoints:
- **GET `/api/inventory/available-assets?departmentId=xxx`**
  - Returns list of AVAILABLE assets not yet in inventory for department
  - Filters by company automatically
  - Used for dynamic dropdown in create form

#### Updated Endpoints:
- **GET `/api/inventory`**
  - Now uses direct `companyId` filter (faster queries)
  - Automatically scopes by authenticated user's company

- **POST `/api/inventory`**
  - Validates asset belongs to company
  - Checks for duplicate (asset + department combination)
  - Returns friendly error message if duplicate exists
  - Generates unique inventory tag per department

- **POST `/api/inventory/loans`**
  - Creates loan and decrements availableQty
  - Sends notifications to borrower, responsible, and managers
  - Auto-approved by current user

- **POST `/api/inventory/loans/:id/approve`**
  - Manager/Admin can approve loans
  - Updates approvedById field
  - Sends approval notifications

- **GET `/api/inventory/loans`**
  - Scopes loans by company via `inventory.companyId`
  - Pagination support

### 2. Loan Notification Scheduler (`backend/src/jobs/loanNotificationScheduler.js`)

**Cron Schedule:**
- Daily at 09:00 AM
- Every 6 hours for frequent checks
- Runs once immediately on server startup

**Notifications Sent:**
1. **Overdue Loans** (status updated to OVERDUE)
   - Notifies: Borrower, Responsible, Approver
   - Priority: HIGH
   - Type: `MAINTENANCE_OVERDUE`

2. **Due Today**
   - Notifies: Borrower, Responsible
   - Priority: HIGH
   - Type: `MAINTENANCE_DUE`

3. **Due in 3 Days (Reminder)**
   - Notifies: Borrower
   - Priority: MEDIUM
   - Type: `MAINTENANCE_DUE`

**Integration:** Registered in `backend/src/index.js`

```javascript
const { startScheduler: startLoanScheduler } = require('./jobs/loanNotificationScheduler');

// In server startup:
try {
  startLoanScheduler();
  console.log('[jobs] loanNotificationScheduler started');
} catch (err) {
  console.error('[jobs] Failed to start loanNotificationScheduler', err);
}
```

## Frontend Implementation

### 1. Inventory Service (`frontend/src/lib/services/inventoryService.ts`)

**New Method:**
```typescript
async getAvailableAssets(departmentId?: string): Promise<Array<{
  id: string;
  assetTag: string;
  name: string;
  description?: string;
  category: { name: string };
}>>
```

### 2. Create Inventory Page (`frontend/src/app/inventory/create/page.js`)

**Flow Changes:**
1. User selects **Department first**
2. System loads available assets for that department
3. Asset dropdown shows only:
   - Assets with status = AVAILABLE
   - Assets NOT yet in inventory for selected department
   - Filtered by user's company

**UI Features:**
- Disabled asset dropdown until department selected
- Loading state while fetching assets
- Warning message if no assets available
- Category shown in asset dropdown for clarity

**Error Handling:**
- Backend returns 400 with friendly message if duplicate
- Frontend shows toast error
- Form validation prevents submission without required fields

### 3. Inventory Main Page (`frontend/src/app/inventory/page.js`)

**Existing Features (Maintained):**
- Company and Department filters
- "Generate" button to load inventory
- Stats cards (Total, Available, Loaned, Active Loans)
- Search, status, condition filters
- Pagination
- Edit and Delete actions

**Note:** View mode removed - only Edit and Delete shown in actions

## Business Rules Implemented

### 1. Asset Selection Rules
✅ Only AVAILABLE assets can be added to inventory
✅ Asset must belong to user's company
✅ Asset cannot be in inventory for same department twice
✅ Department must belong to user's company

### 2. Loan Rules
✅ Loan quantity cannot exceed availableQty
✅ Creating loan decrements availableQty
✅ Returning loan increments availableQty and sets status to AVAILABLE
✅ Loan status updated to OVERDUE automatically by scheduler
✅ Notifications sent to borrower, responsible, and approver

### 3. Authorization
- **Create Inventory:** ADMIN, ASSET_ADMIN, MANAGER
- **Approve Loan:** ADMIN, MANAGER
- **View Inventory:** All authenticated users (scoped by company)
- **Create Loan:** All authenticated users

## Testing Checklist

### Backend Tests
- [ ] GET /api/inventory/available-assets returns correct assets
- [ ] POST /api/inventory prevents duplicate asset-department
- [ ] POST /api/inventory/loans sends notifications
- [ ] Loan scheduler runs and updates overdue status
- [ ] Loan approval updates approvedById

### Frontend Tests
- [ ] Asset dropdown disabled until department selected
- [ ] Asset dropdown shows only available assets
- [ ] Form submission handles duplicate error gracefully
- [ ] Notifications appear for loan due/overdue
- [ ] Manager can approve loans from loans page

## Migration Steps (For Production)

1. **Backup database**
   ```bash
   pg_dump management_assets > backup_before_inventory_update.sql
   ```

2. **Run migration**
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

3. **Update existing inventory records** (if any without companyId)
   ```sql
   UPDATE inventories i
   SET "companyId" = a."companyId"
   FROM assets a
   WHERE i."assetId" = a.id
   AND i."companyId" IS NULL;
   ```

4. **Restart backend server** to start loan scheduler

5. **Verify scheduler running**
   - Check server logs for: `[jobs] loanNotificationScheduler started`
   - Check for daily run at 09:00 AM

## Future Enhancements

### Potential Features:
1. **Loan Extension Requests**
   - Borrower can request to extend loan
   - Manager approval required

2. **Inventory Transfer Between Departments**
   - Move inventory from one department to another
   - Track transfer history

3. **Low Stock Alerts**
   - Notify when availableQty < minStockLevel
   - Automatic purchase request generation

4. **Loan History Report**
   - Track loan patterns per user/department
   - Analytics dashboard for loan utilization

5. **QR Code for Loans**
   - Generate QR code for loan label
   - Scan to return loan quickly

6. **Email Notifications**
   - In addition to in-app notifications
   - Daily digest for managers

## Files Changed

### Backend
- ✅ `backend/prisma/schema.prisma` - Added companyId, unique constraint, indexes
- ✅ `backend/src/routes/inventory.js` - Updated queries, added available-assets endpoint, duplicate check
- ✅ `backend/src/jobs/loanNotificationScheduler.js` - NEW: Cron job for loan notifications
- ✅ `backend/src/index.js` - Registered loan scheduler

### Frontend
- ✅ `frontend/src/lib/services/inventoryService.ts` - Added getAvailableAssets method
- ✅ `frontend/src/app/inventory/create/page.js` - Dynamic asset selection based on department

### Database
- ✅ Migration: `20251107024014_add_inventory_company_and_unique_constraint`

## Summary

Module inventory sekarang:
1. ✅ **Menggunakan tabel Inventory terpisah** untuk tracking department-level inventory
2. ✅ **Dynamic asset selection** - Hanya assets yang AVAILABLE dan belum di inventory department yang ditampilkan
3. ✅ **Duplicate prevention** - Unique constraint mencegah asset yang sama 2x di department yang sama
4. ✅ **Automatic loan notifications** - Scheduler berjalan setiap 6 jam dan daily 09:00 AM
5. ✅ **Company scoping** - Semua query menggunakan companyId untuk performa dan security
6. ✅ **Approval workflow** - Manager/Admin dapat approve loans

Semua implementasi sudah sesuai dengan best practice dari dokumentasi `.github/copilot-instructions.md` dan pattern yang ada di workspace.
