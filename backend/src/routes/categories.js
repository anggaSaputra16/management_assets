const express = require('express');
const Joi = require('joi');
const { prisma } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const createCategorySchema = Joi.object({
  name: Joi.string().required(),
  code: Joi.string().required(),
  description: Joi.string().allow('').optional(),
  parentId: Joi.string().allow(null, '').optional(),
  companyId: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
  // FIX: Depreciation fields moved to Assets entity
  isActive: Joi.boolean().optional()
}).unknown(true);

const updateCategorySchema = Joi.object({
  name: Joi.string().optional(),
  code: Joi.string().optional(),
  description: Joi.string().allow('').optional(),
  parentId: Joi.string().allow(null, '').optional(),
  companyId: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
  // FIX: Depreciation fields moved to Assets entity
  isActive: Joi.boolean().optional()
}).unknown(true);

// Get all categories
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, status, parent } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      companyId: req.user.companyId // Filter by user's company
    };

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

    if (parent !== undefined) {
      where.parentId = parent === 'null' ? null : parent;
    }

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        include: {
          companies: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          categories: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          other_categories: {
            select: {
              id: true,
              name: true,
              code: true,
              isActive: true
            }
          },
          _count: {
            select: {
              assets: true,
              other_categories: true
            }
          }
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { name: 'asc' }
      }),
      prisma.category.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        categories,
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

// Get category tree (hierarchical view)
router.get('/tree', authenticate, async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { 
        parentId: null,
        isActive: true,
        companyId: req.user.companyId // Filter by user's company
      },
      include: {
        other_categories: {
          where: { isActive: true },
          include: {
            other_categories: {
              where: { isActive: true },
              include: {
                _count: {
                  select: { assets: true }
                }
              }
            },
            _count: {
              select: { assets: true }
            }
          }
        },
        _count: {
          select: { assets: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
});

// Get category by ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findFirst({
      where: { 
        id,
        companyId: req.user.companyId
      },
      include: {
        categories: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        other_categories: {
          select: {
            id: true,
            name: true,
            code: true,
            isActive: true
          }
        },
        assets: {
          select: {
            id: true,
            assetTag: true,
            name: true,
            status: true,
            currentValue: true
          },
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            assets: true,
            other_categories: true
          }
        }
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
});

// Create new category (Admin/Asset Admin only)
router.post('/', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res, next) => {
  try {
    const { error, value } = createCategorySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    const { name, code, description, parentId, companyId } = value;

    // Determine final companyId
    let finalCompanyId = companyId;
    if (!finalCompanyId) {
      // If no companyId provided, use the creating user's companyId
      finalCompanyId = req.user.companyId;
    }

    // Check if category name or code already exists within the company
    const existingCategory = await prisma.category.findFirst({
      where: {
        companyId: finalCompanyId,
        OR: [
          { name },
          { code }
        ]
      }
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name or code already exists in this company'
      });
    }

    // If parentId provided, check if parent exists within the same company
    if (parentId) {
      const parent = await prisma.category.findFirst({
        where: { 
          id: parentId,
          companyId: finalCompanyId
        }
      });

      if (!parent || !parent.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Invalid parent category'
        });
      }
    }

    // Create category
    const category = await prisma.category.create({
      data: {
        name,
        code,
        description,
        parent: parentId ? {
          connect: { id: parentId }
        } : undefined,
        companies: {
          connect: { id: finalCompanyId }
        }
      },
      include: {
        companies: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        categories: {
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
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
});

// Update category (Admin/Asset Admin only)
router.put('/:id', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = updateCategorySchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    // Check if category exists
    const existingCategory = await prisma.category.findFirst({
      where: { 
        id,
        companyId: req.user.companyId // Filter by user's company
      }
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check for name/code conflicts (excluding current category, within same company)
    if (value.name || value.code) {
      const conflicts = await prisma.category.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            { companyId: req.user.companyId },
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
          message: 'Category name or code already exists in this company'
        });
      }
    }

    // If parentId provided, validate and check for circular reference
    if (value.parentId) {
      if (value.parentId === id) {
        return res.status(400).json({
          success: false,
          message: 'Category cannot be its own parent'
        });
      }

      const parent = await prisma.category.findFirst({
        where: { 
          id: value.parentId,
          companyId: req.user.companyId
        }
      });

      if (!parent || !parent.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Invalid parent category'
        });
      }

      // Check for circular reference (simplified check)
      if (parent.parentId === id) {
        return res.status(400).json({
          success: false,
          message: 'Circular reference detected'
        });
      }
    }

    // Update category
    const { parentId, ...updateData } = value;
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        ...updateData,
        categories: {
          connect: parentId ? { id: parentId } : undefined,
          disconnect: parentId === null ? true : undefined
        }
      },
      include: {
        categories: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        _count: {
          select: {
            assets: true,
            other_categories: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory
    });
  } catch (error) {
    next(error);
  }
});

// Delete category (Admin only)
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const category = await prisma.category.findFirst({
      where: { 
        id,
        companyId: req.user.companyId
      },
      include: {
        _count: {
          select: {
            assets: true,
            other_categories: true
          }
        }
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has assets or children
    if (category._count.assets > 0 || category._count.children > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with existing assets or subcategories'
      });
    }

    // Soft delete by setting isActive to false
    await prisma.category.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get category statistics
router.get('/:id/statistics', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const category = await prisma.category.findFirst({
      where: { 
        id,
        companyId: req.user.companyId
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get category and its children IDs for comprehensive stats
    const childCategories = await prisma.category.findMany({
      where: { 
        parentId: id,
        companyId: req.user.companyId
      },
      select: { id: true }
    });

    const categoryIds = [id, ...childCategories.map(child => child.id)];
    const companyFilter = { companyId: req.user.companyId };

    const [
      totalAssets,
      assetsByStatus,
      totalValue,
      averageValue,
      newestAsset,
      oldestAsset
    ] = await Promise.all([
      prisma.asset.count({
        where: { 
          ...companyFilter,
          categoryId: { in: categoryIds },
          isActive: true 
        }
      }),
      prisma.asset.groupBy({
        by: ['status'],
        where: { 
          ...companyFilter,
          categoryId: { in: categoryIds },
          isActive: true 
        },
        _count: true
      }),
      prisma.asset.aggregate({
        where: { 
          ...companyFilter,
          categoryId: { in: categoryIds },
          isActive: true 
        },
        _sum: { currentValue: true }
      }),
      prisma.asset.aggregate({
        where: { 
          ...companyFilter,
          categoryId: { in: categoryIds },
          isActive: true,
          currentValue: { not: null }
        },
        _avg: { currentValue: true }
      }),
      prisma.asset.findFirst({
        where: { 
          ...companyFilter,
          categoryId: { in: categoryIds },
          isActive: true 
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          assetTag: true,
          name: true,
          createdAt: true
        }
      }),
      prisma.asset.findFirst({
        where: { 
          ...companyFilter,
          categoryId: { in: categoryIds },
          isActive: true 
        },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          assetTag: true,
          name: true,
          createdAt: true
        }
      })
    ]);

    const statistics = {
      totalAssets,
      assetsByStatus,
      totalValue: totalValue._sum.currentValue || 0,
      averageValue: averageValue._avg.currentValue || 0,
      newestAsset,
      oldestAsset
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



