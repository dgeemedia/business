// backend/src/middleware/subdomain.js (UPDATED with maintenance mode)
const prisma = require('../lib/prisma');

/**
 * Extracts the business slug from a raw hostname string.
 */
function parseSlugFromHostname(hostname) {
  if (!hostname) return null;

  // Strip port if present
  const host = hostname.split(':')[0];
  const parts = host.split('.');

  // LOCAL DEV: *.localhost
  if (parts[parts.length - 1] === 'localhost') {
    return parts.length >= 2 ? parts[0] : null;
  }

  // PRODUCTION: *.domain.tld
  if (parts.length <= 2) return null;
  if (parts[0] === 'www') return null;

  return parts[0];
}

/**
 * Middleware to extract and attach business context from subdomain.
 * ✅ ENHANCED: Now checks if business is active and returns maintenance mode if suspended
 */
async function extractSubdomain(req, res, next) {
  try {
    const hostname = req.hostname || req.get('host');
    console.log(`🔍 Extracting subdomain from: ${hostname}`);

    // Allow explicit override header
    const headerSlug = req.get('X-Business-Slug');
    const parsedSlug = parseSlugFromHostname(hostname);
    const slug = headerSlug || parsedSlug;

    if (!slug) {
      console.log('ℹ️  No subdomain detected (root / landing page)');
      return next();
    }

    const business = await prisma.business.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        businessName: true,
        isActive: true,
        suspendedAt: true,
        suspensionReason: true,
        subscriptionPlan: true,
        subscriptionExpiry: true,
        trialEndsAt: true,
        whatsappNumber: true,
        phone: true,
        email: true,
        logo: true,
        primaryColor: true
      }
    });

    if (business) {
      req.businessId = business.id;
      req.businessSlug = business.slug;
      
      // ✅ NEW: Check if business is suspended/inactive
      if (!business.isActive) {
        console.warn(`⚠️  Business "${slug}" is suspended/inactive`);
        
        // Set maintenance mode flag and data
        req.maintenanceMode = true;
        req.maintenanceData = {
          businessName: business.businessName,
          slug: business.slug,
          suspensionReason: business.suspensionReason,
          suspendedAt: business.suspendedAt,
          whatsappNumber: business.whatsappNumber,
          phone: business.phone,
          email: business.email,
          logo: business.logo,
          primaryColor: business.primaryColor
        };
        
        // Return maintenance response for API requests
        if (req.path.startsWith('/api/')) {
          return res.status(503).json({
            error: 'Business is currently unavailable',
            maintenanceMode: true,
            reason: business.suspensionReason || 'Platform undergoing maintenance',
            contactSupport: {
              whatsapp: business.whatsappNumber,
              phone: business.phone,
              email: business.email
            }
          });
        }
        
        // For regular requests, let Next.js handle the redirect to maintenance page
        // You'll need to add middleware in Next.js to detect this and redirect
      }
      
      console.log(`✅ Subdomain resolved: "${slug}" → Business ID ${business.id} (${business.isActive ? 'Active' : 'Suspended'})`);
    } else {
      console.warn(`⚠️  No business found for subdomain: "${slug}"`);
    }

    next();
  } catch (error) {
    console.error('❌ Subdomain extraction error:', error);
    next();
  }
}

/**
 * Middleware to require business context (for protected routes).
 * ✅ ENHANCED: Also checks if business is active
 */
function requireBusiness(req, res, next) {
  if (!req.businessId && !req.user?.businessId) {
    return res.status(400).json({
      error: 'Business context required. Please access via subdomain.'
    });
  }

  // If not set from subdomain, use user's business
  if (!req.businessId && req.user?.businessId) {
    req.businessId = req.user.businessId;
  }

  // ✅ NEW: Check if in maintenance mode
  if (req.maintenanceMode) {
    return res.status(503).json({
      error: 'Business is currently unavailable',
      maintenanceMode: true,
      reason: req.maintenanceData?.suspensionReason || 'Platform undergoing maintenance'
    });
  }

  next();
}

/**
 * ✅ NEW: Middleware to allow access even in maintenance mode
 * Use this for routes that should work even when business is suspended
 * (e.g., admin routes, status check endpoints)
 */
function allowMaintenanceMode(req, res, next) {
  // Simply skip the maintenance check
  next();
}

module.exports = {
  extractSubdomain,
  requireBusiness,
  allowMaintenanceMode,
  parseSlugFromHostname
};