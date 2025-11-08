const express = require('express');
const Joi = require('joi');
const { prisma } = require('../config/database');
const { authenticate, authorize, canApprove } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const createRequestSchema = Joi.object({
  requestType: Joi.string().valid('ASSET_REQUEST', 'MAINTENANCE_REQUEST', 'SPARE_PART_REQUEST', 'SOFTWARE_LICENSE', 'ASSET_TRANSFER', 'ASSET_DISPOSAL', 'ASSET_BREAKDOWN').required(),
  description: Joi.string().required(),
  justification: Joi.string().required(),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').default('MEDIUM'),
  assetId: Joi.string().optional(),
  companyId: Joi.string().optional()
});

const updateRequestSchema = Joi.object({
  requestType: Joi.string().valid('ASSET_REQUEST', 'MAINTENANCE_REQUEST', 'SPARE_PART_REQUEST', 'SOFTWARE_LICENSE', 'ASSET_TRANSFER', 'ASSET_DISPOSAL', 'ASSET_BREAKDOWN').optional(),
  description: Joi.string().optional(),
  justification: Joi.string().optional(),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').optional(),
  notes: Joi.string().optional()
  ,
  companyId: Joi.string().optional()
});

const approvalSchema = Joi.object({
  action: Joi.string().valid('APPROVE', 'REJECT').required(),
  rejectionReason: Joi.string().when('action', {
    is: 'REJECT',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  notes: Joi.string().optional()
  ,
  companyId: Joi.string().optional()
});

// Generate request number
const generateRequestNumber = async (companyId) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  
  const lastRequest = await prisma.assetRequest.findFirst({
    where: {
      companyId,
      requestNumber: {
        startsWith: `REQ-${year}${month}-`
      }
    },
    orderBy: { requestNumber: 'desc' }
  });

  let sequence = 1;
  if (lastRequest) {
    const lastSequence = parseInt(lastRequest.requestNumber.split('-')[2]);
    sequence = lastSequence + 1;
  }

  return `REQ-${year}${month}-${String(sequence).padStart(4, '0')}`;
};

// Get all requests
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      priority, 
      department,
      requesterId 
    } = req.query;
    
    const skip = (page - 1) * limit;
    const companyId = req.user.companyId;
    const where = { companyId };

    // Role-based filtering
    switch (req.user.role) {
      case 'DEPARTMENT_USER':
        where.requesterId = req.user.id;
        break;
      case 'MANAGER':
        if (req.user.departmentId) {
          where.departmentId = req.user.departmentId;
        }
        break;
      case 'ADMIN':
      case 'ASSET_ADMIN':
      case 'TOP_MANAGEMENT':
        // Can see all requests in their company
        break;
      default:
        where.requesterId = req.user.id;
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (department && ['ADMIN', 'ASSET_ADMIN', 'TOP_MANAGEMENT'].includes(req.user.role)) {
      where.departmentId = department;
    }
    if (requesterId && ['ADMIN', 'ASSET_ADMIN', 'MANAGER'].includes(req.user.role)) {
      where.requesterId = requesterId;
    }

    const [requests, total] = await Promise.all([
      prisma.assetRequest.findMany({
        where,
        include: {
          requester: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          department: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          asset: {
            select: {
              id: true,
              assetTag: true,
              name: true,
              status: true
            }
          },
          approvedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { requestedDate: 'desc' }
      }),
      prisma.assetRequest.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        requests,
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

// Get request by ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const request = await prisma.assetRequest.findUnique({
      where: { id },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        asset: {
          select: {
            id: true,
            assetTag: true,
            name: true,
            description: true,
            status: true,
            category: {
              select: { name: true }
            }
          }
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        editedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Check permissions
    const canView = req.user.role === 'ADMIN' || 
                   req.user.role === 'ASSET_ADMIN' || 
                   req.user.role === 'TOP_MANAGEMENT' ||
                   request.requesterId === req.user.id ||
                   (req.user.role === 'MANAGER' && request.departmentId === req.user.departmentId);

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this request'
      });
    }

    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    next(error);
  }
});

// Create new request
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { error, value } = createRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    // Check if user has department
    if (!req.user.departmentId) {
      return res.status(400).json({
        success: false,
        message: 'User must be assigned to a department to make requests'
      });
    }

    // If specific asset requested, check if it exists and is available
    if (value.assetId) {
      const asset = await prisma.asset.findUnique({
        where: { id: value.assetId }
      });

      if (!asset) {
        return res.status(400).json({
          success: false,
          message: 'Asset not found'
        });
      }

      if (asset.status !== 'AVAILABLE') {
        return res.status(400).json({
          success: false,
          message: 'Asset is not available for request'
        });
      }
    }

    // Generate request number
    const requestNumber = await generateRequestNumber();

    // Create request
    const request = await prisma.assetRequest.create({
      data: {
        ...value,
        requestNumber,
        requesterId: req.user.id,
        departmentId: req.user.departmentId
      },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        asset: {
          select: {
            id: true,
            assetTag: true,
            name: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Asset request created successfully',
      data: request
    });
  } catch (error) {
    next(error);
  }
});

// Update request (only requester can update pending requests)
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = updateRequestSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    // Check if request exists
    const existingRequest = await prisma.assetRequest.findUnique({
      where: { id }
    });

    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Check permissions
    if (existingRequest.requesterId !== req.user.id && !['ADMIN', 'ASSET_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own requests'
      });
    }

    // Check if request can be updated
    if (existingRequest.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Only pending requests can be updated'
      });
    }

    // Add audit fields
    value.editedBy = req.user.userId;
    value.lastEditedAt = new Date();
    
    // Update request
    const updatedRequest = await prisma.assetRequest.update({
      where: { id },
      data: value,
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        asset: {
          select: {
            id: true,
            assetTag: true,
            name: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Request updated successfully',
      data: updatedRequest
    });
  } catch (error) {
    next(error);
  }
});

// Approve or reject request (Managers and above)
router.post('/:id/approval', authenticate, canApprove, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = approvalSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    // Check if request exists
    const request = await prisma.assetRequest.findUnique({
      where: { id },
      include: {
        requester: true,
        department: true,
        asset: true
      }
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Check if request is pending
    if (request.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Request has already been processed'
      });
    }

    // Check if manager can approve this department's requests
    if (req.user.role === 'MANAGER' && request.departmentId !== req.user.departmentId) {
      return res.status(403).json({
        success: false,
        message: 'You can only approve requests from your department'
      });
    }

    const updateData = {
      status: value.action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      approvedById: req.user.id,
      approvedDate: new Date(),
      notes: value.notes
    };

    if (value.action === 'REJECT') {
      updateData.rejectionReason = value.rejectionReason;
    }

    // Update request
    const updatedRequest = await prisma.assetRequest.update({
      where: { id },
      data: updateData,
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        asset: {
          select: {
            id: true,
            assetTag: true,
            name: true
          }
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: `Request ${value.action.toLowerCase()}d successfully`,
      data: updatedRequest
    });
  } catch (error) {
    next(error);
  }
});

// Allocate approved request (Asset Admin only)
router.post('/:id/allocate', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const allocateSchema = Joi.object({
      assetId: Joi.string().required(),
      notes: Joi.string().optional()
    });

    const { error, value } = allocateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    // Check if request exists and is approved
    const request = await prisma.assetRequest.findUnique({
      where: { id },
      include: { requester: true }
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.status !== 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Only approved requests can be allocated'
      });
    }

    // Check if asset exists and is available
    const asset = await prisma.asset.findUnique({
      where: { id: value.assetId }
    });

    if (!asset) {
      return res.status(400).json({
        success: false,
        message: 'Asset not found'
      });
    }

    if (asset.status !== 'AVAILABLE') {
      return res.status(400).json({
        success: false,
        message: 'Asset is not available for allocation'
      });
    }

    // Use transaction for allocation
    const result = await prisma.$transaction(async (tx) => {
      // Update request
      const updatedRequest = await tx.assetRequest.update({
        where: { id },
        data: {
          status: 'ALLOCATED',
          assetId: value.assetId,
          allocatedDate: new Date(),
          notes: value.notes
        }
      });

      // Update asset
      const updatedAsset = await tx.asset.update({
        where: { id: value.assetId },
        data: {
          assignedToId: request.requesterId,
          departmentId: request.departmentId,
          status: 'IN_USE'
        }
      });

      return { updatedRequest, updatedAsset };
    });

    res.json({
      success: true,
      message: 'Asset allocated successfully',
      data: result.updatedRequest
    });
  } catch (error) {
    next(error);
  }
});

// Cancel request (requester only for pending requests)
router.post('/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if request exists
    const request = await prisma.assetRequest.findUnique({
      where: { id }
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Check permissions
    if (request.requesterId !== req.user.id && !['ADMIN', 'ASSET_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only cancel your own requests'
      });
    }

    // Check if request can be cancelled
    if (!['PENDING', 'APPROVED'].includes(request.status)) {
      return res.status(400).json({
        success: false,
        message: 'Request cannot be cancelled in current status'
      });
    }

    // Delete the request
    await prisma.assetRequest.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Request cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get request statistics
router.get('/statistics/overview', authenticate, authorize('ADMIN', 'ASSET_ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const where = {};
    
    // Filter by department for managers
    if (req.user.role === 'MANAGER' && req.user.departmentId) {
      where.departmentId = req.user.departmentId;
    }

    const [
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      allocatedRequests,
      requestsByPriority,
      requestsByDepartment
    ] = await Promise.all([
      prisma.assetRequest.count({ where }),
      prisma.assetRequest.count({ where: { ...where, status: 'PENDING' } }),
      prisma.assetRequest.count({ where: { ...where, status: 'APPROVED' } }),
      prisma.assetRequest.count({ where: { ...where, status: 'REJECTED' } }),
      prisma.assetRequest.count({ where: { ...where, status: 'ALLOCATED' } }),
      prisma.assetRequest.groupBy({
        by: ['priority'],
        where,
        _count: true
      }),
      req.user.role !== 'MANAGER' ? prisma.assetRequest.groupBy({
        by: ['departmentId'],
        where,
        _count: true
      }) : []
    ]);

    const statistics = {
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      allocatedRequests,
      requestsByPriority,
      requestsByDepartment
    };

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    next(error);
  }
});

// Simple stats endpoint for dashboard
router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const where = req.user.role === 'MANAGER' ? { departmentId: req.user.departmentId } : {};
    
    const [pending, active] = await Promise.all([
      prisma.assetRequest.count({ 
        where: { ...where, status: 'PENDING' }
      }),
      prisma.assetRequest.count({ 
        where: { 
          ...where, 
          status: { in: ['APPROVED', 'ALLOCATED'] }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        pending,
        active
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
module.exports = router;
