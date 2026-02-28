// backend/src/controllers/businessController.js
const prisma = require('../lib/prisma');
const bcrypt = require('bcrypt');
const notify = require('../lib/notify');

// ============================================================================
// HELPERS
// ============================================================================
function generatePassword(length = 12) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

function calculateExpiryDate(startDate, plan) {
  const date = new Date(startDate);
  switch (plan) {
    case 'monthly':    date.setDate(date.getDate() + 30);  break;
    case 'annual':     date.setDate(date.getDate() + 365); break;
    case 'free_trial': date.setDate(date.getDate() + 14);  break;
    default: return null;
  }
  return date;
}

// ============================================================================
// PUBLIC: GET BUSINESS BY SLUG
// ============================================================================
async function getPublicBusiness(req, res) {
  const { slug } = req.params;

  const business = await prisma.business.findUnique({
    where: { slug },
    select: {
      id: true, slug: true, businessName: true, description: true,
      phone: true, whatsappNumber: true, email: true, address: true,
      logo: true, primaryColor: true, secondaryColor: true, currency: true,
      businessType: true, isActive: true, facebookUrl: true, instagramUrl: true,
      twitterUrl: true, youtubeUrl: true, footerText: true, footerCopyright: true,
      taxRate: true, deliveryFee: true, businessHours: true,
    },
  });

  if (!business) return res.status(404).json({ error: 'Business not found' });

  if (!business.isActive) {
    return res.status(503).json({ error: 'Business is currently unavailable', maintenanceMode: true });
  }

  const { businessName, ...rest } = business;
  return res.json({
    business: {
      ...rest,
      name: businessName,
      businessName,
      taxRate:       rest.taxRate       ?? 0,
      deliveryFee:   rest.deliveryFee   ?? 0,
      businessHours: rest.businessHours ?? null,
    },
  });
}

// ============================================================================
// PUBLIC: GET RATINGS SUMMARY FOR BUSINESS (used by landing page cards)
// GET /api/business/public/:slug/ratings
// ============================================================================
async function getBusinessPublicRatings(req, res) {
  const { slug } = req.params;

  const business = await prisma.business.findUnique({
    where:  { slug },
    select: { id: true, isActive: true },
  });

  if (!business || !business.isActive) {
    return res.status(404).json({ success: false, error: 'Business not found' });
  }

  const [stats, recentRatings] = await Promise.all([
    prisma.productRating.aggregate({
      where:  { product: { businessId: business.id } },
      _avg:   { rating: true },
      _count: true,
    }),
    prisma.productRating.findMany({
      where:   { product: { businessId: business.id }, comment: { not: null } },
      orderBy: { createdAt: 'desc' },
      take:    3,
      select:  { rating: true, comment: true, createdAt: true },
    }),
  ]);

  return res.json({
    success:       true,
    averageRating: stats._avg.rating ? parseFloat(stats._avg.rating.toFixed(1)) : 0,
    totalRatings:  stats._count || 0,
    recentReviews: recentRatings,
  });
}

