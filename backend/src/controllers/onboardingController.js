// backend/src/controllers/onboardingController.js
const prisma = require('../lib/prisma');

// Get all onboarding requests (super-admin only)
async function getAllOnboardingRequests(req, res) {
  if (req.user.role !== 'super-admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  const { status } = req.query;
  
  const where = status ? { status } : {};
  
  const requests = await prisma.onboardingRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  });
  
  res.json(requests);
}

// Create onboarding request (public)
async function createOnboardingRequest(req, res) {
  const {
    businessName,
    businessType,
    ownerName,
    ownerEmail,
    ownerPhone,
    description,
    preferredSlug
  } = req.body;

  if (!businessName || !ownerName || !ownerEmail || !ownerPhone) {
    return res.status(400).json({ 
      error: 'Business name, owner name, email, and phone are required' 
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
      status: 'pending'
    }
  });

  console.log('📋 New onboarding request:', request.businessName);

  res.json({
    ok: true,
    message: 'Thank you! Your request has been submitted. Our team will contact you within 24 hours.',
    request
  });
}

// Approve onboarding request (super-admin only)
async function approveOnboardingRequest(req, res) {
  if (req.user.role !== 'super-admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  const requestId = Number(req.params.id);
  
  const onboardingRequest = await prisma.onboardingRequest.findUnique({
    where: { id: requestId }
  });
  
  if (!onboardingRequest) {
    return res.status(404).json({ error: 'Request not found' });
  }
  
  if (onboardingRequest.status !== 'pending') {
    return res.status(400).json({ error: 'Request already processed' });
  }
  
  await prisma.onboardingRequest.update({
    where: { id: requestId },
    data: {
      status: 'approved',
      reviewedBy: req.user.id,
      reviewedAt: new Date()
    }
  });
  
  console.log('✅ Approved onboarding request:', onboardingRequest.businessName);
  
  res.json({
    ok: true,
    message: 'Request approved. You can now create the business.',
    request: onboardingRequest
  });
}

// Reject onboarding request (super-admin only)
async function rejectOnboardingRequest(req, res) {
  if (req.user.role !== 'super-admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  const requestId = Number(req.params.id);
  const { rejectionReason } = req.body;
  
  const onboardingRequest = await prisma.onboardingRequest.findUnique({
    where: { id: requestId }
  });
  
  if (!onboardingRequest) {
    return res.status(404).json({ error: 'Request not found' });
  }
  
  await prisma.onboardingRequest.update({
    where: { id: requestId },
    data: {
      status: 'rejected',
      rejectionReason,
      reviewedBy: req.user.id,
      reviewedAt: new Date()
    }
  });
  
  console.log('❌ Rejected onboarding request:', onboardingRequest.businessName);
  
  res.json({
    ok: true,
    message: 'Request rejected',
    request: onboardingRequest
  });
}

module.exports = {
  getAllOnboardingRequests,
  createOnboardingRequest,
  approveOnboardingRequest,
  rejectOnboardingRequest
};