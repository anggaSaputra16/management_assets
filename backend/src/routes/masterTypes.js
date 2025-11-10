const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const Joi = require('joi');
const { refreshTypeCache, clearTypeCache } = require('../utils/validateType');

const prisma = new PrismaClient();

// Validation schemas
const createTypeSchema = Joi.object({
  group: Joi.string().required().max(50),
  key: Joi.string().required().max(100),
  label: Joi.string().required().max(200),
  description: Joi.string().allow(null, '').max(500),
  sortOrder: Joi.number().integer().min(0).default(0)
});

const updateTypeSchema = Joi.object({
  label: Joi.string().max(200),
  description: Joi.string().allow(null, ''),
  sortOrder: Joi.number().integer().min(0),
  isActive: Joi.boolean()
});

/**
 * GET /api/master/types
 * Get all types or filter by group
 * Query params: group, isActive
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { group, isActive } = req.query;

    const where = {};
    if (group) {
      where.group = group;
    }
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const types = await prisma.globalTypeMaster.findMany({
      where,
      orderBy: [
        { group: 'asc' },
        { sortOrder: 'asc' },
        { key: 'asc' }
      ]
    });

    // Group by type group for easier consumption
    if (group) {
      // Return flat array for single group
      res.json(types);
    } else {
      // Return grouped object for multiple groups
      const grouped = types.reduce((acc, type) => {
        if (!acc[type.group]) {
          acc[type.group] = [];
        }
        acc[type.group].push(type);
        return acc;
      }, {});
      res.json(grouped);
    }
  } catch (error) {
    console.error('Error fetching types:', error);
    res.status(500).json({ error: 'Failed to fetch types' });
  }
});

/**
 * GET /api/master/types/groups
 * Get list of all type groups with counts
 */
router.get('/groups', authenticate, async (req, res) => {
  try {
    const groups = await prisma.globalTypeMaster.groupBy({
      by: ['group'],
      _count: {
        id: true
      },
      orderBy: {
        group: 'asc'
      }
    });

    const result = groups.map(g => ({
      group: g.group,
      count: g._count.id
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching type groups:', error);
    res.status(500).json({ error: 'Failed to fetch type groups' });
  }
});

/**
 * GET /api/master/types/:id
 * Get a specific type by ID
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const type = await prisma.globalTypeMaster.findUnique({
      where: { id }
    });

    if (!type) {
      return res.status(404).json({ error: 'Type not found' });
    }

    res.json(type);
  } catch (error) {
    console.error('Error fetching type:', error);
    res.status(500).json({ error: 'Failed to fetch type' });
  }
});

/**
 * POST /api/master/types
 * Create a new type (ADMIN and ASSET_ADMIN only)
 */
router.post('/', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res) => {
  try {
    const { error, value } = createTypeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if type already exists
    const existing = await prisma.globalTypeMaster.findFirst({
      where: {
        group: value.group,
        key: value.key
      }
    });

    if (existing) {
      return res.status(409).json({
        error: `Type '${value.key}' already exists in group '${value.group}'`
      });
    }

    // Create new type
    const newType = await prisma.globalTypeMaster.create({
      data: {
        group: value.group,
        key: value.key,
        label: value.label,
        description: value.description,
        sortOrder: value.sortOrder,
        isActive: true
      }
    });

    // Refresh cache after creating
    await refreshTypeCache();

    res.status(201).json(newType);
  } catch (error) {
    console.error('Error creating type:', error);
    res.status(500).json({ error: 'Failed to create type' });
  }
});

/**
 * PUT /api/master/types/:id
 * Update a type (ADMIN and ASSET_ADMIN only)
 */
router.put('/:id', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateTypeSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if type exists
    const existing = await prisma.globalTypeMaster.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Type not found' });
    }

    // Update type
    const updatedType = await prisma.globalTypeMaster.update({
      where: { id },
      data: {
        ...value,
        updatedAt: new Date()
      }
    });

    // Refresh cache after updating
    await refreshTypeCache();

    res.json(updatedType);
  } catch (error) {
    console.error('Error updating type:', error);
    res.status(500).json({ error: 'Failed to update type' });
  }
});

/**
 * DELETE /api/master/types/:id
 * Soft delete a type (set isActive = false) (ADMIN only)
 */
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if type exists
    const existing = await prisma.globalTypeMaster.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Type not found' });
    }

    // Soft delete (set isActive = false)
    const deletedType = await prisma.globalTypeMaster.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    // Refresh cache after deleting
    await refreshTypeCache();

    res.json({ message: 'Type deactivated successfully', type: deletedType });
  } catch (error) {
    console.error('Error deleting type:', error);
    res.status(500).json({ error: 'Failed to delete type' });
  }
});

/**
 * POST /api/master/types/refresh-cache
 * Manually refresh the type validation cache (ADMIN only)
 */
router.post('/refresh-cache', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    await refreshTypeCache();
    res.json({ message: 'Type cache refreshed successfully' });
  } catch (error) {
    console.error('Error refreshing cache:', error);
    res.status(500).json({ error: 'Failed to refresh cache' });
  }
});

module.exports = router;
