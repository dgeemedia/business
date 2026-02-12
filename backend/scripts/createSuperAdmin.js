// backend/scripts/createSuperAdmin.js
require('dotenv').config();
const bcrypt = require('bcrypt');
const prisma = require('../src/lib/prisma');

// ============================================================================
// CONFIGURATION - CHANGE THESE VALUES
// ============================================================================

const SUPER_ADMIN = {
  email: 'superadmin@mypadibusiness.com',     // ⬅️ CHANGE THIS
  password: 'SuperAdmin123!',              // ⬅️ CHANGE THIS (make it strong!)
  firstName: 'George',                      // ⬅️ CHANGE THIS
  lastName: 'Olumah',                       // ⬅️ CHANGE THIS
  phone: '+2348110252143',                 // ⬅️ CHANGE THIS
};

// ============================================================================
// CREATE SUPER-ADMIN
// ============================================================================

async function createSuperAdmin() {
  console.log('🚀 Creating Super-Admin Account...\n');

  try {
    // Check if super-admin already exists
    const existing = await prisma.user.findUnique({
      where: { email: SUPER_ADMIN.email },
    });

    if (existing) {
      console.log('⚠️  Super-admin already exists!');
      console.log(`   Email: ${existing.email}`);
      console.log(`   Role: ${existing.role}`);
      console.log(`   Created: ${existing.createdAt}`);
      console.log('\n💡 Tip: If you want to reset the password, delete this user first.');
      return;
    }

    // Hash password
    console.log('🔒 Hashing password...');
    const passwordHash = await bcrypt.hash(SUPER_ADMIN.password, 12);

    // Create super-admin
    console.log('👤 Creating super-admin user...');
    const superAdmin = await prisma.user.create({
      data: {
        email: SUPER_ADMIN.email,
        passwordHash,
        role: 'super-admin',
        firstName: SUPER_ADMIN.firstName,
        lastName: SUPER_ADMIN.lastName,
        phone: SUPER_ADMIN.phone,
        businessId: null,  // 🔥 Super-admin has NO business
        active: true,
      },
    });

    console.log('\n✅ Super-Admin Created Successfully!\n');
    console.log('📋 Account Details:');
    console.log('═'.repeat(50));
    console.log(`   ID:         ${superAdmin.id}`);
    console.log(`   Email:      ${superAdmin.email}`);
    console.log(`   Password:   ${SUPER_ADMIN.password}`);
    console.log(`   Role:       ${superAdmin.role}`);
    console.log(`   Business:   None (access to ALL businesses)`);
    console.log(`   Name:       ${superAdmin.firstName} ${superAdmin.lastName}`);
    console.log(`   Phone:      ${superAdmin.phone}`);
    console.log(`   Active:     ${superAdmin.active}`);
    console.log(`   Created:    ${superAdmin.createdAt}`);
    console.log('═'.repeat(50));

    console.log('\n🔐 SECURITY REMINDERS:');
    console.log('   1. CHANGE THIS PASSWORD after first login!');
    console.log('   2. Store credentials in a password manager');
    console.log('   3. Enable 2FA if available');
    console.log('   4. Never share these credentials');

    console.log('\n🎯 Next Steps:');
    console.log('   1. Login at: https://yourdomain.com/dashboard/login');
    console.log('   2. Create businesses using the dashboard');
    console.log('   3. Create admin users for each business');

  } catch (error) {
    console.error('\n❌ Error creating super-admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================================================
// RUN THE SCRIPT
// ============================================================================

createSuperAdmin()
  .then(() => {
    console.log('\n🎉 Script completed successfully!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });