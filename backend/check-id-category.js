const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSparePartWithIdCategory() {
  const sparepart = await prisma.sparePart.findFirst({
    where: { category: 'cmhn4urvy003dt53qfytfywm5' },
    select: { partNumber: true, name: true, category: true }
  });
  
  console.log('Spare part with ID as category:', sparepart);
  
  if (sparepart) {
    const category = await prisma.category.findUnique({
      where: { id: 'cmhn4urvy003dt53qfytfywm5' },
      select: { code: true, name: true }
    });
    
    console.log('Category details:', category);
  }
  
  await prisma.$disconnect();
}

checkSparePartWithIdCategory();