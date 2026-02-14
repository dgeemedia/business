// backend/src/server.js - UPDATED WITH SUBSCRIPTION MANAGEMENT
require('dotenv').config();
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
// MIDDLEWARE
// ============================================================================
app.use(cors());
app.use(express.json());

// 🔥 CRITICAL: Extract subdomain/business context BEFORE routes
// This must come before all other routes
app.use(extractSubdomain);

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ============================================================================
// ROUTES
// ============================================================================

app.use('/api/stats', require('./routes/stats'))
// Authentication routes
app.use('/api/auth', require('./routes/auth'));

// Business routes (NEW - for multi-tenant management)
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
      result
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
    environment: process.env.NODE_ENV || 'development'
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
      'Auto-suspension system'
    ]
  });
});

// ============================================================================
// ERROR HANDLER
// ============================================================================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  
  // Don't expose internal errors in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Something went wrong' 
    : err.message;
  
  res.status(err.statusCode || 500).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// ============================================================================
// CRON JOBS
// ============================================================================

if (process.env.NODE_ENV !== 'test') {
  // Schedule notification cleanup to run every day at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('⏰ Running scheduled notification cleanup...');
    try {
      const deletedCount = await cleanupOldNotifications(90);
      console.log(`✅ Scheduled cleanup completed. Deleted ${deletedCount} notifications.`);
    } catch (error) {
      console.error('❌ Scheduled cleanup failed:', error);
    }
  }, {
    timezone: "Africa/Lagos"
  });

  // ✅ NEW: Schedule subscription check to run every day at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('\n🔔 RUNNING SCHEDULED SUBSCRIPTION CHECK');
    try {
      const result = await runSubscriptionCheck();
      console.log(`✅ Subscription check completed. Suspended ${result.suspended} businesses.`);
    } catch (error) {
      console.error('❌ Subscription check failed:', error);
    }
  }, {
    timezone: "Africa/Lagos"
  });

  console.log('✅ Cron jobs scheduled:');
  console.log('   - Notification cleanup: Daily at 2:00 AM');
  console.log('   - Subscription check: Daily at midnight');

  // Optional: Run subscription check on server startup (5 seconds after start)
  // Uncomment if you want to catch expired subscriptions immediately after deployment
  /*
  setTimeout(async () => {
    console.log('\n🔔 RUNNING STARTUP SUBSCRIPTION CHECK');
    try {
      const result = await runSubscriptionCheck();
      console.log(`✅ Startup check completed. Suspended ${result.suspended} businesses.`);
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
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
  console.log(`❤️  Health: http://localhost:${PORT}/health`);
  console.log(`🔔 Subscription checks: Enabled`);
  console.log('='.repeat(60) + '\n');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('👋 SIGTERM received, shutting down gracefully...');
  const prisma = require('./lib/prisma');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('👋 SIGINT received, shutting down gracefully...');
  const prisma = require('./lib/prisma');
  await prisma.$disconnect();
  process.exit(0);
});