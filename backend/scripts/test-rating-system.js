// ============================================================================
// TEST SCRIPT - VERIFY RATING SYSTEM
// backend/scripts/test-rating-system.js
// ============================================================================

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testRatingSystem() {
  console.log('🧪 Testing Rating System...\n');
  
  try {
    // 1. Check existing orders
    console.log('📦 STEP 1: Checking existing orders...\n');
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log(`Found ${orders.length} orders\n`);
    
    orders.forEach((order, index) => {
      console.log(`Order ${index + 1}:`);
      console.log(`  ID: ${order.id}`);
      console.log(`  Customer: ${order.customerName}`);
      console.log(`  Phone: ${order.phone}`);
      console.log(`  Status: ${order.status}`);
      console.log(`  Payment: ${order.paymentStatus}`);
      console.log(`  Products: ${order.items.map(i => i.product.name).join(', ')}`);
      
      // Check if this order qualifies for rating
      const canRate = order.paymentStatus === 'CONFIRMED' && order.status === 'DELIVERED';
      console.log(`  Can Rate: ${canRate ? '✅ YES' : '❌ NO'}`);
      
      if (!canRate) {
        if (order.paymentStatus !== 'CONFIRMED') {
          console.log(`    Reason: Payment not confirmed (${order.paymentStatus})`);
        }
        if (order.status !== 'DELIVERED') {
          console.log(`    Reason: Not delivered (${order.status})`);
        }
      }
      console.log('');
    });
    
    // 2. Find orders that can be rated
    console.log('\n' + '='.repeat(60));
    console.log('🎯 STEP 2: Finding orders eligible for rating...\n');
    
    const eligibleOrders = await prisma.order.findMany({
      where: {
        paymentStatus: 'CONFIRMED',
        status: 'DELIVERED'
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });
    
    console.log(`Found ${eligibleOrders.length} eligible orders\n`);
    
    if (eligibleOrders.length === 0) {
      console.log('⚠️  NO ELIGIBLE ORDERS FOUND');
      console.log('\nTo test the rating system, you need to:');
      console.log('1. Create an order (or use existing order)');
      console.log('2. Confirm payment: POST /api/orders/{id}/confirm-payment');
      console.log('3. Update status to DELIVERED: PATCH /api/orders/{id}/status');
      console.log('\nExample commands:');
      console.log('---');
      
      if (orders.length > 0) {
        const testOrder = orders[0];
        console.log(`\n# Update order ${testOrder.id}:`);
        console.log(`curl -X POST http://localhost:5000/api/orders/${testOrder.id}/confirm-payment \\`);
        console.log(`  -H "Authorization: Bearer YOUR_TOKEN" \\`);
        console.log(`  -H "Content-Type: application/json" \\`);
        console.log(`  -d '{"paymentMethod":"CASH"}'`);
        console.log('');
        console.log(`curl -X PATCH http://localhost:5000/api/orders/${testOrder.id}/status \\`);
        console.log(`  -H "Authorization: Bearer YOUR_TOKEN" \\`);
        console.log(`  -H "Content-Type: application/json" \\`);
        console.log(`  -d '{"status":"DELIVERED"}'`);
      }
    } else {
      eligibleOrders.forEach((order, index) => {
        console.log(`Eligible Order ${index + 1}:`);
        console.log(`  ID: ${order.id}`);
        console.log(`  Customer: ${order.customerName}`);
        console.log(`  Phone: ${order.phone}`);
        console.log(`  Products:`);
        order.items.forEach(item => {
          console.log(`    - ${item.product.name} (ID: ${item.product.id})`);
        });
        console.log('');
        
        // Show how to test rating for this order
        if (order.items.length > 0) {
          const firstProduct = order.items[0].product;
          console.log(`  📝 Test rating command:`);
          console.log(`  curl -X POST http://localhost:5000/api/products/${firstProduct.id}/ratings \\`);
          console.log(`    -H "Content-Type: application/json" \\`);
          console.log(`    -d '{"phone":"${order.phone}","rating":5,"comment":"Great product!"}'`);
          console.log('');
        }
      });
    }
    
    // 3. Check existing ratings
    console.log('='.repeat(60));
    console.log('⭐ STEP 3: Checking existing ratings...\n');
    
    const ratings = await prisma.productRating.findMany({
      include: {
        product: {
          select: { name: true }
        }
      }
    });
    
    console.log(`Found ${ratings.length} ratings\n`);
    
    if (ratings.length > 0) {
      ratings.forEach((rating, index) => {
        console.log(`Rating ${index + 1}:`);
        console.log(`  Product: ${rating.product.name}`);
        console.log(`  Phone: ***${rating.phone.slice(-4)}`);
        console.log(`  Rating: ${'⭐'.repeat(rating.rating)}`);
        console.log(`  Comment: ${rating.comment || 'No comment'}`);
        console.log('');
      });
    }
    
    // 4. Summary
    console.log('='.repeat(60));
    console.log('📊 SUMMARY:\n');
    console.log(`  Total orders: ${orders.length}`);
    console.log(`  Orders with CONFIRMED payment: ${orders.filter(o => o.paymentStatus === 'CONFIRMED').length}`);
    console.log(`  Orders with DELIVERED status: ${orders.filter(o => o.status === 'DELIVERED').length}`);
    console.log(`  Eligible for rating: ${eligibleOrders.length}`);
    console.log(`  Existing ratings: ${ratings.length}`);
    console.log('='.repeat(60));
    
    // 5. Next steps
    console.log('\n✅ RATING SYSTEM STATUS:\n');
    
    if (eligibleOrders.length > 0) {
      console.log('🟢 System is READY for testing!');
      console.log('\nYou can test by:');
      console.log('1. Using the frontend to rate a product');
      console.log('2. Using the curl commands shown above');
      console.log('3. Check backend logs for detailed debugging');
    } else {
      console.log('🟡 System is configured but needs eligible orders');
      console.log('\nTo make an order eligible:');
      console.log('1. Go to dashboard → Orders');
      console.log('2. Select an order');
      console.log('3. Click "Confirm Payment"');
      console.log('4. Update status to "DELIVERED"');
      console.log('5. Try rating from frontend');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testRatingSystem()
  .then(() => {
    console.log('\n✅ Test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });