const express = require('express');
const Joi = require('joi');
const { prisma } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
  notes: Joi.string().optional(),
  companyId: Joi.string().optional()
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
    const companyId = req.user.companyId;
    const where = {
      asset: { companyId }
    };

    // Role-based filtering
    if (req.user.role === 'TECHNICIAN') {
      where.technicianId = req.user.id;
    } else if (req.user.role === 'DEPARTMENT_USER') {
      where.assets = {
        companyId,
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
          assets: {
            select: {
              id: true,
              assetTag: true,
              name: true,
              status: true,
              categories: {                select: { name: true }
              },
              locations: {                select: { name: true, building: true }
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
          vendors: { select: {
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

    const where = { 
      id,
      companyId: req.user.companyId
    };

    if (req.user.role === 'TECHNICIAN') {
      where.technicianId = req.user.id;
    } else if (req.user.role === 'DEPARTMENT_USER') {
      where.assets = {
        departmentId: req.user.departmentId
      };
    }

    const maintenanceRecord = await prisma.maintenanceRecord.findFirst({
      where,
      include: {
        assets: {
          select: {
            id: true,
            assetTag: true,
            name: true,
            description: true,
            status: true,
            serialNumber: true,
            model: true,
            brand: true,
            categories: {              select: { name: true }
            },
            locations: {              select: { name: true, building: true, floor: true, room: true }
            },
            departments: {              select: { name: true }
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
        vendors: { select: {
            id: true,
            name: true,
            contactPerson: true,
            phone: true,
            email: true
          }
        },
        editedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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

    // Check if asset exists within same company
    const asset = await prisma.asset.findFirst({
      where: { 
        id: value.assetId,
        companyId: req.user.companyId
      }
    });

    if (!asset) {
      return res.status(400).json({
        success: false,
        message: 'Asset not found'
      });
    }

    // Validate technician if provided
    if (value.technicianId) {
      const technician = await prisma.user.findFirst({
        where: { 
          id: value.technicianId,
          companyId: req.user.companyId
        }
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
      const vendor = await prisma.vendor.findFirst({
        where: { 
          id: value.vendorId,
          companyId: req.user.companyId
        }
      });

      if (!vendor || !vendor.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Invalid vendor'
        });
      }
    }

    // Auto-assign companyId
    const maintenanceRecord = await prisma.maintenanceRecord.create({
      data: {
        ...value,
        companyId: req.user.companyId
      },
      include: {
        assets: {
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
        vendors: { select: {
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
      include: { assets: true }
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

    // Add audit fields
    value.editedBy = req.user.userId;
    value.lastEditedAt = new Date();
    
    // Use transaction to update both maintenance record and asset
    const result = await prisma.$transaction(async (tx) => {
      const updatedRecord = await tx.maintenanceRecord.update({
        where: { id },
        data: value,
        include: {
          assets: {
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
          vendors: { select: {
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
      include: { assets: true }
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
      include: { assets: true }
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

// Configure multer for maintenance file uploads (images and documents)
const maintenanceStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.resolve(__dirname, '..', '..', 'uploads', 'maintenance');
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    } catch (err) {
      console.error('Failed to prepare upload directory for maintenance:', uploadDir, err);
      try {
        const os = require('os');
        const tmpDir = path.resolve(os.tmpdir(), 'management-assets-uploads');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
        console.warn('Falling back to tmp upload directory for maintenance:', tmpDir);
        cb(null, tmpDir);
      } catch (err2) {
        console.error('Fallback upload directory creation failed for maintenance:', err2);
        cb(err2);
      }
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'maintenance-' + uniqueSuffix + ext);
  }
});

const maintenanceFileFilter = (req, file, cb) => {
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

const maintenanceUpload = multer({ storage: maintenanceStorage, fileFilter: maintenanceFileFilter, limits: { fileSize: 10 * 1024 * 1024 } });
const uploadMaintenanceMultiple = maintenanceUpload.array('attachments', 5);

// Upload attachments for a maintenance record
router.post('/:id/attachments', authenticate, authorize('TECHNICIAN', 'ADMIN', 'ASSET_ADMIN'), (req, res, next) => {
  uploadMaintenanceMultiple(req, res, async function (err) {
    try {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ success: false, message: err.message });
      } else if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      const { id } = req.params;

      // Verify maintenance record exists
      const maintenanceRecord = await prisma.maintenanceRecord.findUnique({ where: { id } });
      if (!maintenanceRecord) {
        return res.status(404).json({ success: false, message: 'Maintenance record not found' });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: 'No files uploaded' });
      }

      // Create maintenance attachment records
      const created = [];
      for (const file of req.files) {
        // Determine attachment type
        let attachmentType = 'GENERAL';
        if (file.mimetype.startsWith('image/')) attachmentType = 'BEFORE';

        const record = await prisma.maintenanceAttachment.create({
          data: {
            filename: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            fileSize: file.size,
            filePath: file.path,
            description: file.originalname,
            attachmentType,
            maintenanceId: id,
            uploadedById: req.user.id
          }
        });

        created.push(record);
      }

      res.status(201).json({ success: true, message: 'Attachments uploaded', data: created });
    } catch (error) {
      next(error);
    }
  });
});

// Get maintenance statistics
router.get('/statistics/overview', authenticate, authorize('ADMIN', 'ASSET_ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const where = {};
    
    // Filter by department for managers
    if (req.user.role === 'MANAGER' && req.user.departmentId) {
      where.assets = {
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
      where.assets = {
        departmentId: req.user.departmentId
      };
    }

    const upcomingMaintenance = await prisma.maintenanceRecord.findMany({
      where,
      include: {
        assets: {
          select: {
            id: true,
            assetTag: true,
            name: true,
            locations: {              select: { name: true, building: true }
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
    
    const due = await prisma.maintenanceRecord.count({ 
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






