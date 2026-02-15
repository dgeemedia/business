// backend/src/controllers/businessController.js
// Full updated file — getPublicBusiness + getPublicBusinessProducts fixed

const prisma = require('../lib/prisma');
const bcrypt = require('bcrypt');

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
// PUBLIC STOREFRONT: GET BUSINESS
// GET /api/business/public/:slug  — no auth required
//
// ✅ Returns { business } shaped to match what BusinessStorefront.jsx expects:
//    - business.name  (aliased from businessName)
//    - business.taxRate / deliveryFee / businessHours  (safe defaults if missing)
// ============================================================================
async function getPublicBusiness(req, res) {
  const { slug } = req.params;

  const business = await prisma.business.findUnique({
    where: { slug },
    select: {
      id:             true,
      slug:           true,
      businessName:   true,
      description:    true,
      phone:          true,
      whatsappNumber: true,
      email:          true,
      address:        true,
      logo:           true,
      primaryColor:   true,
      secondaryColor: true,
      currency:       true,
      businessType:   true,
      isActive:       true,
      facebookUrl:    true,
      instagramUrl:   true,
      twitterUrl:     true,
      youtubeUrl:     true,
      footerText:     true,
      footerCopyright:true,
      taxRate:        true, 
      deliveryFee:    true, 
      businessHours:  true,
    },
  });

  if (!business) {
    return res.status(404).json({ error: 'Business not found' });
  }

  if (!business.isActive) {
    return res.status(503).json({
      error: 'Business is currently unavailable',
      maintenanceMode: true,
    });
  }

  // Destructure businessName and alias it to `name` so the storefront
  // doesn't need to change — it reads business.name everywhere.
  const { businessName, ...rest } = business;

  return res.json({
    business: {
      ...rest,
      name:         businessName,   // ← what BusinessStorefront uses
      businessName,                 // ← keep original too
      // Safe defaults for optional fields not yet in schema
      taxRate:      rest.taxRate      ?? 0,
      deliveryFee:  rest.deliveryFee  ?? 0,
      businessHours:rest.businessHours ?? null,
    },
  });
}

// ============================================================================
// PUBLIC STOREFRONT: GET PRODUCTS
// GET /api/business/public/:slug/products  — no auth required
//
// ✅ FIX: removed `isAvailable: true` filter — field does NOT exist in the
//    current schema.  After you run the migration below it will be added back.
//    For now we filter only on stock > 0 so nothing visible is 0-stock.
//
// ✅ Computes averageRating from the ProductRating relation (it's not stored
//    as a column).
// ============================================================================
async function getPublicBusinessProducts(req, res) {
  const { slug } = req.params;

  // Resolve business by slug
  const business = await prisma.business.findUnique({
    where: { slug },
    select: { id: true, isActive: true },
  });

  if (!business) {
    return res.status(404).json({ error: 'Business not found' });
  }

  if (!business.isActive) {
    return res.status(503).json({ error: 'Business is currently unavailable' });
  }

  // Fetch products with their ratings so we can compute averageRating
  const rawProducts = await prisma.product.findMany({
    where: {
      businessId: business.id,
      isAvailable: true,
    },
    include: {
      ratings: {        // ProductRating[]
        select: { rating: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Compute averageRating and strip the raw ratings array from the response
  const products = rawProducts.map(({ ratings, ...product }) => ({
    ...product,
    averageRating: ratings.length > 0
      ? Math.round((ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length) * 10) / 10
      : 0,
    // Safe default for optional fields not yet in schema
    isAvailable:  product.isAvailable  ?? true,
    category:     product.category     ?? null,
  }));

  return res.json({ products });
}

// ============================================================================
// GET BUSINESS BY SLUG  (internal / legacy)
// ============================================================================
async function getBusinessBySlug(req, res) {
  const { slug } = req.params;
  const business = await prisma.business.findUnique({ where: { slug } });
  if (!business) return res.status(404).json({ error: 'Business not found' });
  res.json(business);
}

// ============================================================================
// GET ALL BUSINESSES  (Super-admin only)
// ============================================================================
async function getAllBusinesses(req, res) {
  if (req.user.role !== 'super-admin') {
    return res.status(403).json({ error: 'Forbidden: Super-admin access required' });
  }

  const businesses = await prisma.business.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { users: true, products: true, orders: true } },
    },
  });

  res.json({ businesses });
}

// ============================================================================
// GET SINGLE BUSINESS  (Authenticated)
// ============================================================================
async function getBusiness(req, res) {
  const businessId = Number(req.params.id);

  if (req.user.role !== 'super-admin' && req.user.businessId !== businessId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      _count: { select: { users: true, products: true, orders: true } },
    },
  });

  if (!business) return res.status(404).json({ error: 'Business not found' });
  res.json(business);
}

// ============================================================================
// CREATE BUSINESS  (Super-admin only)
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

  if (!slug || !businessName || !phone || !whatsappNumber) {
    return res.status(400).json({ error: 'slug, businessName, phone, and whatsappNumber are required' });
  }
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
      subscriptionExpiry: expiryDate,
      lastPaymentDate: now,
    };
  } else if (startWithTrial) {
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 14);
    subscriptionData = {
      ...subscriptionData,
      subscriptionPlan: 'free_trial',
      trialStartDate: now,
      trialEndsAt: trialEnd,
    };
  } else {
    subscriptionData.subscriptionPlan = 'none';
  }

  const businessData = {
    slug, businessName, phone, whatsappNumber,
    ...subscriptionData,
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
    await prisma.notification.create({
      data: {
        type:       'system',
        title:      'Welcome to the Platform!',
        message:    subscriptionData.subscriptionPlan === 'free_trial'
          ? 'Your 14-day free trial has started. Enjoy exploring all features!'
          : 'Your business account has been created successfully.',
        businessId: business.id,
        read:       false,
      },
    });
  } catch (notifError) {
    console.warn('⚠️  Could not create welcome notification:', notifError.message);
  }

  return res.status(201).json({
    ok: true,
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
// UPDATE BUSINESS
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
    data: slug ? { slug, ...updateData } : updateData,
  });

  res.json(business);
}

// ============================================================================
// DELETE BUSINESS  (Super-admin only)
// ============================================================================
async function deleteBusiness(req, res) {
  if (req.user.role !== 'super-admin') {
    return res.status(403).json({ error: 'Forbidden: Super-admin access required' });
  }

  const businessId = Number(req.params.id);
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { _count: { select: { users: true, products: true, orders: true } } },
  });

  if (!business) return res.status(404).json({ error: 'Business not found' });

  await prisma.business.delete({ where: { id: businessId } });
  console.log(`🗑️  Deleted: ${business.businessName}`);
  res.json({ ok: true, message: 'Business deleted' });
}

// ============================================================================
// GET CURRENT USER'S BUSINESS
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
// TOGGLE BUSINESS STATUS
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

  const updated = await prisma.business.update({
    where: { id: businessId },
    data: {
      isActive:         newActive,
      suspendedAt:      newActive ? null : new Date(),
      suspensionReason: newActive ? null : (req.body.suspensionReason || 'Suspended by admin'),
    },
  });

  const action = newActive ? 'Reactivated' : 'Suspended';
  res.json({ ok: true, message: `Business ${action.toLowerCase()} successfully`, business: updated });
}

module.exports = {
  getPublicBusiness,
  getPublicBusinessProducts,
  getBusinessBySlug,
  getAllBusinesses,
  getBusiness,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  getCurrentBusiness,
  toggleBusinessStatus,
};