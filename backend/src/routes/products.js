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
const { authMiddleware, requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Public — anyone can view
router.get('/',    asyncHandler(getAllProducts));
router.get('/:id', asyncHandler(getProductById));

// Admin only — create / update / delete
router.post('/',    authMiddleware, requireAdmin, asyncHandler(createProduct));
router.put('/:id',  authMiddleware, requireAdmin, asyncHandler(updateProduct));
router.delete('/:id', authMiddleware, requireAdmin, asyncHandler(deleteProduct));

// ✅ NEW: toggle availability (was missing from routes entirely)
router.patch('/:id/toggle', authMiddleware, requireAdmin, asyncHandler(toggleAvailability));

// Image management
router.post('/:productId/images',          authMiddleware, requireAdmin, asyncHandler(addProductImage));
router.delete('/images/:imageId',          authMiddleware, requireAdmin, asyncHandler(deleteProductImage));
router.put('/:productId/images/reorder',   authMiddleware, requireAdmin, asyncHandler(reorderProductImages));

module.exports = router;