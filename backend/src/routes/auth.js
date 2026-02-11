// backend/src/routes/auth.js
const express = require('express');
const { login, getCurrentUser, changePassword } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

router.post('/login', asyncHandler(login));
router.get('/me', authMiddleware, asyncHandler(getCurrentUser));
router.post('/change-password', authMiddleware, asyncHandler(changePassword));

module.exports = router;