
// Create new software asset
router.post('/', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res) => {
  try {
    const schema = Joi.object({
      name: Joi.string().required(),
      version: Joi.string().optional().allow(''),
      publisher: Joi.string().optional().allow(''),
      description: Joi.string().optional().allow(''),
      softwareType: Joi.string().required(),
      category: Joi.string().optional().allow(''),
      systemRequirements: Joi.any().optional(),
      installationPath: Joi.string().optional().allow(''),
      isActive: Joi.boolean().optional(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }

    // Create software asset with companyId from user
    const softwareAsset = await prisma.softwareAsset.create({
      data: {
        ...value,
        companyId: req.user.companyId
      }
    });

    res.status(201).json({
      success: true,
      message: 'Software asset created',
      data: softwareAsset
    });
  } catch (error) {
    console.error('Create software asset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create software asset',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const Joi = require('joi');

const router = express.Router();
const prisma = new PrismaClient();

// Install software on asset
router.post('/install', authenticate, authorize('ADMIN', 'ASSET_ADMIN', 'TECHNICIAN'), async (req, res) => {
  try {
    const schema = Joi.object({
      assetId: Joi.string().required(),
      softwareAssetId: Joi.string().required(),
      licenseId: Joi.string().optional().allow(''),
      version: Joi.string().optional().allow(''),
      installationPath: Joi.string().optional().allow(''),
      notes: Joi.string().optional().allow('')
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }

    // Check if asset exists and belongs to user's company
    const asset = await prisma.asset.findFirst({
      where: {
        id: value.assetId,
        companyId: req.user.companyId
      }
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    // Check if software asset exists and belongs to user's company
    const softwareAsset = await prisma.softwareAsset.findFirst({
      where: {
        id: value.softwareAssetId,
        companyId: req.user.companyId
      },
      include: {
        licenses: true,
        installations: {
          where: { 
            status: 'INSTALLED',
            assetId: { not: null } // Only count asset installations
          }
        }
      }
    });

    if (!softwareAsset) {
      return res.status(404).json({
        success: false,
        message: 'Software asset not found'
      });
    }

    // Calculate available licenses
    const totalLicenses = softwareAsset.licenses.reduce((sum, license) => sum + (license.totalSeats || 0), 0);
    const activeInstallations = softwareAsset.installations.length;

    if (activeInstallations >= totalLicenses) {
      return res.status(400).json({
        success: false,
        message: `No available licenses. ${activeInstallations}/${totalLicenses} licenses in use.`
      });
    }

    // Check if already installed on this asset
    const existingInstallation = await prisma.softwareInstallation.findFirst({
      where: {
        assetId: value.assetId,
        softwareAssetId: value.softwareAssetId,
        status: 'INSTALLED'
      }
    });

    if (existingInstallation) {
      return res.status(400).json({
        success: false,
        message: 'Software already installed on this asset'
      });
    }

    // Find best license to use (prefer one with available seats)
    let selectedLicense = null;
    if (!value.licenseId) {
      selectedLicense = softwareAsset.licenses.find(license => {
        const licenseInstallations = softwareAsset.installations.filter(inst => inst.licenseId === license.id).length;
        return licenseInstallations < (license.totalSeats || 1);
      });
    } else {
      selectedLicense = softwareAsset.licenses.find(license => license.id === value.licenseId);
    }

    // Create installation record
    const installation = await prisma.softwareInstallation.create({
      data: {
        assetId: value.assetId,
        softwareAssetId: value.softwareAssetId,
        licenseId: selectedLicense?.id || null,
        userId: req.user.id,
        companyId: req.user.companyId,
        version: value.version || softwareAsset.version,
        installationPath: value.installationPath || null,
        notes: value.notes || null,
        status: 'INSTALLED'
      },
      include: {
        asset: {
          select: { id: true, name: true, assetTag: true }
        },
        softwareAsset: {
          select: { id: true, name: true, version: true }
        },
        license: {
          select: { id: true, licenseKey: true, licenseType: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Software installed successfully',
      data: installation
    });

  } catch (error) {
    console.error('Install software error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to install software',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Uninstall software from asset
router.post('/uninstall', authenticate, authorize('ADMIN', 'ASSET_ADMIN', 'TECHNICIAN'), async (req, res) => {
  try {
    const schema = Joi.object({
      installationId: Joi.string().required(),
      notes: Joi.string().optional().allow('')
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }

    // Check if installation exists and belongs to user's company
    const installation = await prisma.softwareInstallation.findFirst({
      where: {
        id: value.installationId,
        companyId: req.user.companyId,
        status: 'INSTALLED'
      }
    });

    if (!installation) {
      return res.status(404).json({
        success: false,
        message: 'Installation not found'
      });
    }

    // Update installation status
    const updatedInstallation = await prisma.softwareInstallation.update({
      where: { id: value.installationId },
      data: {
        status: 'UNINSTALLED',
        uninstallationDate: new Date(),
        notes: value.notes || installation.notes
      },
      include: {
        asset: {
          select: { id: true, name: true, assetTag: true }
        },
        softwareAsset: {
          select: { id: true, name: true, version: true }
        }
      }
    });

    res.json({
      success: true,
      message: 'Software uninstalled successfully',
      data: updatedInstallation
    });

  } catch (error) {
    console.error('Uninstall software error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to uninstall software',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get asset's installed software
router.get('/asset/:assetId', authenticate, async (req, res) => {
  try {
    const { assetId } = req.params;

    // Verify asset belongs to user's company
    const asset = await prisma.asset.findFirst({
      where: {
        id: assetId,
        companyId: req.user.companyId
      }
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    const installations = await prisma.softwareInstallation.findMany({
      where: {
        assetId,
        status: 'INSTALLED'
      },
      include: {
        softwareAsset: {
          select: {
            id: true,
            name: true,
            version: true,
            publisher: true,
            softwareType: true
          }
        },
        license: {
          select: {
            id: true,
            licenseType: true,
            expiryDate: true,
            status: true
          }
        }
      },
      orderBy: {
        installationDate: 'desc'
      }
    });

    res.json({
      success: true,
      data: installations
    });

  } catch (error) {
    console.error('Get asset software error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch asset software',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get software's installations across assets
router.get('/software/:softwareId', authenticate, async (req, res) => {
  try {
    const { softwareId } = req.params;

    // Verify software asset belongs to user's company
    const softwareAsset = await prisma.softwareAsset.findFirst({
      where: {
        id: softwareId,
        companyId: req.user.companyId
      }
    });

    if (!softwareAsset) {
      return res.status(404).json({
        success: false,
        message: 'Software asset not found'
      });
    }

    const installations = await prisma.softwareInstallation.findMany({
      where: {
        softwareAssetId: softwareId,
        status: 'INSTALLED',
        assetId: { not: null } // Only installations on physical assets
      },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            assetTag: true,
            serialNumber: true,
            location: {
              select: { id: true, name: true }
            },
            department: {
              select: { id: true, name: true }
            },
            assignedTo: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        license: {
          select: {
            id: true,
            licenseType: true,
            expiryDate: true
          }
        }
      },
      orderBy: {
        installationDate: 'desc'
      }
    });

    res.json({
      success: true,
      data: installations
    });

  } catch (error) {
    console.error('Get software installations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch software installations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get available software for asset (software with available licenses)
router.get('/available/:assetId', authenticate, async (req, res) => {
  try {
    const { assetId } = req.params;

    // Verify asset belongs to user's company
    const asset = await prisma.asset.findFirst({
      where: {
        id: assetId,
        companyId: req.user.companyId
      }
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    // Get all software that's not already installed on this asset
    const availableSoftware = await prisma.softwareAsset.findMany({
      where: {
        companyId: req.user.companyId,
        isActive: true,
        NOT: {
          installations: {
            some: {
              assetId,
              status: 'INSTALLED'
            }
          }
        }
      },
      include: {
        licenses: {
          where: { isActive: true }
        },
        installations: {
          where: { 
            status: 'INSTALLED',
            assetId: { not: null }
          }
        }
      }
    });

    // Filter software that has available licenses
    const filteredSoftware = availableSoftware
      .map(software => {
        const totalLicenses = software.licenses.reduce((sum, license) => sum + (license.totalSeats || 0), 0);
        const activeInstallations = software.installations.length;
        const availableLicenses = totalLicenses - activeInstallations;

        return {
          ...software,
          totalLicenses,
          activeInstallations,
          availableLicenses
        };
      })
      .filter(software => software.availableLicenses > 0);

    res.json({
      success: true,
      data: filteredSoftware
    });

  } catch (error) {
    console.error('Get available software error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available software',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get installation statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const stats = await Promise.all([
      // Total installations
      prisma.softwareInstallation.count({
        where: {
          companyId: req.user.companyId,
          status: 'INSTALLED'
        }
      }),

      // Installations by software type
      prisma.softwareInstallation.groupBy({
        by: ['softwareAssetId'],
        where: {
          companyId: req.user.companyId,
          status: 'INSTALLED'
        },
        _count: true
      }),

      // License utilization
      prisma.softwareLicense.findMany({
        where: {
          companyId: req.user.companyId,
          isActive: true
        },
        include: {
          _count: {
            select: {
              installations: {
                where: { status: 'INSTALLED' }
              }
            }
          }
        }
      })
    ]);

    const [totalInstallations, installationsBysoftware, licenses] = stats;

    const licenseUtilization = licenses.map(license => ({
      licenseId: license.id,
      softwareAssetId: license.softwareAssetId,
      totalSeats: license.totalSeats || 0,
      usedSeats: license._count.installations,
      utilizationPercentage: license.totalSeats ? Math.round((license._count.installations / license.totalSeats) * 100) : 0
    }));

    res.json({
      success: true,
      data: {
        totalInstallations,
        installationsBySoftware: installationsBySoftware.length,
        licenseUtilization,
        averageUtilization: licenseUtilization.length > 0
          ? Math.round(licenseUtilization.reduce((sum, item) => sum + item.utilizationPercentage, 0) / licenseUtilization.length)
          : 0
      }
    });

  } catch (error) {
    console.error('Get installation stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch installation statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;