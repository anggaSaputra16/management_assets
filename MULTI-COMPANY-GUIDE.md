# Multi-Company Implementation Guide

## Overview

Sistem ini telah di-refactor untuk mendukung konsep **multi-company** dengan strict isolation. Setiap request, form, dan data list/table otomatis menyertakan dan memfilter berdasarkan `companyId` user yang sedang login.

## Architecture Pattern

### 1. **Backend Multi-Company Support**

#### Middleware Enhancement (`backend/src/middleware/auth.js`)
- Auto-inject `companyId` ke semua request body
- Validasi company context pada setiap protected route
- Ensure user hanya bisa akses data company-nya sendiri

```javascript
// Middleware otomatis menambah companyId
req.body.companyId = req.user.companyId
```

#### Route & Controller Pattern
- Semua controller sudah di-update untuk validasi dan filter berdasarkan `companyId`
- Query database selalu include `WHERE companyId = ?`
- Validation schema (Joi) sudah include `companyId` sebagai field wajib

```javascript
// Example: assets.js
const schema = Joi.object({
  name: Joi.string().required(),
  // ... other fields
  companyId: Joi.number().required()
})

// Query selalu filtered by company
const assets = await prisma.asset.findMany({
  where: { companyId: req.user.companyId }
})
```

### 2. **Frontend Multi-Company Support**

#### API Service Layer (`frontend/src/lib/api.ts`)
- Axios interceptor otomatis inject `companyId` ke semua request
- Error handling untuk company context issues
- Auto-logout jika company validation gagal

```javascript
// Auto-inject companyId to all requests
api.interceptors.request.use((config) => {
  const user = useAuthStore.getState().user
  if (user?.companyId) {
    config.headers['X-Company-ID'] = user.companyId
    // Also inject to request body for POST/PUT
    if (['post', 'put', 'patch'].includes(config.method)) {
      config.data = { ...config.data, companyId: user.companyId }
    }
  }
  return config
})
```

#### Service Layer Pattern
Semua service di `frontend/src/lib/services/` sudah di-update dengan:
- Comment yang menjelaskan bahwa `companyId` auto-injected
- Tidak perlu manual tambah `companyId` di service calls
- Backend handle filtering dan validation

```javascript
// Example: assetService.js
export const assetService = {
  // Create new asset - companyId auto-injected
  createAsset: async (assetData) => {
    const response = await api.post('/assets', assetData)
    return response.data
  },
  // Get all assets - companyId auto-injected by api interceptor
  getAllAssets: async (params = {}) => {
    const response = await api.get('/assets', { params })
    return response.data
  }
}
```

#### Store Layer Pattern (`frontend/src/stores/`)
- Semua TypeScript interfaces sudah include `companyId: number`
- Form data interfaces **TIDAK** include `companyId` (auto-injected)
- Store logic tidak perlu manual handling `companyId`

```typescript
// Example: assetStore.ts
interface Asset {
  id: number
  name: string
  // ... other fields
  companyId: number // Added for multi-company support
}

interface AssetState {
  formData: {
    name: string
    description: string
    // companyId will be auto-injected by API interceptor
  }
}
```

### 3. **Utility Functions**

#### Company Context Utility (`frontend/src/lib/utils/companyContext.ts`)
Helper functions untuk multi-company operations:

```typescript
import { useCompanyContext } from '@/lib/utils/companyContext'

const { companyId, validateCompany, belongsToCompany } = useCompanyContext()

// Validate company context before operations
validateCompany() // Throws error if no company context

// Check if item belongs to current company (client-side validation)
const isOwnAsset = belongsToCompany(asset)
```

## Implementation Patterns

### 1. **Form Components**

```jsx
// ✅ CORRECT Pattern
const AssetForm = () => {
  const { companyId, validateCompany } = useCompanyContext()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    // ❌ DON'T include companyId here - auto-injected
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    validateCompany() // Validate before submit
    
    // API call - companyId auto-injected by interceptor
    await assetService.createAsset(formData)
  }

  // Guard clause - only show form if user has company context
  if (!companyId) {
    return <div>Access denied: No company context</div>
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* NO hidden companyId input needed */}
      <input 
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
      />
    </form>
  )
}
```

### 2. **List/Table Components**

