const express = require('express')
const { authenticate, authorize } = require('../middleware/auth')
const { PrismaClient } = require('@prisma/client')
const Joi = require('joi')

const router = express.Router()
const prisma = new PrismaClient()

// Validation schema untuk combined Software Asset and License data
const combinedSoftwareAssetSchema = Joi.object({
  // Software Asset fields
  name: Joi.string().required().min(2).max(100),
  version: Joi.string().optional().allow('').max(20),
  publisher: Joi.string().optional().allow('').max(100),
  description: Joi.string().optional().allow('').max(500),
  softwareType: Joi.string().valid(
    'OPERATING_SYSTEM',
    'APPLICATION', 
    'UTILITY',
    'DRIVER',
    'SECURITY',
    'DEVELOPMENT_TOOL',
    'OFFICE_SUITE',
    'DATABASE',
    'MIDDLEWARE',
    'PLUGIN'
  ).optional().default('APPLICATION'),
  category: Joi.string().optional().allow('').max(50),
  systemRequirements: Joi.object().optional(),
  installationPath: Joi.string().optional().allow('').max(500),
  isActive: Joi.boolean().default(true),
  
  // License fields (for frontend compatibility)
  license_type: Joi.string().valid(
    'PERPETUAL',
    'SUBSCRIPTION', 
    'OPEN_SOURCE',
    'TRIAL',
    'EDUCATIONAL',
    'ENTERPRISE',
    'OEM',
    'VOLUME',
    'SINGLE_USER',  // Map to PERPETUAL
    'MULTI_USER',   // Map to VOLUME
    'SITE_LICENSE'  // Map to ENTERPRISE
  ).optional().default('PERPETUAL'),
  license_key: Joi.string().optional().allow(''),
  status: Joi.string().valid('ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED', 'PENDING_RENEWAL', 'VIOLATION').optional().default('ACTIVE'),
  cost: Joi.number().optional().min(0),
  purchase_date: Joi.date().optional().allow(null),
  expiry_date: Joi.date().optional().allow(null),
  max_installations: Joi.number().optional().min(1),
  current_installations: Joi.number().optional().min(0),
  vendor_id: Joi.string().optional().allow(''),
  company_id: Joi.string().optional()
})

// GET /api/software-assets - Get all software assets with multi-company filtering
router.get('/', authenticate, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      softwareType,
      category,
      publisher,
      isActive 
    } = req.query
    
    const offset = (parseInt(page) - 1) * parseInt(limit)

    const where = {
      companyId: req.user.companyId // Multi-company filtering
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { publisher: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (softwareType) {
      where.softwareType = softwareType
    }
    
    if (category) {
      where.category = { contains: category, mode: 'insensitive' }
    }
    
    if (publisher) {
      where.publisher = { contains: publisher, mode: 'insensitive' }
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    const [softwareAssets, total] = await Promise.all([
      prisma.softwareAsset.findMany({
        where,
        skip: offset,
        take: parseInt(limit),
        orderBy: [
          { name: 'asc' }
        ],
        include: {
          licenses: {
            include: {
              vendor: {
                select: { id: true, name: true }
              }
            }
          },
          _count: {
            select: {
              licenses: true,
              installations: true
            }
          }
        }
      }),
      prisma.softwareAsset.count({ where })
    ])

    res.json({
      success: true,
      data: softwareAssets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Error fetching software assets:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch software assets',
      error: error.message
    })
  }
})

// GET /api/software-assets/stats - Get software assets statistics  
router.get('/stats', authenticate, async (req, res) => {
  try {
    const where = { companyId: req.user.companyId }
    
    const totalSoftware = await prisma.softwareAsset.count({
      where: { ...where, isActive: true }
    })
    
    const typeStats = await prisma.softwareAsset.groupBy({
      by: ['softwareType'],
      where,
      _count: { id: true }
    })
    
    const totalLicenses = await prisma.softwareLicense.count({
      where: { companyId: req.user.companyId }
    })
    
    const totalInstallations = await prisma.softwareInstallation.count({
      where: { companyId: req.user.companyId }
    })
    
    const expiringLicenses = await prisma.softwareLicense.count({
      where: {
        companyId: req.user.companyId,
        expiryDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        }
      }
    })

    res.json({
      success: true,
      data: {
        totalSoftware,
        totalLicenses,
        totalInstallations,
        expiringLicenses,
        typeStats
      }
    })
  } catch (error) {
    console.error('Error fetching software assets stats:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch software assets stats',
      error: error.message
    })
  }
})

// GET /api/software-assets/:id - Get software asset by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    
    const softwareAsset = await prisma.softwareAsset.findUnique({
      where: { 
        id,
        companyId: req.user.companyId // Multi-company filtering
      },
      include: {
        licenses: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        installations: {
          include: {
            asset: {
              select: {
                id: true,
                assetTag: true,
                name: true
              }
            },
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: {
            installationDate: 'desc'
          },
          take: 10
        },
        _count: {
          select: {
            licenses: true,
            installations: true
          }
        }
      }
    })

    if (!softwareAsset) {
      return res.status(404).json({
        success: false,
        message: 'Software asset not found'
      })
    }

    res.json({
      success: true,
      data: softwareAsset
    })
  } catch (error) {
    console.error('Error fetching software asset:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch software asset',
      error: error.message
    })
  }
})

