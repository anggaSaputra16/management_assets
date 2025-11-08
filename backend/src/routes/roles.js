const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const Joi = require('joi');
const { authenticate, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();

// Validation schemas
const createRoleSchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  code: Joi.string().required().min(2).max(50).uppercase(),
  description: Joi.string().allow('', null),
  permissions: Joi.array().items(Joi.string()).default([]),
  isActive: Joi.boolean().default(true)
});

const updateRoleSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  code: Joi.string().min(2).max(50).uppercase(),
  description: Joi.string().allow('', null),
  permissions: Joi.array().items(Joi.string()),
  isActive: Joi.boolean()
});

// GET /api/roles - Get all roles (with pagination and filters)
// Only ADMIN can access
router.get('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '',
      isActive,
      includeSystem = 'false'
    } = req.query;

    const companyId = req.user.companyId;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {
      OR: [
        { companyId: companyId }, // Company-specific roles
        ...(includeSystem === 'true' ? [{ isSystemRole: true, companyId: null }] : []) // System roles
      ],
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(isActive !== undefined && { isActive: isActive === 'true' })
    };

    const [roles, total] = await Promise.all([
      prisma.role.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          company: {
            select: { id: true, name: true, code: true }
          }
        },
        orderBy: [
          { isSystemRole: 'desc' }, // System roles first
          { name: 'asc' }
        ]
      }),
      prisma.role.count({ where })
    ]);

    res.json({
      data: roles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

// GET /api/roles/:id - Get single role
router.get('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const role = await prisma.role.findFirst({
      where: {
        id,
        OR: [
          { companyId: companyId },
          { isSystemRole: true, companyId: null }
        ]
      },
      include: {
        company: {
          select: { id: true, name: true, code: true }
        }
      }
    });

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    res.json(role);
  } catch (error) {
    console.error('Error fetching role:', error);
    res.status(500).json({ error: 'Failed to fetch role' });
  }
});

// POST /api/roles - Create new role
router.post('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { error, value } = createRoleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const companyId = req.user.companyId;

    // Check if role code already exists for this company
    const existingRole = await prisma.role.findFirst({
      where: {
        code: value.code,
        companyId: companyId
      }
    });

    if (existingRole) {
      return res.status(400).json({ error: 'Role code already exists in your company' });
    }

    const role = await prisma.role.create({
      data: {
        ...value,
        companyId,
        isSystemRole: false // User-created roles are never system roles
      },
      include: {
        company: {
          select: { id: true, name: true, code: true }
        }
      }
    });

    res.status(201).json(role);
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ error: 'Failed to create role' });
  }
});

// PUT /api/roles/:id - Update role
router.put('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateRoleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const companyId = req.user.companyId;

    // Check if role exists and belongs to company
    const existingRole = await prisma.role.findFirst({
      where: {
        id,
        companyId: companyId
      }
    });

    if (!existingRole) {
      return res.status(404).json({ error: 'Role not found or not accessible' });
    }

    // Prevent editing system roles
    if (existingRole.isSystemRole) {
      return res.status(403).json({ error: 'Cannot edit system roles' });
    }

    // If code is being changed, check uniqueness
    if (value.code && value.code !== existingRole.code) {
      const codeExists = await prisma.role.findFirst({
        where: {
          code: value.code,
          companyId: companyId,
          id: { not: id }
        }
      });

      if (codeExists) {
        return res.status(400).json({ error: 'Role code already exists' });
      }
    }

    const role = await prisma.role.update({
      where: { id },
      data: value,
      include: {
        company: {
          select: { id: true, name: true, code: true }
        }
      }
    });

    res.json(role);
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// DELETE /api/roles/:id - Delete role
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    // Check if role exists and belongs to company
    const role = await prisma.role.findFirst({
      where: {
        id,
        companyId: companyId
      }
    });

    if (!role) {
      return res.status(404).json({ error: 'Role not found or not accessible' });
    }

    // Prevent deleting system roles
    if (role.isSystemRole) {
      return res.status(403).json({ error: 'Cannot delete system roles' });
    }

    await prisma.role.delete({
      where: { id }
    });

    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ error: 'Failed to delete role' });
  }
});

// GET /api/roles/permissions/list - Get available permissions list
router.get('/permissions/list', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    // Define all available permissions
    const permissions = [
      { code: 'ASSET_CREATE', name: 'Create Assets', category: 'Assets' },
      { code: 'ASSET_READ', name: 'View Assets', category: 'Assets' },
      { code: 'ASSET_UPDATE', name: 'Update Assets', category: 'Assets' },
      { code: 'ASSET_DELETE', name: 'Delete Assets', category: 'Assets' },
      { code: 'USER_CREATE', name: 'Create Users', category: 'Users' },
      { code: 'USER_READ', name: 'View Users', category: 'Users' },
      { code: 'USER_UPDATE', name: 'Update Users', category: 'Users' },
      { code: 'USER_DELETE', name: 'Delete Users', category: 'Users' },
      { code: 'MAINTENANCE_CREATE', name: 'Create Maintenance', category: 'Maintenance' },
      { code: 'MAINTENANCE_READ', name: 'View Maintenance', category: 'Maintenance' },
      { code: 'MAINTENANCE_UPDATE', name: 'Update Maintenance', category: 'Maintenance' },
      { code: 'MAINTENANCE_DELETE', name: 'Delete Maintenance', category: 'Maintenance' },
      { code: 'REQUEST_CREATE', name: 'Create Requests', category: 'Requests' },
      { code: 'REQUEST_APPROVE', name: 'Approve Requests', category: 'Requests' },
      { code: 'REPORT_VIEW', name: 'View Reports', category: 'Reports' },
      { code: 'AUDIT_VIEW', name: 'View Audit Logs', category: 'Audit' },
    ];

    res.json(permissions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
});

module.exports = router;
