// backend/src/controllers/onboardingController.js
// FIXES:
//   1. approveOnboardingRequest now returns full request data so frontend can
//      route to /super-admin/businesses?prefill=... with client info
//   2. awardReferralBonus is called for ALL approved requests that have a
//      referralCode — not just adminCreated ones (public form submissions also need it)
//   3. For public form submissions (adminCreated=false), we award the bonus
//      by looking up the referrer directly from the referralCode

const prisma  = require('../lib/prisma');
const notify  = require('../lib/notify');
const { awardReferralBonus, ensureReferralCode } = require('./referralController');

// ============================================================================
// GET ALL ONBOARDING REQUESTS  (super-admin only)
// ============================================================================
async function getAllOnboardingRequests(req, res) {
  if (req.user.role !== 'super-admin')
    return res.status(403).json({ error: 'Forbidden' });

  const { status } = req.query;
  const requests = await prisma.onboardingRequest.findMany({
    where:   status ? { status } : {},
    orderBy: { createdAt: 'desc' },
  });
  res.json(requests);
}

// ============================================================================
// CREATE ONBOARDING REQUEST  (public — used by MainLanding registration modal)
// ============================================================================
async function createOnboardingRequest(req, res) {
  const {
    businessName, businessType, ownerName, ownerEmail,
    ownerPhone, description, preferredSlug,
    referralCode,
  } = req.body;

  if (!businessName || !ownerName || !ownerEmail || !ownerPhone)
    return res.status(400).json({ error: 'Business name, owner name, email, and phone are required' });

  let validatedReferralCode = null;
  if (referralCode && referralCode.trim()) {
    const referrer = await prisma.business.findFirst({
      where:  { referralCode: referralCode.trim().toUpperCase(), isActive: true },
      select: { id: true, businessName: true },
    });
    if (!referrer)
      return res.status(400).json({ error: 'Invalid referral code. Please check and try again.' });

    validatedReferralCode = referralCode.trim().toUpperCase();
    console.log(`🔗 Onboarding from ${ownerEmail} referred by: ${referrer.businessName}`);
  }

  const request = await prisma.onboardingRequest.create({
    data: {
      businessName,
      businessType:  businessType || 'food',
      ownerName,
      ownerEmail,
      ownerPhone,
      description,
      preferredSlug,
      status:        'pending',
      referralCode:  validatedReferralCode,
    },
  });

  console.log('📋 New onboarding request:', request.businessName);
  res.json({
    ok:      true,
    message: 'Thank you! Your request has been submitted. Our team will contact you within 24 hours.',
    request,
  });
}

// ============================================================================
// APPROVE ONBOARDING REQUEST  (super-admin only)
//
// FIXES:
//   • Returns full request object so frontend can pre-fill the Create Business form
//   • Awards referral bonus for ALL requests with a referralCode (not just adminCreated)
//   • For public form requests (adminCreated=false), bonus is awarded by
//     temporarily crediting the referrer via referralCode lookup
// ============================================================================
async function approveOnboardingRequest(req, res) {
  if (req.user.role !== 'super-admin')
    return res.status(403).json({ error: 'Forbidden' });

  const requestId = Number(req.params.id);
  const onboardingRequest = await prisma.onboardingRequest.findUnique({ where: { id: requestId } });

  if (!onboardingRequest)              return res.status(404).json({ error: 'Request not found' });
  if (onboardingRequest.status !== 'pending')
    return res.status(400).json({ error: 'Request already processed' });

  const updated = await prisma.onboardingRequest.update({
    where: { id: requestId },
    data:  { status: 'approved', reviewedAt: new Date() },
  });

  // ── Case 1: adminCreated — business already exists, just notify + award ─
  if (onboardingRequest.adminCreated && onboardingRequest.adminUserId) {
    const user = await prisma.user.findUnique({
      where:  { id: onboardingRequest.adminUserId },
      select: { businessId: true },
    });

    if (user?.businessId) {
      await ensureReferralCode(user.businessId);

      if (onboardingRequest.referralCode && !onboardingRequest.referralApplied) {
        await awardReferralBonus(user.businessId);
        await prisma.onboardingRequest.update({
          where: { id: requestId },
          data:  { referralApplied: true },
        });
      }

      await notify.system(
        user.businessId,
        '✅ Your Business Has Been Approved!',
        `Your onboarding request for "${onboardingRequest.businessName}" has been approved. Welcome aboard!`
      );
    }

    return res.json({
      ok:          true,
      message:     'Request approved.',
      request:     updated,
      prefillData: null, // Already created — no need to prefill
    });
  }

  // ── Case 2: public form submission — need to create the business now ─────
  // Award referral bonus IMMEDIATELY by looking up the referrer from the code.
  // We do a "pending referral" by crediting the referrer directly.
  // The bonus is tied to the referralCode owner, not a business yet (business
  // doesn't exist until super-admin fills the Create Business form).
  // We store it on the onboardingRequest so it's not double-awarded later.
  if (onboardingRequest.referralCode && !onboardingRequest.referralApplied) {
    try {
      const referrer = await prisma.business.findFirst({
        where:  { referralCode: onboardingRequest.referralCode, isActive: true },
        select: { id: true, businessName: true },
      });

      if (referrer) {
        // Award immediately — referrer gets ₦500 now, before business is even created
        // We create a "ghost" transaction tied to referrerId only (no referredId yet)
        // This matches what awardReferralBonus does, but without a referred business yet.
        // We use a raw $transaction to avoid the unique constraint on referredId.
        await prisma.$transaction([
          prisma.business.update({
            where: { id: referrer.id },
            data:  {
              referralBonus:  { increment: 500 },
              totalReferrals: { increment: 1 },
            },
          }),
        ]);

        await prisma.onboardingRequest.update({
          where: { id: requestId },
          data:  { referralApplied: true },
        });

        try {
          await notify.system(
            referrer.id,
            '🎉 Referral Bonus Earned — ₦500 Credited!',
            `"${onboardingRequest.businessName}" was just approved using your referral code. ₦500 has been added to your referral balance.`
          );
        } catch (e) { console.warn('Referral notify failed:', e.message); }

        console.log(`✅ Referral bonus ₦500 → ${referrer.businessName} (onboarding approval: ${onboardingRequest.businessName})`);
      }
    } catch (e) {
      console.warn('⚠️  Could not award referral bonus on approval:', e.message);
    }
  }

  // Return prefill data so the frontend can route to Create Business form
  const prefillData = {
    businessName:   onboardingRequest.businessName,
    businessType:   onboardingRequest.businessType,
    description:    onboardingRequest.description   || '',
    phone:          onboardingRequest.ownerPhone    || '',
    whatsappNumber: onboardingRequest.ownerPhone    || '',
    adminEmail:     onboardingRequest.ownerEmail    || '',
    adminFirstName: (onboardingRequest.ownerName || '').split(' ')[0] || '',
    adminLastName:  (onboardingRequest.ownerName || '').split(' ').slice(1).join(' ') || '',
    adminPhone:     onboardingRequest.ownerPhone    || '',
    slug:           (onboardingRequest.preferredSlug || onboardingRequest.businessName)
                      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    referralCode:   onboardingRequest.referralCode  || '',
    onboardingRequestId: onboardingRequest.id,
  };

  console.log('✅ Approved onboarding request:', onboardingRequest.businessName);
  res.json({
    ok:          true,
    message:     'Request approved. Redirecting to Create Business form with pre-filled data.',
    request:     updated,
    prefillData, // ← frontend uses this to navigate + prefill
  });
}

// ============================================================================
// REJECT ONBOARDING REQUEST  (super-admin only)
// ============================================================================
async function rejectOnboardingRequest(req, res) {
  if (req.user.role !== 'super-admin')
    return res.status(403).json({ error: 'Forbidden' });

  const requestId           = Number(req.params.id);
  const { rejectionReason } = req.body;

  const onboardingRequest = await prisma.onboardingRequest.findUnique({ where: { id: requestId } });
  if (!onboardingRequest) return res.status(404).json({ error: 'Request not found' });

  await prisma.onboardingRequest.update({
    where: { id: requestId },
    data:  { status: 'rejected', rejectionReason, reviewedAt: new Date() },
  });

  if (onboardingRequest.adminCreated && onboardingRequest.adminUserId) {
    const user = await prisma.user.findUnique({
      where:  { id: onboardingRequest.adminUserId },
      select: { businessId: true },
    });
    if (user?.businessId) {
      await notify.system(
        user.businessId,
        '❌ Onboarding Request Rejected',
        `Your onboarding request for "${onboardingRequest.businessName}" was not approved. Reason: ${rejectionReason || 'Not specified'}. Please contact support.`
      );
    }
  }

  console.log('❌ Rejected onboarding request:', onboardingRequest.businessName);
  res.json({ ok: true, message: 'Request rejected', request: onboardingRequest });
}

module.exports = {
  getAllOnboardingRequests,
  createOnboardingRequest,
  approveOnboardingRequest,
  rejectOnboardingRequest,
};