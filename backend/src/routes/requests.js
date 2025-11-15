const express = require('express');
const Joi = require('joi');
const { prisma } = require('../config/database');
const { authenticate, authorize, canApprove } = require('../middleware/auth');

const router = express.Router();

// Helper function to get valid values from GlobalTypeMaster
const getValidValuesFromMaster = async (group) => {
  const types = await prisma.globalTypeMaster.findMany({
    where: {
      group,
      isActive: true
    },
    select: {
      key: true
    },
    orderBy: {
      sortOrder: 'asc'
    }
  });
  return types.map(t => t.key);
};

// Cache for master data to avoid repeated DB calls
let masterDataCache = {
  requestTypes: null,
  priorities: null,
  lastFetch: null
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Get master data with caching
const getMasterData = async (group) => {
  const now = Date.now();
  const cacheKey = group === 'REQUEST_TYPE' ? 'requestTypes' : 'priorities';
  
  if (masterDataCache[cacheKey] && masterDataCache.lastFetch && (now - masterDataCache.lastFetch < CACHE_DURATION)) {
    return masterDataCache[cacheKey];
  }
  
  const data = await getValidValuesFromMaster(group);
  masterDataCache[cacheKey] = data;
  masterDataCache.lastFetch = now;
  
  return data;
};

// Dynamic validation function
const validateRequest = async (data, isUpdate = false) => {
  const requestTypes = await getMasterData('REQUEST_TYPE');
  const priorities = await getMasterData('PRIORITY');
  
  const schema = Joi.object({
    requestType: isUpdate ? Joi.string().valid(...requestTypes).optional() : Joi.string().valid(...requestTypes).required(),
    title: isUpdate ? Joi.string().optional() : Joi.string().required(),
    description: isUpdate ? Joi.string().optional() : Joi.string().required(),
    justification: isUpdate ? Joi.string().optional() : Joi.string().required(),
    priority: Joi.string().valid(...priorities).optional().default('MEDIUM'),
    assetId: isUpdate ? Joi.string().optional() : Joi.string().required(),
    requiredDate: Joi.date().optional(),
    estimatedCost: Joi.number().optional(),
    notes: Joi.string().optional(),
    companyId: Joi.string().optional()
  });
  
  return schema.validate(data);
};

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
          users_asset_requests_approvedByIdTousers: {
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
            categories: {
              select: { name: true }
            }
          }
        },
        users_asset_requests_approvedByIdTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        users_asset_requests_editedByTousers: {
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
    const { error, value } = await validateRequest(req.body, false);
    if (error) {
      // If missing/invalid requestType, return allowed values from master to help caller
      const detail = error.details && error.details[0];
      if (detail && detail.context && detail.context.key === 'requestType') {
        const allowed = await getMasterData('REQUEST_TYPE');
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          error: 'requestType is required or invalid',
          allowedValues: allowed
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: detail ? detail.message : 'Invalid payload'
      });
    }

    // Check if user has department
    if (!req.user.departmentId) {
      return res.status(400).json({
        success: false,
        message: 'User must be assigned to a department to make requests'
      });
    }

    // Check if asset exists
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

      // For MAINTENANCE/DECOMPOSITION, asset must exist but can be in any status
      // because we're requesting work on existing asset
    }

    // Generate request number
    const requestNumber = await generateRequestNumber(req.user.companyId);

    // Get request type configuration from GlobalTypeMaster
    const requestTypeConfig = await prisma.globalTypeMaster.findUnique({
      where: {
        group_key: {
          group: 'REQUEST_TYPE',
          key: value.requestType
        }
      }
    });

    // Set flags based on requestType metadata
    // Check if the type is configured for maintenance or decomposition routing
    const metadata = requestTypeConfig?.description || '';
    const needMaintenance = metadata.includes('ROUTE_TO_MAINTENANCE') || value.requestType === 'MAINTENANCE';
    const needDecomposition = metadata.includes('ROUTE_TO_DECOMPOSITION') || value.requestType === 'DECOMPOSITION';

    // Create request with appropriate flags
    const request = await prisma.assetRequest.create({
      data: {
        ...value,
        requestNumber,
        requesterId: req.user.id,
        departmentId: req.user.departmentId,
        companyId: req.user.companyId,
        status: 'PENDING',
        needMaintenance,
        needDecomposition
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
    const { error, value } = await validateRequest(req.body, true);
    
    if (error) {
      const detail = error.details && error.details[0];
      if (detail && detail.context && detail.context.key === 'requestType') {
        const allowed = await getMasterData('REQUEST_TYPE');
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          error: 'requestType is invalid',
          allowedValues: allowed
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: detail ? detail.message : 'Invalid payload'
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
            description: true,
            status: true,
            categories: { select: { id: true, name: true } },
            locations: { select: { id: true, name: true, building: true } }
          }
        },
        users_asset_requests_approvedByIdTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
    // Update request
    const updatedRequest = await prisma.assetRequest.update({
      where: { id },
      data: updateData,
      include: {
        requester: { select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        department: { select: {
            id: true,
            name: true,
            code: true
          }
        },
        asset: { select: {
            id: true,
            assetTag: true,
            name: true
          }
        },
        users_asset_requests_approvedByIdTousers: {
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

// Get maintenance requests (approved and need maintenance)
router.get('/maintenance', authenticate, authorize('ADMIN', 'ASSET_ADMIN', 'TECHNICIAN', 'MANAGER'), async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    const companyId = req.user.companyId;

    // Filter by needMaintenance flag, not hardcoded requestType
    const where = {
      companyId,
      needMaintenance: true,
      status: 'APPROVED' // Only show approved requests
    };

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
              description: true,
              status: true,
              categories: {
                select: { id: true, name: true }
              },
              locations: {
                select: { id: true, name: true, building: true }
              }
            }
          },
          users_asset_requests_approvedByIdTousers: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { approvedDate: 'desc' }
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

// Get decomposition requests (approved and need decomposition)
router.get('/decomposition', authenticate, authorize('ADMIN', 'ASSET_ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    const companyId = req.user.companyId;

    // Filter by needDecomposition flag, not hardcoded requestType
    const where = {
      companyId,
      needDecomposition: true,
      status: 'APPROVED' // Only show approved requests
    };

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
              description: true,
              status: true,
              categories: {
                select: { id: true, name: true }
              },
              locations: {
                select: { id: true, name: true, building: true }
              }
            }
          },
          users_asset_requests_approvedByIdTousers: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { approvedDate: 'desc' }
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

// Helper endpoint for frontend to fetch master values for requests
router.get('/types', authenticate, async (req, res, next) => {
  try {
    const requestTypes = await getMasterData('REQUEST_TYPE');
    const priorities = await getMasterData('PRIORITY');
    res.json({ success: true, data: { requestTypes, priorities } });
  } catch (error) {
    next(error);
  }
});
module.exports = router;







