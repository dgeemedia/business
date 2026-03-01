// backend/src/middleware/auth.js
const jwt    = require('jsonwebtoken');
const prisma = require('../lib/prisma');

// ============================================================================
// CORE AUTH
// ============================================================================
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const token   = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Normalize role to lowercase so all checks work consistently
    req.user       = { ...decoded, role: decoded.role?.toLowerCase() };
    req.businessId = decoded.businessId || null;

    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ============================================================================
// ROLE GUARDS
// ============================================================================
function requireSuperAdmin(req, res, next) {
  if (req.user.role !== 'super-admin') {
    return res.status(403).json({ error: 'Forbidden: Super admin access required' });
  }
  next();
}

function requireAdmin(req, res, next) {
  const role = req.user.role;
  if (role !== 'super-admin' && role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
}

function preventStaff(req, res, next) {
  if (req.user.role === 'staff') {
    return res.status(403).json({ error: 'Forbidden: Staff cannot access this resource' });
  }
  next();
}

// ============================================================================
// SUBSCRIPTION GUARD
// Checks in real-time whether the business subscription/trial is still valid.
// Super-admins always bypass this check.
// Fails open on DB errors so a database hiccup doesn't lock everyone out.
// ============================================================================
async function requireActiveSubscription(req, res, next) {
  // Super-admins are never gated
  if (req.user.role === 'super-admin') return next();

  // Users with no businessId (shouldn't happen, but guard anyway)
  const businessId = req.user.businessId;
  if (!businessId) return next();

  try {
    const business = await prisma.business.findUnique({
      where:  { id: businessId },
      select: {
        isActive:           true,
        subscriptionPlan:   true,
        subscriptionExpiry: true,
        trialEndsAt:        true,
        suspensionReason:   true,
      },
    });

    if (!business) {
      return res.status(403).json({ error: 'Business not found', code: 'BUSINESS_NOT_FOUND' });
    }

    const now = new Date();

    // ── Free trial expired ────────────────────────────────────────────────
    if (business.subscriptionPlan === 'free_trial') {
      if (!business.trialEndsAt || new Date(business.trialEndsAt) < now) {
        // Auto-suspend so the cron doesn't need to run first
        await prisma.business.update({
          where: { id: businessId },
          data:  { isActive: false, suspendedAt: now, suspensionReason: 'Free trial period ended' },
        });
        return res.status(403).json({
          error: 'Your free trial has expired. Please subscribe to continue.',
          code:  'TRIAL_EXPIRED',
        });
      }
    }

    // ── Paid subscription expired ─────────────────────────────────────────
    if (['monthly', 'annual'].includes(business.subscriptionPlan)) {
      if (!business.subscriptionExpiry || new Date(business.subscriptionExpiry) < now) {
        await prisma.business.update({
          where: { id: businessId },
          data:  { isActive: false, suspendedAt: now, suspensionReason: 'Subscription expired' },
        });
        return res.status(403).json({
          error: 'Your subscription has expired. Please renew to continue.',
          code:  'SUBSCRIPTION_EXPIRED',
        });
      }
    }

    // ── Manually suspended ────────────────────────────────────────────────
    if (!business.isActive) {
      return res.status(403).json({
        error: business.suspensionReason || 'Your business account is suspended. Contact support.',
        code:  'SUSPENDED',
      });
    }

    next();
  } catch (err) {
    // Fail open — a DB error should not lock out legitimate users
    console.error('⚠️  requireActiveSubscription DB error:', err.message);
    next();
  }
}

module.exports = {
  authMiddleware,
  requireSuperAdmin,
  requireAdmin,
  preventStaff,
  requireActiveSubscription,
};