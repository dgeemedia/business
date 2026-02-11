// backend/src/routes/language.js
const express = require('express');
const { detectCountryFromIP } = require('../utils/geoDetection');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Enhanced country-to-language mapping
const COUNTRY_LANGUAGE_MAP = {
  // West Africa
  'NG': { code: 'en', name: 'Nigeria', languages: ['en', 'yo', 'ig', 'ha'], priority: 0 }, // Nigeria
  'GH': { code: 'en', name: 'Ghana', languages: ['en', 'tw', 'ee', 'dag'], priority: 1 }, // Ghana
  'SN': { code: 'fr', name: 'Senegal', languages: ['fr', 'wo'], priority: 2 }, // Senegal
  'CI': { code: 'fr', name: 'Côte d\'Ivoire', languages: ['fr'], priority: 3 }, // Ivory Coast
  'TG': { code: 'fr', name: 'Togo', languages: ['fr', 'ee'], priority: 4 }, // Togo
  'BJ': { code: 'fr', name: 'Benin', languages: ['fr', 'yo'], priority: 5 }, // Benin
  
  // East Africa
  'KE': { code: 'en', name: 'Kenya', languages: ['en', 'sw'], priority: 6 }, // Kenya
  'TZ': { code: 'sw', name: 'Tanzania', languages: ['sw', 'en'], priority: 7 }, // Tanzania
  'UG': { code: 'en', name: 'Uganda', languages: ['en', 'sw'], priority: 8 }, // Uganda
  
  // Central Africa
  'CM': { code: 'fr', name: 'Cameroon', languages: ['fr', 'en'], priority: 9 }, // Cameroon
  'CG': { code: 'fr', name: 'Congo', languages: ['fr', 'ln'], priority: 10 }, // Congo
  
  // North Africa
  'EG': { code: 'ar', name: 'Egypt', languages: ['ar', 'en'], priority: 11 }, // Egypt
  'MA': { code: 'ar', name: 'Morocco', languages: ['ar', 'fr'], priority: 12 }, // Morocco
  'TN': { code: 'ar', name: 'Tunisia', languages: ['ar', 'fr'], priority: 13 }, // Tunisia
  'DZ': { code: 'ar', name: 'Algeria', languages: ['ar', 'fr'], priority: 14 }, // Algeria
  
  // Southern Africa
  'ZA': { code: 'en', name: 'South Africa', languages: ['en', 'zu', 'xh'], priority: 15 }, // South Africa
  
  // Middle East & Asia
  'IQ': { code: 'ar', name: 'Iraq', languages: ['ar', 'ku'], priority: 16 }, // Iraq
  'IN': { code: 'hi', name: 'India', languages: ['hi', 'en'], priority: 17 }, // India
  
  // Europe (for France)
  'FR': { code: 'fr', name: 'France', languages: ['fr'], priority: 18 }, // France
  
  // Default
  'default': { code: 'en', name: 'International', languages: ['en'], priority: 999 }
};

// Detect user's language from IP
router.get('/detect', asyncHandler(async (req, res) => {
  const acceptLanguage = req.headers['accept-language'] || '';
  
  // Get country from IP
  let countryCode = 'default';
  try {
    countryCode = await detectCountryFromIP(req);
  } catch (error) {
    console.log('IP detection failed:', error.message);
  }
  
  // Get language info from country mapping
  const countryInfo = COUNTRY_LANGUAGE_MAP[countryCode] || COUNTRY_LANGUAGE_MAP.default;
  
  // Parse Accept-Language header
  const browserLanguages = acceptLanguage 
    ? acceptLanguage.split(',')
        .map(lang => {
          const [code, q = 'q=1.0'] = lang.split(';');
          const quality = parseFloat(q.split('=')[1]) || 1.0;
          return {
            code: code.trim().split('-')[0].toLowerCase(),
            quality
          };
        })
        .sort((a, b) => b.quality - a.quality)
        .map(lang => lang.code)
    : [];
  
  // Determine best language match
  let finalLanguage = countryInfo.code;
  const supportedLanguages = ['en', 'fr', 'yo', 'ig', 'ha', 'sw', 'ar', 'hi'];
  
  // Check if browser language is in country's available languages
  for (const browserLang of browserLanguages) {
    if (countryInfo.languages.includes(browserLang) && supportedLanguages.includes(browserLang)) {
      finalLanguage = browserLang;
      break;
    }
  }
  
  // If browser language not in country languages, check if it's in supported languages
  if (finalLanguage === countryInfo.code) {
    for (const browserLang of browserLanguages) {
      if (supportedLanguages.includes(browserLang)) {
        finalLanguage = browserLang;
        break;
      }
    }
  }
  
  const response = {
    success: true,
    ipCountry: {
      code: countryCode,
      name: countryInfo.name
    },
    detectedLanguage: {
      code: finalLanguage,
      countryBased: countryInfo.code,
      browserBased: browserLanguages[0] || 'none'
    },
    browserLanguages,
    countryLanguages: countryInfo.languages,
    timestamp: new Date().toISOString()
  };
  
  res.json(response);
}));

// Get supported languages
router.get('/supported', asyncHandler(async (req, res) => {
  const languages = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', region: 'International' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', region: 'West & North Africa' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', region: 'North Africa & Middle East' },
    { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá', flag: '🇳🇬', region: 'Nigeria, Benin' },
    { code: 'ig', name: 'Igbo', nativeName: 'Igbo', flag: '🇳🇬', region: 'Nigeria' },
    { code: 'ha', name: 'Hausa', nativeName: 'Hausa', flag: '🇳🇬', region: 'Nigeria, Niger' },
    { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇹🇿', region: 'East Africa' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', region: 'India' },
  ];
  
  res.json({
    success: true,
    languages,
    total: languages.length
  });
}));

module.exports = router;