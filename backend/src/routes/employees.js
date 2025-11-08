const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const Joi = require('joi');
const { authenticate, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();

// Validation schemas
const employeeSchema = Joi.object({
  npk: Joi.string().required().trim(),
  firstName: Joi.string().required().trim(),
  lastName: Joi.string().required().trim(),
  email: Joi.string().email().allow(null, '').trim(),
  phone: Joi.string().allow(null, '').trim(),
  dateOfBirth: Joi.date().allow(null),
  hireDate: Joi.date().allow(null),
  terminationDate: Joi.date().allow(null),
  address: Joi.string().allow(null, '').trim(),
  position: Joi.string().allow(null, '').trim(),
  departmentId: Joi.string().allow(null, ''),
  locationId: Joi.string().allow(null, ''),
  userId: Joi.string().allow(null, ''),
  isActive: Joi.boolean().default(true)
});

const employeeUpdateSchema = Joi.object({
  npk: Joi.string().trim(),
  firstName: Joi.string().trim(),
  lastName: Joi.string().trim(),
  email: Joi.string().email().allow(null, '').trim(),
  phone: Joi.string().allow(null, '').trim(),
  dateOfBirth: Joi.date().allow(null),
  hireDate: Joi.date().allow(null),
  terminationDate: Joi.date().allow(null),
  address: Joi.string().allow(null, '').trim(),
  position: Joi.string().allow(null, '').trim(),
  departmentId: Joi.string().allow(null, ''),
  locationId: Joi.string().allow(null, ''),
  userId: Joi.string().allow(null, ''),
  isActive: Joi.boolean()
}).min(1);

// GET /api/employees - Get all employees with pagination and filters
router.get('/', authenticate, authorize('ADMIN', 'ASSET_ADMIN', 'MANAGER', 'DEPARTMENT_USER'), async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const {
      page = 1,
      limit = 20,
      search = '',
      departmentId = '',
      locationId = '',
      isActive = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {
      companyId,
      ...(search && {
        OR: [
          { npk: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { position: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(departmentId && { departmentId }),
      ...(locationId && { locationId }),
      ...(isActive !== '' && { isActive: isActive === 'true' })
    };

    // Execute queries
    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          company: {
            select: { id: true, name: true, code: true }
          },
          department: {
            select: { id: true, name: true, code: true }
          },
          location: {
            select: { id: true, name: true, code: true, building: true, city: true }
          },
          user: {
            select: { id: true, email: true, username: true, role: true }
          },
          _count: {
            select: {
              assignedAssets: true
            }
          }
        }
      }),
      prisma.employee.count({ where })
    ]);

    res.json({
      employees,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/employees/:id - Get employee by ID
router.get('/:id', authenticate, authorize('ADMIN', 'ASSET_ADMIN', 'MANAGER', 'DEPARTMENT_USER'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const employee = await prisma.employee.findFirst({
      where: { id, companyId },
      include: {
        company: {
          select: { id: true, name: true, code: true }
        },
        department: {
          select: { id: true, name: true, code: true }
        },
        location: {
          select: { id: true, name: true, code: true, building: true, city: true }
        },
        user: {
          select: { id: true, email: true, username: true, role: true, isActive: true }
        },
        assignedAssets: {
          select: {
            id: true,
            assetTag: true,
            name: true,
            status: true,
            category: { select: { name: true } }
          },
          where: { isActive: true }
        },
        _count: {
          select: {
            assignedAssets: true,
            transfersFrom: true,
            transfersTo: true
          }
        }
      }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(employee);
  } catch (error) {
    next(error);
  }
});

// POST /api/employees - Create new employee
router.post('/', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res, next) => {
  try {
    const { error, value } = employeeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const companyId = req.user.companyId;

    // Check if NPK already exists in company
    const existingEmployee = await prisma.employee.findUnique({
      where: {
        companyId_npk: {
          companyId,
          npk: value.npk
        }
      }
    });

    if (existingEmployee) {
      return res.status(400).json({ error: 'NPK already exists in this company' });
    }

    // If userId is provided, check if user exists and belongs to same company
    if (value.userId) {
      const user = await prisma.user.findFirst({
        where: { id: value.userId, companyId }
      });
      if (!user) {
        return res.status(400).json({ error: 'User not found or does not belong to this company' });
      }

      // Check if user is already linked to another employee
      const existingLink = await prisma.employee.findFirst({
        where: { userId: value.userId }
      });
      if (existingLink) {
        return res.status(400).json({ error: 'This user is already linked to another employee' });
      }
    }

    // Create employee
    const employee = await prisma.employee.create({
      data: {
        ...value,
        companyId,
        departmentId: value.departmentId || null,
        locationId: value.locationId || null,
        userId: value.userId || null
      },
      include: {
        department: {
          select: { id: true, name: true, code: true }
        },
        location: {
          select: { id: true, name: true, code: true }
        },
        user: {
          select: { id: true, email: true, username: true, role: true }
        }
      }
    });

    res.status(201).json(employee);
  } catch (error) {
    next(error);
  }
});

// PUT /api/employees/:id - Update employee
router.put('/:id', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const { error, value } = employeeUpdateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if employee exists and belongs to company
    const existingEmployee = await prisma.employee.findFirst({
      where: { id, companyId }
    });

    if (!existingEmployee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // If NPK is being changed, check uniqueness
    if (value.npk && value.npk !== existingEmployee.npk) {
      const npkExists = await prisma.employee.findUnique({
        where: {
          companyId_npk: {
            companyId,
            npk: value.npk
          }
        }
      });
      if (npkExists) {
        return res.status(400).json({ error: 'NPK already exists in this company' });
      }
    }

    // If userId is being changed, validate
    if (value.userId !== undefined) {
      if (value.userId) {
        const user = await prisma.user.findFirst({
          where: { id: value.userId, companyId }
        });
        if (!user) {
          return res.status(400).json({ error: 'User not found or does not belong to this company' });
        }

        // Check if user is already linked to another employee
        const existingLink = await prisma.employee.findFirst({
          where: { 
            userId: value.userId,
            id: { not: id }
          }
        });
        if (existingLink) {
          return res.status(400).json({ error: 'This user is already linked to another employee' });
        }
      } else {
        value.userId = null;
      }
    }

    // Update employee
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        ...value,
        departmentId: value.departmentId === '' ? null : value.departmentId,
        locationId: value.locationId === '' ? null : value.locationId
      },
      include: {
        department: {
          select: { id: true, name: true, code: true }
        },
        location: {
          select: { id: true, name: true, code: true }
        },
        user: {
          select: { id: true, email: true, username: true, role: true }
        }
      }
    });

    res.json(employee);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/employees/:id - Delete employee
router.delete('/:id', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    // Check if employee exists and belongs to company
    const employee = await prisma.employee.findFirst({
      where: { id, companyId },
      include: {
        _count: {
          select: { assignedAssets: true }
        }
      }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Check if employee has assigned assets
    if (employee._count.assignedAssets > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete employee with assigned assets. Please reassign or unassign assets first.' 
      });
    }

    // Delete employee
    await prisma.employee.delete({
      where: { id }
    });

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// GET /api/employees/stats - Get employee statistics
router.get('/stats', authenticate, authorize('ADMIN', 'ASSET_ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const companyId = req.user.companyId;

    const [
      totalEmployees,
      activeEmployees,
      employeesWithAssets,
      employeesWithAppAccess
    ] = await Promise.all([
      prisma.employee.count({ where: { companyId } }),
      prisma.employee.count({ where: { companyId, isActive: true } }),
      prisma.employee.count({ 
        where: { 
          companyId,
          assignedAssets: { some: {} }
        } 
      }),
      prisma.employee.count({ 
        where: { 
          companyId,
          userId: { not: null }
        } 
      })
    ]);

    res.json({
      totalEmployees,
      activeEmployees,
      inactiveEmployees: totalEmployees - activeEmployees,
      employeesWithAssets,
      employeesWithAppAccess,
      employeesWithoutAppAccess: totalEmployees - employeesWithAppAccess
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
