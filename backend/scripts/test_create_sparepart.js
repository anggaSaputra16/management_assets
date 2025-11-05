require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const jwt = require('jsonwebtoken')

const prisma = new PrismaClient()

async function main() {
  // find admin or asset_admin user
  const user = await prisma.user.findFirst({ where: { OR: [{ role: 'ADMIN' }, { role: 'ASSET_ADMIN' }] } })
  if (!user) {
    console.error('No admin or asset admin user found in DB')
    process.exit(1)
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })

  const payload = {
    partNumber: '',
    name: 'Test Part from script',
    description: 'Created during automated test',
    brand: 'Acme',
    model: 'T-1000',
    category: 'Hardware', // intentionally Title case to test uppercase normalization
    partType: 'COMPONENT',
    unitPrice: 123.45,
    stockLevel: 5,
    minStockLevel: 1,
    maxStockLevel: 100,
    reorderPoint: 2,
    storageLocation: 'Warehouse A',
    specifications: { size: 'M' },
    compatibleWith: [],
    notes: 'Automated test entry',
    vendorId: ''
  }

  const res = await fetch('http://localhost:5000/api/spare-parts/inventory', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  })

  const text = await res.text()
  console.log('Status:', res.status)
  try {
    console.log('Response JSON:', JSON.parse(text))
  } catch (e) {
    console.log('Response Text:', text)
  }

  await prisma.$disconnect()
}

main().catch(err => { console.error(err); process.exit(1) })
