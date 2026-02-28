// backend/src/routes/orders.js
const express = require('express');
const {
  checkout,
  getAllOrders,
  getOrderById,
  confirmPayment,
  updateOrderStatus,
  trackOrder,
  deleteOrder,
  getOrderStats,           // ✅ ADD THIS
} = require('../controllers/orderController');
const { authMiddleware, requireSuperAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

router.post('/checkout', asyncHandler(checkout));
router.get('/track/:orderId', asyncHandler(trackOrder));
router.get('/stats', authMiddleware, asyncHandler(getOrderStats));   // ✅ MOVED UP — must be before /:id
router.get('/', authMiddleware, asyncHandler(getAllOrders));
router.get('/:id', authMiddleware, asyncHandler(getOrderById));
router.post('/:id/confirm-payment', authMiddleware, asyncHandler(confirmPayment));
router.patch('/:id/status', authMiddleware, asyncHandler(updateOrderStatus));
router.delete('/:id', authMiddleware, requireSuperAdmin, asyncHandler(deleteOrder));

module.exports = router;