// backend/src/routes/business.js
const express = require('express');
const router = express.Router();
const {
  getBusinessBySlug,
  getAllBusinesses,
  getBusiness,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  getCurrentBusiness,
  toggleBusinessStatus,
  getPublicBusiness,
  getPublicProducts,     
  getAllPublicBusinesses,
} = require('../controllers/businessController');

const {
  startFreeTrial,
  updateSubscription,
  getSubscriptionStatusDetails,
  getExpiringSubscriptions,
  bulkRenewSubscriptions,
} = require('../controllers/subscriptionController');

const { authMiddleware, requireSuperAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// ── Public routes (no auth) ──────────────────────────────────────────────────
router.get('/public/all', asyncHandler(getAllPublicBusinesses));          // ✅ specific first
router.get('/public/:slug', asyncHandler(getPublicBusiness));             // ✅ one handler
router.get('/public/:slug/products', asyncHandler(getPublicProducts));    // ✅ uses getPublicProducts (has images include)

router.get('/by-slug/:slug', asyncHandler(getBusinessBySlug));

// ── Authenticated specific paths (before /:id) ───────────────────────────────
router.get('/current',   authMiddleware, asyncHandler(getCurrentBusiness));
router.get('/expiring',  authMiddleware, requireSuperAdmin, asyncHandler(getExpiringSubscriptions));

// ── Super-admin collection routes ────────────────────────────────────────────
router.get('/',          authMiddleware, requireSuperAdmin, asyncHandler(getAllBusinesses));
router.post('/',         authMiddleware, requireSuperAdmin, asyncHandler(createBusiness));
router.post('/bulk-renew', authMiddleware, requireSuperAdmin, asyncHandler(bulkRenewSubscriptions));

// ── Dynamic /:id routes (last) ───────────────────────────────────────────────
router.get('/:id',       authMiddleware, asyncHandler(getBusiness));
router.get('/:id/subscription-status', authMiddleware, asyncHandler(getSubscriptionStatusDetails));
router.put('/:id',       authMiddleware, asyncHandler(updateBusiness));
router.delete('/:id',    authMiddleware, requireSuperAdmin, asyncHandler(deleteBusiness));
router.post('/:id/toggle-status',       authMiddleware, requireSuperAdmin, asyncHandler(toggleBusinessStatus));
router.post('/:id/update-subscription', authMiddleware, requireSuperAdmin, asyncHandler(updateSubscription));
router.post('/:id/start-trial',         authMiddleware, requireSuperAdmin, asyncHandler(startFreeTrial));

module.exports = router;