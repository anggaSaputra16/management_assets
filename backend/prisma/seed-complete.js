const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ==================== GLOBAL TYPE MASTER DATA ====================
const labels = {
  ADMIN: 'Administrator', ASSET_ADMIN: 'Asset Administrator', MANAGER: 'Manager',
  DEPARTMENT_USER: 'Department User', TECHNICIAN: 'Technician', AUDITOR: 'Auditor',
  TOP_MANAGEMENT: 'Top Management', AVAILABLE: 'Available', IN_USE: 'In Use',
  MAINTENANCE: 'Maintenance', RETIRED: 'Retired', DISPOSED: 'Disposed',
  PENDING: 'Pending', APPROVED: 'Approved', REJECTED: 'Rejected',
  ALLOCATED: 'Allocated', COMPLETED: 'Completed', ASSET_REQUEST: 'Asset Request',
  MAINTENANCE_REQUEST: 'Maintenance Request', SPARE_PART_REQUEST: 'Spare Part Request',
  SOFTWARE_LICENSE: 'Software License Request', ASSET_TRANSFER: 'Asset Transfer',
  ASSET_DISPOSAL: 'Asset Disposal', ASSET_BREAKDOWN: 'Asset Breakdown',
  PREVENTIVE: 'Preventive Maintenance', CORRECTIVE: 'Corrective Maintenance',
  EMERGENCY: 'Emergency Repair', SPARE_PART_REPLACEMENT: 'Spare Part Replacement',
  SOFTWARE_UPDATE: 'Software Update', CALIBRATION: 'Calibration',
  SCHEDULED: 'Scheduled', IN_PROGRESS: 'In Progress', CANCELLED: 'Cancelled',
  REQUEST_APPROVAL: 'Request Approval', ASSET_ALLOCATION: 'Asset Allocation',
  MAINTENANCE_DUE: 'Maintenance Due', AUDIT_SCHEDULED: 'Audit Scheduled',
  GENERAL: 'General', MAINTENANCE_COMPLETED: 'Maintenance Completed',
  REQUEST_REJECTED: 'Request Rejected', ASSET_TRANSFERRED: 'Asset Transferred',
  SOFTWARE_LICENSE_EXPIRING: 'Software License Expiring', SPARE_PART_LOW_STOCK: 'Spare Part Low Stock',
  MAINTENANCE_OVERDUE: 'Maintenance Overdue', ASSET_WARRANTY_EXPIRING: 'Asset Warranty Expiring',
  DECOMPOSITION_COMPLETED: 'Decomposition Completed', VENDOR_CONTRACT_EXPIRING: 'Vendor Contract Expiring',
  COMPONENT: 'Component', ACCESSORY: 'Accessory', CONSUMABLE: 'Consumable',
  TOOL: 'Tool', SOFTWARE: 'Software', ACTIVE: 'Active',
  DISCONTINUED: 'Discontinued', OUT_OF_STOCK: 'Out of Stock', OBSOLETE: 'Obsolete',
  ORDERED: 'Ordered', SHIPPED: 'Shipped', RECEIVED: 'Received',
  PARTIALLY_RECEIVED: 'Partially Received', REPLACEMENT: 'Replacement',
  UPGRADE: 'Upgrade', REPAIR: 'Repair', INSTALLATION: 'Installation',
  TRANSFER: 'Transfer', PLANNED: 'Planned', REGISTERED: 'Registered',
  INACTIVE: 'Inactive', TRANSFERRED: 'Transferred', REPLACED: 'Replaced',
  OFFICE: 'Office', WAREHOUSE: 'Warehouse', FACTORY: 'Factory',
  RETAIL: 'Retail', DATA_CENTER: 'Data Center', OTHER: 'Other',
  OPERATING_SYSTEM: 'Operating System', APPLICATION: 'Application',
  UTILITY: 'Utility', DRIVER: 'Driver', SECURITY: 'Security Software',
  DEVELOPMENT_TOOL: 'Development Tool', OFFICE_SUITE: 'Office Suite',
  DATABASE: 'Database', MIDDLEWARE: 'Middleware', PLUGIN: 'Plugin',
  PERPETUAL: 'Perpetual License', SUBSCRIPTION: 'Subscription',
  OPEN_SOURCE: 'Open Source', TRIAL: 'Trial', EDUCATIONAL: 'Educational',
  ENTERPRISE: 'Enterprise', OEM: 'OEM License', VOLUME: 'Volume License',
  EXPIRED: 'Expired', SUSPENDED: 'Suspended', PENDING_RENEWAL: 'Pending Renewal',
  VIOLATION: 'Violation', IMAGE: 'Image', DOCUMENT: 'Document',
  MANUAL: 'Manual', WARRANTY: 'Warranty', INVOICE: 'Invoice'
};

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
];

