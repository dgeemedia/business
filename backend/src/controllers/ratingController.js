// backend/src/controllers/ratingController.js
const prisma = require('../lib/prisma');
const notify = require('../lib/notify');

function normalizePhone(phone) {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

// ============================================================================
// SUBMIT OR UPDATE RATING
// ============================================================================
async function submitRating(req, res) {
  const { productId } = req.params;
  const { phone, rating, comment } = req.body;

  if (!phone || !rating) throw new Error('Phone number and rating are required');
  if (rating < 1 || rating > 5) throw new Error('Rating must be between 1 and 5');

  const normalizedPhone = normalizePhone(phone);

  const product = await prisma.product.findUnique({
    where:   { id: Number(productId) },
    include: { business: { select: { id: true, slug: true, businessName: true } } },
  });

  if (!product) throw new Error('Product not found');

  if (req.businessId && product.businessId !== req.businessId) {
    return res.status(403).json({ success: false, error: 'Product not available in this business' });
  }

  const allOrders = await prisma.order.findMany({
    where: { phone: normalizedPhone, businessId: product.businessId },
    select: {
      id: true, phone: true, status: true, paymentStatus: true, createdAt: true,
      items: { select: { productId: true, product: { select: { id: true, name: true } } } },
    },
  });

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
    const hasAnyOrder = allOrders.some(o => o.items.some(i => i.productId === Number(productId)));
    let errorMessage  = 'You can only rate products you have purchased and received';

    if (hasAnyOrder) {
      const orderWithProduct = allOrders.find(o => o.items.some(i => i.productId === Number(productId)));
      if (orderWithProduct?.paymentStatus !== 'CONFIRMED') {
        errorMessage = 'Your order payment must be confirmed before you can rate';
      } else if (orderWithProduct?.status !== 'DELIVERED') {
        errorMessage = `Your order must be delivered before you can rate (Current: ${orderWithProduct.status})`;
      }
    }

    return res.status(403).json({ success: false, error: errorMessage });
  }

  const productRating = await prisma.productRating.upsert({
    where:  { productId_phone: { productId: Number(productId), phone: normalizedPhone } },
    update: { rating, comment: comment || null },
    create: { productId: Number(productId), phone: normalizedPhone, rating, comment: comment || null },
  });

  const ratings = await prisma.productRating.aggregate({
    where: { productId: Number(productId) },
    _avg:   { rating: true },
    _count: true,
  });

  // Notify the business of the new review
  await notify.review(product.businessId, product.name, rating);

  res.json({
    success:       true,
    rating:        productRating,
    averageRating: ratings._avg.rating || 0,
    totalRatings:  ratings._count || 0,
  });
}

// ============================================================================
// GET RATINGS FOR A PRODUCT
// ============================================================================
async function getProductRatings(req, res) {
  const { productId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (req.businessId) {
    const product = await prisma.product.findFirst({
      where: { id: Number(productId), businessId: req.businessId },
    });
    if (!product) return res.status(404).json({ success: false, error: 'Product not found in this business' });
  }

  const [ratings, total, stats] = await Promise.all([
    prisma.productRating.findMany({
      where:   { productId: Number(productId) },
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * limit,
      take:    Number(limit),
      select:  { rating: true, comment: true, createdAt: true, phone: true },
    }),
    prisma.productRating.count({ where: { productId: Number(productId) } }),
    prisma.productRating.aggregate({
      where:  { productId: Number(productId) },
      _avg:   { rating: true },
      _count: true,
    }),
  ]);

  const maskedRatings = ratings.map(r => ({
    ...r,
    phone: r.phone.slice(-4).padStart(r.phone.length, '*'),
  }));

  res.json({
    success:       true,
    ratings:       maskedRatings,
    averageRating: stats._avg.rating || 0,
    totalRatings:  stats._count || 0,
    pagination:    { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
  });
}

// ============================================================================
// CAN RATE CHECK
// ============================================================================
async function canRate(req, res) {
  const { productId } = req.params;
  const { phone }     = req.query;

  if (!phone) throw new Error('Phone number required');

  const normalizedPhone = normalizePhone(phone);

  const product = await prisma.product.findUnique({
    where:  { id: Number(productId) },
    select: { id: true, businessId: true, name: true },
  });

  if (!product) throw new Error('Product not found');

  if (req.businessId && product.businessId !== req.businessId) {
    return res.json({ success: true, canRate: false, hasRated: false, rating: null, reason: 'Product not available in this business' });
  }

  const [hasOrdered, existingRating] = await Promise.all([
    prisma.orderItem.findFirst({
      where: {
        productId: Number(productId),
        order: { phone: normalizedPhone, businessId: product.businessId, paymentStatus: 'CONFIRMED', status: 'DELIVERED' },
      },
    }),
    prisma.productRating.findUnique({
      where: { productId_phone: { productId: Number(productId), phone: normalizedPhone } },
    }),
  ]);

  res.json({
    success:   true,
    canRate:   !!hasOrdered,
    hasRated:  !!existingRating,
    rating:    existingRating || null,
  });
}

module.exports = { submitRating, getProductRatings, canRate };