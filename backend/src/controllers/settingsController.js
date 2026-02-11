// backend/src/controllers/settingsController.js
const prisma = require('../lib/prisma');

function parseSupportedLanguages(value) {
  if (!value) return ['en', 'fr', 'yo', 'ig', 'ha'];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      return value.split(',').map(lang => lang.trim()).filter(Boolean);
    }
  }
  return ['en', 'fr', 'yo', 'ig', 'ha'];
}

function stringifySupportedLanguages(value) {
  if (!value) return JSON.stringify(['en', 'fr', 'yo', 'ig', 'ha']);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return value;
    } catch (e) {
      const langs = value.split(',').map(lang => lang.trim()).filter(Boolean);
      return JSON.stringify(langs);
    }
  }
  if (Array.isArray(value)) return JSON.stringify(value);
  return JSON.stringify(['en', 'fr', 'yo', 'ig', 'ha']);
}

async function resolveBusinessId(req) {
  if (req.businessId) return { id: req.businessId };
  if (req.user && req.user.businessId) return { id: req.user.businessId };
  
  // ✅ NEW: For super-admin on bare domain, return null (no business required)
  if (req.user && req.user.role === 'super-admin') {
    return { id: null };
  }
  
  const first = await prisma.business.findFirst();
  if (first) return { id: first.id };
  
  return { id: null, error: 'No business could be resolved' };
}

// GET SETTINGS
async function getSettings(req, res) {
  try {
    const { id: businessId } = await resolveBusinessId(req);

    // ✅ NEW: If no business context and no user, return generic defaults
    if (!businessId && !req.user) {
      return res.json({
        id: 0,
        businessName: 'Multi-Tenant Platform',
        businessType: 'platform',
        phone: '',
        whatsappNumber: '',
        currency: 'NGN',
        language: 'en',
        primaryColor: '#10B981',
        secondaryColor: '#F59E0B',
        autoDetectLanguage: true,
        defaultLanguage: 'en',
        supportedLanguages: ['en', 'fr', 'yo', 'ig', 'ha']
      });
    }

    if (!businessId) {
      const oldSettings = await prisma.businessSettings.findFirst();
      if (oldSettings) {
        return res.json({
          ...oldSettings,
          supportedLanguages: parseSupportedLanguages(oldSettings.supportedLanguages)
        });
      }

      return res.json({
        id: 0,
        businessName: 'My Business',
        businessType: 'food',
        phone: '',
        whatsappNumber: '',
        currency: 'NGN',
        language: 'en',
        primaryColor: '#10B981',
        secondaryColor: '#F59E0B',
        autoDetectLanguage: true,
        defaultLanguage: 'en',
        supportedLanguages: ['en', 'fr', 'yo', 'ig', 'ha']
      });
    }

    const settings = await prisma.business.findUnique({
      where: { id: businessId }
    });

    if (!settings) {
      return res.status(404).json({ error: 'Business not found' });
    }

    res.json({
      ...settings,
      supportedLanguages: parseSupportedLanguages(settings.supportedLanguages)
    });
  } catch (err) {
    console.error('❌ Error fetching settings:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
}

// UPDATE SETTINGS (unchanged)
async function updateSettings(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    let targetBusinessId = null;

    if (req.body.businessId) {
      targetBusinessId = Number(req.body.businessId);
    } else {
      const { id } = await resolveBusinessId(req);
      targetBusinessId = id;
    }

    if (!targetBusinessId) {
      return res.status(400).json({
        error: 'Could not determine which business to update.'
      });
    }

    if (req.user.role !== 'super-admin' && req.user.businessId !== targetBusinessId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updateData = { ...req.body };
    delete updateData.businessId;
    delete updateData.slug;

    if (updateData.supportedLanguages) {
      updateData.supportedLanguages = stringifySupportedLanguages(updateData.supportedLanguages);
    }

    const existing = await prisma.business.findUnique({
      where: { id: targetBusinessId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const settings = await prisma.business.update({
      where: { id: targetBusinessId },
      data: updateData,
    });

    console.log(`✅ Business settings updated: ${settings.businessName} (ID: ${settings.id})`);

    res.json({
      ok: true,
      settings: {
        ...settings,
        supportedLanguages: parseSupportedLanguages(settings.supportedLanguages)
      }
    });
  } catch (error) {
    console.error('❌ Error updating settings:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to update settings',
      details: error.message
    });
  }
}

async function migrateOldSettings(req, res) {
  try {
    if (req.user?.role !== 'super-admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const oldSettings = await prisma.businessSettings.findFirst();

    if (!oldSettings) {
      return res.json({ ok: false, message: 'No old settings to migrate' });
    }

    const existingBusiness = await prisma.business.findUnique({
      where: { slug: oldSettings.slug }
    });

    if (existingBusiness) {
      return res.json({
        ok: false,
        message: 'Business already migrated',
        business: existingBusiness
      });
    }

    const business = await prisma.business.create({
      data: {
        slug: oldSettings.slug,
        businessName: oldSettings.businessName,
        businessType: oldSettings.businessType,
        businessMotto: oldSettings.businessMotto,
        phone: oldSettings.phone,
        email: oldSettings.email,
        address: oldSettings.address,
        description: oldSettings.description,
        logo: oldSettings.logo,
        primaryColor: oldSettings.primaryColor,
        secondaryColor: oldSettings.secondaryColor,
        currency: oldSettings.currency,
        language: oldSettings.language,
        supportedLanguages: oldSettings.supportedLanguages,
        autoDetectLanguage: oldSettings.autoDetectLanguage,
        defaultLanguage: oldSettings.defaultLanguage,
        whatsappNumber: oldSettings.whatsappNumber,
        facebookUrl: oldSettings.facebookUrl,
        twitterUrl: oldSettings.twitterUrl,
        instagramUrl: oldSettings.instagramUrl,
        youtubeUrl: oldSettings.youtubeUrl,
        linkedinUrl: oldSettings.linkedinUrl,
        tiktokUrl: oldSettings.tiktokUrl,
        footerText: oldSettings.footerText,
        footerCopyright: oldSettings.footerCopyright,
        footerAddress: oldSettings.footerAddress,
        footerEmail: oldSettings.footerEmail,
        footerPhone: oldSettings.footerPhone,
      }
    });

    res.json({
      ok: true,
      message: 'Settings migrated successfully',
      business
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({
      ok: false,
      error: 'Migration failed',
      details: error.message
    });
  }
}

module.exports = {
  getSettings,
  updateSettings,
  migrateOldSettings
};