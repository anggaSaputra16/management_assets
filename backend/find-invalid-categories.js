const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findInvalidCategories() {
  try {
    console.log('Searching for spare parts with invalid categories...\n');
    
    const validEnums = ['HARDWARE', 'SOFTWARE', 'ACCESSORY', 'CONSUMABLE'];
    
    // Use raw query to get all spare parts without enum validation
    const allSpareParts = await prisma.$queryRaw`
      SELECT id, "partNumber", name, category, "companyId"
      FROM spare_parts 
    `;
    
    console.log(`Total spare parts: ${allSpareParts.length}\n`);
    
    // Find invalid ones
    const invalidParts = allSpareParts.filter(sp => 
      sp.category && !validEnums.includes(sp.category)
    );
    
    if (invalidParts.length > 0) {
      console.log(`❌ Found ${invalidParts.length} spare parts with invalid category values:\n`);
      invalidParts.forEach(sp => {
        console.log(`  ID: ${sp.id}`);
        console.log(`  Part Number: ${sp.partNumber}`);
        console.log(`  Name: ${sp.name}`);
        console.log(`  Category: ${sp.category}`);
        console.log(`  Company ID: ${sp.companyId}`);
        console.log(`  ---`);
      });
      
      console.log('\n💡 To fix this, you need to update these records to use valid enum values:');
      console.log('   HARDWARE, SOFTWARE, ACCESSORY, or CONSUMABLE\n');
    } else {
      console.log('✅ All spare parts have valid category values!');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

findInvalidCategories();
