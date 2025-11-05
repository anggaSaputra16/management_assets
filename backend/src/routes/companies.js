const express = require('express')
const { authenticate, authorize } = require('../middleware/auth')
const { PrismaClient } = require('@prisma/client')
const Joi = require('joi')

const router = express.Router()
const prisma = new PrismaClient()

// Validation schema untuk Company
const companySchema = Joi.object({
  name: Joi.string().required().min(2).max(255),
  code: Joi.string().required().min(2).max(10).uppercase(),
  address: Joi.string().optional().allow('').max(500),
  phone: Joi.string().optional().allow('').max(20),
  email: Joi.string().email().optional().allow(''),
  website: Joi.string().uri().optional().allow(''),
  logo: Joi.string().optional().allow(''),
  taxNumber: Joi.string().optional().allow('').max(50),
  registrationNumber: Joi.string().optional().allow('').max(50),
  description: Joi.string().optional().allow('').max(1000),
  isActive: Joi.boolean().default(true),
  companyId: Joi.string().optional() // Allow companyId to be passed but not required
}).unknown(true) // Allow unknown fields to be passed

// GET /api/companies - Get all companies (Admin, Asset Admin, and Top Management)
router.get('/', authenticate, authorize('ADMIN', 'ASSET_ADMIN', 'TOP_MANAGEMENT'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', isActive } = req.query
    const offset = (parseInt(page) - 1) * parseInt(limit)

    const where = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }
    if (isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip: offset,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              users: true,
              departments: true,
              assets: true
            }
          }
        }
      }),
      prisma.company.count({ where })
    ])

    res.json({
      success: true,
      data: companies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Error fetching companies:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch companies',
      error: error.message
    })
  }
})

// GET /api/companies/stats - Get company statistics (Admin, Asset Admin, and Top Management)
router.get('/stats', authenticate, authorize('ADMIN', 'ASSET_ADMIN', 'TOP_MANAGEMENT'), async (req, res) => {
  try {
    const stats = await prisma.company.aggregate({
      _count: { id: true },
      where: { isActive: true }
    })

    const recentCompanies = await prisma.company.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        code: true,
        createdAt: true,
        isActive: true
      }
    })

    res.json({
      success: true,
      data: {
        totalCompanies: stats._count.id,
        recentCompanies
      }
    })
  } catch (error) {
    console.error('Error fetching company stats:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company stats',
      error: error.message
    })
  }
})

// GET /api/companies/:id - Get company by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params

    // Fetch company by id (unique)
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            departments: true,
            assets: true,
            locations: true,
            categories: true,
            vendors: true
          }
        }
      }
    })

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      })
    }

    // Only ADMIN and TOP_MANAGEMENT can view any company; other users can view only their own company
    if (req.user.role !== 'ADMIN' && req.user.role !== 'TOP_MANAGEMENT' && company.id !== req.user.companyId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }

    res.json({
      success: true,
      data: company
    })
  } catch (error) {
    console.error('Error fetching company:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company',
      error: error.message
    })
  }
})

// POST /api/companies - Create new company (Admin only)
router.post('/', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res) => {
  try {
    const { error, value } = companySchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      })
    }

    // Remove companyId from value as it shouldn't be part of creation data
    const { companyId, ...companyData } = value

    // Check if company with same name or code exists
    const existingCompany = await prisma.company.findFirst({
      where: {
        OR: [
          { name: companyData.name },
          { code: companyData.code }
        ]
      }
    })

    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: 'Company with this name or code already exists'
      })
    }

    const company = await prisma.company.create({
      data: companyData,
      include: {
        _count: {
          select: {
            users: true,
            departments: true,
            assets: true
          }
        }
      }
    })

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: company
    })
  } catch (error) {
    console.error('Error creating company:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create company',
      error: error.message
    })
  }
})

// PUT /api/companies/:id - Update company
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params

    // Admin can update any company, users can only update their own company
    let targetCompanyId = id
    if (req.user.role !== 'ADMIN') {
      targetCompanyId = req.user.companyId
      if (id !== req.user.companyId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only update your own company.'
        })
      }
    }

    const { error, value } = companySchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      })
    }

    // Remove companyId from value as it shouldn't be part of update data
    const { companyId, ...companyData } = value

    // Check if company exists
    const existingCompany = await prisma.company.findUnique({
      where: { id: targetCompanyId }
    })

    if (!existingCompany) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      })
    }

    // Check if name or code conflicts with other companies
    const conflictCompany = await prisma.company.findFirst({
      where: {
        AND: [
          { id: { not: targetCompanyId } },
          {
            OR: [
              { name: value.name },
              { code: value.code }
            ]
          }
        ]
      }
    })

    if (conflictCompany) {
      return res.status(400).json({
        success: false,
        message: 'Company with this name or code already exists'
      })
    }

    const updatedCompany = await prisma.company.update({
      where: { id: targetCompanyId },
      data: companyData,
      include: {
        _count: {
          select: {
            users: true,
            departments: true,
            assets: true
          }
        }
      }
    })

    res.json({
      success: true,
      message: 'Company updated successfully',
      data: updatedCompany
    })
  } catch (error) {
    console.error('Error updating company:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update company',
      error: error.message
    })
  }
})

// DELETE /api/companies/:id - Delete company (Admin only)
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params

    // Check if company exists
    const existingCompany = await prisma.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            departments: true,
            assets: true
          }
        }
      }
    })

    if (!existingCompany) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      })
    }

    // Check if company has related data
    const hasRelatedData = existingCompany._count.users > 0 || 
                          existingCompany._count.departments > 0 || 
                          existingCompany._count.assets > 0

    if (hasRelatedData) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete company with existing users, departments, or assets. Please transfer or delete related data first.',
        details: {
          users: existingCompany._count.users,
          departments: existingCompany._count.departments,
          assets: existingCompany._count.assets
        }
      })
    }

    await prisma.company.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: 'Company deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting company:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete company',
      error: error.message
    })
  }
})

module.exports = router