// ============================================================================
// PUBLIC: GET PRODUCTS FOR STOREFRONT
// ============================================================================
async function getPublicProducts(req, res) {
  const { slug } = req.params;
  const { category, search } = req.query;

  const business = await prisma.business.findUnique({
    where: { slug },
    select: { id: true, isActive: true },
  });

  if (!business || !business.isActive) {
    return res.status(404).json({ error: 'Business not found' });
  }

  const where = {
    businessId:  business.id,
    isAvailable: true,
    stock:       { gt: 0 },
  };

  if (category && category !== 'all') where.category = category;

  if (search) {
    where.OR = [
      { name:        { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const products = await prisma.product.findMany({
    where,
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    include: {
      images:  { orderBy: { order: 'asc' } },
      ratings: { select: { rating: true } },
    },
  });

  const productsWithRatings = products.map(product => {
    const ratings       = product.ratings || [];
    const totalRatings  = ratings.length;
    const averageRating = totalRatings > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
      : 0;
    const { ratings: _, ...productData } = product;
    return { ...productData, averageRating: Math.round(averageRating * 10) / 10, totalRatings };
  });

  console.log(`🛍️ Public products for ${slug}: ${productsWithRatings.length} items`);
  res.json({ products: productsWithRatings });
}

// ============================================================================
// PUBLIC: GET ALL BUSINESSES (landing page directory)
// ============================================================================
async function getAllPublicBusinesses(req, res) {
  const businesses = await prisma.business.findMany({
    where:   { isActive: true },
    select: {
      id: true, slug: true, businessName: true, businessType: true,
      description: true, logo: true, primaryColor: true, secondaryColor: true,
      createdAt: true,
      _count: { select: { products: true, orders: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const formatted = businesses.map(({ businessName, ...rest }) => ({
    ...rest,
    name: businessName,
    businessName,
  }));

  res.json({ businesses: formatted });
}

// ============================================================================
// PUBLIC: GET BUSINESS BY SLUG (internal / legacy)
// ============================================================================
async function getBusinessBySlug(req, res) {
  const { slug } = req.params;
  const business = await prisma.business.findUnique({ where: { slug } });
  if (!business) return res.status(404).json({ error: 'Business not found' });
  res.json(business);
}

// ============================================================================
// INTERNAL: GET BUSINESS PRODUCTS (legacy alias)
// ============================================================================
async function getPublicBusinessProducts(req, res) {
  const { slug } = req.params;

  const business = await prisma.business.findUnique({
    where: { slug },
    select: { id: true, isActive: true },
  });

  if (!business) return res.status(404).json({ error: 'Business not found' });
  if (!business.isActive) return res.status(503).json({ error: 'Business is currently unavailable' });

  const rawProducts = await prisma.product.findMany({
    where:   { businessId: business.id, isAvailable: true },
    include: { ratings: { select: { rating: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const products = rawProducts.map(({ ratings, ...product }) => ({
    ...product,
    averageRating: ratings.length > 0
      ? Math.round((ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length) * 10) / 10
      : 0,
    isAvailable: product.isAvailable ?? true,
    category:    product.category    ?? null,
  }));

  return res.json({ products });
}

// ============================================================================
// ADMIN: GET ALL BUSINESSES (super-admin only)
// ============================================================================
async function getAllBusinesses(req, res) {
  if (req.user.role !== 'super-admin') {
    return res.status(403).json({ error: 'Forbidden: Super-admin access required' });
  }

  const businesses = await prisma.business.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { users: true, products: true, orders: true } } },
  });

  res.json({ businesses });
}

// ============================================================================
// ADMIN: GET SINGLE BUSINESS
// ============================================================================
async function getBusiness(req, res) {
  const businessId = Number(req.params.id);

  if (req.user.role !== 'super-admin' && req.user.businessId !== businessId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const business = await prisma.business.findUnique({
    where:   { id: businessId },
    include: { _count: { select: { users: true, products: true, orders: true } } },
  });

  if (!business) return res.status(404).json({ error: 'Business not found' });
  res.json(business);
}

// ============================================================================
// ADMIN: CREATE BUSINESS (super-admin only)
// ============================================================================
async function createBusiness(req, res) {
  if (req.user.role !== 'super-admin') {
    return res.status(403).json({ error: 'Forbidden: Super-admin access required' });
  }

  const {
    slug, businessName, phone, whatsappNumber,
    adminEmail, adminFirstName, adminLastName, adminPhone,
    businessType, businessMotto, email, address, description,
    logo, primaryColor, secondaryColor, currency, language,
    supportedLanguages, autoDetectLanguage, defaultLanguage,
    facebookUrl, twitterUrl, instagramUrl, youtubeUrl, linkedinUrl,
    tiktokUrl, footerText, footerCopyright, footerAddress, footerEmail, footerPhone,
    startWithTrial = true, subscriptionPlan, subscriptionExpiry,
  } = req.body;

  if (!slug || !businessName || !phone || !whatsappNumber)
    return res.status(400).json({ error: 'slug, businessName, phone, and whatsappNumber are required' });
  if (!adminEmail)     return res.status(400).json({ error: 'adminEmail is required' });
  if (!adminFirstName) return res.status(400).json({ error: 'adminFirstName is required' });

  const [existingBusiness, existingUser] = await Promise.all([
    prisma.business.findUnique({ where: { slug } }),
    prisma.user.findUnique({ where: { email: adminEmail } }),
  ]);

  if (existingBusiness) return res.status(400).json({ error: 'A business with this slug already exists' });
  if (existingUser)     return res.status(400).json({ error: 'A user with this email already exists' });

  const generatedPassword = generatePassword(12);
  const passwordHash      = await bcrypt.hash(generatedPassword, 12);

  const now = new Date();
  let subscriptionData = { isActive: true };

  if (subscriptionPlan && ['monthly', 'annual'].includes(subscriptionPlan)) {
    const expiryDate = subscriptionExpiry
      ? new Date(subscriptionExpiry)
      : calculateExpiryDate(now, subscriptionPlan);
    subscriptionData = {
      ...subscriptionData,
      subscriptionPlan,
      subscriptionStartDate: now,
      subscriptionExpiry:    expiryDate,
      lastPaymentDate:       now,
    };
  } else if (startWithTrial) {
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 14);
    subscriptionData = {
      ...subscriptionData,
      subscriptionPlan: 'free_trial',
      trialStartDate:   now,
      trialEndsAt:      trialEnd,
    };
  } else {
    subscriptionData.subscriptionPlan = 'none';
  }

  const businessData = {
    slug, businessName, phone, whatsappNumber, ...subscriptionData,
    ...(businessType    && { businessType }),
    ...(businessMotto   && { businessMotto }),
    ...(email           && { email }),
    ...(address         && { address }),
    ...(description     && { description }),
    ...(logo            && { logo }),
    ...(primaryColor    && { primaryColor }),
    ...(secondaryColor  && { secondaryColor }),
    ...(currency        && { currency }),
    ...(language        && { language }),
    ...(supportedLanguages !== undefined && { supportedLanguages }),
    ...(autoDetectLanguage !== undefined && { autoDetectLanguage }),
    ...(defaultLanguage && { defaultLanguage }),
    ...(facebookUrl     && { facebookUrl }),
    ...(twitterUrl      && { twitterUrl }),
    ...(instagramUrl    && { instagramUrl }),
    ...(youtubeUrl      && { youtubeUrl }),
    ...(linkedinUrl     && { linkedinUrl }),
    ...(tiktokUrl       && { tiktokUrl }),
    ...(footerText      && { footerText }),
    ...(footerCopyright && { footerCopyright }),
    ...(footerAddress   && { footerAddress }),
    ...(footerEmail     && { footerEmail }),
    ...(footerPhone     && { footerPhone }),
  };

  let business, admin;

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const newBusiness = await tx.business.create({ data: businessData });
        const newAdmin    = await tx.user.create({
          data: {
            email:      adminEmail,
            passwordHash,
            role:       'admin',
            firstName:  adminFirstName || 'Admin',
            lastName:   adminLastName  || '',
            phone:      adminPhone     || phone,
            active:     true,
            businessId: newBusiness.id,
          },
        });
        return { business: newBusiness, admin: newAdmin };
      },
      { timeout: 15000, maxWait: 10000 }
    );

    business = result.business;
    admin    = result.admin;
  } catch (error) {
    console.error('❌ Transaction failed:', error);
    return res.status(500).json({ error: 'Failed to create business', details: error.message });
  }

  try {
    await notify.system(
      business.id,
      '🎉 Welcome to the Platform!',
      subscriptionData.subscriptionPlan === 'free_trial'
        ? 'Your 14-day free trial has started. Enjoy exploring all features!'
        : 'Your business account has been created successfully.'
    );
    if (subscriptionData.subscriptionPlan === 'free_trial') {
      await notify.trialStarted(business.id, subscriptionData.trialEndsAt);
    }
  } catch (notifError) {
    console.warn('⚠️  Could not create welcome notification:', notifError.message);
  }

  return res.status(201).json({
    ok:       true,
    business,
    admin: {
      id:                admin.id,
      email:             admin.email,
      firstName:         admin.firstName,
      lastName:          admin.lastName,
      temporaryPassword: generatedPassword,
    },
    subscription: {
      plan:      business.subscriptionPlan,
      expiresAt: business.subscriptionExpiry || business.trialEndsAt,
      isTrial:   business.subscriptionPlan === 'free_trial',
    },
    message: 'Business and admin account created successfully',
  });
}

// ============================================================================
// ADMIN: UPDATE BUSINESS
// ============================================================================
async function updateBusiness(req, res) {
  const businessId = Number(req.params.id);

  if (req.user.role !== 'super-admin' && req.user.businessId !== businessId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { slug, ...updateData } = req.body;

  if (slug) {
    const current = await prisma.business.findUnique({ where: { id: businessId } });
    if (slug !== current?.slug && req.user.role !== 'super-admin') {
      return res.status(403).json({ error: 'Only super-admin can change the business slug' });
    }
  }

  const business = await prisma.business.update({
    where: { id: businessId },
    data:  slug ? { slug, ...updateData } : updateData,
  });

  res.json(business);
}

// ============================================================================
// ADMIN: DELETE BUSINESS (super-admin only)
// ============================================================================
async function deleteBusiness(req, res) {
  if (req.user.role !== 'super-admin') {
    return res.status(403).json({ error: 'Forbidden: Super-admin access required' });
  }

  const businessId = Number(req.params.id);
  const business   = await prisma.business.findUnique({
    where:   { id: businessId },
    include: { _count: { select: { users: true, products: true, orders: true } } },
  });

  if (!business) return res.status(404).json({ error: 'Business not found' });

  await prisma.business.delete({ where: { id: businessId } });
  console.log(`🗑️  Deleted: ${business.businessName}`);
  res.json({ ok: true, message: 'Business deleted' });
}

// ============================================================================
// ADMIN: GET CURRENT USER'S BUSINESS
// ============================================================================
async function getCurrentBusiness(req, res) {
  if (!req.user.businessId) {
    return res.status(404).json({ error: 'User has no associated business' });
  }

  const business = await prisma.business.findUnique({
    where: { id: req.user.businessId },
  });

  if (!business) return res.status(404).json({ error: 'Business not found' });
  res.json(business);
}

// ============================================================================
// ADMIN: TOGGLE BUSINESS STATUS (super-admin only)
// ============================================================================
async function toggleBusinessStatus(req, res) {
  if (req.user.role !== 'super-admin') {
    return res.status(403).json({ error: 'Forbidden: Super-admin access required' });
  }

  const businessId = Number(req.params.id);
  const business   = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) return res.status(404).json({ error: 'Business not found' });

  const newActive = req.body.isActive !== undefined
    ? Boolean(req.body.isActive)
    : !business.isActive;

  const suspensionReason = req.body.suspensionReason || 'Suspended by admin';

  const updated = await prisma.business.update({
    where: { id: businessId },
    data: {
      isActive:         newActive,
      suspendedAt:      newActive ? null : new Date(),
      suspensionReason: newActive ? null : suspensionReason,
    },
  });

  if (!newActive) {
    await notify.businessSuspended(businessId, suspensionReason);
  } else {
    await notify.system(
      businessId,
      '✅ Business Reactivated',
      'Your business account has been reactivated. You can now accept orders again.'
    );
  }

  const action = newActive ? 'reactivated' : 'suspended';
  console.log(`${newActive ? '✅' : '⏸️'} Business ${action}: ${business.businessName}`);
  res.json({ ok: true, message: `Business ${action} successfully`, business: updated });
}

module.exports = {
  getPublicBusiness,
  getBusinessPublicRatings,
  getPublicProducts,
  getPublicBusinessProducts,
  getAllPublicBusinesses,
  getBusinessBySlug,
  getAllBusinesses,
  getBusiness,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  getCurrentBusiness,
  toggleBusinessStatus,
};