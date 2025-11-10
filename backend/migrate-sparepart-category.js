const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Migration Script: Convert SparePart category from enum to Category relation
 * 
 * Steps:
 * 1. Create default spare part categories in Category table (HARDWARE, SOFTWARE, ACCESSORY, CONSUMABLE)
 * 2. Map existing spare parts to the new categories
 * 3. Update spare parts with the new categoryId
 */

async function migrateSparePartCategories() {
  try {
    console.log('🚀 Starting SparePart Category Migration...\n');

    // Step 1: Get all companies
    const companies = await prisma.company.findMany({
      select: { id: true, name: true }
    });

    console.log(`Found ${companies.length} companies\n`);

    // Step 2: Create default spare part categories for each company
    const defaultCategories = [
      { code: 'SP-HARDWARE', name: 'Hardware', description: 'Hardware components and parts' },
      { code: 'SP-SOFTWARE', name: 'Software', description: 'Software licenses and digital assets' },
      { code: 'SP-ACCESSORY', name: 'Accessory', description: 'Accessories and peripheral items' },
      { code: 'SP-CONSUMABLE', name: 'Consumable', description: 'Consumable items and supplies' }
    ];

    const categoryMapping = {};

    for (const company of companies) {
      console.log(`📦 Processing company: ${company.name}`);
      
      for (const catDef of defaultCategories) {
        // Check if category already exists
        let category = await prisma.category.findFirst({
          where: {
            companyId: company.id,
            code: catDef.code
          }
        });

        // Create if doesn't exist
        if (!category) {
          category = await prisma.category.create({
            data: {
              companyId: company.id,
              code: catDef.code,
              name: catDef.name,
              description: catDef.description,
              isActive: true
            }
          });
          console.log(`  ✅ Created category: ${catDef.name} (${category.id})`);
        } else {
          console.log(`  ℹ️  Category already exists: ${catDef.name} (${category.id})`);
        }

        // Store mapping for this company
        if (!categoryMapping[company.id]) {
          categoryMapping[company.id] = {};
        }
        
        // Map old enum values to new category IDs
        const enumValue = catDef.code.replace('SP-', '');
        categoryMapping[company.id][enumValue] = category.id;
      }
      
      console.log('');
    }

    // Step 3: Get all spare parts with raw query to read current enum values
    console.log('\n📝 Migrating spare parts...\n');
    
    const spareParts = await prisma.$queryRaw`
      SELECT id, "partNumber", name, category, "companyId"
      FROM spare_parts
    `;

    console.log(`Found ${spareParts.length} spare parts to migrate\n`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const sp of spareParts) {
      try {
        const companyId = sp.companyId;
        const oldCategory = sp.category; // This is still the enum value from DB
        
        // Get the new category ID from our mapping
        const newCategoryId = categoryMapping[companyId]?.[oldCategory];

        if (!newCategoryId) {
          console.error(`  ❌ ERROR: No category mapping found for ${sp.partNumber} (${oldCategory} in company ${companyId})`);
          errorCount++;
          continue;
        }

        // Update using raw query since Prisma client expects the new schema
        await prisma.$executeRaw`
          UPDATE spare_parts
          SET "categoryId" = ${newCategoryId}
          WHERE id = ${sp.id}
        `;

        migratedCount++;
        console.log(`  ✅ Migrated ${sp.partNumber}: ${oldCategory} → ${newCategoryId}`);
        
      } catch (error) {
        console.error(`  ❌ Error migrating ${sp.partNumber}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n✨ Migration completed!`);
    console.log(`  - Successfully migrated: ${migratedCount} spare parts`);
    console.log(`  - Errors: ${errorCount} spare parts`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateSparePartCategories()
  .then(() => {
    console.log('\n✅ Migration script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration script failed:', error);
    process.exit(1);
  });
