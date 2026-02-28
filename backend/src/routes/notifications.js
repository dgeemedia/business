// backend/src/routes/notifications.js
const express = require('express');
const {
  getNotifications,
  getArchivedNotifications,
  markAsRead,
  markAllAsRead,
  deleteOldNotifications,
} = require('../controllers/notificationController');
const { authMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// GET  /api/notifications           — active notifications + unreadCount
router.get('/',              authMiddleware, asyncHandler(getNotifications));

// GET  /api/notifications/archived  — older than 30 days
router.get('/archived',      authMiddleware, asyncHandler(getArchivedNotifications));

// PATCH /api/notifications/:id/read
router.patch('/:id/read',    authMiddleware, asyncHandler(markAsRead));

// POST /api/notifications/read-all
router.post('/read-all',     authMiddleware, asyncHandler(markAllAsRead));

// DELETE /api/notifications/cleanup
router.delete('/cleanup',    authMiddleware, asyncHandler(deleteOldNotifications));

module.exports = router;