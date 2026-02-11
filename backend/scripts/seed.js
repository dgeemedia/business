const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  
  // Create default business settings
  const settings = await prisma.businessSettings.upsert({
    where: { id: 1 },
    update: {
      // Update with language settings if they exist
      supportedLanguages: ['en', 'fr', 'yo', 'ig', 'ha'],
      autoDetectLanguage: true,
      defaultLanguage: 'en',
      language: 'en'
    },
    create: {
      businessName: 'MyPadiFood',
      phone: '+234 811 025 2143',
      whatsappNumber: '2348110252143',
      currency: 'NGN',
      language: 'en',
      primaryColor: '#10B981',
      secondaryColor: '#F59E0B',
      supportedLanguages: ['en', 'fr', 'yo', 'ig', 'ha'],
      autoDetectLanguage: true,
      defaultLanguage: 'en'
    }
  });
  
  console.log('✅ Business settings created:', settings.businessName);
  
  // Create admin user
  const passwordHash = await bcrypt.hash('Admin123456', 12);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@mypadifood.com' },
    update: {},
    create: {
      email: 'admin@mypadifood.com',
      passwordHash,
      role: 'super-admin',
      firstName: 'Admin',
      lastName: 'User',
      active: true
    }
  });
  
  console.log('✅ Admin user created:', adminUser.email);
  
  console.log('🎉 Seeding completed!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());