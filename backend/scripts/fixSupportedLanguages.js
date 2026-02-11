// backend/scripts/fixSupportedLanguages.js
// Run this script once to fix existing data: node scripts/fixSupportedLanguages.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSupportedLanguages() {
  console.log('🔧 Starting to fix supportedLanguages data...');

  try {
    // Get all business settings
    const settings = await prisma.businessSettings.findMany();

    console.log(`📊 Found ${settings.length} settings record(s)`);

    for (const setting of settings) {
      const currentValue = setting.supportedLanguages;
      console.log(`\n📝 Current value for ID ${setting.id}:`, currentValue);

      let needsUpdate = false;
      let newValue;

      // Check if it's a valid JSON array
      if (typeof currentValue === 'string') {
        try {
          const parsed = JSON.parse(currentValue);
          if (Array.isArray(parsed)) {
            console.log('✅ Already valid JSON array');
            continue;
          } else {
            needsUpdate = true;
          }
        } catch (e) {
          // Not valid JSON - needs fixing
          console.log('❌ Invalid JSON detected');
          needsUpdate = true;
        }
      } else if (!currentValue) {
        needsUpdate = true;
      }

      if (needsUpdate) {
        // Convert comma-separated string to JSON array
        if (typeof currentValue === 'string' && currentValue.includes(',')) {
          const langs = currentValue.split(',').map(lang => lang.trim()).filter(Boolean);
          newValue = JSON.stringify(langs);
        } else {
          // Use default
          newValue = JSON.stringify(['en', 'fr', 'yo', 'ig', 'ha']);
        }

        console.log(`🔄 Updating to:`, newValue);

        await prisma.businessSettings.update({
          where: { id: setting.id },
          data: {
            supportedLanguages: newValue
          }
        });

        console.log('✅ Updated successfully');
      }
    }

    console.log('\n✅ All settings have been fixed!');
  } catch (error) {
    console.error('❌ Error fixing settings:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixSupportedLanguages()
  .then(() => {
    console.log('\n🎉 Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });