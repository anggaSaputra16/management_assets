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
  borrowerEmployeeId: Joi.string().required(),  // Changed to Employee
  responsibleEmployeeId: Joi.string().required(), // Changed to Employee
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
router.get('/', authenticate, pagination, async (req, res, next) => {
  try {
    const { search, departmentId, status, condition } = req.query;
  // Defensive pagination values: ensure numeric defaults in case middleware wasn't applied
  const { page = 1, limit = 10, skip = 0, take = 10 } = req.pagination || {};
  const safePage = Number.isFinite(Number(page)) && Number(page) > 0 ? Number(page) : 1;
  const safeLimit = Number.isFinite(Number(limit)) && Number(limit) > 0 ? Math.min(100, Number(limit)) : 10;
  const safeSkip = Number.isFinite(Number(skip)) ? Number(skip) : (safePage - 1) * safeLimit;
  const safeTake = Number.isFinite(Number(take)) ? Number(take) : safeLimit;
    const companyId = req.user.companyId;

    const where = { companyId };

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

    const [inventories, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        include: {
          asset: {
            select: {
              id: true,
              name: true,
              assetTag: true,
              serialNumber: true,
              description: true,
              status: true,
              category: {
                select: {
                  name: true
                }
              },
              location: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  building: true,
                  floor: true,
                  room: true
                }
              }
            }
          },
          // Include latest active loan (if any) with borrower/responsible for display
          loans: {
            where: { status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              borrowerEmployee: { select: { id: true, firstName: true, lastName: true, npk: true } },
              responsibleEmployee: { select: { id: true, firstName: true, lastName: true, npk: true } }
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
              email: true,
              username: true,
              role: true
            }
          },
          _count: {
            select: {
              loans: true
            }
          }
        },
        skip: safeSkip,
        take: safeTake,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.inventory.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        inventories,
        pagination: {
          total,
          pages: Math.ceil(total / safeTake),
          current: safePage,
          hasNext: safeSkip + safeTake < total,
          hasPrev: safePage > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get available assets for inventory allocation to department
router.get('/available-assets', authenticate, async (req, res, next) => {
  try {
    const { departmentId } = req.query;
    const companyId = req.user.companyId;

    if (!departmentId) {
      return res.status(400).json({
        success: false,
        message: 'Department ID is required'
      });
    }

    // Get existing inventory for this department to show allocated quantities
    const existingInventory = await prisma.inventory.findMany({
      where: {
        companyId,
        departmentId
      },
      select: { 
        assetId: true,
        quantity: true
      }
    });

    const inventoryMap = {};
    existingInventory.forEach(inv => {
      inventoryMap[inv.assetId] = inv.quantity;
    });

    // Get all AVAILABLE assets in company for selected department
    // Filter assets by departmentId to show only assets in selected department
    const assets = await prisma.asset.findMany({
      where: {
        companyId,
        departmentId, // Filter by department
        status: 'AVAILABLE',
        isActive: true
      },
      select: {
        id: true,
        assetTag: true,
        name: true,
        description: true,
        serialNumber: true,
        category: {
          select: {
            name: true
          }
        },
        department: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Calculate available quantity for each asset
    // Available = total assets with same name/model - already allocated to this department
    const assetGroups = {};
    
    assets.forEach(asset => {
      const key = `${asset.name}|${asset.category?.name || 'Uncategorized'}`;
      if (!assetGroups[key]) {
        assetGroups[key] = {
          assets: [],
          totalQty: 0,
          allocatedToThisDept: inventoryMap[asset.id] || 0
        };
      }
      assetGroups[key].assets.push(asset);
      assetGroups[key].totalQty += 1;
    });

    // Format response with allocation info
    const availableAssets = assets.map(asset => {
      const key = `${asset.name}|${asset.category?.name || 'Uncategorized'}`;
      const group = assetGroups[key];
      const allocatedQty = inventoryMap[asset.id] || 0;
      const availableForAllocation = group.totalQty - allocatedQty;

      return {
        id: asset.id,
        assetTag: asset.assetTag,
        name: asset.name,
        description: asset.description,
        serialNumber: asset.serialNumber,
        category: asset.category,
        currentDepartment: asset.department,
        // Allocation info
        totalInCompany: group.totalQty,
        allocatedToThisDepartment: allocatedQty,
        availableToAllocate: availableForAllocation,
        isAlreadyAllocated: allocatedQty > 0
      };
    });

    res.json({
      success: true,
      data: availableAssets
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

    const companyId = req.user.companyId;

    // Get department with company check
    const department = await prisma.department.findUnique({
      where: { id: value.departmentId },
      select: { code: true, companyId: true }
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    if (department.companyId !== companyId) {
      return res.status(403).json({
        success: false,
        message: 'Department does not belong to your company'
      });
    }

    // Verify asset exists and belongs to company
    const asset = await prisma.asset.findUnique({
      where: { id: value.assetId },
      select: { 
        companyId: true, 
        status: true, 
        name: true,
        assetTag: true,
        serialNumber: true
      }
    });

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    if (asset.companyId !== companyId) {
      return res.status(403).json({ success: false, message: 'Asset does not belong to your company' });
    }

    if (asset.status !== 'AVAILABLE') {
      return res.status(400).json({ 
        success: false, 
        message: `Asset "${asset.name}" is not available. Current status: ${asset.status}` 
      });
    }

    // Check if inventory already exists for this asset-department combination
    const existingInventory = await prisma.inventory.findFirst({
      where: {
        assetId: value.assetId,
        departmentId: value.departmentId,
        companyId
      }
    });

    if (existingInventory) {
      return res.status(400).json({
        success: false,
        message: `Inventory already exists for asset "${asset.name}" (${asset.assetTag}) in this department. Current quantity: ${existingInventory.quantity}. Please edit the existing inventory instead.`
      });
    }

    // Count total assets with same name in company to validate max quantity
    const totalSameAssets = await prisma.asset.count({
      where: {
        companyId,
        name: asset.name,
        status: 'AVAILABLE',
        isActive: true
      }
    });

    // Check if requested quantity exceeds available assets
    if (value.quantity > totalSameAssets) {
      return res.status(400).json({
        success: false,
        message: `Cannot allocate ${value.quantity} units. Only ${totalSameAssets} unit(s) of "${asset.name}" available in company.`
      });
    }

    // Generate inventory tag
    const inventoryTag = await generateInventoryTag(department.code, companyId);

    // Create inventory and update asset status in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create inventory
      const inventory = await tx.inventory.create({
        data: {
          assetId: value.assetId,
          departmentId: value.departmentId,
          companyId,
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
              assetTag: true,
              locationId: true,
              location: {
                select: { id: true, name: true }
              }
            }
          },
          department: {
            select: {
              name: true,
              code: true
            }
          }
        }
      });

      // Update asset status to IN_USE since it's now allocated to department
      await tx.asset.update({
        where: { id: value.assetId },
        data: {
          status: 'IN_USE'
        }
      });

      return inventory;
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Inventory created successfully. Asset status updated to IN_USE.'
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

    // Verify employees exist and belong to company
    const [borrowerEmployee, responsibleEmployee] = await Promise.all([
      prisma.employee.findUnique({
        where: { id: value.borrowerEmployeeId },
        select: { companyId: true, firstName: true, lastName: true, email: true, department: { select: { name: true } } }
      }),
      prisma.employee.findUnique({
        where: { id: value.responsibleEmployeeId },
        select: { companyId: true, firstName: true, lastName: true, email: true, department: { select: { name: true } } }
      })
    ]);

    if (!borrowerEmployee || borrowerEmployee.companyId !== req.user.companyId) {
      return res.status(404).json({ success: false, message: 'Borrower employee not found or does not belong to your company' });
    }

    if (!responsibleEmployee || responsibleEmployee.companyId !== req.user.companyId) {
      return res.status(404).json({ success: false, message: 'Responsible employee not found or does not belong to your company' });
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
          borrowerEmployeeId: value.borrowerEmployeeId,
          responsibleEmployeeId: value.responsibleEmployeeId,
          requestedById: req.user.id, // User who creates the loan
          purpose: value.purpose,
          quantity: value.quantity,
          expectedReturnDate: value.expectedReturnDate,
          notes: value.notes,
          loanNumber
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
          borrowerEmployee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              department: {
                select: {
                  name: true
                }
              }
            }
          },
          responsibleEmployee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              department: {
                select: {
                  name: true
                }
              }
            }
          },
          requestedBy: {
            select: {
              id: true,
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
      // Notify company managers via in-app notification and email
      const managers = await prisma.user.findMany({
        where: { companyId: req.user.companyId, role: { in: ['MANAGER', 'ADMIN', 'ASSET_ADMIN'] }, isActive: true },
        select: { id: true, email: true, firstName: true, lastName: true }
      })

      const managerEmails = managers.filter(m => m.email).map(m => m.email)

      const requesterName = `${result.requestedBy.firstName} ${result.requestedBy.lastName}`
      const borrowerName = `${result.borrowerEmployee.firstName} ${result.borrowerEmployee.lastName}`

      for (const m of managers) {
        notifications.createSystemNotification(
          m.id, 
          'New Loan Request', 
          `Loan ${result.loanNumber} created by ${requesterName} for ${borrowerName} (${result.borrowerEmployee.department?.name || 'No Dept'})`, 
          'REQUEST_APPROVAL'
        )
      }

      // Send emails (best-effort, do not block response on failure)
      const emailSubject = `Loan Request: ${result.loanNumber}`
      const emailText = `A new loan request has been created:
      
Loan Number: ${result.loanNumber}
Asset: ${result.inventory?.asset?.name} (${result.inventory?.asset?.assetTag})
Requested By: ${requesterName} (${result.requestedBy.email})

Borrower: ${borrowerName} (${result.borrowerEmployee.department?.name || 'No Dept'})
Responsible: ${result.responsibleEmployee.firstName} ${result.responsibleEmployee.lastName}

Quantity: ${result.quantity}
Purpose: ${result.purpose}
Expected Return: ${new Date(result.expectedReturnDate).toLocaleDateString()}

Please review and approve this loan request.`

      // send to managers
      const toEmails = managerEmails

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
  const loan = await prisma.inventoryLoan.findUnique({ where: { id }, include: { inventory: { include: { asset: { select: { companyId: true } } } }, borrowerEmployee: true, responsibleEmployee: true } })
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
        borrowerEmployee: { select: { id: true, email: true, firstName: true, lastName: true } },
        responsibleEmployee: { select: { id: true, email: true, firstName: true, lastName: true } },
        inventory: { include: { asset: { select: { id: true, name: true } } } }
      }
    })

    // Optionally: notify borrower/responsible (best-effort)
    try {
      const notifications = require('./notifications')
      if (updated.borrowerEmployee) {
        notifications.createSystemNotification(updated.borrowerEmployee.id, 'Loan Approved', `Your loan ${updated.loanNumber} has been approved.`, 'REQUEST_APPROVAL')
      }
      if (updated.responsibleEmployee) {
        notifications.createSystemNotification(updated.responsibleEmployee.id, 'Loan Approved', `Loan ${updated.loanNumber} has been approved.`, 'REQUEST_APPROVAL')
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

    // Scope loans to the company via inventory.companyId
    const companyId = req.user.companyId
    const whereWithCompany = {
      AND: [
        where,
        { inventory: { is: { companyId } } }
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
              },
              department: {
                select: {
                  name: true
                }
              }
            }
          },
          borrowerEmployee: {
            select: {
              id: true,
              npk: true,
              firstName: true,
              lastName: true,
              email: true,
              position: true,
              department: {
                select: {
                  name: true
                }
              }
            }
          },
          responsibleEmployee: {
            select: {
              id: true,
              npk: true,
              firstName: true,
              lastName: true,
              email: true,
              position: true,
              department: {
                select: {
                  name: true
                }
              }
            }
          },
          requestedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true
            }
          },
          approvedBy: {
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