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
  // ✅ NEW: public storefront handlers
  getPublicBusiness,
  getPublicBusinessProducts,
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

// ============================================================================
// ✅ PUBLIC ROUTES — no auth, no subdomain context needed
//    MUST be declared before /:id so Express doesn't try to parse
//    "public" or "by-slug" as a numeric business ID.
// ============================================================================

// GET /api/business/public/:slug
// Storefront: load business info by slug
router.get('/public/:slug', asyncHandler(getPublicBusiness));

// GET /api/business/public/:slug/products
// Storefront: load available products for a business
router.get('/public/:slug/products', asyncHandler(getPublicBusinessProducts));

// GET /api/business/by-slug/:slug  (legacy / internal use)
router.get('/by-slug/:slug', asyncHandler(getBusinessBySlug));

// ============================================================================
// AUTHENTICATED ROUTES — specific paths before /:id
// ============================================================================

// GET /api/business/current
router.get('/current', authMiddleware, asyncHandler(getCurrentBusiness));

// GET /api/business/expiring
router.get('/expiring', authMiddleware, requireSuperAdmin, asyncHandler(getExpiringSubscriptions));

// ============================================================================
// SUPER-ADMIN COLLECTION ROUTES
// ============================================================================

// GET  /api/business
router.get('/', authMiddleware, requireSuperAdmin, asyncHandler(getAllBusinesses));

// POST /api/business
router.post('/', authMiddleware, requireSuperAdmin, asyncHandler(createBusiness));

// POST /api/business/bulk-renew
router.post('/bulk-renew', authMiddleware, requireSuperAdmin, asyncHandler(bulkRenewSubscriptions));

// ============================================================================
// DYNAMIC /:id ROUTES — must come last
// ============================================================================

// GET /api/business/:id
router.get('/:id', authMiddleware, asyncHandler(getBusiness));

// GET /api/business/:id/subscription-status
router.get('/:id/subscription-status', authMiddleware, asyncHandler(getSubscriptionStatusDetails));

// PUT /api/business/:id
router.put('/:id', authMiddleware, asyncHandler(updateBusiness));

// DELETE /api/business/:id
router.delete('/:id', authMiddleware, requireSuperAdmin, asyncHandler(deleteBusiness));

// POST /api/business/:id/toggle-status
router.post('/:id/toggle-status', authMiddleware, requireSuperAdmin, asyncHandler(toggleBusinessStatus));

// POST /api/business/:id/update-subscription
router.post('/:id/update-subscription', authMiddleware, requireSuperAdmin, asyncHandler(updateSubscription));

// POST /api/business/:id/start-trial
router.post('/:id/start-trial', authMiddleware, requireSuperAdmin, asyncHandler(startFreeTrial));

module.exports = router;