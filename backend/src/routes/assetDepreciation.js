const express = require('express')
const { prisma } = require('../config/database')
const { authenticate, authorize, validateCompany } = require('../middleware/auth')
const Joi = require('joi')

const router = express.Router()

// Validation schemas
const createDepreciationSchema = Joi.object({
  assetId: Joi.string().required(),
  depreciationMethod: Joi.string().valid('STRAIGHT_LINE', 'DECLINING_BALANCE', 'UNITS_OF_PRODUCTION').default('STRAIGHT_LINE'),
  usefulLife: Joi.number().integer().min(1).required(),
  salvageValue: Joi.number().min(0).optional(),
  depreciationRate: Joi.number().min(0).max(1).optional(),
  notes: Joi.string().optional(),
  companyId: Joi.string().optional()
})

const updateDepreciationSchema = Joi.object({
  depreciationMethod: Joi.string().valid('STRAIGHT_LINE', 'DECLINING_BALANCE', 'UNITS_OF_PRODUCTION').optional(),
  usefulLife: Joi.number().integer().min(1).optional(),
  salvageValue: Joi.number().min(0).optional(),
  depreciationRate: Joi.number().min(0).max(1).optional(),
  currentBookValue: Joi.number().min(0).optional(),
  accumulatedDepreciation: Joi.number().min(0).optional(),
  isActive: Joi.boolean().optional(),
  notes: Joi.string().optional()
})

// Calculate depreciation
const calculateDepreciation = (asset, depreciation) => {
  const purchasePrice = parseFloat(asset.purchasePrice) || 0
  const salvageValue = parseFloat(depreciation.salvageValue) || 0
  const usefulLife = depreciation.usefulLife
  const depreciableAmount = purchasePrice - salvageValue

  let annualDepreciation = 0
  let monthlyDepreciation = 0

  switch (depreciation.depreciationMethod) {
    case 'STRAIGHT_LINE':
      annualDepreciation = depreciableAmount / usefulLife
      monthlyDepreciation = annualDepreciation / 12
      break
    case 'DECLINING_BALANCE':
      const rate = parseFloat(depreciation.depreciationRate) || (2 / usefulLife)
      const currentBookValue = parseFloat(depreciation.currentBookValue) || purchasePrice
      annualDepreciation = currentBookValue * rate
      monthlyDepreciation = annualDepreciation / 12
      break
    case 'UNITS_OF_PRODUCTION':
      // This would require additional data like units produced
      // For now, default to straight line
      annualDepreciation = depreciableAmount / usefulLife
      monthlyDepreciation = annualDepreciation / 12
      break
    default:
      annualDepreciation = depreciableAmount / usefulLife
      monthlyDepreciation = annualDepreciation / 12
  }

  return {
    annualDepreciation: Math.round(annualDepreciation * 100) / 100,
    monthlyDepreciation: Math.round(monthlyDepreciation * 100) / 100
  }
}

// GET /api/asset-depreciations - Get all depreciations
router.get('/', authenticate, async (req, res) => {
  try {
    const { assetId, isActive, page = 1, limit = 10 } = req.query
    const offset = (page - 1) * limit

    const where = {}
    if (assetId) where.assetId = assetId
    if (isActive !== undefined) where.isActive = isActive === 'true'

    const [depreciations, totalCount] = await Promise.all([
      prisma.assetDepreciation.findMany({
        where,
        include: {
          asset: {
            select: {
              id: true,
              name: true,
              assetTag: true,
              purchasePrice: true,
              purchaseDate: true,
              category: { select: { name: true } }
            }
          },
          records: {
            orderBy: { calculationDate: 'desc' },
            take: 1
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(offset),
        take: parseInt(limit)
      }),
      prisma.assetDepreciation.count({ where })
    ])

    res.json({
      success: true,
      data: {
        depreciations,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount,
          itemsPerPage: parseInt(limit)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching asset depreciations:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch asset depreciations'
    })
  }
})

// POST /api/asset-depreciations - Create new depreciation
router.post('/', authenticate, authorize('ADMIN', 'ASSET_ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { error, value } = createDepreciationSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      })
    }

    // Check if asset exists
    const asset = await prisma.asset.findUnique({
      where: { id: value.assetId }
    })

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      })
    }

    // Check if depreciation already exists for this asset
    const existingDepreciation = await prisma.assetDepreciation.findUnique({
      where: { assetId: value.assetId }
    })

    if (existingDepreciation) {
      return res.status(400).json({
        success: false,
        message: 'Depreciation already exists for this asset'
      })
    }

    // Calculate initial values
    const purchasePrice = parseFloat(asset.purchasePrice) || 0
    const currentBookValue = purchasePrice
    const accumulatedDepreciation = 0

    // Create the depreciation
    const depreciation = await prisma.assetDepreciation.create({
      data: {
        ...value,
        currentBookValue,
        accumulatedDepreciation,
        lastCalculatedDate: new Date()
      },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            assetTag: true,
            purchasePrice: true,
            purchaseDate: true,
            category: { select: { name: true } }
          }
        }
      }
    })

    res.status(201).json({
      success: true,
      data: { depreciation },
      message: 'Asset depreciation created successfully'
    })
  } catch (error) {
    console.error('Error creating asset depreciation:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create asset depreciation'
    })
  }
})

