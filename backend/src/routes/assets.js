const express = require('express');
const Joi = require('joi');
const { prisma } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer for asset file uploads (images and documents)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
  // Resolve uploads directory relative to this file to reliably place
  // uploads under <project-root>/uploads/assets regardless of the
  // container working directory.
  const uploadDir = path.resolve(__dirname, '..', '..', 'uploads', 'assets');
  console.log('Preparing upload directory for assets:', uploadDir, '__dirname:', __dirname);
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    } catch (err) {
      console.error('Failed to prepare upload directory:', uploadDir, err);
      // Fallback to OS temp directory so uploads can still be processed in
      // constrained environments.
      try {
        const os = require('os');
        const tmpDir = path.resolve(os.tmpdir(), 'management-assets-uploads');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
        console.warn('Falling back to tmp upload directory:', tmpDir);
        cb(null, tmpDir);
      } catch (err2) {
        console.error('Fallback upload directory creation failed:', err2);
        cb(err);
      }
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'asset-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images and documents
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed! Only images and documents are permitted.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Multiple file upload for asset attachments
const uploadMultiple = upload.array('attachments', 5); // Max 5 files

// Validation schemas - simplified to only require mandatory fields
const createAssetSchema = Joi.object({
  // Mandatory fields
  name: Joi.string().required(),
  categoryId: Joi.string().required(),
  locationId: Joi.string().required(),
  companyId: Joi.string().optional(),
  
  // Optional fields
  description: Joi.string().optional().allow('', null),
  serialNumber: Joi.string().optional().allow('', null),
  model: Joi.string().optional().allow('', null),
  brand: Joi.string().optional().allow('', null),
  poNumber: Joi.string().optional().allow('', null),
  purchaseDate: Joi.alternatives().try(
    Joi.date(),
    Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
    Joi.string().allow('', null)
  ).optional(),
  purchasePrice: Joi.alternatives().try(
    Joi.number().positive(),
    Joi.string().pattern(/^\d*\.?\d*$/),
    Joi.allow(null, '')
  ).optional(),
  currentValue: Joi.alternatives().try(
    Joi.number().positive(),
    Joi.string().pattern(/^\d*\.?\d*$/),
    Joi.allow(null, '')
  ).optional(),
  warrantyExpiry: Joi.alternatives().try(
    Joi.date(),
    Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
    Joi.string().allow('', null)
  ).optional(),
  condition: Joi.string().valid('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DAMAGED').optional(),
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED', 'DISPOSED').optional(),
  notes: Joi.string().optional().allow('', null),
  vendorId: Joi.string().optional().allow(null, ''),
  departmentId: Joi.string().optional().allow(null, ''),
  assignedToId: Joi.string().optional().allow(null, ''),
  specifications: Joi.object().optional(),
  imageUrl: Joi.string().optional().allow('', null),
  
  // New fields for enhanced asset management
  requiredSoftware: Joi.alternatives().try(
    Joi.array().items(Joi.string()),
    Joi.string()
  ).optional(),
  requiredSoftwareIds: Joi.alternatives().try(
    Joi.array().items(Joi.string()),
    Joi.string()
  ).optional(),
  attachmentDescriptions: Joi.array().items(Joi.string()).optional()
}).unknown(true); // Allow unknown fields to be more flexible

const updateAssetSchema = Joi.object({
  assetTag: Joi.string().optional(),
  name: Joi.string().optional(),
  description: Joi.string().optional().allow('', null),
  serialNumber: Joi.string().optional().allow('', null),
  model: Joi.string().optional().allow('', null),
  brand: Joi.string().optional().allow('', null),
  poNumber: Joi.string().optional().allow('', null),
  purchaseDate: Joi.alternatives().try(
    Joi.date(),
    Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
    Joi.string().allow('', null)
  ).optional(),
  purchasePrice: Joi.alternatives().try(
    Joi.number().positive(),
    Joi.string().pattern(/^\d*\.?\d*$/),
    Joi.allow(null, '')
  ).optional(),
  currentValue: Joi.alternatives().try(
    Joi.number().positive(),
    Joi.string().pattern(/^\d*\.?\d*$/),
    Joi.allow(null, '')
  ).optional(),
  warrantyExpiry: Joi.alternatives().try(
    Joi.date(),
    Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
    Joi.string().allow('', null)
  ).optional(),
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED', 'DISPOSED').optional(),
  condition: Joi.string().valid('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DAMAGED').optional(),
  notes: Joi.string().optional().allow('', null),
  categoryId: Joi.string().optional(),
  vendorId: Joi.string().optional().allow(null, ''),
  locationId: Joi.string().optional(),
  departmentId: Joi.string().optional().allow(null, ''),
  assignedToId: Joi.string().optional().allow(null, ''),
  isActive: Joi.boolean().optional(),
  specifications: Joi.object().optional(),
  imageUrl: Joi.string().optional().allow('', null),
  companyId: Joi.string().optional() // Allow companyId from frontend
}).unknown(true); // Allow unknown fields to be more flexible

// Get all assets
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      status, 
      category, 
      department, 
      location,
      assignedTo 
    } = req.query;
    
    const skip = (page - 1) * limit;
    const companyId = req.user.companyId;
    const where = { companyId };

    // Role-based filtering
    if (req.user.role === 'DEPARTMENT_USER') {
      where.departmentId = req.user.departmentId;
    }

    if (search) {
      where.OR = [
        { assetTag: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status) where.status = status;
    if (category) where.categoryId = category;
    if (department) where.departmentId = department;
    if (location) where.locationId = location;
    if (assignedTo) where.assignedToId = assignedTo;

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, code: true }
          },
          vendor: {
            select: { id: true, name: true, code: true }
          },
          location: {
            select: { id: true, name: true, building: true, room: true }
          },
          department: {
            select: { id: true, name: true, code: true }
          },
          assignedTo: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.asset.count({ where })
    ]);

    res.json({
      success: true,
      data: assets
    });
  } catch (error) {
    next(error);
  }
});

