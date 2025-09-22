const express = require('express');
const Joi = require('joi');
const { prisma } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const createAssetSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional(),
  serialNumber: Joi.string().optional(),
  model: Joi.string().optional(),
  brand: Joi.string().optional(),
  purchaseDate: Joi.date().optional(),
  purchasePrice: Joi.number().positive().optional(),
  currentValue: Joi.number().positive().optional(),
  warrantyExpiry: Joi.date().optional(),
  condition: Joi.string().optional(),
  notes: Joi.string().optional(),
  categoryId: Joi.string().required(),
  vendorId: Joi.string().optional(),
  locationId: Joi.string().optional(),
  departmentId: Joi.string().optional()
});

const updateAssetSchema = Joi.object({
  assetTag: Joi.string().optional(),
  name: Joi.string().optional(),
  description: Joi.string().optional(),
  serialNumber: Joi.string().optional(),
  model: Joi.string().optional(),
  brand: Joi.string().optional(),
  purchaseDate: Joi.date().optional(),
  purchasePrice: Joi.number().positive().optional(),
  currentValue: Joi.number().positive().optional(),
  warrantyExpiry: Joi.date().optional(),
  status: Joi.string().valid('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED', 'DISPOSED').optional(),
  condition: Joi.string().optional(),
  notes: Joi.string().optional(),
  categoryId: Joi.string().optional(),
  vendorId: Joi.string().optional(),
  locationId: Joi.string().optional(),
  departmentId: Joi.string().optional(),
  assignedToId: Joi.string().optional(),
  isActive: Joi.boolean().optional()
});

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
    const where = {};

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
            cost: true
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
    const generateAssetTag = async () => {
      const count = await prisma.asset.count();
      let assetTag;
      let attempts = 0;
      
      do {
        const tagNumber = String(count + 1 + attempts).padStart(6, '0');
        assetTag = `AST-${tagNumber}`;
        
        const existingAsset = await prisma.asset.findUnique({
          where: { assetTag }
        });
        
        if (!existingAsset) {
          return assetTag;
        }
        
        attempts++;
      } while (attempts < 100); // Prevent infinite loop
      
      throw new Error('Unable to generate unique asset tag');
    };

    const assetTag = await generateAssetTag();

    // Create asset
    const asset = await prisma.asset.create({
      data: {
        ...value,
        assetTag
      },
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

    // Update asset
    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: value,
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
