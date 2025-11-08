# Inventory Location Auto-Update Feature

## Overview
Ketika asset ditambahkan ke inventory department, sistem secara otomatis akan:
1. **Update lokasi asset** ke lokasi department tersebut
2. **Update status asset** menjadi `IN_USE`
3. **Menampilkan informasi lengkap** di table view inventory dan assets

## Backend Changes

### 1. POST /api/inventory - Create Inventory with Location Update

**File:** `backend/src/routes/inventory.js`

**Changes:**

```javascript
// Generate inventory tag
const inventoryTag = await generateInventoryTag(department.code, companyId);

// Get department's location
const departmentWithLocation = await prisma.department.findUnique({
  where: { id: value.departmentId },
  select: { 
    code: true, 
    companyId: true, 
    locationId: true,
    location: {
      select: { id: true, name: true, building: true, floor: true, room: true }
    }
  }
});

// Create inventory and update asset location in transaction
const result = await prisma.$transaction(async (tx) => {
  // Create inventory
  const inventory = await tx.inventory.create({
    data: {
      assetId: value.assetId,
      departmentId: value.departmentId,
      companyId,
      custodianId: value.custodianId,
      quantity: value.quantity,
      condition: value.condition,
      location: value.location,
      notes: value.notes,
      minStockLevel: value.minStockLevel,
      inventoryTag,
      availableQty: value.quantity
    },
    include: {
      asset: {
        select: {
          name: true,
          assetTag: true,
          locationId: true
        }
      },
      department: {
        select: {
          name: true,
          location: {
            select: { id: true, name: true, building: true, floor: true, room: true }
          }
        }
      }
    }
  });

  // ✅ Update asset location to department's location
  if (departmentWithLocation.locationId) {
    await tx.asset.update({
      where: { id: value.assetId },
      data: {
        locationId: departmentWithLocation.locationId,
        status: 'IN_USE' // ✅ Update status to IN_USE
      }
    });
  }

  return inventory;
});

res.status(201).json({
  success: true,
  data: result,
  message: `Inventory created successfully. Asset location updated to ${departmentWithLocation.location?.name || 'department location'}.`
});
```

**Key Points:**
- ✅ **Transaction-based**: Create inventory dan update asset dalam 1 transaction
- ✅ **Auto-location update**: Asset location otomatis update ke location department
- ✅ **Status update**: Asset status berubah dari `AVAILABLE` → `IN_USE`
- ✅ **Informative message**: Response message menjelaskan lokasi baru asset

### 2. GET /api/inventory - Enhanced with Location Data

**Updated Include:**

```javascript
const [inventories, total] = await Promise.all([
  prisma.inventory.findMany({
    where,
    include: {
      asset: {
        select: {
          id: true,
          name: true,
          assetTag: true,
          serialNumber: true,
          description: true,
          status: true, // ✅ Include asset status
          category: {
            select: {
              name: true
            }
          },
          location: { // ✅ Include asset location
            select: {
              id: true,
              name: true,
              code: true,
              building: true,
              floor: true,
              room: true
            }
          }
        }
      },
      department: {
        select: {
          id: true,
          name: true,
          code: true,
          location: { // ✅ Include department location
            select: {
              id: true,
              name: true,
              code: true,
              building: true,
              floor: true,
              room: true
            }
          }
        }
      },
      custodian: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          npk: true, // ✅ Include NPK
          position: true // ✅ Include position
        }
      },
      _count: { // ✅ Include loan count
        select: {
          loans: true
        }
      }
    },
    skip,
    take,
    orderBy: {
      createdAt: 'desc'
    }
  }),
  prisma.inventory.count({ where })
]);
```

**Enhanced Data:**
- ✅ **Asset location details**: Building, floor, room
- ✅ **Department location details**: Building, floor, room
- ✅ **Asset status**: Current status of the asset
- ✅ **Custodian details**: NPK and position
- ✅ **Loan count**: Total number of loans for this inventory

## Frontend Changes

### Updated Table View

**File:** `frontend/src/app/inventory/page.js`

**New Table Headers:**

```javascript
<thead className="bg-gray-50">
  <tr>
    <th>Inventory Tag</th>
    <th>Asset Info</th>
    <th>Department & Location</th> {/* ✅ Enhanced column */}
    <th>Custodian</th> {/* ✅ New column */}
    <th>Quantity</th>
    <th>Status</th>
    <th>Loans</th> {/* ✅ New column */}
    <th>Actions</th>
  </tr>
</thead>
```

**Enhanced Table Rows:**

