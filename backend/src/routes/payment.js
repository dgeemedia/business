// backend/src/routes/payment.js

const express = require('express');
const { asyncHandler }   = require('../middleware/errorHandler');
const { authMiddleware } = require('../middleware/auth');
const {
  verifyPayment,
  getSubscriptionStatus,
  contactSupport,
} = require('../controllers/paymentController');

const router = express.Router();

// Subscription status — authenticated business owner
router.get(
  '/business/:id/subscription-status',
  authMiddleware,
  asyncHandler(getSubscriptionStatus)
);

// Verify payment — authenticated (called from frontend after gateway success)
router.post(
  '/business/:id/verify-payment',
  authMiddleware,
  asyncHandler(verifyPayment)
);

// Contact support / manual payment notification — authenticated
router.post(
  '/contact-support',
  authMiddleware,
  asyncHandler(contactSupport)
);

module.exports = router;