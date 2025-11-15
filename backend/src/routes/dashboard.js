const express = require('express')
const { authenticate } = require('../middleware/auth')
const { PrismaClient } = require('@prisma/client')

const router = express.Router()
const prisma = new PrismaClient()

// Safe wrappers in case some Prisma models/tables are missing in a given deployment
const safeCount = (model, args) => (prisma[model] && typeof prisma[model].count === 'function') ? prisma[model].count(args) : Promise.resolve(0)
const safeGroupBy = (model, args) => (prisma[model] && typeof prisma[model].groupBy === 'function') ? prisma[model].groupBy(args) : Promise.resolve([])
const safeAggregate = (model, args) => (prisma[model] && typeof prisma[model].aggregate === 'function') ? prisma[model].aggregate(args) : Promise.resolve({ _sum: {} })
const safeFindMany = (model, args) => (prisma[model] && typeof prisma[model].findMany === 'function') ? prisma[model].findMany(args) : Promise.resolve([])

// GET /api/dashboard/stats - Get comprehensive dashboard statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const companyId = req.user.companyId
    const userRole = req.user.role

    // Date helpers
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const where = { companyId }

    // Debugging: dump available prisma model keys to help trace unexpected values
    try {
      const modelKeys = Object.keys(prisma).filter(k => typeof prisma[k] !== 'undefined')
      console.log('DEBUG dashboard start - companyId:', companyId, 'prismaModels:', modelKeys.slice(0,40))
    } catch (dbgErr) {
      console.warn('DEBUG: failed to list prisma keys', dbgErr && dbgErr.message)
    }

    // Gather statistics defensively using the safe helpers
    const totalAssets = await safeCount('asset', { where })
    const assetsByStatus = await safeGroupBy('asset', { by: ['status'], where, _count: { id: true } })
    const assetsByCondition = await safeGroupBy('asset', { by: ['condition'], where, _count: { id: true } })
    const assetsByCategory = await safeGroupBy('asset', { by: ['categoryId'], where, _count: { id: true }, take: 5, orderBy: { _count: { id: 'desc' } } })
    const assetsThisMonth = await safeCount('asset', { where: { ...where, createdAt: { gte: firstDayOfMonth, lte: lastDayOfMonth } } })
    const assetsLastMonth = await safeCount('asset', { where: { ...where, createdAt: { gte: firstDayOfLastMonth, lte: lastDayOfLastMonth } } })
    const assetValue = await safeAggregate('asset', { where, _sum: { purchasePrice: true } })

    const totalRequests = await safeCount('assetRequest', { where })
    const requestsByStatus = await safeGroupBy('assetRequest', { by: ['status'], where, _count: { id: true } })
    const requestsThisMonth = await safeCount('assetRequest', { where: { ...where, createdAt: { gte: firstDayOfMonth, lte: lastDayOfMonth } } })
    const requestsLastMonth = await safeCount('assetRequest', { where: { ...where, createdAt: { gte: firstDayOfLastMonth, lte: lastDayOfLastMonth } } })
    const pendingApprovals = await safeCount('assetRequest', { where: { ...where, status: 'PENDING' } })

    const totalMaintenance = await safeCount('maintenanceRecord', { where })
    const maintenanceByStatus = await safeGroupBy('maintenanceRecord', { by: ['status'], where, _count: { id: true } })
    const upcomingMaintenance = await safeCount('maintenanceRecord', { where: { ...where, scheduledDate: { gte: now } } })
    const overdueMaintenance = await safeCount('maintenanceRecord', { where: { ...where, scheduledDate: { lt: now }, status: { in: ['SCHEDULED', 'IN_PROGRESS'] } } })
    const maintenanceCosts = await safeAggregate('maintenanceRecord', { where, _sum: { actualCost: true } })

    // audit_records doesn't have companyId, need to filter via asset relation if needed
    const totalAudits = await safeCount('audit_records', {})
    const scheduledAudits = await safeCount('audit_records', { where: { scheduledDate: { gte: now } } })
    const completedAudits = await safeCount('audit_records', { where: { status: 'COMPLETED' } })

    const totalUsers = await safeCount('user', { where })
    const usersByRole = await safeGroupBy('user', { by: ['role'], where, _count: { id: true } })

    const totalDepartments = await safeCount('department', { where })
    const departmentAssetCount = [] // Disabled due to complex relation name - implement if needed with correct relation

    const recentAssets = await safeFindMany('asset', { where: { ...where, createdAt: { gte: sevenDaysAgo } }, orderBy: { createdAt: 'desc' }, take: 10 })
    const recentRequests = await safeFindMany('assetRequest', { where: { ...where, createdAt: { gte: sevenDaysAgo } }, orderBy: { createdAt: 'desc' }, take: 10 })
    const recentMaintenance = await safeFindMany('maintenanceRecord', { where: { ...where, createdAt: { gte: sevenDaysAgo } }, orderBy: { createdAt: 'desc' }, take: 10 })

    const assetsByLocation = await safeGroupBy('asset', { by: ['locationId'], where, _count: { id: true }, take: 5, orderBy: { _count: { id: 'desc' } } })

    const totalVendors = await safeCount('vendor', { where })
    const totalCategories = await safeCount('category', { where })

    // Software metrics (handle missing model gracefully)
    let totalSoftware = 0
    let activeSoftware = 0
    let expiringSoftware = 0
    try {
      if (prisma.softwareAsset) {
        totalSoftware = await safeCount('softwareAsset', { where })
        activeSoftware = await safeCount('softwareAsset', { where: { ...where, status: 'ACTIVE' } })
        expiringSoftware = await safeCount('softwareAsset', { where: { ...where, expiryDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } } })
      } else if (prisma.software) {
        totalSoftware = await safeCount('software', { where })
        activeSoftware = await safeCount('software', { where: { ...where, status: 'ACTIVE' } })
        expiringSoftware = await safeCount('software', { where: { ...where, expiryDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } } })
      }
    } catch (e) {
      console.warn('Software model not present or query failed, continuing with zeros')
    }

  // Normalize defaults (ensure arrays are arrays to avoid runtime forEach/map errors)
  const ensureArray = v => Array.isArray(v) ? v : []
  const _assetsByStatus = ensureArray(assetsByStatus)
  const _assetsByCondition = ensureArray(assetsByCondition)
  const _assetsByCategory = ensureArray(assetsByCategory)
  const _assetsByLocation = ensureArray(assetsByLocation)
  const _usersByRole = ensureArray(usersByRole)
  const _departmentAssetCount = ensureArray(departmentAssetCount)
  const _recentAssets = ensureArray(recentAssets)
  const _recentRequests = ensureArray(recentRequests)
  const _recentMaintenance = ensureArray(recentMaintenance)
  const _assetValue = assetValue || { _sum: {} }
  const _maintenanceCosts = maintenanceCosts || { _sum: {} }

    // Maps - declare maps in upper scope then populate them safely; this avoids scope/undefined issues
    const assetStatusMap = { AVAILABLE: 0, IN_USE: 0, MAINTENANCE: 0, RETIRED: 0, DISPOSED: 0 }
    const assetConditionMap = { EXCELLENT: 0, GOOD: 0, FAIR: 0, POOR: 0, DAMAGED: 0 }
    const requestStatusMap = { PENDING: 0, APPROVED: 0, REJECTED: 0, COMPLETED: 0, CANCELLED: 0 }
    const maintenanceStatusMap = { SCHEDULED: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0 }

    try {
      _assetsByStatus.forEach(item => { assetStatusMap[item.status] = item._count?.id || 0 })
      _assetsByCondition.forEach(item => { assetConditionMap[item.condition] = item._count?.id || 0 })
      ensureArray(requestsByStatus).forEach(item => { requestStatusMap[item.status] = item._count?.id || 0 })
      ensureArray(maintenanceByStatus).forEach(item => { maintenanceStatusMap[item.status] = item._count?.id || 0 })
    } catch (mapErr) {
      console.error('DEBUG: failed while populating maps, types:', {
        assetsByStatusType: Object.prototype.toString.call(assetsByStatus),
        assetsByConditionType: Object.prototype.toString.call(assetsByCondition),
        requestsByStatusType: Object.prototype.toString.call(requestsByStatus),
        maintenanceByStatusType: Object.prototype.toString.call(maintenanceByStatus)
      }, mapErr)
      // keep zeroed maps in case of errors
    }

    const assetGrowth = assetsLastMonth > 0 ? ((assetsThisMonth - assetsLastMonth) / assetsLastMonth * 100).toFixed(1) : 100
    const requestGrowth = requestsLastMonth > 0 ? ((requestsThisMonth - requestsLastMonth) / requestsLastMonth * 100).toFixed(1) : 100

    const utilizationRate = totalAssets > 0 ? ((assetStatusMap.IN_USE / totalAssets) * 100).toFixed(1) : 0
    const goodConditionAssets = assetConditionMap.EXCELLENT + assetConditionMap.GOOD + assetConditionMap.FAIR
    const complianceRate = totalAssets > 0 ? ((goodConditionAssets / totalAssets) * 100).toFixed(1) : 0

    // Category and location names
    const categoryIds = (_assetsByCategory || []).map(c => c.categoryId).filter(Boolean)
    const categories = categoryIds.length ? await prisma.category.findMany({ where: { id: { in: categoryIds } }, select: { id: true, name: true } }) : []
    const categoryMap = Object.fromEntries((categories || []).map(c => [c.id, c.name]))
    const topCategories = (_assetsByCategory || []).map(item => ({ categoryId: item.categoryId, categoryName: item.categoryId ? (categoryMap[item.categoryId] || 'Unknown') : 'Uncategorized', count: item._count?.id || 0 }))

    const locationIds = (_assetsByLocation || []).map(l => l.locationId).filter(Boolean)
    const locations = locationIds.length ? await prisma.location.findMany({ where: { id: { in: locationIds } }, select: { id: true, name: true } }) : []
    const locationMap = Object.fromEntries((locations || []).map(l => [l.id, l.name]))
    const topLocations = (_assetsByLocation || []).map(item => ({ locationId: item.locationId, locationName: item.locationId ? (locationMap[item.locationId] || 'Unknown') : 'Unassigned', count: item._count?.id || 0 }))

    // Top companies by asset count (global across all companies)
    let topCompanies = []
    try {
      const assetsByCompany = await safeGroupBy('asset', { by: ['companyId'], _count: { id: true }, take: 5, orderBy: { _count: { id: 'desc' } } })
      const companyIds = (assetsByCompany || []).map(c => c.companyId).filter(Boolean)
      const companies = companyIds.length ? await prisma.company.findMany({ where: { id: { in: companyIds } }, select: { id: true, name: true } }) : []
      const companyMap = Object.fromEntries((companies || []).map(c => [c.id, c.name]))
      topCompanies = (assetsByCompany || []).map(item => ({ companyId: item.companyId, companyName: item.companyId ? (companyMap[item.companyId] || 'Unknown') : 'Unknown', count: item._count?.id || 0 }))
    } catch (e) {
      console.warn('Failed to compute top companies:', e && e.message)
      topCompanies = []
    }

    // Build response
    res.json({
      success: true,
      data: {
        overview: {
          totalAssets,
          totalRequests,
          totalMaintenance,
          totalAudits,
          totalUsers,
          totalDepartments,
          totalVendors,
          totalCategories,
          totalValue: _assetValue._sum?.purchasePrice || 0,
          utilizationRate: parseFloat(utilizationRate),
          complianceRate: parseFloat(complianceRate)
        },
        software: {
          total: totalSoftware,
          active: activeSoftware,
          available: activeSoftware,
          expiringSoon: expiringSoftware
        },
        assets: {
          total: totalAssets,
          byStatus: assetStatusMap,
          byCondition: assetConditionMap,
          thisMonth: assetsThisMonth,
          lastMonth: assetsLastMonth,
          growth: parseFloat(assetGrowth),
          topCategories,
          topLocations
        },
        requests: {
          total: totalRequests,
          byStatus: requestStatusMap,
          thisMonth: requestsThisMonth,
          lastMonth: requestsLastMonth,
          growth: parseFloat(requestGrowth),
          pendingApprovals
        },
        maintenance: {
          total: totalMaintenance,
          byStatus: maintenanceStatusMap,
          upcoming: upcomingMaintenance,
          overdue: overdueMaintenance,
          totalCost: _maintenanceCosts._sum?.cost || 0
        },
        audits: {
          total: totalAudits,
          scheduled: scheduledAudits,
          completed: completedAudits
        },
        users: {
          total: totalUsers,
          byRole: (_usersByRole || []).reduce((acc, item) => { acc[item.role] = item._count?.id || 0; return acc }, {})
        },
        departments: {
          total: totalDepartments,
          topDepartments: (_departmentAssetCount || []).map(dept => ({ id: dept.id, name: dept.name, assetCount: dept._count?.assets || 0 }))
        },
        companies: {
          topCompanies
        },
        recentActivities: {
          assets: (_recentAssets || []).map(a => ({ id: a.id, name: a.name, assetTag: a.assetTag, category: a.category?.name, location: a.location?.name, createdAt: a.createdAt })),
          requests: (_recentRequests || []).map(r => ({ id: r.id, user: r.user?.name, asset: r.asset?.name, status: r.status, createdAt: r.createdAt })),
          maintenance: (_recentMaintenance || []).map(m => ({ id: m.id, asset: m.asset?.name, type: m.type, status: m.status, createdAt: m.createdAt }))
        }
      }
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard statistics', error: error.message })
  }
})

