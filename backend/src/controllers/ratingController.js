// backend/src/controllers/ratingController.js
const prisma = require('../lib/prisma');
const notify = require('../lib/notify');

function normalizePhone(phone) {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

// ============================================================================
// SUBMIT OR UPDATE RATING
// POST /api/products/:productId/ratings
// Public — customer identified by the phone number used when ordering
// ============================================================================
async function submitRating(req, res) {
  const { productId } = req.params;
  const { phone, rating, comment } = req.body;

  if (!phone || !rating) {
    return res.status(400).json({ success: false, error: 'Phone number and rating are required' });
  }
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5' });
  }

  const normalizedPhone = normalizePhone(phone);

  const product = await prisma.product.findUnique({
    where:   { id: Number(productId) },
    include: { business: { select: { id: true, slug: true, businessName: true } } },
  });
  if (!product) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }

  // Tenant isolation
  if (req.businessId && product.businessId !== req.businessId) {
    return res.status(403).json({ success: false, error: 'Product not available in this business' });
  }

  // Must have a fully completed + delivered + payment-confirmed order for this product
  const hasOrdered = await prisma.orderItem.findFirst({
    where: {
      productId: Number(productId),
      order: {
        phone:         normalizedPhone,
        businessId:    product.businessId,
        paymentStatus: 'CONFIRMED',
        status:        'DELIVERED',
      },
    },
  });

  if (!hasOrdered) {
    // Give a specific reason if they have a partial order
    const anyOrder = await prisma.orderItem.findFirst({
      where: {
        productId: Number(productId),
        order: { phone: normalizedPhone, businessId: product.businessId },
      },
      include: { order: { select: { status: true, paymentStatus: true } } },
    });

    let errorMessage = 'You can only rate products you have purchased and received';
    if (anyOrder) {
      if (anyOrder.order.paymentStatus !== 'CONFIRMED') {
        errorMessage = 'Your order payment must be confirmed before you can rate this product';
      } else if (anyOrder.order.status !== 'DELIVERED') {
        errorMessage = `Your order must be delivered before you can rate (current status: ${anyOrder.order.status})`;
      }
    }

    return res.status(403).json({ success: false, error: errorMessage });
  }

  // Upsert: one rating per phone per product
  const productRating = await prisma.productRating.upsert({
    where:  { productId_phone: { productId: Number(productId), phone: normalizedPhone } },
    update: { rating, comment: comment || null },
    create: { productId: Number(productId), phone: normalizedPhone, rating, comment: comment || null },
  });

  const stats = await prisma.productRating.aggregate({
    where: { productId: Number(productId) },
    _avg:  { rating: true },
    _count: true,
  });

  await notify.review(product.businessId, product.name, rating);

  return res.json({
    success:       true,
    rating:        productRating,
    averageRating: stats._avg.rating || 0,
    totalRatings:  stats._count || 0,
  });
}

// ============================================================================
// GET RATINGS FOR A PRODUCT
// GET /api/products/:productId/ratings  (public)
// ============================================================================
async function getProductRatings(req, res) {
  const { productId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (req.businessId) {
    const product = await prisma.product.findFirst({
      where: { id: Number(productId), businessId: req.businessId },
    });
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found in this business' });
    }
  }

  const [ratings, total, stats] = await Promise.all([
    prisma.productRating.findMany({
      where:   { productId: Number(productId) },
      orderBy: { createdAt: 'desc' },
      skip:    (Number(page) - 1) * Number(limit),
      take:    Number(limit),
      select:  { rating: true, comment: true, createdAt: true, phone: true },
    }),
    prisma.productRating.count({ where: { productId: Number(productId) } }),
    prisma.productRating.aggregate({
      where: { productId: Number(productId) },
      _avg:  { rating: true },
      _count: true,
    }),
  ]);

  const maskedRatings = ratings.map(r => ({
    ...r,
    phone: r.phone.slice(-4).padStart(r.phone.length, '*'),
  }));

  return res.json({
    success:       true,
    ratings:       maskedRatings,
    averageRating: stats._avg.rating || 0,
    totalRatings:  stats._count || 0,
    pagination: {
      total,
      page:       Number(page),
      limit:      Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
}

// ============================================================================
// CAN RATE CHECK
// GET /api/products/:productId/can-rate?phone=...  (public)
// ============================================================================
async function canRate(req, res) {
  const { productId } = req.params;
  const { phone }     = req.query;

  if (!phone) {
    return res.status(400).json({ success: false, error: 'Phone number required' });
  }

  const normalizedPhone = normalizePhone(phone);

  const product = await prisma.product.findUnique({
    where:  { id: Number(productId) },
    select: { id: true, businessId: true, name: true },
  });
  if (!product) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }

  if (req.businessId && product.businessId !== req.businessId) {
    return res.json({ success: true, canRate: false, hasRated: false, rating: null });
  }

  const [hasOrdered, existingRating] = await Promise.all([
    prisma.orderItem.findFirst({
      where: {
        productId: Number(productId),
        order: {
          phone:         normalizedPhone,
          businessId:    product.businessId,
          paymentStatus: 'CONFIRMED',
          status:        'DELIVERED',
        },
      },
    }),
    prisma.productRating.findUnique({
      where: { productId_phone: { productId: Number(productId), phone: normalizedPhone } },
    }),
  ]);

  return res.json({
    success:  true,
    canRate:  !!hasOrdered,
    hasRated: !!existingRating,
    rating:   existingRating || null,
  });
}

// ============================================================================
// GET ALL RATINGS FOR BUSINESS (authenticated dashboard)
// GET /api/ratings  — requires authMiddleware + businessId on req
// ============================================================================
async function getBusinessRatings(req, res) {
  if (!req.businessId) {
    return res.status(401).json({ success: false, error: 'Business context required' });
  }

  const ratings = await prisma.productRating.findMany({
    where:   { product: { businessId: req.businessId } },
    orderBy: { createdAt: 'desc' },
    include: { product: { select: { id: true, name: true } } },
    take:    200,
  });

  const shaped = ratings.map(r => ({
    id:          r.id,
    productId:   r.productId,
    productName: r.product?.name,
    phoneNumber: r.phone.slice(-4).padStart(r.phone.length, '*'),
    rating:      r.rating,
    review:      r.comment,
    createdAt:   r.createdAt,
  }));

  return res.json({ success: true, ratings: shaped });
}

module.exports = { submitRating, getProductRatings, canRate, getBusinessRatings };