// Get asset by ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true, code: true }
        },
        vendor: {
          select: { id: true, name: true, code: true, contactPerson: true, phone: true }
        },
        location: {
          select: { id: true, name: true, building: true, floor: true, room: true }
        },
        department: {
          select: { id: true, name: true, code: true }
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true }
        },
        maintenanceRecords: {
          select: {
            id: true,
            maintenanceType: true,
            description: true,
            scheduledDate: true,
            completedDate: true,
            status: true,
            actualCost: true,
            estimatedCost: true
          },
          orderBy: { scheduledDate: 'desc' },
          take: 5
        },
        auditRecords: {
          select: {
            id: true,
            auditType: true,
            scheduledDate: true,
            completedDate: true,
            status: true,
            findings: true
          },
          orderBy: { scheduledDate: 'desc' },
          take: 5
        }
      }
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    // Check permissions
    if (req.user.role === 'DEPARTMENT_USER' && asset.departmentId !== req.user.departmentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this asset'
      });
    }

    res.json({
      success: true,
      data: asset
    });
  } catch (error) {
    next(error);
  }
});

// Create new asset (Admin/Asset Admin only)
// Create asset with file uploads and required software
router.post('/', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), uploadMultiple, async (req, res, next) => {
  try {
    // Parse JSON fields from FormData if they exist
    const parsedBody = { ...req.body };
    
    // Log for debugging
    console.log('Received body:', parsedBody);
    console.log('Files:', req.files);
    console.log('Body keys:', Object.keys(parsedBody));
    console.log('Form data entries:', Object.entries(parsedBody));
    
    // Handle JSON fields that might be stringified in FormData
    ['specifications', 'requiredSoftware'].forEach(field => {
      if (parsedBody[field] && typeof parsedBody[field] === 'string') {
        try {
          parsedBody[field] = JSON.parse(parsedBody[field]);
        } catch (e) {
          console.log(`Failed to parse ${field}:`, parsedBody[field]);
        }
      }
    });
    
    // Check if we're receiving form data properly
    if (Object.keys(parsedBody).length <= 1) {
      console.error('ERROR: Form data not processed correctly. Only received:', parsedBody);
      return res.status(400).json({
        success: false,
        message: 'Form data not received properly. Please check form submission.',
        debug: {
          received: parsedBody,
          keys: Object.keys(parsedBody)
        }
      });
    }
    
    // Ensure required fields are present
    if (!parsedBody.name || parsedBody.name.trim() === '') {
      console.error('ERROR: Asset name is missing from form data');
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: 'Asset name is required',
        debug: {
          received: parsedBody,
          hasName: !!parsedBody.name,
          nameValue: parsedBody.name
        }
      });
    }
    
    const { error, value } = createAssetSchema.validate(parsedBody);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: [error.details[0].message]
      });
    }

    // Parse array fields if they're strings (from FormData)
    let requiredSoftwareIds = [];
    let attachmentDescriptions = [];
    
    // Handle both requiredSoftware and requiredSoftwareIds
    const softwareField = value.requiredSoftware || value.requiredSoftwareIds;
    if (softwareField) {
      requiredSoftwareIds = Array.isArray(softwareField) 
        ? softwareField 
        : JSON.parse(softwareField || '[]');
    }
    
    if (value.attachmentDescriptions) {
      attachmentDescriptions = Array.isArray(value.attachmentDescriptions)
        ? value.attachmentDescriptions
        : JSON.parse(value.attachmentDescriptions || '[]');
    }

    // Validate foreign keys
    const [category, vendor, location, department, assignedUser] = await Promise.all([
      prisma.category.findUnique({ where: { id: value.categoryId } }),
      value.vendorId ? prisma.vendor.findUnique({ where: { id: value.vendorId } }) : null,
      value.locationId ? prisma.location.findUnique({ where: { id: value.locationId } }) : null,
      value.departmentId ? prisma.department.findUnique({ where: { id: value.departmentId } }) : null,
      value.assignedToId ? prisma.user.findUnique({ where: { id: value.assignedToId } }) : null
    ]);

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    if (value.vendorId && !vendor) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vendor'
      });
    }

    if (value.locationId && !location) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location'
      });
    }

    if (value.departmentId && !department) {
      return res.status(400).json({
        success: false,
        message: 'Invalid department'
      });
    }

    if (value.assignedToId && !assignedUser) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assigned user'
      });
    }

    // Validate required software IDs exist (using inventory items for now)
    if (requiredSoftwareIds.length > 0) {
      const inventoryItems = await prisma.inventoryItem.findMany({
        where: {
          id: { in: requiredSoftwareIds },
          departmentId: value.departmentId // Check same department or null for global items
        }
      });
      
      // For now, just log if some software items weren't found rather than failing
      if (inventoryItems.length !== requiredSoftwareIds.length) {
        console.log(`Warning: Only ${inventoryItems.length} of ${requiredSoftwareIds.length} software items found`);
      }
    }

    // Generate unique asset tag
    const generateAssetTag = async (companyId) => {
      const count = await prisma.asset.count({
        where: { companyId }
      });
      let assetTag;
      let attempts = 0;
      
      do {
        const tagNumber = String(count + 1 + attempts).padStart(6, '0');
        assetTag = `AST-${tagNumber}`;
        
        const existingAsset = await prisma.asset.findFirst({
          where: { 
            assetTag: assetTag,
            companyId: companyId
          }
        });
        
        if (!existingAsset) {
          return assetTag;
        }
        
        attempts++;
      } while (attempts < 100); // Prevent infinite loop
      
      throw new Error('Unable to generate unique asset tag');
    };

    const companyId = req.user.companyId;
    const assetTag = await generateAssetTag(companyId);

    // Capture depreciation-related fields (they belong to AssetDepreciation model)
    const depreciationPayload = {
      depreciationMethod: value.depreciationMethod,
      usefulLife: value.usefulLife,
      salvageValue: value.salvageValue,
      depreciationRate: value.depreciationRate
    };

    // Process and clean data
    const processedData = {
      ...value,
      companyId,
      assetTag,
      // Convert string prices to numbers
      purchasePrice: value.purchasePrice ? parseFloat(value.purchasePrice) || null : null,
      currentValue: value.currentValue ? parseFloat(value.currentValue) || null : null,
      // Convert empty strings to null for optional fields
      vendorId: value.vendorId === '' ? null : value.vendorId,
      departmentId: value.departmentId === '' ? null : value.departmentId,
      assignedToId: value.assignedToId === '' ? null : value.assignedToId,
      // Parse dates properly
      purchaseDate: value.purchaseDate && value.purchaseDate !== '' ? new Date(value.purchaseDate) : null,
      warrantyExpiry: value.warrantyExpiry && value.warrantyExpiry !== '' ? new Date(value.warrantyExpiry) : null,
      // Map status from frontend to backend
      status: value.status === 'ACTIVE' ? 'AVAILABLE' : (value.status === 'INACTIVE' ? 'RETIRED' : value.status),
      // Ensure specifications is an object
      specifications: value.specifications || {}
    };

    // Remove fields that don't belong on the Asset model (they are handled
    // in related models like AssetDepreciation or AssetAttachment)
    ['depreciationRate', 'depreciationMethod', 'usefulLife', 'salvageValue', 'requiredSoftware', 'requiredSoftwareIds', 'attachments']
      .forEach(k => delete processedData[k]);

    // Create asset with transaction to handle related data
    const result = await prisma.$transaction(async (tx) => {
      // Create asset - only include fields that exist on the Asset model in Prisma
        const createData = {
          name: processedData.name,
          assetTag: processedData.assetTag,
          companyId: processedData.companyId,
          categoryId: processedData.categoryId,
          description: processedData.description || undefined,
          serialNumber: processedData.serialNumber || undefined,
          model: processedData.model || undefined,
          brand: processedData.brand || undefined,
          poNumber: processedData.poNumber || undefined,
          purchaseDate: processedData.purchaseDate || undefined,
          purchasePrice: processedData.purchasePrice !== undefined ? processedData.purchasePrice : undefined,
          currentValue: processedData.currentValue !== undefined ? processedData.currentValue : undefined,
          warrantyExpiry: processedData.warrantyExpiry || undefined,
          status: processedData.status || undefined,
          condition: processedData.condition || undefined,
          notes: processedData.notes || undefined,
          qrCode: processedData.qrCode || undefined,
          imageUrl: processedData.imageUrl || undefined,
          specifications: processedData.specifications || undefined,
          isActive: processedData.isActive !== undefined ? processedData.isActive : undefined,
          vendorId: processedData.vendorId || undefined,
          locationId: processedData.locationId || undefined,
          departmentId: processedData.departmentId || undefined,
          assignedToId: processedData.assignedToId || undefined
        };

        const asset = await tx.asset.create({
          data: createData,
        include: {
          category: {
            select: { id: true, name: true, code: true }
          },
          vendor: {
            select: { id: true, name: true, code: true }
          },
          location: {
            select: { id: true, name: true, building: true, room: true }
          },
          department: {
            select: { id: true, name: true, code: true }
          },
          assignedTo: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        }
      });

      // Handle file attachments
      if (req.files && req.files.length > 0) {
        const attachments = req.files.map((file, index) => {
          // Determine attachment type based on mime type
          let attachmentType = 'OTHER';
          if (file.mimetype.startsWith('image/')) {
            attachmentType = 'IMAGE';
          } else if (file.mimetype === 'application/pdf') {
            attachmentType = 'DOCUMENT';
          } else if (file.mimetype.includes('word') || file.mimetype.includes('excel')) {
            attachmentType = 'DOCUMENT';
          }

          return {
            assetId: asset.id,
            companyId: req.user.companyId,
            uploadedById: req.user.id,
            fileName: file.filename,
            originalName: file.originalname,
            filePath: file.path,
            fileSize: file.size,
            mimeType: file.mimetype,
            attachmentType: attachmentType,
            description: attachmentDescriptions[index] || file.originalname
          };
        });

        await tx.assetAttachment.createMany({
          data: attachments
        });
      }

  // Handle required software (temporarily commented out until proper software assets are ready)
      if (requiredSoftwareIds.length > 0) {
        // For now, just store in asset notes or specifications
        // Will be implemented properly when software asset management is ready
        console.log('Required software IDs stored in asset specifications:', requiredSoftwareIds);
        
        // Store software requirements in specifications for now
        if (!processedData.specifications) processedData.specifications = {};
        processedData.specifications.requiredSoftware = requiredSoftwareIds;
        
        // Update the asset with software requirements in specifications
        await tx.asset.update({
          where: { id: asset.id },
          data: { 
            specifications: processedData.specifications
          }
        });
      }

      // If depreciation fields were provided, create an AssetDepreciation entry
      if (depreciationPayload.depreciationMethod || depreciationPayload.usefulLife || depreciationPayload.depreciationRate || depreciationPayload.salvageValue) {
        try {
          await tx.assetDepreciation.create({
            data: {
              depreciationMethod: depreciationPayload.depreciationMethod || 'STRAIGHT_LINE',
              usefulLife: depreciationPayload.usefulLife || 0,
              salvageValue: depreciationPayload.salvageValue || null,
              depreciationRate: depreciationPayload.depreciationRate || null,
              currentBookValue: processedData.purchasePrice || null,
              accumulatedDepreciation: 0,
              lastCalculatedDate: new Date(),
              isActive: true,
              notes: null,
              asset: { connect: { id: asset.id } }
            }
          });
        } catch (err) {
          console.error('Failed to create asset depreciation record:', err);
          // don't fail the whole transaction for depreciation issues; log and continue
        }
      }

      // Return asset with all related data
      return await tx.asset.findUnique({
        where: { id: asset.id },
        include: {
          category: { select: { id: true, name: true, code: true } },
          vendor: { select: { id: true, name: true, code: true } },
          location: { select: { id: true, name: true, building: true, room: true } },
          department: { select: { id: true, name: true, code: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
          attachments: {
            select: {
              id: true,
              fileName: true,
              originalName: true,
              attachmentType: true,
              description: true,
              fileSize: true,
              mimeType: true,
              createdAt: true
            }
          },
          requiredSoftware: {
            include: {
              softwareAsset: {
                select: { id: true, name: true, version: true }
              }
            }
          }
        }
      });
    });

    res.status(201).json({
      success: true,
      message: 'Asset created successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// Update asset (Admin/Asset Admin only)
router.put('/:id', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), uploadMultiple, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Parse JSON fields from FormData if they exist
    const parsedBody = { ...req.body };
    
    // Handle JSON fields that might be stringified in FormData
    ['specifications', 'requiredSoftware'].forEach(field => {
      if (parsedBody[field] && typeof parsedBody[field] === 'string') {
        try {
          parsedBody[field] = JSON.parse(parsedBody[field]);
        } catch (e) {
          console.log(`Failed to parse ${field}:`, parsedBody[field]);
        }
      }
    });
    
    const { error, value } = updateAssetSchema.validate(parsedBody);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    // Parse array fields if they're strings (from FormData)
    let requiredSoftwareIds = [];
    let attachmentDescriptions = [];
    
    if (value.requiredSoftwareIds) {
      requiredSoftwareIds = Array.isArray(value.requiredSoftwareIds) 
        ? value.requiredSoftwareIds 
        : JSON.parse(value.requiredSoftwareIds || '[]');
    }
    
    if (value.attachmentDescriptions) {
      attachmentDescriptions = Array.isArray(value.attachmentDescriptions)
        ? value.attachmentDescriptions
        : JSON.parse(value.attachmentDescriptions || '[]');
    }

    // Check if asset exists
    const existingAsset = await prisma.asset.findUnique({
      where: { id }
    });

    if (!existingAsset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    // Check for asset tag conflicts (excluding current asset)
    if (value.assetTag) {
      const conflict = await prisma.asset.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            { assetTag: value.assetTag }
          ]
        }
      });

      if (conflict) {
        return res.status(400).json({
          success: false,
          message: 'Asset tag already exists'
        });
      }
    }

    // Validate foreign keys if provided
    if (value.categoryId) {
      const category = await prisma.category.findUnique({ 
        where: { id: value.categoryId } 
      });
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category'
        });
      }
    }

    if (value.assignedToId) {
      const user = await prisma.user.findUnique({ 
        where: { id: value.assignedToId } 
      });
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid assigned user'
        });
      }
    }

    // Process and clean data
    const processedData = {
      ...value,
      // Convert string prices to numbers
      purchasePrice: value.purchasePrice ? parseFloat(value.purchasePrice) || null : undefined,
      currentValue: value.currentValue ? parseFloat(value.currentValue) || null : undefined,
      // Convert empty strings to null for optional fields
      vendorId: value.vendorId === '' ? null : value.vendorId,
      departmentId: value.departmentId === '' ? null : value.departmentId,
      assignedToId: value.assignedToId === '' ? null : value.assignedToId,
      // Parse dates properly
      purchaseDate: value.purchaseDate && value.purchaseDate !== '' ? new Date(value.purchaseDate) : undefined,
      warrantyExpiry: value.warrantyExpiry && value.warrantyExpiry !== '' ? new Date(value.warrantyExpiry) : undefined,
      // Map status from frontend to backend
      status: value.status === 'ACTIVE' ? 'AVAILABLE' : (value.status === 'INACTIVE' ? 'RETIRED' : value.status),
    };

    // Remove undefined values to avoid overwriting with undefined
    Object.keys(processedData).forEach(key => {
      if (processedData[key] === undefined) {
        delete processedData[key];
      }
    });

    // Update asset
    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: processedData,
      include: {
        category: {
          select: { id: true, name: true, code: true }
        },
        vendor: {
          select: { id: true, name: true, code: true }
        },
        location: {
          select: { id: true, name: true, building: true, room: true }
        },
        department: {
          select: { id: true, name: true, code: true }
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    res.json({
      success: true,
      message: 'Asset updated successfully',
      data: updatedAsset
    });
  } catch (error) {
    next(error);
  }
});

