const express = require('express')
const { prisma } = require('../config/database')
const { authenticate, authorize, validateCompany } = require('../middleware/auth')
const Joi = require('joi')

const router = express.Router()

// Validation schemas
const createTransferSchema = Joi.object({
  assetId: Joi.string().required(),
  reason: Joi.string().required(),
  transferDate: Joi.date().optional(),
  effectiveDate: Joi.date().optional(),
  notes: Joi.string().optional(),
  fromLocationId: Joi.string().optional(),
  toLocationId: Joi.string().optional(),
  fromDepartmentId: Joi.string().optional(),
  toDepartmentId: Joi.string().optional(),
  fromUserId: Joi.string().optional(),
  toUserId: Joi.string().optional(),
  companyId: Joi.string().optional()
})

const updateTransferSchema = Joi.object({
  reason: Joi.string().optional(),
  transferDate: Joi.date().optional(),
  effectiveDate: Joi.date().optional(),
  notes: Joi.string().optional(),
  approvalNotes: Joi.string().optional(),
  status: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED').optional(),
  fromLocationId: Joi.string().optional(),
  toLocationId: Joi.string().optional(),
  fromDepartmentId: Joi.string().optional(),
  toDepartmentId: Joi.string().optional(),
  fromUserId: Joi.string().optional(),
  toUserId: Joi.string().optional()
})

// Generate transfer number
const generateTransferNumber = async () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  
  const lastTransfer = await prisma.assetTransfer.findFirst({
    where: {
      transferNumber: {
        startsWith: `TRF-${year}${month}`
      }
    },
    orderBy: {
      transferNumber: 'desc'
    }
  })

  let sequence = 1
  if (lastTransfer) {
    const lastSequence = parseInt(lastTransfer.transferNumber.split('-')[2])
    sequence = lastSequence + 1
  }

  return `TRF-${year}${month}-${String(sequence).padStart(4, '0')}`
}

// GET /api/asset-transfers - Get all transfers
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, assetId, page = 1, limit = 10 } = req.query
    const offset = (page - 1) * limit

    const where = {}
    if (status) where.status = status
    if (assetId) where.assetId = assetId
    // Scope transfers to the user's company via related asset.companyId
    const companyId = req.user.companyId
    const whereWithCompany = {
      AND: [
        where,
        { asset: { is: { companyId } } }
      ]
    }

    const [transfers, totalCount] = await Promise.all([
      prisma.assetTransfer.findMany({
        where: whereWithCompany,
        include: {
          asset: {
            select: {
              id: true,
              name: true,
              assetTag: true,
              category: { select: { name: true } }
            }
          },
          fromLocation: { select: { name: true } },
          toLocation: { select: { name: true } },
          fromDepartment: { select: { name: true } },
          toDepartment: { select: { name: true } },
          fromUser: { select: { firstName: true, lastName: true } },
          toUser: { select: { firstName: true, lastName: true } },
          requestedBy: { select: { firstName: true, lastName: true } },
          approvedBy: { select: { firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(offset),
        take: parseInt(limit)
      }),
      prisma.assetTransfer.count({ where: whereWithCompany })
    ])

    res.json({
      success: true,
      data: {
        transfers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount,
          itemsPerPage: parseInt(limit)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching asset transfers:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch asset transfers'
    })
  }
})

// POST /api/asset-transfers - Create new transfer
router.post('/', authenticate, authorize('ADMIN', 'ASSET_ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { error, value } = createTransferSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      })
    }

    // Check if asset exists and is available for transfer
    const asset = await prisma.asset.findUnique({
      where: { id: value.assetId },
      include: {
        location: true,
        department: true,
        assignedTo: true
      }
    })

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      })
    }

    // Enforce company scoping: asset must belong to user's company
    if (asset.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Asset does not belong to your company' })
    }

    // Generate transfer number
    const transferNumber = await generateTransferNumber()

    // Create the transfer
    const transfer = await prisma.assetTransfer.create({
      data: {
        ...value,
        transferNumber,
        requestedById: req.user.id
      },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            assetTag: true,
            category: { select: { name: true } }
          }
        },
        fromLocation: { select: { name: true } },
        toLocation: { select: { name: true } },
        fromDepartment: { select: { name: true } },
        toDepartment: { select: { name: true } },
        fromUser: { select: { firstName: true, lastName: true } },
        toUser: { select: { firstName: true, lastName: true } },
        requestedBy: { select: { firstName: true, lastName: true } }
      }
    })

    res.status(201).json({
      success: true,
      data: { transfer },
      message: 'Asset transfer created successfully'
    })
  } catch (error) {
    console.error('Error creating asset transfer:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create asset transfer'
    })
  }
})

