// backend/src/controllers/referralController.js
//
// Referral system — complete implementation:
//   ✅ Unique 8-char code per business, permanent once issued
//   ✅ Public code validation endpoint (for registration form)
//   ✅ ₦500 bonus credited IMMEDIATELY when super-admin approves referred business
//   ✅ AUTO-APPLY: bonus auto-deducted on next subscription payment (paymentController hook)
//   ✅ ADMIN OVERRIDE: super-admin can manually apply any amount OR disable auto-apply
//   ✅ Business dashboard: balance, progress ring, transaction history
//   ✅ Super-admin overview: leaderboard, pending balances, auto vs manual stats

const prisma = require('../lib/prisma');
const notify = require('../lib/notify');
const crypto = require('crypto');

const REFERRAL_BONUS_AMOUNT = 500;    // ₦500 per approved referral
const SUBSCRIPTION_COST     = 15000;  // ₦15,000 monthly
const ANNUAL_COST           = 150000; // ₦150,000 annual

// ─── helpers ─────────────────────────────────────────────────────────────────

function generateReferralCode(businessName, id) {
  const base = `${businessName}${id}${Date.now()}`;
  return crypto.createHash('sha256').update(base).digest('hex')
    .replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
}

function planCost(plan) {
  return plan === 'annual' ? ANNUAL_COST : SUBSCRIPTION_COST;
}

// ============================================================================
// ENSURE BUSINESS HAS A CODE  (call this after every business creation)
// ============================================================================
async function ensureReferralCode(businessId) {
  const biz = await prisma.business.findUnique({
    where:  { id: businessId },
    select: { id: true, referralCode: true, businessName: true },
  });
  if (!biz) return null;
  if (biz.referralCode) return biz.referralCode;

  const code = generateReferralCode(biz.businessName, businessId);
  await prisma.business.update({ where: { id: businessId }, data: { referralCode: code } });
  return code;
}

// ============================================================================
// PUBLIC: VALIDATE CODE  (no auth — used by both registration forms)
// GET /api/referral/validate/:code
// ============================================================================
async function validateReferralCode(req, res) {
  const { code } = req.params;
  if (!code || code.length < 4)
    return res.status(400).json({ valid: false, error: 'Invalid code format' });

  const biz = await prisma.business.findFirst({
    where:  { referralCode: code.toUpperCase(), isActive: true },
    select: { id: true, businessName: true, referralCode: true, totalReferrals: true },
  });

  if (!biz) return res.json({ valid: false, error: 'Referral code not found' });

  return res.json({
    valid:          true,
    referralCode:   biz.referralCode,
    referrerName:   biz.businessName,
    totalReferrals: biz.totalReferrals,
  });
}

// ============================================================================
// BUSINESS: REFERRAL DASHBOARD
// GET /api/referral/dashboard
// ============================================================================
async function getReferralDashboard(req, res) {
  const businessId = req.user.businessId;
  if (!businessId) return res.status(403).json({ error: 'No business associated' });

  const code = await ensureReferralCode(businessId);

  const biz = await prisma.business.findUnique({
    where:  { id: businessId },
    select: {
      id: true, businessName: true,
      referralCode: true, referralBonus: true, totalReferrals: true,
      skipNextReferralAutoApply: true,
    },
  });
  if (!biz) return res.status(404).json({ error: 'Business not found' });

  const transactions = await prisma.referralTransaction.findMany({
    where:   { referrerId: businessId },
    orderBy: { createdAt: 'desc' },
    include: {
      referred: { select: { id: true, businessName: true, slug: true, createdAt: true } },
    },
  });

  const approved    = transactions.filter(t => t.status === 'approved');
  const pending     = transactions.filter(t => t.status === 'pending');
  const redeemed    = transactions.filter(t => t.status === 'redeemed');
  const autoApplied = transactions.filter(t => t.status === 'redeemed' && t.autoApplied);

  const balance = biz.referralBonus;
  const progressPercent = Math.min(100, Math.round((balance / SUBSCRIPTION_COST) * 100));

  return res.json({
    success:        true,
    referralCode:   biz.referralCode || code,
    businessName:   biz.businessName,
    balance,
    totalReferrals: biz.totalReferrals,
    autoApplyEnabled: !biz.skipNextReferralAutoApply,
    stats: {
      approved:      approved.length,
      pending:       pending.length,
      redeemed:      redeemed.length,
      autoApplied:   autoApplied.length,
      totalEarned:   (approved.length + redeemed.length) * REFERRAL_BONUS_AMOUNT,
      totalRedeemed: redeemed.reduce((s, t) => s + (t.appliedAmount || t.amount || 0), 0),
    },
    progress: {
      current:       balance,
      goal:          SUBSCRIPTION_COST,
      percent:       progressPercent,
      referralsLeft: Math.max(0, Math.ceil((SUBSCRIPTION_COST - balance) / REFERRAL_BONUS_AMOUNT)),
      referralsNeededForFreeMonth: Math.ceil(SUBSCRIPTION_COST / REFERRAL_BONUS_AMOUNT),
    },
    bonusPerReferral: REFERRAL_BONUS_AMOUNT,
    subscriptionCost: SUBSCRIPTION_COST,
    transactions: transactions.map(t => ({
      id:            t.id,
      referredName:  t.referred.businessName,
      referredSlug:  t.referred.slug,
      amount:        t.amount,
      appliedAmount: t.appliedAmount || 0,
      status:        t.status,
      autoApplied:   t.autoApplied || false,
      adminNote:     t.adminNote || null,
      approvedAt:    t.approvedAt,
      redeemedAt:    t.redeemedAt,
      createdAt:     t.createdAt,
    })),
  });
}

