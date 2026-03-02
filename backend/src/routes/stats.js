// backend/src/routes/stats.js
const express = require('express');
const { getSuperAdminStats, getBusinessStats, getAllBusinessesStats } = require('../controllers/statsController');
const { authMiddleware, requireSuperAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// GET /api/stats/super-admin — Platform-wide stats (super-admin only)
router.get('/super-admin', authMiddleware, requireSuperAdmin, asyncHandler(getSuperAdminStats));

// GET /api/stats/all-businesses — Per-business revenue summary (super-admin only)
router.get('/all-businesses', authMiddleware, requireSuperAdmin, asyncHandler(getAllBusinessesStats));

// GET /api/stats/business/:id — Single business stats (super-admin or business owner)
router.get('/business/:id', authMiddleware, asyncHandler(getBusinessStats));

module.exports = router;