// Delete asset (Admin only)
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if asset exists
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            maintenanceRecords: true,
            auditRecords: true,
            assetRequests: true
          }
        }
      }
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    // Check if asset has related records
    if (asset._count.maintenanceRecords > 0 || 
        asset._count.auditRecords > 0 || 
        asset._count.assetRequests > 0) {
      
      // Soft delete by setting isActive to false
      await prisma.asset.update({
        where: { id },
        data: { isActive: false, status: 'DISPOSED' }
      });
    } else {
      // Hard delete if no related records
      await prisma.asset.delete({
        where: { id }
      });
    }

    res.json({
      success: true,
      message: 'Asset deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Assign asset to user (Admin/Asset Admin only)
router.post('/:id/assign', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const assignSchema = Joi.object({
      userId: Joi.string().required(),
      notes: Joi.string().optional()
    });

    const { error, value } = assignSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    // Check if asset exists and is available
    const asset = await prisma.asset.findUnique({
      where: { id }
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    if (asset.status !== 'AVAILABLE') {
      return res.status(400).json({
        success: false,
        message: 'Asset is not available for assignment'
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: value.userId }
    });

    if (!user || !user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user or user not active'
      });
    }

    // Update asset
    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: {
        assignedToId: value.userId,
        status: 'IN_USE',
        notes: value.notes
      },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        category: {
          select: { id: true, name: true, code: true }
        }
      }
    });

    res.json({
      success: true,
      message: 'Asset assigned successfully',
      data: updatedAsset
    });
  } catch (error) {
    next(error);
  }
});

