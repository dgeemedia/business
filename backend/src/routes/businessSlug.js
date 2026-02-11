// backend/src/routes/businessSlug.js
const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// GET /api/business/by-slug/:slug
router.get('/by-slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const business = await prisma.businessSettings.findUnique({
      where: { slug: slug }
    });
    
    if (!business) {
      return res.status(404).json({ 
        error: 'Business not found' 
      });
    }
    
    res.json(business);
  } catch (error) {
    console.error('Error fetching business:', error);
    res.status(500).json({ error: 'Failed to fetch business' });
  }
});

module.exports = router;