```javascript
<tr key={inventory.id} className="hover:bg-gray-50">
  {/* 1. Inventory Tag */}
  <td className="px-6 py-4 whitespace-nowrap">
    <div className="text-sm font-bold text-blue-600">
      {inventory.inventoryTag}
    </div>
  </td>

  {/* 2. Asset Info */}
  <td className="px-6 py-4">
    <div>
      <div className="text-sm font-medium text-gray-900">
        {inventory.asset?.name}
      </div>
      <div className="text-xs text-gray-500">
        Tag: {inventory.asset?.assetTag}
      </div>
      {inventory.asset?.serialNumber && (
        <div className="text-xs text-gray-500">
          S/N: {inventory.asset.serialNumber}
        </div>
      )}
      <div className="text-xs text-gray-400">
        {inventory.asset?.category?.name}
      </div>
    </div>
  </td>

  {/* 3. Department & Location - ENHANCED */}
  <td className="px-6 py-4">
    <div>
      <div className="text-sm font-medium text-gray-900">
        📁 {inventory.department?.name}
      </div>
      {/* ✅ Show department location */}
      {inventory.department?.location && (
        <div className="text-xs text-gray-500 mt-1">
          📍 {inventory.department.location.name}
          {inventory.department.location.building && (
            <span className="ml-1">
              - {inventory.department.location.building}
              {inventory.department.location.floor && ` Floor ${inventory.department.location.floor}`}
              {inventory.department.location.room && ` Room ${inventory.department.location.room}`}
            </span>
          )}
        </div>
      )}
      {/* ✅ Warning if asset location differs from department location */}
      {inventory.asset?.location && 
       inventory.asset.location.id !== inventory.department?.location?.id && (
        <div className="text-xs text-orange-600 mt-1">
          ⚠️ Asset at: {inventory.asset.location.name}
        </div>
      )}
    </div>
  </td>

  {/* 4. Custodian - NEW COLUMN */}
  <td className="px-6 py-4">
    {inventory.custodian ? (
      <div>
        <div className="text-sm text-gray-900">
          {inventory.custodian.firstName} {inventory.custodian.lastName}
        </div>
        {inventory.custodian.npk && (
          <div className="text-xs text-gray-500">
            NPK: {inventory.custodian.npk}
          </div>
        )}
        {inventory.custodian.position && (
          <div className="text-xs text-gray-400">
            {inventory.custodian.position}
          </div>
        )}
      </div>
    ) : (
      <span className="text-xs text-gray-400">No custodian</span>
    )}
  </td>

  {/* 5. Quantity */}
  <td className="px-6 py-4 whitespace-nowrap">
    <div className="text-sm font-semibold text-gray-900">
      {inventory.availableQty} / {inventory.quantity}
    </div>
    <div className="text-xs text-gray-500">
      Available / Total
    </div>
    {/* ✅ Show condition badge */}
    {inventory.condition && (
      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full mt-1 ${getConditionColor(inventory.condition)}`}>
        {inventory.condition}
      </span>
    )}
  </td>

  {/* 6. Status */}
  <td className="px-6 py-4 whitespace-nowrap">
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(inventory.status)}`}>
      {inventory.status}
    </span>
    {/* ✅ Show asset status */}
    {inventory.asset?.status && (
      <div className="text-xs text-gray-500 mt-1">
        Asset: {inventory.asset.status}
      </div>
    )}
  </td>

  {/* 7. Loans - NEW COLUMN */}
  <td className="px-6 py-4 whitespace-nowrap text-center">
    <div className="text-sm font-medium text-blue-600">
      {inventory._count?.loans || 0}
    </div>
    <div className="text-xs text-gray-500">
      Total Loans
    </div>
  </td>

  {/* 8. Actions */}
  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
    <div className="flex space-x-2">
      <button
        onClick={() => router.push(`/inventory/${inventory.id}/edit`)}
        className="text-yellow-600 hover:text-yellow-900"
        title="Edit"
      >
        <Edit3 className="h-4 w-4" />
      </button>
      <button
        onClick={() => handleDelete(inventory.id)}
        className="text-red-600 hover:text-red-900"
        title="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  </td>
</tr>
```

## Visual Information Hierarchy

### Icons & Colors Used

**Department & Location:**
- 📁 Department name
- 📍 Location details (green text)
- ⚠️ Location mismatch warning (orange text)

**Status Indicators:**
- **AVAILABLE**: Green badge
- **IN_USE**: Blue badge
- **LOANED**: Purple badge
- **MAINTENANCE**: Yellow badge
- **RETIRED**: Gray badge

**Condition Indicators:**
- **GOOD**: Green badge
- **FAIR**: Yellow badge
- **POOR**: Orange badge
- **DAMAGED**: Red badge

## Use Cases

### Case 1: Normal Inventory Creation

**Scenario:**
- IT Department has location: "HQ Building - Floor 3 - Room 301"
- Add Laptop to IT Department inventory

**Result:**
1. ✅ Inventory created with tag `INV-IT-2411-0001`
2. ✅ Laptop's location updated to "HQ Building - Floor 3 - Room 301"
3. ✅ Laptop's status changed from `AVAILABLE` → `IN_USE`
4. ✅ Table shows:
   - Department: 📁 IT Department
   - Location: 📍 HQ Building - Floor 3 Room 301
   - Asset status: IN_USE

### Case 2: Location Mismatch Detection

**Scenario:**
- Inventory created in IT Department (HQ Building - Floor 3)
- Asset manually moved to Warehouse (different building)
- Asset location updated to Warehouse

**Result:**
- Table shows warning:
  - Department: 📁 IT Department
  - Location: 📍 HQ Building - Floor 3 Room 301
  - ⚠️ Asset at: Warehouse Building A

This helps identify assets that are physically in different locations than their department.

### Case 3: Custodian Tracking

**Scenario:**
- Inventory has custodian: John Doe (NPK: EMP001, Position: IT Manager)

**Result:**
- Table shows full custodian info:
  ```
  John Doe
  NPK: EMP001
  IT Manager
  ```

### Case 4: Loan Activity Monitoring

**Scenario:**
- Inventory has 5 total loans (including returned and active)

**Result:**
- Table shows:
  ```
  5
  Total Loans
  ```
- Users can quickly see which inventories are frequently loaned

## Transaction Safety

**Database Transaction Flow:**

```javascript
BEGIN TRANSACTION
  ├─ Create Inventory Record
  ├─ Update Asset.locationId = Department.locationId
  ├─ Update Asset.status = 'IN_USE'
  └─ COMMIT
```

**Rollback Scenarios:**
- ❌ If inventory creation fails → Nothing is saved
- ❌ If asset update fails → Inventory creation is rolled back
- ✅ Both operations succeed → Both changes committed

## Benefits

1. **Automatic Location Tracking**
   - No manual location update needed
   - Assets always reflect current department location
   - Reduces data inconsistency

2. **Enhanced Visibility**
   - See asset location, status, and condition at a glance
   - Identify location mismatches immediately
   - Track custodian and loan activity

3. **Better Decision Making**
   - Know where assets are physically located
   - Identify frequently loaned items
   - Monitor asset condition trends

4. **Data Integrity**
   - Transaction-based updates ensure consistency
   - Status automatically reflects allocation
   - Location sync with department assignment

## Testing Checklist

- [ ] Create inventory - verify asset location updated
- [ ] Create inventory - verify asset status changed to IN_USE
- [ ] View inventory table - verify all new columns display
- [ ] Check location mismatch warning (manually change asset location)
- [ ] Verify custodian info displayed correctly
- [ ] Verify loan count displayed correctly
- [ ] Test transaction rollback (simulate failure)
- [ ] Check response message mentions location update

## API Response Example

**POST /api/inventory Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "inventoryTag": "INV-IT-2411-0001",
    "assetId": "asset-uuid",
    "departmentId": "dept-uuid",
    "quantity": 1,
    "availableQty": 1,
    "condition": "GOOD",
    "status": "AVAILABLE",
    "asset": {
      "name": "Dell Latitude 7420",
      "assetTag": "IT-LAP-2024-001",
      "locationId": "location-uuid"
    },
    "department": {
      "name": "IT Department",
      "location": {
        "id": "location-uuid",
        "name": "HQ Building",
        "building": "HQ",
        "floor": "3",
        "room": "301"
      }
    }
  },
  "message": "Inventory created successfully. Asset location updated to HQ Building."
}
```

**GET /api/inventory Response:**

```json
{
  "success": true,
  "data": {
    "inventories": [
      {
        "id": "uuid",
        "inventoryTag": "INV-IT-2411-0001",
        "quantity": 1,
        "availableQty": 1,
        "condition": "GOOD",
        "status": "AVAILABLE",
        "asset": {
          "name": "Dell Latitude 7420",
          "assetTag": "IT-LAP-2024-001",
          "serialNumber": "SN123456",
          "status": "IN_USE",
          "category": {
            "name": "Laptop"
          },
          "location": {
            "id": "loc-1",
            "name": "HQ Building",
            "code": "HQ",
            "building": "HQ",
            "floor": "3",
            "room": "301"
          }
        },
        "department": {
          "name": "IT Department",
          "code": "IT",
          "location": {
            "id": "loc-1",
            "name": "HQ Building",
            "building": "HQ",
            "floor": "3",
            "room": "301"
          }
        },
        "custodian": {
          "firstName": "John",
          "lastName": "Doe",
          "npk": "EMP001",
          "position": "IT Manager",
          "email": "john@company.com"
        },
        "_count": {
          "loans": 5
        }
      }
    ],
    "pagination": {
      "total": 1,
      "pages": 1,
      "current": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

## Summary

✅ **Implemented:**
- Automatic asset location update on inventory creation
- Automatic asset status update to IN_USE
- Enhanced table view with location details
- Department location display
- Asset location display with mismatch warning
- Custodian information with NPK and position
- Loan count tracking
- Transaction-based updates for data integrity

🎯 **Business Value:**
- Improved asset location accuracy
- Better visibility of inventory status
- Easier tracking of asset custodians
- Quick identification of frequently loaned items
- Automatic data synchronization reduces manual work
