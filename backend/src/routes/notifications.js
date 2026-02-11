// backend/src/routes/notifications.js
const express = require('express');
const { 
  getNotifications, 
  getArchivedNotifications,
  markAsRead, 
  markAllAsRead,
  deleteOldNotifications 
} = require('../controllers/notificationController');
const { authMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Get active notifications (less than 30 days old)
router.get('/', authMiddleware, asyncHandler(getNotifications));

// Get archived notifications (older than 30 days)
router.get('/archived', authMiddleware, asyncHandler(getArchivedNotifications));

// Mark single notification as read
router.patch('/:id/read', authMiddleware, asyncHandler(markAsRead));

// Mark all active notifications as read
router.post('/read-all', authMiddleware, asyncHandler(markAllAsRead));

// Delete old notifications (admin only - optional cleanup endpoint)
router.delete('/cleanup', authMiddleware, asyncHandler(deleteOldNotifications));

module.exports = router;