// backend/src/controllers/businessController.js
const prisma = require('../lib/prisma');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// Generate random password
function generatePassword(length = 12) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

// Helper function for calculating expiry dates
function calculateExpiryDate(startDate, plan) {
  const date = new Date(startDate);
  
  switch (plan) {
    case 'monthly':
      date.setDate(date.getDate() + 30);
      break;
    case 'annual':
      date.setDate(date.getDate() + 365);
      break;
    case 'free_trial':
      date.setDate(date.getDate() + 14);
      break;
    default:
      return null;
  }
  
  return date;
}

// ============================================================================
// GET BUSINESS BY SLUG (Public - used by frontend subdomain routing)
// ============================================================================
async function getBusinessBySlug(req, res) {
  const { slug } = req.params;
  
  const business = await prisma.business.findUnique({
    where: { slug }
  });
  
  if (!business) {
    return res.status(404).json({ error: 'Business not found' });
  }
  
  res.json(business);
}

// ============================================================================
// GET ALL BUSINESSES (Super-admin only)
// ============================================================================
async function getAllBusinesses(req, res) {
  if (req.user.role !== 'super-admin') {
    return res.status(403).json({ error: 'Forbidden: Super-admin access required' });
  }
  
  const businesses = await prisma.business.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          users: true,
          products: true,
          orders: true
        }
      }
    }
  });
  
  res.json(businesses);
}

// ============================================================================
// GET SINGLE BUSINESS (Authenticated)
// ============================================================================
async function getBusiness(req, res) {
  const businessId = Number(req.params.id);
  
  // Super-admin can view any business, others only their own
  if (req.user.role !== 'super-admin' && req.user.businessId !== businessId) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      _count: {
        select: {
          users: true,
          products: true,
          orders: true
        }
      }
    }
  });
  
  if (!business) {
    return res.status(404).json({ error: 'Business not found' });
  }
  
  res.json(business);
}

