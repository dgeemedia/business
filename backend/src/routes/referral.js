// backend/src/routes/referral.js

const express = require('express');
const router  = express.Router();
const {
  validateReferralCode,
  getReferralDashboard,
  redeemReferralBonus,
  getAdminReferralOverview,
  generateCode,
} = require('../controllers/referralController');
const { authMiddleware, requireSuperAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// ── Public ────────────────────────────────────────────────────────────────────
// Validate a referral code during registration (no auth needed)
router.get('/validate/:code', asyncHandler(validateReferralCode));

// ── Authenticated business ────────────────────────────────────────────────────
// Get the dashboard stats for the logged-in business
router.get('/dashboard', authMiddleware, asyncHandler(getReferralDashboard));

// Generate/retrieve referral code for the logged-in business
router.post('/generate', authMiddleware, asyncHandler(generateCode));

// ── Super-admin ───────────────────────────────────────────────────────────────
// Platform-wide referral overview
router.get('/admin/overview', authMiddleware, requireSuperAdmin, asyncHandler(getAdminReferralOverview));

// Apply/redeem bonus for a business
router.post('/redeem', authMiddleware, requireSuperAdmin, asyncHandler(redeemReferralBonus));

module.exports = router;