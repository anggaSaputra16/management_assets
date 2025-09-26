const express = require('express');
const Joi = require('joi');
const { prisma } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer for asset image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../../uploads/assets');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'asset-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Validation schemas - simplified to only require mandatory fields
const createAssetSchema = Joi.object({
  // Mandatory fields
  name: Joi.string().required(),
  categoryId: Joi.string().required(),
  locationId: Joi.string().required(),
  companyId: Joi.string().optional(),
  
  // Optional fields
  description: Joi.string().optional().allow('', null),
  serialNumber: Joi.string().optional().allow('', null),
  model: Joi.string().optional().allow('', null),
  brand: Joi.string().optional().allow('', null),
  poNumber: Joi.string().optional().allow('', null),
  purchaseDate: Joi.alternatives().try(
    Joi.date(),
    Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
    Joi.string().allow('', null)
  ).optional(),
  purchasePrice: Joi.alternatives().try(
    Joi.number().positive(),
    Joi.string().pattern(/^\d*\.?\d*$/),
    Joi.allow(null, '')
  ).optional(),
  currentValue: Joi.alternatives().try(
    Joi.number().positive(),
    Joi.string().pattern(/^\d*\.?\d*$/),
    Joi.allow(null, '')
  ).optional(),
  warrantyExpiry: Joi.alternatives().try(
    Joi.date(),
    Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
    Joi.string().allow('', null)
  ).optional(),
  condition: Joi.string().valid('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DAMAGED').optional(),
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED', 'DISPOSED').optional(),
  notes: Joi.string().optional().allow('', null),
  vendorId: Joi.string().optional().allow(null, ''),
  departmentId: Joi.string().optional().allow(null, ''),
  assignedToId: Joi.string().optional().allow(null, ''),
  specifications: Joi.object().optional(),
  imageUrl: Joi.string().optional().allow('', null)
}).unknown(true); // Allow unknown fields to be more flexible

const updateAssetSchema = Joi.object({
  assetTag: Joi.string().optional(),
  name: Joi.string().optional(),
  description: Joi.string().optional().allow('', null),
  serialNumber: Joi.string().optional().allow('', null),
  model: Joi.string().optional().allow('', null),
  brand: Joi.string().optional().allow('', null),
  poNumber: Joi.string().optional().allow('', null),
  purchaseDate: Joi.alternatives().try(
    Joi.date(),
    Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
    Joi.string().allow('', null)
  ).optional(),
  purchasePrice: Joi.alternatives().try(
    Joi.number().positive(),
    Joi.string().pattern(/^\d*\.?\d*$/),
    Joi.allow(null, '')
  ).optional(),
  currentValue: Joi.alternatives().try(
    Joi.number().positive(),
    Joi.string().pattern(/^\d*\.?\d*$/),
    Joi.allow(null, '')
  ).optional(),
  warrantyExpiry: Joi.alternatives().try(
    Joi.date(),
    Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
    Joi.string().allow('', null)
  ).optional(),
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED', 'DISPOSED').optional(),
  condition: Joi.string().valid('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DAMAGED').optional(),
  notes: Joi.string().optional().allow('', null),
  categoryId: Joi.string().optional(),
  vendorId: Joi.string().optional().allow(null, ''),
  locationId: Joi.string().optional(),
  departmentId: Joi.string().optional().allow(null, ''),
  assignedToId: Joi.string().optional().allow(null, ''),
  isActive: Joi.boolean().optional(),
  specifications: Joi.object().optional(),
  imageUrl: Joi.string().optional().allow('', null),
  companyId: Joi.string().optional() // Allow companyId from frontend
}).unknown(true); // Allow unknown fields to be more flexible

// Get all assets
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      status, 
      category, 
      department, 
      location,
      assignedTo 
    } = req.query;
    
    const skip = (page - 1) * limit;
    const companyId = req.user.companyId;
    const where = { companyId };

    // Role-based filtering
    if (req.user.role === 'DEPARTMENT_USER') {
      where.departmentId = req.user.departmentId;
    }

    if (search) {
      where.OR = [
        { assetTag: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status) where.status = status;
    if (category) where.categoryId = category;
    if (department) where.departmentId = department;
    if (location) where.locationId = location;
    if (assignedTo) where.assignedToId = assignedTo;

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, code: true }
          },
          vendor: {
            select: { id: true, name: true, code: true }
          },
          location: {
            select: { id: true, name: true, building: true, room: true }
          },
          department: {
            select: { id: true, name: true, code: true }
          },
          assignedTo: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.asset.count({ where })
    ]);

    res.json({
      success: true,
      data: assets
    });
  } catch (error) {
    next(error);
  }
});

// Get asset by ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true, code: true }
        },
        vendor: {
          select: { id: true, name: true, code: true, contactPerson: true, phone: true }
        },
        location: {
          select: { id: true, name: true, building: true, floor: true, room: true }
        },
        department: {
          select: { id: true, name: true, code: true }
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true }
        },
        maintenanceRecords: {
          select: {
            id: true,
            maintenanceType: true,
            description: true,
            scheduledDate: true,
            completedDate: true,
            status: true,
            actualCost: true,
            estimatedCost: true
          },
          orderBy: { scheduledDate: 'desc' },
          take: 5
        },
        auditRecords: {
          select: {
            id: true,
            auditType: true,
            scheduledDate: true,
            completedDate: true,
            status: true,
            findings: true
          },
          orderBy: { scheduledDate: 'desc' },
          take: 5
        }
      }
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    // Check permissions
    if (req.user.role === 'DEPARTMENT_USER' && asset.departmentId !== req.user.departmentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this asset'
      });
    }

    res.json({
      success: true,
      data: asset
    });
  } catch (error) {
    next(error);
  }
});

// Create new asset (Admin/Asset Admin only)
router.post('/', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res, next) => {
  try {
    const { error, value } = createAssetSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    // Validate foreign keys
    const [category, vendor, location, department] = await Promise.all([
      prisma.category.findUnique({ where: { id: value.categoryId } }),
      value.vendorId ? prisma.vendor.findUnique({ where: { id: value.vendorId } }) : null,
      value.locationId ? prisma.location.findUnique({ where: { id: value.locationId } }) : null,
      value.departmentId ? prisma.department.findUnique({ where: { id: value.departmentId } }) : null
    ]);

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    if (value.vendorId && !vendor) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vendor'
      });
    }

    if (value.locationId && !location) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location'
      });
    }

    if (value.departmentId && !department) {
      return res.status(400).json({
        success: false,
        message: 'Invalid department'
      });
    }

    // Generate unique asset tag
    const generateAssetTag = async (companyId) => {
      const count = await prisma.asset.count({
        where: { companyId }
      });
      let assetTag;
      let attempts = 0;
      
      do {
        const tagNumber = String(count + 1 + attempts).padStart(6, '0');
        assetTag = `AST-${tagNumber}`;
        
        const existingAsset = await prisma.asset.findFirst({
          where: { 
            assetTag: assetTag,
            companyId: companyId
          }
        });
        
        if (!existingAsset) {
          return assetTag;
        }
        
        attempts++;
      } while (attempts < 100); // Prevent infinite loop
      
      throw new Error('Unable to generate unique asset tag');
    };

    const companyId = req.user.companyId;
    const assetTag = await generateAssetTag(companyId);

    // Process and clean data
    const processedData = {
      ...value,
      companyId,
      assetTag,
      // Convert string prices to numbers
      purchasePrice: value.purchasePrice ? parseFloat(value.purchasePrice) || null : null,
      currentValue: value.currentValue ? parseFloat(value.currentValue) || null : null,
      // Convert empty strings to null for optional fields
      vendorId: value.vendorId === '' ? null : value.vendorId,
      departmentId: value.departmentId === '' ? null : value.departmentId,
      assignedToId: value.assignedToId === '' ? null : value.assignedToId,
      // Parse dates properly
      purchaseDate: value.purchaseDate && value.purchaseDate !== '' ? new Date(value.purchaseDate) : null,
      warrantyExpiry: value.warrantyExpiry && value.warrantyExpiry !== '' ? new Date(value.warrantyExpiry) : null,
      // Map status from frontend to backend
      status: value.status === 'ACTIVE' ? 'AVAILABLE' : (value.status === 'INACTIVE' ? 'RETIRED' : value.status),
      // Ensure specifications is an object
      specifications: value.specifications || {}
    };

    // Create asset
    const asset = await prisma.asset.create({
      data: processedData,
      include: {
        category: {
          select: { id: true, name: true, code: true }
        },
        vendor: {
          select: { id: true, name: true, code: true }
        },
        location: {
          select: { id: true, name: true, building: true, room: true }
        },
        department: {
          select: { id: true, name: true, code: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Asset created successfully',
      data: asset
    });
  } catch (error) {
    next(error);
  }
});

// Update asset (Admin/Asset Admin only)
router.put('/:id', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = updateAssetSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    // Check if asset exists
    const existingAsset = await prisma.asset.findUnique({
      where: { id }
    });

    if (!existingAsset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    // Check for asset tag conflicts (excluding current asset)
    if (value.assetTag) {
      const conflict = await prisma.asset.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            { assetTag: value.assetTag }
          ]
        }
      });

      if (conflict) {
        return res.status(400).json({
          success: false,
          message: 'Asset tag already exists'
        });
      }
    }

    // Validate foreign keys if provided
    if (value.categoryId) {
      const category = await prisma.category.findUnique({ 
        where: { id: value.categoryId } 
      });
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category'
        });
      }
    }

    if (value.assignedToId) {
      const user = await prisma.user.findUnique({ 
        where: { id: value.assignedToId } 
      });
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid assigned user'
        });
      }
    }

    // Process and clean data
    const processedData = {
      ...value,
      // Convert string prices to numbers
      purchasePrice: value.purchasePrice ? parseFloat(value.purchasePrice) || null : undefined,
      currentValue: value.currentValue ? parseFloat(value.currentValue) || null : undefined,
      // Convert empty strings to null for optional fields
      vendorId: value.vendorId === '' ? null : value.vendorId,
      departmentId: value.departmentId === '' ? null : value.departmentId,
      assignedToId: value.assignedToId === '' ? null : value.assignedToId,
      // Parse dates properly
      purchaseDate: value.purchaseDate && value.purchaseDate !== '' ? new Date(value.purchaseDate) : undefined,
      warrantyExpiry: value.warrantyExpiry && value.warrantyExpiry !== '' ? new Date(value.warrantyExpiry) : undefined,
      // Map status from frontend to backend
      status: value.status === 'ACTIVE' ? 'AVAILABLE' : (value.status === 'INACTIVE' ? 'RETIRED' : value.status),
    };

    // Remove undefined values to avoid overwriting with undefined
    Object.keys(processedData).forEach(key => {
      if (processedData[key] === undefined) {
        delete processedData[key];
      }
    });

    // Update asset
    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: processedData,
      include: {
        category: {
          select: { id: true, name: true, code: true }
        },
        vendor: {
          select: { id: true, name: true, code: true }
        },
        location: {
          select: { id: true, name: true, building: true, room: true }
        },
        department: {
          select: { id: true, name: true, code: true }
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    res.json({
      success: true,
      message: 'Asset updated successfully',
      data: updatedAsset
    });
  } catch (error) {
    next(error);
  }
});

// Delete asset (Admin only)
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if asset exists
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            maintenanceRecords: true,
            auditRecords: true,
            assetRequests: true
          }
        }
      }
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    // Check if asset has related records
    if (asset._count.maintenanceRecords > 0 || 
        asset._count.auditRecords > 0 || 
        asset._count.assetRequests > 0) {
      
      // Soft delete by setting isActive to false
      await prisma.asset.update({
        where: { id },
        data: { isActive: false, status: 'DISPOSED' }
      });
    } else {
      // Hard delete if no related records
      await prisma.asset.delete({
        where: { id }
      });
    }

    res.json({
      success: true,
      message: 'Asset deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Assign asset to user (Admin/Asset Admin only)
router.post('/:id/assign', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const assignSchema = Joi.object({
      userId: Joi.string().required(),
      notes: Joi.string().optional()
    });

    const { error, value } = assignSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    // Check if asset exists and is available
    const asset = await prisma.asset.findUnique({
      where: { id }
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    if (asset.status !== 'AVAILABLE') {
      return res.status(400).json({
        success: false,
        message: 'Asset is not available for assignment'
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: value.userId }
    });

    if (!user || !user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user or user not active'
      });
    }

    // Update asset
    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: {
        assignedToId: value.userId,
        status: 'IN_USE',
        notes: value.notes
      },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        category: {
          select: { id: true, name: true, code: true }
        }
      }
    });

    res.json({
      success: true,
      message: 'Asset assigned successfully',
      data: updatedAsset
    });
  } catch (error) {
    next(error);
  }
});

// Unassign asset (Admin/Asset Admin only)
router.post('/:id/unassign', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if asset exists
    const asset = await prisma.asset.findUnique({
      where: { id }
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    if (!asset.assignedToId) {
      return res.status(400).json({
        success: false,
        message: 'Asset is not currently assigned'
      });
    }

    // Update asset
    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: {
        assignedToId: null,
        status: 'AVAILABLE'
      },
      include: {
        category: {
          select: { id: true, name: true, code: true }
        }
      }
    });

    res.json({
      success: true,
      message: 'Asset unassigned successfully',
      data: updatedAsset
    });
  } catch (error) {
    next(error);
  }
});

// Transfer asset to different location/department/user
router.post('/:id/transfer', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const transferSchema = Joi.object({
      toLocationId: Joi.string().optional(),
      toDepartmentId: Joi.string().optional(),
      toUserId: Joi.string().optional(),
      reason: Joi.string().required(),
      notes: Joi.string().optional(),
      effectiveDate: Joi.date().optional(),
      // Allow legacy field names for backward compatibility
      locationId: Joi.string().optional(),
      departmentId: Joi.string().optional()
    }).unknown(true);

    const { error, value } = transferSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    // Handle backward compatibility for old field names
    const processedData = {
      toLocationId: value.toLocationId || value.locationId,
      toDepartmentId: value.toDepartmentId || value.departmentId,
      toUserId: value.toUserId,
      reason: value.reason,
      notes: value.notes,
      effectiveDate: value.effectiveDate || new Date()
    }

    // Validate that at least one target is specified
    if (!processedData.toLocationId && !processedData.toDepartmentId && !processedData.toUserId) {
      return res.status(400).json({
        success: false,
        message: 'At least one target (location, department, or user) must be specified for transfer'
      });
    }

    // Check if asset exists
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        location: true,
        department: true,
        assignedTo: true
      }
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    // Create a unique transfer number
    const transferCount = await prisma.assetTransfer.count();
    const transferNumber = `TR-${String(transferCount + 1).padStart(6, '0')}`;

    // Create transfer record
    const transfer = await prisma.assetTransfer.create({
      data: {
        transferNumber,
        reason: processedData.reason,
        notes: processedData.notes,
        effectiveDate: processedData.effectiveDate,
        status: 'PENDING',
        assetId: asset.id,
        fromLocationId: asset.locationId,
        toLocationId: processedData.toLocationId,
        fromDepartmentId: asset.departmentId,
        toDepartmentId: processedData.toDepartmentId,
        fromUserId: asset.assignedToId,
        toUserId: processedData.toUserId,
        requestedById: req.user.id,
      },
      include: {
        asset: true,
        fromLocation: true,
        toLocation: true,
        fromDepartment: true,
        toDepartment: true,
        fromUser: true,
        toUser: true,
        requestedBy: true
      }
    });

    res.json({
      success: true,
      message: 'Asset transfer request created successfully',
      data: transfer
    });
  } catch (error) {
    next(error);
  }
});

// Set up or update depreciation for an asset
router.post('/:id/depreciation', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const depreciationSchema = Joi.object({
      depreciationMethod: Joi.string().valid('STRAIGHT_LINE', 'DECLINING_BALANCE', 'UNITS_OF_PRODUCTION').required(),
      usefulLife: Joi.number().integer().required(),
      salvageValue: Joi.number().min(0).required(),
      depreciationRate: Joi.number().min(0).max(1).optional(),
      notes: Joi.string().optional()
    });
    
    const { error, value } = depreciationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    // Check if asset exists
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        depreciation: true
      }
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    if (!asset.purchasePrice) {
      return res.status(400).json({
        success: false,
        message: 'Asset purchase price is required for depreciation calculation'
      });
    }

    // Calculate initial current book value
    const currentBookValue = asset.purchasePrice;
    const salvageValue = parseFloat(value.salvageValue);
    
    // Create or update depreciation settings
    let depreciation;
    if (asset.depreciation) {
      depreciation = await prisma.assetDepreciation.update({
        where: { id: asset.depreciation.id },
        data: {
          depreciationMethod: value.depreciationMethod,
          usefulLife: value.usefulLife,
          salvageValue,
          depreciationRate: value.depreciationRate || null,
          currentBookValue,
          accumulatedDepreciation: 0,
          lastCalculatedDate: new Date(),
          isActive: true,
          notes: value.notes
        }
      });
    } else {
      depreciation = await prisma.assetDepreciation.create({
        data: {
          depreciationMethod: value.depreciationMethod,
          usefulLife: value.usefulLife,
          salvageValue,
          depreciationRate: value.depreciationRate || null,
          currentBookValue,
          accumulatedDepreciation: 0,
          lastCalculatedDate: new Date(),
          isActive: true,
          notes: value.notes,
          asset: {
            connect: {
              id: asset.id
            }
          }
        }
      });
    }

    res.json({
      success: true,
      message: 'Depreciation settings updated successfully',
      data: depreciation
    });
  } catch (error) {
    next(error);
  }
});

// Calculate current depreciation value
router.get('/:id/depreciation', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if asset exists with depreciation settings
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        depreciation: true
      }
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    if (!asset.depreciation) {
      return res.status(400).json({
        success: false,
        message: 'No depreciation settings found for this asset'
      });
    }

    if (!asset.purchaseDate) {
      return res.status(400).json({
        success: false,
        message: 'Asset purchase date is required for depreciation calculation'
      });
    }

    const dep = asset.depreciation;
    const purchaseDate = new Date(asset.purchaseDate);
    const today = new Date();
    
    // Calculate years in service
    const msInYear = 1000 * 60 * 60 * 24 * 365.25;
    const yearsInService = (today - purchaseDate) / msInYear;
    
    let currentValue;
    let accumulatedDepreciation;
    
    // Calculate depreciation based on method
    if (dep.depreciationMethod === 'STRAIGHT_LINE') {
      const annualDepreciation = (asset.purchasePrice.toNumber() - dep.salvageValue.toNumber()) / dep.usefulLife;
      accumulatedDepreciation = Math.min(annualDepreciation * yearsInService, asset.purchasePrice.toNumber() - dep.salvageValue.toNumber());
      currentValue = asset.purchasePrice.toNumber() - accumulatedDepreciation;
    } 
    else if (dep.depreciationMethod === 'DECLINING_BALANCE') {
      const rate = dep.depreciationRate?.toNumber() || (1 / dep.usefulLife * 2);
      currentValue = asset.purchasePrice.toNumber() * Math.pow(1 - rate, Math.min(yearsInService, dep.usefulLife));
      accumulatedDepreciation = asset.purchasePrice.toNumber() - currentValue;
    }
    else {
      // Units of production would need production data which we don't have
      // So we're using straight line as fallback
      const annualDepreciation = (asset.purchasePrice.toNumber() - dep.salvageValue.toNumber()) / dep.usefulLife;
      accumulatedDepreciation = Math.min(annualDepreciation * yearsInService, asset.purchasePrice.toNumber() - dep.salvageValue.toNumber());
      currentValue = asset.purchasePrice.toNumber() - accumulatedDepreciation;
    }
    
    // Ensure value doesn't go below salvage value
    currentValue = Math.max(currentValue, dep.salvageValue.toNumber());
    
    // Update asset currentValue and depreciation record
    await prisma.asset.update({
      where: { id },
      data: {
        currentValue
      }
    });
    
    await prisma.assetDepreciation.update({
      where: { id: dep.id },
      data: {
        currentBookValue: currentValue,
        accumulatedDepreciation,
        lastCalculatedDate: today
      }
    });
    
    res.json({
      success: true,
      data: {
        originalValue: asset.purchasePrice.toNumber(),
        currentValue,
        accumulatedDepreciation,
        salvageValue: dep.salvageValue.toNumber(),
        usefulLife: dep.usefulLife,
        yearsInService: parseFloat(yearsInService.toFixed(2)),
        lastCalculated: today,
        depreciationMethod: dep.depreciationMethod
      }
    });
  } catch (error) {
    next(error);
  }
});

// Generate QR code for an asset
router.post('/:id/generate-qr', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { format = 'file' } = req.body;

    // Check if asset exists
    const asset = await prisma.asset.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: true,
        location: true,
        department: true,
        vendor: true,
        assignedTo: true
      }
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    // Create QR data object
    const qrData = {
      id: asset.id,
      assetTag: asset.assetTag,
      name: asset.name,
      serialNumber: asset.serialNumber || '',
      category: asset.category?.name || '',
      status: asset.status,
      timestamp: new Date().toISOString(),
    };

    // Return QR data as JSON
    res.json({
      success: true,
      data: qrData
    });
  } catch (error) {
    next(error);
  }
});

// Upload asset image
router.post('/:id/upload-image', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), upload.single('image'), async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Check if asset exists
    const asset = await prisma.asset.findUnique({
      where: { id }
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    // Create image URL
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const imageUrl = `${baseUrl}/uploads/assets/${req.file.filename}`;

    // Update asset with image URL
    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: { imageUrl }
    });

    res.json({
      success: true,
      message: 'Asset image uploaded successfully',
      data: {
        imageUrl,
        asset: updatedAsset
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get asset statistics
router.get('/statistics/overview', authenticate, authorize('ADMIN', 'ASSET_ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const [
      totalAssets,
      assetsByStatus,
      assetsByCategory,
      totalValue,
      maintenanceDue
    ] = await Promise.all([
      prisma.asset.count({ where: { isActive: true } }),
      prisma.asset.groupBy({
        by: ['status'],
        where: { isActive: true },
        _count: true
      }),
      prisma.asset.groupBy({
        by: ['categoryId'],
        where: { isActive: true },
        _count: true,
        _sum: { currentValue: true }
      }),
      prisma.asset.aggregate({
        where: { isActive: true },
        _sum: { currentValue: true }
      }),
      prisma.maintenanceRecord.count({
        where: {
          status: 'SCHEDULED',
          scheduledDate: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Next 30 days
          }
        }
      })
    ]);

    // Get category names for statistics
    const categories = await prisma.category.findMany({
      select: { id: true, name: true }
    });

    const categoryMap = categories.reduce((acc, cat) => {
      acc[cat.id] = cat.name;
      return acc;
    }, {});

    const statistics = {
      totalAssets,
      assetsByStatus,
      assetsByCategory: assetsByCategory.map(item => ({
        categoryId: item.categoryId,
        categoryName: categoryMap[item.categoryId] || 'Unknown',
        count: item._count,
        totalValue: item._sum.currentValue || 0
      })),
      totalValue: totalValue._sum.currentValue || 0,
      maintenanceDue
    };

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    next(error);
  }
});

// Simple stats endpoint for dashboard
router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const [totalAssets, availableAssets] = await Promise.all([
      prisma.asset.count({ where: { isActive: true } }),
      prisma.asset.count({ 
        where: { 
          isActive: true, 
          status: 'AVAILABLE' 
        } 
      })
    ]);

    res.json({
      success: true,
      data: {
        total: totalAssets,
        available: availableAssets
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
