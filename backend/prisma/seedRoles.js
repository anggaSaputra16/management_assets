const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedRoles() {
  console.log('🔐 Seeding default roles...');

  const systemRoles = [
    {
      name: 'Administrator',
      code: 'ADMIN',
      description: 'Full system access with all permissions',
      permissions: [
        'ASSET_CREATE', 'ASSET_READ', 'ASSET_UPDATE', 'ASSET_DELETE',
        'USER_CREATE', 'USER_READ', 'USER_UPDATE', 'USER_DELETE',
        'MAINTENANCE_CREATE', 'MAINTENANCE_READ', 'MAINTENANCE_UPDATE', 'MAINTENANCE_DELETE',
        'REQUEST_CREATE', 'REQUEST_APPROVE',
        'REPORT_VIEW', 'AUDIT_VIEW'
      ],
      isSystemRole: true,
      companyId: null
    },
    {
      name: 'Asset Administrator',
      code: 'ASSET_ADMIN',
      description: 'Manage all assets and asset-related operations',
      permissions: [
        'ASSET_CREATE', 'ASSET_READ', 'ASSET_UPDATE', 'ASSET_DELETE',
        'MAINTENANCE_CREATE', 'MAINTENANCE_READ', 'MAINTENANCE_UPDATE',
        'REQUEST_CREATE', 'REQUEST_APPROVE',
        'REPORT_VIEW'
      ],
      isSystemRole: true,
      companyId: null
    },
    {
      name: 'Manager',
      code: 'MANAGER',
      description: 'Department manager with approval rights',
      permissions: [
        'ASSET_READ',
        'MAINTENANCE_READ',
        'REQUEST_CREATE', 'REQUEST_APPROVE',
        'REPORT_VIEW'
      ],
      isSystemRole: true,
      companyId: null
    },
    {
      name: 'Department User',
      code: 'DEPARTMENT_USER',
      description: 'Standard user with basic access',
      permissions: [
        'ASSET_READ',
        'MAINTENANCE_READ',
        'REQUEST_CREATE'
      ],
      isSystemRole: true,
      companyId: null
    },
    {
      name: 'Technician',
      code: 'TECHNICIAN',
      description: 'Technical staff for maintenance operations',
      permissions: [
        'ASSET_READ',
        'MAINTENANCE_CREATE', 'MAINTENANCE_READ', 'MAINTENANCE_UPDATE',
        'REQUEST_CREATE'
      ],
      isSystemRole: true,
      companyId: null
    },
    {
      name: 'Auditor',
      code: 'AUDITOR',
      description: 'Audit and compliance staff',
      permissions: [
        'ASSET_READ',
        'MAINTENANCE_READ',
        'REPORT_VIEW',
        'AUDIT_VIEW'
      ],
      isSystemRole: true,
      companyId: null
    },
    {
      name: 'Top Management',
      code: 'TOP_MANAGEMENT',
      description: 'Executive level with full visibility',
      permissions: [
        'ASSET_READ',
        'MAINTENANCE_READ',
        'REPORT_VIEW',
        'AUDIT_VIEW'
      ],
      isSystemRole: true,
      companyId: null
    }
  ];

  for (const roleData of systemRoles) {
    // Check if role already exists
    const existingRole = await prisma.role.findFirst({
      where: {
        code: roleData.code,
        companyId: null
      }
    });

    if (existingRole) {
      console.log(`  ⏭️  ${roleData.name} (${roleData.code}) - already exists`);
      continue;
    }

    const role = await prisma.role.create({
      data: roleData
    });
    console.log(`  ✅ ${role.name} (${role.code})`);
  }

  console.log('✅ Default roles seeded successfully!\n');
}

async function main() {
  try {
    await seedRoles();
  } catch (error) {
    console.error('Error seeding roles:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
