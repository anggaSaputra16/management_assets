# Inventory Loan - Employee Integration

## Overview
Inventory Loan module has been updated to use **Employee** instead of **User** for borrower and responsible person, while maintaining **User** as the requester (who creates the loan).

## Database Schema Changes

### InventoryLoan Model Updates

**Migration:** `20251107030017_update_inventory_loan_use_employees`

```prisma
model InventoryLoan {
  id                     String    @id @default(uuid())
  loanNumber             String    @unique
  inventoryId            String
  borrowerEmployeeId     String    // ✅ Changed from borrowerId (User)
  responsibleEmployeeId  String    // ✅ Changed from responsibleId (User)
  requestedById          String    // ✅ NEW: User who creates the loan
  approvedById           String?
  quantity               Int       @default(1)
  purpose                String
  loanDate               DateTime  @default(now())
  expectedReturnDate     DateTime
  actualReturnDate       DateTime?
  returnNotes            String?
  status                 LoanStatus @default(PENDING)
  
  // ✅ Employee Relations
  borrowerEmployee       Employee  @relation("borrowerLoans", fields: [borrowerEmployeeId], references: [id])
  responsibleEmployee    Employee  @relation("responsibleLoans", fields: [responsibleEmployeeId], references: [id])
  
  // ✅ User Relations  
  requestedBy            User      @relation("requestedLoans", fields: [requestedById], references: [id])
  approvedBy             User?     @relation("approvedLoans", fields: [approvedById], references: [id])
  
  inventory              Inventory @relation(fields: [inventoryId], references: [id])
  
  @@index([borrowerEmployeeId])
  @@index([responsibleEmployeeId])
  @@index([requestedById])
  @@index([status])
}
```

### Employee Model Updates

```prisma
model Employee {
  id                String   @id @default(uuid())
  npk               String
  firstName         String
  lastName          String
  email             String?
  phone             String?
  position          String?
  departmentId      String?
  userId            String?  // Optional - not all employees have user accounts
  
  // ✅ Loan Relations
  borrowerLoans     InventoryLoan[] @relation("borrowerLoans")
  responsibleLoans  InventoryLoan[] @relation("responsibleLoans")
  
  user              User?     @relation(fields: [userId], references: [id])
  department        Department? @relation(fields: [departmentId], references: [id])
  
  @@unique([companyId, npk])
}
```

### User Model Updates

```prisma
model User {
  id              String   @id @default(uuid())
  email           String   @unique
  username        String   @unique
  firstName       String
  lastName        String
  
  // ✅ Loan Relations
  requestedLoans  InventoryLoan[] @relation("requestedLoans")
  approvedLoans   InventoryLoan[] @relation("approvedLoans")
  
  employee        Employee?
}
```

## Backend Changes

### 1. Loan Notification Scheduler (`backend/src/jobs/loanNotificationScheduler.js`)

**Updated Query Includes:**
```javascript
const overdueLoans = await prisma.inventoryLoan.findMany({
  where: { status: 'ACTIVE', expectedReturnDate: { lt: today } },
  include: {
    borrowerEmployee: {
      select: { 
        id: true, 
        email: true, 
        firstName: true, 
        lastName: true, 
        companyId: true, 
        user: { select: { id: true } } // ✅ Include user for notifications
      }
    },
    responsibleEmployee: {
      select: { 
        id: true, 
        email: true, 
        firstName: true, 
        lastName: true, 
        user: { select: { id: true } } // ✅ Include user for notifications
      }
    },
    requestedBy: {
      select: { id: true, email: true, firstName: true, lastName: true }
    },
    approvedBy: {
      select: { id: true, email: true, firstName: true, lastName: true }
    },
    inventory: {
      include: {
        asset: { select: { name: true, assetTag: true, companyId: true } },
        department: { select: { name: true } }
      }
    }
  }
});
```

**Updated Notification Logic:**
```javascript
// Create notifications for overdue loans
for (const loan of overdueLoans) {
  const companyId = loan.inventory.asset.companyId;
  const borrowerName = `${loan.borrowerEmployee.firstName} ${loan.borrowerEmployee.lastName}`;
  
  // ✅ Notify borrower employee's user account (if exists)
  if (loan.borrowerEmployee.user?.id) {
    await createNotification({
      userId: loan.borrowerEmployee.user.id,
      companyId,
      title: `⚠️ Loan Overdue - ${loan.loanNumber}`,
      message: `Your loan for "${loan.inventory.asset.name}" is ${daysOverdue} day(s) overdue.`,
      type: 'MAINTENANCE_OVERDUE',
      priority: 'HIGH',
      actionUrl: `/inventory/loans?id=${loan.id}`,
      actionLabel: 'View Loan',
      relatedEntityType: 'INVENTORY_LOAN',
      relatedEntityId: loan.id
    });
  }

  // ✅ Notify responsible employee's user account (if exists)
  if (loan.responsibleEmployee.user?.id) {
    await createNotification({
      userId: loan.responsibleEmployee.user.id,
      companyId,
      title: `⚠️ Loan Overdue - ${loan.loanNumber}`,
      message: `Loan "${loan.loanNumber}" for ${borrowerName} is ${daysOverdue} day(s) overdue.`,
      type: 'MAINTENANCE_OVERDUE',
      priority: 'HIGH',
      actionUrl: `/inventory/loans?id=${loan.id}`,
      actionLabel: 'View Loan',
      relatedEntityType: 'INVENTORY_LOAN',
      relatedEntityId: loan.id
    });
  }

  // ✅ Notify requester (user who created the loan)
  if (loan.requestedBy) {
    await createNotification({
      userId: loan.requestedBy.id,
      companyId,
      title: `⚠️ Loan Overdue - ${loan.loanNumber}`,
      message: `Loan "${loan.loanNumber}" that you created for ${borrowerName} is ${daysOverdue} day(s) overdue.`,
      type: 'MAINTENANCE_OVERDUE',
      priority: 'HIGH',
      actionUrl: `/inventory/loans?id=${loan.id}`,
      actionLabel: 'View Loan',
      relatedEntityType: 'INVENTORY_LOAN',
      relatedEntityId: loan.id
    });
  }

  // ✅ Notify approver if exists
  if (loan.approvedBy) {
    await createNotification({
      userId: loan.approvedBy.id,
      companyId,
      title: `⚠️ Loan Overdue - ${loan.loanNumber}`,
      message: `Loan "${loan.loanNumber}" that you approved is ${daysOverdue} day(s) overdue.`,
      type: 'MAINTENANCE_OVERDUE',
      priority: 'HIGH',
      actionUrl: `/inventory/loans?id=${loan.id}`,
      actionLabel: 'View Loan',
      relatedEntityType: 'INVENTORY_LOAN',
      relatedEntityId: loan.id
    });
  }
}
```

**Key Points:**
- ✅ Check if Employee has linked User account (`employee.user?.id`)
- ✅ Notify multiple parties: borrower, responsible, requester, approver
- ✅ Use Employee names in messages
- ✅ Same logic for `dueToday` and `dueSoon` notifications

### 2. Inventory Routes (`backend/src/routes/inventory.js`)

**POST /api/inventory/loans - Create Loan:**
```javascript
// ✅ Updated validation schema
const createLoanSchema = Joi.object({
  inventoryId: Joi.string().required(),
  borrowerEmployeeId: Joi.string().required(), // Changed from borrowerId
  responsibleEmployeeId: Joi.string().required(), // Changed from responsibleId
  purpose: Joi.string().required(),
  quantity: Joi.number().integer().min(1).required(),
  expectedReturnDate: Joi.date().required()
});

// ✅ Updated validation logic
const { error, value } = createLoanSchema.validate(req.body);
if (error) {
  return res.status(400).json({ error: error.details[0].message });
}

// ✅ Validate employees exist and belong to company
const [borrowerEmployee, responsibleEmployee] = await Promise.all([
  prisma.employee.findFirst({
    where: { id: value.borrowerEmployeeId, companyId }
  }),
  prisma.employee.findFirst({
    where: { id: value.responsibleEmployeeId, companyId }
  })
]);

if (!borrowerEmployee) {
  return res.status(400).json({ error: 'Borrower employee not found' });
}
if (!responsibleEmployee) {
  return res.status(400).json({ error: 'Responsible employee not found' });
}

// ✅ Create loan with requestedById
const newLoan = await prisma.inventoryLoan.create({
  data: {
    loanNumber: `LOAN-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
    inventoryId: value.inventoryId,
    borrowerEmployeeId: value.borrowerEmployeeId,
    responsibleEmployeeId: value.responsibleEmployeeId,
    requestedById: req.user.id, // ✅ Logged-in user
    purpose: value.purpose,
    quantity: value.quantity,
    loanDate: new Date(),
    expectedReturnDate: new Date(value.expectedReturnDate),
    status: 'PENDING'
  },
  include: {
    borrowerEmployee: true,
    responsibleEmployee: true,
    requestedBy: true,
    inventory: { include: { asset: true, department: true } }
  }
});
```

**GET /api/inventory/loans - Get Loans:**
```javascript
const loans = await prisma.inventoryLoan.findMany({
  where,
  skip,
  take,
  orderBy: { [sortBy]: sortOrder },
  include: {
    // ✅ Include Employee data with user relation
    borrowerEmployee: {
      select: {
        id: true,
        npk: true,
        firstName: true,
        lastName: true,
        email: true,
        position: true,
        department: { select: { id: true, name: true } },
        user: { select: { id: true, email: true } }
      }
    },
    responsibleEmployee: {
      select: {
        id: true,
        npk: true,
        firstName: true,
        lastName: true,
        email: true,
        position: true,
        department: { select: { id: true, name: true } },
        user: { select: { id: true, email: true } }
      }
    },
    requestedBy: {
      select: { id: true, email: true, firstName: true, lastName: true }
    },
    approvedBy: {
      select: { id: true, email: true, firstName: true, lastName: true }
    },
    inventory: {
      include: {
        asset: { select: { id: true, name: true, assetTag: true } },
        department: { select: { id: true, name: true } }
      }
    }
  }
});
```

**Employee Endpoint Already Available:**
- `GET /api/employees` - Get all employees with filters (departmentId, search, etc.)
- Supports pagination and filtering
- Returns employee data with NPK, name, position, department

## Frontend Changes

### 1. Employee Store Export (`frontend/src/stores/index.ts`)

```typescript
// ✅ Added employee store export
export { useEmployeeStore } from './employeeStore'
```

### 2. Employee Store Enhancement (`frontend/src/stores/employeeStore.js`)

```javascript
import { employeeService } from '@/lib/services/employeeService';

