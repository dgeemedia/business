// backend/src/routes/products.js
const express = require('express');
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleAvailability,
  addProductImage,
  deleteProductImage,
  reorderProductImages,
} = require('../controllers/productController');
const {
  authMiddleware,
  requireAdmin,
  requireActiveSubscription,
} = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// ── Read (any authenticated user of an active business) ──────────────────────
router.get('/',    authMiddleware, requireActiveSubscription, asyncHandler(getAllProducts));
router.get('/:id', authMiddleware, requireActiveSubscription, asyncHandler(getProductById));

// ── Write (admin or super-admin of an active business) ───────────────────────
router.post('/',      authMiddleware, requireActiveSubscription, requireAdmin, asyncHandler(createProduct));
router.put('/:id',    authMiddleware, requireActiveSubscription, requireAdmin, asyncHandler(updateProduct));
router.delete('/:id', authMiddleware, requireActiveSubscription, requireAdmin, asyncHandler(deleteProduct));

router.patch('/:id/toggle', authMiddleware, requireActiveSubscription, requireAdmin, asyncHandler(toggleAvailability));

// ── Image management ──────────────────────────────────────────────────────────
router.post('/:productId/images',        authMiddleware, requireActiveSubscription, requireAdmin, asyncHandler(addProductImage));
router.delete('/images/:imageId',        authMiddleware, requireActiveSubscription, requireAdmin, asyncHandler(deleteProductImage));
router.put('/:productId/images/reorder', authMiddleware, requireActiveSubscription, requireAdmin, asyncHandler(reorderProductImages));

module.exports = router;