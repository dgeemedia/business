// backend/src/routes/onboarding.js
const express = require('express');
const router = express.Router();
const { 
  getAllOnboardingRequests,
  createOnboardingRequest,
  approveOnboardingRequest,
  rejectOnboardingRequest
} = require('../controllers/onboardingController');
const { authMiddleware, requireSuperAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// Public routes
router.get('/businesses', asyncHandler(async (req, res) => {
  const businesses = await require('../lib/prisma').business.findMany({
    where: { isActive: true }, // Only show active businesses
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      slug: true,
      businessName: true,
      businessType: true,
      logo: true,
      description: true,
      phone: true,
      whatsappNumber: true,
      primaryColor: true,
      secondaryColor: true,
      _count: { select: { products: true } }
    }
  });
  res.json(businesses);
}));

router.post('/submit', asyncHandler(createOnboardingRequest));

// Super-admin only routes
router.get('/requests', authMiddleware, requireSuperAdmin, asyncHandler(getAllOnboardingRequests));
router.post('/requests/:id/approve', authMiddleware, requireSuperAdmin, asyncHandler(approveOnboardingRequest));
router.post('/requests/:id/reject', authMiddleware, requireSuperAdmin, asyncHandler(rejectOnboardingRequest));

module.exports = router;