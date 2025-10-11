const express = require('express');
const Joi = require('joi');
const { prisma } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const createInventorySchema = Joi.object({
  assetId: Joi.string().required(),
  departmentId: Joi.string().required(),
  custodianId: Joi.string().optional(),
  quantity: Joi.number().integer().min(1).default(1),
  condition: Joi.string().valid('GOOD', 'FAIR', 'POOR', 'DAMAGED').default('GOOD'),
  location: Joi.string().optional(),
  notes: Joi.string().optional(),
  minStockLevel: Joi.number().integer().min(0).default(1),
  companyId: Joi.string().optional()
});

const updateInventorySchema = Joi.object({
  custodianId: Joi.string().optional(),
  quantity: Joi.number().integer().min(1).optional(),
  availableQty: Joi.number().integer().min(0).optional(),
  condition: Joi.string().valid('GOOD', 'FAIR', 'POOR', 'DAMAGED').optional(),
  status: Joi.string().valid('AVAILABLE', 'LOANED', 'MAINTENANCE', 'RETIRED').optional(),
  location: Joi.string().optional(),
  notes: Joi.string().optional(),
  minStockLevel: Joi.number().integer().min(0).optional()
});

const createLoanSchema = Joi.object({
  inventoryId: Joi.string().required(),
  borrowerId: Joi.string().required(),
  responsibleId: Joi.string().required(),
  purpose: Joi.string().required(),
  quantity: Joi.number().integer().min(1).default(1),
  expectedReturnDate: Joi.date().required(),
  notes: Joi.string().optional()
});

// Generate inventory tag
const generateInventoryTag = async (departmentCode, companyId) => {
  const today = new Date();
  const year = today.getFullYear().toString().slice(-2);
  const month = String(today.getMonth() + 1).padStart(2, '0');
  
  const prefix = `INV-${departmentCode}-${year}${month}`;
  
  const lastInventory = await prisma.inventory.findFirst({
    where: {
      companyId,
      inventoryTag: {
        startsWith: prefix
      }
    },
    orderBy: {
      inventoryTag: 'desc'
    }
  });

  let sequence = 1;
  if (lastInventory) {
    const lastSequence = parseInt(lastInventory.inventoryTag.slice(-4));
    sequence = lastSequence + 1;
  }

  return `${prefix}-${String(sequence).padStart(4, '0')}`;
};

// Generate loan number
const generateLoanNumber = async (companyId) => {
  const today = new Date();
  const year = today.getFullYear().toString().slice(-2);
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  const prefix = `LOAN-${year}${month}${day}`;
  
  const lastLoan = await prisma.inventoryLoan.findFirst({
    where: {
      companyId,
      loanNumber: {
        startsWith: prefix
      }
    },
    orderBy: {
      loanNumber: 'desc'
    }
  });

  let sequence = 1;
  if (lastLoan) {
    const lastSequence = parseInt(lastLoan.loanNumber.slice(-3));
    sequence = lastSequence + 1;
  }

  return `${prefix}-${String(sequence).padStart(3, '0')}`;
};

// Get all inventories
router.get('/', authenticate, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      departmentId,
      status,
      condition
    } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // Note: `inventory` model in Prisma schema does not have a direct `companyId` field
  // (see error: Unknown argument `companyId`). Instead enforce company scoping via
  // related models (for example, the linked `asset` or `department`) when needed.
  const companyId = req.user.companyId;

  const where = {};

    if (search) {
      where.OR = [
        { inventoryTag: { contains: search, mode: 'insensitive' } },
        { asset: { name: { contains: search, mode: 'insensitive' } } },
        { asset: { assetTag: { contains: search, mode: 'insensitive' } } },
        { location: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (status) {
      where.status = status;
    }

    if (condition) {
      where.condition = condition;
    }

    // When scoping inventories to the current company, filter by related asset's companyId
    // if the asset relation exists. This avoids passing an unknown `companyId` arg to Prisma.
    const inventoryWhere = { ...where };
    if (companyId) {
      // Only apply company filter through the related asset if asset relation exists
      inventoryWhere.asset = { is: { companyId } }
    }

    const [inventories, total] = await Promise.all([
      prisma.inventory.findMany({
        where: inventoryWhere,
        include: {
          asset: {
            select: {
              id: true,
              name: true,
              assetTag: true,
              description: true,
              category: {
                select: {
                  name: true
                }
              }
            }
          },
          department: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          custodian: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        skip,
        take,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.inventory.count({ where: inventoryWhere })
    ]);

    res.json({
      success: true,
      data: {
        inventories,
        pagination: {
          total,
          pages: Math.ceil(total / take),
          current: parseInt(page),
          hasNext: skip + take < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create inventory (only Admin/Asset Admin/Manager)
router.post('/', authenticate, require('../middleware/auth').authorize('ADMIN', 'ASSET_ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const { error, value } = createInventorySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Get department code for tag generation
    const department = await prisma.department.findUnique({
      where: { id: value.departmentId },
      select: { code: true }
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Generate inventory tag
    const inventoryTag = await generateInventoryTag(department.code);

    const inventory = await prisma.inventory.create({
      data: {
        ...value,
        inventoryTag,
        availableQty: value.quantity
      },
      include: {
        asset: {
          select: {
            name: true,
            assetTag: true
          }
        },
        department: {
          select: {
            name: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: inventory,
      message: 'Inventory created successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Create loan
router.post('/loans', authenticate, async (req, res, next) => {
  try {
    const { error, value } = createLoanSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Check inventory availability
    const inventory = await prisma.inventory.findUnique({
      where: { id: value.inventoryId }
    });

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory not found'
      });
    }

    if (inventory.availableQty < value.quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient inventory quantity available'
      });
    }

    // Generate loan number
    const loanNumber = await generateLoanNumber();

    // Create loan and update inventory in transaction
    const result = await prisma.$transaction(async (tx) => {
      const loan = await tx.inventoryLoan.create({
        data: {
          ...value,
          loanNumber,
          approvedById: req.user.id
        },
        include: {
          inventory: {
            include: {
              asset: {
                select: {
                  name: true,
                  assetTag: true
                }
              }
            }
          },
          borrower: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          responsible: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      // Update inventory available quantity
      await tx.inventory.update({
        where: { id: value.inventoryId },
        data: {
          availableQty: {
            decrement: value.quantity
          },
          status: inventory.availableQty - value.quantity === 0 ? 'LOANED' : 'AVAILABLE'
        }
      });

      return loan;
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Loan created successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get all loans
router.get('/loans', authenticate, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      borrowerId
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};

    if (search) {
      where.OR = [
        { loanNumber: { contains: search, mode: 'insensitive' } },
        { purpose: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status) {
      where.status = status;
    }

    if (borrowerId) {
      where.borrowerId = borrowerId;
    }

    const [loans, total] = await Promise.all([
      prisma.inventoryLoan.findMany({
        where,
        include: {
          inventory: {
            include: {
              asset: {
                select: {
                  name: true,
                  assetTag: true
                }
              }
            }
          },
          borrower: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          responsible: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        skip,
        take,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.inventoryLoan.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        loans,
        pagination: {
          total,
          pages: Math.ceil(total / take),
          current: parseInt(page),
          hasNext: skip + take < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Return loan
router.post('/loans/:id/return', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { condition, notes } = req.body;

    const loan = await prisma.inventoryLoan.findUnique({
      where: { id },
      include: {
        inventory: true
      }
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    if (loan.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Loan is not active'
      });
    }

    // Return loan and update inventory in transaction
    const result = await prisma.$transaction(async (tx) => {
      const updatedLoan = await tx.inventoryLoan.update({
        where: { id },
        data: {
          status: 'RETURNED',
          actualReturnDate: new Date(),
          condition,
          notes
        }
      });

      // Update inventory available quantity
      await tx.inventory.update({
        where: { id: loan.inventoryId },
        data: {
          availableQty: {
            increment: loan.quantity
          },
          status: 'AVAILABLE'
        }
      });

      return updatedLoan;
    });

    res.json({
      success: true,
      data: result,
      message: 'Loan returned successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get inventory statistics
router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const [
      totalInventory,
      availableInventory,
      loanedInventory,
      activeLoans
    ] = await Promise.all([
      prisma.inventory.count(),
      prisma.inventory.count({
        where: { status: 'AVAILABLE' }
      }),
      prisma.inventory.count({
        where: { status: 'LOANED' }
      }),
      prisma.inventoryLoan.count({
        where: { status: 'ACTIVE' }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalInventory,
        availableInventory,
        loanedInventory,
        activeLoans
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;