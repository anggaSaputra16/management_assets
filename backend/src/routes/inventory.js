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
  minStockLevel: Joi.number().integer().min(0).default(1)
}).unknown(true);

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
}).unknown(true);

// Generate inventory tag 
const generateInventoryTag = async (departmentCode, companyId) => {
  const today = new Date();
  const year = today.getFullYear().toString().slice(-2);
  const month = String(today.getMonth() + 1).padStart(2, '0');
  
  const prefix = `INV-${departmentCode}-${year}${month}`;
  
  const lastInventory = await prisma.inventory.findFirst({
    where: {
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

const pagination = require('../middleware/pagination')

// Get all inventories
// TODO: use pagination middleware for server-side pagination
router.get('/', authenticate, pagination, async (req, res, next) => {
  try {
    const { search, departmentId, status, condition } = req.query;
    const { page, limit, skip, take } = req.pagination;

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
          current: page,
          hasNext: skip + take < total,
          hasPrev: page > 1
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

    // Ensure referenced asset and department belong to the same company as the authenticated user
    const asset = await prisma.asset.findUnique({ where: { id: value.assetId }, select: { companyId: true } })
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' })
    }

    if (asset.companyId !== req.user.companyId || department.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Asset or Department does not belong to your company' })
    }

    // Generate inventory tag (using companyId from authenticated user)
    const inventoryTag = await generateInventoryTag(department.code, req.user.companyId);

    const inventory = await prisma.inventory.create({
      data: {
        assetId: value.assetId,
        departmentId: value.departmentId,
        custodianId: value.custodianId,
        quantity: value.quantity,
        condition: value.condition,
        location: value.location,
        notes: value.notes,
        minStockLevel: value.minStockLevel,
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
      where: { id: value.inventoryId },
      include: { asset: { select: { companyId: true } } }
    });

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory not found'
      });
    }

    // Enforce company scoping: inventory's asset must belong to the same company
    if (!inventory.asset || inventory.asset.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Inventory does not belong to your company' })
    }

    if (inventory.availableQty < value.quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient inventory quantity available'
      });
    }

    // Generate loan number
    const loanNumber = await generateLoanNumber(req.user.companyId);

  const { sendMail } = require('../utils/mailer')
  const notifications = require('./notifications') // use helpers exported from notifications route

  // Create loan and update inventory in transaction
    const result = await prisma.$transaction(async (tx) => {
      const loan = await tx.inventoryLoan.create({
        data: {
          inventoryId: value.inventoryId,
          borrowerId: value.borrowerId,
          responsibleId: value.responsibleId,
          purpose: value.purpose,
          quantity: value.quantity,
          expectedReturnDate: value.expectedReturnDate,
          notes: value.notes,
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

    // Notify via in-app notifications
    try {
      // Notify borrower and responsible
      if (result.borrower?.email) {
        notifications.createSystemNotification(result.borrower.id, 'Loan Requested', `Your loan request ${result.loanNumber} has been created.`, 'GENERAL')
      }
      if (result.responsible?.email) {
        notifications.createSystemNotification(result.responsible.id, 'Loan Requested', `A loan request ${result.loanNumber} referencing ${result.inventory?.asset?.name} has been created.`, 'GENERAL')
      }

      // Notify company managers via in-app notification and email
      const managers = await prisma.user.findMany({
        where: { companyId: req.user.companyId, role: 'MANAGER', isActive: true },
        select: { id: true, email: true, firstName: true, lastName: true }
      })

      const managerEmails = managers.filter(m => m.email).map(m => m.email)

      for (const m of managers) {
        notifications.createSystemNotification(m.id, 'New Loan Request', `Loan ${result.loanNumber} was requested by ${req.user.name || req.user.email}.`, 'REQUEST_APPROVAL')
      }

      // Send emails (best-effort, do not block response on failure)
      const emailSubject = `Loan Request: ${result.loanNumber}`
      const emailText = `A new loan request (${result.loanNumber}) has been created for asset ${result.inventory?.asset?.name} (inventory: ${result.inventoryId}).\n\nRequester: ${req.user.name || req.user.email}\nQuantity: ${result.quantity}\nPurpose: ${result.purpose}`

      // send to borrower/responsible and managers
      const toEmails = []
      if (result.borrower?.email) toEmails.push(result.borrower.email)
      if (result.responsible?.email) toEmails.push(result.responsible.email)
      if (managerEmails.length) toEmails.push(...managerEmails)

      if (toEmails.length) {
        // fire-and-forget
        sendMail({ to: toEmails.join(','), subject: emailSubject, text: emailText }).catch(err => {
          console.error('Loan notification email failed:', err.message || err)
        })
      }
    } catch (notifyErr) {
      console.error('Failed to create notifications for loan:', notifyErr)
    }

    res.status(201).json({
      success: true,
      data: result,
      message: 'Loan created successfully'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/inventory/loans/:id/approve - Approve a loan (Manager/Admin)
router.post('/loans/:id/approve', authenticate, authorize('ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const { id } = req.params
    const loan = await prisma.inventoryLoan.findUnique({ where: { id }, include: { inventory: { include: { asset: { select: { companyId: true } } } }, borrower: true, responsible: true } })
    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' })
    }

    // Verify company scope
    if (!loan.inventory?.asset || loan.inventory.asset.companyId !== req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Loan does not belong to your company' })
    }

    // Update approvedById and keep status as ACTIVE
    const updated = await prisma.inventoryLoan.update({
      where: { id },
      data: {
        approvedById: req.user.id,
        // Optionally, you can add approval notes from req.body.approvalNotes
        approvalNotes: req.body.approvalNotes || null
      },
      include: {
        borrower: { select: { id: true, email: true, firstName: true, lastName: true } },
        responsible: { select: { id: true, email: true, firstName: true, lastName: true } },
        inventory: { include: { asset: { select: { id: true, name: true } } } }
      }
    })

    // Optionally: notify borrower/responsible (best-effort)
    try {
      const notifications = require('./notifications')
      if (updated.borrower) {
        notifications.createSystemNotification(updated.borrower.id, 'Loan Approved', `Your loan ${updated.loanNumber} has been approved.`, 'REQUEST_APPROVAL')
      }
      if (updated.responsible) {
        notifications.createSystemNotification(updated.responsible.id, 'Loan Approved', `Loan ${updated.loanNumber} has been approved.`, 'REQUEST_APPROVAL')
      }
    } catch (notifyErr) {
      console.error('Notify on loan approve failed:', notifyErr)
    }

    res.json({ success: true, data: updated, message: 'Loan approved' })
  } catch (error) {
    next(error)
  }
})

// Get all loans
// Get all loans (paginated)
router.get('/loans', authenticate, pagination, async (req, res, next) => {
  try {
    const { search, status, borrowerId } = req.query;
    const { page, limit, skip, take } = req.pagination;

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

    // Scope loans to the company via related inventory -> asset
    const companyId = req.user.companyId
    const whereWithCompany = {
      AND: [
        where,
        { inventory: { is: { asset: { is: { companyId } } } } }
      ]
    }

    const [loans, total] = await Promise.all([
      prisma.inventoryLoan.findMany({
        where: whereWithCompany,
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
      prisma.inventoryLoan.count({ where: whereWithCompany })
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