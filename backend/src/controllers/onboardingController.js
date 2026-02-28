// backend/src/controllers/onboardingController.js
const prisma = require('../lib/prisma');
const notify = require('../lib/notify');

// ============================================================================
// GET ALL ONBOARDING REQUESTS (super-admin only)
// ============================================================================
async function getAllOnboardingRequests(req, res) {
  if (req.user.role !== 'super-admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { status } = req.query;
  const where      = status ? { status } : {};

  const requests = await prisma.onboardingRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  res.json(requests);
}

// ============================================================================
// CREATE ONBOARDING REQUEST (public — no notify, no businessId yet)
// ============================================================================
async function createOnboardingRequest(req, res) {
  const { businessName, businessType, ownerName, ownerEmail, ownerPhone, description, preferredSlug } = req.body;

  if (!businessName || !ownerName || !ownerEmail || !ownerPhone) {
    return res.status(400).json({
      error: 'Business name, owner name, email, and phone are required',
    });
  }

  const request = await prisma.onboardingRequest.create({
    data: {
      businessName,
      businessType: businessType || 'food',
      ownerName,
      ownerEmail,
      ownerPhone,
      description,
      preferredSlug,
      status: 'pending',
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
// APPROVE ONBOARDING REQUEST (super-admin only)
// ============================================================================
async function approveOnboardingRequest(req, res) {
  if (req.user.role !== 'super-admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const requestId = Number(req.params.id);

  const onboardingRequest = await prisma.onboardingRequest.findUnique({
    where: { id: requestId },
  });

  if (!onboardingRequest) return res.status(404).json({ error: 'Request not found' });
  if (onboardingRequest.status !== 'pending') {
    return res.status(400).json({ error: 'Request already processed' });
  }

  await prisma.onboardingRequest.update({
    where: { id: requestId },
    data:  { status: 'approved', reviewedBy: req.user.id, reviewedAt: new Date() },
  });

  // If the request was already linked to a created business (adminCreated = true),
  // send a welcome notification. Otherwise the notification goes out when
  // createBusiness() is called from the super-admin dashboard.
  if (onboardingRequest.adminCreated && onboardingRequest.adminUserId) {
    const user = await prisma.user.findUnique({
      where:  { id: onboardingRequest.adminUserId },
      select: { businessId: true },
    });

    if (user?.businessId) {
      await notify.system(
        user.businessId,
        '✅ Onboarding Request Approved',
        `Your onboarding request for "${onboardingRequest.businessName}" has been approved. Welcome aboard!`
      );
    }
  }

  console.log('✅ Approved onboarding request:', onboardingRequest.businessName);

  res.json({
    ok:      true,
    message: 'Request approved. You can now create the business.',
    request: onboardingRequest,
  });
}

// ============================================================================
// REJECT ONBOARDING REQUEST (super-admin only)
// ============================================================================
async function rejectOnboardingRequest(req, res) {
  if (req.user.role !== 'super-admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const requestId       = Number(req.params.id);
  const { rejectionReason } = req.body;

  const onboardingRequest = await prisma.onboardingRequest.findUnique({
    where: { id: requestId },
  });

  if (!onboardingRequest) return res.status(404).json({ error: 'Request not found' });

  await prisma.onboardingRequest.update({
    where: { id: requestId },
    data:  { status: 'rejected', rejectionReason, reviewedBy: req.user.id, reviewedAt: new Date() },
  });

  // Same conditional: only notify if the business was already created
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

  res.json({
    ok:      true,
    message: 'Request rejected',
    request: onboardingRequest,
  });
}

module.exports = {
  getAllOnboardingRequests,
  createOnboardingRequest,
  approveOnboardingRequest,
  rejectOnboardingRequest,
};