// Unassign asset (Admin/Asset Admin only)
router.post('/:id/unassign', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if asset exists
    const asset = await prisma.asset.findUnique({
      where: { id }
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    if (!asset.assignedToId) {
      return res.status(400).json({
        success: false,
        message: 'Asset is not currently assigned'
      });
    }

    // Update asset
    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: {
        assignedToId: null,
        status: 'AVAILABLE'
      },
      include: {
        category: {
          select: { id: true, name: true, code: true }
        }
      }
    });

    res.json({
      success: true,
      message: 'Asset unassigned successfully',
      data: updatedAsset
    });
  } catch (error) {
    next(error);
  }
});

// Transfer asset to different location/department/user
router.post('/:id/transfer', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const transferSchema = Joi.object({
      toLocationId: Joi.string().optional(),
      toDepartmentId: Joi.string().optional(),
      toUserId: Joi.string().optional(),
      reason: Joi.string().required(),
      notes: Joi.string().optional(),
      effectiveDate: Joi.date().optional(),
      // Allow legacy field names for backward compatibility
      locationId: Joi.string().optional(),
      departmentId: Joi.string().optional()
    }).unknown(true);

    const { error, value } = transferSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    // Handle backward compatibility for old field names
    const processedData = {
      toLocationId: value.toLocationId || value.locationId,
      toDepartmentId: value.toDepartmentId || value.departmentId,
      toUserId: value.toUserId,
      reason: value.reason,
      notes: value.notes,
      effectiveDate: value.effectiveDate || new Date()
    }

    // Validate that at least one target is specified
    if (!processedData.toLocationId && !processedData.toDepartmentId && !processedData.toUserId) {
      return res.status(400).json({
        success: false,
        message: 'At least one target (location, department, or user) must be specified for transfer'
      });
    }

    // Check if asset exists
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        location: true,
        department: true,
        assignedTo: true
      }
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    // Create a unique transfer number
    const transferCount = await prisma.assetTransfer.count();
    const transferNumber = `TR-${String(transferCount + 1).padStart(6, '0')}`;

    // Create transfer record
    const transfer = await prisma.assetTransfer.create({
      data: {
        transferNumber,
        reason: processedData.reason,
        notes: processedData.notes,
        effectiveDate: processedData.effectiveDate,
        status: 'PENDING',
        assetId: asset.id,
        fromLocationId: asset.locationId,
        toLocationId: processedData.toLocationId,
        fromDepartmentId: asset.departmentId,
        toDepartmentId: processedData.toDepartmentId,
        fromUserId: asset.assignedToId,
        toUserId: processedData.toUserId,
        requestedById: req.user.id,
      },
      include: {
        asset: true,
        fromLocation: true,
        toLocation: true,
        fromDepartment: true,
        toDepartment: true,
        fromUser: true,
        toUser: true,
        requestedBy: true
      }
    });

    res.json({
      success: true,
      message: 'Asset transfer request created successfully',
      data: transfer
    });
  } catch (error) {
    next(error);
  }
});

