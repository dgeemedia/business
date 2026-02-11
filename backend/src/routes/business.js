// backend/src/routes/business.js (FIXED route order)
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
  toggleBusinessStatus
} = require('../controllers/businessController');

const {
  startFreeTrial,
  updateSubscription,
  getSubscriptionStatusDetails,
  getExpiringSubscriptions,
  bulkRenewSubscriptions
} = require('../controllers/subscriptionController');

const { authMiddleware, requireSuperAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// ============================================================================
// PUBLIC ROUTES (no auth required)
// ============================================================================

// GET /api/business/by-slug/:slug
// Used by frontend to load business data from subdomain
router.get('/by-slug/:slug', asyncHandler(getBusinessBySlug));

// ============================================================================
// AUTHENTICATED ROUTES - SPECIFIC PATHS FIRST (before /:id)
// ============================================================================

// GET /api/business/current
// Get current user's business
router.get('/current', authMiddleware, asyncHandler(getCurrentBusiness));

// GET /api/business/expiring
// Get businesses with expiring subscriptions (MUST come before /:id)
router.get('/expiring', authMiddleware, requireSuperAdmin, asyncHandler(getExpiringSubscriptions));

// ============================================================================
// SUPER-ADMIN ONLY ROUTES - SPECIFIC PATHS
// ============================================================================

// GET /api/business
// List all businesses (super-admin only)
router.get('/', authMiddleware, requireSuperAdmin, asyncHandler(getAllBusinesses));

// POST /api/business
// Create new business (super-admin only)
router.post('/', authMiddleware, requireSuperAdmin, asyncHandler(createBusiness));

// POST /api/business/bulk-renew
// Bulk renew multiple businesses
router.post('/bulk-renew', authMiddleware, requireSuperAdmin, asyncHandler(bulkRenewSubscriptions));

// ============================================================================
// DYNAMIC ROUTES - MUST COME LAST
// ============================================================================

// GET /api/business/:id
// Get single business (user's own or super-admin can view any)
router.get('/:id', authMiddleware, asyncHandler(getBusiness));

// GET /api/business/:id/subscription-status
// Get subscription details for a business
router.get('/:id/subscription-status', authMiddleware, asyncHandler(getSubscriptionStatusDetails));

// PUT /api/business/:id
// Update business
router.put('/:id', authMiddleware, asyncHandler(updateBusiness));

// DELETE /api/business/:id
// Delete business (super-admin only)
router.delete('/:id', authMiddleware, requireSuperAdmin, asyncHandler(deleteBusiness));

// POST /api/business/:id/toggle-status
// Suspend or reactivate a business
router.post('/:id/toggle-status', authMiddleware, requireSuperAdmin, asyncHandler(toggleBusinessStatus));

// POST /api/business/:id/update-subscription
// Update subscription plan and expiry
router.post('/:id/update-subscription', authMiddleware, requireSuperAdmin, asyncHandler(updateSubscription));

// POST /api/business/:id/start-trial
// Start 14-day free trial
router.post('/:id/start-trial', authMiddleware, requireSuperAdmin, asyncHandler(startFreeTrial));

module.exports = router;