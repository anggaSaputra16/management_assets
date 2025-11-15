const cron = require('node-cron');
const { prisma } = require('../config/database');

/**
 * Loan Notification Scheduler
 * Runs daily at 09:00 AM to check for:
 * 1. Loans due today
 * 2. Loans overdue
 * 3. Loans due in 3 days (reminder)
 */

const checkAndNotifyOverdueLoans = async () => {
  try {
    console.log('[Loan Scheduler] Checking for overdue and due loans...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    // Find active loans that are overdue
    const overdueLoans = await prisma.inventoryLoan.findMany({
      where: {
        status: 'ACTIVE',
        expectedReturnDate: {
          lt: today
        }
      },
      include: {
        borrowerEmployee: {
          select: { id: true, email: true, firstName: true, lastName: true, companyId: true, users: { select: { id: true } } }
        },
        responsibleEmployee: {
          select: { id: true, email: true, firstName: true, lastName: true, users: { select: { id: true } } }
        },
        requestedBy: {
          select: { id: true, email: true, firstName: true, lastName: true }
        },
        approvedBy: {
          select: { id: true, email: true, firstName: true, lastName: true }
        },
        inventory: {
          include: {
            assets: { select: { name: true, assetTag: true, companyId: true } },
            departments: { select: { name: true } }
          }
        }
      }
    });

    // Find active loans due today
    const dueToday = await prisma.inventoryLoan.findMany({
      where: {
        status: 'ACTIVE',
        expectedReturnDate: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        borrowerEmployee: {
          select: { id: true, email: true, firstName: true, lastName: true, companyId: true, users: { select: { id: true } } }
        },
        responsibleEmployee: {
          select: { id: true, email: true, firstName: true, lastName: true, users: { select: { id: true } } }
        },
        requestedBy: {
          select: { id: true, email: true, firstName: true, lastName: true }
        },
        approvedBy: {
          select: { id: true, email: true, firstName: true, lastName: true }
        },
        inventory: {
          include: {
            assets: { select: { name: true, assetTag: true, companyId: true } },
            departments: { select: { name: true } }
          }
        }
      }
    });

    // Find active loans due in 3 days (reminder)
    const dueSoon = await prisma.inventoryLoan.findMany({
      where: {
        status: 'ACTIVE',
        expectedReturnDate: {
          gte: threeDaysFromNow,
          lt: new Date(threeDaysFromNow.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      include: {
        borrowerEmployee: {
          select: { id: true, email: true, firstName: true, lastName: true, companyId: true, users: { select: { id: true } } }
        },
        responsibleEmployee: {
          select: { id: true, email: true, firstName: true, lastName: true, users: { select: { id: true } } }
        },
        requestedBy: {
          select: { id: true, email: true, firstName: true, lastName: true }
        },
        approvedBy: {
          select: { id: true, email: true, firstName: true, lastName: true }
        },
        inventory: {
          include: {
            assets: { select: { name: true, assetTag: true } },
            departments: { select: { name: true } }
          }
        }
      }
    });

    // Update overdue loans status
    if (overdueLoans.length > 0) {
      await prisma.inventoryLoan.updateMany({
        where: {
          id: {
            in: overdueLoans.map(l => l.id)
          }
        },
        data: {
          status: 'OVERDUE'
        }
      });
    }

    // Create notifications for overdue loans
    for (const loan of overdueLoans) {
      const daysOverdue = Math.floor((today - new Date(loan.expectedReturnDate)) / (1000 * 60 * 60 * 24));
      const companyId = loan.inventory.asset.companyId;
      const borrowerName = `${loan.borrowerEmployee.firstName} ${loan.borrowerEmployee.lastName}`;
      
      // Notify borrower employee's user account (if exists)
      if (loan.borrowerEmployee.user?.id) {
        await createNotification({
          userId: loan.borrowerEmployee.user.id,
          companyId,
          title: `⚠️ Loan Overdue - ${loan.loanNumber}`,
          message: `Your loan for "${loan.inventory.asset.name}" is ${daysOverdue} day(s) overdue. Please return immediately.`,
          type: 'MAINTENANCE_OVERDUE',
          priority: 'HIGH',
          actionUrl: `/inventory/loans?id=${loan.id}`,
          actionLabel: 'View Loan',
          relatedEntityType: 'INVENTORY_LOAN',
          relatedEntityId: loan.id
        });
      }

      // Notify responsible employee's user account (if exists)
      if (loan.responsibleEmployee.user?.id) {
        await createNotification({
          userId: loan.responsibleEmployee.user.id,
          companyId,
          title: `⚠️ Loan Overdue - ${loan.loanNumber}`,
          message: `Loan "${loan.loanNumber}" for ${borrowerName} - "${loan.inventory.asset.name}" is ${daysOverdue} day(s) overdue.`,
          type: 'MAINTENANCE_OVERDUE',
          priority: 'HIGH',
          actionUrl: `/inventory/loans?id=${loan.id}`,
          actionLabel: 'View Loan',
          relatedEntityType: 'INVENTORY_LOAN',
          relatedEntityId: loan.id
        });
      }

      // Notify requester (user who created the loan)
      if (loan.requestedBy) {
        await createNotification({
          userId: loan.requestedBy.id,
          companyId,
          title: `⚠️ Loan Overdue - ${loan.loanNumber}`,
          message: `Loan "${loan.loanNumber}" that you created for ${borrowerName} is ${daysOverdue} day(s) overdue.`,
          type: 'MAINTENANCE_OVERDUE',
          priority: 'HIGH',
          actionUrl: `/inventory/loans?id=${loan.id}`,
          actionLabel: 'View Loan',
          relatedEntityType: 'INVENTORY_LOAN',
          relatedEntityId: loan.id
        });
      }

      // Notify approver if exists
      if (loan.approvedBy) {
        await createNotification({
          userId: loan.approvedBy.id,
          companyId,
          title: `⚠️ Loan Overdue - ${loan.loanNumber}`,
          message: `Loan "${loan.loanNumber}" that you approved is ${daysOverdue} day(s) overdue.`,
          type: 'MAINTENANCE_OVERDUE',
          priority: 'HIGH',
          actionUrl: `/inventory/loans?id=${loan.id}`,
          actionLabel: 'View Loan',
          relatedEntityType: 'INVENTORY_LOAN',
          relatedEntityId: loan.id
        });
      }
    }

    // Create notifications for loans due today
    for (const loan of dueToday) {
      const companyId = loan.inventory.asset.companyId;
      const borrowerName = `${loan.borrowerEmployee.firstName} ${loan.borrowerEmployee.lastName}`;
      
      // Notify borrower employee's user account (if exists)
      if (loan.borrowerEmployee.user?.id) {
        await createNotification({
          userId: loan.borrowerEmployee.user.id,
          companyId,
          title: `🔔 Loan Due Today - ${loan.loanNumber}`,
          message: `Your loan for "${loan.inventory.asset.name}" is due for return today.`,
          type: 'MAINTENANCE_DUE',
          priority: 'HIGH',
          actionUrl: `/inventory/loans?id=${loan.id}`,
          actionLabel: 'View Loan',
          relatedEntityType: 'INVENTORY_LOAN',
          relatedEntityId: loan.id
        });
      }

      // Notify responsible employee's user account (if exists)
      if (loan.responsibleEmployee.user?.id) {
        await createNotification({
          userId: loan.responsibleEmployee.user.id,
          companyId,
          title: `🔔 Loan Due Today - ${loan.loanNumber}`,
          message: `Loan "${loan.loanNumber}" for ${borrowerName} - "${loan.inventory.asset.name}" is due for return today.`,
          type: 'MAINTENANCE_DUE',
          priority: 'MEDIUM',
          actionUrl: `/inventory/loans?id=${loan.id}`,
          actionLabel: 'View Loan',
          relatedEntityType: 'INVENTORY_LOAN',
          relatedEntityId: loan.id
        });
      }

      // Notify requester
      if (loan.requestedBy) {
        await createNotification({
          userId: loan.requestedBy.id,
          companyId,
          title: `🔔 Loan Due Today - ${loan.loanNumber}`,
          message: `Loan "${loan.loanNumber}" that you created for ${borrowerName} is due for return today.`,
          type: 'MAINTENANCE_DUE',
          priority: 'MEDIUM',
          actionUrl: `/inventory/loans?id=${loan.id}`,
          actionLabel: 'View Loan',
          relatedEntityType: 'INVENTORY_LOAN',
          relatedEntityId: loan.id
        });
      }
    }

    // Create notifications for loans due soon (3 days reminder)
    for (const loan of dueSoon) {
      const companyId = loan.inventory.asset.companyId;
      const borrowerName = `${loan.borrowerEmployee.firstName} ${loan.borrowerEmployee.lastName}`;
      
      // Notify borrower employee's user account (if exists)
      if (loan.borrowerEmployee.user?.id) {
        await createNotification({
          userId: loan.borrowerEmployee.user.id,
          companyId,
          title: `📅 Loan Due in 3 Days - ${loan.loanNumber}`,
          message: `Reminder: Your loan for "${loan.inventory.asset.name}" is due in 3 days (${new Date(loan.expectedReturnDate).toLocaleDateString()}).`,
          type: 'MAINTENANCE_DUE',
          priority: 'MEDIUM',
          actionUrl: `/inventory/loans?id=${loan.id}`,
          actionLabel: 'View Loan',
          relatedEntityType: 'INVENTORY_LOAN',
          relatedEntityId: loan.id
        });
      }

      // Notify responsible employee's user account (if exists)
      if (loan.responsibleEmployee.user?.id) {
        await createNotification({
          userId: loan.responsibleEmployee.user.id,
          companyId,
          title: `📅 Loan Due in 3 Days - ${loan.loanNumber}`,
          message: `Loan "${loan.loanNumber}" for ${borrowerName} - "${loan.inventory.asset.name}" is due in 3 days.`,
          type: 'MAINTENANCE_DUE',
          priority: 'MEDIUM',
          actionUrl: `/inventory/loans?id=${loan.id}`,
          actionLabel: 'View Loan',
          relatedEntityType: 'INVENTORY_LOAN',
          relatedEntityId: loan.id
        });
      }

      // Notify requester
      if (loan.requestedBy) {
        await createNotification({
          userId: loan.requestedBy.id,
          companyId,
          title: `📅 Loan Due in 3 Days - ${loan.loanNumber}`,
          message: `Loan "${loan.loanNumber}" that you created for ${borrowerName} is due in 3 days.`,
          type: 'MAINTENANCE_DUE',
          priority: 'LOW',
          actionUrl: `/inventory/loans?id=${loan.id}`,
          actionLabel: 'View Loan',
          relatedEntityType: 'INVENTORY_LOAN',
          relatedEntityId: loan.id
        });
      }
    }

    console.log(`[Loan Scheduler] Processed: ${overdueLoans.length} overdue, ${dueToday.length} due today, ${dueSoon.length} due soon`);
  } catch (error) {
    console.error('[Loan Scheduler] Error:', error);
  }
};

// Helper function to create notification
const createNotification = async (data) => {
  try {
    await prisma.notifications.create({
      data: {
        userId: data.userId,
        companyId: data.companyId,
        title: data.title,
        message: data.message,
        type: data.type,
        priority: data.priority || 'MEDIUM',
        actionUrl: data.actionUrl,
        actionLabel: data.actionLabel,
        relatedEntityType: data.relatedEntityType,
        relatedEntityId: data.relatedEntityId
      }
    });
  } catch (error) {
    console.error('[Loan Scheduler] Failed to create notification:', error);
  }
};

// Schedule job to run daily at 09:00 AM
const startScheduler = () => {
  // Run at 9 AM every day
  cron.schedule('0 9 * * *', async () => {
    console.log('[Loan Scheduler] Running daily check at 09:00 AM');
    await checkAndNotifyOverdueLoans();
  });

  // Also run every 6 hours for more frequent checks
  cron.schedule('0 */6 * * *', async () => {
    console.log('[Loan Scheduler] Running 6-hour check');
    await checkAndNotifyOverdueLoans();
  });

  console.log('[Loan Scheduler] Scheduler started - Daily at 09:00 AM and every 6 hours');
  
  // Run once immediately on startup
  checkAndNotifyOverdueLoans();
};

module.exports = {
  startScheduler,
  checkAndNotifyOverdueLoans
};
