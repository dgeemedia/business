// backend/src/routes/auth.js
const express = require('express');
const { login, getCurrentUser, changePassword } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// ✅ Login - No changes needed, subdomain middleware runs first
router.post('/login', asyncHandler(login));

// ✅ Get current user - requires authentication
router.get('/me', authMiddleware, asyncHandler(getCurrentUser));

// ✅ Change password - requires authentication
router.post('/change-password', authMiddleware, asyncHandler(changePassword));

module.exports = router;