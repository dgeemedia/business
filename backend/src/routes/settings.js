// backend/src/routes/settings.js (UPDATED)
const express = require('express');
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { authMiddleware, requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// ✅ Anyone authenticated can view settings
router.get('/', asyncHandler(getSettings));

// ✅ RESTRICTED: Only Super-admin and Admin can update settings
// Staff CANNOT access this route
router.patch('/', authMiddleware, requireAdmin, asyncHandler(updateSettings));

module.exports = router;