// backend/src/controllers/statsController.js
const prisma = require('../lib/prisma');

/**
 * GET /api/stats/super-admin
 * Platform-wide statistics for super-admin dashboard
 */
async function getSuperAdminStats(req, res) {
  try {
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ error: 'Forbidden: Super-admin access required' });
    }

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all businesses count
    const totalBusinesses = await prisma.business.count();

    // Get active businesses
    const activeBusinesses = await prisma.business.count({
      where: { isActive: true }
    });

    // Get suspended businesses
    const suspendedBusinesses = await prisma.business.count({
      where: { isActive: false }
    });

    // Get businesses on trial
    const trialsActive = await prisma.business.count({
      where: { subscriptionPlan: 'free_trial' }
    });

    // Get new businesses this month
    const newBusinessesThisMonth = await prisma.business.count({
      where: {
        createdAt: { gte: firstDayOfMonth }
      }
    });

    // Get active subscriptions (paid plans)
    const activeSubscriptions = await prisma.business.count({
      where: {
        isActive: true,
        subscriptionPlan: { in: ['monthly', 'annual'] }
      }
    });

    // Get total users across all businesses
    const totalUsers = await prisma.user.count();

    // Get total orders across all businesses
    const totalOrders = await prisma.order.count();

    // Get orders this month
    const ordersThisMonth = await prisma.order.count({
      where: {
        createdAt: { gte: firstDayOfMonth }
      }
    });

    // Get total products across all businesses
    const totalProducts = await prisma.product.count();

    // Calculate total revenue (sum of all order totals)
    const revenueData = await prisma.order.aggregate({
      _sum: { totalAmount: true }, // ✅ fixed: was `total`
      where: { status: { in: ['paid', 'completed', 'delivered'] } }
    });

    const totalRevenue = revenueData._sum.totalAmount || 0; // ✅ fixed: was `_sum.total`

    // Revenue this month
    const monthRevenue = await prisma.order.aggregate({
      _sum: { totalAmount: true }, // ✅ fixed: was `total`
      where: {
        status: { in: ['paid', 'completed', 'delivered'] },
        createdAt: { gte: firstDayOfMonth }
      }
    });

    const revenueThisMonth = monthRevenue._sum.totalAmount || 0; // ✅ fixed: was `_sum.total`

    // Get pending onboarding requests
    const pendingRequests = await prisma.onboardingRequest.count({
      where: { status: 'pending' }
    });

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
      revenueThisMonth,
      subscriptionRevenue: `₦${totalRevenue.toLocaleString()}`,
      pendingRequests
    });

  } catch (error) {
    console.error('❌ Error fetching super-admin stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics',
      details: error.message 
    });
  }
}

/**
 * GET /api/stats/business/:id
 * Statistics for a specific business
 */
async function getBusinessStats(req, res) {
  try {
    const businessId = Number(req.params.id);

    // Permission check
    if (req.user.role !== 'super-admin' && req.user.businessId !== businessId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId }
    });

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get counts for this business
    const totalProducts = await prisma.product.count({
      where: { businessId }
    });

    const totalOrders = await prisma.order.count({
      where: { businessId }
    });

    const ordersThisMonth = await prisma.order.count({
      where: {
        businessId,
        createdAt: { gte: firstDayOfMonth }
      }
    });

    const totalUsers = await prisma.user.count({
      where: { businessId }
    });

    const revenue = await prisma.order.aggregate({
      _sum: { totalAmount: true }, // ✅ fixed: was `total`
      where: {
        businessId,
        status: { in: ['paid', 'completed', 'delivered'] }
      }
    });

    const totalRevenue = revenue._sum.totalAmount || 0; // ✅ fixed: was `_sum.total`

    const monthRevenue = await prisma.order.aggregate({
      _sum: { totalAmount: true }, // ✅ fixed: was `total`
      where: {
        businessId,
        status: { in: ['paid', 'completed', 'delivered'] },
        createdAt: { gte: firstDayOfMonth }
      }
    });

    const revenueThisMonth = monthRevenue._sum.totalAmount || 0; // ✅ fixed: was `_sum.total`

    res.json({
      business,
      totalProducts,
      totalOrders,
      ordersThisMonth,
      totalUsers,
      totalRevenue,
      revenueThisMonth
    });

  } catch (error) {
    console.error('❌ Error fetching business stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch business statistics',
      details: error.message 
    });
  }
}

module.exports = {
  getSuperAdminStats,
  getBusinessStats
};