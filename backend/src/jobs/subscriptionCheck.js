// backend/src/jobs/subscriptionCheck.js
const { checkAndSuspendExpired } = require('../controllers/subscriptionController');

/**
 * Daily cron job to check and suspend expired subscriptions
 * This should be called by node-cron in server.js
 */
async function runSubscriptionCheck() {
  console.log('='.repeat(60));
  console.log('🔄 SUBSCRIPTION CHECK JOB STARTED');
  console.log('='.repeat(60));
  
  try {
    const result = await checkAndSuspendExpired();
    
    console.log('='.repeat(60));
    console.log('✅ SUBSCRIPTION CHECK JOB COMPLETED');
    console.log(`   - Businesses suspended: ${result.suspended}`);
    
    if (result.businesses.length > 0) {
      console.log('   - Suspended businesses:');
      result.businesses.forEach(b => {
        console.log(`     • ${b.name} (${b.slug}) - ${b.reason}`);
      });
    }
    
    console.log('='.repeat(60));
    
    return result;
  } catch (error) {
    console.error('='.repeat(60));
    console.error('❌ SUBSCRIPTION CHECK JOB FAILED');
    console.error(error);
    console.error('='.repeat(60));
    
    // Don't throw - we don't want to crash the server
    // Instead, log the error and continue
    return { error: error.message, suspended: 0, businesses: [] };
  }
}

module.exports = { runSubscriptionCheck };