// Set up or update depreciation for an asset
router.post('/:id/depreciation', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const depreciationSchema = Joi.object({
      depreciationMethod: Joi.string().valid('STRAIGHT_LINE', 'DECLINING_BALANCE', 'UNITS_OF_PRODUCTION').required(),
      usefulLife: Joi.number().integer().required(),
      salvageValue: Joi.number().min(0).required(),
      depreciationRate: Joi.number().min(0).max(1).optional(),
      notes: Joi.string().optional()
    });
    
    const { error, value } = depreciationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    // Check if asset exists
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        depreciation: true
      }
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    if (!asset.purchasePrice) {
      return res.status(400).json({
        success: false,
        message: 'Asset purchase price is required for depreciation calculation'
      });
    }

    // Calculate initial current book value
    const currentBookValue = asset.purchasePrice;
    const salvageValue = parseFloat(value.salvageValue);
    
    // Create or update depreciation settings
    let depreciation;
    if (asset.depreciation) {
      depreciation = await prisma.assetDepreciation.update({
        where: { id: asset.depreciation.id },
        data: {
          depreciationMethod: value.depreciationMethod,
          usefulLife: value.usefulLife,
          salvageValue,
          depreciationRate: value.depreciationRate || null,
          currentBookValue,
          accumulatedDepreciation: 0,
          lastCalculatedDate: new Date(),
          isActive: true,
          notes: value.notes
        }
      });
    } else {
      depreciation = await prisma.assetDepreciation.create({
        data: {
          depreciationMethod: value.depreciationMethod,
          usefulLife: value.usefulLife,
          salvageValue,
          depreciationRate: value.depreciationRate || null,
          currentBookValue,
          accumulatedDepreciation: 0,
          lastCalculatedDate: new Date(),
          isActive: true,
          notes: value.notes,
          asset: {
            connect: {
              id: asset.id
            }
          }
        }
      });
    }

    res.json({
      success: true,
      message: 'Depreciation settings updated successfully',
      data: depreciation
    });
  } catch (error) {
    next(error);
  }
});

