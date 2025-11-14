const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSparePartsCategory() {
  try {
    console.log('Checking spare parts categories...\n');
    
    // Use raw query to bypass enum validation
    const spareParts = await prisma.$queryRaw`
      SELECT id, "partNumber", name, category 
      FROM spare_parts 
      LIMIT 10
    `;
    
    console.log('Found', spareParts.length, 'spare parts:');
    spareParts.forEach(sp => {
      console.log(`- ${sp.partNumber}: category = ${sp.category}`);
    });
    
    // Check if any have invalid enum values (look like IDs)
    const invalidCategories = spareParts.filter(sp => 
      sp.category && sp.category.length > 20 // IDs are long strings
    );
    
    if (invalidCategories.length > 0) {
      console.log('\n⚠️ Found', invalidCategories.length, 'spare parts with invalid category (looks like ID):');
      invalidCategories.forEach(sp => {
        console.log(`- ${sp.partNumber}: ${sp.category}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSparePartsCategory();
