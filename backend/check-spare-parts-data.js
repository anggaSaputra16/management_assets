const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSparePartsData() {
  try {
    console.log('=== Checking Spare Parts Data ===');
    
    // Check spare parts
    const spareParts = await prisma.sparePart.findMany({
      select: {
        id: true,
        partNumber: true,
        name: true,
        category: true,
      },
      take: 10
    });
    
    console.log('\n📦 Spare Parts (sample):');
    spareParts.forEach(sp => {
      console.log(`  ${sp.partNumber} - ${sp.name} - Category: "${sp.category}"`);
    });
    
    // Check categories
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        code: true,
      },
      take: 10
    });
    
    console.log('\n📂 Categories (sample):');
    categories.forEach(cat => {
      console.log(`  ${cat.code} - ${cat.name}`);
    });
    
    // Check unique spare part categories
    const uniqueSpareCategories = await prisma.sparePart.groupBy({
      by: ['category']
    });
    
    console.log('\n🔍 Unique Spare Part Categories currently used:');
    uniqueSpareCategories.forEach(grp => {
      console.log(`  "${grp.category}"`);
    });
    
    // Check assets status after decomposition
    const decomposedAssets = await prisma.asset.findMany({
      where: {
        OR: [
          { status: 'RETIRED' },
          { isActive: false }
        ]
      },
      select: {
        id: true,
        assetTag: true,
        name: true,
        status: true,
        isActive: true,
        notes: true
      },
      take: 5,
      orderBy: { updatedAt: 'desc' }
    });
    
    console.log('\n🏗️ Recently Decomposed/Retired Assets:');
    decomposedAssets.forEach(asset => {
      console.log(`  ${asset.assetTag} - ${asset.name} - Status: ${asset.status}, Active: ${asset.isActive}`);
      if (asset.notes) {
        const lines = asset.notes.split('\n');
        const decomposedLine = lines.find(line => line.includes('decomposed'));
        if (decomposedLine) {
          console.log(`    -> ${decomposedLine.trim()}`);
        }
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSparePartsData();