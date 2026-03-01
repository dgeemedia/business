// backend/scripts/resetAdminPassword.js
// Run with: node scripts/resetAdminPassword.js
const bcrypt = require('bcrypt');
const prisma = require('../src/lib/prisma');

async function reset() {
  const NEW_PASSWORD = 'PASSWORD_YOU_SET'; // ← change this to whatever you want

  const hash = await bcrypt.hash(NEW_PASSWORD, 12);

  await prisma.user.update({
    where: { email: 'superadmin@mypadibusiness.com' },
    data:  { passwordHash: hash },
  });

  console.log('✅ Password reset successfully');
  console.log('   Email   :', 'superadmin@mypadibusiness.com');
  console.log('   Password:', NEW_PASSWORD);
  await prisma.$disconnect();
}

reset().catch(console.error);