// backend/scripts/createUsers.js
/**
 * Script to create Super Admin, Admin, and Staff users
 * 
 * Usage:
 *   node scripts/createUsers.js
 * 
 * Or with custom users:
 *   node scripts/createUsers.js --email admin@example.com --password mypass123 --role admin
 */

const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    options[key] = value;
  }
  
  return options;
}

// Default users to create
const defaultUsers = [
  {
    email: 'superadmin@mypadifood.com',
    password: 'SuperAdmin123!',
    firstName: 'Super',
    lastName: 'Admin',
    phone: '+234 800 000 0001',
    role: 'super-admin'
  },
  {
    email: 'admin@mypadifood.com',
    password: 'Admin123!',
    firstName: 'John',
    lastName: 'Admin',
    phone: '+234 800 000 0002',
    role: 'admin'
  },
  {
    email: 'staff@mypadifood.com',
    password: 'Staff123!',
    firstName: 'Jane',
    lastName: 'Staff',
    phone: '+234 800 000 0003',
    role: 'staff'
  }
];

async function createUser(userData) {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      console.log(`⚠️  User ${userData.email} already exists - skipping`);
      return existingUser;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(userData.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        passwordHash,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phone: userData.phone || '',
        role: userData.role,
        active: true
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        active: true
      }
    });

    console.log(`✅ Created ${user.role}: ${user.email}`);
    console.log(`   Password: ${userData.password}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log('');

    return user;
  } catch (error) {
    console.error(`❌ Failed to create user ${userData.email}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting user creation...\n');

  const args = parseArgs();

  if (args.email && args.password && args.role) {
    // Create single user from command line
    const userData = {
      email: args.email,
      password: args.password,
      firstName: args.firstName || args.email.split('@')[0],
      lastName: args.lastName || 'User',
      phone: args.phone || '',
      role: args.role
    };

    await createUser(userData);
  } else {
    // Create default users
    console.log('📋 Creating default users:\n');
    
    for (const userData of defaultUsers) {
      await createUser(userData);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 LOGIN CREDENTIALS:\n');
    
    console.log('🔴 SUPER ADMIN:');
    console.log('   Email: superadmin@mypadifood.com');
    console.log('   Password: SuperAdmin123!');
    console.log('   Access: Full system access\n');
    
    console.log('🔵 ADMIN:');
    console.log('   Email: admin@mypadifood.com');
    console.log('   Password: Admin123!');
    console.log('   Access: Can manage staff & products (not super-admins)\n');
    
    console.log('🟢 STAFF:');
    console.log('   Email: staff@mypadifood.com');
    console.log('   Password: Staff123!');
    console.log('   Access: View-only, cannot create/edit\n');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  console.log('\n✨ User creation completed!\n');
}

main()
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });