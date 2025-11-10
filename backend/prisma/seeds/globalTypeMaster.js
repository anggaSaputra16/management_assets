const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Human-readable labels for each enum value
const labels = {
  // UserRole
  ADMIN: 'Administrator',
  ASSET_ADMIN: 'Asset Administrator',
  MANAGER: 'Manager',
  DEPARTMENT_USER: 'Department User',
  TECHNICIAN: 'Technician',
  AUDITOR: 'Auditor',
  TOP_MANAGEMENT: 'Top Management',
  
  // AssetStatus
  AVAILABLE: 'Available',
  IN_USE: 'In Use',
  MAINTENANCE: 'Maintenance',
  RETIRED: 'Retired',
  DISPOSED: 'Disposed',
  
  // RequestStatus
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  ALLOCATED: 'Allocated',
  COMPLETED: 'Completed',
  
  // RequestType
  ASSET_REQUEST: 'Asset Request',
  MAINTENANCE_REQUEST: 'Maintenance Request',
  SPARE_PART_REQUEST: 'Spare Part Request',
  SOFTWARE_LICENSE: 'Software License Request',
  ASSET_TRANSFER: 'Asset Transfer',
  ASSET_DISPOSAL: 'Asset Disposal',
  ASSET_BREAKDOWN: 'Asset Breakdown',
  
  // MaintenanceType
  PREVENTIVE: 'Preventive Maintenance',
  CORRECTIVE: 'Corrective Maintenance',
  EMERGENCY: 'Emergency Repair',
  SPARE_PART_REPLACEMENT: 'Spare Part Replacement',
  SOFTWARE_UPDATE: 'Software Update',
  CALIBRATION: 'Calibration',
  
  // MaintenanceStatus
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In Progress',
  CANCELLED: 'Cancelled',
  
  // AuditStatus (same as MaintenanceStatus for some values)
  
  // NotificationType
  REQUEST_APPROVAL: 'Request Approval',
  ASSET_ALLOCATION: 'Asset Allocation',
  MAINTENANCE_DUE: 'Maintenance Due',
  AUDIT_SCHEDULED: 'Audit Scheduled',
  GENERAL: 'General',
  MAINTENANCE_COMPLETED: 'Maintenance Completed',
  REQUEST_REJECTED: 'Request Rejected',
  ASSET_TRANSFERRED: 'Asset Transferred',
  SOFTWARE_LICENSE_EXPIRING: 'Software License Expiring',
  SPARE_PART_LOW_STOCK: 'Spare Part Low Stock',
  MAINTENANCE_OVERDUE: 'Maintenance Overdue',
  ASSET_WARRANTY_EXPIRING: 'Asset Warranty Expiring',
  DECOMPOSITION_COMPLETED: 'Decomposition Completed',
  VENDOR_CONTRACT_EXPIRING: 'Vendor Contract Expiring',
  
  // SparePartType
  COMPONENT: 'Component',
  ACCESSORY: 'Accessory',
  CONSUMABLE: 'Consumable',
  TOOL: 'Tool',
  SOFTWARE: 'Software',
  
  // SparePartStatus
  ACTIVE: 'Active',
  DISCONTINUED: 'Discontinued',
  OUT_OF_STOCK: 'Out of Stock',
  OBSOLETE: 'Obsolete',
  
  // ProcurementStatus
  ORDERED: 'Ordered',
  SHIPPED: 'Shipped',
  RECEIVED: 'Received',
  PARTIALLY_RECEIVED: 'Partially Received',
  
  // PartUsageType
  REPLACEMENT: 'Replacement',
  UPGRADE: 'Upgrade',
  REPAIR: 'Repair',
  INSTALLATION: 'Installation',
  TRANSFER: 'Transfer',
  
  // ReplacementStatus
  PLANNED: 'Planned',
  
  // RegistrationStatus
  REGISTERED: 'Registered',
  
  // ComponentStatus
  INACTIVE: 'Inactive',
  TRANSFERRED: 'Transferred',
  REPLACED: 'Replaced',
  
  // LocationType
  OFFICE: 'Office',
  WAREHOUSE: 'Warehouse',
  FACTORY: 'Factory',
  RETAIL: 'Retail',
  DATA_CENTER: 'Data Center',
  OTHER: 'Other',
  
  // SoftwareType
  OPERATING_SYSTEM: 'Operating System',
  APPLICATION: 'Application',
  UTILITY: 'Utility',
  DRIVER: 'Driver',
  SECURITY: 'Security Software',
  DEVELOPMENT_TOOL: 'Development Tool',
  OFFICE_SUITE: 'Office Suite',
  DATABASE: 'Database',
  MIDDLEWARE: 'Middleware',
  PLUGIN: 'Plugin',
  
  // LicenseType
  PERPETUAL: 'Perpetual License',
  SUBSCRIPTION: 'Subscription',
  OPEN_SOURCE: 'Open Source',
  TRIAL: 'Trial',
  EDUCATIONAL: 'Educational',
  ENTERPRISE: 'Enterprise',
  OEM: 'OEM License',
  VOLUME: 'Volume License',
  
  // LicenseStatus
  EXPIRED: 'Expired',
  SUSPENDED: 'Suspended',
  PENDING_RENEWAL: 'Pending Renewal',
  VIOLATION: 'Violation',
  
  // AttachmentType
  IMAGE: 'Image',
  DOCUMENT: 'Document',
  MANUAL: 'Manual',
  WARRANTY: 'Warranty',
  INVOICE: 'Invoice'
}

const typeMasterData = [
  // UserRole
  { group: 'UserRole', key: 'ADMIN', sortOrder: 1 },
  { group: 'UserRole', key: 'ASSET_ADMIN', sortOrder: 2 },
  { group: 'UserRole', key: 'MANAGER', sortOrder: 3 },
  { group: 'UserRole', key: 'DEPARTMENT_USER', sortOrder: 4 },
  { group: 'UserRole', key: 'TECHNICIAN', sortOrder: 5 },
  { group: 'UserRole', key: 'AUDITOR', sortOrder: 6 },
  { group: 'UserRole', key: 'TOP_MANAGEMENT', sortOrder: 7 },
  
  // AssetStatus
  { group: 'AssetStatus', key: 'AVAILABLE', sortOrder: 1 },
  { group: 'AssetStatus', key: 'IN_USE', sortOrder: 2 },
  { group: 'AssetStatus', key: 'MAINTENANCE', sortOrder: 3 },
  { group: 'AssetStatus', key: 'RETIRED', sortOrder: 4 },
  { group: 'AssetStatus', key: 'DISPOSED', sortOrder: 5 },
  
  // RequestStatus
  { group: 'RequestStatus', key: 'PENDING', sortOrder: 1 },
  { group: 'RequestStatus', key: 'APPROVED', sortOrder: 2 },
  { group: 'RequestStatus', key: 'REJECTED', sortOrder: 3 },
  { group: 'RequestStatus', key: 'ALLOCATED', sortOrder: 4 },
  { group: 'RequestStatus', key: 'COMPLETED', sortOrder: 5 },
  
  // RequestType
  { group: 'RequestType', key: 'ASSET_REQUEST', sortOrder: 1 },
  { group: 'RequestType', key: 'MAINTENANCE_REQUEST', sortOrder: 2 },
  { group: 'RequestType', key: 'SPARE_PART_REQUEST', sortOrder: 3 },
  { group: 'RequestType', key: 'SOFTWARE_LICENSE', sortOrder: 4 },
  { group: 'RequestType', key: 'ASSET_TRANSFER', sortOrder: 5 },
  { group: 'RequestType', key: 'ASSET_DISPOSAL', sortOrder: 6 },
  { group: 'RequestType', key: 'ASSET_BREAKDOWN', sortOrder: 7 },
  
  // MaintenanceType
  { group: 'MaintenanceType', key: 'PREVENTIVE', sortOrder: 1 },
  { group: 'MaintenanceType', key: 'CORRECTIVE', sortOrder: 2 },
  { group: 'MaintenanceType', key: 'EMERGENCY', sortOrder: 3 },
  { group: 'MaintenanceType', key: 'SPARE_PART_REPLACEMENT', sortOrder: 4 },
  { group: 'MaintenanceType', key: 'SOFTWARE_UPDATE', sortOrder: 5 },
  { group: 'MaintenanceType', key: 'CALIBRATION', sortOrder: 6 },
  
  // MaintenanceStatus
  { group: 'MaintenanceStatus', key: 'SCHEDULED', sortOrder: 1 },
  { group: 'MaintenanceStatus', key: 'IN_PROGRESS', sortOrder: 2 },
  { group: 'MaintenanceStatus', key: 'COMPLETED', sortOrder: 3 },
  { group: 'MaintenanceStatus', key: 'CANCELLED', sortOrder: 4 },
  
  // AuditStatus
  { group: 'AuditStatus', key: 'SCHEDULED', sortOrder: 1 },
  { group: 'AuditStatus', key: 'IN_PROGRESS', sortOrder: 2 },
  { group: 'AuditStatus', key: 'COMPLETED', sortOrder: 3 },
  
  // NotificationType
  { group: 'NotificationType', key: 'REQUEST_APPROVAL', sortOrder: 1 },
  { group: 'NotificationType', key: 'ASSET_ALLOCATION', sortOrder: 2 },
  { group: 'NotificationType', key: 'MAINTENANCE_DUE', sortOrder: 3 },
  { group: 'NotificationType', key: 'AUDIT_SCHEDULED', sortOrder: 4 },
  { group: 'NotificationType', key: 'GENERAL', sortOrder: 5 },
  { group: 'NotificationType', key: 'MAINTENANCE_COMPLETED', sortOrder: 6 },
  { group: 'NotificationType', key: 'REQUEST_REJECTED', sortOrder: 7 },
  { group: 'NotificationType', key: 'ASSET_TRANSFERRED', sortOrder: 8 },
  { group: 'NotificationType', key: 'SOFTWARE_LICENSE_EXPIRING', sortOrder: 9 },
  { group: 'NotificationType', key: 'SPARE_PART_LOW_STOCK', sortOrder: 10 },
  { group: 'NotificationType', key: 'MAINTENANCE_OVERDUE', sortOrder: 11 },
  { group: 'NotificationType', key: 'ASSET_WARRANTY_EXPIRING', sortOrder: 12 },
  { group: 'NotificationType', key: 'DECOMPOSITION_COMPLETED', sortOrder: 13 },
  { group: 'NotificationType', key: 'VENDOR_CONTRACT_EXPIRING', sortOrder: 14 },
  
  // SparePartType
  { group: 'SparePartType', key: 'COMPONENT', sortOrder: 1 },
  { group: 'SparePartType', key: 'ACCESSORY', sortOrder: 2 },
  { group: 'SparePartType', key: 'CONSUMABLE', sortOrder: 3 },
  { group: 'SparePartType', key: 'TOOL', sortOrder: 4 },
  { group: 'SparePartType', key: 'SOFTWARE', sortOrder: 5 },
  
  // SparePartStatus
  { group: 'SparePartStatus', key: 'ACTIVE', sortOrder: 1 },
  { group: 'SparePartStatus', key: 'DISCONTINUED', sortOrder: 2 },
  { group: 'SparePartStatus', key: 'OUT_OF_STOCK', sortOrder: 3 },
  { group: 'SparePartStatus', key: 'OBSOLETE', sortOrder: 4 },
  
  // ProcurementStatus
  { group: 'ProcurementStatus', key: 'ORDERED', sortOrder: 1 },
  { group: 'ProcurementStatus', key: 'SHIPPED', sortOrder: 2 },
  { group: 'ProcurementStatus', key: 'RECEIVED', sortOrder: 3 },
  { group: 'ProcurementStatus', key: 'PARTIALLY_RECEIVED', sortOrder: 4 },
  { group: 'ProcurementStatus', key: 'CANCELLED', sortOrder: 5 },
  
  // PartUsageType
  { group: 'PartUsageType', key: 'REPLACEMENT', sortOrder: 1 },
  { group: 'PartUsageType', key: 'UPGRADE', sortOrder: 2 },
  { group: 'PartUsageType', key: 'REPAIR', sortOrder: 3 },
  { group: 'PartUsageType', key: 'INSTALLATION', sortOrder: 4 },
  { group: 'PartUsageType', key: 'MAINTENANCE', sortOrder: 5 },
  { group: 'PartUsageType', key: 'TRANSFER', sortOrder: 6 },
  
  // ReplacementStatus
  { group: 'ReplacementStatus', key: 'PLANNED', sortOrder: 1 },
  { group: 'ReplacementStatus', key: 'IN_PROGRESS', sortOrder: 2 },
  { group: 'ReplacementStatus', key: 'COMPLETED', sortOrder: 3 },
  { group: 'ReplacementStatus', key: 'CANCELLED', sortOrder: 4 },
  
  // RegistrationStatus
  { group: 'RegistrationStatus', key: 'PENDING', sortOrder: 1 },
  { group: 'RegistrationStatus', key: 'APPROVED', sortOrder: 2 },
  { group: 'RegistrationStatus', key: 'REGISTERED', sortOrder: 3 },
  { group: 'RegistrationStatus', key: 'REJECTED', sortOrder: 4 },
  
  // ComponentStatus
  { group: 'ComponentStatus', key: 'ACTIVE', sortOrder: 1 },
  { group: 'ComponentStatus', key: 'INACTIVE', sortOrder: 2 },
  { group: 'ComponentStatus', key: 'MAINTENANCE', sortOrder: 3 },
  { group: 'ComponentStatus', key: 'TRANSFERRED', sortOrder: 4 },
  { group: 'ComponentStatus', key: 'REPLACED', sortOrder: 5 },
  { group: 'ComponentStatus', key: 'DISPOSED', sortOrder: 6 },
  
  // LocationType
  { group: 'LocationType', key: 'OFFICE', sortOrder: 1 },
  { group: 'LocationType', key: 'WAREHOUSE', sortOrder: 2 },
  { group: 'LocationType', key: 'FACTORY', sortOrder: 3 },
  { group: 'LocationType', key: 'RETAIL', sortOrder: 4 },
  { group: 'LocationType', key: 'DATA_CENTER', sortOrder: 5 },
  { group: 'LocationType', key: 'OTHER', sortOrder: 6 },
  
  // SoftwareType
  { group: 'SoftwareType', key: 'OPERATING_SYSTEM', sortOrder: 1 },
  { group: 'SoftwareType', key: 'APPLICATION', sortOrder: 2 },
  { group: 'SoftwareType', key: 'UTILITY', sortOrder: 3 },
  { group: 'SoftwareType', key: 'DRIVER', sortOrder: 4 },
  { group: 'SoftwareType', key: 'SECURITY', sortOrder: 5 },
  { group: 'SoftwareType', key: 'DEVELOPMENT_TOOL', sortOrder: 6 },
  { group: 'SoftwareType', key: 'OFFICE_SUITE', sortOrder: 7 },
  { group: 'SoftwareType', key: 'DATABASE', sortOrder: 8 },
  { group: 'SoftwareType', key: 'MIDDLEWARE', sortOrder: 9 },
  { group: 'SoftwareType', key: 'PLUGIN', sortOrder: 10 },
  
  // LicenseType
  { group: 'LicenseType', key: 'PERPETUAL', sortOrder: 1 },
  { group: 'LicenseType', key: 'SUBSCRIPTION', sortOrder: 2 },
  { group: 'LicenseType', key: 'OPEN_SOURCE', sortOrder: 3 },
  { group: 'LicenseType', key: 'TRIAL', sortOrder: 4 },
  { group: 'LicenseType', key: 'EDUCATIONAL', sortOrder: 5 },
  { group: 'LicenseType', key: 'ENTERPRISE', sortOrder: 6 },
  { group: 'LicenseType', key: 'OEM', sortOrder: 7 },
  { group: 'LicenseType', key: 'VOLUME', sortOrder: 8 },
  
  // LicenseStatus
  { group: 'LicenseStatus', key: 'ACTIVE', sortOrder: 1 },
  { group: 'LicenseStatus', key: 'EXPIRED', sortOrder: 2 },
  { group: 'LicenseStatus', key: 'SUSPENDED', sortOrder: 3 },
  { group: 'LicenseStatus', key: 'CANCELLED', sortOrder: 4 },
  { group: 'LicenseStatus', key: 'PENDING_RENEWAL', sortOrder: 5 },
  { group: 'LicenseStatus', key: 'VIOLATION', sortOrder: 6 },
  
  // AttachmentType
  { group: 'AttachmentType', key: 'IMAGE', sortOrder: 1 },
  { group: 'AttachmentType', key: 'DOCUMENT', sortOrder: 2 },
  { group: 'AttachmentType', key: 'MANUAL', sortOrder: 3 },
  { group: 'AttachmentType', key: 'WARRANTY', sortOrder: 4 },
  { group: 'AttachmentType', key: 'INVOICE', sortOrder: 5 },
  { group: 'AttachmentType', key: 'OTHER', sortOrder: 6 }
]

async function seedGlobalTypeMaster() {
  console.log('🌱 Seeding GlobalTypeMaster...')
  
  let created = 0
  let skipped = 0
  
  for (const data of typeMasterData) {
    const label = labels[data.key] || data.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    
    try {
      await prisma.globalTypeMaster.upsert({
        where: {
          group_key: {
            group: data.group,
            key: data.key
          }
        },
        update: {
          label,
          sortOrder: data.sortOrder,
          isActive: true
        },
        create: {
          group: data.group,
          key: data.key,
          label,
          sortOrder: data.sortOrder,
          isActive: true
        }
      })
      created++
    } catch (error) {
      console.error(`Error seeding ${data.group}.${data.key}:`, error.message)
      skipped++
    }
  }
  
  console.log(`✅ GlobalTypeMaster seeded: ${created} created/updated, ${skipped} skipped`)
  console.log(`📊 Total groups: ${new Set(typeMasterData.map(d => d.group)).size}`)
  console.log(`📊 Total types: ${typeMasterData.length}`)
}

module.exports = { seedGlobalTypeMaster }