// GET /api/asset-transfers/:id - Get transfer by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params

    const transfer = await prisma.assetTransfer.findUnique({
      where: { id },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            assetTag: true,
            category: { select: { name: true } }
          }
        },
        fromLocation: { select: { name: true } },
        toLocation: { select: { name: true } },
        fromDepartment: { select: { name: true } },
        toDepartment: { select: { name: true } },
        fromUser: { select: { firstName: true, lastName: true } },
        toUser: { select: { firstName: true, lastName: true } },
        requestedBy: { select: { firstName: true, lastName: true } },
        approvedBy: { select: { firstName: true, lastName: true } }
      }
    })

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found'
      })
    }

    res.json({
      success: true,
      data: { transfer }
    })
  } catch (error) {
    console.error('Error fetching asset transfer:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch asset transfer'
    })
  }
})

// PUT /api/asset-transfers/:id - Update transfer
router.put('/:id', authenticate, authorize('ADMIN', 'ASSET_ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { id } = req.params
    const { error, value } = updateTransferSchema.validate(req.body)
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      })
    }

    // Check if transfer exists
    const existingTransfer = await prisma.assetTransfer.findUnique({
      where: { id }
    })

    if (!existingTransfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found'
      })
    }

    // Verify company scoping: only operate on transfers for assets in the same company
    const assetCheck = await prisma.asset.findUnique({ where: { id: existingTransfer.assetId }, select: { companyId: true } })
    if (!assetCheck || assetCheck.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Transfer does not belong to your company' })
    }

    // Update the transfer
    const updateData = { ...value }
    if (value.status === 'APPROVED') {
      updateData.approvedById = req.user.id
    }

    const transfer = await prisma.assetTransfer.update({
      where: { id },
      data: updateData,
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            assetTag: true,
            category: { select: { name: true } }
          }
        },
        fromLocation: { select: { name: true } },
        toLocation: { select: { name: true } },
        fromDepartment: { select: { name: true } },
        toDepartment: { select: { name: true } },
        fromUser: { select: { firstName: true, lastName: true } },
        toUser: { select: { firstName: true, lastName: true } },
        requestedBy: { select: { firstName: true, lastName: true } },
        approvedBy: { select: { firstName: true, lastName: true } }
      }
    })

    // If transfer is completed, update the asset
    if (value.status === 'COMPLETED') {
      const updateAssetData = {}
      if (value.toLocationId) updateAssetData.locationId = value.toLocationId
      if (value.toDepartmentId) updateAssetData.departmentId = value.toDepartmentId
      if (value.toUserId) updateAssetData.assignedToId = value.toUserId

      if (Object.keys(updateAssetData).length > 0) {
        await prisma.asset.update({
          where: { id: existingTransfer.assetId },
          data: updateAssetData
        })
      }
    }

    res.json({
      success: true,
      data: { transfer },
      message: 'Asset transfer updated successfully'
    })
  } catch (error) {
    console.error('Error updating asset transfer:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update asset transfer'
    })
  }
})

// DELETE /api/asset-transfers/:id - Delete transfer
router.delete('/:id', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params

    // Check if transfer exists
    const transfer = await prisma.assetTransfer.findUnique({
      where: { id }
    })

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found'
      })
    }

    // Only allow deletion of pending transfers
    if (transfer.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Only pending transfers can be deleted'
      })
    }

    // Verify company scoping before deletion
    const assetCheck = await prisma.asset.findUnique({ where: { id: transfer.assetId }, select: { companyId: true } })
    if (!assetCheck || assetCheck.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Transfer does not belong to your company' })
    }

    await prisma.assetTransfer.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: 'Asset transfer deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting asset transfer:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete asset transfer'
    })
  }
})

// POST /api/asset-transfers/:id/approve - Approve transfer
router.post('/:id/approve', authenticate, authorize('ADMIN', 'ASSET_ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { id } = req.params
    const { approvalNotes } = req.body

    // Ensure transfer exists and belongs to company
    const existing = await prisma.assetTransfer.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ success: false, message: 'Transfer not found' })
    const assetCheck = await prisma.asset.findUnique({ where: { id: existing.assetId }, select: { companyId: true } })
    if (!assetCheck || assetCheck.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Transfer does not belong to your company' })
    }

    const transfer = await prisma.assetTransfer.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: req.user.id,
        approvalNotes
      },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            assetTag: true
          }
        }
      }
    })

    res.json({
      success: true,
      data: { transfer },
      message: 'Asset transfer approved successfully'
    })
  } catch (error) {
    console.error('Error approving asset transfer:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to approve asset transfer'
    })
  }
})

