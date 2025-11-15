const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding GlobalTypeMaster data...');

  // Request Types
  const requestTypes = [
    { key: 'MAINTENANCE', label: 'Maintenance Request', description: 'ROUTE_TO_MAINTENANCE - Request for asset maintenance work', sortOrder: 1 },
    { key: 'DECOMPOSITION', label: 'Decomposition Request', description: 'ROUTE_TO_DECOMPOSITION - Request for asset decomposition', sortOrder: 2 },
    { key: 'ASSET_REQUEST', label: 'Asset Request', description: 'General asset request', sortOrder: 3 },
    { key: 'MAINTENANCE_REQUEST', label: 'Maintenance Request (Alt)', description: 'ROUTE_TO_MAINTENANCE - Alternative maintenance request', sortOrder: 4 },
    { key: 'SPARE_PART_REQUEST', label: 'Spare Part Request', description: 'Request for spare parts', sortOrder: 5 },
    { key: 'SOFTWARE_LICENSE', label: 'Software License Request', description: 'Request for software license', sortOrder: 6 },
    { key: 'ASSET_TRANSFER', label: 'Asset Transfer Request', description: 'Request for asset transfer', sortOrder: 7 },
    { key: 'ASSET_DISPOSAL', label: 'Asset Disposal Request', description: 'Request for asset disposal', sortOrder: 8 },
    { key: 'ASSET_BREAKDOWN', label: 'Asset Breakdown Request', description: 'Report asset breakdown', sortOrder: 9 }
  ];

  for (const type of requestTypes) {
    await prisma.globalTypeMaster.upsert({
      where: {
        group_key: {
          group: 'REQUEST_TYPE',
          key: type.key
        }
      },
      update: {
        label: type.label,
        description: type.description,
        sortOrder: type.sortOrder,
        isActive: true
      },
      create: {
        group: 'REQUEST_TYPE',
        key: type.key,
        label: type.label,
        description: type.description,
        sortOrder: type.sortOrder,
        isActive: true
      }
    });
  }
  console.log('✅ REQUEST_TYPE data seeded');

  // Priority Types
  const priorities = [
    { key: 'LOW', label: 'Low Priority', description: 'Low priority request', sortOrder: 1 },
    { key: 'MEDIUM', label: 'Medium Priority', description: 'Medium priority request', sortOrder: 2 },
    { key: 'HIGH', label: 'High Priority', description: 'High priority request', sortOrder: 3 },
    { key: 'URGENT', label: 'Urgent Priority', description: 'Urgent priority request', sortOrder: 4 },
    { key: 'CRITICAL', label: 'Critical Priority', description: 'Critical priority request', sortOrder: 5 }
  ];

  for (const priority of priorities) {
    await prisma.globalTypeMaster.upsert({
      where: {
        group_key: {
          group: 'PRIORITY',
          key: priority.key
        }
      },
      update: {
        label: priority.label,
        description: priority.description,
        sortOrder: priority.sortOrder,
        isActive: true
      },
      create: {
        group: 'PRIORITY',
        key: priority.key,
        label: priority.label,
        description: priority.description,
        sortOrder: priority.sortOrder,
        isActive: true
      }
    });
  }
  console.log('✅ PRIORITY data seeded');

  // Asset Status Types
  const assetStatuses = [
    { key: 'AVAILABLE', label: 'Available', description: 'Asset is available for use', sortOrder: 1 },
    { key: 'IN_USE', label: 'In Use', description: 'Asset is currently in use', sortOrder: 2 },
    { key: 'MAINTENANCE', label: 'Under Maintenance', description: 'Asset is under maintenance', sortOrder: 3 },
    { key: 'RETIRED', label: 'Retired', description: 'Asset is retired', sortOrder: 4 },
    { key: 'DISPOSED', label: 'Disposed', description: 'Asset is disposed', sortOrder: 5 },
    { key: 'LOST', label: 'Lost', description: 'Asset is lost', sortOrder: 6 },
    { key: 'DAMAGED', label: 'Damaged', description: 'Asset is damaged', sortOrder: 7 }
  ];

  for (const status of assetStatuses) {
    await prisma.globalTypeMaster.upsert({
      where: {
        group_key: {
          group: 'ASSET_STATUS',
          key: status.key
        }
      },
      update: {
        label: status.label,
        description: status.description,
        sortOrder: status.sortOrder,
        isActive: true
      },
      create: {
        group: 'ASSET_STATUS',
        key: status.key,
        label: status.label,
        description: status.description,
        sortOrder: status.sortOrder,
        isActive: true
      }
    });
  }
  console.log('✅ ASSET_STATUS data seeded');

  // Maintenance Types
  const maintenanceTypes = [
    { key: 'PREVENTIVE', label: 'Preventive Maintenance', description: 'Scheduled preventive maintenance', sortOrder: 1 },
    { key: 'CORRECTIVE', label: 'Corrective Maintenance', description: 'Corrective maintenance for issues', sortOrder: 2 },
    { key: 'PREDICTIVE', label: 'Predictive Maintenance', description: 'Predictive maintenance based on monitoring', sortOrder: 3 },
    { key: 'EMERGENCY', label: 'Emergency Maintenance', description: 'Emergency maintenance for critical issues', sortOrder: 4 }
  ];

  for (const type of maintenanceTypes) {
    await prisma.globalTypeMaster.upsert({
      where: {
        group_key: {
          group: 'MAINTENANCE_TYPE',
          key: type.key
        }
      },
      update: {
        label: type.label,
        description: type.description,
        sortOrder: type.sortOrder,
        isActive: true
      },
      create: {
        group: 'MAINTENANCE_TYPE',
        key: type.key,
        label: type.label,
        description: type.description,
        sortOrder: type.sortOrder,
        isActive: true
      }
    });
  }
  console.log('✅ MAINTENANCE_TYPE data seeded');

  console.log('🎉 All GlobalTypeMaster data seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
