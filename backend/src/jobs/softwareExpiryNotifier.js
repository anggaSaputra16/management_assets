const { PrismaClient } = require('@prisma/client');
const { prisma } = require('../config/database');

/**
 * Periodically checks software licenses for upcoming expiry or already expired
 * and creates notifications for company admins and affected users.
 *
 * @param {import('@prisma/client').PrismaClient} db
 * @param {Object} options
 * @param {number} options.intervalMs - how often to run the check (ms)
 * @param {number} options.daysBefore - window in days to consider "expiring soon"
 */
const startSoftwareExpiryNotifier = (db = prisma, options = {}) => {
  const { intervalMs = 24 * 60 * 60 * 1000, daysBefore = 7 } = options;
  let timer = null;

  const checkLicenses = async () => {
    try {
      const now = new Date();
      const windowEnd = new Date(now.getTime() + daysBefore * 24 * 60 * 60 * 1000);

      // Find licenses that have an expiry date and will expire within the windowEnd
      const licenses = await db.softwareLicense.findMany({
        where: {
          expiryDate: {
            not: null,
            lte: windowEnd
          },
          isActive: true
        },
        include: {
          softwareAsset: true
        }
      });

      if (!licenses || licenses.length === 0) {
        console.log('[softwareExpiryNotifier] No expiring licenses found');
        return;
      }

      for (const lic of licenses) {
        const status = lic.expiryDate < now ? 'EXPIRED' : 'EXPIRING';

        // Prevent spamming: skip if we already created a similar notification in the last 30 days
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const existing = await db.notification.findFirst({
          where: {
            companyId: lic.companyId,
            relatedEntityType: 'SOFTWARE_LICENSE',
            relatedEntityId: lic.id,
            type: 'SOFTWARE_LICENSE_EXPIRING',
            createdAt: { gte: thirtyDaysAgo }
          }
        });

        if (existing) {
          // already notified recently
          continue;
        }

        const formattedDate = lic.expiryDate ? new Date(lic.expiryDate).toDateString() : 'N/A';
        const title = status === 'EXPIRED' ? 'Software License Expired' : 'Software License Expiring';
        const message = `${lic.softwareAsset?.name || 'Software'} license (key: ${lic.licenseKey || '—'}) is ${status === 'EXPIRED' ? 'expired' : 'expiring'} on ${formattedDate}.`;

        // Notify company admins (ADMIN, ASSET_ADMIN, TOP_MANAGEMENT)
        const admins = await db.user.findMany({
          where: {
            companyId: lic.companyId,
            role: { in: ['ADMIN', 'ASSET_ADMIN', 'TOP_MANAGEMENT'] },
            isActive: true
          },
          select: { id: true }
        });

        const notifications = [];

        for (const a of admins) {
          notifications.push({
            title,
            message,
            type: 'SOFTWARE_LICENSE_EXPIRING',
            userId: a.id,
            companyId: lic.companyId,
            relatedEntityType: 'SOFTWARE_LICENSE',
            relatedEntityId: lic.id
          });
        }

        // Also notify installed users for this license (if any)
        const installations = await db.softwareInstallation.findMany({
          where: {
            licenseId: lic.id,
            userId: { not: null }
          },
          select: { userId: true }
        });

        for (const inst of installations) {
          notifications.push({
            title,
            message,
            type: 'SOFTWARE_LICENSE_EXPIRING',
            userId: inst.userId,
            companyId: lic.companyId,
            relatedEntityType: 'SOFTWARE_LICENSE',
            relatedEntityId: lic.id
          });
        }

        if (notifications.length > 0) {
          // createMany is fast; if duplicates happen due to race, rely on DB uniqueness not present here — acceptable for a notifier
          await db.notification.createMany({ data: notifications });
          console.log(`[softwareExpiryNotifier] Created ${notifications.length} notifications for license ${lic.id}`);
        }
      }
    } catch (error) {
      console.error('[softwareExpiryNotifier] Error during license check:', error);
    }
  };

  // Run immediately, then schedule
  checkLicenses();
  timer = setInterval(checkLicenses, intervalMs);

  return {
    stop: () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
        console.log('[softwareExpiryNotifier] Stopped');
      }
    }
  };
};

module.exports = { startSoftwareExpiryNotifier };
