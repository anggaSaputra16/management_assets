const express = require('express');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const { prisma } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().min(3).max(30).required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  phone: Joi.string().optional(),
  role: Joi.string().valid('ADMIN', 'ASSET_ADMIN', 'MANAGER', 'DEPARTMENT_USER', 'TECHNICIAN', 'AUDITOR', 'TOP_MANAGEMENT').required(),
  departmentId: Joi.string().optional()
});

const updateUserSchema = Joi.object({
  email: Joi.string().email().optional(),
  username: Joi.string().min(3).max(30).optional(),
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  phone: Joi.string().optional(),
  role: Joi.string().valid('ADMIN', 'ASSET_ADMIN', 'MANAGER', 'DEPARTMENT_USER', 'TECHNICIAN', 'AUDITOR', 'TOP_MANAGEMENT').optional(),
  departmentId: Joi.string().optional(),
  isActive: Joi.boolean().optional()
});

// Get all users (Admin/Asset Admin only)
router.get('/', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, role, department, status } = req.query;
    const skip = (page - 1) * limit;

    const where = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (role) {
      where.role = role;
    }

    if (department) {
      where.departmentId = department;
    }

    if (status !== undefined) {
      where.isActive = status === 'true';
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          department: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        users,
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

// Get user by ID
router.get('/:id', authenticate, authorize('ADMIN', 'ASSET_ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// Create new user (Admin only)
router.post('/', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { error, value } = createUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    const { email, username, password, firstName, lastName, phone, role, departmentId } = value;

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role,
        departmentId
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// Update user (Admin only)
router.put('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = updateUserSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check for email/username conflicts (excluding current user)
    if (value.email || value.username) {
      const conflicts = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                ...(value.email ? [{ email: value.email }] : []),
                ...(value.username ? [{ username: value.username }] : [])
              ]
            }
          ]
        }
      });

      if (conflicts) {
        return res.status(400).json({
          success: false,
          message: 'Email or username already exists'
        });
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: value,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        updatedAt: true,
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
});

// Delete user (Admin only)
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Soft delete by setting isActive to false
    await prisma.user.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Reset user password (Admin only)
router.post('/:id/reset-password', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const resetPasswordSchema = Joi.object({
      newPassword: Joi.string().min(6).required()
    });

    const { error, value } = resetPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(value.newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get user statistics
router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const [total, active, inactive, adminCount] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } }),
      prisma.user.count({ where: { role: { in: ['ADMIN', 'ASSET_ADMIN'] } } })
    ]);

    res.json({
      success: true,
      data: {
        total,
        active,
        inactive,
        adminCount
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
