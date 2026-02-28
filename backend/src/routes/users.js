// backend/src/routes/users.js
const express = require('express');
const {
  getAllUsers,
  createUser,
  updateUser,
  suspendUser,
  reactivateUser,
  toggleUserStatus,
  deleteUser,
} = require('../controllers/userController');
const { authMiddleware, requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

router.get('/',                  authMiddleware, requireAdmin, asyncHandler(getAllUsers));
router.post('/',                 authMiddleware, requireAdmin, asyncHandler(createUser));
router.put('/:id',               authMiddleware, requireAdmin, asyncHandler(updateUser));
router.post('/:id/suspend',      authMiddleware, requireAdmin, asyncHandler(suspendUser));
router.post('/:id/reactivate',   authMiddleware, requireAdmin, asyncHandler(reactivateUser));
router.patch('/:id/toggle',      authMiddleware, requireAdmin, asyncHandler(toggleUserStatus)); // legacy
router.delete('/:id',            authMiddleware, requireAdmin, asyncHandler(deleteUser));

module.exports = router;