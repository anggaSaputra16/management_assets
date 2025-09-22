const express = require('express');
const Joi = require('joi');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get KPI metrics
router.get('/kpi', authenticate, async (req, res, next) => {
  try {
    const [
      totalAssets,
      totalRequests,
      totalMaintenance,
      totalValue
    ] = await Promise.all([
      prisma.asset.count(),
      prisma.request.count(),
      prisma.maintenance.count(),
      prisma.asset.aggregate({
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
    const [
      assetsStatus,
      requestsStatus,
      maintenanceStatus,
      assetsByDepartment
    ] = await Promise.all([
      prisma.asset.groupBy({
        by: ['status'],
        _count: {
          id: true
        }
      }),
      prisma.request.groupBy({
        by: ['status'],
        _count: {
          id: true
        }
      }),
      prisma.maintenance.groupBy({
        by: ['status'],
        _count: {
          id: true
        }
      }),
      prisma.asset.groupBy({
        by: ['departmentId'],
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

    const whereClause = {};
    
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
    const assets = await prisma.asset.findMany({
      where: {
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
    const { startDate, endDate, status, type } = req.body;

    const whereClause = {};
    
    if (startDate && endDate) {
      whereClause.requestDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    if (status) {
      whereClause.status = status;
    }

    if (type) {
      whereClause.type = type;
    }

    const requests = await prisma.request.findMany({
      where: whereClause,
      include: {
        requester: {
          select: {
            name: true,
            email: true
          }
        },
        assignee: {
          select: {
            name: true
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
        requestDate: 'desc'
      }
    });

    const reportData = requests.map(request => ({
      title: request.title,
      type: request.type,
      status: request.status,
      priority: request.priority,
      requester: request.requester?.name,
      assignee: request.assignee?.name,
      asset: request.asset ? `${request.asset.name} (${request.asset.assetTag})` : null,
      requestDate: request.requestDate,
      dueDate: request.dueDate,
      estimatedCost: request.estimatedCost
    }));

    res.json({
      success: true,
      data: {
        title: 'Requests Report',
        generatedAt: new Date().toISOString(),
        filters: { startDate, endDate, status, type },
        data: reportData,
        summary: {
          totalRequests: requests.length,
          totalEstimatedCost: requests.reduce((sum, req) => sum + (req.estimatedCost || 0), 0)
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
    const { startDate, endDate, status, type } = req.body;

    const whereClause = {};
    
    if (startDate && endDate) {
      whereClause.scheduledDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    if (status) {
      whereClause.status = status;
    }

    if (type) {
      whereClause.type = type;
    }

    const maintenance = await prisma.maintenance.findMany({
      where: whereClause,
      include: {
        asset: {
          select: {
            name: true,
            assetTag: true
          }
        },
        assignedTo: {
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
      title: maint.title,
      type: maint.type,
      status: maint.status,
      priority: maint.priority,
      asset: `${maint.asset.name} (${maint.asset.assetTag})`,
      assignedTo: maint.assignedTo?.name,
      scheduledDate: maint.scheduledDate,
      completedDate: maint.completedDate,
      estimatedCost: maint.estimatedCost,
      actualCost: maint.actualCost
    }));

    res.json({
      success: true,
      data: {
        title: 'Maintenance Report',
        generatedAt: new Date().toISOString(),
        filters: { startDate, endDate, status, type },
        data: reportData,
        summary: {
          totalMaintenance: maintenance.length,
          totalEstimatedCost: maintenance.reduce((sum, maint) => sum + (maint.estimatedCost || 0), 0),
          totalActualCost: maintenance.reduce((sum, maint) => sum + (maint.actualCost || 0), 0)
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
    const [
      assetValue,
      maintenanceCost,
      requestCost,
      assetsByCategory
    ] = await Promise.all([
      prisma.asset.aggregate({
        _sum: {
          purchasePrice: true
        }
      }),
      prisma.maintenance.aggregate({
        _sum: {
          actualCost: true,
          estimatedCost: true
        }
      }),
      prisma.request.aggregate({
        _sum: {
          estimatedCost: true
        }
      }),
      prisma.asset.groupBy({
        by: ['categoryId'],
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
          totalMaintenanceCost: maintenanceCost._sum.actualCost || 0,
          estimatedMaintenanceCost: maintenanceCost._sum.estimatedCost || 0,
          totalRequestCost: requestCost._sum.estimatedCost || 0,
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