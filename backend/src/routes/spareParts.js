const express = require('express')
const { authenticate, authorize } = require('../middleware/auth')
const { PrismaClient } = require('@prisma/client')
const Joi = require('joi')

const router = express.Router()
const prisma = new PrismaClient()

// Validation schema untuk Spare Parts
const sparePartSchema = Joi.object({
  partNumber: Joi.string().optional().allow('').min(2).max(50), // Made optional for dropdown selection
  name: Joi.string().required().min(2).max(100),
  description: Joi.string().optional().allow('').max(500),
  brand: Joi.string().optional().allow('').max(50),
  model: Joi.string().optional().allow('').max(50),
  // Accept category values case-insensitively by normalizing to UPPERCASE
  category: Joi.string().uppercase().valid('HARDWARE', 'SOFTWARE', 'ACCESSORY', 'CONSUMABLE').required(),
  partType: Joi.string().valid('COMPONENT', 'ACCESSORY', 'CONSUMABLE', 'TOOL', 'SOFTWARE').required(),
  status: Joi.string().valid('ACTIVE', 'DISCONTINUED', 'OUT_OF_STOCK', 'OBSOLETE').default('ACTIVE'),
  // unitPrice is optional now; allow null to support creating spare parts without price (e.g., from decomposition)
  unitPrice: Joi.number().positive().optional().allow(null),
  stockLevel: Joi.number().integer().min(0).default(0),
  minStockLevel: Joi.number().integer().min(0).default(10),
  maxStockLevel: Joi.number().integer().min(0).default(100),
  reorderPoint: Joi.number().integer().min(0).default(15),
  storageLocation: Joi.string().optional().allow('').max(100),
  specifications: Joi.object().optional(),
  compatibleWith: Joi.array().items(Joi.string()).optional(),
  notes: Joi.string().optional().allow('').max(1000),
  vendorId: Joi.string().optional().allow(''),
  companyId: Joi.string().optional(), // Allow companyId for multi-company support
  isActive: Joi.boolean().default(true)
})