// ============================================================================
// AWARD BONUS ON APPROVAL  (called by onboardingController + businessController)
// Pure internal function — no HTTP handler
// ============================================================================
async function awardReferralBonus(referredBusinessId) {
  try {
    const referred = await prisma.business.findUnique({
      where:  { id: referredBusinessId },
      select: { id: true, businessName: true, referredById: true },
    });

    if (!referred?.referredById) {
      console.log(`ℹ️  No referrer for business ${referredBusinessId}`);
      return null;
    }

    // Idempotent
    const existing = await prisma.referralTransaction.findUnique({
      where: { referredId: referredBusinessId },
    });
    if (existing) return existing;

    const referrerId = referred.referredById;

    const [txn] = await prisma.$transaction([
      prisma.referralTransaction.create({
        data: {
          referrerId,
          referredId:  referredBusinessId,
          amount:      REFERRAL_BONUS_AMOUNT,
          status:      'approved',
          autoApplied: false,
          approvedAt:  new Date(),
        },
      }),
      prisma.business.update({
        where: { id: referrerId },
        data:  { referralBonus: { increment: REFERRAL_BONUS_AMOUNT }, totalReferrals: { increment: 1 } },
      }),
    ]);

    try {
      await notify.system(
        referrerId,
        '🎉 Referral Bonus Earned — ₦500 Credited!',
        `"${referred.businessName}" just joined using your referral code. ₦${REFERRAL_BONUS_AMOUNT.toLocaleString()} has been added to your referral balance and will be automatically applied to your next subscription payment.`
      );
    } catch (e) { console.warn('Referral notify failed:', e.message); }

    console.log(`✅ ₦${REFERRAL_BONUS_AMOUNT} bonus → business ${referrerId} (referred ${referredBusinessId})`);
    return txn;
  } catch (err) {
    console.error('❌ awardReferralBonus failed:', err.message);
    return null;
  }
}

// ============================================================================
// AUTO-APPLY BONUS ON PAYMENT  (called from paymentController.verifyPayment)
//
// Usage in paymentController after subscription is updated:
//
//   const { autoApplyReferralBonus } = require('./referralController');
//   if (!req.body.skipReferralBonus) {
//     const { applied } = await autoApplyReferralBonus(businessId, plan);
//     if (applied > 0) console.log(`💸 Auto-applied ₦${applied} referral bonus`);
//   }
//
// The function is skipped when:
//   - business.referralBonus === 0
//   - req.body.skipReferralBonus === true  (admin override via API)
//   - business.skipNextReferralAutoApply === true  (persisted admin flag)
// ============================================================================
async function autoApplyReferralBonus(businessId, plan) {
  const biz = await prisma.business.findUnique({
    where:  { id: Number(businessId) },
    select: { id: true, businessName: true, referralBonus: true, skipNextReferralAutoApply: true },
  });

  if (!biz || biz.referralBonus <= 0) return { applied: 0, skipped: 'no_balance' };

  // Admin disabled auto-apply for this payment — clear the flag and skip
  if (biz.skipNextReferralAutoApply) {
    await prisma.business.update({
      where: { id: Number(businessId) },
      data:  { skipNextReferralAutoApply: false },
    });
    console.log(`⚠️  Auto-apply skipped (admin flag) for business ${businessId}`);
    return { applied: 0, skipped: 'admin_override' };
  }

  const cost        = planCost(plan);
  const applyAmount = Math.min(biz.referralBonus, cost);

  // Mark oldest approved txns as redeemed (auto)
  const txns = await prisma.referralTransaction.findMany({
    where:   { referrerId: Number(businessId), status: 'approved' },
    orderBy: { approvedAt: 'asc' },
  });

  let remaining = applyAmount;
  for (const txn of txns) {
    if (remaining <= 0) break;
    const use = Math.min(txn.amount, remaining);
    await prisma.referralTransaction.update({
      where: { id: txn.id },
      data: {
        status:        'redeemed',
        autoApplied:   true,
        appliedAmount: use,
        redeemedAt:    new Date(),
      },
    });
    remaining -= use;
  }

  const updated = await prisma.business.update({
    where:  { id: Number(businessId) },
    data:   { referralBonus: { decrement: applyAmount } },
    select: { referralBonus: true },
  });

  try {
    await notify.system(
      Number(businessId),
      '💸 Referral Bonus Auto-Applied!',
      `₦${applyAmount.toLocaleString()} from your referral balance was automatically applied to your ${plan} subscription. Remaining referral balance: ₦${Math.max(0, updated.referralBonus).toLocaleString()}.`
    );
  } catch (e) { console.warn('Auto-apply notify failed:', e.message); }

  console.log(`💸 Auto-applied ₦${applyAmount} referral bonus for business ${businessId} (${plan})`);
  return { applied: applyAmount, newBalance: Math.max(0, updated.referralBonus) };
}

// ============================================================================
// ADMIN: MANUAL REDEEM / OVERRIDE
// POST /api/referral/redeem
// Body options:
//   { businessId, amount, note }                     → manual apply amount
//   { businessId, skipNextAutoApply: true }          → disable auto-apply once
//   { businessId, skipNextAutoApply: false }         → re-enable auto-apply
// ============================================================================
async function redeemReferralBonus(req, res) {
  if (req.user.role !== 'super-admin')
    return res.status(403).json({ error: 'Forbidden' });

  const { businessId, amount, note, skipNextAutoApply } = req.body;
  if (!businessId) return res.status(400).json({ error: 'businessId required' });

  const biz = await prisma.business.findUnique({
    where:  { id: Number(businessId) },
    select: { id: true, businessName: true, referralBonus: true },
  });
  if (!biz) return res.status(404).json({ error: 'Business not found' });

  // ── Toggle auto-apply flag ───────────────────────────────────────────────
  if (skipNextAutoApply !== undefined) {
    await prisma.business.update({
      where: { id: Number(businessId) },
      data:  { skipNextReferralAutoApply: Boolean(skipNextAutoApply) },
    });
    const state = skipNextAutoApply ? 'disabled' : 'enabled';
    return res.json({
      success: true,
      message: `Auto-apply ${state} for ${biz.businessName}'s next subscription payment`,
    });
  }

  // ── Manual apply ─────────────────────────────────────────────────────────
  const redeemAmount = Math.min(Number(amount) || 0, biz.referralBonus);
  if (redeemAmount <= 0)
    return res.status(400).json({ error: 'No referral bonus available to redeem' });

  const txns = await prisma.referralTransaction.findMany({
    where:   { referrerId: Number(businessId), status: 'approved' },
    orderBy: { approvedAt: 'asc' },
  });

  let remaining = redeemAmount;
  for (const txn of txns) {
    if (remaining <= 0) break;
    const use = Math.min(txn.amount, remaining);
    await prisma.referralTransaction.update({
      where: { id: txn.id },
      data: {
        status:        'redeemed',
        autoApplied:   false,
        appliedAmount: use,
        redeemedAt:    new Date(),
        adminNote:     note || 'Manual redemption by admin',
      },
    });
    remaining -= use;
  }

  const updated = await prisma.business.update({
    where:  { id: Number(businessId) },
    data:   { referralBonus: { decrement: redeemAmount } },
    select: { referralBonus: true },
  });

  try {
    await notify.system(
      Number(businessId),
      '✅ Referral Bonus Applied',
      `₦${redeemAmount.toLocaleString()} from your referral balance has been applied${note ? `: ${note}` : ''}. Remaining balance: ₦${Math.max(0, updated.referralBonus).toLocaleString()}.`
    );
  } catch (e) { console.warn('Manual redeem notify failed:', e.message); }

  console.log(`✅ Admin redeemed ₦${redeemAmount} referral bonus for ${biz.businessName}`);
  return res.json({
    success:          true,
    redeemed:         redeemAmount,
    remainingBalance: Math.max(0, updated.referralBonus),
    message:          `₦${redeemAmount.toLocaleString()} referral bonus applied successfully`,
  });
}

