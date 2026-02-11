// backend/src/routes/upload.js
const express = require('express');
const upload = require('../middleware/upload');
const { uploadImage } = require('../controllers/uploadController');
const { authMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Handle multer errors in middleware
const uploadMiddleware = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          ok: false,
          error: 'File is too large. Maximum size is 5MB.'
        });
      }
      return res.status(400).json({
        ok: false,
        error: err.message || 'File upload failed'
      });
    }
    next();
  });
};

router.post('/', authMiddleware, uploadMiddleware, asyncHandler(uploadImage));

module.exports = router;