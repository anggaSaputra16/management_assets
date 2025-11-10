const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixInvalidCategory() {
  try {
    const invalidCategoryValue = 'cmhn4urvy003dt53qfytfywm5';
    const sparePartId = 'cmhq9b1xw0004ywfqd7n8d6da';
    
    // First, try to find what this category ID refers to
    console.log('Looking up category ID:', invalidCategoryValue);
    const category = await prisma.category.findUnique({
      where: { id: invalidCategoryValue },
      select: { id: true, code: true, name: true }
    });
    
    if (category) {
      console.log('Found category:', category);
      console.log('Category name:', category.name);
    } else {
      console.log('Category not found in database');
    }
    
    // Map the category name to a valid SparePartCategory enum value
    const categoryNameLower = category ? category.name.toLowerCase() : '';
    let validEnum = 'HARDWARE'; // default
    
    if (categoryNameLower.includes('software') || categoryNameLower.includes('perangkat lunak')) {
      validEnum = 'SOFTWARE';
    } else if (categoryNameLower.includes('accessory') || categoryNameLower.includes('aksesori')) {
      validEnum = 'ACCESSORY';
    } else if (categoryNameLower.includes('consumable') || categoryNameLower.includes('habis pakai')) {
      validEnum = 'CONSUMABLE';
    } else {
      validEnum = 'HARDWARE'; // Default for hardware/components
    }
    
    console.log(`\nMapping category "${category?.name || 'unknown'}" to enum: ${validEnum}`);
    
    // Update the spare part using raw query to bypass enum validation during read
    const result = await prisma.$executeRaw`
      UPDATE spare_parts 
      SET category = ${validEnum}
      WHERE id = ${sparePartId}
    `;
    
    console.log(`✅ Successfully updated ${result} spare part(s)`);
    
    // Verify the fix
    const updated = await prisma.$queryRaw`
      SELECT id, "partNumber", name, category 
      FROM spare_parts 
      WHERE id = ${sparePartId}
    `;
    
    console.log('\nUpdated spare part:');
    console.log(updated[0]);
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

fixInvalidCategory();
