// backend/src/controllers/ratingController.js
const prisma = require('../lib/prisma');

// Helper function to normalize phone numbers
function normalizePhone(phone) {
  if (!phone) return '';
  return phone.replace(/\D/g, ''); // Remove all non-digit characters
}

// Submit or update rating
async function submitRating(req, res) {
  const { productId } = req.params;
  const { phone, rating, comment } = req.body;
  
  // Validate
  if (!phone || !rating) {
    throw new Error('Phone number and rating are required');
  }
  
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }
  
  // Normalize phone number
  const normalizedPhone = normalizePhone(phone);
  
  console.log('⭐ Rating submission:');
  console.log('   Product ID:', productId);
  console.log('   Original phone:', phone);
  console.log('   Normalized phone:', normalizedPhone);
  console.log('   Rating:', rating);
  
  // Check if product exists
  const product = await prisma.product.findUnique({
    where: { id: Number(productId) },
    include: { 
      business: {
        select: {
          id: true,
          slug: true,
          businessName: true
        }
      }
    }
  });
  
  if (!product) {
    console.log('❌ Product not found');
    throw new Error('Product not found');
  }
  
  console.log('✅ Product found:', product.name);
  console.log('   Business:', product.business.businessName, `(${product.business.slug})`);
  
  // 🔥 OPTIONAL: Validate product belongs to correct business context
  // (Only if you're using subdomain middleware that sets req.businessId)
  if (req.businessId && product.businessId !== req.businessId) {
    console.log('❌ Product does not belong to current business context');
    return res.status(403).json({
      success: false,
      error: 'Product not available in this business'
    });
  }
  
  // Debug: Check all orders for this phone
  const allOrders = await prisma.order.findMany({
    where: { 
      phone: normalizedPhone,
      businessId: product.businessId  // 🔥 ADDED: Only orders from this business
    },
    select: {
      id: true,
      phone: true,
      status: true,
      paymentStatus: true,
      createdAt: true,
      items: {
        select: {
          productId: true,
          product: {
            select: { id: true, name: true }
          }
        }
      }
    }
  });
  
  console.log(`📦 Found ${allOrders.length} order(s) for this phone number in business ${product.businessId}`);
  
  if (allOrders.length > 0) {
    allOrders.forEach((order, index) => {
      console.log(`   Order ${index + 1}:`);
      console.log(`     - ID: ${order.id}`);
      console.log(`     - Status: ${order.status}`);
      console.log(`     - Payment: ${order.paymentStatus}`);
      console.log(`     - Products: ${order.items.map(i => i.product.name).join(', ')}`);
      console.log(`     - Has this product: ${order.items.some(i => i.productId === Number(productId))}`);
    });
  }
  
  // ⭐ KEY CHECK: Customer must have ordered this product with CONFIRMED payment AND DELIVERED status
  const hasOrdered = await prisma.orderItem.findFirst({
    where: {
      productId: Number(productId),
      order: {
        phone: normalizedPhone,
        businessId: product.businessId,  // 🔥 ADDED: Same business
        paymentStatus: 'CONFIRMED',      // ⭐ Must be paid
        status: 'DELIVERED'               // ⭐ Must be delivered
      }
    },
    include: {
      order: {
        select: {
          id: true,
          phone: true,
          status: true,
          paymentStatus: true,
          businessId: true,
          createdAt: true
        }
      }
    }
  });
  
  if (hasOrdered) {
    console.log('✅ Eligible order found:');
    console.log('   Order ID:', hasOrdered.order.id);
    console.log('   Status:', hasOrdered.order.status);
    console.log('   Payment:', hasOrdered.order.paymentStatus);
    console.log('   Business ID:', hasOrdered.order.businessId);
  } else {
    console.log('❌ No eligible order found (must be DELIVERED with CONFIRMED payment from same business)');
  }
  
  if (!hasOrdered) {
    // Provide detailed error message
    const hasAnyOrder = allOrders.some(o => 
      o.items.some(i => i.productId === Number(productId))
    );
    
    let errorMessage = 'You can only rate products you have purchased and received';
    let debugInfo = {
      normalizedPhone,
      productId: Number(productId),
      businessId: product.businessId,
      totalOrders: allOrders.length,
      hasOrderedProduct: hasAnyOrder,
    };
    
    if (hasAnyOrder) {
      const orderWithProduct = allOrders.find(o => 
        o.items.some(i => i.productId === Number(productId))
      );
      
      if (orderWithProduct) {
        debugInfo.orderStatus = orderWithProduct.status;
        debugInfo.paymentStatus = orderWithProduct.paymentStatus;
        
        if (orderWithProduct.paymentStatus !== 'CONFIRMED') {
          errorMessage = 'Your order payment must be confirmed before you can rate';
        } else if (orderWithProduct.status !== 'DELIVERED') {
          errorMessage = `Your order must be delivered before you can rate (Current status: ${orderWithProduct.status})`;
        }
      }
    }
    
    return res.status(403).json({
      success: false,
      error: errorMessage,
      debug: debugInfo
    });
  }
  
  // Upsert rating (create or update)
  const productRating = await prisma.productRating.upsert({
    where: {
      productId_phone: {
        productId: Number(productId),
        phone: normalizedPhone
      }
    },
    update: {
      rating,
      comment: comment || null
    },
    create: {
      productId: Number(productId),
      phone: normalizedPhone,
      rating,
      comment: comment || null
    }
  });
  
  // Calculate new average rating
  const ratings = await prisma.productRating.aggregate({
    where: { productId: Number(productId) },
    _avg: { rating: true },
    _count: true
  });
  
  console.log('✅ Rating submitted successfully!');
  console.log('   Average rating:', ratings._avg.rating);
  console.log('   Total ratings:', ratings._count);
  
  res.json({
    success: true,
    rating: productRating,
    averageRating: ratings._avg.rating || 0,
    totalRatings: ratings._count || 0
  });
}

// Get ratings for a product
async function getProductRatings(req, res) {
  const { productId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  
  console.log(`📊 Fetching ratings for product ${productId}`);
  
  // 🔥 OPTIONAL: Verify product belongs to correct business
  if (req.businessId) {
    const product = await prisma.product.findFirst({
      where: { 
        id: Number(productId),
        businessId: req.businessId
      }
    });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found in this business'
      });
    }
  }
  
  const [ratings, total, stats] = await Promise.all([
    prisma.productRating.findMany({
      where: { productId: Number(productId) },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: Number(limit),
      select: {
        rating: true,
        comment: true,
        createdAt: true,
        phone: true
      }
    }),
    prisma.productRating.count({
      where: { productId: Number(productId) }
    }),
    prisma.productRating.aggregate({
      where: { productId: Number(productId) },
      _avg: { rating: true },
      _count: true
    })
  ]);
  
  // Mask phone numbers for privacy
  const maskedRatings = ratings.map(r => ({
    ...r,
    phone: r.phone.slice(-4).padStart(r.phone.length, '*')
  }));
  
  console.log(`✅ Retrieved ${ratings.length} ratings (Total: ${total})`);
  
  res.json({
    success: true,
    ratings: maskedRatings,
    averageRating: stats._avg.rating || 0,
    totalRatings: stats._count || 0,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit)
    }
  });
}

// Check if user can rate
async function canRate(req, res) {
  const { productId } = req.params;
  const { phone } = req.query;
  
  if (!phone) {
    throw new Error('Phone number required');
  }
  
  const normalizedPhone = normalizePhone(phone);
  
  console.log('🔍 Checking if can rate:');
  console.log('   Product ID:', productId);
  console.log('   Normalized phone:', normalizedPhone);
  
  // Get product with business info
  const product = await prisma.product.findUnique({
    where: { id: Number(productId) },
    select: { 
      id: true, 
      businessId: true,
      name: true
    }
  });
  
  if (!product) {
    throw new Error('Product not found');
  }
  
  // 🔥 OPTIONAL: Validate business context
  if (req.businessId && product.businessId !== req.businessId) {
    return res.json({
      success: true,
      canRate: false,
      hasRated: false,
      rating: null,
      reason: 'Product not available in this business'
    });
  }
  
  // Check if has ordered and delivered with confirmed payment
  const hasOrdered = await prisma.orderItem.findFirst({
    where: {
      productId: Number(productId),
      order: {
        phone: normalizedPhone,
        businessId: product.businessId,  // 🔥 ADDED: Same business
        paymentStatus: 'CONFIRMED',
        status: 'DELIVERED'
      }
    },
    include: {
      order: {
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          businessId: true
        }
      }
    }
  });
  
  // Check if already rated
  const existingRating = await prisma.productRating.findUnique({
    where: {
      productId_phone: {
        productId: Number(productId),
        phone: normalizedPhone
      }
    }
  });
  
  console.log('   Can rate:', !!hasOrdered);
  console.log('   Has rated:', !!existingRating);
  
  if (hasOrdered) {
    console.log('   Order ID:', hasOrdered.order.id);
    console.log('   Order status:', hasOrdered.order.status);
    console.log('   Payment status:', hasOrdered.order.paymentStatus);
    console.log('   Business ID:', hasOrdered.order.businessId);
  }
  
  res.json({
    success: true,
    canRate: !!hasOrdered,
    hasRated: !!existingRating,
    rating: existingRating || null
  });
}

module.exports = {
  submitRating,
  getProductRatings,
  canRate
};