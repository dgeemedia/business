// backend/src/controllers/paymentController.js
//
// Tenant-aware: every business can only verify/view their own payment data.
// Super-admin can act on any business.
// The verify endpoint is called from the frontend after gateway confirms payment.

const prisma  = require('../lib/prisma');
const notify  = require('../lib/notify');

const PLAN_AMOUNTS = {
  monthly: 15000,
  annual:  150000,
};

const PLAN_DURATION_DAYS = {
  monthly: 30,
  annual:  365,
};

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// ── Resolve which businessId this request is acting on ────────────────────────
// Business admin/staff → only their own businessId
// Super-admin          → whatever :id param says
function resolveTargetBusinessId(req) {
  const paramId = Number(req.params.id);
  if (req.user.role === 'super-admin') return paramId;
  if (req.user.businessId !== paramId) return null; // will 403
  return paramId;
}

// ============================================================================
// GET SUBSCRIPTION STATUS
// GET /api/business/:id/subscription-status
// ============================================================================
async function getSubscriptionStatus(req, res) {
  const businessId = resolveTargetBusinessId(req);
  if (!businessId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const business = await prisma.business.findUnique({
    where:  { id: businessId },
    select: {
      id: true, slug: true, businessName: true,
      email: true,
      subscriptionPlan: true,
      subscriptionStartDate: true,
      subscriptionExpiry: true,
      trialStartDate: true,
      trialEndsAt: true,
      lastPaymentDate: true,
      lastPaymentAmount: true,
      lastPaymentRef: true,
      lastPaymentProvider: true,
      subscriptionNotes: true,
      isActive: true,
    },
  });

  if (!business) return res.status(404).json({ error: 'Business not found' });

  const now      = new Date();
  const isTrial  = business.subscriptionPlan === 'free_trial';
  const expiry   = isTrial ? business.trialEndsAt : business.subscriptionExpiry;
  const expired  = expiry ? new Date(expiry) < now : true;
  const daysLeft = expiry
    ? Math.max(0, Math.ceil((new Date(expiry) - now) / (1000 * 60 * 60 * 24)))
    : 0;

  let status;
  if (isTrial)              status = expired ? 'trial_expired'  : 'trial_active';
  else if (!expiry)         status = 'none';
  else if (expired)         status = 'expired';
  else if (daysLeft <= 7)   status = 'expiring_soon';
  else                      status = 'active';

  return res.json({
    success: true,
    business,
    status: { status, daysRemaining: daysLeft, expired, isTrial },
    canStartTrial: !business.trialStartDate,
    needsPayment:  ['expired', 'trial_expired'].includes(status),
  });
}

// ============================================================================
// VERIFY PAYMENT — called from frontend after gateway popup succeeds
// POST /api/business/:id/verify-payment
// Body: { transaction_id, tx_ref, plan, provider }
// ============================================================================
async function verifyPayment(req, res) {
  const businessId = resolveTargetBusinessId(req);
  if (!businessId) {
    return res.status(403).json({ error: 'Access denied — you can only manage your own subscription' });
  }

  const { transaction_id, tx_ref, plan, provider = 'flutterwave' } = req.body;

  if (!transaction_id && !tx_ref) {
    return res.status(400).json({ error: 'transaction_id or tx_ref required' });
  }
  if (!PLAN_AMOUNTS[plan]) {
    return res.status(400).json({ error: 'Invalid plan. Must be: monthly or annual' });
  }

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) return res.status(404).json({ error: 'Business not found' });

  // ── Verify with gateway ───────────────────────────────────────────────────
  let paidAmount;

  if (provider === 'flutterwave') {
    const result = await verifyFlutterwave(transaction_id, plan);
    if (!result.ok) return res.status(400).json({ error: result.error });
    paidAmount = result.amount;

  } else if (provider === 'paystack') {
    const result = await verifyPaystack(tx_ref || transaction_id, plan);
    if (!result.ok) return res.status(400).json({ error: result.error });
    paidAmount = result.amount / 100;

  } else {
    // Unknown provider → log, still activate (manual approval path)
    console.warn(`⚠️  Unknown payment provider: ${provider} — activating without gateway verify`);
    paidAmount = PLAN_AMOUNTS[plan];
  }

  // ── Activate subscription ─────────────────────────────────────────────────
  const now  = new Date();
  const base = business.subscriptionExpiry && new Date(business.subscriptionExpiry) > now
    ? new Date(business.subscriptionExpiry)
    : now;
  const expiry = addDays(base, PLAN_DURATION_DAYS[plan]);

  await prisma.business.update({
    where: { id: businessId },
    data: {
      subscriptionPlan:      plan,
      subscriptionStartDate: now,
      subscriptionExpiry:    expiry,
      isActive:              true,
      suspendedAt:           null,
      suspensionReason:      null,
      lastPaymentDate:       now,
      lastPaymentRef:        tx_ref || String(transaction_id),
      lastPaymentAmount:     paidAmount,
      lastPaymentProvider:   provider,
    },
  });

  // Non-blocking: notify the business owner
  notify.subscription(businessId, plan, expiry).catch(() => {});

  console.log(`✅ Payment verified: business ${businessId} | plan=${plan} | expires=${expiry.toISOString()}`);

  return res.json({
    success: true,
    plan,
    expiry:  expiry.toISOString(),
    message: `${plan} subscription activated successfully`,
  });
}