// GET /api/asset-depreciations/:id - Get depreciation by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params

    const depreciation = await prisma.assetDepreciation.findUnique({
      where: { id },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            assetTag: true,
            purchasePrice: true,
            purchaseDate: true,
            category: { select: { name: true } }
          }
        },
        records: {
          orderBy: { calculationDate: 'desc' }
        }
      }
    })

    if (!depreciation) {
      return res.status(404).json({
        success: false,
        message: 'Depreciation not found'
      })
    }

    res.json({
      success: true,
      data: { depreciation }
    })
  } catch (error) {
    console.error('Error fetching asset depreciation:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch asset depreciation'
    })
  }
})

// PUT /api/asset-depreciations/:id - Update depreciation
router.put('/:id', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params
    const { error, value } = updateDepreciationSchema.validate(req.body)
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      })
    }

    // Check if depreciation exists
    const existingDepreciation = await prisma.assetDepreciation.findUnique({
      where: { id }
    })

    if (!existingDepreciation) {
      return res.status(404).json({
        success: false,
        message: 'Depreciation not found'
      })
    }

    // Update the depreciation
    const depreciation = await prisma.assetDepreciation.update({
      where: { id },
      data: value,
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            assetTag: true,
            purchasePrice: true,
            purchaseDate: true,
            category: { select: { name: true } }
          }
        }
      }
    })

    res.json({
      success: true,
      data: { depreciation },
      message: 'Asset depreciation updated successfully'
    })
  } catch (error) {
    console.error('Error updating asset depreciation:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update asset depreciation'
    })
  }
})

// DELETE /api/asset-depreciations/:id - Delete depreciation
router.delete('/:id', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params

    // Check if depreciation exists
    const depreciation = await prisma.assetDepreciation.findUnique({
      where: { id }
    })

    if (!depreciation) {
      return res.status(404).json({
        success: false,
        message: 'Depreciation not found'
      })
    }

    await prisma.assetDepreciation.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: 'Asset depreciation deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting asset depreciation:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete asset depreciation'
    })
  }
})

// POST /api/asset-depreciations/:id/calculate - Calculate depreciation for current period
router.post('/:id/calculate', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params
    const { period } = req.body // Format: YYYY-MM for monthly, YYYY for annual

    const depreciation = await prisma.assetDepreciation.findUnique({
      where: { id },
      include: {
        asset: true
      }
    })

    if (!depreciation) {
      return res.status(404).json({
        success: false,
        message: 'Depreciation not found'
      })
    }

    // Check if calculation already exists for this period
    const existingRecord = await prisma.depreciationRecord.findFirst({
      where: {
        depreciationId: id,
        period
      }
    })

    if (existingRecord) {
      return res.status(400).json({
        success: false,
        message: 'Depreciation already calculated for this period'
      })
    }

    // Calculate depreciation
    const calculation = calculateDepreciation(depreciation.asset, depreciation)
    const depreciationAmount = period.includes('-') ? calculation.monthlyDepreciation : calculation.annualDepreciation

    const bookValueBefore = parseFloat(depreciation.currentBookValue) || parseFloat(depreciation.asset.purchasePrice)
    const bookValueAfter = Math.max(bookValueBefore - depreciationAmount, parseFloat(depreciation.salvageValue) || 0)
    const newAccumulatedDepreciation = (parseFloat(depreciation.accumulatedDepreciation) || 0) + depreciationAmount

    // Create depreciation record
    const record = await prisma.depreciationRecord.create({
      data: {
        depreciationId: id,
        period,
        depreciationAmount,
        bookValueBefore,
        bookValueAfter,
        calculationDate: new Date()
      }
    })

    // Update depreciation with new values
    await prisma.assetDepreciation.update({
      where: { id },
      data: {
        currentBookValue: bookValueAfter,
        accumulatedDepreciation: newAccumulatedDepreciation,
        lastCalculatedDate: new Date()
      }
    })

    res.json({
      success: true,
      data: { record },
      message: 'Depreciation calculated successfully'
    })
  } catch (error) {
    console.error('Error calculating depreciation:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to calculate depreciation'
    })
  }
})

// GET /api/asset-depreciations/:id/preview - Preview depreciation calculation
router.get('/:id/preview', authenticate, async (req, res) => {
  try {
    const { id } = req.params

    const depreciation = await prisma.assetDepreciation.findUnique({
      where: { id },
      include: {
        asset: true
      }
    })

    if (!depreciation) {
      return res.status(404).json({
        success: false,
        message: 'Depreciation not found'
      })
    }

    const calculation = calculateDepreciation(depreciation.asset, depreciation)
    const purchasePrice = parseFloat(depreciation.asset.purchasePrice) || 0
    const salvageValue = parseFloat(depreciation.salvageValue) || 0
    const currentBookValue = parseFloat(depreciation.currentBookValue) || purchasePrice

    res.json({
      success: true,
      data: {
        annualDepreciation: calculation.annualDepreciation,
        monthlyDepreciation: calculation.monthlyDepreciation,
        currentBookValue,
        remainingBookValue: Math.max(currentBookValue - calculation.annualDepreciation, salvageValue),
        totalDepreciableAmount: purchasePrice - salvageValue,
        accumulatedDepreciation: parseFloat(depreciation.accumulatedDepreciation) || 0
      }
    })
  } catch (error) {
    console.error('Error previewing depreciation:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to preview depreciation'
    })
  }
})

module.exports = router