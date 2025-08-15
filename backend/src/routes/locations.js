const express = require('express');
const Joi = require('joi');
const { prisma } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const createLocationSchema = Joi.object({
  name: Joi.string().required(),
  building: Joi.string().optional(),
  floor: Joi.string().optional(),
  room: Joi.string().optional(),
  address: Joi.string().optional(),
  description: Joi.string().optional()
});

const updateLocationSchema = Joi.object({
  name: Joi.string().optional(),
  building: Joi.string().optional(),
  floor: Joi.string().optional(),
  room: Joi.string().optional(),
  address: Joi.string().optional(),
  description: Joi.string().optional(),
  isActive: Joi.boolean().optional()
});

// Get all locations
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, building, status } = req.query;
    const skip = (page - 1) * limit;

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { building: { contains: search, mode: 'insensitive' } },
        { floor: { contains: search, mode: 'insensitive' } },
        { room: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (building) {
      where.building = { contains: building, mode: 'insensitive' };
    }

    if (status !== undefined) {
      where.isActive = status === 'true';
    }

    const [locations, total] = await Promise.all([
      prisma.location.findMany({
        where,
        include: {
          _count: {
            select: {
              assets: true
            }
          }
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: [
          { building: 'asc' },
          { floor: 'asc' },
          { name: 'asc' }
        ]
      }),
      prisma.location.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        locations,
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

// Get locations grouped by building
router.get('/by-building', authenticate, async (req, res, next) => {
  try {
    const locations = await prisma.location.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            assets: true
          }
        }
      },
      orderBy: [
        { building: 'asc' },
        { floor: 'asc' },
        { name: 'asc' }
      ]
    });

    // Group by building
    const groupedLocations = locations.reduce((acc, location) => {
      const building = location.building || 'No Building';
      if (!acc[building]) {
        acc[building] = [];
      }
      acc[building].push(location);
      return acc;
    }, {});

    res.json({
      success: true,
      data: groupedLocations
    });
  } catch (error) {
    next(error);
  }
});

// Get location by ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        assets: {
          select: {
            id: true,
            assetTag: true,
            name: true,
            status: true,
            category: {
              select: { name: true }
            },
            assignedTo: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          take: 20,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            assets: true
          }
        }
      }
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    res.json({
      success: true,
      data: location
    });
  } catch (error) {
    next(error);
  }
});

// Create new location (Admin/Asset Admin only)
router.post('/', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res, next) => {
  try {
    const { error, value } = createLocationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    // Check if location with same name in same building/floor/room exists
    const existingLocation = await prisma.location.findFirst({
      where: {
        name: value.name,
        building: value.building || null,
        floor: value.floor || null,
        room: value.room || null
      }
    });

    if (existingLocation) {
      return res.status(400).json({
        success: false,
        message: 'Location with same details already exists'
      });
    }

    // Create location
    const location = await prisma.location.create({
      data: value
    });

    res.status(201).json({
      success: true,
      message: 'Location created successfully',
      data: location
    });
  } catch (error) {
    next(error);
  }
});

// Update location (Admin/Asset Admin only)
router.put('/:id', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = updateLocationSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    // Check if location exists
    const existingLocation = await prisma.location.findUnique({
      where: { id }
    });

    if (!existingLocation) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    // Check for conflicts if key fields are being updated
    if (value.name || value.building !== undefined || value.floor !== undefined || value.room !== undefined) {
      const checkData = {
        name: value.name || existingLocation.name,
        building: value.building !== undefined ? value.building : existingLocation.building,
        floor: value.floor !== undefined ? value.floor : existingLocation.floor,
        room: value.room !== undefined ? value.room : existingLocation.room
      };

      const conflict = await prisma.location.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              name: checkData.name,
              building: checkData.building,
              floor: checkData.floor,
              room: checkData.room
            }
          ]
        }
      });

      if (conflict) {
        return res.status(400).json({
          success: false,
          message: 'Location with same details already exists'
        });
      }
    }

    // Update location
    const updatedLocation = await prisma.location.update({
      where: { id },
      data: value,
      include: {
        _count: {
          select: {
            assets: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: updatedLocation
    });
  } catch (error) {
    next(error);
  }
});

// Delete location (Admin only)
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if location exists
    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            assets: true
          }
        }
      }
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    // Check if location has assets
    if (location._count.assets > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete location with existing assets'
      });
    }

    // Soft delete by setting isActive to false
    await prisma.location.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Location deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get location statistics
router.get('/:id/statistics', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if location exists
    const location = await prisma.location.findUnique({
      where: { id }
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    const [
      totalAssets,
      assetsByStatus,
      assetsByCategory,
      totalValue,
      utilizationRate
    ] = await Promise.all([
      prisma.asset.count({
        where: { 
          locationId: id,
          isActive: true 
        }
      }),
      prisma.asset.groupBy({
        by: ['status'],
        where: { 
          locationId: id,
          isActive: true 
        },
        _count: true
      }),
      prisma.asset.groupBy({
        by: ['categoryId'],
        where: { 
          locationId: id,
          isActive: true 
        },
        _count: true
      }),
      prisma.asset.aggregate({
        where: { 
          locationId: id,
          isActive: true 
        },
        _sum: { currentValue: true }
      }),
      prisma.asset.count({
        where: {
          locationId: id,
          status: 'IN_USE',
          isActive: true
        }
      })
    ]);

    // Get category names for the statistics
    const categories = await prisma.category.findMany({
      select: { id: true, name: true }
    });

    const categoryMap = categories.reduce((acc, cat) => {
      acc[cat.id] = cat.name;
      return acc;
    }, {});

    const statistics = {
      totalAssets,
      assetsByStatus,
      assetsByCategory: assetsByCategory.map(item => ({
        categoryId: item.categoryId,
        categoryName: categoryMap[item.categoryId] || 'Unknown',
        count: item._count
      })),
      totalValue: totalValue._sum.currentValue || 0,
      utilizationRate: totalAssets > 0 ? (utilizationRate / totalAssets * 100).toFixed(2) : 0
    };

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    next(error);
  }
});

// Get building summary
router.get('/buildings/summary', authenticate, async (req, res, next) => {
  try {
    const buildings = await prisma.location.groupBy({
      by: ['building'],
      where: { isActive: true },
      _count: { building: true }
    });

    const buildingSummary = await Promise.all(
      buildings.map(async (building) => {
        const [locationCount, assetCount, totalValue] = await Promise.all([
          prisma.location.count({
            where: { 
              building: building.building,
              isActive: true 
            }
          }),
          prisma.asset.count({
            where: { 
              location: { 
                building: building.building,
                isActive: true
              },
              isActive: true 
            }
          }),
          prisma.asset.aggregate({
            where: { 
              location: { 
                building: building.building,
                isActive: true
              },
              isActive: true 
            },
            _sum: { currentValue: true }
          })
        ]);

        return {
          building: building.building || 'No Building',
          locationCount,
          assetCount,
          totalValue: totalValue._sum.currentValue || 0
        };
      })
    );

    res.json({
      success: true,
      data: buildingSummary.sort((a, b) => a.building.localeCompare(b.building))
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
