// backend/src/controllers/notificationController.js
const prisma = require('../lib/prisma');

function resolveBusinessId(req) {
  if (req.businessId)        return req.businessId;
  if (req.user?.businessId)  return req.user.businessId;
  return null;
}

function tenantWhere(req) {
  const id = resolveBusinessId(req);
  return id ? { businessId: id } : {};
}

// ─── GET notifications ────────────────────────────────────────────────────────
async function getNotifications(req, res) {
  const { limit = 30 } = req.query;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const where = {
    ...tenantWhere(req),
    createdAt: { gte: thirtyDaysAgo },
  };

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
    }),
    prisma.notification.count({
      where: { ...tenantWhere(req), read: false, createdAt: { gte: thirtyDaysAgo } },
    }),
  ]);

  res.json({ success: true, notifications, unreadCount });
}

// ─── PATCH /:id/read ──────────────────────────────────────────────────────────
async function markAsRead(req, res) {
  const id = Number(req.params.id);
  const notification = await prisma.notification.findUnique({ where: { id } });

  if (!notification) return res.status(404).json({ success: false, error: 'Not found' });

  const biz = resolveBusinessId(req);
  if (biz && notification.businessId !== biz) {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { read: true, readAt: new Date() },
  });

  res.json({ success: true, notification: updated });
}

// ─── POST /read-all ───────────────────────────────────────────────────────────
async function markAllAsRead(req, res) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  await prisma.notification.updateMany({
    where: {
      ...tenantWhere(req),
      read: false,
      createdAt: { gte: thirtyDaysAgo },
    },
    data: { read: true, readAt: new Date() },
  });

  res.json({ success: true, message: 'All notifications marked as read' });
}

// ─── GET archived notifications (>= 30 days old) ─────────────────────────────
async function getArchivedNotifications(req, res) {
  const { limit = 50 } = req.query;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const whereClause = {
    ...tenantWhere(req),
    createdAt: { lt: thirtyDaysAgo },
  };

  const [notifications, totalArchived] = await Promise.all([
    prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
    }),
    prisma.notification.count({ where: whereClause }),
  ]);

  res.json({ success: true, notifications, totalArchived });
}

// ─── DELETE /cleanup ──────────────────────────────────────────────────────────
async function deleteOldNotifications(req, res) {
  const { days = 90 } = req.query;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - Number(days));

  const result = await prisma.notification.deleteMany({
    where: { ...tenantWhere(req), createdAt: { lt: cutoff } },
  });

  res.json({ success: true, deletedCount: result.count });
}

// ─── Internal helper (called by other controllers) ────────────────────────────
async function createNotification({ type, title, message, link, orderId, productId, businessId }) {
  try {
    if (!businessId) {
      console.warn('⚠️  createNotification called without businessId — skipped');
      return null;
    }
    const n = await prisma.notification.create({
      data: { type, title, message, link, orderId, productId, businessId, read: false },
    });
    console.log(`📬 Notification [${type}] → business ${businessId}: ${title}`);
    return n;
  } catch (err) {
    console.error('❌ createNotification failed:', err.message);
    return null;
  }
}

module.exports = {
  getNotifications,
  getArchivedNotifications,
  markAsRead,
  markAllAsRead,
  deleteOldNotifications,
  createNotification,
};