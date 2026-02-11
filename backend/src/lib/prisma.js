// backend/src/lib/prisma.js - PRODUCTION-READY
const { PrismaClient } = require('@prisma/client');

let prisma;

// Singleton pattern to prevent multiple instances
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
} else {
  // In development, use global to prevent hot-reload connection issues
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'error', 'warn'], // More verbose logging in dev
    });
  }
  prisma = global.prisma;
}

// Test connection on startup
prisma.$connect()
  .then(() => {
    console.log('🗄️  Prisma Client connected successfully');
    console.log(`📊 Connection pool configured for multi-tenant access`);
  })
  .catch((error) => {
    console.error('❌ Prisma Client connection failed:', error.message);
    process.exit(1); // Exit if database connection fails
  });

// Graceful shutdown - disconnect on process termination
const cleanup = async () => {
  console.log('🔌 Disconnecting Prisma Client...');
  await prisma.$disconnect();
  console.log('✅ Prisma Client disconnected');
  process.exit(0);
};

process.on('SIGINT', cleanup);  // Ctrl+C
process.on('SIGTERM', cleanup); // Kill command
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;