const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { prisma } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().min(3).max(30).required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  phone: Joi.string().optional(),
  role: Joi.string().valid('ADMIN', 'ASSET_ADMIN', 'MANAGER', 'DEPARTMENT_USER', 'TECHNICIAN', 'AUDITOR', 'TOP_MANAGEMENT').default('DEPARTMENT_USER'),
  departmentId: Joi.string().optional(),
  companyId: Joi.string().optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Register user
router.post('/register', async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    const { email, username, password, firstName, lastName, phone, role, departmentId, companyId } = value;

    // Get default company if companyId not provided
    let finalCompanyId = companyId;
    if (!finalCompanyId) {
      const defaultCompany = await prisma.company.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' }
      });
      finalCompanyId = defaultCompany?.id;
    }

    // Check if user exists in the same company
    const existingUser = await prisma.user.findFirst({
      where: {
        AND: [
          { companyId: finalCompanyId },
          {
            OR: [
              { email },
              { username }
            ]
          }
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
        departmentId,
        companyId: finalCompanyId
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        company: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
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
      message: 'User registered successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// Login user
router.post('/login', async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    const { email, password } = value;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or account inactive'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Remove password from response
    const { password: _, ...userResponse } = user;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get current user profile
router.get('/profile', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
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
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// Update profile
router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const updateSchema = Joi.object({
      firstName: Joi.string().optional(),
      lastName: Joi.string().optional(),
      phone: Joi.string().optional()
    });

    const { error, value } = updateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: value,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
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
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
});

// Change password
router.put('/change-password', authenticate, async (req, res, next) => {
  try {
    const changePasswordSchema = Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: Joi.string().min(6).required()
    });

    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    const { currentPassword, newPassword } = value;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedNewPassword }
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
