// backend/src/routes/stats.js
const express = require('express');
const { getSuperAdminStats, getBusinessStats } = require('../controllers/statsController');
const { authMiddleware, requireSuperAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// GET /api/stats/super-admin - Platform statistics (super-admin only)
router.get('/super-admin', authMiddleware, requireSuperAdmin, asyncHandler(getSuperAdminStats));

// GET /api/stats/business/:id - Business statistics (super-admin or business owner)
router.get('/business/:id', authMiddleware, asyncHandler(getBusinessStats));

module.exports = router;