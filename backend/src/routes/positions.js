const express = require('express')
const { authenticate, authorize } = require('../middleware/auth')
const { PrismaClient } = require('@prisma/client')
const Joi = require('joi')

const router = express.Router()
const prisma = new PrismaClient()

// Validation schema untuk Position
const positionSchema = Joi.object({
  title: Joi.string().required().min(2).max(100),
  description: Joi.string().optional().allow('').max(500),
  level: Joi.string().optional().valid('STAFF', 'SUPERVISOR', 'MANAGER', 'HEAD', 'DIRECTOR'),
  isActive: Joi.boolean().default(true)
})

// GET /api/positions - Get all positions with multi-company filtering
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', level, isActive } = req.query
    const offset = (parseInt(page) - 1) * parseInt(limit)

    const where = {
      companyId: req.user.companyId // Multi-company filtering
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (level) {
      where.level = level
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    const [positions, total] = await Promise.all([
      prisma.position.findMany({
        where,
        skip: offset,
        take: parseInt(limit),
        orderBy: [
          { level: 'asc' },
          { title: 'asc' }
        ],
        include: {
          _count: {
            select: {
              users: true
            }
          }
        }
      }),
      prisma.position.count({ where })
    ])

    res.json({
      success: true,
      data: positions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Error fetching positions:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch positions',
      error: error.message
    })
  }
})

// GET /api/positions/stats - Get position statistics  
router.get('/stats', authenticate, async (req, res) => {
  try {
    const where = { companyId: req.user.companyId }
    
    const stats = await prisma.position.aggregate({
      _count: { id: true },
      where: { ...where, isActive: true }
    })

    const recentPositions = await prisma.position.findMany({
      where,
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        level: true,
        createdAt: true,
        isActive: true
      }
    })

    res.json({
      success: true,
      data: {
        totalPositions: stats._count.id,
        recentPositions
      }
    })
  } catch (error) {
    console.error('Error fetching position stats:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch position stats',
      error: error.message
    })
  }
})

// GET /api/positions/:id - Get position by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    
    const position = await prisma.position.findUnique({
      where: { 
        id,
        companyId: req.user.companyId // Multi-company filtering
      },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            isActive: true
          }
        },
        _count: {
          select: {
            users: true
          }
        }
      }
    })

    if (!position) {
      return res.status(404).json({
        success: false,
        message: 'Position not found'
      })
    }

    res.json({
      success: true,
      data: position
    })
  } catch (error) {
    console.error('Error fetching position:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch position',
      error: error.message
    })
  }
})

// POST /api/positions - Create new position (Admin/Asset Admin only)
router.post('/', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res) => {
  try {
    const { error, value } = positionSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      })
    }

    // Check if position with same title exists in company
    const existingPosition = await prisma.position.findFirst({
      where: {
        companyId: req.user.companyId,
        title: value.title
      }
    })

    if (existingPosition) {
      return res.status(400).json({
        success: false,
        message: 'Position with this title already exists in your company'
      })
    }

    const position = await prisma.position.create({
      data: {
        ...value,
        companyId: req.user.companyId // Auto-inject company ID
      },
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    })

    res.status(201).json({
      success: true,
      message: 'Position created successfully',
      data: position
    })
  } catch (error) {
    console.error('Error creating position:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create position',
      error: error.message
    })
  }
})

// PUT /api/positions/:id - Update position
router.put('/:id', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params
    const { error, value } = positionSchema.validate(req.body)
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      })
    }

    // Check if position exists and belongs to user's company
    const existingPosition = await prisma.position.findUnique({
      where: { 
        id,
        companyId: req.user.companyId
      }
    })

    if (!existingPosition) {
      return res.status(404).json({
        success: false,
        message: 'Position not found'
      })
    }

    // Check if title conflicts with other positions in company
    const conflictPosition = await prisma.position.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          { companyId: req.user.companyId },
          { title: value.title }
        ]
      }
    })

    if (conflictPosition) {
      return res.status(400).json({
        success: false,
        message: 'Position with this title already exists in your company'
      })
    }

    const updatedPosition = await prisma.position.update({
      where: { id },
      data: value,
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    })

    res.json({
      success: true,
      message: 'Position updated successfully',
      data: updatedPosition
    })
  } catch (error) {
    console.error('Error updating position:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update position',
      error: error.message
    })
  }
})

// DELETE /api/positions/:id - Delete position (Admin only)
router.delete('/:id', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params

    // Check if position exists and belongs to user's company
    const existingPosition = await prisma.position.findUnique({
      where: { 
        id,
        companyId: req.user.companyId
      },
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    })

    if (!existingPosition) {
      return res.status(404).json({
        success: false,
        message: 'Position not found'
      })
    }

    // Check if position has users assigned
    if (existingPosition._count.users > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete position with assigned users. Please reassign users first.',
        details: {
          assignedUsers: existingPosition._count.users
        }
      })
    }

    await prisma.position.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: 'Position deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting position:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete position',
      error: error.message
    })
  }
})

module.exports = router