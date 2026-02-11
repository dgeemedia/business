// ============================================================================
// VERIFY RATINGS IN API RESPONSE
// backend/scripts/verify-ratings-api.js
// ============================================================================

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyRatingsAPI() {
  console.log('🔍 Verifying Ratings in API Response...\n');
  
  try {
    // 1. Check products with their ratings
    console.log('📦 Fetching products with ratings...\n');
    
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        ratings: {
          select: {
            rating: true
          }
        }
      }
    });
    
    console.log(`Found ${products.length} products\n`);
    
    products.forEach(product => {
      const ratings = product.ratings || [];
      const totalRatings = ratings.length;
      const averageRating = totalRatings > 0 
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings 
        : 0;
      
      console.log(`Product: ${product.name}`);
      console.log(`  ID: ${product.id}`);
      console.log(`  Total Ratings: ${totalRatings}`);
      console.log(`  Average Rating: ${averageRating.toFixed(1)} ⭐`);
      console.log(`  Stock: ${product.stock}`);
      
      if (totalRatings > 0) {
        console.log(`  Individual Ratings: ${ratings.map(r => r.rating).join(', ')}`);
      }
      console.log('');
    });
    
    // 2. Check actual API response format
    console.log('='.repeat(60));
    console.log('📡 Simulating API Response Format:\n');
    
    const productsWithRatings = products.map(product => {
      const ratings = product.ratings || [];
      const totalRatings = ratings.length;
      const averageRating = totalRatings > 0 
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings 
        : 0;
      
      const { ratings: _, ...productData } = product;
      
      return {
        ...productData,
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings
      };
    });
    
    console.log('Sample product with ratings:');
    if (productsWithRatings.length > 0) {
      const sample = productsWithRatings.find(p => p.totalRatings > 0) || productsWithRatings[0];
      console.log(JSON.stringify(sample, null, 2));
    }
    
    // 3. Test actual products endpoint
    console.log('\n' + '='.repeat(60));
    console.log('🌐 Testing actual API endpoint...\n');
    
    try {
      const response = await fetch('http://localhost:5000/api/products');
      const apiProducts = await response.json();
      
      console.log(`✅ API Response received: ${apiProducts.length} products`);
      
      const productWithRating = apiProducts.find(p => p.totalRatings > 0);
      if (productWithRating) {
        console.log('\n✅ Found product with ratings in API response:');
        console.log(`   Name: ${productWithRating.name}`);
        console.log(`   Average Rating: ${productWithRating.averageRating}`);
        console.log(`   Total Ratings: ${productWithRating.totalRatings}`);
      } else {
        console.log('\n⚠️  No products with ratings found in API response');
        console.log('   This might be normal if no ratings exist yet');
      }
      
      // Show structure of first product
      if (apiProducts.length > 0) {
        console.log('\n📋 First product structure:');
        console.log(JSON.stringify(apiProducts[0], null, 2));
      }
      
    } catch (error) {
      console.error('❌ Failed to fetch from API:', error.message);
      console.log('⚠️  Make sure your backend server is running on port 5000');
    }
    
    // 4. Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY:\n');
    
    const productsWithRatingsCount = productsWithRatings.filter(p => p.totalRatings > 0).length;
    const totalRatingsCount = productsWithRatings.reduce((sum, p) => sum + p.totalRatings, 0);
    
    console.log(`  Total Products: ${products.length}`);
    console.log(`  Products with Ratings: ${productsWithRatingsCount}`);
    console.log(`  Total Ratings: ${totalRatingsCount}`);
    console.log('='.repeat(60));
    
    if (productsWithRatingsCount === 0) {
      console.log('\n⚠️  No ratings found. Submit a rating through the frontend to test!');
    } else {
      console.log('\n✅ Ratings are present in database and should appear in API!');
    }
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifyRatingsAPI()
  .then(() => {
    console.log('\n✅ Verification completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });