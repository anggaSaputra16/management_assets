const express = require('express');
const Joi = require('joi');
const { prisma } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const createVendorSchema = Joi.object({
  name: Joi.string().required(),
  code: Joi.string().required(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  address: Joi.string().optional(),
  contactPerson: Joi.string().optional()
});

const updateVendorSchema = Joi.object({
  name: Joi.string().optional(),
  code: Joi.string().optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  address: Joi.string().optional(),
  contactPerson: Joi.string().optional(),
  isActive: Joi.boolean().optional()
});

// Get all vendors
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const skip = (page - 1) * limit;

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status !== undefined) {
      where.isActive = status === 'true';
    }

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        include: {
          _count: {
            select: {
              assets: true,
              maintenanceContracts: true
            }
          }
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { name: 'asc' }
      }),
      prisma.vendor.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        vendors,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get vendor by ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        assets: {
          select: {
            id: true,
            assetTag: true,
            name: true,
            status: true,
            purchasePrice: true,
            currentValue: true,
            purchaseDate: true,
            warrantyExpiry: true,
            category: {
              select: { name: true }
            }
          },
          take: 20,
          orderBy: { createdAt: 'desc' }
        },
        maintenanceContracts: {
          select: {
            id: true,
            contractNumber: true,
            description: true,
            startDate: true,
            endDate: true,
            cost: true,
            isActive: true
          },
          orderBy: { startDate: 'desc' }
        },
        _count: {
          select: {
            assets: true,
            maintenanceContracts: true
          }
        }
      }
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    res.json({
      success: true,
      data: vendor
    });
  } catch (error) {
    next(error);
  }
});

// Create new vendor (Admin/Asset Admin only)
router.post('/', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res, next) => {
  try {
    const { error, value } = createVendorSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    const { name, code, email, phone, address, contactPerson } = value;

    // Check if vendor name or code already exists
    const existingVendor = await prisma.vendor.findFirst({
      where: {
        OR: [
          { name },
          { code }
        ]
      }
    });

    if (existingVendor) {
      return res.status(400).json({
        success: false,
        message: 'Vendor with this name or code already exists'
      });
    }

    // Create vendor
    const vendor = await prisma.vendor.create({
      data: {
        name,
        code,
        email,
        phone,
        address,
        contactPerson
      }
    });

    res.status(201).json({
      success: true,
      message: 'Vendor created successfully',
      data: vendor
    });
  } catch (error) {
    next(error);
  }
});

// Update vendor (Admin/Asset Admin only)
router.put('/:id', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = updateVendorSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    // Check if vendor exists
    const existingVendor = await prisma.vendor.findUnique({
      where: { id }
    });

    if (!existingVendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Check for name/code conflicts (excluding current vendor)
    if (value.name || value.code) {
      const conflicts = await prisma.vendor.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                ...(value.name ? [{ name: value.name }] : []),
                ...(value.code ? [{ code: value.code }] : [])
              ]
            }
          ]
        }
      });

      if (conflicts) {
        return res.status(400).json({
          success: false,
          message: 'Vendor name or code already exists'
        });
      }
    }

    // Update vendor
    const updatedVendor = await prisma.vendor.update({
      where: { id },
      data: value,
      include: {
        _count: {
          select: {
            assets: true,
            maintenanceContracts: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Vendor updated successfully',
      data: updatedVendor
    });
  } catch (error) {
    next(error);
  }
});

// Delete vendor (Admin only)
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            assets: true,
            maintenanceContracts: true
          }
        }
      }
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Check if vendor has assets or maintenance contracts
    if (vendor._count.assets > 0 || vendor._count.maintenanceContracts > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete vendor with existing assets or maintenance contracts'
      });
    }

    // Soft delete by setting isActive to false
    await prisma.vendor.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Vendor deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get vendor statistics
router.get('/:id/statistics', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id }
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    const [
      totalAssets,
      assetsByStatus,
      totalPurchaseValue,
      totalCurrentValue,
      activeContracts,
      expiredContracts,
      totalContractValue,
      warrantyStatus
    ] = await Promise.all([
      prisma.asset.count({
        where: { 
          vendorId: id,
          isActive: true 
        }
      }),
      prisma.asset.groupBy({
        by: ['status'],
        where: { 
          vendorId: id,
          isActive: true 
        },
        _count: true
      }),
      prisma.asset.aggregate({
        where: { 
          vendorId: id,
          isActive: true 
        },
        _sum: { purchasePrice: true }
      }),
      prisma.asset.aggregate({
        where: { 
          vendorId: id,
          isActive: true 
        },
        _sum: { currentValue: true }
      }),
      prisma.maintenanceContract.count({
        where: { 
          vendorId: id,
          isActive: true,
          endDate: { gte: new Date() }
        }
      }),
      prisma.maintenanceContract.count({
        where: { 
          vendorId: id,
          endDate: { lt: new Date() }
        }
      }),
      prisma.maintenanceContract.aggregate({
        where: { 
          vendorId: id,
          isActive: true 
        },
        _sum: { cost: true }
      }),
      Promise.all([
        prisma.asset.count({
          where: { 
            vendorId: id,
            isActive: true,
            warrantyExpiry: { gte: new Date() }
          }
        }),
        prisma.asset.count({
          where: { 
            vendorId: id,
            isActive: true,
            warrantyExpiry: { 
              lt: new Date(),
              not: null
            }
          }
        }),
        prisma.asset.count({
          where: { 
            vendorId: id,
            isActive: true,
            warrantyExpiry: null
          }
        })
      ])
    ]);

    const [activeWarranties, expiredWarranties, noWarrantyInfo] = warrantyStatus;

    const statistics = {
      totalAssets,
      assetsByStatus,
      totalPurchaseValue: totalPurchaseValue._sum.purchasePrice || 0,
      totalCurrentValue: totalCurrentValue._sum.currentValue || 0,
      contracts: {
        active: activeContracts,
        expired: expiredContracts,
        totalValue: totalContractValue._sum.cost || 0
      },
      warranty: {
        active: activeWarranties,
        expired: expiredWarranties,
        noInfo: noWarrantyInfo
      }
    };

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    next(error);
  }
});

// Get vendor performance metrics
router.get('/:id/performance', authenticate, authorize('ADMIN', 'ASSET_ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id }
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    const [
      maintenanceRecords,
      averageMaintenanceCost,
      maintenanceFrequency,
      assetReliability
    ] = await Promise.all([
      prisma.maintenanceRecord.findMany({
        where: {
          asset: { vendorId: id },
          status: 'COMPLETED'
        },
        select: {
          maintenanceType: true,
          cost: true,
          scheduledDate: true,
          completedDate: true
        },
        orderBy: { completedDate: 'desc' },
        take: 50
      }),
      prisma.maintenanceRecord.aggregate({
        where: {
          asset: { vendorId: id },
          status: 'COMPLETED',
          cost: { not: null }
        },
        _avg: { cost: true }
      }),
      prisma.maintenanceRecord.count({
        where: {
          asset: { vendorId: id },
          status: 'COMPLETED',
          completedDate: {
            gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // Last year
          }
        }
      }),
      prisma.asset.groupBy({
        by: ['status'],
        where: { 
          vendorId: id,
          isActive: true 
        },
        _count: true
      })
    ]);

    // Calculate maintenance metrics
    const maintenanceByType = maintenanceRecords.reduce((acc, record) => {
      const type = record.maintenanceType;
      if (!acc[type]) {
        acc[type] = { count: 0, totalCost: 0 };
      }
      acc[type].count++;
      acc[type].totalCost += record.cost || 0;
      return acc;
    }, {});

    // Calculate average response time (scheduled vs completed)
    const responseTime = maintenanceRecords
      .filter(record => record.scheduledDate && record.completedDate)
      .map(record => {
        const scheduled = new Date(record.scheduledDate);
        const completed = new Date(record.completedDate);
        return Math.abs(completed - scheduled) / (1000 * 60 * 60 * 24); // Days
      });

    const avgResponseTime = responseTime.length > 0 
      ? responseTime.reduce((sum, days) => sum + days, 0) / responseTime.length 
      : 0;

    const performance = {
      maintenanceByType,
      averageMaintenanceCost: averageMaintenanceCost._avg.cost || 0,
      maintenanceFrequency,
      averageResponseTime: avgResponseTime.toFixed(2),
      assetReliability: assetReliability.find(item => item.status === 'AVAILABLE')?._count || 0
    };

    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
