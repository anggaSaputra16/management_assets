const express = require('express')
const Joi = require('joi')
const { authenticate, authorize } = require('../middleware/auth')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const router = express.Router()

// Validation schema for creating a decomposition plan
const decompositionSchema = Joi.object({
  sourceAssetId: Joi.string().required(),
  title: Joi.string().optional().allow(''),
  description: Joi.string().optional().allow(''),
  plannedDate: Joi.date().optional(),
  items: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      description: Joi.string().optional().allow(''),
      quantity: Joi.number().integer().min(1).default(1),
      unitPrice: Joi.number().min(0).default(0),
      category: Joi.string().valid('HARDWARE','SOFTWARE','ACCESSORY','CONSUMABLE').optional(),
      partType: Joi.string().valid('COMPONENT','ACCESSORY','CONSUMABLE','TOOL','SOFTWARE').optional()
    })
  ).min(1).required()
})

// GET /api/decomposition - list decomposition plans (asset requests with ASSET_BREAKDOWN)
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const pageNum = parseInt(page) || 1
    const limitNum = parseInt(limit) || 20
    const offset = (pageNum - 1) * limitNum

    const where = {
      requestType: 'ASSET_BREAKDOWN',
      companyId: req.user.companyId
    }

    const [items, total] = await Promise.all([
      prisma.assetRequest.findMany({
        where,
        skip: offset,
        take: limitNum,
        orderBy: { requestedDate: 'desc' },
        include: {
          requester: { select: { id: true, firstName: true, lastName: true } },
          asset: { select: { id: true, assetTag: true, name: true } }
        }
      }),
      prisma.assetRequest.count({ where })
    ])

    // Parse notes (plan items) for each request so frontend can display item counts and details
    // Frontend expects an `items` array on each decomposition object, so provide that
    const itemsWithPlan = items.map(r => {
      let planItems = []
      try {
        if (r.notes) planItems = JSON.parse(r.notes)
      } catch (e) {
        planItems = []
      }

      return {
        ...r,
        // expose parsed items as `items` to match frontend expectations
        items: Array.isArray(planItems) ? planItems : [],
        // keep backward-compatible itemsCount if frontend or other consumers need it
        itemsCount: Array.isArray(planItems) ? planItems.length : 0
      }
    })

    res.json({ success: true, data: itemsWithPlan, pagination: { page: pageNum, limit: limitNum, total } })
  } catch (err) {
    console.error('Error listing decompositions:', err)
    res.status(500).json({ success: false, message: 'Failed to list decompositions', error: err.message })
  }
})

// GET /api/decomposition/:id - get decomposition detail
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const reqRecord = await prisma.assetRequest.findUnique({
      where: { id },
      include: {
        requester: { select: { id: true, firstName: true, lastName: true } },
        asset: { select: { id: true, assetTag: true, name: true, companyId: true } }
      }
    })

    if (!reqRecord || reqRecord.requestType !== 'ASSET_BREAKDOWN') {
      return res.status(404).json({ success: false, message: 'Decomposition plan not found' })
    }

    // notes field stores plan items as JSON when created
    let items = []
    try {
      if (reqRecord.notes) items = JSON.parse(reqRecord.notes)
    } catch (e) {
      // fallback: store empty
      items = []
    }

    // Return `items` to match frontend shape
    res.json({ success: true, data: { ...reqRecord, items: Array.isArray(items) ? items : [] } })
  } catch (err) {
    console.error('Error fetching decomposition detail:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch decomposition detail', error: err.message })
  }
})

// POST /api/decomposition - create a decomposition plan
router.post('/', authenticate, authorize('ADMIN', 'ASSET_ADMIN', 'TECHNICIAN'), async (req, res) => {
  try {
  // Allow unknown keys (e.g. companyId injected by API interceptor) because
  // the server will derive companyId from the source asset and should not
  // reject the request if the client included it.
  const { error, value } = decompositionSchema.validate(req.body, { allowUnknown: true })
    if (error) return res.status(400).json({ success: false, message: 'Validation error', details: error.details.map(d => d.message) })

    const sourceAsset = await prisma.asset.findUnique({ where: { id: value.sourceAssetId } })
    if (!sourceAsset) return res.status(404).json({ success: false, message: 'Source asset not found' })

    // Ensure company match
    if (sourceAsset.companyId !== req.user.companyId && req.user.role !== 'ADMIN' && req.user.role !== 'TOP_MANAGEMENT') {
      return res.status(403).json({ success: false, message: 'Cannot create decomposition for asset outside your company' })
    }

    const title = value.title && value.title.trim() !== '' ? value.title : `Decomposition - ${sourceAsset.assetTag}`

    // Create the decomposition request and also create SparePart records for each planned item
    // We intentionally do NOT store full items JSON in the request.notes anymore. Spare parts
    // will be created in the spare_parts table and linked back to this request via
    // `createdFromRequestId` so the master sparepart list knows the origin.
    const created = await prisma.$transaction(async (tx) => {
      const createdReq = await tx.assetRequest.create({
        data: {
          requestNumber: `DB-${Date.now()}`,
          requestType: 'ASSET_BREAKDOWN',
          title,
          description: value.description || 'Decomposition plan',
          justification: 'Decomposition plan created via UI',
          requesterId: req.user.id,
          departmentId: sourceAsset.departmentId || req.user.departmentId || '',
          companyId: sourceAsset.companyId,
          assetId: sourceAsset.id,
          // keep notes for short description only
          notes: `Decomposition plan with ${Array.isArray(value.items) ? value.items.length : 0} item(s)`
        }
      })

      // Create spare parts from items and link them to the created request
      if (Array.isArray(value.items) && value.items.length > 0) {
        for (const it of value.items) {
          const quantity = Number.isFinite(Number(it.quantity)) ? parseInt(it.quantity, 10) : 1
          const unitPrice = Number.isFinite(Number(it.unitPrice)) ? parseFloat(it.unitPrice) : 0
          const partNumberCandidate = it.partNumber && String(it.partNumber).trim() !== '' ? String(it.partNumber).trim() : null

          // Generate a partName consistent to existing naming, but keep real name for master
          const partName = it.name || `sparepart-${Date.now()}`

          await tx.sparePart.create({
            data: {
              partNumber: partNumberCandidate || `SP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              name: partName,
              description: it.description || '',
              category: it.category || 'HARDWARE',
              partType: it.partType || 'COMPONENT',
              status: 'ACTIVE',
              unitPrice: unitPrice,
              stockLevel: quantity,
              minStockLevel: 1,
              maxStockLevel: Math.max(10, quantity),
              reorderPoint: 1,
              notes: `origin: decomposition plan ${createdReq.requestNumber}`,
              companyId: createdReq.companyId,
              createdFromRequestId: createdReq.id,
              // Link back to source asset so we can trace originating asset
              sourceAssetId: createdReq.assetId
            }
          })
        }
      }

      return createdReq
    })

    res.status(201).json({ success: true, message: 'Decomposition plan created and spare parts registered', data: created })
  } catch (err) {
    console.error('Error creating decomposition plan:', err)
    res.status(500).json({ success: false, message: 'Failed to create decomposition plan', error: err.message })
  }
})

// POST /api/decomposition/:id/execute - execute the decomposition plan
router.post('/:id/execute', authenticate, authorize('ADMIN', 'ASSET_ADMIN', 'TECHNICIAN'), async (req, res) => {
  const { id } = req.params
  try {
    const reqRecord = await prisma.assetRequest.findUnique({ where: { id }, include: { asset: true } })
    if (!reqRecord || reqRecord.requestType !== 'ASSET_BREAKDOWN') {
      return res.status(404).json({ success: false, message: 'Decomposition plan not found' })
    }

    if (reqRecord.companyId !== req.user.companyId && req.user.role !== 'ADMIN' && req.user.role !== 'TOP_MANAGEMENT') {
      return res.status(403).json({ success: false, message: 'Not authorized to execute this plan' })
    }

    // Idempotency guard: do not execute a plan that's already completed
    if (reqRecord.status === 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'Decomposition plan already executed' })
    }

    // BUSINESS RULE: Prevent decomposing inactive or already retired assets
    if (!reqRecord.asset || reqRecord.asset.isActive === false) {
      return res.status(400).json({ success: false, message: 'Cannot decompose an inactive asset' })
    }
    if (reqRecord.asset.status === 'RETIRED' || reqRecord.asset.status === 'DISPOSED') {
      return res.status(400).json({ success: false, message: 'Cannot decompose an asset that is already retired or disposed' })
    }

    // Prefer spare parts that were created and linked to this request (createdFromRequestId).
    // Backwards compatibility: if no linked spare parts exist, fall back to parsing notes (old behavior).
    let items = []
    const linkedParts = await prisma.sparePart.findMany({ where: { createdFromRequestId: id, companyId: reqRecord.companyId } })
    if (linkedParts && linkedParts.length > 0) {
      // Convert linked spare parts into the items format expected by execution logic
      items = linkedParts.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        quantity: p.stockLevel || 1,
        unitPrice: p.unitPrice || 0,
        partNumber: p.partNumber || null,
        category: p.category,
        partType: p.partType
      }))
    } else {
      // Parse plan items from notes for older records
      try { items = reqRecord.notes ? JSON.parse(reqRecord.notes) : [] } catch (e) { items = [] }
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items to decompose' })
    }

    console.log(`Executing decomposition plan ${id} for asset ${reqRecord.asset?.id} - items:`, JSON.stringify(items))

    // Transaction: create spare parts and asset components
    // Derive fallback unit price from source asset purchase price if items don't specify unitPrice
    const totalItemsQuantity = items.reduce((s, it) => s + (Number(it.quantity) || 1), 0)
    const assetPurchasePrice = reqRecord.asset && reqRecord.asset.purchasePrice ? Number(reqRecord.asset.purchasePrice) : 0

    const created = await prisma.$transaction(async (tx) => {
      const results = []
      for (const it of items) {
        try {
          // Normalize numeric fields
          const quantity = Number.isFinite(Number(it.quantity)) ? parseInt(it.quantity, 10) : 1
          // Prefer explicit item.unitPrice when provided (>0). Otherwise derive a fallback from asset purchase price
          let unitPrice = Number.isFinite(Number(it.unitPrice)) ? parseFloat(it.unitPrice) : 0
          if ((!unitPrice || unitPrice === 0) && assetPurchasePrice > 0 && totalItemsQuantity > 0) {
            // Distribute asset purchase price proportionally (simple equal split)
            unitPrice = parseFloat((assetPurchasePrice / totalItemsQuantity).toFixed(2))
          }

          console.log('Creating spare part for item:', it)
          // Try to upsert existing spare part: prefer matching by partNumber if provided,
          // otherwise attempt a name match. If found, increment stock; otherwise create.
          const partNumberCandidate = it.partNumber && String(it.partNumber).trim() !== '' ? String(it.partNumber).trim() : null
          let spare = null

          if (partNumberCandidate) {
            spare = await tx.sparePart.findFirst({ where: { companyId: reqRecord.companyId, partNumber: partNumberCandidate } })
          }

          // Fallback: try to find by exact name (case-insensitive contains) if no partNumber match
          if (!spare) {
            spare = await tx.sparePart.findFirst({ where: { companyId: reqRecord.companyId, name: { contains: it.name || '', mode: 'insensitive' } } })
          }

          if (spare) {
            // If the found spare part was created from this request already, do not double-add stock.
            if (spare.createdFromRequestId && spare.createdFromRequestId === id) {
              // Ensure unit price and notes are updated to reflect execution
              spare = await tx.sparePart.update({
                where: { id: spare.id },
                data: {
                  unitPrice: unitPrice || spare.unitPrice,
                  notes: `${spare.notes || ''}\n[${new Date().toISOString()}] Decomposition executed (linked to request ${id})`
                }
              })
              console.log('Spare part was pre-created for this request, id:', spare.id)
            } else {
              // Update existing spare part stock and optionally unit price/notes
              const newStock = (typeof spare.stockLevel === 'number' ? spare.stockLevel : 0) + quantity
              spare = await tx.sparePart.update({
                where: { id: spare.id },
                data: {
                  stockLevel: newStock,
                  unitPrice: unitPrice || spare.unitPrice,
                  notes: `${spare.notes || ''}\n[${new Date().toISOString()}] Added ${quantity} from decomposition ${reqRecord.id}`
                }
              })
              console.log('Updated existing spare part id:', spare.id, 'newStock:', spare.stockLevel)
            }
          } else {
            const partName = `sparepart: ${it.name}`
            spare = await tx.sparePart.create({
              data: {
                partNumber: partNumberCandidate || `SP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                name: partName,
                description: it.description || '',
                category: it.category || 'HARDWARE',
                partType: it.partType || 'COMPONENT',
                status: 'ACTIVE',
                unitPrice: unitPrice,
                stockLevel: quantity,
                minStockLevel: 1,
                maxStockLevel: Math.max(10, quantity),
                reorderPoint: 1,
                notes: `asal: decomposition asset ${reqRecord.asset?.assetTag}`,
                companyId: reqRecord.companyId,
                createdFromRequestId: id,
                // Keep reference to the source asset for traceability
                sourceAssetId: reqRecord.asset?.id
              }
            })

            console.log('Created spare part id:', spare.id)
          }

          const comp = await tx.assetComponent.create({
            data: {
              name: it.name,
              description: it.description || '',
              partNumber: it.partNumber || null,
              brand: it.brand || null,
              model: it.model || null,
              status: 'ACTIVE',
              isReplaceable: true,
              isTransferable: true,
              assetId: reqRecord.asset.id,
              sourcePartId: spare.id
            }
          })

          console.log('Created asset component id:', comp.id)

          // Re-fetch spare part within the transaction to include related data
          const spareWithIncludes = await tx.sparePart.findUnique({
            where: { id: spare.id },
            include: {
              vendor: { select: { id: true, name: true, code: true } },
              company: { select: { id: true, name: true } },
              sourceComponents: { include: { asset: { select: { id: true, assetTag: true, name: true } } } }
            }
          })

          results.push({ sparePart: spareWithIncludes, component: comp })
        } catch (itemErr) {
          console.error('Error creating spare/component for item', it, itemErr)
          // rethrow to rollback transaction and return error
          throw itemErr
        }
      }

      // Mark request as completed and set completedDate
      await tx.assetRequest.update({ where: { id }, data: { status: 'COMPLETED', completedDate: new Date() } })

      // Update the source asset status: mark it as RETIRED and deactivate it so it's no longer active after decomposition
      try {
        if (reqRecord.asset && reqRecord.asset.id) {
          await tx.asset.update({
            where: { id: reqRecord.asset.id },
            data: {
              status: 'RETIRED',
              isActive: false,
              notes: `${reqRecord.asset.notes || ''}\n[${new Date().toISOString()}] Asset decomposed via request ${id}`
            }
          })
        }
      } catch (assetUpdateErr) {
        console.error('Failed to update source asset status after decomposition:', assetUpdateErr)
        // don't fail the entire transaction for asset note update, but bubble the warning
      }

      return results
    })

    res.json({ success: true, message: 'Decomposition executed', data: created })
  } catch (err) {
    console.error('Error executing decomposition:', err)
    res.status(500).json({ success: false, message: 'Failed to execute decomposition', error: err.message })
  }
})

// GET /api/decomposition/assets/compatible/:assetId - get compatible assets to receive parts
router.get('/assets/compatible/:assetId', authenticate, async (req, res) => {
  try {
    const { assetId } = req.params
    const src = await prisma.asset.findUnique({ where: { id: assetId } })
    if (!src) return res.status(404).json({ success: false, message: 'Asset not found' })

    // Return assets in same company except source asset and with status AVAILABLE or IN_USE
    const assets = await prisma.asset.findMany({
      where: {
        companyId: src.companyId,
        id: { not: assetId },
        OR: [{ status: 'AVAILABLE' }, { status: 'IN_USE' }]
      },
      select: { id: true, assetTag: true, name: true, status: true }
    })

    res.json({ success: true, data: assets })
  } catch (err) {
    console.error('Error fetching compatible assets:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch compatible assets', error: err.message })
  }
})

module.exports = router
