// backend/src/routes/orders.js
const express = require('express');
const { checkout, getAllOrders, getOrderById, confirmPayment, updateOrderStatus, trackOrder, deleteOrder } = require('../controllers/orderController');
const { authMiddleware, requireSuperAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

router.post('/checkout', asyncHandler(checkout));
router.get('/track/:orderId', asyncHandler(trackOrder));
router.get('/', authMiddleware, asyncHandler(getAllOrders));
router.get('/:id', authMiddleware, asyncHandler(getOrderById));
router.post('/:id/confirm-payment', authMiddleware, asyncHandler(confirmPayment));
router.patch('/:id/status', authMiddleware, asyncHandler(updateOrderStatus));
router.delete('/:id', authMiddleware, requireSuperAdmin, asyncHandler(deleteOrder));

module.exports = router;