export const useEmployeeStore = create(
  persist(
    (set, get) => ({
      employees: [],
      loading: false,
      error: null,
      
      // ✅ Added fetchEmployees method
      fetchEmployees: async (page, limit) => {
        try {
          set({ loading: true, error: null });
          
          const currentFilters = get().filters;
          const currentPage = page || get().pagination.page;
          const currentLimit = limit || get().pagination.limit || 1000; // High limit for dropdowns
          
          const params = {
            page: currentPage,
            limit: currentLimit,
            ...(currentFilters.search && { search: currentFilters.search }),
            ...(currentFilters.departmentId && { departmentId: currentFilters.departmentId }),
            ...(currentFilters.locationId && { locationId: currentFilters.locationId }),
            ...(currentFilters.isActive !== null && { isActive: currentFilters.isActive }),
          };
          
          const response = await employeeService.getAllEmployees(params);
          
          set({
            employees: response.employees || [],
            pagination: response.pagination || get().pagination,
            loading: false,
          });
        } catch (error) {
          console.error('Failed to fetch employees:', error);
          set({
            error: error?.message || 'Failed to fetch employees',
            loading: false,
          });
        }
      },
      
      // ... existing store methods
    }),
    { name: 'employee-storage' }
  )
);
```

### 3. Loan Management Page (`frontend/src/app/loans/manage/page.js`)

**Import Changes:**
```javascript
import { useInventoryStore, useEmployeeStore } from '@/stores' // ✅ Changed from useUserStore
```

**State Initialization:**
```javascript
const { employees, fetchEmployees } = useEmployeeStore()
const [form, setForm] = useState({ 
  inventoryId: '', 
  borrowerEmployeeId: '',        // ✅ Changed from borrowerId
  responsibleEmployeeId: '',     // ✅ Changed from responsibleId
  purpose: '', 
  quantity: 1, 
  expectedReturnDate: '' 
})
```

**Data Fetching:**
```javascript
useEffect(() => {
  fetchLoans()
  fetchInventories()
  fetchEmployees() // ✅ Fetch employees instead of users
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [])
```

**Form Submit:**
```javascript
const handleCreate = async (e) => {
  e.preventDefault()
  try {
    await createLoan({
      inventoryId: form.inventoryId,
      borrowerEmployeeId: form.borrowerEmployeeId,       // ✅ Changed
      responsibleEmployeeId: form.responsibleEmployeeId, // ✅ Changed
      purpose: form.purpose,
      quantity: Number(form.quantity || 1),
      expectedReturnDate: form.expectedReturnDate
    })
    toast.success('Loan created')
    setForm({ 
      inventoryId: '', 
      borrowerEmployeeId: '', 
      responsibleEmployeeId: '', 
      purpose: '', 
      quantity: 1, 
      expectedReturnDate: '' 
    })
    setShowCreate(false)
  } catch (err) {
    console.error(err)
    toast.error('Failed to create loan')
  }
}
```

**Form Fields:**
```javascript
<div>
  <label className="block text-sm font-medium">Borrower (Employee)</label>
  <select 
    name="borrowerEmployeeId" 
    value={form.borrowerEmployeeId} 
    onChange={handleChange} 
    className="mt-1 block w-full border rounded p-2" 
    required
  >
    <option value="">Select borrower employee</option>
    {employees.map((e) => (
      <option key={e.id} value={e.id}>
        {e.npk} - {e.firstName} {e.lastName} {e.position ? `(${e.position})` : ''}
      </option>
    ))}
  </select>
</div>

<div>
  <label className="block text-sm font-medium">Responsible (Employee)</label>
  <select 
    name="responsibleEmployeeId" 
    value={form.responsibleEmployeeId} 
    onChange={handleChange} 
    className="mt-1 block w-full border rounded p-2" 
    required
  >
    <option value="">Select responsible employee</option>
    {employees.map((e) => (
      <option key={e.id} value={e.id}>
        {e.npk} - {e.firstName} {e.lastName} {e.position ? `(${e.position})` : ''}
      </option>
    ))}
  </select>
</div>
```

**Table Display:**
```javascript
<tbody>
  {loans.map((l) => (
    <tr key={l.id} className="hover:bg-gray-50">
      <td className="px-2 py-1">{l.loanNumber}</td>
      <td className="px-2 py-1">{l.inventory?.inventoryTag} — {l.inventory?.asset?.name}</td>
      <td className="px-2 py-1">
        {/* ✅ Display employee NPK and name */}
        {l.borrowerEmployee 
          ? `${l.borrowerEmployee.npk} - ${l.borrowerEmployee.firstName} ${l.borrowerEmployee.lastName}` 
          : 'N/A'}
      </td>
      <td className="px-2 py-1">{l.quantity}</td>
      <td className="px-2 py-1">{l.status}</td>
      <td className="px-2 py-1">
        {l.status === 'ACTIVE' && (
          <button onClick={() => handleReturn(l.id)} className="text-sm text-blue-600">
            Return
          </button>
        )}
      </td>
    </tr>
  ))}
</tbody>
```

## Key Concepts

### Why Employee vs User?

1. **Employee = Physical Person in Organization**
   - Has NPK (employee number)
   - Works in a department
   - Has position/title
   - May or may not have system access (userId optional)
   - Can borrow assets regardless of system access

2. **User = System Account**
   - Has login credentials
   - Has role-based permissions
   - Creates and manages loans
   - Approves/rejects requests

### Notification Flow

```
Employee.user?.id ──→ Notification ──→ User sees in system
       ↑
       │
 Check if Employee 
 has User account
       │
       └─ If no User account, skip notification
```

### Loan Creation Flow

```
1. Manager/Admin (User) logs in
2. Selects Employee as borrower
3. Selects Employee as responsible
4. Creates loan
5. System stores:
   - borrowerEmployeeId: Employee ID
   - responsibleEmployeeId: Employee ID  
   - requestedById: User ID (logged-in user)
6. Notifications sent to:
   - Borrower's User account (if linked)
   - Responsible's User account (if linked)
   - Requester's User account (always)
   - Approver's User account (if approved)
```

## Testing Checklist

- [ ] Create loan with employee selection
- [ ] Verify loan displays employee NPK and name
- [ ] Test notification for employee with user account
- [ ] Test notification for employee without user account (should skip)
- [ ] Test overdue loan notifications
- [ ] Test due today notifications
- [ ] Test due in 3 days notifications
- [ ] Verify requester always receives notification
- [ ] Verify approver receives notification after approval
- [ ] Filter employees by department in dropdown
- [ ] Test loan return flow
- [ ] Check employee data in loan details

## Migration Steps

1. ✅ Run migration: `npx prisma migrate dev`
2. ✅ Update backend notification scheduler
3. ✅ Update backend loan routes
4. ✅ Update frontend loan form
5. ✅ Update frontend loan display
6. ✅ Add employee store fetch method
7. ✅ Export employee store
8. [ ] Test end-to-end flow
9. [ ] Verify notifications work correctly

## API Endpoints

### Employee Endpoints
- `GET /api/employees` - Get all employees (with pagination)
  - Query params: `page`, `limit`, `search`, `departmentId`, `locationId`, `isActive`
- `GET /api/employees/:id` - Get employee by ID

### Loan Endpoints  
- `POST /api/inventory/loans` - Create loan
  - Body: `{ inventoryId, borrowerEmployeeId, responsibleEmployeeId, purpose, quantity, expectedReturnDate }`
- `GET /api/inventory/loans` - Get loans
  - Query params: `page`, `limit`, `search`, `status`, `borrowerId` (for filtering)
- `POST /api/inventory/loans/:id/return` - Return loan
  - Body: `{ notes }`
- `POST /api/inventory/loans/:id/approve` - Approve loan
  - Body: `{ approvalNotes }`

## Database Queries

### Get Loan with Employee Data
```javascript
const loan = await prisma.inventoryLoan.findUnique({
  where: { id: loanId },
  include: {
    borrowerEmployee: {
      select: {
        id: true,
        npk: true,
        firstName: true,
        lastName: true,
        position: true,
        department: { select: { name: true } },
        user: { select: { id: true, email: true } }
      }
    },
    responsibleEmployee: {
      select: {
        id: true,
        npk: true,
        firstName: true,
        lastName: true,
        position: true,
        user: { select: { id: true, email: true } }
      }
    },
    requestedBy: {
      select: { id: true, firstName: true, lastName: true, email: true }
    },
    approvedBy: {
      select: { id: true, firstName: true, lastName: true, email: true }
    }
  }
});
```

### Get Employees for Dropdown
```javascript
const employees = await prisma.employee.findMany({
  where: {
    companyId: req.user.companyId,
    isActive: true,
    ...(departmentId && { departmentId })
  },
  select: {
    id: true,
    npk: true,
    firstName: true,
    lastName: true,
    position: true,
    department: { select: { id: true, name: true } }
  },
  orderBy: [
    { firstName: 'asc' },
    { lastName: 'asc' }
  ]
});
```

## Summary

✅ **Completed:**
- Database schema migration
- Backend notification scheduler update
- Backend loan routes update
- Frontend loan form update
- Frontend loan display update
- Employee store enhancement
- Store export configuration

⏳ **Next Steps:**
- Test loan creation with employees
- Test notification flow
- Verify all CRUD operations work correctly
- Update any other pages that display loan data

🎯 **Benefits:**
- More accurate representation of real-world loan process
- Clearer separation between system users and physical employees
- Better tracking of who requested vs. who borrowed
- Flexible notification system (only notify employees with user accounts)
