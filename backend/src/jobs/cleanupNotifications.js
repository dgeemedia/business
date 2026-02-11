// backend/src/jobs/cleanupNotifications.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupOldNotifications(daysToKeep = 90) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    console.log(`🧹 Starting notification cleanup for notifications older than ${daysToKeep} days...`);
    
    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate }
      }
    });
    
    console.log(`✅ Cleanup complete: Deleted ${result.count} old notifications`);
    return result.count;
  } catch (error) {
    console.error('❌ Notification cleanup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// If run directly (not imported)
if (require.main === module) {
  cleanupOldNotifications()
    .then(count => {
      console.log(`Script completed. Deleted ${count} notifications.`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanupOldNotifications };