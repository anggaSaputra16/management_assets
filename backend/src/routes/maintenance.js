const express = require('express');
const Joi = require('joi');
const { prisma } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const createMaintenanceSchema = Joi.object({
  maintenanceType: Joi.string().valid('PREVENTIVE', 'CORRECTIVE', 'EMERGENCY').required(),
  description: Joi.string().required(),
  scheduledDate: Joi.date().required(),
  assetId: Joi.string().required(),
  technicianId: Joi.string().optional(),
  vendorId: Joi.string().optional(),
  cost: Joi.number().positive().optional(),
  notes: Joi.string().optional()
});

const updateMaintenanceSchema = Joi.object({
  maintenanceType: Joi.string().valid('PREVENTIVE', 'CORRECTIVE', 'EMERGENCY').optional(),
  description: Joi.string().optional(),
  scheduledDate: Joi.date().optional(),
  completedDate: Joi.date().optional(),
  status: Joi.string().valid('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED').optional(),
  technicianId: Joi.string().optional(),
  vendorId: Joi.string().optional(),
  cost: Joi.number().positive().optional(),
  notes: Joi.string().optional()
});

// Get all maintenance records
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      type, 
      assetId, 
      technicianId,
      scheduled 
    } = req.query;
    
    const skip = (page - 1) * limit;
    const where = {};

    // Role-based filtering
    if (req.user.role === 'TECHNICIAN') {
      where.technicianId = req.user.id;
    } else if (req.user.role === 'DEPARTMENT_USER') {
      where.asset = {
        departmentId: req.user.departmentId
      };
    }

    if (status) where.status = status;
    if (type) where.maintenanceType = type;
    if (assetId) where.assetId = assetId;
    if (technicianId && ['ADMIN', 'ASSET_ADMIN', 'MANAGER'].includes(req.user.role)) {
      where.technicianId = technicianId;
    }

    if (scheduled) {
      const date = new Date(scheduled);
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);
      where.scheduledDate = {
        gte: date,
        lt: nextDay
      };
    }

    const [maintenanceRecords, total] = await Promise.all([
      prisma.maintenanceRecord.findMany({
        where,
        include: {
          asset: {
            select: {
              id: true,
              assetTag: true,
              name: true,
              status: true,
              category: {
                select: { name: true }
              },
              location: {
                select: { name: true, building: true }
              }
            }
          },
          technician: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          vendor: {
            select: {
              id: true,
              name: true,
              contactPerson: true,
              phone: true
            }
          }
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { scheduledDate: 'desc' }
      }),
      prisma.maintenanceRecord.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        maintenanceRecords,
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

// Get maintenance record by ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const maintenanceRecord = await prisma.maintenanceRecord.findUnique({
      where: { id },
      include: {
        asset: {
          select: {
            id: true,
            assetTag: true,
            name: true,
            description: true,
            status: true,
            serialNumber: true,
            model: true,
            brand: true,
            category: {
              select: { name: true }
            },
            location: {
              select: { name: true, building: true, floor: true, room: true }
            },
            department: {
              select: { name: true }
            }
          }
        },
        technician: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        vendor: {
          select: {
            id: true,
            name: true,
            contactPerson: true,
            phone: true,
            email: true
          }
        }
      }
    });

    if (!maintenanceRecord) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance record not found'
      });
    }

    // Check permissions
    const canView = req.user.role === 'ADMIN' || 
                   req.user.role === 'ASSET_ADMIN' || 
                   maintenanceRecord.technicianId === req.user.id ||
                   (req.user.role === 'DEPARTMENT_USER' && 
                    maintenanceRecord.asset.department?.id === req.user.departmentId);

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this maintenance record'
      });
    }

    res.json({
      success: true,
      data: maintenanceRecord
    });
  } catch (error) {
    next(error);
  }
});

// Create new maintenance record (Admin/Asset Admin/Technician)
router.post('/', authenticate, authorize('ADMIN', 'ASSET_ADMIN', 'TECHNICIAN'), async (req, res, next) => {
  try {
    const { error, value } = createMaintenanceSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    // Check if asset exists
    const asset = await prisma.asset.findUnique({
      where: { id: value.assetId }
    });

    if (!asset) {
      return res.status(400).json({
        success: false,
        message: 'Asset not found'
      });
    }

    // Validate technician if provided
    if (value.technicianId) {
      const technician = await prisma.user.findUnique({
        where: { id: value.technicianId }
      });

      if (!technician || technician.role !== 'TECHNICIAN') {
        return res.status(400).json({
          success: false,
          message: 'Invalid technician'
        });
      }
    }

    // Validate vendor if provided
    if (value.vendorId) {
      const vendor = await prisma.vendor.findUnique({
        where: { id: value.vendorId }
      });

      if (!vendor || !vendor.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Invalid vendor'
        });
      }
    }

    // Create maintenance record
    const maintenanceRecord = await prisma.maintenanceRecord.create({
      data: value,
      include: {
        asset: {
          select: {
            id: true,
            assetTag: true,
            name: true,
            status: true
          }
        },
        technician: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        vendor: {
          select: {
            id: true,
            name: true,
            contactPerson: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Maintenance record created successfully',
      data: maintenanceRecord
    });
  } catch (error) {
    next(error);
  }
});

// Update maintenance record
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = updateMaintenanceSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    // Check if maintenance record exists
    const existingRecord = await prisma.maintenanceRecord.findUnique({
      where: { id },
      include: { asset: true }
    });

    if (!existingRecord) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance record not found'
      });
    }

    // Check permissions
    const canUpdate = req.user.role === 'ADMIN' || 
                     req.user.role === 'ASSET_ADMIN' || 
                     existingRecord.technicianId === req.user.id;

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your assigned maintenance records'
      });
    }

    // Validate technician if provided
    if (value.technicianId) {
      const technician = await prisma.user.findUnique({
        where: { id: value.technicianId }
      });

      if (!technician || technician.role !== 'TECHNICIAN') {
        return res.status(400).json({
          success: false,
          message: 'Invalid technician'
        });
      }
    }

    // If completing maintenance, update asset status
    let assetUpdate = {};
    if (value.status === 'COMPLETED' && existingRecord.status !== 'COMPLETED') {
      assetUpdate = {
        status: 'AVAILABLE' // Return asset to available after maintenance
      };
    } else if (value.status === 'IN_PROGRESS' && existingRecord.status === 'SCHEDULED') {
      assetUpdate = {
        status: 'MAINTENANCE'
      };
    }

    // Use transaction to update both maintenance record and asset
    const result = await prisma.$transaction(async (tx) => {
      const updatedRecord = await tx.maintenanceRecord.update({
        where: { id },
        data: value,
        include: {
          asset: {
            select: {
              id: true,
              assetTag: true,
              name: true,
              status: true
            }
          },
          technician: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          vendor: {
            select: {
              id: true,
              name: true,
              contactPerson: true
            }
          }
        }
      });

      // Update asset status if needed
      if (Object.keys(assetUpdate).length > 0) {
        await tx.asset.update({
          where: { id: existingRecord.assetId },
          data: assetUpdate
        });
      }

      return updatedRecord;
    });

    res.json({
      success: true,
      message: 'Maintenance record updated successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// Delete maintenance record (Admin only)
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if maintenance record exists
    const maintenanceRecord = await prisma.maintenanceRecord.findUnique({
      where: { id }
    });

    if (!maintenanceRecord) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance record not found'
      });
    }

    // Delete maintenance record
    await prisma.maintenanceRecord.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Maintenance record deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Start maintenance (Technician)
router.post('/:id/start', authenticate, authorize('TECHNICIAN', 'ADMIN', 'ASSET_ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const maintenanceRecord = await prisma.maintenanceRecord.findUnique({
      where: { id },
      include: { asset: true }
    });

    if (!maintenanceRecord) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance record not found'
      });
    }

    // Check if technician can start this maintenance
    if (req.user.role === 'TECHNICIAN' && maintenanceRecord.technicianId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only start your assigned maintenance tasks'
      });
    }

    if (maintenanceRecord.status !== 'SCHEDULED') {
      return res.status(400).json({
        success: false,
        message: 'Maintenance can only be started from scheduled status'
      });
    }

    // Update maintenance and asset status
    const result = await prisma.$transaction(async (tx) => {
      const updatedRecord = await tx.maintenanceRecord.update({
        where: { id },
        data: { status: 'IN_PROGRESS' }
      });

      await tx.asset.update({
        where: { id: maintenanceRecord.assetId },
        data: { status: 'MAINTENANCE' }
      });

      return updatedRecord;
    });

    res.json({
      success: true,
      message: 'Maintenance started successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// Complete maintenance (Technician)
router.post('/:id/complete', authenticate, authorize('TECHNICIAN', 'ADMIN', 'ASSET_ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const completeSchema = Joi.object({
      completedDate: Joi.date().default(new Date()),
      cost: Joi.number().positive().optional(),
      notes: Joi.string().optional()
    });

    const { error, value } = completeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    const maintenanceRecord = await prisma.maintenanceRecord.findUnique({
      where: { id },
      include: { asset: true }
    });

    if (!maintenanceRecord) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance record not found'
      });
    }

    // Check if technician can complete this maintenance
    if (req.user.role === 'TECHNICIAN' && maintenanceRecord.technicianId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only complete your assigned maintenance tasks'
      });
    }

    if (maintenanceRecord.status !== 'IN_PROGRESS') {
      return res.status(400).json({
        success: false,
        message: 'Maintenance can only be completed from in-progress status'
      });
    }

    // Update maintenance and asset status
    const result = await prisma.$transaction(async (tx) => {
      const updatedRecord = await tx.maintenanceRecord.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completedDate: value.completedDate,
          cost: value.cost,
          notes: value.notes
        }
      });

      await tx.asset.update({
        where: { id: maintenanceRecord.assetId },
        data: { status: 'AVAILABLE' }
      });

      return updatedRecord;
    });

    res.json({
      success: true,
      message: 'Maintenance completed successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// Get maintenance statistics
router.get('/statistics/overview', authenticate, authorize('ADMIN', 'ASSET_ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const where = {};
    
    // Filter by department for managers
    if (req.user.role === 'MANAGER' && req.user.departmentId) {
      where.asset = {
        departmentId: req.user.departmentId
      };
    }

    const [
      totalMaintenance,
      scheduledMaintenance,
      inProgressMaintenance,
      completedMaintenance,
      maintenanceByType,
      avgMaintenanceCost,
      overdueMaintenance,
      upcomingMaintenance
    ] = await Promise.all([
      prisma.maintenanceRecord.count({ where }),
      prisma.maintenanceRecord.count({ where: { ...where, status: 'SCHEDULED' } }),
      prisma.maintenanceRecord.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      prisma.maintenanceRecord.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.maintenanceRecord.groupBy({
        by: ['maintenanceType'],
        where,
        _count: true
      }),
      prisma.maintenanceRecord.aggregate({
        where: { ...where, status: 'COMPLETED', cost: { not: null } },
        _avg: { cost: true }
      }),
      prisma.maintenanceRecord.count({
        where: {
          ...where,
          status: 'SCHEDULED',
          scheduledDate: { lt: new Date() }
        }
      }),
      prisma.maintenanceRecord.count({
        where: {
          ...where,
          status: 'SCHEDULED',
          scheduledDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
          }
        }
      })
    ]);

    const statistics = {
      totalMaintenance,
      scheduledMaintenance,
      inProgressMaintenance,
      completedMaintenance,
      maintenanceByType,
      averageMaintenanceCost: avgMaintenanceCost._avg.cost || 0,
      overdueMaintenance,
      upcomingMaintenance
    };

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    next(error);
  }
});

// Get upcoming maintenance (next 30 days)
router.get('/upcoming', authenticate, async (req, res, next) => {
  try {
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const where = {
      status: 'SCHEDULED',
      scheduledDate: {
        gte: new Date(),
        lte: thirtyDaysFromNow
      }
    };

    // Role-based filtering
    if (req.user.role === 'TECHNICIAN') {
      where.technicianId = req.user.id;
    } else if (req.user.role === 'DEPARTMENT_USER') {
      where.asset = {
        departmentId: req.user.departmentId
      };
    }

    const upcomingMaintenance = await prisma.maintenanceRecord.findMany({
      where,
      include: {
        asset: {
          select: {
            id: true,
            assetTag: true,
            name: true,
            location: {
              select: { name: true, building: true }
            }
          }
        },
        technician: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { scheduledDate: 'asc' }
    });

    res.json({
      success: true,
      data: upcomingMaintenance
    });
  } catch (error) {
    next(error);
  }
});

// Get maintenance statistics
router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const where = req.user.role === 'TECHNICIAN' ? { technicianId: req.user.id } : {};
    
    const due = await prisma.maintenance.count({ 
      where: { 
        ...where, 
        status: 'SCHEDULED',
        scheduledDate: {
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
        }
      }
    });

    res.json({
      success: true,
      data: {
        due
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

module.exports = router;
