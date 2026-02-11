// backend/scripts/createAdmin.js
// Script to create an admin account for a specific business

const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ============================================================================
// CONFIGURATION - CHANGE THESE VALUES
// ============================================================================

const ADMIN = {
  email: 'admin@chrenisfarm.com',         // ⬅️ CHANGE THIS
  password: 'Admin123!',                   // ⬅️ CHANGE THIS (make it strong!)
  firstName: 'Chrenis',                     // ⬅️ CHANGE THIS
  lastName: 'Farm Admin',                  // ⬅️ CHANGE THIS
  phone: '+2348110252144',                 // ⬅️ CHANGE THIS
  businessSlug: 'chrenisfarm',             // ⬅️ CHANGE THIS (must match business slug)
};

// ============================================================================
// CREATE ADMIN
// ============================================================================

async function createAdmin() {
  console.log('🚀 Creating Admin Account...\n');

  try {
    // 1. Find the business
    console.log(`🔍 Looking for business: ${ADMIN.businessSlug}`);
    const business = await prisma.business.findUnique({
      where: { slug: ADMIN.businessSlug },
    });

    if (!business) {
      console.error(`\n❌ Business not found: ${ADMIN.businessSlug}`);
      console.log('\n💡 Available businesses:');
      
      const allBusinesses = await prisma.business.findMany({
        select: { id: true, slug: true, businessName: true },
      });

      if (allBusinesses.length === 0) {
        console.log('   ⚠️  No businesses found in database!');
        console.log('   📝 Create a business first using the super-admin dashboard.');
      } else {
        console.table(allBusinesses);
        console.log('\n   Update ADMIN.businessSlug to match one of the slugs above.');
      }
      
      process.exit(1);
    }

    console.log(`✅ Found business: ${business.businessName} (ID: ${business.id})`);

    // 2. Check if admin already exists
    const existing = await prisma.user.findUnique({
      where: { email: ADMIN.email },
    });

    if (existing) {
      console.log('\n⚠️  Admin already exists!');
      console.log(`   Email: ${existing.email}`);
      console.log(`   Role: ${existing.role}`);
      console.log(`   Business ID: ${existing.businessId}`);
      console.log(`   Created: ${existing.createdAt}`);
      console.log('\n💡 Tip: If you want to reset the password, delete this user first.');
      return;
    }

    // 3. Hash password
    console.log('🔒 Hashing password...');
    const passwordHash = await bcrypt.hash(ADMIN.password, 12);

    // 4. Create admin
    console.log('👤 Creating admin user...');
    const admin = await prisma.user.create({
      data: {
        email: ADMIN.email,
        passwordHash,
        role: 'admin',
        firstName: ADMIN.firstName,
        lastName: ADMIN.lastName,
        phone: ADMIN.phone,
        businessId: business.id,  // 🔥 Admin is linked to this business
        active: true,
      },
    });

    console.log('\n✅ Admin Created Successfully!\n');
    console.log('📋 Account Details:');
    console.log('═'.repeat(50));
    console.log(`   ID:         ${admin.id}`);
    console.log(`   Email:      ${admin.email}`);
    console.log(`   Password:   ${ADMIN.password}`);
    console.log(`   Role:       ${admin.role}`);
    console.log(`   Business:   ${business.businessName} (${business.slug})`);
    console.log(`   Business ID: ${admin.businessId}`);
    console.log(`   Name:       ${admin.firstName} ${admin.lastName}`);
    console.log(`   Phone:      ${admin.phone}`);
    console.log(`   Active:     ${admin.active}`);
    console.log(`   Created:    ${admin.createdAt}`);
    console.log('═'.repeat(50));

    console.log('\n🔐 SECURITY REMINDERS:');
    console.log('   1. CHANGE THIS PASSWORD after first login!');
    console.log('   2. Store credentials in a password manager');
    console.log('   3. Never share these credentials');

    console.log('\n🎯 Admin Permissions:');
    console.log(`   ✅ Can manage ${business.businessName}`);
    console.log('   ✅ Can create/manage staff for this business');
    console.log('   ✅ Can manage products, orders, settings');
    console.log('   ❌ Cannot access other businesses');
    console.log('   ❌ Cannot create super-admins');

    console.log('\n🌐 Login URL:');
    console.log(`   https://${business.slug}.mypadifood.com/dashboard/login`);

  } catch (error) {
    console.error('\n❌ Error creating admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================================================
// RUN THE SCRIPT
// ============================================================================

createAdmin()
  .then(() => {
    console.log('\n🎉 Script completed successfully!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });