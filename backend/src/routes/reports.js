const express = require('express');
const Joi = require('joi');
const { prisma } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get KPI metrics
router.get('/kpi', authenticate, async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    
    const [
      totalAssets,
      totalRequests,
      totalMaintenance,
      totalValue
    ] = await Promise.all([
      prisma.asset.count({
        where: { companyId }
      }),
      prisma.assetRequest.count({
        where: { companyId }
      }),
      prisma.maintenanceRecord.count({
        where: { 
          asset: { companyId }
        }
      }),
      prisma.asset.aggregate({
        where: { companyId },
        _sum: {
          purchasePrice: true
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalAssets,
        totalRequests,
        totalMaintenance,
        totalValue: totalValue._sum.purchasePrice || 0
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get executive summary
router.get('/executive-summary', authenticate, async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    
    const [
      assetsStatus,
      requestsStatus,
      maintenanceStatus,
      assetsByDepartment
    ] = await Promise.all([
      prisma.asset.groupBy({
        by: ['status'],
        where: { companyId },
        _count: {
          id: true
        }
      }),
      prisma.assetRequest.groupBy({
        by: ['status'],
        where: { companyId },
        _count: {
          id: true
        }
      }),
      prisma.maintenanceRecord.groupBy({
        by: ['status'],
        where: {
          asset: { companyId }
        },
        _count: {
          id: true
        }
      }),
      prisma.asset.groupBy({
        by: ['departmentId'],
        where: { companyId },
        _count: {
          id: true
        },
        _sum: {
          purchasePrice: true
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        assetsStatus,
        requestsStatus,
        maintenanceStatus,
        assetsByDepartment
      }
    });
  } catch (error) {
    next(error);
  }
});

// Generate asset report
router.post('/generate/assets', authenticate, async (req, res, next) => {
  try {
    const { startDate, endDate, departmentId, categoryId } = req.body;
    const companyId = req.user.companyId;

    const whereClause = { companyId };
    
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    if (departmentId) {
      whereClause.departmentId = departmentId;
    }

    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    const assets = await prisma.asset.findMany({
      where: whereClause,
      include: {
        category: {
          select: {
            name: true
          }
        },
        department: {
          select: {
            name: true
          }
        },
        location: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const reportData = assets.map(asset => ({
      name: asset.name,
      assetTag: asset.assetTag,
      category: asset.category?.name,
      department: asset.department?.name,
      location: asset.location?.name,
      status: asset.status,
      value: asset.purchasePrice,
      acquisitionDate: asset.acquisitionDate,
      warranty: asset.warrantyExpiry
    }));

    res.json({
      success: true,
      data: {
        title: 'Asset Report',
        generatedAt: new Date().toISOString(),
        filters: { startDate, endDate, departmentId, categoryId },
        data: reportData,
        summary: {
          totalAssets: assets.length,
          totalValue: assets.reduce((sum, asset) => sum + (asset.purchasePrice || 0), 0)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Generate depreciation report
router.post('/generate/depreciation', authenticate, async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    
    const assets = await prisma.asset.findMany({
      where: {
        companyId,
        purchasePrice: {
          not: null
        }
      },
      include: {
        category: {
          select: {
            name: true
          }
        },
        department: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const reportData = assets.map(asset => {
      const currentDate = new Date();
      const acquisitionDate = new Date(asset.acquisitionDate || asset.createdAt);
      const ageInYears = (currentDate - acquisitionDate) / (1000 * 60 * 60 * 24 * 365);
      
      // Simple straight-line depreciation over 5 years (20% per year)
      const depreciationRate = 0.20;
      const maxDepreciation = 0.80; // Maximum 80% depreciation
      const depreciation = Math.min(ageInYears * depreciationRate, maxDepreciation);
      const currentValue = asset.purchasePrice * (1 - depreciation);

      return {
        name: asset.name,
        assetTag: asset.assetTag,
        category: asset.category?.name,
        department: asset.department?.name,
        originalValue: asset.purchasePrice,
        currentValue: currentValue,
        depreciation: asset.purchasePrice * depreciation,
        depreciationRate: (depreciation * 100).toFixed(2) + '%',
        age: ageInYears.toFixed(1) + ' years'
      };
    });

    res.json({
      success: true,
      data: {
        title: 'Depreciation Report',
        generatedAt: new Date().toISOString(),
        data: reportData,
        summary: {
          totalAssets: assets.length,
          totalOriginalValue: assets.reduce((sum, asset) => sum + (asset.purchasePrice || 0), 0),
          totalCurrentValue: reportData.reduce((sum, item) => sum + item.currentValue, 0),
          totalDepreciation: reportData.reduce((sum, item) => sum + item.depreciation, 0)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Generate requests report
router.post('/generate/requests', authenticate, async (req, res, next) => {
  try {
    const { startDate, endDate, status, requestType } = req.body;
    const companyId = req.user.companyId;

    const whereClause = { companyId };
    
    if (startDate && endDate) {
      whereClause.requestedDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    if (status) {
      whereClause.status = status;
    }

    if (requestType) {
      whereClause.requestType = requestType;
    }

    const requests = await prisma.assetRequest.findMany({
      where: whereClause,
      include: {
        requester: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        approvedBy: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        asset: {
          select: {
            name: true,
            assetTag: true
          }
        }
      },
      orderBy: {
        requestedDate: 'desc'
      }
    });

    const reportData = requests.map(request => ({
      requestNumber: request.requestNumber,
      requestType: request.requestType,
      status: request.status,
      priority: request.priority,
      requester: `${request.requester?.firstName || ''} ${request.requester?.lastName || ''}`.trim(),
      approver: request.approvedBy ? `${request.approvedBy.firstName || ''} ${request.approvedBy.lastName || ''}`.trim() : null,
      asset: request.asset ? `${request.asset.name} (${request.asset.assetTag})` : null,
      requestedDate: request.requestedDate,
      approvedDate: request.approvedDate,
      description: request.description
    }));

    res.json({
      success: true,
      data: {
        title: 'Requests Report',
        generatedAt: new Date().toISOString(),
        filters: { startDate, endDate, status, requestType },
        data: reportData,
        summary: {
          totalRequests: requests.length,
          pendingRequests: requests.filter(r => r.status === 'PENDING').length,
          approvedRequests: requests.filter(r => r.status === 'APPROVED').length,
          rejectedRequests: requests.filter(r => r.status === 'REJECTED').length
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Generate maintenance report
router.post('/generate/maintenance', authenticate, async (req, res, next) => {
  try {
    const { startDate, endDate, status, maintenanceType } = req.body;
    const companyId = req.user.companyId;

    const whereClause = {
      asset: { companyId }
    };
    
    if (startDate && endDate) {
      whereClause.scheduledDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    if (status) {
      whereClause.status = status;
    }

    if (maintenanceType) {
      whereClause.maintenanceType = maintenanceType;
    }

    const maintenance = await prisma.maintenanceRecord.findMany({
      where: whereClause,
      include: {
        asset: {
          select: {
            name: true,
            assetTag: true
          }
        },
        technician: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        vendor: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        scheduledDate: 'desc'
      }
    });

    const reportData = maintenance.map(maint => ({
      description: maint.description,
      maintenanceType: maint.maintenanceType,
      status: maint.status,
      asset: `${maint.asset.name} (${maint.asset.assetTag})`,
      technician: maint.technician ? `${maint.technician.firstName || ''} ${maint.technician.lastName || ''}`.trim() : null,
      vendor: maint.vendor?.name || null,
      scheduledDate: maint.scheduledDate,
      completedDate: maint.completedDate,
      cost: maint.cost
    }));

    res.json({
      success: true,
      data: {
        title: 'Maintenance Report',
        generatedAt: new Date().toISOString(),
        filters: { startDate, endDate, status, maintenanceType },
        data: reportData,
        summary: {
          totalMaintenance: maintenance.length,
          scheduledCount: maintenance.filter(m => m.status === 'SCHEDULED').length,
          inProgressCount: maintenance.filter(m => m.status === 'IN_PROGRESS').length,
          completedCount: maintenance.filter(m => m.status === 'COMPLETED').length,
          totalCost: maintenance.reduce((sum, maint) => sum + (maint.cost || 0), 0)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Generate financial summary
router.post('/generate/financial', authenticate, async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    
    const [
      assetValue,
      maintenanceCost,
      assetsByCategory
    ] = await Promise.all([
      prisma.asset.aggregate({
        where: { companyId },
        _sum: {
          purchasePrice: true
        }
      }),
      prisma.maintenanceRecord.aggregate({
        where: {
          asset: { companyId }
        },
        _sum: {
          cost: true
        }
      }),
      prisma.asset.groupBy({
        by: ['categoryId'],
        where: { companyId },
        _sum: {
          purchasePrice: true
        },
        _count: {
          id: true
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        title: 'Financial Summary',
        generatedAt: new Date().toISOString(),
        data: {
          totalAssetValue: assetValue._sum.purchasePrice || 0,
          totalMaintenanceCost: maintenanceCost._sum.cost || 0,
          assetsByCategory
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Export report
router.post('/export/:type', authenticate, async (req, res, next) => {
  try {
    const { type } = req.params;
    const { format = 'csv' } = req.body;

    // This is a placeholder - in real implementation, you would generate actual files
    res.json({
      success: true,
      message: `${type} report export in ${format} format initiated`,
      downloadUrl: `/api/reports/download/${type}-${Date.now()}.${format}`
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;