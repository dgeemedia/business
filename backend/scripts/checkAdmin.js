// backend/scripts/checkAdmin.js  — run once with: node scripts/checkAdmin.js
const bcrypt = require('bcrypt');
const prisma = require('../src/lib/prisma');

async function check() {
  const user = await prisma.user.findFirst({
    where: { role: 'super-admin' }
  });

  if (!user) {
    console.log('❌ No super-admin found in DB at all');
    return;
  }

  console.log('Found super-admin:');
  console.log('  email    :', user.email);
  console.log('  active   :', user.active);
  console.log('  role     :', user.role);
  console.log('  hashLen  :', user.passwordHash?.length);
  console.log('  hashStart:', user.passwordHash?.substring(0, 7)); // should be "$2b$12$"

  // Test the actual password — replace with what you're typing
  const testPassword = 'PASSWORD_YOU_SET'; // ← change this to the password you set for the super-admin
  const match = await bcrypt.compare(testPassword, user.passwordHash);
  console.log('  password match:', match);

  await prisma.$disconnect();
}

check().catch(console.error);