// Calculate current depreciation value
router.get('/:id/depreciation', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if asset exists with depreciation settings
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        depreciation: true
      }
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    if (!asset.depreciation) {
      return res.status(400).json({
        success: false,
        message: 'No depreciation settings found for this asset'
      });
    }

    if (!asset.purchaseDate) {
      return res.status(400).json({
        success: false,
        message: 'Asset purchase date is required for depreciation calculation'
      });
    }

    const dep = asset.depreciation;
    const purchaseDate = new Date(asset.purchaseDate);
    const today = new Date();
    
    // Calculate years in service
    const msInYear = 1000 * 60 * 60 * 24 * 365.25;
    const yearsInService = (today - purchaseDate) / msInYear;
    
    let currentValue;
    let accumulatedDepreciation;
    
    // Calculate depreciation based on method
    if (dep.depreciationMethod === 'STRAIGHT_LINE') {
      const annualDepreciation = (asset.purchasePrice.toNumber() - dep.salvageValue.toNumber()) / dep.usefulLife;
      accumulatedDepreciation = Math.min(annualDepreciation * yearsInService, asset.purchasePrice.toNumber() - dep.salvageValue.toNumber());
      currentValue = asset.purchasePrice.toNumber() - accumulatedDepreciation;
    } 
    else if (dep.depreciationMethod === 'DECLINING_BALANCE') {
      const rate = dep.depreciationRate?.toNumber() || (1 / dep.usefulLife * 2);
      currentValue = asset.purchasePrice.toNumber() * Math.pow(1 - rate, Math.min(yearsInService, dep.usefulLife));
      accumulatedDepreciation = asset.purchasePrice.toNumber() - currentValue;
    }
    else {
      // Units of production would need production data which we don't have
      // So we're using straight line as fallback
      const annualDepreciation = (asset.purchasePrice.toNumber() - dep.salvageValue.toNumber()) / dep.usefulLife;
      accumulatedDepreciation = Math.min(annualDepreciation * yearsInService, asset.purchasePrice.toNumber() - dep.salvageValue.toNumber());
      currentValue = asset.purchasePrice.toNumber() - accumulatedDepreciation;
    }
    
    // Ensure value doesn't go below salvage value
    currentValue = Math.max(currentValue, dep.salvageValue.toNumber());
    
    // Update asset currentValue and depreciation record
    await prisma.asset.update({
      where: { id },
      data: {
        currentValue
      }
    });
    
    await prisma.assetDepreciation.update({
      where: { id: dep.id },
      data: {
        currentBookValue: currentValue,
        accumulatedDepreciation,
        lastCalculatedDate: today
      }
    });
    
    res.json({
      success: true,
      data: {
        originalValue: asset.purchasePrice.toNumber(),
        currentValue,
        accumulatedDepreciation,
        salvageValue: dep.salvageValue.toNumber(),
        usefulLife: dep.usefulLife,
        yearsInService: parseFloat(yearsInService.toFixed(2)),
        lastCalculated: today,
        depreciationMethod: dep.depreciationMethod
      }
    });
  } catch (error) {
    next(error);
  }
});

// Generate QR code for an asset
router.post('/:id/generate-qr', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { format = 'file' } = req.body;

    // Check if asset exists
    const asset = await prisma.asset.findUnique({
      where: { id: id }, // Use string ID, not parseInt
      include: {
        category: true,
        location: true,
        department: true,
        vendor: true,
        assignedTo: true
      }
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    // Create QR data object
    const qrData = {
      id: asset.id,
      assetTag: asset.assetTag,
      name: asset.name,
      serialNumber: asset.serialNumber || '',
      category: asset.category?.name || '',
      status: asset.status,
      timestamp: new Date().toISOString(),
    };

    // Return QR data as JSON
    res.json({
      success: true,
      data: qrData
    });
  } catch (error) {
    next(error);
  }
});

// Upload asset image
router.post('/:id/upload-image', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), upload.single('image'), async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Check if asset exists
    const asset = await prisma.asset.findUnique({
      where: { id }
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    // Create image URL
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const imageUrl = `${baseUrl}/uploads/assets/${req.file.filename}`;

    // Update asset with image URL
    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: { imageUrl }
    });

    res.json({
      success: true,
      message: 'Asset image uploaded successfully',
      data: {
        imageUrl,
        asset: updatedAsset
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get asset statistics
router.get('/statistics/overview', authenticate, authorize('ADMIN', 'ASSET_ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const [
      totalAssets,
      assetsByStatus,
      assetsByCategory,
      totalValue,
      maintenanceDue
    ] = await Promise.all([
      prisma.asset.count({ where: { isActive: true } }),
      prisma.asset.groupBy({
        by: ['status'],
        where: { isActive: true },
        _count: true
      }),
      prisma.asset.groupBy({
        by: ['categoryId'],
        where: { isActive: true },
        _count: true,
        _sum: { currentValue: true }
      }),
      prisma.asset.aggregate({
        where: { isActive: true },
        _sum: { currentValue: true }
      }),
      prisma.maintenanceRecord.count({
        where: {
          status: 'SCHEDULED',
          scheduledDate: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Next 30 days
          }
        }
      })
    ]);

    // Get category names for statistics
    const categories = await prisma.category.findMany({
      select: { id: true, name: true }
    });

    const categoryMap = categories.reduce((acc, cat) => {
      acc[cat.id] = cat.name;
      return acc;
    }, {});

    const statistics = {
      totalAssets,
      assetsByStatus,
      assetsByCategory: assetsByCategory.map(item => ({
        categoryId: item.categoryId,
        categoryName: categoryMap[item.categoryId] || 'Unknown',
        count: item._count,
        totalValue: item._sum.currentValue || 0
      })),
      totalValue: totalValue._sum.currentValue || 0,
      maintenanceDue
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
    const [totalAssets, availableAssets] = await Promise.all([
      prisma.asset.count({ where: { isActive: true } }),
      prisma.asset.count({ 
        where: { 
          isActive: true, 
          status: 'AVAILABLE' 
        } 
      })
    ]);

    res.json({
      success: true,
      data: {
        total: totalAssets,
        available: availableAssets
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
