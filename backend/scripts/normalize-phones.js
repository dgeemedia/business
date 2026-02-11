// ============================================================================
// DATABASE MIGRATION SCRIPT - NORMALIZE PHONE NUMBERS
// Run this once to fix existing data
// backend/scripts/normalize-phones.js
// ============================================================================

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper function to normalize phone numbers
function normalizePhone(phone) {
  if (!phone) return '';
  return phone.replace(/\D/g, ''); // Remove all non-digit characters
}

async function normalizePhoneNumbers() {
  console.log('🔧 Starting phone number normalization...\n');
  
  try {
    // Get all orders
    const orders = await prisma.order.findMany({
      select: {
        id: true,
        phone: true,
        customerName: true
      }
    });
    
    console.log(`📦 Found ${orders.length} orders to check\n`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const order of orders) {
      const normalizedPhone = normalizePhone(order.phone);
      
      // Check if phone needs normalization
      if (order.phone !== normalizedPhone) {
        console.log(`Updating order #${order.id}:`);
        console.log(`  Customer: ${order.customerName}`);
        console.log(`  Old phone: ${order.phone}`);
        console.log(`  New phone: ${normalizedPhone}`);
        
        await prisma.order.update({
          where: { id: order.id },
          data: { phone: normalizedPhone }
        });
        
        updatedCount++;
        console.log(`  ✅ Updated\n`);
      } else {
        skippedCount++;
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 SUMMARY:');
    console.log(`   Total orders: ${orders.length}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Already normalized: ${skippedCount}`);
    console.log('='.repeat(50));
    
    // Also check product ratings
    console.log('\n🔍 Checking product ratings...\n');
    
    const ratings = await prisma.productRating.findMany({
      select: {
        id: true,
        phone: true,
        productId: true
      }
    });
    
    console.log(`⭐ Found ${ratings.length} ratings to check\n`);
    
    let ratingUpdatedCount = 0;
    let ratingSkippedCount = 0;
    
    for (const rating of ratings) {
      const normalizedPhone = normalizePhone(rating.phone);
      
      if (rating.phone !== normalizedPhone) {
        console.log(`Updating rating #${rating.id}:`);
        console.log(`  Product ID: ${rating.productId}`);
        console.log(`  Old phone: ${rating.phone}`);
        console.log(`  New phone: ${normalizedPhone}`);
        
        // Check if normalized phone already has a rating for this product
        const existingRating = await prisma.productRating.findUnique({
          where: {
            productId_phone: {
              productId: rating.productId,
              phone: normalizedPhone
            }
          }
        });
        
        if (existingRating && existingRating.id !== rating.id) {
          console.log(`  ⚠️  Duplicate found - deleting old rating`);
          await prisma.productRating.delete({
            where: { id: rating.id }
          });
        } else {
          await prisma.productRating.update({
            where: { id: rating.id },
            data: { phone: normalizedPhone }
          });
          console.log(`  ✅ Updated\n`);
        }
        
        ratingUpdatedCount++;
      } else {
        ratingSkippedCount++;
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 RATINGS SUMMARY:');
    console.log(`   Total ratings: ${ratings.length}`);
    console.log(`   Updated: ${ratingUpdatedCount}`);
    console.log(`   Already normalized: ${ratingSkippedCount}`);
    console.log('='.repeat(50));
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
normalizePhoneNumbers()
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });