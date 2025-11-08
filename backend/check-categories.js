const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCategories() {
  const categories = await prisma.category.findMany({
    select: { code: true, name: true, companyId: true }
  });
  
  console.log('All categories:');
  categories.forEach(cat => {
    console.log(`  ${cat.code} - ${cat.name}`);
  });
  
  const hardwareCategories = await prisma.category.findMany({
    where: {
      OR: [
        { code: { contains: 'HARDWARE', mode: 'insensitive' } },
        { name: { contains: 'hardware', mode: 'insensitive' } }
      ]
    },
    select: { code: true, name: true }
  });
  
  console.log('\nHardware-related categories:');
  hardwareCategories.forEach(cat => {
    console.log(`  ${cat.code} - ${cat.name}`);
  });
  
  await prisma.$disconnect();
}

checkCategories();