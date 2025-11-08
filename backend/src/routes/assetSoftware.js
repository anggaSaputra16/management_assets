
const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const Joi = require('joi');

const router = express.Router();
const prisma = new PrismaClient();

// Create new software asset
router.post('/', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res) => {
  try {
    const schema = Joi.object({
      name: Joi.string().required(),
      version: Joi.string().optional().allow(''),
      publisher: Joi.string().optional().allow(''),
      description: Joi.string().optional().allow(''),
      softwareType: Joi.string().valid(
        'OPERATING_SYSTEM',
        'APPLICATION', 
        'UTILITY',
        'DRIVER',
        'SECURITY',
        'DEVELOPMENT_TOOL',
        'OFFICE_SUITE',
        'DATABASE',
        'MIDDLEWARE',
        'PLUGIN'
      ).required(),
      category: Joi.string().optional().allow(''),
      systemRequirements: Joi.object().optional(),
      installationPath: Joi.string().optional().allow(''),
      isActive: Joi.boolean().default(true),
      license_type: Joi.string().valid(
        'PERPETUAL',
        'SUBSCRIPTION',
        'OPEN_SOURCE',
        'TRIAL',
        'EDUCATIONAL',
        'ENTERPRISE',
        'OEM',
        'VOLUME',
        'SINGLE_USER',
        'MULTI_USER',
        'SITE_LICENSE'
      ).required(),
      licenseId: Joi.string().optional().allow(''),
      vendor_id: Joi.string().optional().allow(''),
      license_key: Joi.string().optional().allow(''),
      purchase_date: Joi.date().optional().allow(null),
      expiry_date: Joi.date().when('license_type', {
        is: 'SUBSCRIPTION',
        then: Joi.date().required(),
        otherwise: Joi.date().optional().allow(null)
      }),
      cost: Joi.number().optional().allow(null),
      max_installations: Joi.number().integer().optional().allow(null),
      current_installations: Joi.number().integer().optional().allow(null),
      status: Joi.string().valid('ACTIVE', 'INACTIVE', 'EXPIRED').optional()
      ,
      companyId: Joi.string().optional().allow('')
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }

    // Determine companyId: allow override for ADMIN/TOP_MANAGEMENT, otherwise use user's company
    let targetCompanyId = req.user.companyId;
    if (value.companyId && value.companyId !== req.user.companyId) {
      const allowedOverrideRoles = ['ADMIN', 'TOP_MANAGEMENT'];
      if (allowedOverrideRoles.includes(req.user.role)) {
        // verify target company exists
        const targetCompany = await prisma.company.findUnique({ where: { id: value.companyId } });
        if (!targetCompany || !targetCompany.isActive) {
          return res.status(400).json({ success: false, message: 'Target company not found or inactive.' });
        }
        targetCompanyId = value.companyId;
      } else {
        // ignore provided companyId for non-authorized users
        targetCompanyId = req.user.companyId;
      }
    }

    const softwareAsset = await prisma.softwareAsset.create({
      data: {
        ...value,
        companyId: targetCompanyId
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
// Update software asset
router.put('/:id', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const schema = Joi.object({
      name: Joi.string().required(),
      version: Joi.string().optional().allow(''),
      publisher: Joi.string().optional().allow(''),
      description: Joi.string().optional().allow(''),
      softwareType: Joi.string().valid(
        'OPERATING_SYSTEM',
        'APPLICATION', 
        'UTILITY',
        'DRIVER',
        'SECURITY',
        'DEVELOPMENT_TOOL',
        'OFFICE_SUITE',
        'DATABASE',
        'MIDDLEWARE',
        'PLUGIN'
      ).required(),
      category: Joi.string().optional().allow(''),
      systemRequirements: Joi.object().optional(),
      installationPath: Joi.string().optional().allow(''),
      isActive: Joi.boolean().default(true),
      license_type: Joi.string().valid(
        'PERPETUAL',
        'SUBSCRIPTION',
        'OPEN_SOURCE',
        'TRIAL',
        'EDUCATIONAL',
        'ENTERPRISE',
        'OEM',
        'VOLUME',
        'SINGLE_USER',
        'MULTI_USER',
        'SITE_LICENSE'
      ).required(),
      licenseId: Joi.string().optional().allow(''),
      vendor_id: Joi.string().optional().allow(''),
      license_key: Joi.string().optional().allow(''),
      purchase_date: Joi.date().optional().allow(null),
      expiry_date: Joi.date().when('license_type', {
        is: 'SUBSCRIPTION',
        then: Joi.date().required(),
        otherwise: Joi.date().optional().allow(null)
      }),
      cost: Joi.number().optional().allow(null),
      max_installations: Joi.number().integer().optional().allow(null),
      current_installations: Joi.number().integer().optional().allow(null),
      status: Joi.string().valid('ACTIVE', 'INACTIVE', 'EXPIRED').optional()
      ,
      companyId: Joi.string().optional().allow('')
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }

    // Check if software asset exists and belongs to user's company
    const existingSoftware = await prisma.softwareAsset.findFirst({
      where: {
        id,
        companyId: req.user.companyId
      }
    });

    if (!existingSoftware) {
      return res.status(404).json({
        success: false,
        message: 'Software asset not found'
      });
    }

    // Determine companyId for update: allow override for ADMIN/TOP_MANAGEMENT
    let updateCompanyId = req.user.companyId;
    if (value.companyId && value.companyId !== req.user.companyId) {
      const allowedOverrideRoles = ['ADMIN', 'TOP_MANAGEMENT'];
      if (allowedOverrideRoles.includes(req.user.role)) {
        const targetCompany = await prisma.company.findUnique({ where: { id: value.companyId } });
        if (!targetCompany || !targetCompany.isActive) {
          return res.status(400).json({ success: false, message: 'Target company not found or inactive.' });
        }
        updateCompanyId = value.companyId;
      }
    }

    // Update software asset
    const updatedSoftware = await prisma.softwareAsset.update({
      where: { id },
      data: {
        ...value,
        companyId: updateCompanyId
      }
    });

    res.json({
      success: true,
      message: 'Software asset updated successfully',
      data: updatedSoftware
    });
  } catch (error) {
    console.error('Update software asset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update software asset',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

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
        companyId: req.user.companyId,
        isActive: true
      },
      include: {
        licenses: {
          where: {
            isActive: true,
            status: 'ACTIVE'
          }
        },
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

    // Create installation record and update master counters in a transaction
    const installation = await prisma.$transaction(async (tx) => {
      const created = await tx.softwareInstallation.create({
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
            select: { id: true, name: true, version: true, current_installations: true }
          },
          license: {
            select: { id: true, licenseKey: true, licenseType: true, totalSeats: true, usedSeats: true }
          }
        }
      })

      // Increment softwareAsset current_installations (if column exists)
      try {
        await tx.softwareAsset.update({
          where: { id: value.softwareAssetId },
          data: {
            current_installations: (softwareAsset.current_installations || 0) + 1
          }
        })
      } catch (err) {
        // Non-fatal if column doesn't exist or update fails; continue
        console.warn('Failed to update softwareAsset.current_installations:', err.message)
      }

      // Update selected license usedSeats/availableSeats if we reserved one
      if (selectedLicense && selectedLicense.id) {
        try {
          const license = await tx.softwareLicense.findUnique({ where: { id: selectedLicense.id } })
          if (license) {
            const newUsed = (license.usedSeats || 0) + 1
            const totalSeats = license.totalSeats || 1
            await tx.softwareLicense.update({
              where: { id: selectedLicense.id },
              data: {
                usedSeats: newUsed,
                availableSeats: Math.max(0, totalSeats - newUsed)
              }
            })
          }
        } catch (err) {
          console.warn('Failed to update license counters:', err.message)
        }
      }

      // Recompute overall license availability and software installation counts.
      try {
        // Sum total seats from active licenses
        const activeLicenses = await tx.softwareLicense.findMany({ where: { softwareAssetId: value.softwareAssetId, isActive: true, status: 'ACTIVE' } })
        const totalSeats = activeLicenses.reduce((s, l) => s + (l.totalSeats || 0), 0)

        // Count active installations on assets for this software
        const installationCount = await tx.softwareInstallation.count({ where: { softwareAssetId: value.softwareAssetId, status: 'INSTALLED', assetId: { not: null } } })

        // Also check configured maximum installations on the software asset
        const sa = await tx.softwareAsset.findUnique({ where: { id: value.softwareAssetId } })
        const maxInst = sa?.max_installations || null

        // If no available seats remain OR we've reached max_installations, mark software as not active/available
        const seatsRemaining = totalSeats - installationCount
        const shouldDisable = (sa && sa.license_type === 'SUBSCRIPTION' && seatsRemaining <= 0) || (maxInst !== null && installationCount >= maxInst)

        if (shouldDisable) {
          try {
            await tx.softwareAsset.update({ where: { id: value.softwareAssetId }, data: { isActive: false, status: 'INACTIVE' } })
            console.info(`SoftwareAsset ${value.softwareAssetId} disabled due to no available licenses or max installations reached`)
          } catch (err) {
            console.warn('Failed to disable software asset after installation:', err.message)
          }
        }
      } catch (err) {
        console.warn('Failed to recompute license/install counts for software asset:', err.message)
      }

      return created
    })

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
            assignedEmployee: {
              select: { id: true, firstName: true, lastName: true, email: true }
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