// POST /api/asset-transfers/:id/complete - Complete transfer
router.post('/:id/complete', authenticate, authorize('ADMIN', 'ASSET_ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { id } = req.params
    // Accept optional body params:
    // - priceDeduction: number | string (amount to deduct from asset.currentValue)
    // - inventoryId / inventoryQuantity: to update inventory counts if the transfer involves inventory records
    const { priceDeduction, inventoryId, inventoryQuantity } = req.body || {}

    // Find transfer and ensure ready
    const transfer = await prisma.assetTransfer.findUnique({ where: { id } })

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found'
      })
    }

    // Company scope check
    const assetCheck = await prisma.asset.findUnique({ where: { id: transfer.assetId }, select: { companyId: true } })
    if (!assetCheck || assetCheck.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Transfer does not belong to your company' })
    }

    if (transfer.status !== 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Transfer must be approved before completion'
      })
    }

    // Parse priceDeduction (optional)
    let priceDeductNumber = null
    if (priceDeduction !== undefined && priceDeduction !== null && priceDeduction !== '') {
      priceDeductNumber = Number(priceDeduction)
      if (Number.isNaN(priceDeductNumber) || priceDeductNumber < 0) {
        return res.status(400).json({ success: false, message: 'Invalid priceDeduction value' })
      }
    }

    // Perform all DB updates in a single transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Lock/read current asset state inside transaction
      const assetBefore = await tx.asset.findUnique({ where: { id: transfer.assetId } })
      if (!assetBefore) {
        throw new Error('Asset not found for this transfer')
      }

      // Update transfer status
      const updatedTransfer = await tx.assetTransfer.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          effectiveDate: new Date()
        }
      })

      // Prepare asset update
      const updateAssetData = {}
      if (transfer.toLocationId) updateAssetData.locationId = transfer.toLocationId
      if (transfer.toDepartmentId) updateAssetData.departmentId = transfer.toDepartmentId
      if (transfer.toUserId) updateAssetData.assignedToId = transfer.toUserId

      // Apply price deduction if requested
      if (priceDeductNumber !== null) {
        // Prevent negative resulting value
        const currentVal = assetBefore.currentValue ? Number(assetBefore.currentValue) : 0
        const finalValue = Math.max(0, currentVal - priceDeductNumber)

        // Use explicit value assignment for Decimal safety
        updateAssetData.currentValue = finalValue
      }

      let updatedAsset = assetBefore
      if (Object.keys(updateAssetData).length > 0) {
        updatedAsset = await tx.asset.update({
          where: { id: transfer.assetId },
          data: updateAssetData
        })
      }

      // If inventory update requested (optional) update availableQty / status
      if (inventoryId && inventoryQuantity) {
        // ensure inventory exists
        const inv = await tx.inventory.findUnique({ where: { id: inventoryId } })
        if (!inv) {
          throw new Error('Inventory record not found')
        }

        const newAvailable = Math.max(0, inv.availableQty - Number(inventoryQuantity))
        await tx.inventory.update({
          where: { id: inventoryId },
          data: {
            availableQty: newAvailable,
            status: newAvailable === 0 ? 'LOANED' : inv.status
          }
        })
      }

      // Record a transaction entry using AuditTrail (serves as immutable transaction log)
      const descriptionParts = []
      descriptionParts.push(`Transfer ${updatedTransfer.transferNumber} completed`)
      if (priceDeductNumber !== null) descriptionParts.push(`price deduction: ${priceDeductNumber}`)
      if (transfer.fromDepartmentId || transfer.toDepartmentId) descriptionParts.push(`fromDept:${transfer.fromDepartmentId || 'N/A'} toDept:${transfer.toDepartmentId || 'N/A'}`)

      await tx.auditTrail.create({
        data: {
          action: 'TRANSFER',
          entityType: 'ASSET',
          entityId: transfer.assetId,
          oldValues: assetBefore ? JSON.stringify({ currentValue: assetBefore.currentValue, locationId: assetBefore.locationId, departmentId: assetBefore.departmentId, assignedToId: assetBefore.assignedToId }) : null,
          newValues: JSON.stringify({ currentValue: updatedAsset.currentValue, locationId: updatedAsset.locationId, departmentId: updatedAsset.departmentId, assignedToId: updatedAsset.assignedToId }),
          description: descriptionParts.join(' | '),
          ipAddress: req.ip || null,
          userAgent: req.get('User-Agent') || null,
          sessionId: null,
          userId: req.user.id,
          companyId: req.user.companyId
        }
      })

      return { updatedTransfer, updatedAsset }
    })

    res.json({
      success: true,
      data: result,
      message: 'Asset transfer completed successfully'
    })
  } catch (error) {
    console.error('Error completing asset transfer:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to complete asset transfer'
    })
  }
})

module.exports = router