// backend/src/controllers/onboardingController.js
// UPDATED — referral code accepted from public form AND admin creation form
//
// Changes from original:
//   1. createOnboardingRequest accepts + validates referralCode
//   2. approveOnboardingRequest calls awardReferralBonus on approval
//   3. referralApplied flag prevents double-awarding

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
// Accepts optional referralCode field from both public form and super-admin form
// ============================================================================
async function createOnboardingRequest(req, res) {
  const {
    businessName, businessType, ownerName, ownerEmail,
    ownerPhone, description, preferredSlug,
    referralCode,   // ✅ optional — entered in registration form
  } = req.body;

  if (!businessName || !ownerName || !ownerEmail || !ownerPhone)
    return res.status(400).json({ error: 'Business name, owner name, email, and phone are required' });

  // ── Validate referral code if provided ───────────────────────────────────
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
// ✅ Triggers referral bonus if the request had a referral code
// ============================================================================
async function approveOnboardingRequest(req, res) {
  if (req.user.role !== 'super-admin')
    return res.status(403).json({ error: 'Forbidden' });

  const requestId = Number(req.params.id);
  const onboardingRequest = await prisma.onboardingRequest.findUnique({ where: { id: requestId } });

  if (!onboardingRequest)              return res.status(404).json({ error: 'Request not found' });
  if (onboardingRequest.status !== 'pending')
    return res.status(400).json({ error: 'Request already processed' });

  await prisma.onboardingRequest.update({
    where: { id: requestId },
    data:  { status: 'approved', reviewedBy: req.user.id, reviewedAt: new Date() },
  });

  if (onboardingRequest.adminCreated && onboardingRequest.adminUserId) {
    const user = await prisma.user.findUnique({
      where:  { id: onboardingRequest.adminUserId },
      select: { businessId: true },
    });

    if (user?.businessId) {
      // Ensure the new business has its own referral code
      await ensureReferralCode(user.businessId);

      // Award bonus to referrer immediately on approval
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
        `Your onboarding request for "${onboardingRequest.businessName}" has been approved. Welcome aboard! You can now log in and start setting up your store.`
      );
    }
  }

  console.log('✅ Approved onboarding request:', onboardingRequest.businessName);
  res.json({ ok: true, message: 'Request approved. You can now create the business.', request: onboardingRequest });
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
    data:  { status: 'rejected', rejectionReason, reviewedBy: req.user.id, reviewedAt: new Date() },
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