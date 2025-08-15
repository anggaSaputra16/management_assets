const express = require('express');
const Joi = require('joi');
const { prisma } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const createDepartmentSchema = Joi.object({
  name: Joi.string().required(),
  code: Joi.string().required(),
  description: Joi.string().optional(),
  managerId: Joi.string().optional(),
  budgetLimit: Joi.number().positive().optional()
});

const updateDepartmentSchema = Joi.object({
  name: Joi.string().optional(),
  code: Joi.string().optional(),
  description: Joi.string().optional(),
  managerId: Joi.string().optional(),
  budgetLimit: Joi.number().positive().optional(),
  isActive: Joi.boolean().optional()
});

// Get all departments
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const skip = (page - 1) * limit;

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status !== undefined) {
      where.isActive = status === 'true';
    }

    const [departments, total] = await Promise.all([
      prisma.department.findMany({
        where,
        include: {
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          _count: {
            select: {
              users: true,
              assets: true
            }
          }
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { name: 'asc' }
      }),
      prisma.department.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        departments,
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

// Get department by ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            isActive: true
          }
        },
        assets: {
          select: {
            id: true,
            assetTag: true,
            name: true,
            status: true
          }
        },
        _count: {
          select: {
            users: true,
            assets: true,
            assetRequests: true
          }
        }
      }
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.json({
      success: true,
      data: department
    });
  } catch (error) {
    next(error);
  }
});

// Create new department (Admin/Asset Admin only)
router.post('/', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res, next) => {
  try {
    const { error, value } = createDepartmentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    const { name, code, description, managerId, budgetLimit } = value;

    // Check if department name or code already exists
    const existingDepartment = await prisma.department.findFirst({
      where: {
        OR: [
          { name },
          { code }
        ]
      }
    });

    if (existingDepartment) {
      return res.status(400).json({
        success: false,
        message: 'Department with this name or code already exists'
      });
    }

    // If managerId provided, check if user exists and is eligible
    if (managerId) {
      const manager = await prisma.user.findUnique({
        where: { id: managerId }
      });

      if (!manager || !['MANAGER', 'ADMIN'].includes(manager.role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid manager or user does not have manager role'
        });
      }
    }

    // Create department
    const department = await prisma.department.create({
      data: {
        name,
        code,
        description,
        managerId,
        budgetLimit
      },
      include: {
        manager: {
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
      message: 'Department created successfully',
      data: department
    });
  } catch (error) {
    next(error);
  }
});

// Update department (Admin/Asset Admin only)
router.put('/:id', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = updateDepartmentSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    // Check if department exists
    const existingDepartment = await prisma.department.findUnique({
      where: { id }
    });

    if (!existingDepartment) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check for name/code conflicts (excluding current department)
    if (value.name || value.code) {
      const conflicts = await prisma.department.findFirst({
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
          message: 'Department name or code already exists'
        });
      }
    }

    // If managerId provided, validate manager
    if (value.managerId) {
      const manager = await prisma.user.findUnique({
        where: { id: value.managerId }
      });

      if (!manager || !['MANAGER', 'ADMIN'].includes(manager.role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid manager or user does not have manager role'
        });
      }
    }

    // Update department
    const updatedDepartment = await prisma.department.update({
      where: { id },
      data: value,
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        _count: {
          select: {
            users: true,
            assets: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Department updated successfully',
      data: updatedDepartment
    });
  } catch (error) {
    next(error);
  }
});

// Delete department (Admin only)
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if department exists
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            assets: true
          }
        }
      }
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if department has users or assets
    if (department._count.users > 0 || department._count.assets > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete department with existing users or assets'
      });
    }

    // Soft delete by setting isActive to false
    await prisma.department.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get department statistics
router.get('/:id/statistics', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if department exists
    const department = await prisma.department.findUnique({
      where: { id }
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Get various statistics
    const [
      totalUsers,
      totalAssets,
      pendingRequests,
      approvedRequests,
      assetsByStatus,
      totalAssetValue
    ] = await Promise.all([
      prisma.user.count({
        where: { departmentId: id, isActive: true }
      }),
      prisma.asset.count({
        where: { departmentId: id, isActive: true }
      }),
      prisma.assetRequest.count({
        where: { departmentId: id, status: 'PENDING' }
      }),
      prisma.assetRequest.count({
        where: { departmentId: id, status: 'APPROVED' }
      }),
      prisma.asset.groupBy({
        by: ['status'],
        where: { departmentId: id, isActive: true },
        _count: true
      }),
      prisma.asset.aggregate({
        where: { departmentId: id, isActive: true },
        _sum: { currentValue: true }
      })
    ]);

    const statistics = {
      totalUsers,
      totalAssets,
      pendingRequests,
      approvedRequests,
      assetsByStatus,
      totalAssetValue: totalAssetValue._sum.currentValue || 0
    };

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
