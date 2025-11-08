const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDecomposedAssets() {
  const assets = await prisma.asset.findMany({
    where: {
      OR: [
        { status: 'RETIRED' },
        { isActive: false }
      ]
    },
    select: {
      assetTag: true,
      name: true,
      status: true,
      isActive: true,
      notes: true
    },
    orderBy: { updatedAt: 'desc' },
    take: 3
  });
  
  console.log('Decomposed/Retired Assets:');
  assets.forEach(asset => {
    console.log(`${asset.assetTag} - ${asset.name} - Status: ${asset.status}, Active: ${asset.isActive}`);
    if (asset.notes && asset.notes.includes('decompose')) {
      const lines = asset.notes.split('\n');
      const decomposedLine = lines.find(line => line.includes('decompose'));
      if (decomposedLine) {
        console.log(`  -> ${decomposedLine.trim()}`);
      }
    }
  });
  
  await prisma.$disconnect();
}

checkDecomposedAssets();