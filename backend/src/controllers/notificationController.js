// backend/src/controllers/notificationController.js
const prisma = require('../lib/prisma');

/**
 * Resolve the businessId to scope queries to.
 *
 * Priority:
 *   1. req.businessId   – set by subdomain middleware from the URL
 *   2. req.user.businessId – the logged-in user's own business
 *   3. null             – only when genuinely no context (super-admin on bare localhost)
 *
 * This means a super-admin visiting houseofqg.localhost/dashboard
 * will see houseofqg's notifications, not everything.
 */
function resolveBusinessId(req) {
  if (req.businessId)            return req.businessId;
  if (req.user?.businessId)      return req.user.businessId;
  return null; // super-admin on bare localhost – no tenant filter
}

// ─── Helper: build the base where clause ────────────────────────────────────
// Returns { businessId: X } when a tenant is resolved, or {} when not.
function tenantWhere(req) {
  const id = resolveBusinessId(req);
  return id ? { businessId: id } : {};
}

// ─────────────────────────────────────────────────────────────────────────────
// GET active notifications (< 30 days old)
// ─────────────────────────────────────────────────────────────────────────────
async function getNotifications(req, res) {
  const { limit = 20, includeArchived = false } = req.query;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Base: tenant filter + optionally restrict to recent only
  const whereClause = {
    ...tenantWhere(req),
    ...(includeArchived !== 'true' && { createdAt: { gte: thirtyDaysAgo } }),
  };

  const notifications = await prisma.notification.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    take: Number(limit),
  });

  // ── unread count (active only) ────────────────────────────────────────────
  const unreadCount = await prisma.notification.count({
    where: {
      ...tenantWhere(req),
      read: false,
      createdAt: { gte: thirtyDaysAgo },
    },
  });

  // ── archived count ────────────────────────────────────────────────────────
  const archivedCount = await prisma.notification.count({
    where: {
      ...tenantWhere(req),
      createdAt: { lt: thirtyDaysAgo },
    },
  });

  res.json({ success: true, notifications, unreadCount, archivedCount });
}

// ─────────────────────────────────────────────────────────────────────────────
// GET archived notifications (>= 30 days old)
// ─────────────────────────────────────────────────────────────────────────────
async function getArchivedNotifications(req, res) {
  const { limit = 50 } = req.query;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const whereClause = {
    ...tenantWhere(req),
    createdAt: { lt: thirtyDaysAgo },
  };

  const notifications = await prisma.notification.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    take: Number(limit),
  });

  const totalArchived = await prisma.notification.count({ where: whereClause });

  res.json({ success: true, notifications, totalArchived });
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH  /:id/read  – mark single notification as read
// ─────────────────────────────────────────────────────────────────────────────
async function markAsRead(req, res) {
  const { id } = req.params;

  const notification = await prisma.notification.findUnique({
    where: { id: Number(id) },
  });

  if (!notification) {
    return res.status(404).json({ success: false, error: 'Notification not found' });
  }

  // Tenant security: the notification must belong to the resolved business
  // (or there is no tenant context at all – bare super-admin)
  const resolvedBiz = resolveBusinessId(req);
  if (resolvedBiz && notification.businessId !== resolvedBiz) {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }

  const updated = await prisma.notification.update({
    where: { id: Number(id) },
    data: { read: true, readAt: new Date() },
  });

  res.json({ success: true, notification: updated });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST  /read-all  – mark all active notifications as read
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// DELETE  /cleanup  – remove old notifications (optional cron endpoint)
// ─────────────────────────────────────────────────────────────────────────────
async function deleteOldNotifications(req, res) {
  const { days = 90 } = req.query;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - Number(days));

  const result = await prisma.notification.deleteMany({
    where: {
      ...tenantWhere(req),
      createdAt: { lt: cutoffDate },
    },
  });

  res.json({
    success: true,
    message: `Deleted ${result.count} old notifications`,
    deletedCount: result.count,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helper – used by order/payment controllers to emit notifications
// ─────────────────────────────────────────────────────────────────────────────
async function createNotification({ type, title, message, link, orderId, productId, businessId }) {
  try {
    if (!businessId) {
      console.warn('⚠️ Notification created without businessId – will not appear in any tenant dashboard');
    }

    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        message,
        link,
        orderId,
        productId,
        businessId,
        read: false,
      },
    });

    console.log(`📬 Created notification for business ${businessId}: ${title}`);
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
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