// backend/src/routes/products.js (UPDATED)
const express = require('express');
const { 
  getAllProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  addProductImage,
  deleteProductImage,
  reorderProductImages
} = require('../controllers/productController');
const { authMiddleware, requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Public routes (anyone can view products)
router.get('/', asyncHandler(getAllProducts));
router.get('/:id', asyncHandler(getProductById));

// ✅ RESTRICTED: Only Super-admin and Admin can create/update/delete products
// Staff CANNOT access these routes
router.post('/', authMiddleware, requireAdmin, asyncHandler(createProduct));
router.put('/:id', authMiddleware, requireAdmin, asyncHandler(updateProduct));
router.delete('/:id', authMiddleware, requireAdmin, asyncHandler(deleteProduct));

// ✅ RESTRICTED: Only Super-admin and Admin can manage product images
router.post('/:productId/images', authMiddleware, requireAdmin, asyncHandler(addProductImage));
router.delete('/images/:imageId', authMiddleware, requireAdmin, asyncHandler(deleteProductImage));
router.put('/:productId/images/reorder', authMiddleware, requireAdmin, asyncHandler(reorderProductImages));

module.exports = router;