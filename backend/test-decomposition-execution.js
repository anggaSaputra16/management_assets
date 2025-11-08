const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

async function testDecompositionExecution() {
  try {
    // Check current request status
    const request = await prisma.assetRequest.findUnique({
      where: { id: 'cmhq9b1xn0002ywfqqu9vs51a' },
      include: {
        asset: {
          select: {
            id: true,
            assetTag: true,
            name: true,
            status: true,
            isActive: true,
            notes: true
          }
        }
      }
    });

    console.log('=== BEFORE EXECUTION ===');
    console.log('Request Status:', request?.status);
    console.log('Request Completed:', request?.completedDate);
    console.log('Asset ID:', request?.asset?.id);
    console.log('Asset Tag:', request?.asset?.assetTag);
    console.log('Asset Status:', request?.asset?.status);
    console.log('Asset Active:', request?.asset?.isActive);

    if (request?.status !== 'APPROVED') {
      console.log('❌ Request is not APPROVED, cannot execute');
      return;
    }

    // Simulate execution manually using Prisma (bypassing auth)
    const result = await prisma.$transaction(async (tx) => {
      // Update request status
      await tx.assetRequest.update({
        where: { id: 'cmhq9b1xn0002ywfqqu9vs51a' },
        data: { 
          status: 'COMPLETED', 
          completedDate: new Date() 
        }
      });

      // Update asset status
      const updatedAsset = await tx.asset.update({
        where: { id: request.asset.id },
        data: {
          status: 'RETIRED',
          isActive: false,
          notes: `${request.asset.notes || ''}\n[${new Date().toISOString()}] Asset decomposed via request cmhq9b1xn0002ywfqqu9vs51a (MANUAL TEST)`
        }
      });

      return updatedAsset;
    });

    console.log('\n=== EXECUTION COMPLETED ===');
    console.log('✅ Asset Status Updated:', result.status);
    console.log('✅ Asset Active:', result.isActive);

    // Check final status
    const finalCheck = await prisma.assetRequest.findUnique({
      where: { id: 'cmhq9b1xn0002ywfqqu9vs51a' },
      include: {
        asset: {
          select: {
            assetTag: true,
            status: true,
            isActive: true
          }
        }
      }
    });

    console.log('\n=== AFTER EXECUTION ===');
    console.log('Request Status:', finalCheck?.status);
    console.log('Request Completed:', finalCheck?.completedDate);
    console.log('Asset Status:', finalCheck?.asset?.status);
    console.log('Asset Active:', finalCheck?.asset?.isActive);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDecompositionExecution();