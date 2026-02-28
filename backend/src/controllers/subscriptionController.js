// backend/src/controllers/subscriptionController.js
const prisma = require('../lib/prisma');
const notify = require('../lib/notify');

// ============================================================================
// HELPERS
// ============================================================================
function calculateExpiryDate(startDate, plan) {
  const date = new Date(startDate);
  switch (plan) {
    case 'monthly':    date.setDate(date.getDate() + 30);  break;
    case 'annual':     date.setDate(date.getDate() + 365); break;
    case 'free_trial': date.setDate(date.getDate() + 14);  break;
    default: return null;
  }
  return date;
}

function getSubscriptionStatus(business) {
  const now = new Date();

  if (business.subscriptionPlan === 'free_trial' && business.trialEndsAt) {
    const daysRemaining = Math.ceil((new Date(business.trialEndsAt) - now) / (1000 * 60 * 60 * 24));
    return daysRemaining <= 0
      ? { status: 'trial_expired', daysRemaining: 0 }
      : { status: 'trial_active', daysRemaining };
  }

  if (business.subscriptionExpiry) {
    const daysRemaining = Math.ceil((new Date(business.subscriptionExpiry) - now) / (1000 * 60 * 60 * 24));
    if (daysRemaining <= 0) return { status: 'expired',        daysRemaining: 0 };
    if (daysRemaining <= 7) return { status: 'expiring_soon', daysRemaining };
    return { status: 'active', daysRemaining };
  }

  return { status: 'none', daysRemaining: null };
}

// ============================================================================
// START FREE TRIAL
// ============================================================================
async function startFreeTrial(req, res) {
  if (req.user.role !== 'super-admin') {
    return res.status(403).json({ error: 'Forbidden: Super-admin access required' });
  }

  const businessId = Number(req.params.id);
  const business   = await prisma.business.findUnique({ where: { id: businessId } });

  if (!business) return res.status(404).json({ error: 'Business not found' });
  if (business.trialStartDate) {
    return res.status(400).json({ error: 'Business has already used their free trial' });
  }

  const now      = new Date();
  const trialEnd = new Date(now);
  trialEnd.setDate(trialEnd.getDate() + 14);

  const updated = await prisma.business.update({
    where: { id: businessId },
    data: {
      subscriptionPlan: 'free_trial',
      trialStartDate:   now,
      trialEndsAt:      trialEnd,
      isActive:         true,
      suspendedAt:      null,
      suspensionReason: null,
    },
  });

  // Notify the business that their trial has started
  await notify.trialStarted(businessId, trialEnd);

  console.log(`🎁 Started 14-day trial for: ${business.businessName} (ends ${trialEnd.toDateString()})`);

  res.json({ ok: true, message: '14-day free trial started', business: updated, trialEndsAt: trialEnd });
}

// ============================================================================
// UPDATE SUBSCRIPTION
// ============================================================================
async function updateSubscription(req, res) {
  if (req.user.role !== 'super-admin') {
    return res.status(403).json({ error: 'Forbidden: Super-admin access required' });
  }

  const businessId = Number(req.params.id);
  const { plan, startDate, customExpiryDate, notes, activateBusiness = true } = req.body;

  if (!['monthly', 'annual', 'none'].includes(plan)) {
    return res.status(400).json({ error: 'Invalid plan. Must be: monthly, annual, or none' });
  }

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) return res.status(404).json({ error: 'Business not found' });

  const updateData = { subscriptionPlan: plan, lastPaymentDate: new Date() };

  if (customExpiryDate) {
    updateData.subscriptionExpiry    = new Date(customExpiryDate);
    updateData.subscriptionStartDate = startDate ? new Date(startDate) : new Date();
  } else if (plan !== 'none') {
    const start                      = startDate ? new Date(startDate) : new Date();
    updateData.subscriptionStartDate = start;
    updateData.subscriptionExpiry    = calculateExpiryDate(start, plan);
  } else {
    updateData.subscriptionExpiry    = null;
    updateData.subscriptionStartDate = null;
  }

  if (notes) {
    const timestamp = new Date().toISOString();
    updateData.subscriptionNotes = `${business.subscriptionNotes || ''}\n[${timestamp}] ${notes}`.trim();
  }

  if (activateBusiness && plan !== 'none') {
    updateData.isActive         = true;
    updateData.suspendedAt      = null;
    updateData.suspensionReason = null;
  }

  const updated = await prisma.business.update({ where: { id: businessId }, data: updateData });

  // Notify the business of the subscription change
  await notify.subscription(businessId, plan, updateData.subscriptionExpiry);

  console.log(`💳 Updated subscription for ${business.businessName}: ${plan} until ${updateData.subscriptionExpiry?.toDateString() || 'N/A'}`);

  res.json({
    ok: true,
    message: 'Subscription updated successfully',
    business: updated,
    status: getSubscriptionStatus(updated),
  });
}

// ============================================================================
// GET SUBSCRIPTION STATUS
// ============================================================================
async function getSubscriptionStatusDetails(req, res) {
  const businessId = Number(req.params.id);

  if (req.user.role !== 'super-admin' && req.user.businessId !== businessId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true, slug: true, businessName: true, subscriptionPlan: true,
      subscriptionStartDate: true, subscriptionExpiry: true, trialStartDate: true,
      trialEndsAt: true, lastPaymentDate: true, isActive: true,
      suspendedAt: true, suspensionReason: true, subscriptionNotes: true,
    },
  });

  if (!business) return res.status(404).json({ error: 'Business not found' });

  const status = getSubscriptionStatus(business);

  res.json({
    ok: true,
    business,
    status,
    canStartTrial: !business.trialStartDate,
    needsPayment: status.status === 'expired' || status.status === 'trial_expired',
  });
}

// ============================================================================
// CHECK AND SUSPEND EXPIRED BUSINESSES (Cron Job Function)
// ============================================================================
async function checkAndSuspendExpired() {
  const now = new Date();
  console.log(`🔍 Checking for expired subscriptions at ${now.toISOString()}`);

  try {
    const [expiredSubscriptions, expiredTrials] = await Promise.all([
      prisma.business.findMany({
        where: {
          isActive: true,
          subscriptionExpiry: { lt: now },
          subscriptionPlan: { in: ['monthly', 'annual'] },
        },
      }),
      prisma.business.findMany({
        where: {
          isActive: true,
          trialEndsAt: { lt: now },
          subscriptionPlan: 'free_trial',
        },
      }),
    ]);

    const allExpired = [...expiredSubscriptions, ...expiredTrials];

    if (allExpired.length === 0) {
      console.log('✅ No expired subscriptions found');
      return { suspended: 0, businesses: [] };
    }

    console.log(`⚠️  Found ${allExpired.length} expired businesses to suspend`);

    const suspendedBusinesses = [];

    for (const business of allExpired) {
      const reason = business.subscriptionPlan === 'free_trial'
        ? 'Free trial period ended'
        : 'Subscription expired';

      await prisma.business.update({
        where: { id: business.id },
        data: { isActive: false, suspendedAt: now, suspensionReason: reason },
      });

      // Notify the business it has been suspended
      await notify.businessSuspended(business.id, reason);

      suspendedBusinesses.push({ id: business.id, name: business.businessName, slug: business.slug, reason });
      console.log(`⏸️  Suspended: ${business.businessName} (${reason})`);
    }

    return { suspended: suspendedBusinesses.length, businesses: suspendedBusinesses };
  } catch (error) {
    console.error('❌ Error checking expired subscriptions:', error);
    throw error;
  }
}

// ============================================================================
// GET EXPIRING SUBSCRIPTIONS (for dashboard alerts)
// ============================================================================
async function getExpiringSubscriptions(req, res) {
  if (req.user.role !== 'super-admin') {
    return res.status(403).json({ error: 'Forbidden: Super-admin access required' });
  }

  const daysThreshold = Number(req.query.days) || 7;
  const now           = new Date();
  const thresholdDate = new Date(now);
  thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

  const expiring = await prisma.business.findMany({
    where: {
      isActive: true,
      subscriptionExpiry: { gte: now, lte: thresholdDate },
    },
    orderBy: { subscriptionExpiry: 'asc' },
    include: { _count: { select: { users: true, products: true, orders: true } } },
  });

  const withStatus = expiring.map(business => ({ ...business, status: getSubscriptionStatus(business) }));

  res.json({ ok: true, count: withStatus.length, businesses: withStatus });
}

// ============================================================================
// NOTIFY EXPIRING SOON (called from cron — 7d / 3d / 1d)
// ============================================================================
async function notifyExpiringSoon() {
  const now  = new Date();
  const soon = new Date(now);
  soon.setDate(soon.getDate() + 7);

  const expiring = await prisma.business.findMany({
    where: {
      isActive: true,
      subscriptionExpiry: { gte: now, lte: soon },
    },
  });

  for (const biz of expiring) {
    const daysLeft = Math.ceil(
      (new Date(biz.subscriptionExpiry) - now) / (1000 * 60 * 60 * 24)
    );
    if ([7, 3, 1].includes(daysLeft)) {
      await notify.subscriptionExpiringSoon(biz.id, daysLeft);
      console.log(`⚠️  Expiry warning sent to ${biz.businessName} — ${daysLeft}d left`);
    }
  }
}

// ============================================================================
// BULK RENEW SUBSCRIPTIONS
// ============================================================================
async function bulkRenewSubscriptions(req, res) {
  if (req.user.role !== 'super-admin') {
    return res.status(403).json({ error: 'Forbidden: Super-admin access required' });
  }

  const { businessIds, plan } = req.body;

  if (!businessIds || !Array.isArray(businessIds) || businessIds.length === 0) {
    return res.status(400).json({ error: 'businessIds array is required' });
  }

  if (!['monthly', 'annual'].includes(plan)) {
    return res.status(400).json({ error: 'Invalid plan' });
  }

  const renewed = [];
  const errors  = [];

  for (const id of businessIds) {
    try {
      const business = await prisma.business.findUnique({ where: { id } });
      if (!business) { errors.push({ id, error: 'Business not found' }); continue; }

      const now        = new Date();
      const expiryDate = calculateExpiryDate(now, plan);

      await prisma.business.update({
        where: { id },
        data: {
          subscriptionPlan:      plan,
          subscriptionStartDate: now,
          subscriptionExpiry:    expiryDate,
          lastPaymentDate:       now,
          isActive:              true,
          suspendedAt:           null,
          suspensionReason:      null,
        },
      });

      // Notify each renewed business
      await notify.subscription(id, plan, expiryDate);

      renewed.push({ id, businessName: business.businessName, expiryDate });
    } catch (error) {
      errors.push({ id, error: error.message });
    }
  }

  res.json({ ok: true, renewed: renewed.length, errors: errors.length, details: { renewed, errors } });
}

module.exports = {
  startFreeTrial,
  updateSubscription,
  getSubscriptionStatusDetails,
  checkAndSuspendExpired,
  notifyExpiringSoon,
  getExpiringSubscriptions,
  bulkRenewSubscriptions,
};