async function seedGlobalTypeMaster() {
  console.log('\n🌍 Seeding GlobalTypeMaster...');
  
  let created = 0;
  for (const data of typeMasterData) {
    const label = labels[data.key] || data.key.replace(/_/g, ' ');
    await prisma.globalTypeMaster.upsert({
      where: { group_key: { group: data.group, key: data.key } },
      update: { label, sortOrder: data.sortOrder, isActive: true },
      create: { group: data.group, key: data.key, label, sortOrder: data.sortOrder, isActive: true }
    });
    created++;
  }
  
  console.log(`✅ GlobalTypeMaster: ${created} types seeded`);
}

async function seedSystemSettings() {
  console.log('\n⚙️ Seeding System Settings...');
  
  await prisma.systemSettings.createMany({
    data: [
      { key: 'SYSTEM_NAME', value: 'Asset Management System', description: 'Name of the system' },
      { key: 'DEFAULT_CURRENCY', value: 'IDR', description: 'Default currency' },
      { key: 'ASSET_TAG_PREFIX', value: 'AST', description: 'Prefix for asset tags' },
      { key: 'MAINTENANCE_REMINDER_DAYS', value: '7', description: 'Days before maintenance due' },
      { key: 'AUDIT_REMINDER_DAYS', value: '3', description: 'Days before audit due' }
    ],
    skipDuplicates: true
  });
  
  console.log('✅ System Settings seeded');
}

async function main() {
  console.log('🌱 Starting Complete Database Seeding...\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Global Type Master
    await seedGlobalTypeMaster();
    
    // Step 2: System Settings
    await seedSystemSettings();
    
    // Step 3: CREATE COMPANIES
    console.log('\n🏢 Creating Companies...');
    
    const companies = [];
    const companyData = [
      {
        name: 'PT Maju Jaya Technology',
        code: 'MJT',
        email: 'info@majujaya.co.id',
        phone: '+62215551001',
        address: 'Jl. Sudirman No. 100, Jakarta Pusat 10110',
        website: 'www.majujaya.co.id',
        taxNumber: '01.234.567.8-100.000',
        registrationNumber: 'MJT-2024-001',
        description: 'Technology solutions and IT services company'
      },
      {
        name: 'PT Sentosa Sejahtera',
        code: 'SSJ',
        email: 'contact@sentosa.co.id',
        phone: '+62215552002',
        address: 'Jl. Thamrin No. 50, Jakarta Pusat 10350',
        website: 'www.sentosa.co.id',
        taxNumber: '02.345.678.9-200.000',
        registrationNumber: 'SSJ-2024-002',
        description: 'Manufacturing and distribution company'
      },
      {
        name: 'PT Global Retail Indonesia',
        code: 'GRI',
        email: 'hello@globalretail.co.id',
        phone: '+62215553003',
        address: 'Jl. Gatot Subroto No. 75, Jakarta Selatan 12930',
        website: 'www.globalretail.co.id',
        taxNumber: '03.456.789.0-300.000',
        registrationNumber: 'GRI-2024-003',
        description: 'Retail chain with multiple store locations'
      },
      {
        name: 'PT Nusantara Logistics',
        code: 'NLS',
        email: 'support@nusantara.co.id',
        phone: '+62215554004',
        address: 'Jl. MT Haryono No. 25, Jakarta Timur 13630',
        website: 'www.nusantaralogistics.co.id',
        taxNumber: '04.567.890.1-400.000',
        registrationNumber: 'NLS-2024-004',
        description: 'Logistics and transportation services'
      }
    ];

    for (const data of companyData) {
      const company = await prisma.company.upsert({
        where: { code: data.code },
        update: {},
        create: data
      });
      companies.push(company);
      console.log(`  ✅ ${company.name} (${company.code})`);
    }

    // Step 4: CREATE DEPARTMENTS PER COMPANY
    console.log('\n🏢 Creating Departments...');
    
    const departmentsByCompany = {};
    const departmentTemplates = [
      { name: 'Information Technology', code: 'IT', budgetLimit: 1000000000 },
      { name: 'Human Resources', code: 'HR', budgetLimit: 500000000 },
      { name: 'Finance & Accounting', code: 'FIN', budgetLimit: 800000000 },
      { name: 'Operations', code: 'OPS', budgetLimit: 1500000000 },
      { name: 'Marketing & Sales', code: 'MKT', budgetLimit: 700000000 }
    ];
    
    for (const company of companies) {
      departmentsByCompany[company.id] = [];
      for (const template of departmentTemplates) {
        const dept = await prisma.department.upsert({
          where: { companyId_code: { companyId: company.id, code: template.code } },
          update: {},
          create: {
            name: template.name,
            code: template.code,
            description: `${template.name} Department`,
            budgetLimit: template.budgetLimit,
            companyId: company.id
          }
        });
        departmentsByCompany[company.id].push(dept);
      }
      console.log(`  ✅ ${company.code}: ${departmentTemplates.length} departments`);
    }

    // Step 5: CREATE LOCATIONS PER COMPANY
    console.log('\n📍 Creating Locations...');
    
    const locationsByCompany = {};
    const locationTemplates = {
      'MJT': [
        { name: 'Head Office', building: 'Tower A', floor: '10', city: 'Jakarta', type: 'OFFICE' },
        { name: 'Data Center', building: 'Tower B', floor: '5', city: 'Jakarta', type: 'DATA_CENTER' },
        { name: 'Warehouse', building: 'WH-1', floor: '1', city: 'Bekasi', type: 'WAREHOUSE' }
      ],
      'SSJ': [
        { name: 'Factory Karawang', building: 'Plant 1', floor: '1', city: 'Karawang', type: 'FACTORY' },
        { name: 'Main Office', building: 'Office Tower', floor: '8', city: 'Jakarta', type: 'OFFICE' },
        { name: 'Distribution Center', building: 'DC Building', floor: '1', city: 'Tangerang', type: 'WAREHOUSE' }
      ],
      'GRI': [
        { name: 'Store Senayan City', building: 'Mall Senayan', floor: '2', city: 'Jakarta', type: 'RETAIL' },
        { name: 'Store Plaza Indonesia', building: 'PI Building', floor: '3', city: 'Jakarta', type: 'RETAIL' },
        { name: 'Head Office', building: 'Office Tower', floor: '12', city: 'Jakarta', type: 'OFFICE' },
        { name: 'Warehouse Cibitung', building: 'WH Main', floor: '1', city: 'Bekasi', type: 'WAREHOUSE' }
      ],
      'NLS': [
        { name: 'Main Hub Jakarta', building: 'Hub A', floor: '1', city: 'Jakarta', type: 'WAREHOUSE' },
        { name: 'Hub Surabaya', building: 'Hub B', floor: '1', city: 'Surabaya', type: 'WAREHOUSE' },
        { name: 'Office Pusat', building: 'HQ Building', floor: '7', city: 'Jakarta', type: 'OFFICE' }
      ]
    };

    for (const company of companies) {
      const templates = locationTemplates[company.code];
      locationsByCompany[company.id] = [];
      for (const template of templates) {
        const loc = await prisma.location.upsert({
          where: {
            companyId_name: {
              companyId: company.id,
              name: template.name
            }
          },
          update: {},
          create: {
            name: template.name,
            building: template.building,
            floor: template.floor,
            room: null,
            address: `${template.building}, ${template.city}`,
            city: template.city,
            description: `${template.type} location`,
            type: template.type,
            companyId: company.id
          }
        });
        locationsByCompany[company.id].push(loc);
      }
      console.log(`  ✅ ${company.code}: ${templates.length} locations`);
    }

    // Step 6: CREATE CATEGORIES PER COMPANY
    console.log('\n📁 Creating Categories...');
    
    const categoriesByCompany = {};
    const categoryTemplates = [
      { name: 'Computer & Laptop', code: 'COMP' },
      { name: 'Office Furniture', code: 'FURN' },
      { name: 'Network Equipment', code: 'NET' },
      { name: 'Vehicle', code: 'VEH' },
      { name: 'Building', code: 'BLDG' }
    ];

    for (const company of companies) {
      categoriesByCompany[company.id] = [];
      for (const template of categoryTemplates) {
        const cat = await prisma.category.upsert({
          where: { companyId_code: { companyId: company.id, code: template.code } },
          update: {},
          create: {
            name: template.name,
            code: template.code,
            description: `Category for ${template.name}`,
            companyId: company.id
          }
        });
        categoriesByCompany[company.id].push(cat);
      }
      console.log(`  ✅ ${company.code}: ${categoryTemplates.length} categories`);
    }

    // Step 7: CREATE VENDORS PER COMPANY
    console.log('\n🏪 Creating Vendors...');
    
    const vendorsByCompany = {};
    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      vendorsByCompany[company.id] = [];
      
      const vendorData = [
        {
          name: `${company.name} - Tech Supplier`,
          code: `${company.code}-VEN001`,
          email: `vendor1@${company.code.toLowerCase()}.supplier.com`,
          phone: `+6221555${1001 + i}`,
          address: `Jl. Vendor ${i+1} No. 10, Jakarta`,
          contactPerson: 'John Doe',
          companyId: company.id
        },
        {
          name: `${company.name} - Office Solutions`,
          code: `${company.code}-VEN002`,
          email: `vendor2@${company.code.toLowerCase()}.supplier.com`,
          phone: `+6221555${2001 + i}`,
          address: `Jl. Vendor ${i+1} No. 20, Jakarta`,
          contactPerson: 'Jane Smith',
          companyId: company.id
        }
      ];
      
      for (const data of vendorData) {
        const vendor = await prisma.vendor.upsert({
          where: { companyId_code: { companyId: company.id, code: data.code } },
          update: {},
          create: data
        });
        vendorsByCompany[company.id].push(vendor);
      }
      console.log(`  ✅ ${company.code}: 2 vendors`);
    }

    // Step 8: CREATE EMPLOYEES PER COMPANY
    console.log('\n👤 Creating Employees...');
    
    const employeesByCompany = {};
    for (const company of companies) {
      const itDept = departmentsByCompany[company.id].find(d => d.code === 'IT');
      employeesByCompany[company.id] = [];
      
      for (let i = 1; i <= 5; i++) {
        const emp = await prisma.employee.upsert({
          where: { npk: `${company.code}-EMP${String(i).padStart(3, '0')}` },
          update: {},
          create: {
            npk: `${company.code}-EMP${String(i).padStart(3, '0')}`,
            firstName: `Employee`,
            lastName: `${i}`,
            email: `employee${i}@${company.code.toLowerCase()}.com`,
            phone: `+628123456${i}00`,
            departmentId: itDept.id,
            companyId: company.id,
            position: 'Staff',
            isActive: true
          }
        });
        employeesByCompany[company.id].push(emp);
      }
      console.log(`  ✅ ${company.code}: 5 employees`);
    }

    // Step 9: CREATE USERS PER COMPANY
    console.log('\n👥 Creating Users...');
    
    const hashedPassword = await bcrypt.hash('password123', 12);
    const usersByCompany = {};

    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      const itDept = departmentsByCompany[company.id].find(d => d.code === 'IT');
      const hrDept = departmentsByCompany[company.id].find(d => d.code === 'HR');
      const finDept = departmentsByCompany[company.id].find(d => d.code === 'FIN');
      
      usersByCompany[company.id] = [];
      
      const users = [
        {
          email: `admin@${company.code.toLowerCase()}.com`,
          username: `admin_${company.code.toLowerCase()}`,
          password: hashedPassword,
          firstName: 'Admin',
          lastName: company.code,
          role: 'ADMIN',
          phone: `+62812${1000 + i}001`,
          employeeNumber: `${company.code}-ADM001`,
          companyId: company.id
        },
        {
          email: `asset.admin@${company.code.toLowerCase()}.com`,
          username: `assetadmin_${company.code.toLowerCase()}`,
          password: hashedPassword,
          firstName: 'Asset',
          lastName: 'Admin',
          role: 'ASSET_ADMIN',
          departmentId: itDept.id,
          phone: `+62812${1000 + i}002`,
          employeeNumber: `${company.code}-ASA001`,
          companyId: company.id
        },
        {
          email: `manager@${company.code.toLowerCase()}.com`,
          username: `manager_${company.code.toLowerCase()}`,
          password: hashedPassword,
          firstName: 'IT',
          lastName: 'Manager',
          role: 'MANAGER',
          departmentId: itDept.id,
          phone: `+62812${1000 + i}003`,
          employeeNumber: `${company.code}-MGR001`,
          companyId: company.id
        },
        {
          email: `user@${company.code.toLowerCase()}.com`,
          username: `user_${company.code.toLowerCase()}`,
          password: hashedPassword,
          firstName: 'Department',
          lastName: 'User',
          role: 'DEPARTMENT_USER',
          departmentId: hrDept.id,
          phone: `+62812${1000 + i}004`,
          employeeNumber: `${company.code}-USR001`,
          companyId: company.id
        },
        {
          email: `tech@${company.code.toLowerCase()}.com`,
          username: `tech_${company.code.toLowerCase()}`,
          password: hashedPassword,
          firstName: 'Technician',
          lastName: company.code,
          role: 'TECHNICIAN',
          departmentId: itDept.id,
          phone: `+62812${1000 + i}005`,
          employeeNumber: `${company.code}-TEC001`,
          companyId: company.id
        }
      ];

      for (const userData of users) {
        const user = await prisma.user.upsert({
          where: { employeeNumber: userData.employeeNumber },
          update: {},
          create: userData
        });
        usersByCompany[company.id].push(user);
      }
      console.log(`  ✅ ${company.code}: 5 users created`);
    }

    // Step 10: CREATE ASSETS PER COMPANY
    console.log('\n💼 Creating Assets...');
    
    for (const company of companies) {
      const compCategory = categoriesByCompany[company.id].find(c => c.code === 'COMP');
      const furnCategory = categoriesByCompany[company.id].find(c => c.code === 'FURN');
      const location = locationsByCompany[company.id][0];
      const itDept = departmentsByCompany[company.id].find(d => d.code === 'IT');
      const vendor = vendorsByCompany[company.id][0];
      
      for (let i = 1; i <= 10; i++) {
        const category = i % 2 === 0 ? compCategory : furnCategory;
        const assetTag = `${company.code}-AST-${String(i).padStart(4, '0')}`;
        
        await prisma.asset.upsert({
          where: { assetTag },
          update: {},
          create: {
            assetTag,
            name: i % 2 === 0 ? `Laptop Dell ${i}` : `Office Desk ${i}`,
            categoryId: category.id,
            locationId: location.id,
            departmentId: itDept.id,
            status: i <= 5 ? 'AVAILABLE' : 'IN_USE',
            purchaseDate: new Date('2024-01-15'),
            purchasePrice: i % 2 === 0 ? 15000000 : 2500000,
            currentValue: i % 2 === 0 ? 12000000 : 2000000,
            vendorId: vendor.id,
            warrantyExpiry: new Date('2026-01-15'),
            companyId: company.id
          }
        });
      }
      console.log(`  ✅ ${company.code}: 10 assets`);
    }

    // Step 11: CREATE SPARE PARTS
    console.log('\n🔧 Creating Spare Parts...');
    
    for (const company of companies) {
      const location = locationsByCompany[company.id].find(l => l.type === 'WAREHOUSE');
      
      const sparePartCategories = ['HARDWARE', 'HARDWARE', 'ACCESSORY', 'CONSUMABLE', 'HARDWARE'];
      const sparePartNames = ['RAM DDR4 8GB', 'SSD 512GB', 'Mouse Wireless', 'Printer Toner', 'Network Cable'];
      
      for (let i = 1; i <= 5; i++) {
        const partNumber = `${company.code}-SP-${String(i).padStart(4, '0')}`;
        await prisma.sparePart.upsert({
          where: { 
            companyId_partNumber: {
              companyId: company.id,
              partNumber
            }
          },
          update: {},
          create: {
            partNumber,
            name: sparePartNames[i-1],
            description: `Spare part for ${sparePartNames[i-1]}`,
            partType: 'COMPONENT',
            category: sparePartCategories[i-1],
            stockLevel: 50,
            minStockLevel: 10,
            maxStockLevel: 100,
            reorderPoint: 20,
            unitPrice: 500000 * i,
            storageLocation: location.id,
            status: 'ACTIVE',
            companyId: company.id
          }
        });
      }
      console.log(`  ✅ ${company.code}: 5 spare parts`);
    }

    // Step 12: CREATE SOFTWARE ASSETS
    console.log('\n💿 Creating Software Assets...');
    
    const softwareTemplates = [
      { name: 'Microsoft Office 365', version: '2024', type: 'OFFICE_SUITE', publisher: 'Microsoft' },
      { name: 'Windows 11 Pro', version: '22H2', type: 'OPERATING_SYSTEM', publisher: 'Microsoft' },
      { name: 'Adobe Photoshop', version: '2024', type: 'APPLICATION', publisher: 'Adobe Inc.' }
    ];
    
    for (const company of companies) {
      for (const template of softwareTemplates) {
        const software = await prisma.softwareAsset.create({
          data: {
            name: template.name,
            version: template.version,
            softwareType: template.type,
            publisher: template.publisher,
            description: `${template.name} software license`,
            isActive: true,
            companyId: company.id
          }
        });
        
        // Create license
        await prisma.softwareLicense.create({
          data: {
            softwareAssetId: software.id,
            licenseKey: `${template.name.replace(/\s+/g, '-').toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            licenseType: 'VOLUME',
            status: 'ACTIVE',
            totalSeats: 10,
            isActive: true,
            companyId: company.id,
            purchaseDate: new Date('2024-01-01'),
            expiryDate: new Date('2025-12-31')
          }
        });
      }
      console.log(`  ✅ ${company.code}: 3 software assets with licenses`);
    }

    // Step 13: CREATE MAINTENANCE RECORDS
    console.log('\n🔨 Creating Maintenance Records...');
    
    for (const company of companies) {
      const assets = await prisma.asset.findMany({
        where: { companyId: company.id, status: 'IN_USE' },
        take: 3
      });
      
      const technician = usersByCompany[company.id].find(u => u.role === 'TECHNICIAN');
      
      for (let idx = 0; idx < assets.length; idx++) {
        const asset = assets[idx];
        const maintenanceNumber = `${company.code}-MAINT-${String(idx + 1).padStart(4, '0')}`;
        await prisma.maintenanceRecord.upsert({
          where: { maintenanceNumber },
          update: {},
          create: {
            maintenanceNumber,
            title: `Preventive Maintenance for ${asset.name}`,
            description: 'Scheduled preventive maintenance check',
            assetId: asset.id,
            maintenanceType: 'PREVENTIVE',
            scheduledDate: new Date('2024-12-01'),
            status: 'SCHEDULED',
            technicianId: technician.id,
            priority: 'MEDIUM',
            estimatedCost: 500000,
            companyId: company.id
          }
        });
      }
      console.log(`  ✅ ${company.code}: ${assets.length} maintenance records`);
    }

    // Step 14: CREATE ASSET REQUESTS
    console.log('\n📝 Creating Asset Requests...');
    
    for (const company of companies) {
      const user = usersByCompany[company.id].find(u => u.role === 'DEPARTMENT_USER');
      const itDept = departmentsByCompany[company.id].find(d => d.code === 'IT');
      
      const requestNumber = `${company.code}-REQ-0001`;
      await prisma.assetRequest.upsert({
        where: { requestNumber },
        update: {},
        create: {
          requestNumber,
          requestType: 'ASSET_REQUEST',
          status: 'PENDING',
          priority: 'MEDIUM',
          title: 'Request New Laptop',
          description: 'Need a new laptop for development work',
          justification: 'Current laptop is old and needs replacement for better productivity',
          requester: { connect: { id: user.id } },
          department: { connect: { id: itDept.id } },
          company: { connect: { id: company.id } }
        }
      });
      console.log(`  ✅ ${company.code}: 1 asset request`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!\n');
    console.log('📊 Summary:');
    console.log(`  - ${companies.length} Companies`);
    console.log(`  - ${companies.length * 5} Departments`);
    console.log(`  - ${Object.values(locationsByCompany).flat().length} Locations`);
    console.log(`  - ${companies.length * 5} Categories`);
    console.log(`  - ${companies.length * 2} Vendors`);
    console.log(`  - ${companies.length * 5} Employees`);
    console.log(`  - ${companies.length * 5} Users`);
    console.log(`  - ${companies.length * 10} Assets`);
    console.log(`  - ${companies.length * 5} Spare Parts`);
    console.log(`  - ${companies.length * 3} Software Assets with Licenses`);
    
    console.log('\n🔐 Test Credentials (for each company):');
    console.log('  Admin: admin@[company].com / password123');
    console.log('  Asset Admin: asset.admin@[company].com / password123');
    console.log('  Manager: manager@[company].com / password123');
    console.log('  User: user@[company].com / password123');
    console.log('  Technician: tech@[company].com / password123');
    console.log('\n  Companies: mjt, ssj, gri, nls\n');

  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