// ============================================================================
// SUPER-ADMIN: PLATFORM OVERVIEW
// GET /api/referral/admin/overview
// ============================================================================
async function getAdminReferralOverview(req, res) {
  if (req.user.role !== 'super-admin')
    return res.status(403).json({ error: 'Forbidden' });

  const [transactions, totals, topReferrers, pendingBalances] = await Promise.all([
    prisma.referralTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        referrer: { select: { id: true, businessName: true, slug: true } },
        referred: { select: { id: true, businessName: true, slug: true } },
      },
    }),
    prisma.referralTransaction.groupBy({
      by: ['status'], _count: { id: true }, _sum: { amount: true },
    }),
    prisma.business.findMany({
      where:   { totalReferrals: { gt: 0 } },
      orderBy: { totalReferrals: 'desc' },
      take: 10,
      select: {
        id: true, businessName: true, slug: true,
        totalReferrals: true, referralBonus: true,
        skipNextReferralAutoApply: true,
      },
    }),
    prisma.business.findMany({
      where:   { referralBonus: { gt: 0 } },
      orderBy: { referralBonus: 'desc' },
      select:  { id: true, businessName: true, referralBonus: true, subscriptionPlan: true },
    }),
  ]);

  const summary        = totals.reduce((acc, t) => { acc[t.status] = { count: t._count.id, amount: t._sum.amount || 0 }; return acc; }, {});
  const autoApplied    = transactions.filter(t => t.autoApplied);
  const manualRedeemed = transactions.filter(t => t.status === 'redeemed' && !t.autoApplied);

  return res.json({
    success: true,
    summary,
    autoApplied:    { count: autoApplied.length,    total: autoApplied.reduce((s, t) => s + (t.appliedAmount || 0), 0) },
    manualRedeemed: { count: manualRedeemed.length, total: manualRedeemed.reduce((s, t) => s + (t.appliedAmount || 0), 0) },
    topReferrers,
    pendingBalances,
    recentTransactions: transactions,
    constants: { bonusPerReferral: REFERRAL_BONUS_AMOUNT, subscriptionCost: SUBSCRIPTION_COST },
  });
}

// ============================================================================
// GENERATE CODE  (REST endpoint for businesses)
// POST /api/referral/generate
// ============================================================================
async function generateCode(req, res) {
  const businessId = req.user.businessId;
  if (!businessId) return res.status(403).json({ error: 'No business' });

  const biz = await prisma.business.findUnique({
    where:  { id: businessId },
    select: { id: true, businessName: true, referralCode: true },
  });
  if (!biz) return res.status(404).json({ error: 'Business not found' });

  if (biz.referralCode)
    return res.json({ success: true, referralCode: biz.referralCode, existing: true });

  const code = generateReferralCode(biz.businessName, businessId);
  await prisma.business.update({ where: { id: businessId }, data: { referralCode: code } });
  return res.json({ success: true, referralCode: code, existing: false });
}

module.exports = {
  validateReferralCode,
  getReferralDashboard,
  awardReferralBonus,
  autoApplyReferralBonus,
  redeemReferralBonus,
  getAdminReferralOverview,
  generateCode,
  ensureReferralCode,
  REFERRAL_BONUS_AMOUNT,
  SUBSCRIPTION_COST,
};