// ============================================================================
// CREATE BUSINESS (Super-admin only) - ENHANCED WITH TRIAL SUPPORT
// ============================================================================
async function createBusiness(req, res) {
  if (req.user.role !== 'super-admin') {
    return res.status(403).json({ error: 'Forbidden: Super-admin access required' });
  }
  
  const {
    // ✅ REQUIRED FIELDS
    slug,
    businessName,
    businessType,
    phone,
    whatsappNumber,
    
    // ✅ ADMIN ACCOUNT DETAILS (Required)
    adminEmail,
    adminFirstName,
    adminLastName,
    adminPhone,
    
    // ✅ SUBSCRIPTION OPTIONS (Optional)
    startWithTrial = true,  // Default to starting with trial
    subscriptionPlan,       // 'monthly', 'annual', or undefined for trial
    subscriptionExpiry,     // Custom expiry date if provided
    
    // ✅ OPTIONAL BUSINESS DETAILS (otherData captures ALL of these)
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
    
    // ... ANY other fields not explicitly destructured above
    ...otherData  // This captures everything else not listed above
  } = req.body;
  
  // ============================================================================
  // WHAT IS ...otherData?
  // ============================================================================
  // It's a JavaScript "rest parameter" that captures ALL remaining properties 
  // from req.body that weren't explicitly destructured above.
  //
  // Example:
  // If req.body = {
  //   slug: 'mybiz',
  //   businessName: 'My Business',
  //   phone: '123',
  //   whatsappNumber: '456',
  //   adminEmail: 'admin@example.com',
  //   customField1: 'value1',  ← These go into otherData
  //   customField2: 'value2'   ← These go into otherData
  // }
  //
  // Then otherData = { customField1: 'value1', customField2: 'value2' }
  //
  // When we use ...otherData in the Prisma create:
  // It spreads these extra fields into the data object.
  //
  // This is useful for:
  // 1. Forward compatibility - if you add new Business fields later
  // 2. Flexibility - allows passing any valid Business model field
  // 3. Cleaner code - no need to list every single optional field
  // ============================================================================
  
  // Validate required fields
  if (!slug || !businessName || !phone || !whatsappNumber) {
    return res.status(400).json({ 
      error: 'slug, businessName, phone, and whatsappNumber are required' 
    });
  }

  // Validate admin email is provided
  if (!adminEmail) {
    return res.status(400).json({ 
      error: 'Admin email is required to create business owner account' 
    });
  }
  
  // Check if slug already exists
  const existing = await prisma.business.findUnique({
    where: { slug }
  });
  
  if (existing) {
    return res.status(400).json({ error: 'Business with this slug already exists' });
  }

  // Check if admin email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (existingUser) {
    return res.status(400).json({ error: 'A user with this email already exists' });
  }

  try {
    // Generate random password for admin
    const generatedPassword = generatePassword(12);
    const passwordHash = await bcrypt.hash(generatedPassword, 12);

    // ✅ Prepare subscription data
    const now = new Date();
    let subscriptionData = {
      isActive: true,
    };
    
    // If specific subscription plan provided, use it
    if (subscriptionPlan && ['monthly', 'annual'].includes(subscriptionPlan)) {
      const expiryDate = subscriptionExpiry 
        ? new Date(subscriptionExpiry)
        : calculateExpiryDate(now, subscriptionPlan);
      
      subscriptionData = {
        ...subscriptionData,
        subscriptionPlan,
        subscriptionStartDate: now,
        subscriptionExpiry: expiryDate,
        lastPaymentDate: now
      };
    }
    // Otherwise, start with 14-day trial if requested
    else if (startWithTrial) {
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + 14);
      
      subscriptionData = {
        ...subscriptionData,
        subscriptionPlan: 'free_trial',
        trialStartDate: now,
        trialEndsAt: trialEnd
      };
    }
    // No trial, no plan - business starts with 'none'
    else {
      subscriptionData.subscriptionPlan = 'none';
    }

    // ✅ Prepare optional business fields
    const optionalFields = {};
    
    // Add fields only if they're provided
    if (businessMotto) optionalFields.businessMotto = businessMotto;
    if (email) optionalFields.email = email;
    if (address) optionalFields.address = address;
    if (description) optionalFields.description = description;
    if (logo) optionalFields.logo = logo;
    if (primaryColor) optionalFields.primaryColor = primaryColor;
    if (secondaryColor) optionalFields.secondaryColor = secondaryColor;
    if (currency) optionalFields.currency = currency;
    if (language) optionalFields.language = language;
    if (supportedLanguages) optionalFields.supportedLanguages = supportedLanguages;
    if (autoDetectLanguage !== undefined) optionalFields.autoDetectLanguage = autoDetectLanguage;
    if (defaultLanguage) optionalFields.defaultLanguage = defaultLanguage;
    if (facebookUrl) optionalFields.facebookUrl = facebookUrl;
    if (twitterUrl) optionalFields.twitterUrl = twitterUrl;
    if (instagramUrl) optionalFields.instagramUrl = instagramUrl;
    if (youtubeUrl) optionalFields.youtubeUrl = youtubeUrl;
    if (linkedinUrl) optionalFields.linkedinUrl = linkedinUrl;
    if (tiktokUrl) optionalFields.tiktokUrl = tiktokUrl;
    if (footerText) optionalFields.footerText = footerText;
    if (footerCopyright) optionalFields.footerCopyright = footerCopyright;
    if (footerAddress) optionalFields.footerAddress = footerAddress;
    if (footerEmail) optionalFields.footerEmail = footerEmail;
    if (footerPhone) optionalFields.footerPhone = footerPhone;
    
    // Merge with otherData (in case there are any extra fields)
    const allOptionalFields = { ...optionalFields, ...otherData };

    // Create business and admin in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the business with all data
      const business = await tx.business.create({
        data: {
          // Required fields
          slug,
          businessName,
          businessType: businessType || 'food',
          phone,
          whatsappNumber,
          
          // Subscription data
          ...subscriptionData,
          
          // Optional fields
          ...allOptionalFields
        }
      });

      // 2. Create the admin user for this business
      const admin = await tx.user.create({
        data: {
          email: adminEmail,
          passwordHash,
          role: 'admin',
          firstName: adminFirstName || 'Admin',
          lastName: adminLastName || '',
          phone: adminPhone || phone,
          active: true,
          businessId: business.id
        }
      });

      // 3. Create welcome notification
      await tx.notification.create({
        data: {
          type: 'system',
          title: 'Welcome to the Platform!',
          message: subscriptionData.subscriptionPlan === 'free_trial'
            ? `Your 14-day free trial has started. Enjoy exploring all features!`
            : `Your business account has been created successfully.`,
          businessId: business.id,
          read: false
        }
      });

      return { business, admin, generatedPassword };
    });

    console.log(`✅ Created business: ${result.business.businessName} (${result.business.slug})`);
    console.log(`   - Subscription: ${result.business.subscriptionPlan}`);
    if (result.business.subscriptionPlan === 'free_trial') {
      console.log(`   - Trial ends: ${result.business.trialEndsAt?.toDateString()}`);
    } else if (result.business.subscriptionExpiry) {
      console.log(`   - Expires: ${result.business.subscriptionExpiry.toDateString()}`);
    }
    console.log(`✅ Created admin user: ${result.admin.email} for business ID ${result.business.id}`);

    // Return business info with admin credentials
    res.status(201).json({
      ok: true,
      business: result.business,
      admin: {
        id: result.admin.id,
        email: result.admin.email,
        firstName: result.admin.firstName,
        lastName: result.admin.lastName,
        // ✅ IMPORTANT: Return the generated password (only shown once!)
        temporaryPassword: result.generatedPassword
      },
      subscription: {
        plan: result.business.subscriptionPlan,
        expiresAt: result.business.subscriptionExpiry || result.business.trialEndsAt,
        isTrial: result.business.subscriptionPlan === 'free_trial'
      },
      message: 'Business and admin account created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating business:', error);
    res.status(500).json({ 
      error: 'Failed to create business and admin account',
      details: error.message 
    });
  }
}

