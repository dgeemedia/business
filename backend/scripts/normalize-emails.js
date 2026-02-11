// backend/scripts/normalize-emails.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany();

  for (const u of users) {
    const lower = u.email.toLowerCase();
    if (u.email !== lower) {
      await prisma.user.update({
        where: { id: u.id },
        data: { email: lower },
      });
      console.log(`Updated: ${u.email} → ${lower}`);
    }
  }

  await prisma.$disconnect();
}

run();