```jsx
// ✅ CORRECT Pattern  
const AssetList = () => {
  const { companyId } = useCompanyContext()
  const [assets, setAssets] = useState([])

  const fetchAssets = async () => {
    // API call - backend will filter by companyId automatically
    const response = await assetService.getAllAssets()
    setAssets(response.data) // Already filtered by backend
  }

  useEffect(() => {
    if (companyId) {
      fetchAssets()
    }
  }, [companyId])

  // Guard clause
  if (!companyId) {
    return <div>Access denied: No company context</div>
  }

  return (
    <div>
      {assets.map(asset => (
        <div key={asset.id}>
          {asset.name}
          {/* Optional: Show companyId for debugging */}
          <small>Company: {asset.companyId}</small>
        </div>
      ))}
    </div>
  )
}
```

### 3. **API Calls Pattern**

```javascript
// ✅ CORRECT - Service calls
await assetService.createAsset({
  name: 'Laptop',
  description: 'Dell Laptop'
  // ❌ DON'T manually add companyId
})

// ✅ CORRECT - Direct API calls  
await api.post('/assets', {
  name: 'Laptop',
  description: 'Dell Laptop'
  // ❌ DON'T manually add companyId - interceptor handles it
})

// ✅ CORRECT - GET requests
await api.get('/assets') // Backend filters by companyId
await api.get('/assets/123') // Backend validates companyId ownership
```

## Files Updated for Multi-Company Support

### Backend Files
- ✅ `backend/src/middleware/auth.js` - Enhanced with company validation & auto-injection
- ✅ `backend/src/routes/users.js` - Company filtering & validation
- ✅ `backend/src/routes/departments.js` - Company filtering & validation  
- ✅ `backend/src/routes/categories.js` - Company filtering & validation
- ✅ `backend/src/routes/locations.js` - Company filtering & validation
- ✅ `backend/src/routes/vendors.js` - Company filtering & validation
- ✅ `backend/src/routes/assets.js` - Company filtering & validation
- ✅ `backend/src/routes/requests.js` - Company filtering & validation
- ✅ `backend/src/routes/maintenance.js` - Company filtering & validation
- ✅ `backend/src/routes/audit.js` - Company filtering & validation
- ✅ `backend/src/routes/notifications.js` - Company filtering & validation
- ✅ `backend/src/routes/inventory.js` - Company filtering & validation
- ✅ `backend/src/routes/reports.js` - Company filtering & validation
- ✅ `backend/src/routes/assetDepreciation.js` - Company filtering & validation
- ✅ `backend/src/routes/assetTransfer.js` - Company filtering & validation
- ✅ `backend/src/routes/qrCode.js` - Company filtering & validation

### Frontend Files
- ✅ `frontend/src/lib/api.ts` - Auto-inject companyId interceptor
- ✅ `frontend/src/types/index.ts` - Updated interfaces with companyId
- ✅ `frontend/src/lib/services/` - All service files updated with multi-company comments
- ✅ `frontend/src/stores/` - All store TypeScript interfaces updated with companyId
- ✅ `frontend/src/lib/utils/companyContext.ts` - Company context utility functions
- ✅ `frontend/src/components/examples/MultiCompanyFormExample.tsx` - Implementation examples

## Key Benefits

1. **Strict Isolation**: User hanya bisa akses data company-nya sendiri
2. **Automatic Context**: Tidak perlu manual inject `companyId` di setiap request
3. **Reusable Pattern**: Pattern yang konsisten di semua component/service
4. **Type Safety**: TypeScript interfaces yang konsisten dengan `companyId`
5. **Security**: Backend validation memastikan company context yang benar

## Development Guidelines

### ✅ DO:
- Use company context utility functions
- Let API interceptor handle `companyId` injection
- Add guard clauses untuk company context validation
- Include `companyId` di TypeScript interfaces
- Let backend handle filtering berdasarkan company

### ❌ DON'T:
- Manual inject `companyId` di form data atau API calls
- Include `companyId` sebagai visible form field  
- Client-side filtering berdasarkan company (backend handles it)
- Hardcode company values
- Skip company context validation

## Testing Multi-Company Isolation

1. **Login dengan user dari company berbeda**
2. **Verify data filtering**: User hanya melihat data company-nya
3. **Test API calls**: Semua request include `companyId` header
4. **Test form submissions**: Company validation berjalan
5. **Test unauthorized access**: User tidak bisa akses data company lain

## Next Steps

Dengan pattern ini, semua existing dan future components akan secara otomatis mendukung multi-company isolation tanpa perlu manual handling `companyId` di setiap komponen.