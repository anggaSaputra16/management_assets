const express = require('express')
const { authenticate, authorize } = require('../middleware/auth')
const { PrismaClient } = require('@prisma/client')
const Joi = require('joi')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

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
  ).required(),
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
  ).required(),
  license_key: Joi.string().optional().allow(''),
  status: Joi.string().valid('ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED', 'PENDING_RENEWAL', 'VIOLATION').optional().default('ACTIVE'),
  cost: Joi.number().optional().min(0).max(9999999999999.99),
  purchase_date: Joi.date().optional().allow(null),
  expiry_date: Joi.date().when('license_type', {
    is: 'SUBSCRIPTION',
    then: Joi.date().required(),
    otherwise: Joi.date().optional().allow(null)
  }),
  max_installations: Joi.number().optional().min(1),
  current_installations: Joi.number().optional().min(0),
  vendor_id: Joi.string().optional().allow(''),
  company_id: Joi.string().optional(),
  companyId: Joi.string().optional() // allow camelCase for compatibility
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
    
    // Fetch by unique id first, then enforce multi-company access control in JS.
    const softwareAsset = await prisma.softwareAsset.findUnique({
      where: { id },
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

    // Enforce company-level access: only allow access if asset belongs to user's company
    // or the user has an overriding role (ADMIN / TOP_MANAGEMENT).
    if (softwareAsset.companyId !== req.user.companyId && !['ADMIN', 'TOP_MANAGEMENT'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this software asset'
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
// Supports optional company_id override for ADMIN/TOP_MANAGEMENT users
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

    // Determine target companyId: allow override for ADMIN/TOP_MANAGEMENT, otherwise use user's company
    let targetCompanyId = req.user.companyId
    if (company_id && company_id !== req.user.companyId) {
      const allowedOverrideRoles = ['ADMIN', 'TOP_MANAGEMENT']
      if (allowedOverrideRoles.includes(req.user.role)) {
        const targetCompany = await prisma.company.findUnique({ where: { id: company_id } })
        if (!targetCompany || !targetCompany.isActive) {
          return res.status(400).json({ success: false, message: 'Target company not found or inactive.' })
        }
        targetCompanyId = company_id
      } else {
        // ignore provided company_id for non-authorized users
        targetCompanyId = req.user.companyId
      }
    }


    // Check if software asset with same name and version exists in target company
    const existingSoftware = await prisma.softwareAsset.findFirst({
      where: {
        companyId: targetCompanyId,
        name: softwareAssetData.name,
        version: softwareAssetData.version || null
      }
    })

    if (existingSoftware) {
      return res.status(400).json({
        success: false,
        message: 'Software asset with this name and version already exists in the target company'
      })
    }

    // Remove companyId/camelCase from frontend value if present
    if ('companyId' in softwareAssetData) {
      delete softwareAssetData.companyId
    }

    // Create software asset with license in transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Create software asset
      const softwareAsset = await prisma.softwareAsset.create({
        data: {
          ...softwareAssetData,
          companyId: targetCompanyId
        }
      })

      // Create license if license data is provided
      let license = null
      if (license_type || license_key || cost) {
        license = await prisma.softwareLicense.create({
          data: {
            softwareAssetId: softwareAsset.id,
            companyId: targetCompanyId,
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

// POST /api/software-assets/batch - Create multiple software assets in one request
router.post('/batch', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res) => {
  try {
    const items = req.body
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Request body must be a non-empty array of software assets' })
    }

    // Validate each item using the same Joi schema
    const created = []

    await prisma.$transaction(async (prismaTx) => {
      for (const raw of items) {
        const { error, value } = combinedSoftwareAssetSchema.validate(raw)
        if (error) {
          throw new Error('Validation error on one of the items: ' + error.details.map(d => d.message).join(', '))
        }

        // Determine company target similar to single create
        let targetCompanyId = req.user.companyId
        if (value.company_id && value.company_id !== req.user.companyId) {
          const allowedOverrideRoles = ['ADMIN', 'TOP_MANAGEMENT']
          if (allowedOverrideRoles.includes(req.user.role)) {
            const targetCompany = await prismaTx.company.findUnique({ where: { id: value.company_id } })
            if (!targetCompany || !targetCompany.isActive) {
              throw new Error('Target company not found or inactive for one of the items')
            }
            targetCompanyId = value.company_id
          }
        }

        // Skip duplicates in target company
        const exists = await prismaTx.softwareAsset.findFirst({
          where: {
            companyId: targetCompanyId,
            name: value.name,
            version: value.version || null
          }
        })
        if (exists) {
          // Skip and continue
          continue
        }

        const softwareAsset = await prismaTx.softwareAsset.create({
          data: {
            name: value.name,
            version: value.version || null,
            publisher: value.publisher || null,
            description: value.description || null,
            softwareType: value.softwareType,
            category: value.category || null,
            systemRequirements: value.systemRequirements || {},
            installationPath: value.installationPath || null,
            isActive: typeof value.isActive === 'boolean' ? value.isActive : true,
            companyId: targetCompanyId
          }
        })

        // Create license if present
        if (value.license_type || value.license_key || value.cost) {
          const mapLicenseType = (type) => {
            const mapping = {
              'SINGLE_USER': 'PERPETUAL',
              'MULTI_USER': 'VOLUME',
              'SITE_LICENSE': 'ENTERPRISE'
            }
            return mapping[type] || type
          }
          await prismaTx.softwareLicense.create({
            data: {
              softwareAssetId: softwareAsset.id,
              companyId: targetCompanyId,
              licenseType: mapLicenseType(value.license_type) || 'PERPETUAL',
              licenseKey: value.license_key || null,
              status: value.status || 'ACTIVE',
              totalSeats: value.max_installations || 1,
              usedSeats: value.current_installations || 0,
              availableSeats: (value.max_installations || 1) - (value.current_installations || 0),
              purchaseDate: value.purchase_date ? new Date(value.purchase_date) : null,
              expiryDate: value.expiry_date ? new Date(value.expiry_date) : null,
              purchaseCost: value.cost ? parseFloat(value.cost) : null,
              vendorId: value.vendor_id || null
            }
          })
        }

        created.push(softwareAsset)
      }
    })

    res.status(201).json({ success: true, message: 'Batch create completed', data: created })
  } catch (error) {
    console.error('Batch create software assets error:', error)
    res.status(500).json({ success: false, message: 'Failed batch create', error: process.env.NODE_ENV === 'development' ? error.message : undefined })
  }
})

// PUT /api/software-assets/:id - Update software asset
// Supports optional company_id override for ADMIN/TOP_MANAGEMENT users
router.put('/:id', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params
    // Use the same schema as POST for validation
    const { error, value } = combinedSoftwareAssetSchema.validate(req.body)
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      })
    }

    // Check if software asset exists and belongs to user's company (or allowed override will be handled)
    const existingSoftware = await prisma.softwareAsset.findUnique({
      where: { id }
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

    // Determine update companyId: allow override for ADMIN/TOP_MANAGEMENT
    let updateCompanyId = req.user.companyId
    if (value.company_id && value.company_id !== req.user.companyId) {
      const allowedOverrideRoles = ['ADMIN', 'TOP_MANAGEMENT']
      if (allowedOverrideRoles.includes(req.user.role)) {
        const targetCompany = await prisma.company.findUnique({ where: { id: value.company_id } })
        if (!targetCompany || !targetCompany.isActive) {
          return res.status(400).json({ success: false, message: 'Target company not found or inactive.' })
        }
        updateCompanyId = value.company_id
      }
    }

    // Separate asset and license fields
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
    } = value;

    // Remove companyId/camelCase from frontend value if present
    if ('companyId' in softwareAssetData) {
      delete softwareAssetData.companyId;
    }

    // Update software asset only with its own fields
    const updatedSoftware = await prisma.softwareAsset.update({
      where: { id },
      data: {
        ...softwareAssetData,
        companyId: updateCompanyId
      },
      include: {
        _count: {
          select: {
            licenses: true,
            installations: true
          }
        }
      }
    });

    // Optionally update license if license fields are present
    // Find the latest license for this asset
    const latestLicense = await prisma.softwareLicense.findFirst({
      where: { softwareAssetId: id },
      orderBy: { createdAt: 'desc' }
    });
    if (latestLicense) {
      await prisma.softwareLicense.update({
        where: { id: latestLicense.id },
        data: {
          licenseType: license_type || latestLicense.licenseType,
          licenseKey: license_key || latestLicense.licenseKey,
          status: licenseStatus || latestLicense.status,
          totalSeats: max_installations || latestLicense.totalSeats,
          usedSeats: current_installations || latestLicense.usedSeats,
          availableSeats: (max_installations || latestLicense.totalSeats) - (current_installations || latestLicense.usedSeats),
          purchaseDate: purchase_date ? new Date(purchase_date) : latestLicense.purchaseDate,
          expiryDate: expiry_date ? new Date(expiry_date) : latestLicense.expiryDate,
          purchaseCost: cost ? parseFloat(cost) : latestLicense.purchaseCost,
          vendorId: vendor_id || latestLicense.vendorId
        }
      });
    }

    res.json({
      success: true,
      message: 'Software asset updated successfully',
      data: updatedSoftware
    });
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
    // Fetch by unique id then enforce company ownership to avoid using non-unique compound `where` in `findUnique`.
    const existingSoftware = await prisma.softwareAsset.findUnique({ 
      where: { id },
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

    // Enforce company-level ownership for delete operation
    if (existingSoftware.companyId !== req.user.companyId && !['ADMIN', 'TOP_MANAGEMENT'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to delete this software asset' })
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

  // Configure multer for software file uploads (images and documents)
  const softwareStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = path.resolve(__dirname, '..', '..', 'uploads', 'software');
      try {
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      } catch (err) {
        console.error('Failed to prepare upload directory for software:', uploadDir, err);
        try {
          const os = require('os');
          const tmpDir = path.resolve(os.tmpdir(), 'management-assets-uploads');
          if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
          console.warn('Falling back to tmp upload directory for software:', tmpDir);
          cb(null, tmpDir);
        } catch (err2) {
          console.error('Fallback upload directory creation failed for software:', err2);
          cb(err2);
        }
      }
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, 'software-' + uniqueSuffix + ext);
    }
  });

  const softwareFileFilter = (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed! Only images and documents are permitted.'), false);
    }
  };

  const softwareUpload = multer({ storage: softwareStorage, fileFilter: softwareFileFilter, limits: { fileSize: 10 * 1024 * 1024 } });
  const uploadSoftwareMultiple = softwareUpload.array('attachments', 5);

  // Upload attachments for a software asset
  router.post('/:id/attachments', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), (req, res, next) => {
    uploadSoftwareMultiple(req, res, async function (err) {
      try {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({ success: false, message: err.message });
        } else if (err) {
          return res.status(400).json({ success: false, message: err.message });
        }

        const { id } = req.params;

        // Verify software asset exists
        const softwareAsset = await prisma.softwareAsset.findUnique({ where: { id } });
        if (!softwareAsset) {
          return res.status(404).json({ success: false, message: 'Software asset not found' });
        }

        if (!req.files || req.files.length === 0) {
          return res.status(400).json({ success: false, message: 'No files uploaded' });
        }

        const created = [];
        for (const file of req.files) {
          let attachmentType = 'OTHER';
          if (file.mimetype.startsWith('image/')) attachmentType = 'IMAGE';
          else if (file.mimetype === 'application/pdf' || file.mimetype.includes('word') || file.mimetype.includes('excel')) attachmentType = 'DOCUMENT';

          const record = await prisma.softwareAttachment.create({
            data: {
              fileName: file.filename,
              originalName: file.originalname,
              filePath: file.path,
              fileSize: file.size,
              mimeType: file.mimetype,
              attachmentType: attachmentType,
              description: file.originalname,
              softwareAssetId: id,
              companyId: req.user.companyId,
              uploadedById: req.user.id
            }
          });

          created.push(record);
        }

        res.status(201).json({ success: true, message: 'Software attachments uploaded', data: created });
      } catch (error) {
        next(error);
      }
    });
  });

module.exports = router