const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  try {
    const c = await prisma.softwareAsset.count();
    console.log('softwareAsset count', c);
  } catch (e) {
    console.error('ERROR', e && e.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();