// ============================================================================
// CONTACT SUPPORT — manual payment notification
// POST /api/contact-support
// ============================================================================
async function contactSupport(req, res) {
  const { type, plan, businessId, message } = req.body;

  // Tenant check
  if (req.user.role !== 'super-admin') {
    if (req.user.businessId !== Number(businessId)) {
      return res.status(403).json({ error: 'Access denied' });
    }
  }

  console.log(`📩 [Support] type=${type} | business=${businessId} | plan=${plan}\n   ${message}`);

  // Log the request — extend this to email/SMS super-admin if needed
  return res.json({
    success: true,
    message: 'Request received. Your subscription will be activated within 24 hours.',
  });
}

// ============================================================================
// GATEWAY HELPERS — pure functions, return { ok, amount, error }
// ============================================================================

async function verifyFlutterwave(transactionId, plan) {
  const secretKey = process.env.FLW_SECRET_KEY;

  if (!secretKey || secretKey.includes('PASTE') || secretKey.includes('YOUR')) {
    console.warn('⚠️  FLW_SECRET_KEY not set — manual approval mode');
    return { ok: true, amount: PLAN_AMOUNTS[plan] };
  }

  try {
    const response = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      { headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' } }
    );
    const data = await response.json();

    if (
      data.status       === 'success'    &&
      data.data?.status === 'successful' &&
      data.data?.currency === 'NGN'      &&
      data.data?.amount >= PLAN_AMOUNTS[plan]
    ) {
      return { ok: true, amount: data.data.amount };
    }

    console.error('❌ FLW mismatch:', data.data?.status, data.data?.amount);
    return { ok: false, error: 'Payment verification failed — amount or status mismatch' };
  } catch (err) {
    console.error('❌ FLW API error:', err.message);
    return { ok: false, error: 'Could not reach Flutterwave. Contact support.' };
  }
}

async function verifyPaystack(reference, plan) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey || secretKey.includes('PASTE') || secretKey.includes('YOUR')) {
    console.warn('⚠️  PAYSTACK_SECRET_KEY not set — manual approval mode');
    return { ok: true, amount: PLAN_AMOUNTS[plan] * 100 };
  }

  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' } }
    );
    const data = await response.json();

    if (
      data.status       === true       &&
      data.data?.status === 'success'  &&
      data.data?.currency === 'NGN'    &&
      data.data?.amount >= PLAN_AMOUNTS[plan] * 100
    ) {
      return { ok: true, amount: data.data.amount };
    }

    console.error('❌ Paystack mismatch:', data.data?.status, data.data?.amount);
    return { ok: false, error: 'Payment verification failed — amount or status mismatch' };
  } catch (err) {
    console.error('❌ Paystack API error:', err.message);
    return { ok: false, error: 'Could not reach Paystack. Contact support.' };
  }
}

module.exports = { verifyPayment, getSubscriptionStatus, contactSupport };