// GET /api/spare-parts - Get all spare parts
router.get('/', authenticate, async (req, res) => {
  try {
    console.log('GET /api/spare-parts called by user:', req.user?.id, 'company:', req.user?.companyId)
    
    const {
      page = 1,
      limit = 10,
      search = '',
      partType,
      status,
      vendorId,
      isActive,
      lowStock
    } = req.query

    const pageNum = parseInt(page) || 1
    const limitNum = parseInt(limit) || 10
    const offset = (pageNum - 1) * limitNum

    // Build where clause based on provided filters
    const where = {}

    if (search && search.trim() !== '') {
      where.OR = [
        { partNumber: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
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
      // query params are strings; interpret 'true'/'false'
      where.isActive = isActive === 'true' || isActive === true
    }

    // Low stock filter: Prisma doesn't support comparing one column to another in the `where` clause
    // (e.g. stockLevel <= reorderPoint) via the regular query builder. To avoid using unsupported
    // prisma.raw inside a where and causing invalid invocation errors, handle low-stock as a
    // separate JS-side filter when requested.
    let spareParts = []
    let total = 0

    const includeForList = {
      vendor: { select: { id: true, name: true, code: true } },
      company: { select: { id: true, name: true } },
      _count: { select: { usages: true, procurements: true } }
    }

    if (lowStock === 'true') {
      // Fetch candidates and filter server-side for stockLevel <= reorderPoint
      const candidates = await prisma.sparePart.findMany({
        where,
        orderBy: [{ stockLevel: 'asc' }],
        include: includeForList
      })

      const filtered = candidates.filter(p =>
        (typeof p.stockLevel === 'number' && typeof p.reorderPoint === 'number')
          ? p.stockLevel <= p.reorderPoint
          : false
      )

      total = filtered.length
      const start = offset
      const end = offset + limitNum
      spareParts = filtered.slice(start, end)
    } else {
      const results = await Promise.all([
        prisma.sparePart.findMany({
          where,
          skip: offset,
          take: limitNum,
          orderBy: [{ partNumber: 'asc' }],
          include: includeForList
        }),
        prisma.sparePart.count({ where })
      ])

      spareParts = results[0]
      total = results[1]
    }

    res.json({
      success: true,
      data: spareParts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    })
    console.log(`GET /api/spare-parts: returning ${spareParts.length} spare parts (total in DB: ${total})`)
  } catch (error) {
    console.error('Error fetching spare parts:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch spare parts',
      error: error.message
    })
  }
})

// Development-only: public endpoint to return spare parts without authentication.
// This is intentionally only enabled in non-production to help local development/debugging
// (for example when the frontend dev session isn't authenticated). Do NOT enable in prod.
if (process.env.NODE_ENV !== 'production') {
  router.get('/public', async (req, res) => {
    try {
      const spareParts = await prisma.sparePart.findMany({
        orderBy: [{ partNumber: 'asc' }],
        include: {
          vendor: { select: { id: true, name: true, code: true } },
          _count: { select: { usages: true, procurements: true } }
        }
      })

      return res.json({ success: true, data: spareParts })
    } catch (error) {
      console.error('Error in /api/spare-parts/public:', error)
      return res.status(500).json({ success: false, message: 'Failed to fetch spare parts (public)', error: error.message })
    }
  })
}

// GET /api/spare-parts/stats - Get spare parts statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const totalParts = await prisma.sparePart.count({
      where: { isActive: true }
    })
    
    // Prisma does not reliably support comparing one column to another using the regular
    // query builder (e.g. stockLevel <= reorderPoint). Instead, fetch the minimal fields
    // and compute the low-stock count in JS to avoid unsupported where clauses.
    const _activePartsForLowStock = await prisma.sparePart.findMany({
      where: { isActive: true },
      select: { stockLevel: true, reorderPoint: true }
    })

    const lowStockParts = _activePartsForLowStock.filter(p =>
      typeof p.stockLevel === 'number' && typeof p.reorderPoint === 'number' && p.stockLevel <= p.reorderPoint
    ).length
    
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
    // Fetch candidates and filter server-side for stockLevel <= reorderPoint
    const candidates = await prisma.sparePart.findMany({
      where: { isActive: true },
      orderBy: [{ stockLevel: 'asc' }],
      include: {
        vendor: {
          select: { id: true, name: true, code: true }
        },
        company: { select: { id: true, name: true } }
      }
    })

    const filteredLowStock = candidates.filter(p =>
      typeof p.stockLevel === 'number' && typeof p.reorderPoint === 'number' && p.stockLevel <= p.reorderPoint
    )

    res.json({
      success: true,
      data: filteredLowStock
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

// GET /api/spare-parts/inventory - Get spare part by ID
// Prevent collisions where clients call /api/spare-parts/inventory (or other reserved words)
// which would otherwise be captured by the `/:id` route. We redirect to the main
// listing handler so queries like `/api/spare-parts/inventory?status=ACTIVE` work.
router.get('/inventory', authenticate, async (req, res) => {
  try {
    // Preserve query string and issue a temporary redirect to the canonical listing
    const url = require('url')
    const qs = url.parse(req.originalUrl).search || ''
    return res.redirect(307, `/api/spare-parts${qs}`)
  } catch (err) {
    console.error('Error handling /inventory redirect:', err)
    return res.status(500).json({ success: false, message: 'Failed to handle inventory route', error: err.message })
  }
})

// POST /api/spare-parts/inventory - Create new spare part (alias for POST /)
router.post('/inventory', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res) => {
  try {
    console.log('POST /api/spare-parts/inventory request body:', JSON.stringify(req.body, null, 2))
    const { error, value } = sparePartSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      })
    }

    // Determine target companyId: allow override for ADMIN/TOP_MANAGEMENT
    let targetCompanyId = req.user.companyId
    if (value.companyId && value.companyId !== req.user.companyId) {
      // Only ADMIN and TOP_MANAGEMENT can set different company
      if (req.user.role === 'ADMIN' || req.user.role === 'TOP_MANAGEMENT') {
        // Verify target company exists and is active
        const targetCompany = await prisma.company.findUnique({
          where: { id: value.companyId }
        })
        
        if (!targetCompany || !targetCompany.isActive) {
          return res.status(400).json({
            success: false,
            message: 'Invalid or inactive company'
          })
        }
        targetCompanyId = value.companyId
      } else {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to create spare parts for other companies'
        })
      }
    }

    // Validate vendor if provided
    if (value.vendorId) {
      const vendor = await prisma.vendor.findUnique({
        where: { 
          id: value.vendorId
        }
      })
      
      if (!vendor) {
        return res.status(400).json({
          success: false,
          message: 'Invalid vendor ID'
        })
      }
    }

    // Remove companyId from value to avoid duplication
    const { companyId: _, ...sparePartData } = value

    // If unitPrice is missing/null, default to 0 to satisfy DB schema which currently expects a non-null value.
    // Decomposition flows and other callers may omit unitPrice; we store 0 as a placeholder and pricing can be updated later.
    if (sparePartData.unitPrice === undefined || sparePartData.unitPrice === null) {
      sparePartData.unitPrice = 0
    }

    // Cleanup empty foreign keys (frontend may send empty strings for optional selects)
    if (sparePartData.vendorId === '' || sparePartData.vendorId === null) {
      delete sparePartData.vendorId
    }

    // Prevent accidental null assignment to unitPrice (DB currently requires non-null);
    // if frontend explicitly sent null, remove the field so existing value is preserved.
    if (sparePartData.unitPrice === null) {
      delete sparePartData.unitPrice
    }

    // Generate partNumber if not provided
    if (!sparePartData.partNumber || sparePartData.partNumber.trim() === '') {
      let generatedPartNumber
      let counter = 0
      do {
        generatedPartNumber = `SP-${Date.now()}${counter > 0 ? '-' + counter : ''}`
        counter++
      } while (await prisma.sparePart.findFirst({
        where: {
          partNumber: generatedPartNumber,
          companyId: targetCompanyId
        }
      }))

      sparePartData.partNumber = generatedPartNumber
    }

    const sparePart = await prisma.sparePart.create({
      data: {
        ...sparePartData,
        companyId: targetCompanyId
      },
        include: {
          vendor: { select: { id: true, name: true, code: true } },
          _count: { select: { usages: true, procurements: true } },
          procurements: {},
          usages: {},
          replacements: {},
          oldReplacements: {},
          registrations: {},
          sourceComponents: {}
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

// PUT /api/spare-parts/inventory/:id - Update spare part (alias for PUT /:id)
router.put('/inventory/:id', authenticate, authorize('ADMIN', 'ASSET_ADMIN', 'TECHNICIAN'), async (req, res) => {
  try {
    console.log('PUT /api/spare-parts/inventory/:id request body:', JSON.stringify(req.body, null, 2))
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

    // Determine target companyId: allow override for ADMIN/TOP_MANAGEMENT
    let targetCompanyId = existingSparePart.companyId
    if (value.companyId && value.companyId !== existingSparePart.companyId) {
      // Only ADMIN and TOP_MANAGEMENT can change company
      if (req.user.role === 'ADMIN' || req.user.role === 'TOP_MANAGEMENT') {
        // Verify target company exists and is active
        const targetCompany = await prisma.company.findUnique({
          where: { id: value.companyId }
        })
        
        if (!targetCompany || !targetCompany.isActive) {
          return res.status(400).json({
            success: false,
            message: 'Invalid or inactive company'
          })
        }
        targetCompanyId = value.companyId
      } else {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to move spare parts to other companies'
        })
      }
    }

    // Check if part number conflicts with other parts in target company (only if provided)
    if (value.partNumber && value.partNumber.trim() !== '') {
      const conflictSparePart = await prisma.sparePart.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            { partNumber: value.partNumber },
            { companyId: targetCompanyId }
          ]
        }
      })

      if (conflictSparePart) {
        return res.status(400).json({
          success: false,
          message: 'Spare part with this part number already exists in the target company'
        })
      }
    }

    // Validate vendor if provided
    if (value.vendorId) {
      const vendor = await prisma.vendor.findUnique({
        where: { 
          id: value.vendorId
        }
      })
      
      if (!vendor) {
        return res.status(400).json({
          success: false,
          message: 'Invalid vendor ID'
        })
      }
    }

    // Remove companyId from value to avoid duplication
    const { companyId: _, ...sparePartData } = value

    // Cleanup empty foreign keys (frontend may send empty strings for optional selects)
    if (sparePartData.vendorId === '' || sparePartData.vendorId === null) {
      delete sparePartData.vendorId
    }

    const updatedSparePart = await prisma.sparePart.update({
      where: { id },
      data: {
        ...sparePartData,
        companyId: targetCompanyId
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        company: {
          select: {
            id: true,
            name: true
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
        company: {
          select: {
            id: true,
            name: true
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
        // Include related components that reference this spare part as their source.
        sourceComponents: {
          include: {
            asset: {
              select: { id: true, assetTag: true, name: true }
            }
          },
          orderBy: { createdAt: 'desc' }
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
    console.log('POST /api/spare-parts request body:', JSON.stringify(req.body, null, 2))
    const { error, value } = sparePartSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      })
    }

    // Determine target companyId: allow override for ADMIN/TOP_MANAGEMENT
    let targetCompanyId = req.user.companyId
    if (value.companyId && value.companyId !== req.user.companyId) {
      // Only ADMIN and TOP_MANAGEMENT can set different company
      if (req.user.role === 'ADMIN' || req.user.role === 'TOP_MANAGEMENT') {
        // Verify target company exists and is active
        const targetCompany = await prisma.company.findUnique({
          where: { id: value.companyId }
        })
        
        if (!targetCompany || !targetCompany.isActive) {
          return res.status(400).json({
            success: false,
            message: 'Invalid or inactive company'
          })
        }
        targetCompanyId = value.companyId
      } else {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to create spare parts for other companies'
        })
      }
    }

    // Validate vendor if provided
    if (value.vendorId) {
      const vendor = await prisma.vendor.findUnique({
        where: { 
          id: value.vendorId
        }
      })
      
      if (!vendor) {
        return res.status(400).json({
          success: false,
          message: 'Invalid vendor ID'
        })
      }
    }

    // Remove companyId from value to avoid duplication
    const { companyId: _, ...sparePartData } = value

    // Cleanup empty foreign keys (frontend may send empty strings for optional selects)
    if (sparePartData.vendorId === '' || sparePartData.vendorId === null) {
      delete sparePartData.vendorId
    }

    // Generate partNumber if not provided
    if (!sparePartData.partNumber || sparePartData.partNumber.trim() === '') {
      let generatedPartNumber
      let counter = 0
      do {
        generatedPartNumber = `SP-${Date.now()}${counter > 0 ? '-' + counter : ''}`
        counter++
      } while (await prisma.sparePart.findFirst({
        where: {
          partNumber: generatedPartNumber,
          companyId: targetCompanyId
        }
      }))

      sparePartData.partNumber = generatedPartNumber
    }

    const sparePart = await prisma.sparePart.create({
      data: {
        ...sparePartData,
        companyId: targetCompanyId
      },
        include: {
          vendor: { select: { id: true, name: true, code: true } },
          _count: { select: { usages: true, procurements: true } },
          procurements: {},
          usages: {},
          replacements: {},
          oldReplacements: {},
          registrations: {},
          sourceComponents: {}
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
    console.log('PUT /api/spare-parts/:id request body:', JSON.stringify(req.body, null, 2))
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

    // Determine target companyId: allow override for ADMIN/TOP_MANAGEMENT
    let targetCompanyId = existingSparePart.companyId
    if (value.companyId && value.companyId !== existingSparePart.companyId) {
      // Only ADMIN and TOP_MANAGEMENT can change company
      if (req.user.role === 'ADMIN' || req.user.role === 'TOP_MANAGEMENT') {
        // Verify target company exists and is active
        const targetCompany = await prisma.company.findUnique({
          where: { id: value.companyId }
        })
        
        if (!targetCompany || !targetCompany.isActive) {
          return res.status(400).json({
            success: false,
            message: 'Invalid or inactive company'
          })
        }
        targetCompanyId = value.companyId
      } else {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to move spare parts to other companies'
        })
      }
    }

    // Check if part number conflicts with other parts in target company (only if provided)
    if (value.partNumber && value.partNumber.trim() !== '') {
      const conflictSparePart = await prisma.sparePart.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            { partNumber: value.partNumber },
            { companyId: targetCompanyId }
          ]
        }
      })

      if (conflictSparePart) {
        return res.status(400).json({
          success: false,
          message: 'Spare part with this part number already exists in the target company'
        })
      }
    }

    // Validate vendor if provided
    if (value.vendorId) {
      const vendor = await prisma.vendor.findUnique({
        where: { 
          id: value.vendorId
        }
      })
      
      if (!vendor) {
        return res.status(400).json({
          success: false,
          message: 'Invalid vendor ID'
        })
      }
    }

    // Remove companyId from value to avoid duplication
    const { companyId: _, ...sparePartData } = value

    // Cleanup empty foreign keys (frontend may send empty strings for optional selects)
    if (sparePartData.vendorId === '' || sparePartData.vendorId === null) {
      delete sparePartData.vendorId
    }

    const updatedSparePart = await prisma.sparePart.update({
      where: { id },
      data: {
        ...sparePartData,
        companyId: targetCompanyId
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        company: {
          select: {
            id: true,
            name: true
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

// POST /api/spare-parts/upsert - Find by partNumber or name and increment/create
router.post('/upsert', authenticate, authorize('ADMIN', 'ASSET_ADMIN', 'TECHNICIAN', 'MANAGER'), async (req, res) => {
  console.log('POST /api/spare-parts/upsert called by user:', req.user?.id, 'role:', req.user?.role)
  try {
    const { partNumber, name, quantity = 1, unitPrice, notes, companyId } = req.body

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Name is required for upsert' })
    }

    // Determine target companyId - allow override for ADMIN/TOP_MANAGEMENT
    let targetCompanyId = req.user.companyId
    if (companyId && companyId !== req.user.companyId) {
      if (req.user.role === 'ADMIN' || req.user.role === 'TOP_MANAGEMENT') {
        const targetCompany = await prisma.company.findUnique({ where: { id: companyId } })
        if (!targetCompany || !targetCompany.isActive) {
          return res.status(400).json({ success: false, message: 'Invalid or inactive company' })
        }
        targetCompanyId = companyId
      } else {
        return res.status(403).json({ success: false, message: 'No permission to upsert for other company' })
      }
    }

    // Try to find existing spare part by partNumber then by name (contains)
    let existing = null
    if (partNumber && partNumber.trim() !== '') {
      existing = await prisma.sparePart.findFirst({ where: { partNumber, companyId: targetCompanyId } })
    }

    if (!existing) {
      existing = await prisma.sparePart.findFirst({
        where: {
          companyId: targetCompanyId,
          name: { contains: name, mode: 'insensitive' }
        }
      })
    }

    if (existing) {
      // Update stockLevel (increment) and optionally unitPrice/notes
      const updated = await prisma.sparePart.update({
        where: { id: existing.id },
        data: {
          stockLevel: (existing.stockLevel || 0) + (Number(quantity) || 0),
          unitPrice: typeof unitPrice === 'number' ? unitPrice : existing.unitPrice,
          notes: notes ? `${existing.notes || ''}\n[${new Date().toISOString()}] ${notes}` : existing.notes
        },
        include: {
          vendor: { select: { id: true, name: true, code: true } },
          company: { select: { id: true, name: true } },
          sourceComponents: {}
        }
      })

      return res.json({ success: true, message: 'Spare part updated', data: updated })
    }

    // Not found -> create new spare part with reasonable defaults
    // Use defaults for required fields category & partType since this endpoint
    // is intended for internal upsert flows (decomposition). Adjust as needed.
    let generatedPartNumber = partNumber
    if (!generatedPartNumber || generatedPartNumber.trim() === '') {
      let counter = 0
      do {
        generatedPartNumber = `SP-${Date.now()}${counter > 0 ? '-' + counter : ''}`
        counter++
      } while (await prisma.sparePart.findFirst({ where: { partNumber: generatedPartNumber, companyId: targetCompanyId } }))
    }

    const created = await prisma.sparePart.create({
      data: {
        partNumber: generatedPartNumber,
        name: name.trim(),
        description: notes || undefined,
        unitPrice: typeof unitPrice === 'number' ? unitPrice : 0,
        stockLevel: Number(quantity) || 0,
        companyId: targetCompanyId,
        category: 'HARDWARE',
        partType: 'COMPONENT',
        isActive: true
      },
      include: {
        vendor: { select: { id: true, name: true, code: true } },
        company: { select: { id: true, name: true } },
        sourceComponents: {}
      }
    })

    return res.status(201).json({ success: true, message: 'Spare part created', data: created })
  } catch (error) {
    console.error('Error in upsert spare part:', error)
    return res.status(500).json({ success: false, message: 'Failed to upsert spare part', error: error.message })
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