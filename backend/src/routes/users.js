// backend/src/routes/users.js (UPDATED)
const express = require('express');
const { 
  getAllUsers, 
  createUser, 
  updateUser, 
  suspendUser, 
  reactivateUser,
  deleteUser 
} = require('../controllers/userController');
const { authMiddleware, requireAdmin, preventStaff } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// ✅ Super-admin and Admin can view users
router.get('/', authMiddleware, requireAdmin, asyncHandler(getAllUsers));

// ✅ Super-admin and Admin can create users (but not staff)
router.post('/', authMiddleware, requireAdmin, asyncHandler(createUser));

// ✅ Super-admin and Admin can update users
router.put('/:id', authMiddleware, requireAdmin, asyncHandler(updateUser));

// ✅ NEW: Super-admin and Admin can suspend users
router.post('/:id/suspend', authMiddleware, requireAdmin, asyncHandler(suspendUser));

// ✅ NEW: Super-admin and Admin can reactivate users
router.post('/:id/reactivate', authMiddleware, requireAdmin, asyncHandler(reactivateUser));

// ✅ Super-admin and Admin can delete users (with restrictions in controller)
router.delete('/:id', authMiddleware, requireAdmin, asyncHandler(deleteUser));

module.exports = router;
