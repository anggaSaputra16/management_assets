const express = require('express');
const Joi = require('joi');
const { prisma } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const createNotificationSchema = Joi.object({
  title: Joi.string().required(),
  message: Joi.string().required(),
  type: Joi.string().valid('REQUEST_APPROVAL', 'ASSET_ALLOCATION', 'MAINTENANCE_DUE', 'AUDIT_SCHEDULED', 'GENERAL').required(),
  userId: Joi.string().required()
});

const markAsReadSchema = Joi.object({
  notificationIds: Joi.array().items(Joi.string()).required()
});

// Get all notifications for current user
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, isRead, type } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      userId: req.user.id
    };

    if (isRead !== undefined) {
      where.isRead = isRead === 'true';
    }

    if (type) {
      where.type = type;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          userId: req.user.id,
          isRead: false
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        },
        unreadCount
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get notification by ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if notification belongs to current user
    if (notification.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this notification'
      });
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
});

// Create notification (Admin/Asset Admin only)
router.post('/', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res, next) => {
  try {
    const { error, value } = createNotificationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: value.userId }
    });

    if (!targetUser) {
      return res.status(400).json({
        success: false,
        message: 'Target user not found'
      });
    }

    // Create notification
    const notification = await prisma.notification.create({
      data: value
    });

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: notification
    });
  } catch (error) {
    next(error);
  }
});

// Broadcast notification to multiple users (Admin/Asset Admin only)
router.post('/broadcast', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res, next) => {
  try {
    const broadcastSchema = Joi.object({
      title: Joi.string().required(),
      message: Joi.string().required(),
      type: Joi.string().valid('REQUEST_APPROVAL', 'ASSET_ALLOCATION', 'MAINTENANCE_DUE', 'AUDIT_SCHEDULED', 'GENERAL').required(),
      userIds: Joi.array().items(Joi.string()).min(1).required()
    });

    const { error, value } = broadcastSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    // Check if all target users exist
    const targetUsers = await prisma.user.findMany({
      where: {
        id: { in: value.userIds },
        isActive: true
      },
      select: { id: true }
    });

    if (targetUsers.length !== value.userIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some target users not found or inactive'
      });
    }

    // Create notifications for all users
    const notificationData = value.userIds.map(userId => ({
      title: value.title,
      message: value.message,
      type: value.type,
      userId
    }));

    await prisma.notification.createMany({
      data: notificationData
    });

    res.status(201).json({
      success: true,
      message: `Notification sent to ${value.userIds.length} users`,
      data: {
        userCount: value.userIds.length,
        title: value.title,
        type: value.type
      }
    });
  } catch (error) {
    next(error);
  }
});

// Broadcast to role (Admin/Asset Admin only)
router.post('/broadcast-role', authenticate, authorize('ADMIN', 'ASSET_ADMIN'), async (req, res, next) => {
  try {
    const broadcastRoleSchema = Joi.object({
      title: Joi.string().required(),
      message: Joi.string().required(),
      type: Joi.string().valid('REQUEST_APPROVAL', 'ASSET_ALLOCATION', 'MAINTENANCE_DUE', 'AUDIT_SCHEDULED', 'GENERAL').required(),
      roles: Joi.array().items(
        Joi.string().valid('ADMIN', 'ASSET_ADMIN', 'MANAGER', 'DEPARTMENT_USER', 'TECHNICIAN', 'AUDITOR', 'TOP_MANAGEMENT')
      ).min(1).required(),
      departmentId: Joi.string().optional()
    });

    const { error, value } = broadcastRoleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    // Build user filter
    const userWhere = {
      role: { in: value.roles },
      isActive: true
    };

    if (value.departmentId) {
      userWhere.departmentId = value.departmentId;
    }

    // Get target users
    const targetUsers = await prisma.user.findMany({
      where: userWhere,
      select: { id: true }
    });

    if (targetUsers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No users found matching the criteria'
      });
    }

    // Create notifications for all matching users
    const notificationData = targetUsers.map(user => ({
      title: value.title,
      message: value.message,
      type: value.type,
      userId: user.id
    }));

    await prisma.notification.createMany({
      data: notificationData
    });

    res.status(201).json({
      success: true,
      message: `Notification sent to ${targetUsers.length} users with roles: ${value.roles.join(', ')}`,
      data: {
        userCount: targetUsers.length,
        title: value.title,
        type: value.type,
        roles: value.roles
      }
    });
  } catch (error) {
    next(error);
  }
});

