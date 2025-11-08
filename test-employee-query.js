// Test script to verify Employee query fix
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testEmployeeQuery() {
  try {
    console.log('Testing Employee query with firstName and lastName...')
    
    // Test the exact query structure that was causing the error
    const assets = await prisma.asset.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        assetTag: true,
        categoryId: true,
        locationId: true,
        departmentId: true,
        assignedEmployeeId: true,
        status: true,
        condition: true,
        imageUrl: true,
        createdAt: true,
        category: { select: { id: true, name: true, code: true } },
        company: { select: { id: true, name: true, code: true } },
        location: { select: { id: true, name: true, building: true, room: true } },
        department: { select: { id: true, name: true, code: true } },
        // This was the problematic line - now fixed
        assignedEmployee: { 
          select: { 
            id: true, 
            npk: true, 
            firstName: true,  // Changed from 'name: true'
            lastName: true,   // Added this field
            position: true 
          } 
        }
      },
      take: 5
    })

    console.log('✅ Query executed successfully!')
    console.log(`Found ${assets.length} assets`)
    
    // Log sample employee data if available
    const assetsWithEmployees = assets.filter(asset => asset.assignedEmployee)
    if (assetsWithEmployees.length > 0) {
      console.log('Sample assigned employee data:')
      assetsWithEmployees.forEach(asset => {
        const emp = asset.assignedEmployee
        console.log(`- ${emp.firstName} ${emp.lastName} (NPK: ${emp.npk})`)
      })
    } else {
      console.log('No assets with assigned employees found in sample')
    }
    
  } catch (error) {
    console.error('❌ Query failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testEmployeeQuery()