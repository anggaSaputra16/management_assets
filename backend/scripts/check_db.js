const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function safeCount(modelName, countFn) {
  try {
    const c = await countFn();
    console.log(`${modelName}:`, c);
  } catch (err) {
    console.log(`${modelName}: error or model missing -`, err.message.split('\n')[0]);
  }
}

async function main() {
  console.log('Checking database counts...');

  await safeCount('Company', () => prisma.company.count());
  await safeCount('User', () => prisma.user.count());
  await safeCount('Asset', () => prisma.asset.count());
  await safeCount('Category', () => prisma.category.count());
  await safeCount('SparePart', () => prisma.sparePart.count());
  await safeCount('MaintenanceRecord', () => prisma.maintenanceRecord.count());
  await safeCount('AssetRequest', () => prisma.assetRequest.count());
  await safeCount('Notification', () => prisma.notification.count());
  await safeCount('Inventory', () => prisma.inventory.count());

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Unhandled error:', e);
  prisma.$disconnect();
  process.exit(1);
});
