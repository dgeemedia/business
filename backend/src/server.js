// backend/src/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const { cleanupOldNotifications } = require('./jobs/cleanupNotifications');
const { runSubscriptionCheck } = require('./jobs/subscriptionCheck');
const { extractSubdomain } = require('./middleware/subdomain');
const { authMiddleware, requireSuperAdmin } = require('./middleware/auth');
const { asyncHandler } = require('./middleware/errorHandler');
const onboardingRoutes = require('./routes/onboarding');

const app = express();

// ============================================================================
// CORS CONFIGURATION (PATH-BASED SAFE)
// Supports:
//   DEV      → http://localhost:*
//   PROD     → https://mypadifood.com
//   VERCEL   → https://*.vercel.app
// ============================================================================

const PROD_DOMAIN = 'mypadifood.com';

const allowedOriginPatterns = [
  // Dev
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,

  // Production root domain (www or bare)
  new RegExp(`^https:\\/\\/(www\\.)?${PROD_DOMAIN.replace('.', '\\.')}$`),

  // ✅ Allow ALL Vercel deployments (preview + production)
  /^https:\/\/.*\.vercel\.app$/,
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const isAllowed = allowedOriginPatterns.some((pattern) =>
      pattern.test(origin)
    );

    if (isAllowed) {
      return callback(null, true);
    }

    console.warn(`🚫 CORS blocked origin: ${origin}`);
    return callback(new Error(`CORS policy: origin "${origin}" is not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
  ],
  optionsSuccessStatus: 204,
  maxAge: 600,
}));

// ============================================================================
// CORE MIDDLEWARE
// ============================================================================
app.use(express.json());

// 🔥 CRITICAL: Extract subdomain/business context BEFORE routes
app.use(extractSubdomain);

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ============================================================================
// ROUTES
// ============================================================================

app.use('/api/stats', require('./routes/stats'));

// Authentication routes
app.use('/api/auth', require('./routes/auth'));

// Business routes (multi-tenant management)
app.use('/api/business', require('./routes/business'));

// Product routes (admin - authenticated)
app.use('/api/products', require('./routes/products'));

// Order routes
app.use('/api/orders', require('./routes/orders'));

// Settings routes
app.use('/api/settings', require('./routes/settings'));

// User management routes
app.use('/api/users', require('./routes/users'));

// File upload routes
app.use('/api/upload', require('./routes/upload'));

// Notification routes
app.use('/api/notifications', require('./routes/notifications'));

// Rating routes
app.use('/api', require('./routes/ratings'));

// Language routes
app.use('/api/language', require('./routes/language'));

// Onboarding routes
app.use('/api/onboarding', onboardingRoutes);

// Payment
app.use('/api', require('./routes/payment'));

// ============================================================================
// ADMIN UTILITY ROUTES
// ============================================================================

// Manual subscription check trigger (super-admin only)
app.post('/api/admin/check-subscriptions',
  authMiddleware,
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    console.log('🔔 MANUAL SUBSCRIPTION CHECK TRIGGERED by', req.user.email);
    const result = await runSubscriptionCheck();
    res.json({
      ok: true,
      message: 'Subscription check completed',
      result,
    });
  })
);

// ============================================================================
// HEALTH CHECK
// ============================================================================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'MyPadiFood Multi-Tenant API',
    version: '2.0.0',
    features: [
      'Multi-tenant architecture',
      'Subdomain-based routing',
      'Role-based access control',
      'Business isolation',
      'Subscription management',
      'Auto-suspension system',
    ],
  });
});

// ============================================================================
// GLOBAL ERROR HANDLER
// ============================================================================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);

  const isProd = process.env.NODE_ENV === 'production';

  res.status(err.statusCode || 500).json({
    error: isProd ? 'Something went wrong' : err.message,
    ...(!isProd && { stack: err.stack }),
  });
});

// ============================================================================
// CRON JOBS
// ============================================================================

if (process.env.NODE_ENV !== 'test') {
  // Notification cleanup — daily at 2 AM Lagos time
  cron.schedule('0 2 * * *', async () => {
    console.log('⏰ Running scheduled notification cleanup...');
    try {
      const deletedCount = await cleanupOldNotifications(90);
      console.log(`✅ Cleanup done. Deleted ${deletedCount} notifications.`);
    } catch (error) {
      console.error('❌ Scheduled cleanup failed:', error);
    }
  }, { timezone: 'Africa/Lagos' });

  // Subscription expiry check — daily at midnight Lagos time
  cron.schedule('0 0 * * *', async () => {
    console.log('\n🔔 RUNNING SCHEDULED SUBSCRIPTION CHECK');
    try {
      const result = await runSubscriptionCheck();
      console.log(`✅ Subscription check done. Suspended ${result.suspended} businesses.`);
    } catch (error) {
      console.error('❌ Subscription check failed:', error);
    }
  }, { timezone: 'Africa/Lagos' });

  console.log('✅ Cron jobs scheduled:');
  console.log('   - Notification cleanup : Daily at 2:00 AM (Africa/Lagos)');
  console.log('   - Subscription check   : Daily at midnight (Africa/Lagos)');

  // Uncomment to run a subscription check 5 s after server start:
  /*
  setTimeout(async () => {
    console.log('\n🔔 RUNNING STARTUP SUBSCRIPTION CHECK');
    try {
      const result = await runSubscriptionCheck();
      console.log(`✅ Startup check done. Suspended ${result.suspended} businesses.`);
    } catch (error) {
      console.error('❌ Startup subscription check failed:', error);
    }
  }, 5000);
  */
}

// ============================================================================
// START SERVER
// ============================================================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 MyPadiFood Multi-Tenant Server');
  console.log('='.repeat(60));
  console.log(`📡 Port      : ${PORT}`);
  console.log(`🌍 Env       : ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API       : http://localhost:${PORT}/api`);
  console.log(`❤️  Health   : http://localhost:${PORT}/health`);
  console.log(`🌐 Prod domain: https://${PROD_DOMAIN}`);
  console.log(`🔔 Sub checks: Enabled`);
  console.log('='.repeat(60) + '\n');
});

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================
async function shutdown(signal) {
  console.log(`\n👋 ${signal} received — shutting down gracefully...`);
  const prisma = require('./lib/prisma');
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));