// POST /api/software-assets - Create new software asset (Admin/Asset Admin only)
router.post('/', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res) => {
  try {
    const { error, value } = combinedSoftwareAssetSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      })
    }

    // Map license type for compatibility
    const mapLicenseType = (type) => {
      const mapping = {
        'SINGLE_USER': 'PERPETUAL',
        'MULTI_USER': 'VOLUME', 
        'SITE_LICENSE': 'ENTERPRISE'
      }
      return mapping[type] || type
    }

    // Separate software asset and license data
    const {
      license_type,
      license_key,
      status: licenseStatus,
      cost,
      purchase_date,
      expiry_date,
      max_installations,
      current_installations,
      vendor_id,
      company_id,
      ...softwareAssetData
    } = value

    // Check if software asset with same name and version exists in company
    const existingSoftware = await prisma.softwareAsset.findFirst({
      where: {
        companyId: req.user.companyId,
        name: softwareAssetData.name,
        version: softwareAssetData.version || null
      }
    })

    if (existingSoftware) {
      return res.status(400).json({
        success: false,
        message: 'Software asset with this name and version already exists in your company'
      })
    }

    // Create software asset with license in transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Create software asset
      const softwareAsset = await prisma.softwareAsset.create({
        data: {
          ...softwareAssetData,
          companyId: req.user.companyId
        }
      })

      // Create license if license data is provided
      let license = null
      if (license_type || license_key || cost) {
        license = await prisma.softwareLicense.create({
          data: {
            softwareAssetId: softwareAsset.id,
            companyId: req.user.companyId,
            licenseType: mapLicenseType(license_type) || 'PERPETUAL',
            licenseKey: license_key || null,
            status: licenseStatus || 'ACTIVE',
            totalSeats: max_installations || 1,
            usedSeats: current_installations || 0,
            availableSeats: (max_installations || 1) - (current_installations || 0),
            purchaseDate: purchase_date ? new Date(purchase_date) : null,
            expiryDate: expiry_date ? new Date(expiry_date) : null,
            purchaseCost: cost ? parseFloat(cost) : null,
            vendorId: vendor_id || null
          }
        })
      }

      return { softwareAsset, license }
    })

    // Fetch complete data with relations
    const completeData = await prisma.softwareAsset.findUnique({
      where: { id: result.softwareAsset.id },
      include: {
        licenses: {
          include: {
            vendor: {
              select: { id: true, name: true }
            }
          }
        },
        _count: {
          select: {
            licenses: true,
            installations: true
          }
        }
      }
    })

    res.status(201).json({
      success: true,
      message: 'Software asset created successfully',
      data: completeData
    })
  } catch (error) {
    console.error('Error creating software asset:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// PUT /api/software-assets/:id - Update software asset
router.put('/:id', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params
    const { error, value } = softwareAssetSchema.validate(req.body)
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      })
    }

    // Check if software asset exists and belongs to user's company
    const existingSoftware = await prisma.softwareAsset.findUnique({
      where: { 
        id,
        companyId: req.user.companyId
      }
    })

    if (!existingSoftware) {
      return res.status(404).json({
        success: false,
        message: 'Software asset not found'
      })
    }

    // Check if name and version conflicts with other software in company
    const conflictSoftware = await prisma.softwareAsset.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          { companyId: req.user.companyId },
          { name: value.name },
          { version: value.version || null }
        ]
      }
    })

    if (conflictSoftware) {
      return res.status(400).json({
        success: false,
        message: 'Software asset with this name and version already exists in your company'
      })
    }

    const updatedSoftware = await prisma.softwareAsset.update({
      where: { id },
      data: value,
      include: {
        _count: {
          select: {
            licenses: true,
            installations: true
          }
        }
      }
    })

    res.json({
      success: true,
      message: 'Software asset updated successfully',
      data: updatedSoftware
    })
  } catch (error) {
    console.error('Error updating software asset:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update software asset',
      error: error.message
    })
  }
})

// DELETE /api/software-assets/:id - Delete software asset (Admin only)
router.delete('/:id', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params

    // Check if software asset exists and belongs to user's company
    const existingSoftware = await prisma.softwareAsset.findUnique({
      where: { 
        id,
        companyId: req.user.companyId
      },
      include: {
        _count: {
          select: {
            licenses: true,
            installations: true
          }
        }
      }
    })

    if (!existingSoftware) {
      return res.status(404).json({
        success: false,
        message: 'Software asset not found'
      })
    }

    // Check if software asset has licenses or installations
    if (existingSoftware._count.licenses > 0 || existingSoftware._count.installations > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete software asset with existing licenses or installations. Set as inactive instead.',
        details: {
          licenses: existingSoftware._count.licenses,
          installations: existingSoftware._count.installations
        }
      })
    }

    await prisma.softwareAsset.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: 'Software asset deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting software asset:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete software asset',
      error: error.message
    })
  }
})

module.exports = router