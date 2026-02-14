// backend/src/controllers/businessController.js
// ✅ FIXED: P2028 transaction timeout, removed ...otherData spread, moved notification outside tx
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
    case 'monthly':   date.setDate(date.getDate() + 30);  break;
    case 'annual':    date.setDate(date.getDate() + 365); break;
    case 'free_trial':date.setDate(date.getDate() + 14);  break;
    default: return null;
  }
  return date;
}

// ============================================================================
// GET BUSINESS BY SLUG  (Public)
// ============================================================================
async function getBusinessBySlug(req, res) {
  const { slug } = req.params;

  const business = await prisma.business.findUnique({ where: { slug } });

  if (!business) {
    return res.status(404).json({ error: 'Business not found' });
  }

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
      _count: { select: { users: true, products: true, orders: true } }
    }
  });

  res.json(businesses);
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
    include: { _count: { select: { users: true, products: true, orders: true } } }
  });

  if (!business) {
    return res.status(404).json({ error: 'Business not found' });
  }

  res.json(business);
}

// ============================================================================
// CREATE BUSINESS  (Super-admin only)
// ✅ FIX 1: Removed dangerous ...otherData spread → only whitelisted fields go to Prisma
// ✅ FIX 2: ALL async work (bcrypt) done BEFORE the transaction opens
// ✅ FIX 3: Transaction timeout raised to 15 000 ms
// ✅ FIX 4: Notification created AFTER transaction commits (no extra tx round-trip)
// ============================================================================
async function createBusiness(req, res) {
  if (req.user.role !== 'super-admin') {
    return res.status(403).json({ error: 'Forbidden: Super-admin access required' });
  }

  // ── Destructure ONLY the fields we actually use ──────────────────────────
  const {
    // Required
    slug,
    businessName,
    phone,
    whatsappNumber,
    // Owner / admin account
    adminEmail,
    adminFirstName,
    adminLastName,
    adminPhone,
    // Optional business info
    businessType,
    businessMotto,
    email,
    address,
    description,
    logo,
    primaryColor,
    secondaryColor,
    currency,
    language,
    supportedLanguages,
    autoDetectLanguage,
    defaultLanguage,
    facebookUrl,
    twitterUrl,
    instagramUrl,
    youtubeUrl,
    linkedinUrl,
    tiktokUrl,
    footerText,
    footerCopyright,
    footerAddress,
    footerEmail,
    footerPhone,
    // Subscription
    startWithTrial = true,
    subscriptionPlan,
    subscriptionExpiry,
  } = req.body;

  // ── Validate required fields ──────────────────────────────────────────────
  if (!slug || !businessName || !phone || !whatsappNumber) {
    return res.status(400).json({
      error: 'slug, businessName, phone, and whatsappNumber are required'
    });
  }
  if (!adminEmail) {
    return res.status(400).json({
      error: 'Admin email (adminEmail) is required to create the owner account'
    });
  }
  if (!adminFirstName) {
    return res.status(400).json({
      error: 'Admin first name (adminFirstName) is required'
    });
  }

  // ── Check for duplicates ──────────────────────────────────────────────────
  const [existingBusiness, existingUser] = await Promise.all([
    prisma.business.findUnique({ where: { slug } }),
    prisma.user.findUnique({ where: { email: adminEmail } }),
  ]);

  if (existingBusiness) {
    return res.status(400).json({ error: 'A business with this slug already exists' });
  }
  if (existingUser) {
    return res.status(400).json({ error: 'A user with this email already exists' });
  }

  // ── ✅ FIX 2: Do ALL slow/async work BEFORE opening the transaction ────────
  const generatedPassword = generatePassword(12);
  const passwordHash      = await bcrypt.hash(generatedPassword, 12); // ~300 ms — done here, NOT inside tx

  // ── Subscription data ─────────────────────────────────────────────────────
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

  // ── ✅ FIX 1: Build ONLY whitelisted Business fields (no ...otherData) ─────
  // Every key here maps to a real column in the Business model.
  const businessData = {
    // Required
    slug,
    businessName,
    phone,
    whatsappNumber,
    // Subscription
    ...subscriptionData,
    // Optional — only include if the caller provided a value
    ...(businessType   && { businessType }),
    ...(businessMotto  && { businessMotto }),
    ...(email          && { email }),
    ...(address        && { address }),
    ...(description    && { description }),
    ...(logo           && { logo }),
    ...(primaryColor   && { primaryColor }),
    ...(secondaryColor && { secondaryColor }),
    ...(currency       && { currency }),
    ...(language       && { language }),
    ...(supportedLanguages !== undefined && { supportedLanguages }),
    ...(autoDetectLanguage !== undefined && { autoDetectLanguage }),
    ...(defaultLanguage    && { defaultLanguage }),
    ...(facebookUrl   && { facebookUrl }),
    ...(twitterUrl    && { twitterUrl }),
    ...(instagramUrl  && { instagramUrl }),
    ...(youtubeUrl    && { youtubeUrl }),
    ...(linkedinUrl   && { linkedinUrl }),
    ...(tiktokUrl     && { tiktokUrl }),
    ...(footerText    && { footerText }),
    ...(footerCopyright && { footerCopyright }),
    ...(footerAddress && { footerAddress }),
    ...(footerEmail   && { footerEmail }),
    ...(footerPhone   && { footerPhone }),
  };

  // ── ✅ FIX 3: Transaction with raised timeout ─────────────────────────────
  // Default Prisma interactive-tx timeout = 5 000 ms → easily exceeded.
  // We raise it to 15 000 ms.  All slow work is already done above.
  let business, admin;

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        // 1. Create business
        const newBusiness = await tx.business.create({ data: businessData });

        // 2. Create admin user — only uses the User schema fields
        const newAdmin = await tx.user.create({
          data: {
            email:        adminEmail,
            passwordHash,
            role:         'admin',
            firstName:    adminFirstName || 'Admin',
            lastName:     adminLastName  || '',
            phone:        adminPhone     || phone,
            active:       true,
            businessId:   newBusiness.id,
          },
        });

        return { business: newBusiness, admin: newAdmin };
      },
      {
        timeout:  15000, // ✅ 15 s — plenty of headroom
        maxWait:  10000, // wait up to 10 s to acquire a connection
      }
    );

    business = result.business;
    admin    = result.admin;
  } catch (error) {
    console.error('❌ Transaction failed when creating business:', error);
    return res.status(500).json({
      error:   'Failed to create business',
      details: error.message,
    });
  }

  // ── ✅ FIX 4: Notification created AFTER transaction commits ───────────────
  // This avoids adding another DB round-trip inside the tx (which was pushing
  // the total over the timeout on slower connections).
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
    // Non-critical — log but don't fail the request
    console.warn('⚠️  Could not create welcome notification:', notifError.message);
  }

  console.log(`✅ Business created: ${business.businessName} (${business.slug})`);
  console.log(`   Subscription: ${business.subscriptionPlan}`);
  if (business.trialEndsAt)         console.log(`   Trial ends:   ${business.trialEndsAt.toDateString()}`);
  if (business.subscriptionExpiry)  console.log(`   Expires:      ${business.subscriptionExpiry.toDateString()}`);
  console.log(`✅ Admin created:   ${admin.email} → businessId ${business.id}`);

  return res.status(201).json({
    ok: true,
    business,
    admin: {
      id:                admin.id,
      email:             admin.email,
      firstName:         admin.firstName,
      lastName:          admin.lastName,
      temporaryPassword: generatedPassword, // ← shown once; store securely
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

  console.log(`✅ Updated business: ${business.businessName}`);
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

  if (!business) {
    return res.status(404).json({ error: 'Business not found' });
  }

  if (business._count.users > 0 || business._count.products > 0 || business._count.orders > 0) {
    console.warn(
      `⚠️  Deleting "${business.businessName}" — ` +
      `users: ${business._count.users}, products: ${business._count.products}, orders: ${business._count.orders}`
    );
  }

  await prisma.business.delete({ where: { id: businessId } });
  console.log(`🗑️  Deleted business: ${business.businessName}`);
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

  if (!business) {
    return res.status(404).json({ error: 'Business not found' });
  }

  res.json(business);
}

// ============================================================================
// TOGGLE BUSINESS STATUS  (Suspend / Reactivate)
// ============================================================================
async function toggleBusinessStatus(req, res) {
  if (req.user.role !== 'super-admin') {
    return res.status(403).json({ error: 'Forbidden: Super-admin access required' });
  }

  const businessId = Number(req.params.id);

  // ✅ Read isActive from body; if not provided, toggle the current value
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) {
    return res.status(404).json({ error: 'Business not found' });
  }

  const newActive = req.body.isActive !== undefined
    ? Boolean(req.body.isActive)
    : !business.isActive;

  const { suspensionReason } = req.body;

  const updated = await prisma.business.update({
    where: { id: businessId },
    data: {
      isActive:          newActive,
      suspendedAt:       newActive ? null : new Date(),
      suspensionReason:  newActive ? null : (suspensionReason || 'Suspended by admin'),
    },
  });

  const action = newActive ? 'Reactivated' : 'Suspended';
  console.log(`${newActive ? '✅' : '⚠️ '} ${action} business: ${business.businessName}`);

  res.json({
    ok:       true,
    message:  `Business ${action.toLowerCase()} successfully`,
    business: updated,
  });
}

module.exports = {
  getBusinessBySlug,
  getAllBusinesses,
  getBusiness,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  getCurrentBusiness,
  toggleBusinessStatus,
};