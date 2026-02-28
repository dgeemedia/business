// backend/src/controllers/ratingController.js
const prisma = require('../lib/prisma');
const notify = require('../lib/notify');

function normalizePhone(phone) {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

// ── Shared eligibility check ──────────────────────────────────────────────────
// A customer can rate if they have an order for that product with:
//   status = 'DELIVERED'  (always required — they must have received it)
//   paymentStatus is NOT checked additionally — delivery implies the order
//   was fulfilled. This avoids the case where an admin marks delivered
//   without explicitly hitting "confirm payment" first.
async function findEligibleOrder(productId, normalizedPhone, businessId) {
  return prisma.orderItem.findFirst({
    where: {
      productId: Number(productId),
      order: {
        phone:      normalizedPhone,
        businessId,
        status:     'DELIVERED',   // ✅ only DELIVERED required
      },
    },
    include: {
      order: { select: { status: true, paymentStatus: true } },
    },
  });
}

// ── Diagnostics: any order at all for this phone + product ───────────────────
async function findAnyOrder(productId, normalizedPhone, businessId) {
  return prisma.orderItem.findFirst({
    where: {
      productId: Number(productId),
      order: { phone: normalizedPhone, businessId },
    },
    include: {
      order: { select: { status: true, paymentStatus: true } },
    },
  });
}

// ============================================================================
// SUBMIT OR UPDATE RATING
// POST /api/products/:productId/ratings  (public)
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

  // Tenant isolation (when req.businessId is set via subdomain middleware)
  if (req.businessId && product.businessId !== req.businessId) {
    return res.status(403).json({ success: false, error: 'Product not available in this business' });
  }

  const eligibleOrder = await findEligibleOrder(productId, normalizedPhone, product.businessId);

  if (!eligibleOrder) {
    const anyOrder = await findAnyOrder(productId, normalizedPhone, product.businessId);

    let errorMessage = 'You can only rate products you have received. Place an order first.';
    if (anyOrder) {
      const { status } = anyOrder.order;
      if (status === 'CANCELLED') {
        errorMessage = 'Your order was cancelled. Only completed and delivered orders can be rated.';
      } else if (status !== 'DELIVERED') {
        errorMessage = `Your order must be delivered before you can rate (current status: ${status}). Please wait until your order arrives.`;
      }
    }

    return res.status(403).json({ success: false, error: errorMessage });
  }

  const productRating = await prisma.productRating.upsert({
    where:  { productId_phone: { productId: Number(productId), phone: normalizedPhone } },
    update: { rating, comment: comment || null },
    create: { productId: Number(productId), phone: normalizedPhone, rating, comment: comment || null },
  });

  const stats = await prisma.productRating.aggregate({
    where:  { productId: Number(productId) },
    _avg:   { rating: true },
    _count: true,
  });

  // Non-blocking notification
  notify.review(product.businessId, product.name, rating).catch(() => {});

  return res.json({
    success:       true,
    rating:        productRating,
    averageRating: stats._avg.rating ? parseFloat(stats._avg.rating.toFixed(1)) : 0,
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
    phone: r.phone ? r.phone.slice(-4).padStart(r.phone.length, '*') : '****',
  }));

  return res.json({
    success:       true,
    ratings:       maskedRatings,
    averageRating: stats._avg.rating ? parseFloat(stats._avg.rating.toFixed(1)) : 0,
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

  const [eligibleOrder, existingRating, anyOrder] = await Promise.all([
    findEligibleOrder(productId, normalizedPhone, product.businessId),
    prisma.productRating.findUnique({
      where: { productId_phone: { productId: Number(productId), phone: normalizedPhone } },
    }),
    findAnyOrder(productId, normalizedPhone, product.businessId),
  ]);

  // Build a helpful message if not eligible
  let reason = null;
  if (!eligibleOrder) {
    if (!anyOrder) {
      reason = 'No order found for this phone number. You can only rate products you have purchased.';
    } else {
      const { status } = anyOrder.order;
      if (status === 'CANCELLED') {
        reason = 'Your order was cancelled and cannot be rated.';
      } else {
        reason = `Your order must be delivered before you can rate (current status: ${status}).`;
      }
    }
  }

  return res.json({
    success:  true,
    canRate:  !!eligibleOrder,
    hasRated: !!existingRating,
    rating:   existingRating || null,
    reason,
  });
}

// ============================================================================
// GET ALL RATINGS FOR BUSINESS DASHBOARD
// GET /api/ratings  (authenticated)
// ============================================================================
async function getBusinessRatings(req, res) {
  if (!req.businessId && !req.user?.businessId) {
    return res.status(401).json({ success: false, error: 'Business context required' });
  }

  const businessId = req.businessId || req.user.businessId;

  const ratings = await prisma.productRating.findMany({
    where:   { product: { businessId } },
    orderBy: { createdAt: 'desc' },
    include: { product: { select: { id: true, name: true } } },
    take:    200,
  });

  const shaped = ratings.map(r => ({
    id:          r.id,
    productId:   r.productId,
    productName: r.product?.name,
    phoneNumber: r.phone ? r.phone.slice(-4).padStart(r.phone.length, '*') : '****',
    rating:      r.rating,
    review:      r.comment,
    createdAt:   r.createdAt,
  }));

  return res.json({ success: true, ratings: shaped });
}

module.exports = { submitRating, getProductRatings, canRate, getBusinessRatings };