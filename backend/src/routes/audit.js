const express = require('express');
const Joi = require('joi');
const { prisma } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const createAuditSchema = Joi.object({
  auditType: Joi.string().valid('PHYSICAL', 'FINANCIAL', 'COMPLIANCE').required(),
  scheduledDate: Joi.date().required(),
  assetId: Joi.string().optional(),
  auditorId: Joi.string().required(),
  companyId: Joi.string().optional()
});

const updateAuditSchema = Joi.object({
  auditType: Joi.string().valid('PHYSICAL', 'FINANCIAL', 'COMPLIANCE').optional(),
  scheduledDate: Joi.date().optional(),
  completedDate: Joi.date().optional(),
  status: Joi.string().valid('SCHEDULED', 'IN_PROGRESS', 'COMPLETED').optional(),
  findings: Joi.string().optional(),
  recommendations: Joi.string().optional()
});

// Get all audit records
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      type, 
      assetId, 
      auditorId,
      scheduled 
    } = req.query;
    
    const skip = (page - 1) * limit;
    const companyId = req.user.companyId;
    const where = { companyId };

    // Role-based filtering
    if (req.user.role === 'AUDITOR') {
      where.auditorId = req.user.id;
    } else if (req.user.role === 'DEPARTMENT_USER') {
      where.OR = [
        { asset: { departmentId: req.user.departmentId, companyId } },
        { assetId: null } // General audits
      ];
    } else if (req.user.role === 'MANAGER' && req.user.departmentId) {
      where.OR = [
        { asset: { departmentId: req.user.departmentId, companyId } },
        { assetId: null } // General audits
      ];
    }

    if (status) where.status = status;
    if (type) where.auditType = type;
    if (assetId) where.assetId = assetId;
    if (auditorId && ['ADMIN', 'ASSET_ADMIN', 'TOP_MANAGEMENT'].includes(req.user.role)) {
      where.auditorId = auditorId;
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

    const [auditRecords, total] = await Promise.all([
      prisma.audit_records.findMany({
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
              },
              departments: {                select: { name: true }
              }
            }
          },
          auditor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          }
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { scheduledDate: 'desc' }
      }),
      prisma.audit_records.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        auditRecords,
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

// Get audit record by ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const auditRecord = await prisma.audit_records.findUnique({
      where: { id },
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
            currentValue: true,
            categories: {              select: { name: true }
            },
            locations: {              select: { name: true, building: true, floor: true, room: true }
            },
            departments: {              select: { name: true }
            },
            assignedEmployee: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        auditor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      }
    });

    if (!auditRecord) {
      return res.status(404).json({
        success: false,
        message: 'Audit record not found'
      });
    }

    // Check permissions
    const canView = req.user.role === 'ADMIN' || 
                   req.user.role === 'ASSET_ADMIN' || 
                   req.user.role === 'TOP_MANAGEMENT' ||
                   auditRecord.auditorId === req.user.id ||
                   (req.user.role === 'MANAGER' && 
                    auditRecord.asset?.department?.id === req.user.departmentId);

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this audit record'
      });
    }

    res.json({
      success: true,
      data: auditRecord
    });
  } catch (error) {
    next(error);
  }
});

// Create new audit record (Admin/Asset Admin/Top Management)
router.post('/', authenticate, authorize('ADMIN', 'ASSET_ADMIN', 'TOP_MANAGEMENT'), async (req, res, next) => {
  try {
    const { error, value } = createAuditSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    // Check if asset exists (if provided)
    if (value.assetId) {
      const asset = await prisma.asset.findUnique({
        where: { id: value.assetId }
      });

      if (!asset) {
        return res.status(400).json({
          success: false,
          message: 'Asset not found'
        });
      }
    }

    // Validate auditor
    const auditor = await prisma.user.findUnique({
      where: { id: value.auditorId }
    });

    if (!auditor || auditor.role !== 'AUDITOR') {
      return res.status(400).json({
        success: false,
        message: 'Invalid auditor'
      });
    }

    // Create audit record
    const auditRecord = await prisma.audit_records.create({
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
        auditor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Audit record created successfully',
      data: auditRecord
    });
  } catch (error) {
    next(error);
  }
});

// Update audit record
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = updateAuditSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    // Check if audit record exists
    const existingRecord = await prisma.audit_records.findUnique({
      where: { id },
      include: { assets: true }
    });

    if (!existingRecord) {
      return res.status(404).json({
        success: false,
        message: 'Audit record not found'
      });
    }

    // Check permissions
    const canUpdate = req.user.role === 'ADMIN' || 
                     req.user.role === 'ASSET_ADMIN' || 
                     req.user.role === 'TOP_MANAGEMENT' ||
                     existingRecord.auditorId === req.user.id;

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your assigned audit records'
      });
    }

    // Add audit fields
    value.editedBy = req.user.userId;
    value.lastEditedAt = new Date();
    
    // Update audit record
    const updatedRecord = await prisma.audit_records.update({
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
        auditor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Audit record updated successfully',
      data: updatedRecord
    });
  } catch (error) {
    next(error);
  }
});

// Delete audit record (Admin only)
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if audit record exists
    const auditRecord = await prisma.audit_records.findUnique({
      where: { id }
    });

    if (!auditRecord) {
      return res.status(404).json({
        success: false,
        message: 'Audit record not found'
      });
    }

    // Delete audit record
    await prisma.audit_records.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Audit record deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Start audit (Auditor)
router.post('/:id/start', authenticate, authorize('AUDITOR', 'ADMIN', 'ASSET_ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const auditRecord = await prisma.audit_records.findUnique({
      where: { id }
    });

    if (!auditRecord) {
      return res.status(404).json({
        success: false,
        message: 'Audit record not found'
      });
    }

    // Check if auditor can start this audit
    if (req.user.role === 'AUDITOR' && auditRecord.auditorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only start your assigned audit tasks'
      });
    }

    if (auditRecord.status !== 'SCHEDULED') {
      return res.status(400).json({
        success: false,
        message: 'Audit can only be started from scheduled status'
      });
    }

    // Update audit status
    const updatedRecord = await prisma.audit_records.update({
      where: { id },
      data: { status: 'IN_PROGRESS' }
    });

    res.json({
      success: true,
      message: 'Audit started successfully',
      data: updatedRecord
    });
  } catch (error) {
    next(error);
  }
});

// Complete audit (Auditor)
router.post('/:id/complete', authenticate, authorize('AUDITOR', 'ADMIN', 'ASSET_ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const completeSchema = Joi.object({
      completedDate: Joi.date().default(new Date()),
      findings: Joi.string().required(),
      recommendations: Joi.string().optional()
    });

    const { error, value } = completeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    const auditRecord = await prisma.audit_records.findUnique({
      where: { id }
    });

    if (!auditRecord) {
      return res.status(404).json({
        success: false,
        message: 'Audit record not found'
      });
    }

    // Check if auditor can complete this audit
    if (req.user.role === 'AUDITOR' && auditRecord.auditorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only complete your assigned audit tasks'
      });
    }

    if (auditRecord.status !== 'IN_PROGRESS') {
      return res.status(400).json({
        success: false,
        message: 'Audit can only be completed from in-progress status'
      });
    }

    // Update audit record
    const updatedRecord = await prisma.audit_records.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedDate: value.completedDate,
        findings: value.findings,
        recommendations: value.recommendations
      }
    });

    res.json({
      success: true,
      message: 'Audit completed successfully',
      data: updatedRecord
    });
  } catch (error) {
    next(error);
  }
});

// Get audit statistics
router.get('/statistics/overview', authenticate, authorize('ADMIN', 'ASSET_ADMIN', 'TOP_MANAGEMENT', 'MANAGER'), async (req, res, next) => {
  try {
    const where = {};
    
    // Filter by department for managers
    if (req.user.role === 'MANAGER' && req.user.departmentId) {
      where.OR = [
        { asset: { departmentId: req.user.departmentId } },
        { assetId: null }
      ];
    }

    const [
      totalAudits,
      scheduledAudits,
      inProgressAudits,
      completedAudits,
      auditsByType,
      overdueAudits,
      upcomingAudits,
      auditsByAuditor
    ] = await Promise.all([
      prisma.audit_records.count({ where }),
      prisma.audit_records.count({ where: { ...where, status: 'SCHEDULED' } }),
      prisma.audit_records.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      prisma.audit_records.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.audit_records.groupBy({
        by: ['auditType'],
        where,
        _count: true
      }),
      prisma.audit_records.count({
        where: {
          ...where,
          status: 'SCHEDULED',
          scheduledDate: { lt: new Date() }
        }
      }),
      prisma.audit_records.count({
        where: {
          ...where,
          status: 'SCHEDULED',
          scheduledDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
          }
        }
      }),
      req.user.role !== 'MANAGER' ? prisma.audit_records.groupBy({
        by: ['auditorId'],
        where,
        _count: true
      }) : []
    ]);

    const statistics = {
      totalAudits,
      scheduledAudits,
      inProgressAudits,
      completedAudits,
      auditsByType,
      overdueAudits,
      upcomingAudits,
      auditsByAuditor
    };

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    next(error);
  }
});

// Get upcoming audits (next 30 days)
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
    if (req.user.role === 'AUDITOR') {
      where.auditorId = req.user.id;
    } else if (req.user.role === 'DEPARTMENT_USER') {
      where.OR = [
        { asset: { departmentId: req.user.departmentId } },
        { assetId: null }
      ];
    } else if (req.user.role === 'MANAGER' && req.user.departmentId) {
      where.OR = [
        { asset: { departmentId: req.user.departmentId } },
        { assetId: null }
      ];
    }

    const upcomingAudits = await prisma.audit_records.findMany({
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
        auditor: {
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
      data: upcomingAudits
    });
  } catch (error) {
    next(error);
  }
});

// Generate audit report
router.get('/:id/report', authenticate, authorize('AUDITOR', 'ADMIN', 'ASSET_ADMIN', 'TOP_MANAGEMENT'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const auditRecord = await prisma.audit_records.findUnique({
      where: { id },
      include: {
        assets: {
          include: {
            categories: true,
            location: true,
            department: true,
            assignedEmployee: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        auditor: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!auditRecord) {
      return res.status(404).json({
        success: false,
        message: 'Audit record not found'
      });
    }

    if (auditRecord.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Audit report can only be generated for completed audits'
      });
    }

    // Check permissions
    const canView = req.user.role === 'ADMIN' || 
                   req.user.role === 'ASSET_ADMIN' || 
                   req.user.role === 'TOP_MANAGEMENT' ||
                   auditRecord.auditorId === req.user.id;

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this audit report'
      });
    }

    // Generate report data
    const report = {
      auditDetails: {
        id: auditRecord.id,
        type: auditRecord.auditType,
        scheduledDate: auditRecord.scheduledDate,
        completedDate: auditRecord.completedDate,
        auditor: auditRecord.auditor
      },
      assetDetails: auditRecord.asset,
      findings: auditRecord.findings,
      recommendations: auditRecord.recommendations,
      generatedAt: new Date(),
      generatedBy: {
        id: req.user.id,
        name: `${req.user.firstName} ${req.user.lastName}`,
        email: req.user.email
      }
    };

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
});

// Get recent activities for dashboard
router.get('/recent', authenticate, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Get recent audit logs
    const auditLogs = await prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Format activities for dashboard
    const activities = auditLogs.map(log => ({
      id: log.id,
      action: log.action,
      tableName: log.tableName,
      description: `${log.action} operation on ${log.tableName} by ${log.user?.firstName} ${log.user?.lastName}`,
      userId: log.userId,
      user: log.user,
      createdAt: log.createdAt
    }));

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;






