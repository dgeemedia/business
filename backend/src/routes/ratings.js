// backend/src/routes/ratings.js
const express = require('express');
const { submitRating, getProductRatings, canRate } = require('../controllers/ratingController');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

router.post('/products/:productId/ratings', asyncHandler(submitRating));
router.get('/products/:productId/ratings', asyncHandler(getProductRatings));
router.get('/products/:productId/can-rate', asyncHandler(canRate));

module.exports = router;
