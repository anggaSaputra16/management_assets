export interface User {
  id: string
  email: string
  name: string
  firstName?: string
  lastName: string
  username?: string
  role: 'ADMIN' | 'ASSET_ADMIN' | 'MANAGER' | 'DEPARTMENT_USER' | 'TECHNICIAN' | 'AUDITOR' | 'TOP_MANAGEMENT'
  department?: string
  departmentId?: string
  companyId: string
  company?: Company
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Company {
  id: string
  name: string
  description?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Asset {
  id: string
  name: string
  description?: string
  serialNumber?: string
  assetTag: string
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'RETIRED' | 'LOST'
  condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
  purchaseDate?: string
  purchasePrice?: number
  currentValue?: number
  warrantyExpiry?: string
  
  // Multi-company support
  companyId: string
  company?: Company
  
  // Relations - ID fields
  categoryId: string
  locationId: string
  departmentId?: string
  vendorId?: string
  assignedToId?: string
  
  // Relations - object fields
  category?: Category
  location?: Location
  vendor?: Vendor
  assignedUser?: User
  department?: Department
  
  // Additional fields
  model?: string
  brand?: string
  poNumber?: string
  depreciationRate?: number
  qrCode?: string
  qrCodeImage?: string
  imageUrl?: string
  specifications?: Record<string, string>
  
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  description?: string
  color: string
  parentId?: string
  parent?: Category
  companyId: string
  company?: Company
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Location {
  id: string
  name: string
  address?: string
  description?: string
  building?: string
  floor?: string
  room?: string
  companyId: string
  company?: Company
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Department {
  id: string
  name: string
  description?: string
  code: string
  budget?: number
  parentId?: string
  parent?: Department
  managerId?: string
  manager?: User
  companyId: string
  company?: Company
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Vendor {
  id: string
  name: string
  code: string
  contactPerson?: string
  email?: string
  phone?: string
  address?: string
  website?: string
  companyId: string
  company?: Company
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface MaintenanceRecord {
  id: string
  asset: Asset
  type: 'PREVENTIVE' | 'CORRECTIVE' | 'EMERGENCY'
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  scheduledDate: string
  completedDate?: string
  description: string
  notes?: string
  cost?: number
  technician?: User
  vendor?: Vendor
  createdAt: string
  updatedAt: string
}

export interface AssetRequest {
  id: string
  type: 'NEW_ASSET' | 'TRANSFER' | 'MAINTENANCE' | 'DISPOSAL'
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  description: string
  justification?: string
  requestedBy: User
  approvedBy?: User
  asset?: Asset
  requestedDate: string
  approvedDate?: string
  completedDate?: string
  budget?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Notification {
  id: string
  title: string
  message: string
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS'
  isRead: boolean
  userId: string
  createdAt: string
  updatedAt: string
}

export interface AuditLog {
  id: string
  action: string
  entityType: string
  entityId: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  user: User
  ipAddress?: string
  userAgent?: string
  createdAt: string
}

export interface DashboardStats {
  totalAssets: number
  availableAssets: number
  inUseAssets: number
  maintenanceAssets: number
  pendingRequests: number
  overdueMaintenances: number
  totalUsers: number
  recentActivities: AuditLog[]
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data?: T
  error?: string
  meta?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filter?: Record<string, unknown>
}

export interface FormData {
  [key: string]: unknown
}

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  render?: (value: unknown, item: unknown) => React.ReactNode
}

export interface TableProps {
  columns: TableColumn[]
  data: unknown[]
  loading?: boolean
  pagination?: {
    page: number
    limit: number
    total: number
    onPageChange: (page: number) => void
    onLimitChange: (limit: number) => void
  }
  onSort?: (column: string, direction: 'asc' | 'desc') => void
  onRowClick?: (item: unknown) => void
}