// Temporary: unauthenticated test endpoint to debug dashboard logic locally
// NOTE: remove this before production use
router.get('/stats-test', async (req, res) => {
  try {
    const companyId = 1 // use a default test company id
    // reuse a small subset of the logic to test mapping and normalization
    const assetsByStatus = await safeGroupBy('asset', { by: ['status'], where: { companyId }, _count: { id: true } })
    const ensureArray = v => Array.isArray(v) ? v : []
    const _assetsByStatus = ensureArray(assetsByStatus)
    const assetStatusMap = { AVAILABLE: 0, IN_USE: 0, MAINTENANCE: 0, RETIRED: 0, DISPOSED: 0 }
    _assetsByStatus.forEach(item => { assetStatusMap[item.status] = item._count?.id || 0 })
    return res.json({ success: true, data: { assetStatusMap, raw: _assetsByStatus } })
  } catch (e) {
    console.error('Test endpoint failed:', e)
    return res.status(500).json({ success: false, error: e.message })
  }
})

// GET /api/dashboard/weekly-chart - Get weekly activity chart data
router.get('/weekly-chart', authenticate, async (req, res) => {
  try {
    const companyId = req.user.companyId
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const weeklyData = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const startOfDay = new Date(date.setHours(0, 0, 0, 0))
      const endOfDay = new Date(date.setHours(23, 59, 59, 999))
      const [assetCount, requestCount, maintenanceCount] = await Promise.all([
        safeCount('asset', { where: { companyId, createdAt: { gte: startOfDay, lte: endOfDay } } }),
        safeCount('assetRequest', { where: { companyId, createdAt: { gte: startOfDay, lte: endOfDay } } }),
        safeCount('maintenanceRecord', { where: { companyId, createdAt: { gte: startOfDay, lte: endOfDay } } })
      ])

      weeklyData.push({
        date: startOfDay.toISOString().split('T')[0],
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][startOfDay.getDay()],
        assets: assetCount,
        requests: requestCount,
        maintenance: maintenanceCount
      })
    }

    res.json({
      success: true,
      data: weeklyData
    })
  } catch (error) {
    console.error('Error fetching weekly chart:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch weekly chart data',
      error: error.message
    })
  }
})

module.exports = router
