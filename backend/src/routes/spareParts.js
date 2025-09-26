const express = require('express')
const { authenticate, authorize } = require('../middleware/auth')
const { PrismaClient } = require('@prisma/client')
const Joi = require('joi')

const router = express.Router()
const prisma = new PrismaClient()

// Validation schema untuk Spare Parts
const sparePartSchema = Joi.object({
  partNumber: Joi.string().required().min(2).max(50),
  name: Joi.string().required().min(2).max(100),
  description: Joi.string().optional().allow('').max(500),
  brand: Joi.string().optional().allow('').max(50),
  model: Joi.string().optional().allow('').max(50),
  category: Joi.string().valid('HARDWARE', 'SOFTWARE', 'ACCESSORY', 'CONSUMABLE').default('HARDWARE'),
  partType: Joi.string().valid('COMPONENT', 'ACCESSORY', 'CONSUMABLE', 'TOOL', 'SOFTWARE').default('COMPONENT'),
  status: Joi.string().valid('ACTIVE', 'DISCONTINUED', 'OUT_OF_STOCK', 'OBSOLETE').default('ACTIVE'),
  unitPrice: Joi.number().positive().required(),
  stockLevel: Joi.number().integer().min(0).default(0),
  minStockLevel: Joi.number().integer().min(0).default(10),
  maxStockLevel: Joi.number().integer().min(0).default(100),
  reorderPoint: Joi.number().integer().min(0).default(15),
  storageLocation: Joi.string().optional().allow('').max(100),
  specifications: Joi.object().optional(),
  compatibleWith: Joi.array().items(Joi.string()).optional(),
  notes: Joi.string().optional().allow('').max(1000),
  vendorId: Joi.string().optional().allow(''),
  isActive: Joi.boolean().default(true)
})

// GET /api/spare-parts - Get all spare parts
router.get('/', authenticate, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      category, 
      partType, 
      status,
      lowStock = false,
      vendorId,
      isActive 
    } = req.query
    
    const offset = (parseInt(page) - 1) * parseInt(limit)

    const where = {}
    
    if (search) {
      where.OR = [
        { partNumber: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (category) {
      where.category = category
    }
    
    if (partType) {
      where.partType = partType
    }
    
    if (status) {
      where.status = status
    }
    
    if (vendorId) {
      where.vendorId = vendorId
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true'
    }
    
    // Low stock filter
    if (lowStock === 'true') {
      where.stockLevel = { lte: prisma.raw('spare_parts.reorderPoint') }
    }

    const [spareParts, total] = await Promise.all([
      prisma.sparePart.findMany({
        where,
        skip: offset,
        take: parseInt(limit),
        orderBy: [
          { partNumber: 'asc' }
        ],
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          _count: {
            select: {
              usages: true,
              procurements: true
            }
          }
        }
      }),
      prisma.sparePart.count({ where })
    ])

    res.json({
      success: true,
      data: spareParts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Error fetching spare parts:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch spare parts',
      error: error.message
    })
  }
})

// GET /api/spare-parts/stats - Get spare parts statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const totalParts = await prisma.sparePart.count({
      where: { isActive: true }
    })
    
    const lowStockParts = await prisma.sparePart.count({
      where: {
        isActive: true,
        stockLevel: { lte: prisma.raw('spare_parts.reorderPoint') }
      }
    })
    
    const outOfStockParts = await prisma.sparePart.count({
      where: {
        OR: [
          { status: 'OUT_OF_STOCK' },
          { stockLevel: 0 }
        ]
      }
    })
    
    const categoryStats = await prisma.sparePart.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: { id: true }
    })
    
    const totalValue = await prisma.sparePart.aggregate({
      _sum: {
        unitPrice: true
      },
      where: { isActive: true }
    })

    res.json({
      success: true,
      data: {
        totalParts,
        lowStockParts,
        outOfStockParts,
        totalValue: totalValue._sum.unitPrice || 0,
        categoryStats
      }
    })
  } catch (error) {
    console.error('Error fetching spare parts stats:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch spare parts stats',
      error: error.message
    })
  }
})

// GET /api/spare-parts/low-stock - Get low stock spare parts
router.get('/low-stock', authenticate, async (req, res) => {
  try {
    const lowStockParts = await prisma.sparePart.findMany({
      where: {
        isActive: true,
        stockLevel: { lte: prisma.raw('spare_parts.reorderPoint') }
      },
      orderBy: [
        { stockLevel: 'asc' }
      ],
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    })

    res.json({
      success: true,
      data: lowStockParts
    })
  } catch (error) {
    console.error('Error fetching low stock parts:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch low stock parts',
      error: error.message
    })
  }
})

// GET /api/spare-parts/:id - Get spare part by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    
    const sparePart = await prisma.sparePart.findUnique({
      where: { id },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            code: true,
            email: true,
            phone: true
          }
        },
        usages: {
          include: {
            asset: {
              select: {
                id: true,
                assetTag: true,
                name: true
              }
            },
            usedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            usageDate: 'desc'
          },
          take: 10
        },
        procurements: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
                code: true
              }
            },
            orderedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            orderedDate: 'desc'
          },
          take: 10
        },
        _count: {
          select: {
            usages: true,
            procurements: true
          }
        }
      }
    })

    if (!sparePart) {
      return res.status(404).json({
        success: false,
        message: 'Spare part not found'
      })
    }

    res.json({
      success: true,
      data: sparePart
    })
  } catch (error) {
    console.error('Error fetching spare part:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch spare part',
      error: error.message
    })
  }
})

// POST /api/spare-parts - Create new spare part
router.post('/', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res) => {
  try {
    const { error, value } = sparePartSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      })
    }

    // Check if part number already exists
    const existingSparePart = await prisma.sparePart.findUnique({
      where: { partNumber: value.partNumber }
    })

    if (existingSparePart) {
      return res.status(400).json({
        success: false,
        message: 'Spare part with this part number already exists'
      })
    }

    // Validate vendor if provided
    if (value.vendorId) {
      const vendor = await prisma.vendor.findUnique({
        where: { 
          id: value.vendorId,
          companyId: req.user.companyId
        }
      })
      
      if (!vendor) {
        return res.status(400).json({
          success: false,
          message: 'Invalid vendor ID'
        })
      }
    }

    const sparePart = await prisma.sparePart.create({
      data: value,
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        _count: {
          select: {
            usages: true,
            procurements: true
          }
        }
      }
    })

    res.status(201).json({
      success: true,
      message: 'Spare part created successfully',
      data: sparePart
    })
  } catch (error) {
    console.error('Error creating spare part:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create spare part',
      error: error.message
    })
  }
})

// PUT /api/spare-parts/:id - Update spare part
router.put('/:id', authenticate, authorize('ADMIN', 'ASSET_ADMIN', 'TECHNICIAN'), async (req, res) => {
  try {
    const { id } = req.params
    const { error, value } = sparePartSchema.validate(req.body)
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      })
    }

    // Check if spare part exists
    const existingSparePart = await prisma.sparePart.findUnique({
      where: { id }
    })

    if (!existingSparePart) {
      return res.status(404).json({
        success: false,
        message: 'Spare part not found'
      })
    }

    // Check if part number conflicts with other parts
    const conflictSparePart = await prisma.sparePart.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          { partNumber: value.partNumber }
        ]
      }
    })

    if (conflictSparePart) {
      return res.status(400).json({
        success: false,
        message: 'Spare part with this part number already exists'
      })
    }

    // Validate vendor if provided
    if (value.vendorId) {
      const vendor = await prisma.vendor.findUnique({
        where: { 
          id: value.vendorId,
          companyId: req.user.companyId
        }
      })
      
      if (!vendor) {
        return res.status(400).json({
          success: false,
          message: 'Invalid vendor ID'
        })
      }
    }

    const updatedSparePart = await prisma.sparePart.update({
      where: { id },
      data: value,
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        _count: {
          select: {
            usages: true,
            procurements: true
          }
        }
      }
    })

    res.json({
      success: true,
      message: 'Spare part updated successfully',
      data: updatedSparePart
    })
  } catch (error) {
    console.error('Error updating spare part:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update spare part',
      error: error.message
    })
  }
})

// PUT /api/spare-parts/:id/stock - Update spare part stock level
router.put('/:id/stock', authenticate, authorize('ADMIN', 'ASSET_ADMIN', 'TECHNICIAN'), async (req, res) => {
  try {
    const { id } = req.params
    const { stockLevel, notes } = req.body

    if (typeof stockLevel !== 'number' || stockLevel < 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock level must be a non-negative number'
      })
    }

    // Check if spare part exists
    const existingSparePart = await prisma.sparePart.findUnique({
      where: { id }
    })

    if (!existingSparePart) {
      return res.status(404).json({
        success: false,
        message: 'Spare part not found'
      })
    }

    // Update stock level and status based on stock
    let status = existingSparePart.status
    if (stockLevel === 0) {
      status = 'OUT_OF_STOCK'
    } else if (existingSparePart.status === 'OUT_OF_STOCK') {
      status = 'ACTIVE'
    }

    const updatedSparePart = await prisma.sparePart.update({
      where: { id },
      data: {
        stockLevel,
        status,
        notes: notes ? `${existingSparePart.notes || ''}\n[${new Date().toISOString()}] Stock updated: ${notes}` : existingSparePart.notes
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    })

    res.json({
      success: true,
      message: 'Stock level updated successfully',
      data: updatedSparePart
    })
  } catch (error) {
    console.error('Error updating stock level:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update stock level',
      error: error.message
    })
  }
})

// DELETE /api/spare-parts/:id - Delete spare part
router.delete('/:id', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params

    // Check if spare part exists
    const existingSparePart = await prisma.sparePart.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            usages: true,
            procurements: true
          }
        }
      }
    })

    if (!existingSparePart) {
      return res.status(404).json({
        success: false,
        message: 'Spare part not found'
      })
    }

    // Check if spare part has usage history
    if (existingSparePart._count.usages > 0 || existingSparePart._count.procurements > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete spare part with usage history. Set as inactive instead.',
        details: {
          usages: existingSparePart._count.usages,
          procurements: existingSparePart._count.procurements
        }
      })
    }

    await prisma.sparePart.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: 'Spare part deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting spare part:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete spare part',
      error: error.message
    })
  }
})

module.exports = router