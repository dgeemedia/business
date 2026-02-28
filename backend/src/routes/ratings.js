// backend/src/routes/ratings.js
//
// ✅ Uses { authMiddleware } — matches what auth.js actually exports
//
// Route map:
//   POST  /api/products/:productId/ratings         → submitRating      (public)
//   GET   /api/products/:productId/ratings         → getProductRatings (public)
//   GET   /api/products/:productId/can-rate?phone= → canRate           (public)
//   GET   /api/ratings                             → getBusinessRatings (auth required)

const express = require('express');
const { asyncHandler }  = require('../middleware/errorHandler');
const { authMiddleware } = require('../middleware/auth');   // ✅ correct export name
const {
  submitRating,
  getProductRatings,
  canRate,
  getBusinessRatings,
} = require('../controllers/ratingController');

const router = express.Router();

// ── Public product-level endpoints ───────────────────────────────────────────
router.post('/products/:productId/ratings',  asyncHandler(submitRating));
router.get ('/products/:productId/ratings',  asyncHandler(getProductRatings));
router.get ('/products/:productId/can-rate', asyncHandler(canRate));

// ── Authenticated: all ratings for this business (used by Reviews.jsx) ───────
router.get('/ratings', authMiddleware, asyncHandler(getBusinessRatings));

module.exports = router;