// ============================================================================
// UPDATE BUSINESS
// ============================================================================
async function updateBusiness(req, res) {
  const businessId = Number(req.params.id);
  
  // Super-admin can update any business, others only their own
  if (req.user.role !== 'super-admin' && req.user.businessId !== businessId) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const { slug, ...updateData } = req.body;
  
  // Don't allow changing slug (would break subdomain routing)
  if (slug && slug !== (await prisma.business.findUnique({ where: { id: businessId } }))?.slug) {
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ error: 'Only super-admin can change business slug' });
    }
  }
  
  const business = await prisma.business.update({
    where: { id: businessId },
    data: slug ? { slug, ...updateData } : updateData
  });
  
  console.log(`✅ Updated business: ${business.businessName}`);
  
  res.json(business);
}

// ============================================================================
// DELETE BUSINESS (Super-admin only)
// ============================================================================
async function deleteBusiness(req, res) {
  if (req.user.role !== 'super-admin') {
    return res.status(403).json({ error: 'Forbidden: Super-admin access required' });
  }
  
  const businessId = Number(req.params.id);
  
  // Check if business has users/products/orders
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      _count: {
        select: {
          users: true,
          products: true,
          orders: true
        }
      }
    }
  });
  
  if (!business) {
    return res.status(404).json({ error: 'Business not found' });
  }
  
  // Warn if business has data
  if (business._count.users > 0 || business._count.products > 0 || business._count.orders > 0) {
    console.warn(`⚠️ Deleting business ${business.businessName} with ${business._count.users} users, ${business._count.products} products, ${business._count.orders} orders`);
  }
  
  await prisma.business.delete({
    where: { id: businessId }
  });
  
  console.log(`🗑️ Deleted business: ${business.businessName}`);
  
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
    where: { id: req.user.businessId }
  });
  
  if (!business) {
    return res.status(404).json({ error: 'Business not found' });
  }
  
  res.json(business);
}

// ============================================================================
// TOGGLE BUSINESS STATUS (Suspend/Reactivate)
// ============================================================================
async function toggleBusinessStatus(req, res) {
  if (req.user.role !== 'super-admin') {
    return res.status(403).json({ error: 'Forbidden: Super-admin access required' });
  }
  
  const businessId = Number(req.params.id);
  const { isActive, suspensionReason } = req.body;
  
  const business = await prisma.business.findUnique({
    where: { id: businessId }
  });
  
  if (!business) {
    return res.status(404).json({ error: 'Business not found' });
  }
  
  const updated = await prisma.business.update({
    where: { id: businessId },
    data: {
      isActive: isActive,
      suspendedAt: !isActive ? new Date() : null,
      suspensionReason: !isActive ? suspensionReason : null
    }
  });
  
  console.log(`${isActive ? '✅ Reactivated' : '⚠️ Suspended'} business: ${business.businessName}`);
  
  res.json({
    ok: true,
    message: isActive ? 'Business reactivated' : 'Business suspended',
    business: updated
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
  toggleBusinessStatus
};