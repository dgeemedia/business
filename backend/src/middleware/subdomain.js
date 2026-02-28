// backend/src/middleware/subdomain.js
const prisma = require('../lib/prisma');

/**
 * Extracts the business slug from a raw hostname string.
 */
function parseSlugFromHostname(hostname) {
  if (!hostname) return null;

  // Strip port if present
  const host = hostname.split(':')[0];
  const parts = host.split('.');

  // LOCAL DEV: anything.localhost  e.g. gee-store.localhost
  if (parts[parts.length - 1] === 'localhost') {
    // "localhost"          → parts.length === 1 → no subdomain
    // "gee-store.localhost" → parts.length === 2 → subdomain = parts[0]
    return parts.length >= 2 ? parts[0] : null;
  }

  // PRODUCTION: subdomain.domain.tld
  if (parts.length <= 2) return null;
  if (parts[0] === 'www') return null;

  return parts[0];
}


async function extractSubdomain(req, res, next) {
  try {
    const hostname = req.hostname || req.get('host');

    // ✅ FIXED header name — must match what api.js sends
    const headerSlug = req.get('X-Business-Subdomain');   // was wrongly 'X-Business-Slug'
    const parsedSlug = parseSlugFromHostname(hostname);
    const slug       = headerSlug || parsedSlug;

    if (!slug) {
      return next(); // root domain / no subdomain
    }

    const business = await prisma.business.findUnique({
      where: { slug },
      select: {
        id:              true,
        slug:            true,
        businessName:    true,
        isActive:        true,
        suspendedAt:     true,
        suspensionReason:true,
        subscriptionPlan:true,
        subscriptionExpiry: true,
        trialEndsAt:     true,
        whatsappNumber:  true,
        phone:           true,
        email:           true,
        logo:            true,
        primaryColor:    true,
      },
    });

    if (!business) {
      console.warn(`⚠️  No business found for subdomain: "${slug}"`);
      return next();
    }

    req.businessId   = business.id;
    req.businessSlug = business.slug;

    if (!business.isActive) {
      console.warn(`⚠️  Business "${slug}" is suspended/inactive`);

      req.maintenanceMode = true;
      req.maintenanceData = {
        businessName:     business.businessName,
        slug:             business.slug,
        suspensionReason: business.suspensionReason,
        suspendedAt:      business.suspendedAt,
        whatsappNumber:   business.whatsappNumber,
        phone:            business.phone,
        email:            business.email,
        logo:             business.logo,
        primaryColor:     business.primaryColor,
      };

      // For API calls, return 503 immediately
      if (req.path.startsWith('/api/')) {
        return res.status(503).json({
          error:           'Business is currently unavailable',
          maintenanceMode: true,
          reason:          business.suspensionReason || 'Platform undergoing maintenance',
          contactSupport: {
            whatsapp: business.whatsappNumber,
            phone:    business.phone,
            email:    business.email,
          },
        });
      }
    }

    console.log(
      `✅ Subdomain resolved: "${slug}" → Business ID ${business.id}` +
      ` (${business.isActive ? 'Active' : 'Suspended'})`
    );

    return next();
  } catch (error) {
    console.error('❌ Subdomain extraction error:', error);
    return next(); // never block the request
  }
}

/**
 * Middleware: require a business context on the request.
 * Falls back to the authenticated user's businessId if subdomain is absent.
 */
function requireBusiness(req, res, next) {
  if (!req.businessId && !req.user?.businessId) {
    return res.status(400).json({
      error: 'Business context required. Please access via subdomain.',
    });
  }

  if (!req.businessId && req.user?.businessId) {
    req.businessId = req.user.businessId;
  }

  if (req.maintenanceMode) {
    return res.status(503).json({
      error:           'Business is currently unavailable',
      maintenanceMode: true,
      reason:          req.maintenanceData?.suspensionReason || 'Platform undergoing maintenance',
    });
  }

  return next();
}

/**
 * Middleware: allow a route to proceed even when the business is suspended.
 * Use on admin/status-check routes.
 */
function allowMaintenanceMode(req, res, next) {
  return next();
}

module.exports = {
  extractSubdomain,
  requireBusiness,
  allowMaintenanceMode,
  parseSlugFromHostname,
};