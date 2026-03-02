// backend/src/controllers/statsController.js
const prisma = require('../lib/prisma');

// ============================================================================
// REVENUE HELPERS
// ============================================================================
// Orders count as revenue when status = DELIVERED (confirmed delivery)
// OR paymentStatus = CONFIRMED (payment already collected).
// Both conditions are ORed so we capture cash-on-delivery (DELIVERED) and
// pre-paid online orders (CONFIRMED payment) without double-counting.
const REVENUE_STATUSES = ['DELIVERED'];
const PAYMENT_CONFIRMED = 'CONFIRMED';

function revenueWhere(extra = {}) {
  return {
    OR: [
      { status: { in: REVENUE_STATUSES } },
      { paymentStatus: PAYMENT_CONFIRMED },
    ],
    ...extra,
  };
}

function startOf(unit) {
  const now = new Date();
  if (unit === 'day')   return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (unit === 'month') return new Date(now.getFullYear(), now.getMonth(), 1);
  if (unit === 'year')  return new Date(now.getFullYear(), 0, 1);
  return now;
}

async function sumRevenue(where) {
  const res = await prisma.order.aggregate({ _sum: { totalAmount: true }, where });
  return Number(res._sum.totalAmount || 0);
}

// ============================================================================
// GET /api/stats/super-admin
// Platform-wide statistics for super-admin dashboard
// ============================================================================
async function getSuperAdminStats(req, res) {
  try {
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ error: 'Forbidden: Super-admin access required' });
    }

    const now              = new Date();
    const firstDayOfMonth  = startOf('month');
    const firstDayOfYear   = startOf('year');
    const startOfToday     = startOf('day');

    const [
      totalBusinesses,
      activeBusinesses,
      suspendedBusinesses,
      trialsActive,
      newBusinessesThisMonth,
      activeSubscriptions,
      totalUsers,
      totalOrders,
      ordersThisMonth,
      totalProducts,
      pendingRequests,
    ] = await Promise.all([
      prisma.business.count(),
      prisma.business.count({ where: { isActive: true } }),
      prisma.business.count({ where: { isActive: false } }),
      prisma.business.count({ where: { subscriptionPlan: 'free_trial' } }),
      prisma.business.count({ where: { createdAt: { gte: firstDayOfMonth } } }),
      prisma.business.count({ where: { isActive: true, subscriptionPlan: { in: ['monthly', 'annual'] } } }),
      prisma.user.count(),
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: firstDayOfMonth } } }),
      prisma.product.count(),
      prisma.onboardingRequest.count({ where: { status: 'pending' } }),
    ]);

    // ── Revenue (correct uppercase status) ────────────────────────────────
    const [totalRevenue, revenueToday, revenueThisMonth, revenueThisYear] = await Promise.all([
      sumRevenue(revenueWhere()),
      sumRevenue(revenueWhere({ createdAt: { gte: startOfToday } })),
      sumRevenue(revenueWhere({ createdAt: { gte: firstDayOfMonth } })),
      sumRevenue(revenueWhere({ createdAt: { gte: firstDayOfYear } })),
    ]);

    res.json({
      totalBusinesses,
      activeBusinesses,
      suspendedBusinesses,
      trialsActive,
      newBusinessesThisMonth,
      activeSubscriptions,
      totalUsers,
      totalOrders,
      ordersThisMonth,
      totalProducts,
      totalRevenue,
      revenueToday,
      revenueThisMonth,
      revenueThisYear,
      subscriptionRevenue: `₦${totalRevenue.toLocaleString()}`,
      pendingRequests,
    });
  } catch (error) {
    console.error('❌ Error fetching super-admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics', details: error.message });
  }
}

// ============================================================================
// GET /api/stats/business/:id
// Per-business stats — used by super-admin business detail and business dashboard
// ============================================================================
async function getBusinessStats(req, res) {
  try {
    const businessId = Number(req.params.id);

    if (req.user.role !== 'super-admin' && req.user.businessId !== businessId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return res.status(404).json({ error: 'Business not found' });

    const firstDayOfMonth = startOf('month');
    const firstDayOfYear  = startOf('year');
    const startOfToday    = startOf('day');

    const [
      totalProducts,
      totalOrders,
      ordersThisMonth,
      totalUsers,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
    ] = await Promise.all([
      prisma.product.count({ where: { businessId } }),
      prisma.order.count({ where: { businessId } }),
      prisma.order.count({ where: { businessId, createdAt: { gte: firstDayOfMonth } } }),
      prisma.user.count({ where: { businessId } }),
      prisma.order.count({ where: { businessId, status: 'PENDING' } }),
      prisma.order.count({ where: { businessId, status: 'DELIVERED' } }),
      prisma.order.count({ where: { businessId, status: 'CANCELLED' } }),
    ]);

    // ── Revenue breakdown ─────────────────────────────────────────────────
    const biz = { businessId };
    const [totalRevenue, revenueToday, revenueThisMonth, revenueThisYear] = await Promise.all([
      sumRevenue(revenueWhere(biz)),
      sumRevenue(revenueWhere({ ...biz, createdAt: { gte: startOfToday } })),
      sumRevenue(revenueWhere({ ...biz, createdAt: { gte: firstDayOfMonth } })),
      sumRevenue(revenueWhere({ ...biz, createdAt: { gte: firstDayOfYear } })),
    ]);

    // ── Revenue since listing ─────────────────────────────────────────────
    const listedSince = business.createdAt;

    // ── Daily revenue for the last 30 days (for charts) ───────────────────
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dailyOrders = await prisma.order.findMany({
      where: revenueWhere({ businessId, createdAt: { gte: thirtyDaysAgo } }),
      select: { createdAt: true, totalAmount: true },
    });

    // Group by date string YYYY-MM-DD
    const dailyMap = {};
    for (const o of dailyOrders) {
      const key = o.createdAt.toISOString().slice(0, 10);
      dailyMap[key] = (dailyMap[key] || 0) + Number(o.totalAmount);
    }

    // Build a sorted array for the last 30 days
    const dailyRevenue = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      dailyRevenue.push({ date: key, revenue: dailyMap[key] || 0 });
    }

    res.json({
      business,
      listedSince,
      totalProducts,
      totalOrders,
      ordersThisMonth,
      totalUsers,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
      revenueToday,
      revenueThisMonth,
      revenueThisYear,
      dailyRevenue,           // array of { date, revenue } — last 30 days
    });
  } catch (error) {
    console.error('❌ Error fetching business stats:', error);
    res.status(500).json({ error: 'Failed to fetch business statistics', details: error.message });
  }
}

// ============================================================================
// GET /api/stats/all-businesses
// Super-admin: revenue + order counts for every business (for the business list)
// ============================================================================
async function getAllBusinessesStats(req, res) {
  try {
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const businesses = await prisma.business.findMany({
      select: { id: true, businessName: true, slug: true, createdAt: true },
    });

    const firstDayOfMonth = startOf('month');
    const firstDayOfYear  = startOf('year');
    const startOfToday    = startOf('day');

    const results = await Promise.all(
      businesses.map(async (b) => {
        const biz = { businessId: b.id };
        const [
          totalProducts,
          totalOrders,
          totalRevenue,
          revenueToday,
          revenueThisMonth,
          revenueThisYear,
        ] = await Promise.all([
          prisma.product.count({ where: biz }),
          prisma.order.count({ where: biz }),
          sumRevenue(revenueWhere(biz)),
          sumRevenue(revenueWhere({ ...biz, createdAt: { gte: startOfToday } })),
          sumRevenue(revenueWhere({ ...biz, createdAt: { gte: firstDayOfMonth } })),
          sumRevenue(revenueWhere({ ...biz, createdAt: { gte: firstDayOfYear } })),
        ]);

        return {
          id: b.id,
          businessName: b.businessName,
          slug: b.slug,
          listedSince: b.createdAt,
          totalProducts,
          totalOrders,
          totalRevenue,
          revenueToday,
          revenueThisMonth,
          revenueThisYear,
        };
      })
    );

    res.json({ success: true, businesses: results });
  } catch (error) {
    console.error('❌ Error fetching all-businesses stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats', details: error.message });
  }
}

module.exports = { getSuperAdminStats, getBusinessStats, getAllBusinessesStats };