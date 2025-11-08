const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDecompositionRequests() {
  const requests = await prisma.assetRequest.findMany({
    where: {
      requestType: 'ASSET_BREAKDOWN'
    },
    select: {
      id: true,
      status: true,
      completedDate: true,
      createdAt: true,
      asset: {
        select: {
          assetTag: true,
          name: true,
          status: true,
          isActive: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  
  console.log('Decomposition Requests:');
  requests.forEach(req => {
    console.log(`${req.id} - Status: ${req.status}, Completed: ${req.completedDate}`);
    if (req.asset) {
      console.log(`  Asset: ${req.asset.assetTag} - ${req.asset.name} - Status: ${req.asset.status}, Active: ${req.asset.isActive}`);
    }
  });
  
  await prisma.$disconnect();
}

checkDecompositionRequests();