// Mark notifications as read
router.put('/mark-read', authenticate, async (req, res, next) => {
  try {
    const { error, value } = markAsReadSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }

    // Update notifications (only user's own notifications)
    const result = await prisma.notification.updateMany({
      where: {
        id: { in: value.notificationIds },
        userId: req.user.id
      },
      data: {
        isRead: true
      }
    });

    res.json({
      success: true,
      message: `${result.count} notifications marked as read`,
      data: {
        updatedCount: result.count
      }
    });
  } catch (error) {
    next(error);
  }
});

// Mark all notifications as read
router.put('/mark-all-read', authenticate, async (req, res, next) => {
  try {
    const result = await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    res.json({
      success: true,
      message: `${result.count} notifications marked as read`,
      data: {
        updatedCount: result.count
      }
    });
  } catch (error) {
    next(error);
  }
});

// Delete notification
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if notification exists and belongs to user
    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    if (notification.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this notification'
      });
    }

    // Delete notification
    await prisma.notification.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Delete all read notifications
router.delete('/read/all', authenticate, async (req, res, next) => {
  try {
    const result = await prisma.notification.deleteMany({
      where: {
        userId: req.user.id,
        isRead: true
      }
    });

    res.json({
      success: true,
      message: `${result.count} read notifications deleted`,
      data: {
        deletedCount: result.count
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get notification statistics
router.get('/statistics/overview', authenticate, async (req, res, next) => {
  try {
    const [
      totalNotifications,
      unreadNotifications,
      notificationsByType,
      recentNotifications
    ] = await Promise.all([
      prisma.notification.count({
        where: { userId: req.user.id }
      }),
      prisma.notification.count({
        where: { 
          userId: req.user.id,
          isRead: false 
        }
      }),
      prisma.notification.groupBy({
        by: ['type'],
        where: { userId: req.user.id },
        _count: true
      }),
      prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          type: true,
          isRead: true,
          createdAt: true
        }
      })
    ]);

    const statistics = {
      totalNotifications,
      unreadNotifications,
      notificationsByType,
      recentNotifications
    };

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    next(error);
  }
});

// System notification helpers (used internally by other routes)
const createSystemNotification = async (userId, title, message, type) => {
  try {
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type
      }
    });
  } catch (error) {
    console.error('Failed to create system notification:', error);
  }
};

const notifyRequestApproval = async (requesterId, requestNumber) => {
  await createSystemNotification(
    requesterId,
    'Request Approved',
    `Your asset request ${requestNumber} has been approved.`,
    'REQUEST_APPROVAL'
  );
};

const notifyRequestRejection = async (requesterId, requestNumber, reason) => {
  await createSystemNotification(
    requesterId,
    'Request Rejected',
    `Your asset request ${requestNumber} has been rejected. Reason: ${reason}`,
    'REQUEST_APPROVAL'
  );
};

const notifyAssetAllocation = async (userId, assetTag) => {
  await createSystemNotification(
    userId,
    'Asset Allocated',
    `Asset ${assetTag} has been allocated to you.`,
    'ASSET_ALLOCATION'
  );
};

const notifyMaintenanceDue = async (technicianId, assetTag, scheduledDate) => {
  await createSystemNotification(
    technicianId,
    'Maintenance Due',
    `Maintenance for asset ${assetTag} is scheduled for ${scheduledDate.toDateString()}.`,
    'MAINTENANCE_DUE'
  );
};

const notifyAuditScheduled = async (auditorId, auditType, scheduledDate) => {
  await createSystemNotification(
    auditorId,
    'Audit Scheduled',
    `${auditType} audit is scheduled for ${scheduledDate.toDateString()}.`,
    'AUDIT_SCHEDULED'
  );
};

// Export notification helpers for use in other routes
module.exports = router;
module.exports.createSystemNotification = createSystemNotification;
module.exports.notifyRequestApproval = notifyRequestApproval;
module.exports.notifyRequestRejection = notifyRequestRejection;
module.exports.notifyAssetAllocation = notifyAssetAllocation;
module.exports.notifyMaintenanceDue = notifyMaintenanceDue;
module.exports.notifyAuditScheduled = notifyAuditScheduled;
